"""
Loads the trained RandomForestClassifier (models/risk_model.pkl) and turns raw
feature values into predictions. This is the one place that talks to the
actual ML model — every endpoint in app.py goes through here.
"""
import os

import joblib
import numpy as np
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "risk_model.pkl")

# Exact feature order the model was trained on (see landslide-ews/models/train_model.py).
FEATURES = ["rain_1d", "rain_3d_sum", "rain_7d_sum", "rain_30d_sum", "slope_deg"]

FACTOR_LABELS = {
    "rain_1d": "24-Hour Rainfall",
    "rain_3d_sum": "3-Day Cumulative Rainfall",
    "rain_7d_sum": "7-Day Cumulative Rainfall",
    "rain_30d_sum": "30-Day Antecedent Rainfall",
    "slope_deg": "Slope Angle",
}

_model = joblib.load(MODEL_PATH)


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


def estimate_rolling_rainfall(rain_1d: float, rain_7d: float) -> tuple[float, float]:
    """
    The model needs 3-day/7-day/30-day cumulative rainfall, but the dashboard's
    manual prediction form only collects 1-day and 7-day totals. Extend the
    missing windows by assuming the average daily rate seen over the last 7
    days continues into the 3-day and 30-day windows. This is a stated
    approximation used only when the caller hasn't measured those windows
    directly (see zones.py, which uses real historical sums instead).
    """
    daily_rate = rain_7d / 7.0
    rain_3d_sum = min(rain_7d, rain_1d + daily_rate * 2)
    rain_30d_sum = rain_7d + daily_rate * 23
    return rain_3d_sum, rain_30d_sum


def predict(rain_1d: float, rain_3d_sum: float, rain_7d_sum: float, rain_30d_sum: float, slope_deg: float):
    """Run the real model on one fully-specified feature row.

    Returns (probability, confidence, feature_importances).
    """
    X = pd.DataFrame([[rain_1d, rain_3d_sum, rain_7d_sum, rain_30d_sum, slope_deg]], columns=FEATURES)
    proba = float(_model.predict_proba(X)[0][1])

    # Confidence proxy: how much the 300 trees in the forest agree with each
    # other on this row. Tight agreement (low vote spread) -> higher confidence.
    X_arr = X.to_numpy()
    tree_votes = np.array([tree.predict(X_arr)[0] for tree in _model.estimators_])
    confidence = float(1.0 - tree_votes.std())

    importances = dict(zip(FEATURES, _model.feature_importances_))
    return proba, confidence, importances


def build_factor_weights(feature_values: dict, importances: dict) -> list[dict]:
    """Turn the model's real (global) feature importances + this request's
    feature values into the factor_weights list the dashboard displays."""
    weights = []
    for feat in FEATURES:
        importance_pct = round(importances[feat] * 100)
        impact = "HIGH" if importance_pct >= 30 else "MODERATE" if importance_pct >= 15 else "LOW"
        value = feature_values[feat]
        unit = "°" if feat == "slope_deg" else " mm"
        weights.append({
            "factor": FACTOR_LABELS[feat],
            "importance": importance_pct,
            "impactLevel": impact,
            "description": f"{value:.1f}{unit} — {importance_pct}% of the model's decision weight",
        })
    return sorted(weights, key=lambda w: -w["importance"])


def build_explanation(risk_level: str, slope_deg: float, rain_1d: float) -> str:
    lead = {
        "CRITICAL": "Critical risk",
        "VERY_HIGH": "Very high risk",
        "HIGH": "High risk",
        "MODERATE": "Moderate risk",
        "LOW": "Low risk",
    }[risk_level]
    return (
        f"{lead}: the model weighs slope angle ({slope_deg:.1f}\u00b0) and antecedent "
        f"rainfall ({rain_1d:.1f} mm/24h) most heavily among its 5 trained features."
    )
