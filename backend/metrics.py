"""
Computes real hold-out performance for the trained model once, using the same
80/20 split as landslide-ews/models/train_model.py, so /api/analytics reports
genuine numbers instead of hand-typed placeholders.
"""
import os

import pandas as pd
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split

from model import FEATURES, _model

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "training_dataset.csv")
LABEL = "landslide"

_cache = None


def get_model_performance() -> dict:
    global _cache
    if _cache is not None:
        return _cache

    df = pd.read_csv(DATA_PATH).dropna(subset=FEATURES)
    X, y = df[FEATURES], df[LABEL]
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    preds = _model.predict(X_test)
    proba = _model.predict_proba(X_test)[:, 1]

    negatives = int((y_test == 0).sum())
    false_positives = int(((preds == 1) & (y_test == 0)).sum())

    _cache = {
        "accuracy": round(float(accuracy_score(y_test, preds)), 3),
        "precision": round(float(precision_score(y_test, preds)), 3),
        "recall": round(float(recall_score(y_test, preds)), 3),
        "f1Score": round(float(f1_score(y_test, preds)), 3),
        "rocAuc": round(float(roc_auc_score(y_test, proba)), 3),
        "falseAlarmRate": round(false_positives / negatives, 3) if negatives else 0.0,
        "lastTrained": "2018-12-31",  # most recent date represented in the training data
        "testDatasetSize": int(len(X_test)),
        "modelArchitecture": "RandomForestClassifier (n_estimators=300, max_depth=8)",
    }
    return _cache
