"""
Trains the India-wide landslide susceptibility model.

Data source: NASA Global Landslide Catalog (GLC), Kirschbaum et al. 2010,
compiled by NASA Goddard Space Flight Center from news reports, disaster
databases, and scientific sources (2007-2016). This script uses the 1,265
real, recorded landslide events located in India (see
india_landslide_events.csv, trimmed from the full global catalog).

Why this model is different from the NER model (backend/model.py):
The NER model was trained on rainfall + slope time series for 17 specific
monitored points. GLC gives real event locations and dates but NOT rainfall
or terrain data for each one, so this model instead learns from what the
catalog actually contains: WHERE (state, lat/lon) and WHEN (month/season)
landslides have historically been reported across India. It answers "how
does risk vary by region and season", not "is it raining hard enough right
now" - a genuinely different, complementary signal. See docs/03-models.md
for the full explanation and its limitations (most importantly: reporting
bias - GLC is news/report-driven, so better-monitored regions and populated
areas are over-represented relative to remote areas with the same physical
risk).

Run:
    cd backend/training
    pip install -r ../requirements.txt
    python train_india_model.py
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
EVENTS_PATH = os.path.join(HERE, "india_landslide_events.csv")
MODEL_OUT = os.path.join(HERE, "..", "models", "india_risk_model.pkl")
STATE_FREQ_OUT = os.path.join(HERE, "..", "models", "india_state_freq.json")
METRICS_OUT = os.path.join(HERE, "..", "models", "india_model_metrics.json")

FEATURES = ["latitude", "longitude", "month_sin", "month_cos", "state_freq"]
RNG = np.random.RandomState(42)


def normalize_state(name: str) -> str:
    """Collapse diacritic/spelling variants ('Nāgāland' / 'Nagaland') to one label."""
    ascii_name = unicodedata.normalize("NFKD", str(name)).encode("ascii", "ignore").decode()
    ascii_name = ascii_name.strip()
    if ascii_name == "Bengal":
        return "West Bengal"
    return ascii_name


def build_negatives(positives: pd.DataFrame) -> pd.DataFrame:
    """
    Pseudo-absence sampling: for each real event, generate one "no recorded
    landslide" sample by jittering that event's coordinates by 0.3-1.5 degrees
    (still the same region/state) and drawing an unrelated random month. This
    is a standard technique in landslide susceptibility modeling, but it's an
    approximation - see docs/03-models.md for what it does and doesn't mean.
    """
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
    df["state"] = df["admin_division_name"].map(normalize_state)
    df["month"] = pd.to_datetime(df["event_date"], format="%m/%d/%Y %I:%M:%S %p", errors="coerce").dt.month
    df = df.dropna(subset=["month", "latitude", "longitude"])
    df["month"] = df["month"].astype(int)
    df["landslide"] = 1

    positives = df[["latitude", "longitude", "month", "state", "landslide"]]
    negatives = build_negatives(positives)
    data = pd.concat([positives, negatives], ignore_index=True)

    # Train/test split first, then compute each state's historical event
    # frequency from the TRAINING rows only, to avoid leaking test-set labels
    # into a feature.
    train_df, test_df = train_test_split(
        data, test_size=0.2, random_state=42, stratify=data["landslide"]
    )
    state_counts = train_df.loc[train_df["landslide"] == 1, "state"].value_counts()
    state_freq = (state_counts / state_counts.sum()).to_dict()
    default_freq = min(state_freq.values()) if state_freq else 0.0

    def add_features(d: pd.DataFrame) -> pd.DataFrame:
        d = d.copy()
        d["month_sin"] = np.sin(2 * np.pi * d["month"] / 12)
        d["month_cos"] = np.cos(2 * np.pi * d["month"] / 12)
        d["state_freq"] = d["state"].map(state_freq).fillna(default_freq)
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
        "statesRepresented": int(df["state"].nunique()),
        "modelArchitecture": "RandomForestClassifier (n_estimators=300, max_depth=8, class_weight=balanced)",
        "dataSource": "NASA Global Landslide Catalog (GLC), India subset, 2007-2016",
    }

    os.makedirs(os.path.dirname(MODEL_OUT), exist_ok=True)
    joblib.dump(model, MODEL_OUT)
    with open(STATE_FREQ_OUT, "w") as f:
        json.dump({"state_freq": state_freq, "default_freq": default_freq}, f, indent=2)
    with open(METRICS_OUT, "w") as f:
        json.dump(metrics, f, indent=2)

    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
