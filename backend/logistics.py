"""
Logistics routing API on the road network built by data-pipeline/build_road_graph.py.

Pilot district: Dima Hasao (Assam). Network files live in
backend/data/networks/dima_hasao/ (copied from data-pipeline/data/processed/).

Endpoints (mounted under /api/logistics):
  GET  /network   road segments as GeoJSON (simplified for display), with edge_id
  GET  /places    health facilities + villages to pick as origin / destination
  POST /route     fastest route origin -> destination; with blocked_edge_ids it
                  compares normal vs current and reports the delay or "unreachable"
  POST /impact    which facilities / how many people become unreachable from the
                  district HQ when the given roads are blocked (bottleneck analysis)

Blockages are passed in by the caller for now (stateless). Travel times use the
per-category speed ASSUMPTIONS from build_road_graph.py, not measured speeds.
"""
import json
import os
from functools import lru_cache
from typing import List, Optional

import networkx as nx
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pyproj import Transformer
from shapely.geometry import mapping, shape

NETWORK_DIR = os.path.join(os.path.dirname(__file__), "data", "networks", "dima_hasao")
HQ = {"name": "Haflong (district HQ)", "lat": 25.1706, "lon": 93.0167}
_to_utm = Transformer.from_crs(4326, 32646, always_xy=True)

router = APIRouter(prefix="/api/logistics", tags=["logistics"])


# ---------- loading (once, at import) ----------

def _load():
    g = nx.read_graphml(os.path.join(NETWORK_DIR, "network.graphml"))
    g = nx.relabel_nodes(g, {n: tuple(float(v) for v in n.split(",")) for n in g.nodes})
    for _, _, d in g.edges(data=True):
        d["travel_min"] = float(d["travel_min"])
        d["length_m"] = float(d["length_m"])
        d["edge_id"] = int(d["edge_id"])
    main = max(nx.connected_components(g), key=len)
    with open(os.path.join(NETWORK_DIR, "roads_network.geojson")) as f:
        roads = json.load(f)["features"]
    return g, main, roads


GRAPH, MAIN_NODES, ROADS = _load()
_MAIN_LIST = list(MAIN_NODES)
_MAIN_XY = np.array(_MAIN_LIST)
EDGE_ENDS = {d["edge_id"]: (u, v) for u, v, d in GRAPH.edges(data=True)}


def _simplified_geom(edge_id: int) -> dict:
    geom = shape(ROADS[edge_id]["geometry"]).simplify(0.00015, preserve_topology=True)
    gj = mapping(geom)
    gj["coordinates"] = [[round(x, 5), round(y, 5)] for x, y in gj["coordinates"]]
    return gj


@lru_cache(maxsize=1)
def _network_geojson() -> dict:
    feats = []
    for edge_id, feat in enumerate(ROADS):
        p = feat["properties"]
        feats.append({
            "type": "Feature",
            "geometry": _simplified_geom(edge_id),
            "properties": {"edge_id": edge_id, "category": p["category"], "road_name": p["road_name"],
                           "length_m": p["length_m"], "travel_min": p["travel_min"],
                           "in_main_network": EDGE_ENDS.get(edge_id, (None,))[0] in MAIN_NODES},
        })
    return {"type": "FeatureCollection", "features": feats}


def _nearest_main_node(lat: float, lon: float):
    x, y = _to_utm.transform(lon, lat)
    d2 = ((_MAIN_XY[:, 0] - x) ** 2 + (_MAIN_XY[:, 1] - y) ** 2)
    i = int(d2.argmin())
    return _MAIN_LIST[i], float(np.sqrt(d2[i]))


def _graph_without(blocked: set):
    if not blocked:
        return GRAPH
    return nx.subgraph_view(GRAPH, filter_edge=lambda u, v: GRAPH[u][v]["edge_id"] not in blocked)


def _path_summary(g, path) -> dict:
    edges = [g[a][b]["edge_id"] for a, b in zip(path, path[1:])]
    return {
        "minutes": round(sum(GRAPH[a][b]["travel_min"] for a, b in zip(path, path[1:])), 1),
        "km": round(sum(GRAPH[a][b]["length_m"] for a, b in zip(path, path[1:])) / 1000, 1),
        "edge_ids": edges,
        "geometry": {"type": "MultiLineString", "coordinates": [_simplified_geom(e)["coordinates"] for e in edges]},
    }


