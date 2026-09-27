"""
Build a routable road network for one district from PMGSY GeoSadak road data.

The problem: GeoSadak's road lines (Road_DRRP) were traced by engineers on
satellite imagery and don't join at junctions. For Dima Hasao the raw data is
443 separate fragments; the largest has 5 junctions. You can't route on that.

What this does:
  1. Snaps each dangling road end to the nearest other road within
     --tolerance metres, adding a short "connector" segment (flagged, so every
     one can be reviewed).
  2. Splits all lines where they cross, creating junctions.
     ASSUMPTION: crossings are at-grade junctions. True for almost all rural
     roads; wrong for flyovers. Review connectors.geojson + a map if unsure.
  3. Builds a graph weighted by estimated travel time per road category.

Outputs (in --out):
  roads_network.geojson   every routable segment, with category + travel time
  connectors.geojson      the synthetic joins, for visual QA
  habitations.geojson     villages in the district, with population
  facilities.geojson      schools, markets, medical, transport/admin points
  network.graphml         the graph (networkx), for routing
  network_report.json     before/after connectivity numbers

Usage:
  python build_road_graph.py --state Assam --district "N.C.Hills" --tolerance 30
"""
import argparse
import json
import os
import warnings

import geopandas as gpd
import networkx as nx
import pandas as pd
from shapely.geometry import LineString, Point
from shapely.ops import nearest_points, unary_union
from shapely.strtree import STRtree

warnings.filterwarnings("ignore", category=RuntimeWarning)

RAW = os.path.join(os.path.dirname(__file__), "data", "raw", "geosadak")
METRIC_CRS = 32646  # UTM zone 46N: metres, fits all of North East India

# Assumed average speeds (km/h) on hill roads, by GeoSadak RoadCategory.
# These are planning assumptions, not measurements: tune them with real
# trip times from the vehicle-tracking data once it exists.
SPEED_KMH = {
    "NH": 35, "SH": 30, "MDR": 25, "RR(ODR)": 20, "RR(VR)": 15,
    "RR(TRACK)": 8, "BR": 15, "OT": 15, "connector": 5,
}


def load_layer(layer: str, state: str, district_id: int) -> gpd.GeoDataFrame:
    gdf = gpd.read_file(f"zip://{RAW}/{layer}/{state}.zip")
    return gdf[gdf.DISTRICT_I == district_id].copy()


def district_id_for(state: str, district: str) -> int:
    master = pd.read_excel(os.path.join(RAW, "MasterData.xls"))
    row = master[(master.STATE_NAME.str.lower() == state.lower()) & (master.DISTRICT_NAME.str.lower() == district.lower())]
    if row.empty:
        raise SystemExit(f"District '{district}' not found in {state}. Check MasterData.xls for the exact name.")
    return int(row.DISTRICT_ID.iloc[0])


def endpoint_graph(lines) -> nx.Graph:
    """Graph joining only exactly-matching endpoints: shows raw connectivity."""
    g = nx.Graph()
    for line in lines:
        g.add_edge(tuple(round(c, 1) for c in line.coords[0]), tuple(round(c, 1) for c in line.coords[-1]))
    return g


def snap_connectors(lines, tolerance: float):
    """For each dangling end, connect it to the nearest *other* road within tolerance."""
    tree = STRtree(lines)
    connectors = []
    for i, line in enumerate(lines):
        for end in (Point(line.coords[0]), Point(line.coords[-1])):
            best = None
            for j in tree.query(end.buffer(tolerance)):
                if j == i:
                    continue
                d = lines[j].distance(end)
                if d <= tolerance and (best is None or d < best[0]):
                    best = (d, j)
            if best and best[0] > 0.5:  # already touching -> no connector needed
                target = nearest_points(lines[best[1]], end)[0]
                connectors.append(LineString([end, target]))
    return connectors


