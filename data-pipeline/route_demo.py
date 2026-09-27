"""
Routing demo on the network from build_road_graph.py.

1. Travel time from an origin (default: Haflong, Dima Hasao's district HQ)
   to every medical facility in the district.
2. SIMULATED disruption: blocks the single road segment most of those routes
   depend on (as a landslide would), then re-routes and reports detours and
   facilities cut off entirely. This is a demonstration scenario, not a real
   event: swap in real blocked segments from field reports / ASDMA data.

Outputs (in the network folder):
  routes_normal.geojson, routes_after_blockage.geojson, blocked_segment.geojson
  route_demo_report.json

Usage:
  python route_demo.py --origin-lat 25.1706 --origin-lon 93.0167
"""
import argparse
import json
import os
from collections import Counter

import geopandas as gpd
import networkx as nx
from shapely.geometry import LineString, Point

METRIC_CRS = 32646


def load_graph(folder):
    g = nx.read_graphml(os.path.join(folder, "network.graphml"))
    g = nx.relabel_nodes(g, {n: tuple(float(v) for v in n.split(",")) for n in g.nodes})
    for _, _, d in g.edges(data=True):
        d["travel_min"] = float(d["travel_min"])
    return g


def nearest_node(nodes, pt: Point):
    return min(nodes, key=lambda n: (n[0] - pt.x) ** 2 + (n[1] - pt.y) ** 2)


def route_all(g, origin, targets):
    times, paths = nx.single_source_dijkstra(g, origin, weight="travel_min")
    return {name: (round(times[n], 1), paths[n]) if n in times else (None, None) for name, n in targets.items()}


def to_gdf(results, label):
    rows = [{"facility": k, "minutes": t, "scenario": label, "geometry": LineString(p)}
            for k, (t, p) in results.items() if p and len(p) > 1]
    return gpd.GeoDataFrame(rows, crs=METRIC_CRS).to_crs(4326)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--network", default=os.path.join(os.path.dirname(__file__), "data", "processed", "dima_hasao"))
    ap.add_argument("--origin-lat", type=float, default=25.1706)  # Haflong
    ap.add_argument("--origin-lon", type=float, default=93.0167)
    args = ap.parse_args()

    g = load_graph(args.network)
    main_nodes = max(nx.connected_components(g), key=len)
    g_main = g.subgraph(main_nodes).copy()

    origin_pt = gpd.GeoSeries([Point(args.origin_lon, args.origin_lat)], crs=4326).to_crs(METRIC_CRS)[0]
    origin = nearest_node(g_main.nodes, origin_pt)

    fac = gpd.read_file(os.path.join(args.network, "facilities.geojson")).to_crs(METRIC_CRS)
    med = fac[fac.FAC_CATEGO == "Medical"]
    targets = {f"{r.FAC_DESC} [{r.FACILITY_I}]": nearest_node(g_main.nodes, r.geometry) for r in med.itertuples()}

    normal = route_all(g_main, origin, targets)

    # Simulated blockage: the edge shared by the most routes
    usage = Counter()
    for _, path in normal.values():
        if path:
            usage.update(tuple(sorted(e)) for e in zip(path, path[1:]))
    (u, v), n_routes = usage.most_common(1)[0]
    edge = g_main.edges[u, v]
    blocked = g_main.copy()
    blocked.remove_edge(u, v)
    after = route_all(blocked, origin, targets)

    detours, cut_off = [], []
    for name in targets:
        t0, t1 = normal[name][0], after[name][0]
        if t1 is None:
            cut_off.append(name)
        elif t1 > t0 + 0.05:
            detours.append({"facility": name, "normal_min": t0, "after_min": t1, "extra_min": round(t1 - t0, 1)})

    report = {
        "origin": {"lat": args.origin_lat, "lon": args.origin_lon, "label": "Haflong (district HQ)"},
        "medical_facilities": len(targets),
        "reachable_normally": sum(1 for t, _ in normal.values() if t is not None),
        "median_travel_min": sorted(t for t, _ in normal.values() if t is not None)[len(targets) // 2],
        "SIMULATED_blockage": {
            "note": "Demonstration scenario, not a real event",
            "category": edge["category"], "length_m": float(edge["length_m"]),
            "routes_using_it": n_routes,
        },
        "after_blockage": {
            "rerouted_with_detour": len(detours),
            "cut_off_entirely": len(cut_off),
            "worst_detours": sorted(detours, key=lambda d: -d["extra_min"])[:5],
            "cut_off": cut_off,
        },
    }

    to_gdf(normal, "normal").to_file(os.path.join(args.network, "routes_normal.geojson"), driver="GeoJSON", COORDINATE_PRECISION=6)
    to_gdf(after, "after_simulated_blockage").to_file(os.path.join(args.network, "routes_after_blockage.geojson"), driver="GeoJSON", COORDINATE_PRECISION=6)
    gpd.GeoDataFrame({"note": ["SIMULATED blockage"]}, geometry=[LineString([u, v])], crs=METRIC_CRS) \
        .to_crs(4326).to_file(os.path.join(args.network, "blocked_segment.geojson"), driver="GeoJSON", COORDINATE_PRECISION=6)
    with open(os.path.join(args.network, "route_demo_report.json"), "w") as f:
        json.dump(report, f, indent=2)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
