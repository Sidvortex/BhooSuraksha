"""
Trains the expanded REGIONAL model: India plus the hilly/Himalayan
neighboring countries connected to India's borders (Nepal, Bhutan,
Myanmar, Bangladesh, and Tibet Autonomous Region/China). Same method as
train_india_model.py, generalized so the "region" categorical feature
covers Indian states AND these five neighboring areas.

Data: NASA Global Landslide Catalog, filtered to:
  India (1,265), Nepal (481), Bangladesh (58), Myanmar (44), Bhutan (20),
  China limited to Tibet Autonomous Region only (18) - the rest of China
  was excluded because it isn't the part connected to India's borders.
  Total: 1,886 real recorded events.

This does NOT change the NER rainfall+slope model (model.py) - there is no
broader real rainfall/slope dataset available for this wider area, so that
model still only covers the 17 originally monitored NER points. This
script only expands the event-catalog-based model.

Run:
    cd backend/training
    pip install -r ../requirements.txt
    python train_region_model.py
"""
import json
import os
import unicodedata

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split

HERE = os.path.dirname(__file__)
EVENTS_PATH = os.path.join(HERE, "region_landslide_events.csv")
MODEL_OUT = os.path.join(HERE, "..", "models", "region_risk_model.pkl")
STATE_FREQ_OUT = os.path.join(HERE, "..", "models", "region_state_freq.json")
METRICS_OUT = os.path.join(HERE, "..", "models", "region_model_metrics.json")

FEATURES = ["latitude", "longitude", "month_sin", "month_cos", "state_freq"]
RNG = np.random.RandomState(42)


def normalize_region(row) -> str:
    """India rows are bucketed by state; non-India rows are bucketed by
    country (Tibet kept separate from the rest of China, since only Tibet
    was included)."""
    country = str(row["country_name"])
    if "India" in country:
        ascii_name = unicodedata.normalize("NFKD", str(row["admin_division_name"])).encode("ascii", "ignore").decode().strip()
        return "Bengal" == ascii_name and "West Bengal" or ascii_name
    if "China" in country:
        return "Tibet"
    if "Myanmar" in country:
        return "Myanmar"
    return country


def build_negatives(positives: pd.DataFrame) -> pd.DataFrame:
    """Same pseudo-absence approach as train_india_model.py: jitter each
    real event's coordinates 0.3-1.5 degrees and assign a random month."""
    negatives = positives.copy()
    angle = RNG.uniform(0, 2 * np.pi, len(negatives))
    radius = RNG.uniform(0.3, 1.5, len(negatives))
    negatives["latitude"] = positives["latitude"].to_numpy() + radius * np.sin(angle)
    negatives["longitude"] = positives["longitude"].to_numpy() + radius * np.cos(angle)
    negatives["month"] = RNG.randint(1, 13, len(negatives))
    negatives["landslide"] = 0
    return negatives


def main():
    df = pd.read_csv(EVENTS_PATH)
    df["region"] = df.apply(normalize_region, axis=1)
    df["month"] = pd.to_datetime(df["event_date"], format="%m/%d/%Y %I:%M:%S %p", errors="coerce").dt.month
    df = df.dropna(subset=["month", "latitude", "longitude"])
    df["month"] = df["month"].astype(int)
    df["landslide"] = 1

    positives = df[["latitude", "longitude", "month", "region", "landslide"]]
    negatives = build_negatives(positives)
    data = pd.concat([positives, negatives], ignore_index=True)

    train_df, test_df = train_test_split(
        data, test_size=0.2, random_state=42, stratify=data["landslide"]
    )
    region_counts = train_df.loc[train_df["landslide"] == 1, "region"].value_counts()
    region_freq = (region_counts / region_counts.sum()).to_dict()
    default_freq = min(region_freq.values()) if region_freq else 0.0

    def add_features(d: pd.DataFrame) -> pd.DataFrame:
        d = d.copy()
        d["month_sin"] = np.sin(2 * np.pi * d["month"] / 12)
        d["month_cos"] = np.cos(2 * np.pi * d["month"] / 12)
        d["state_freq"] = d["region"].map(region_freq).fillna(default_freq)
        return d

    train_df = add_features(train_df)
    test_df = add_features(test_df)

    model = RandomForestClassifier(n_estimators=300, max_depth=8, random_state=42, class_weight="balanced")
    model.fit(train_df[FEATURES], train_df["landslide"])

    preds = model.predict(test_df[FEATURES])
    proba = model.predict_proba(test_df[FEATURES])[:, 1]
    metrics = {
        "accuracy": round(float(accuracy_score(test_df["landslide"], preds)), 3),
        "precision": round(float(precision_score(test_df["landslide"], preds)), 3),
        "recall": round(float(recall_score(test_df["landslide"], preds)), 3),
        "f1Score": round(float(f1_score(test_df["landslide"], preds)), 3),
        "rocAuc": round(float(roc_auc_score(test_df["landslide"], proba)), 3),
        "trainingEvents": int((data["landslide"] == 1).sum()),
        "testDatasetSize": int(len(test_df)),
        "regionsRepresented": int(df["region"].nunique()),
        "countriesRepresented": "India, Nepal, Bhutan, Myanmar, Bangladesh, Tibet (China)",
        "modelArchitecture": "RandomForestClassifier (n_estimators=300, max_depth=8, class_weight=balanced)",
        "dataSource": "NASA Global Landslide Catalog, India + Himalayan border countries, 2007-2016",
    }

    os.makedirs(os.path.dirname(MODEL_OUT), exist_ok=True)
    joblib.dump(model, MODEL_OUT)
    with open(STATE_FREQ_OUT, "w") as f:
        json.dump({"state_freq": region_freq, "default_freq": default_freq}, f, indent=2)
    with open(METRICS_OUT, "w") as f:
        json.dump(metrics, f, indent=2)

    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
