"""
Loads the expanded REGIONAL model (see training/train_region_model.py):
India plus Nepal, Bhutan, Myanmar, Bangladesh, and Tibet Autonomous Region
(China) - the hilly/Himalayan belt actually connected to India's borders.
Same mechanics as india_model.py, generalized to a wider set of regions.
"""
import json
import os
from datetime import date as date_cls
from typing import Optional

import joblib
import numpy as np
import pandas as pd

HERE = os.path.dirname(__file__)
MODEL_PATH = os.path.join(HERE, "models", "region_risk_model.pkl")
STATE_FREQ_PATH = os.path.join(HERE, "models", "region_state_freq.json")
METRICS_PATH = os.path.join(HERE, "models", "region_model_metrics.json")

FEATURES = ["latitude", "longitude", "month_sin", "month_cos", "state_freq"]

# India's states (same as india_model.py) plus the five neighboring
# regions this model adds. Approximate nearest-centroid labeling only.
REGION_CENTROIDS = {
    "Jammu and Kashmir": (33.8, 76.6), "Himachal Pradesh": (31.8, 77.3),
    "Uttarakhand": (30.1, 79.2), "Punjab": (31.1, 75.3), "Haryana": (29.2, 76.3),
    "Rajasthan": (26.9, 73.8), "Uttar Pradesh": (26.8, 80.9), "Bihar": (25.6, 85.1),
    "West Bengal": (23.7, 87.8), "Sikkim": (27.5, 88.5), "Assam": (26.2, 92.9),
    "Arunachal Pradesh": (28.2, 94.7), "Nagaland": (26.1, 94.5), "Manipur": (24.8, 93.9),
    "Mizoram": (23.2, 92.9), "Tripura": (23.9, 91.5), "Meghalaya": (25.5, 91.3),
    "Jharkhand": (23.6, 85.3), "Odisha": (20.9, 85.1), "Chhattisgarh": (21.3, 81.9),
    "Madhya Pradesh": (23.5, 78.6), "Gujarat": (22.3, 71.7), "Maharashtra": (19.6, 75.6),
    "Goa": (15.4, 74.1), "Karnataka": (14.5, 75.7), "Andhra Pradesh": (15.9, 79.7),
    "Telangana": (18.1, 79.0), "Tamil Nadu": (11.1, 78.7), "Kerala": (10.5, 76.5),
    # Neighboring regions added for the expanded model
    "Nepal": (28.4, 84.1), "Bhutan": (27.5, 90.4), "Myanmar": (21.9, 95.9),
    "Bangladesh": (23.7, 90.4), "Tibet": (31.7, 88.1),
}

with open(STATE_FREQ_PATH) as f:
    _state_freq_data = json.load(f)
_state_freq = _state_freq_data["state_freq"]
_default_freq = _state_freq_data["default_freq"]

with open(METRICS_PATH) as f:
    _metrics = json.load(f)

_model = joblib.load(MODEL_PATH)


def nearest_region(lat: float, lon: float) -> str:
    return min(
        REGION_CENTROIDS,
        key=lambda s: (REGION_CENTROIDS[s][0] - lat) ** 2 + (REGION_CENTROIDS[s][1] - lon) ** 2,
    )


def risk_level_from_probability(p: float) -> str:
    if p >= 0.85:
        return "CRITICAL"
    if p >= 0.70:
        return "VERY_HIGH"
    if p >= 0.50:
        return "HIGH"
    if p >= 0.30:
        return "MODERATE"
    return "LOW"


def predict(latitude: float, longitude: float, on_date: Optional[date_cls] = None) -> dict:
    on_date = on_date or date_cls.today()
    month = on_date.month
    region = nearest_region(latitude, longitude)
    region_freq = _state_freq.get(region, _default_freq)

    row = pd.DataFrame([{
        "latitude": latitude,
        "longitude": longitude,
        "month_sin": np.sin(2 * np.pi * month / 12),
        "month_cos": np.cos(2 * np.pi * month / 12),
        "state_freq": region_freq,
    }])[FEATURES]

    proba = float(_model.predict_proba(row)[0][1])
    tree_votes = np.array([tree.predict(row.to_numpy())[0] for tree in _model.estimators_])
    confidence = float(1.0 - tree_votes.std())
    risk_level = risk_level_from_probability(proba)

    importances = dict(zip(FEATURES, _model.feature_importances_))
    factor_weights = [
        {
            "factor": "Historical Regional Frequency",
            "importance": round(importances["state_freq"] * 100),
            "impactLevel": "HIGH" if importances["state_freq"] > 0.3 else "MODERATE",
            "description": f"{region}: {region_freq * 100:.1f}% of all recorded events in this dataset fall here",
        },
        {
            "factor": "Season (Month)",
            "importance": round((importances["month_sin"] + importances["month_cos"]) * 100),
            "impactLevel": "HIGH" if (importances["month_sin"] + importances["month_cos"]) > 0.3 else "MODERATE",
            "description": f"Month {month} — most events in this dataset occur during the June-September monsoon",
        },
        {
            "factor": "Location (lat/lon)",
            "importance": round((importances["latitude"] + importances["longitude"]) * 100),
            "impactLevel": "MODERATE",
            "description": f"{latitude:.2f}°N, {longitude:.2f}°E, nearest region: {region}",
        },
    ]

    return {
        "probability": round(proba, 3),
        "risk_level": risk_level,
        "confidence": round(confidence, 3),
        "state": region,
        "latitude": latitude,
        "longitude": longitude,
        "month": month,
        "factor_weights": sorted(factor_weights, key=lambda w: -w["importance"]),
        "explanation": (
            f"Regional model: {region} in month {month} has a historical report "
            f"frequency of {region_freq * 100:.1f}% of all recorded events across "
            f"India, Nepal, Bhutan, Myanmar, Bangladesh, and Tibet. Reflects WHERE "
            f"and WHEN landslides have been reported across this wider belt, not "
            f"live rainfall or slope at this exact point."
        ),
    }


def get_model_metrics() -> dict:
    return _metrics