# ---------- API models ----------

class Point(BaseModel):
    lat: float
    lon: float


class RouteRequest(BaseModel):
    origin: Point
    destination: Point
    blocked_edge_ids: List[int] = []


class ImpactRequest(BaseModel):
    blocked_edge_ids: List[int]
    origin: Optional[Point] = None  # defaults to district HQ


# ---------- endpoints ----------

@router.get("/network")
def network():
    with open(os.path.join(NETWORK_DIR, "network_report.json")) as f:
        report = json.load(f)
    return {"district": "Dima Hasao, Assam", "hq": HQ, "report": report, "roads": _network_geojson()}


@router.get("/places")
def places():
    with open(os.path.join(NETWORK_DIR, "facilities.geojson")) as f:
        fac = json.load(f)["features"]
    with open(os.path.join(NETWORK_DIR, "habitations.geojson")) as f:
        hab = json.load(f)["features"]
    return {
        "hq": HQ,
        "facilities": [{"id": p["properties"]["FACILITY_I"], "name": p["properties"]["FAC_DESC"],
                        "category": p["properties"]["FAC_CATEGO"],
                        "lat": round(p["geometry"]["coordinates"][1], 5), "lon": round(p["geometry"]["coordinates"][0], 5)}
                       for p in fac],
        "villages": sorted([{"id": p["properties"]["HAB_ID"], "name": p["properties"]["HAB_NAME"],
                             "population": p["properties"]["TOT_POPULA"],
                             "lat": round(p["geometry"]["coordinates"][1], 5), "lon": round(p["geometry"]["coordinates"][0], 5)}
                            for p in hab], key=lambda v: -v["population"]),
    }


@router.post("/route")
def route(req: RouteRequest):
    o, o_snap = _nearest_main_node(req.origin.lat, req.origin.lon)
    d, d_snap = _nearest_main_node(req.destination.lat, req.destination.lon)
    if o == d:
        raise HTTPException(status_code=422, detail="Origin and destination snap to the same point on the road network")
    normal_path = nx.shortest_path(GRAPH, o, d, weight="travel_min")
    normal = _path_summary(GRAPH, normal_path)
    blocked = set(req.blocked_edge_ids)
    result = {"normal": normal, "snap_m": {"origin": round(o_snap), "destination": round(d_snap)}}
    if not blocked:
        return {**result, "status": "ok", "current": normal, "delay_min": 0}
    g = _graph_without(blocked)
    try:
        cur = _path_summary(g, nx.shortest_path(g, o, d, weight="travel_min"))
    except nx.NetworkXNoPath:
        return {**result, "status": "unreachable", "current": None, "delay_min": None}
    delay = round(cur["minutes"] - normal["minutes"], 1)
    return {**result, "status": "rerouted" if delay > 0.05 else "ok", "current": cur, "delay_min": max(delay, 0)}


@router.post("/impact")
def impact(req: ImpactRequest):
    origin = req.origin or Point(lat=HQ["lat"], lon=HQ["lon"])
    o, _ = _nearest_main_node(origin.lat, origin.lon)
    before = nx.single_source_dijkstra_path_length(GRAPH, o, weight="travel_min")
    after = nx.single_source_dijkstra_path_length(_graph_without(set(req.blocked_edge_ids)), o, weight="travel_min")
    p = places()
    cut_fac, slowed_fac = [], []
    for f in p["facilities"]:
        n, _ = _nearest_main_node(f["lat"], f["lon"])
        if n in before and n not in after:
            cut_fac.append(f)
        elif n in before and after.get(n, 0) > before[n] + 0.05:
            slowed_fac.append({**f, "extra_min": round(after[n] - before[n], 1)})
    cut_pop, cut_villages = 0, 0
    for v in p["villages"]:
        n, _ = _nearest_main_node(v["lat"], v["lon"])
        if n in before and n not in after:
            cut_pop += v["population"]; cut_villages += 1
    return {
        "origin": origin,
        "facilities_cut_off": cut_fac,
        "facilities_delayed": sorted(slowed_fac, key=lambda x: -x["extra_min"]),
        "villages_cut_off": cut_villages,
        "population_cut_off": cut_pop,
    }
