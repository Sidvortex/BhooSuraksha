"""
Builds the dashboard's "monitored zones" list from real data instead of mock
arrays: the 17 NER data points used to train the model, each scored with its
latest known rainfall/slope readings through the actual trained model.

Results are cached in memory after first computation (the underlying CSVs
don't change at runtime).
"""
import os
from collections import defaultdict

import pandas as pd

from model import predict, risk_level_from_probability

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
TRAINING_PATH = os.path.join(DATA_DIR, "training_dataset.csv")
ELEVATION_PATH = os.path.join(DATA_DIR, "elevation_grid.csv")

# Rough geographic centroids for the 8 North Eastern states, used only to label
# each monitoring point with its nearest state. This is a coarse nearest-centroid
# approximation, not an authoritative administrative boundary lookup.
STATE_CENTROIDS = {
    "Sikkim": (27.5, 88.5),
    "Arunachal Pradesh": (28.2, 94.7),
    "Assam": (26.2, 92.9),
    "Nagaland": (26.1, 94.5),
    "Manipur": (24.8, 93.9),
    "Meghalaya": (25.5, 91.3),
    "Tripura": (23.9, 91.5),
    "Mizoram": (23.2, 92.9),
}

ALERT_SEVERITY = {"CRITICAL": "CRITICAL", "VERY_HIGH": "HIGH", "HIGH": "WARNING"}

_zones_cache = None


def _nearest_state(lat: float, lon: float) -> str:
    return min(
        STATE_CENTROIDS,
        key=lambda s: (STATE_CENTROIDS[s][0] - lat) ** 2 + (STATE_CENTROIDS[s][1] - lon) ** 2,
    )


def _nearest_elevation(lat: float, lon: float, elev_df: pd.DataFrame) -> float:
    dist = ((elev_df["lat"] - lat) ** 2 + (elev_df["lon"] - lon) ** 2) ** 0.5
    return float(elev_df.loc[dist.idxmin(), "elevation_m"])


def _build_zones() -> list[dict]:
    df = pd.read_csv(TRAINING_PATH)
    elev_df = pd.read_csv(ELEVATION_PATH)
    latest = df.sort_values("date").groupby(["lat", "lon"], as_index=False).tail(1)

    zones = []
    for i, row in enumerate(latest.itertuples(), start=1):
        proba, confidence, _ = predict(
            rain_1d=row.rain_1d,
            rain_3d_sum=row.rain_3d_sum,
            rain_7d_sum=row.rain_7d_sum,
            rain_30d_sum=row.rain_30d_sum,
            slope_deg=row.slope_deg,
        )
        risk_level = risk_level_from_probability(proba)
        state = _nearest_state(row.lat, row.lon)

        zones.append({
            "id": f"zone-{i}",
            "name": f"Monitoring Point {i}",
            "district": state,
            "state": state,
            "latitude": row.lat,
            "longitude": row.lon,
            "risk_probability": round(proba, 3),
            "risk_level": risk_level,
            "confidence": round(confidence, 3),
            "parameters": {
                "rainfall_1h": 0.0,
                "rainfall_24h": round(row.rain_1d, 1),
                "rainfall_7d": round(row.rain_7d_sum, 1),
                "soil_moisture": 0.0,
                "slope": round(row.slope_deg, 2),
                "elevation": round(_nearest_elevation(row.lat, row.lon, elev_df), 1),
                "temperature": 0.0,
                "ndvi": 0.0,
                "geological_susceptibility": "Moderate",
                "land_use": "Unclassified",
                "road_distance": 0.0,
                "historical_landslide_frequency": 0,
            },
            "population_exposure": 0,
            "critical_infrastructure": [],
            "last_updated": str(row.date),
            "has_active_geofence": risk_level in ("HIGH", "VERY_HIGH", "CRITICAL"),
            "geofence_radius_km": 3.5 if risk_level in ("HIGH", "VERY_HIGH", "CRITICAL") else 0.0,
        })
    return zones


def get_zones() -> list[dict]:
    global _zones_cache
    if _zones_cache is None:
        _zones_cache = _build_zones()
    return _zones_cache


def get_alerts() -> list[dict]:
    alerts = []
    for z in get_zones():
        if z["risk_level"] not in ALERT_SEVERITY:
            continue
        alerts.append({
            "id": f"alert-{z['id']}",
            "locationId": z["id"],
            "locationName": z["name"],
            "district": z["district"],
            "state": z["state"],
            "risk_probability": z["risk_probability"],
            "risk_level": z["risk_level"],
            "timestamp": z["last_updated"],
            "primary_factors": ["Slope angle", "Antecedent rainfall"],
            "recommended_actions": [
                "Restrict non-essential travel through the corridor",
                "Notify the local disaster management authority",
            ],
            "status": "ACTIVE",
            "severity": ALERT_SEVERITY[z["risk_level"]],
        })
    return alerts


def get_state_summaries() -> list[dict]:
    per_state = defaultdict(lambda: {"risks": [], "high": 0, "critical": 0})
    alert_counts = defaultdict(int)

    for a in get_alerts():
        alert_counts[a["state"]] += 1

    for z in get_zones():
        bucket = per_state[z["state"]]
        bucket["risks"].append(z["risk_probability"])
        if z["risk_level"] in ("HIGH", "VERY_HIGH"):
            bucket["high"] += 1
        if z["risk_level"] == "CRITICAL":
            bucket["critical"] += 1

    return [
        {
            "state": state,
            "avgRisk": round(sum(b["risks"]) / len(b["risks"]), 3),
            "highRiskZones": b["high"],
            "criticalZones": b["critical"],
            "alerts": alert_counts[state],
            "totalMonitored": len(b["risks"]),
        }
        for state, b in per_state.items()
    ]