def connectivity(g: nx.Graph) -> dict:
    comps = sorted(nx.connected_components(g), key=len, reverse=True)
    return {
        "nodes": g.number_of_nodes(),
        "pieces": len(comps),
        "largest_piece_nodes": len(comps[0]),
        "largest_piece_pct": round(100 * len(comps[0]) / g.number_of_nodes(), 1),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--state", default="Assam")
    ap.add_argument("--district", default="N.C.Hills", help="name as in MasterData.xls (Dima Hasao = N.C.Hills)")
    ap.add_argument("--tolerance", type=float, default=30, help="max gap (m) to bridge with a connector")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "data", "processed", "dima_hasao"))
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    did = district_id_for(args.state, args.district)
    roads = load_layer("Road_DRRP", args.state, did).to_crs(METRIC_CRS).explode(index_parts=False).reset_index(drop=True)
    lines = list(roads.geometry)
    before = connectivity(endpoint_graph(lines))

    connectors = snap_connectors(lines, args.tolerance)

    # Node everything: splits at crossings and where connectors meet roads
    noded = unary_union(lines + connectors)
    segments = [g for g in getattr(noded, "geoms", [noded]) if g.length > 0]

    # Recover road attributes for each noded piece from the source line it lies on
    sources = lines + connectors
    src_cat = list(roads.RoadCatego) + ["connector"] * len(connectors)
    src_name = list(roads.RoadName.fillna("")) + [""] * len(connectors)
    src_owner = list(roads.RoadOwner.fillna("")) + [""] * len(connectors)
    tree = STRtree(sources)
    rows = []
    for seg in segments:
        k = tree.nearest(seg.interpolate(0.5, normalized=True))
        cat = src_cat[k]
        km = seg.length / 1000
        rows.append({
            "category": cat, "road_name": src_name[k], "owner": src_owner[k],
            "length_m": round(seg.length, 1),
            "travel_min": round(km / SPEED_KMH.get(cat, 15) * 60, 2),
            "geometry": seg,
        })
    net = gpd.GeoDataFrame(rows, crs=METRIC_CRS)

    g = nx.Graph()
    for idx, r in net.iterrows():
        a = tuple(round(c, 1) for c in r.geometry.coords[0])
        b = tuple(round(c, 1) for c in r.geometry.coords[-1])
        g.add_edge(a, b, edge_id=int(idx), length_m=r.length_m, travel_min=r.travel_min, category=r.category)
    after = connectivity(g)

    # How many people live near the main connected network?
    hab = load_layer("Habitation", args.state, did).to_crs(METRIC_CRS)
    fac = load_layer("Facilities", args.state, did).to_crs(METRIC_CRS)
    main_nodes = max(nx.connected_components(g), key=len)
    main_net = net[[tuple(round(c, 1) for c in geom.coords[0]) in main_nodes for geom in net.geometry]]
    main_union = main_net.union_all()
    hab["dist_to_main_network_m"] = hab.geometry.distance(main_union).round(0)
    near = hab.dist_to_main_network_m <= 1000
    pop_total = int(hab.TOT_POPULA.sum())

    report = {
        "district": args.district, "district_id": did, "state": args.state,
        "tolerance_m": args.tolerance,
        "raw_segments": len(lines),
        "connectors_added": len(connectors),
        "connector_total_m": round(sum(c.length for c in connectors), 0),
        "routable_segments": len(net),
        "total_road_km": round(net[net.category != "connector"].length_m.sum() / 1000, 1),
        "connectivity_before": before,
        "connectivity_after": after,
        "habitations": len(hab),
        "population": pop_total,
        "population_within_1km_of_main_network": int(hab[near].TOT_POPULA.sum()),
        "population_within_1km_pct": round(100 * hab[near].TOT_POPULA.sum() / max(pop_total, 1), 1),
        "facilities": fac.FAC_CATEGO.value_counts().to_dict(),
        "speed_assumptions_kmh": SPEED_KMH,
    }

    net.to_crs(4326).to_file(os.path.join(args.out, "roads_network.geojson"), driver="GeoJSON", COORDINATE_PRECISION=6)
    gpd.GeoDataFrame({"length_m": [round(c.length, 1) for c in connectors]}, geometry=connectors, crs=METRIC_CRS) \
        .to_crs(4326).to_file(os.path.join(args.out, "connectors.geojson"), driver="GeoJSON", COORDINATE_PRECISION=6)
    hab.to_crs(4326).to_file(os.path.join(args.out, "habitations.geojson"), driver="GeoJSON", COORDINATE_PRECISION=6)
    fac.to_crs(4326).to_file(os.path.join(args.out, "facilities.geojson"), driver="GeoJSON", COORDINATE_PRECISION=6)
    g_str = nx.relabel_nodes(g, {n: f"{n[0]},{n[1]}" for n in g.nodes})
    nx.write_graphml(g_str, os.path.join(args.out, "network.graphml"))
    with open(os.path.join(args.out, "network_report.json"), "w") as f:
        json.dump(report, f, indent=2)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
