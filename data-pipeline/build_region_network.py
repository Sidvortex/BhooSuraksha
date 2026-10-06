"""
Build one routable road network for the whole North Eastern Region (8 states)
from PMGSY GeoSadak road data. Same method as build_road_graph.py (snap
dangling road ends within --tolerance metres, node all crossings, weight by
assumed travel time), at regional scale, so routes can cross district and
state borders.

Outputs (data/processed/ner/), compact so a backend can load them quickly:
  edges.csv.gz        edge_id, u, v, state, district_id, category, road_name, owner, length_m, travel_min
  nodes.npz           xy (UTM 46N metres) and lonlat of every junction, indexed by node id
  geom.npz            simplified road shapes (lon/lat float32) + offsets per edge, for drawing routes
  districts.json      per district: name, state, bounding box, road km, villages, population, connectivity
  villages.csv.gz     habitations with population + nearest network node
  facilities.csv.gz   facilities (Medical/Education/Agro/Transport-Admin) + nearest network node
  report.json         region-wide before/after connectivity

Usage:  python build_region_network.py [--tolerance 30]
"""
import argparse
import json
import os
import time
import warnings

import geopandas as gpd
import networkx as nx
import numpy as np
import pandas as pd
from scipy.spatial import cKDTree
from shapely import get_coordinates, line_interpolate_point, simplify
from shapely.geometry import LineString, Point
from shapely.ops import nearest_points, unary_union
from shapely.strtree import STRtree

