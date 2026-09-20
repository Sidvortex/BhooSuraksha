"""
Loads the India-wide landslide susceptibility model (see
training/train_india_model.py for how it was built from the NASA Global
Landslide Catalog) and turns a location + date into a prediction.

This model is deliberately kept separate from model.py (the NER
rainfall+slope model) - they answer different questions and shouldn't be
blended into one prediction.
"""
import json
import os
from datetime import date as date_cls
from typing import Optional

import joblib
import numpy as np
import pandas as pd

HERE = os.path.dirname(__file__)
MODEL_PATH = os.path.join(HERE, "models", "india_risk_model.pkl")
STATE_FREQ_PATH = os.path.join(HERE, "models", "india_state_freq.json")
METRICS_PATH = os.path.join(HERE, "models", "india_model_metrics.json")

FEATURES = ["latitude", "longitude", "month_sin", "month_cos", "state_freq"]

# Same rough state centroids used in zones.py, extended to cover all of India
# (not just the North East) so this model can be queried anywhere in the
# country. Approximate nearest-centroid labeling only - see zones.py for the
# same caveat.
STATE_CENTROIDS = {
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
}

with open(STATE_FREQ_PATH) as f:
    _state_freq_data = json.load(f)
_state_freq = _state_freq_data["state_freq"]
_default_freq = _state_freq_data["default_freq"]

with open(METRICS_PATH) as f:
    _metrics = json.load(f)

_model = joblib.load(MODEL_PATH)


def nearest_state(lat: float, lon: float) -> str:
    return min(
        STATE_CENTROIDS,
        key=lambda s: (STATE_CENTROIDS[s][0] - lat) ** 2 + (STATE_CENTROIDS[s][1] - lon) ** 2,
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
    state = nearest_state(latitude, longitude)
    state_freq = _state_freq.get(state, _default_freq)

    row = pd.DataFrame([{
        "latitude": latitude,
        "longitude": longitude,
        "month_sin": np.sin(2 * np.pi * month / 12),
        "month_cos": np.cos(2 * np.pi * month / 12),
        "state_freq": state_freq,
    }])[FEATURES]

    proba = float(_model.predict_proba(row)[0][1])
    tree_votes = np.array([tree.predict(row.to_numpy())[0] for tree in _model.estimators_])
    confidence = float(1.0 - tree_votes.std())
    risk_level = risk_level_from_probability(proba)

    importances = dict(zip(FEATURES, _model.feature_importances_))
    factor_weights = [
        {
            "factor": "Historical State Frequency",
            "importance": round(importances["state_freq"] * 100),
            "impactLevel": "HIGH" if importances["state_freq"] > 0.3 else "MODERATE",
            "description": f"{state}: {state_freq * 100:.1f}% of all recorded India events fall in this state",
        },
        {
            "factor": "Season (Month)",
            "importance": round((importances["month_sin"] + importances["month_cos"]) * 100),
            "impactLevel": "HIGH" if (importances["month_sin"] + importances["month_cos"]) > 0.3 else "MODERATE",
            "description": f"Month {month} — most GLC-recorded India events occur during the June-September monsoon",
        },
        {
            "factor": "Location (lat/lon)",
            "importance": round((importances["latitude"] + importances["longitude"]) * 100),
            "impactLevel": "MODERATE",
            "description": f"{latitude:.2f}°N, {longitude:.2f}°E, nearest state: {state}",
        },
    ]

    return {
        "probability": round(proba, 3),
        "risk_level": risk_level,
        "confidence": round(confidence, 3),
        "state": state,
        "latitude": latitude,
        "longitude": longitude,
        "month": month,
        "factor_weights": sorted(factor_weights, key=lambda w: -w["importance"]),
        "explanation": (
            f"India-wide model: {state} in month {month} has a historical GLC report "
            f"frequency of {state_freq * 100:.1f}% of all recorded events. This model "
            f"reflects WHERE and WHEN landslides have been reported nationally, not "
            f"real-time rainfall or slope at this exact point."
        ),
    }


def get_model_metrics() -> dict:
    return _metrics