warnings.filterwarnings("ignore")
HERE = os.path.dirname(__file__)
RAW = os.path.join(HERE, "data", "raw", "geosadak")
STATES = ["ArunachalPradesh", "Assam", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Sikkim", "Tripura"]
METRIC_CRS = 32646
SPEED_KMH = {"NH": 35, "SH": 30, "MDR": 25, "RR(ODR)": 20, "RR(VR)": 15, "RR(TRACK)": 8, "BR": 15, "OT": 15, "connector": 5}


def load(layer):
    return pd.concat([gpd.read_file(f"zip://{RAW}/{layer}/{s}.zip") for s in STATES], ignore_index=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tolerance", type=float, default=30, help="pass 1: max gap (m) for joining a dead end to a road")
    ap.add_argument("--join-distance", type=float, default=60, help="pass 2: max gap (m) for joining separate network pieces")
    ap.add_argument("--out", default=os.path.join(HERE, "data", "processed", "ner"))
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)
    t0 = time.time()

    master = pd.read_excel(os.path.join(RAW, "MasterData.xls"))
    dnames = master.drop_duplicates("DISTRICT_ID").set_index("DISTRICT_ID")[["DISTRICT_NAME", "STATE_NAME"]]

    roads = load("Road_DRRP").to_crs(METRIC_CRS).explode(index_parts=False).reset_index(drop=True)
    roads = roads[roads.geometry.length > 0].reset_index(drop=True)
    lines = list(roads.geometry)

    # Raw connectivity: roads joined only where endpoints match exactly
    raw = nx.Graph()
    for l in lines:
        raw.add_edge(tuple(np.round(l.coords[0], 1)), tuple(np.round(l.coords[-1], 1)))
    raw_pieces = nx.number_connected_components(raw)

    # 1. Snap dangling ends to the nearest other road within tolerance
    tree = STRtree(lines)
    ends = [Point(l.coords[0]) for l in lines] + [Point(l.coords[-1]) for l in lines]
    owner = list(range(len(lines))) * 2
    best = {}
    for ei, li in zip(*tree.query([e.buffer(args.tolerance) for e in ends])):
        if owner[ei] == li:
            continue
        d = lines[li].distance(ends[ei])
        if d <= args.tolerance and (ei not in best or d < best[ei][0]):
            best[ei] = (d, li)
    connectors = [LineString([ends[ei], nearest_points(lines[li], ends[ei])[0]]) for ei, (d, li) in best.items() if d > 0.5]

    # 2. Node every crossing, 3. recover attributes from the source line under each piece
    segs = [g for g in unary_union(lines + connectors).geoms if g.length > 0]
    src = STRtree(lines + connectors)
    mids = line_interpolate_point(np.array(segs, dtype=object), 0.5, normalized=True)
    k = src.nearest(mids)
    n_src = len(lines)
    cat = np.where(k < n_src, roads.RoadCatego.reindex(np.minimum(k, n_src - 1)).to_numpy(), "connector")
    col = lambda c, fill: np.where(k < n_src, roads[c].reindex(np.minimum(k, n_src - 1)).fillna(fill).to_numpy(), fill)
    state, district = col("STATE_ID", -1).astype(int), col("DISTRICT_I", -1).astype(int)
    name, own = col("RoadName", ""), col("RoadOwner", "")

    # Graph: junction coordinates -> integer node ids
    starts = np.array([s.coords[0] for s in segs]); stops = np.array([s.coords[-1] for s in segs])
    keys, inv = np.unique(np.round(np.vstack([starts, stops]), 1), axis=0, return_inverse=True)
    u, v = inv[: len(segs)], inv[len(segs):]
    # 4. Join separate pieces where two junctions nearly touch (default <= 60 m).
    #    Pass 1 only joined dead ends; this catches near-misses between roads and
    #    state-border digitising gaps (e.g. Tripura-Assam, 51 m). Wider gaps are
    #    real missing links (southern Mizoram ~7 km, Sikkim via West Bengal
    #    ~128 km) and are deliberately NOT bridged.
    parent = list(range(len(keys)))
    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]; i = parent[i]
        return i
    for a_, b_ in zip(u, v):
        ra, rb = find(a_), find(b_)
        if ra != rb: parent[ra] = rb
    kd_nodes = cKDTree(keys)
    pairs = sorted(kd_nodes.query_pairs(r=args.join_distance), key=lambda p: float(np.hypot(*(keys[p[0]] - keys[p[1]]))))
    links = []
    for a_, b_ in pairs:
        ra, rb = find(a_), find(b_)
        if ra != rb:
            parent[ra] = rb; links.append((a_, b_))
    node_district = dict(zip(np.concatenate([u, v]).tolist(), np.concatenate([district, district]).tolist()))
    node_state = dict(zip(np.concatenate([u, v]).tolist(), np.concatenate([state, state]).tolist()))
    for a_, b_ in links:
        segs.append(LineString([keys[a_], keys[b_]]))
    u = np.concatenate([u, [a_ for a_, _ in links]]).astype(int); v = np.concatenate([v, [b_ for _, b_ in links]]).astype(int)
    cat = np.concatenate([cat, ["connector"] * len(links)]); name = np.concatenate([name, [""] * len(links)]); own = np.concatenate([own, [""] * len(links)])
    district = np.concatenate([district, [node_district.get(a_, -1) for a_, _ in links]]).astype(int)
    state = np.concatenate([state, [node_state.get(a_, -1) for a_, _ in links]]).astype(int)
    join_lengths = [float(np.hypot(*(keys[a_] - keys[b_]))) for a_, b_ in links]

    length = np.array([s.length for s in segs])
    speed = np.array([SPEED_KMH.get(c, 15) for c in cat])
    minutes = length / 1000 / speed * 60

    g = nx.Graph()
    g.add_weighted_edges_from(zip(u.tolist(), v.tolist(), minutes.tolist()))
    comps = sorted(nx.connected_components(g), key=len, reverse=True)
    comp_of = np.full(len(keys), -1)
    for ci, c in enumerate(comps):
        comp_of[list(c)] = ci

    lonlat = gpd.GeoSeries(gpd.points_from_xy(keys[:, 0], keys[:, 1]), crs=METRIC_CRS).to_crs(4326)
    lonlat = np.column_stack([lonlat.x, lonlat.y])
    np.savez_compressed(os.path.join(args.out, "nodes.npz"), xy=keys, lonlat=lonlat.astype(np.float32))

    # Simplified shapes for drawing (15 m), stored as one packed array
    simp = gpd.GeoSeries(simplify(np.array(segs, dtype=object), 15), crs=METRIC_CRS).to_crs(4326)
    coords, offsets = [], [0]
    for geom in simp:
        c = get_coordinates(geom).astype(np.float32)
        coords.append(c); offsets.append(offsets[-1] + len(c))
    np.savez_compressed(os.path.join(args.out, "geom.npz"), coords=np.vstack(coords), offsets=np.array(offsets, dtype=np.int64))

    edges = pd.DataFrame({"edge_id": np.arange(len(segs)), "u": u, "v": v, "state": state, "district_id": district,
                          "category": cat, "road_name": name, "owner": own,
                          "length_m": length.round(1), "travel_min": minutes.round(2)})
    edges.to_csv(os.path.join(args.out, "edges.csv.gz"), index=False)

    # Villages and facilities, snapped to their nearest junction
    kd = cKDTree(keys)
    main_nodes = comp_of == 0

    def places(layer, cols):
        p = load(layer).to_crs(METRIC_CRS)
        d, n = kd.query(np.column_stack([p.geometry.x, p.geometry.y]))
        ll = p.to_crs(4326)
        out = p[cols].copy()
        out["lon"], out["lat"] = ll.geometry.x.round(5), ll.geometry.y.round(5)
        out["node"], out["dist_m"] = n, d.round(0)
        return out

    vil = places("Habitation", ["HAB_ID", "HAB_NAME", "TOT_POPULA", "DISTRICT_I"]).rename(
        columns={"HAB_ID": "id", "HAB_NAME": "name", "TOT_POPULA": "population", "DISTRICT_I": "district_id"})
    fac = places("Facilities", ["FACILITY_I", "FAC_DESC", "FAC_CATEGO", "DISTRICT_I"]).rename(
        columns={"FACILITY_I": "id", "FAC_DESC": "name", "FAC_CATEGO": "category", "DISTRICT_I": "district_id"})
    vil.to_csv(os.path.join(args.out, "villages.csv.gz"), index=False)
    fac.to_csv(os.path.join(args.out, "facilities.csv.gz"), index=False)

    served = (vil.dist_m <= 1000) & main_nodes[vil.node.to_numpy()]
    districts = []
    for did, grp in edges[edges.district_id >= 0].groupby("district_id"):
        pts = lonlat[np.concatenate([grp.u.to_numpy(), grp.v.to_numpy()])]
        dv = vil[vil.district_id == did]
        nm = dnames.loc[did] if did in dnames.index else None
        districts.append({
            "district_id": int(did),
            "name": nm.DISTRICT_NAME if nm is not None else f"District {did}",
            "state": nm.STATE_NAME if nm is not None else "",
            "bbox": [round(float(x), 4) for x in (*pts.min(axis=0), *pts.max(axis=0))],
            "road_km": round(grp.length_m.sum() / 1000, 1),
            "segments": int(len(grp)),
            "villages": int(len(dv)),
            "population": int(dv.population.sum()),
            "population_on_main_network_pct": round(100 * dv[served.loc[dv.index]].population.sum() / max(dv.population.sum(), 1), 1),
        })
    with open(os.path.join(args.out, "districts.json"), "w") as f:
        json.dump(sorted(districts, key=lambda d: (d["state"], d["name"])), f)

    report = {
        "states": STATES, "tolerance_m": args.tolerance, "raw_segments": len(lines), "raw_pieces": raw_pieces,
        "connectors_added": len(connectors),
        "piece_joins_added": len(links), "piece_join_max_m": round(max(join_lengths), 1) if join_lengths else 0, "routable_segments": len(segs), "junctions": len(keys),
        "pieces_after": len(comps), "largest_network_pct": round(100 * len(comps[0]) / len(keys), 1),
        "road_km": round(length[cat != "connector"].sum() / 1000, 0),
        "villages": len(vil), "population": int(vil.population.sum()),
        "population_within_1km_of_main_network_pct": round(100 * vil[served].population.sum() / vil.population.sum(), 1),
        "districts": len(districts), "build_seconds": round(time.time() - t0, 1), "speed_assumptions_kmh": SPEED_KMH,
    }
    with open(os.path.join(args.out, "report.json"), "w") as f:
        json.dump(report, f, indent=2)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
