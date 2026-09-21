"""
FastAPI backend for BhooSuraksha.

Serves the trained RandomForest landslide-risk model (models/risk_model.pkl)
to the React dashboard:

    POST /api/predict   - score one location from manually entered parameters
    GET  /api/zones     - real risk scores for the 17 monitored NER points
    GET  /api/alerts    - zones currently at HIGH/VERY_HIGH/CRITICAL risk
    GET  /api/analytics - state-level rollups + real model performance metrics
    GET  /health        - liveness check

Run:
    pip install -r requirements.txt
    uvicorn app:app --reload --port 8000
"""
from datetime import datetime, timezone
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import auth
import alerts_dispatch
import metrics
import model
import india_model
import region_model
import zones as zones_module
from schemas import (
    AlertNotification,
    AnalyticsResponse,
    IndiaPredictionRequest,
    IndiaPredictionResponse,
    LoginRequest,
    LoginResponse,
    MLPredictionRequest,
    MLPredictionResponse,
    ModelListResponse,
    MonitoredLocation,
    NotifyAuthoritiesRequest,
    NotifyAuthoritiesResponse,
    UserInfo,
)

app = FastAPI(title="BhooSuraksha API")

# The dashboard is a static SPA that may be served from any origin (localhost,
# a preview URL, etc.) — restrict this to the deployed frontend's origin once
# that's fixed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _log_auth_status():
    # Printed on every startup so "incorrect username or password" is never
    # a mystery: if this backend has 0 accounts, that's the actual problem,
    # not a typo. Very common right after a fresh deploy - create_admin.py
    # has to be run against wherever this backend's storage actually lives
    # (see auth.py's USING_TURSO note).
    storage = "Turso" if auth.USING_TURSO else f"local sqlite ({auth.DB_PATH})"
    user_count = auth.count_users()
    print(f"[auth] storage: {storage} | registered accounts: {user_count}")
    if user_count == 0:
        print("[auth] No accounts exist yet - every login will fail until you run: python create_admin.py <username> <password>")

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/auth/login", response_model=LoginResponse)
def login(req: LoginRequest):
    user = auth.verify_login(req.username, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    token = auth.issue_token(user)
    return {"token": token, "user": user}


@app.get("/api/auth/me", response_model=UserInfo)
def me(user: dict = Depends(auth.require_auth)):
    full = auth.get_user_by_username(user["sub"])
    if not full:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return full


@app.post("/api/alerts/notify", response_model=NotifyAuthoritiesResponse)
def notify_authorities(req: NotifyAuthoritiesRequest, user: dict = Depends(auth.require_auth)):
    """
    Authority-only action: dispatch a notification for a specific zone.
    Requires a valid login (Depends(auth.require_auth)) - this is a real
    protected endpoint, not a UI-only button.

    There's no subscriber database wired up yet (see backend/data model),
    so this honestly reports 0 recipients rather than pretending to have
    sent something. alerts_dispatch.py has real, ready integration code
    for MSG91/Twilio/Firebase push - connect a subscribers table and swap
    the empty list below for a real one to make this actually deliver.
    """
    zone = next((z for z in zones_module.get_zones() if z["id"] == req.location_id), None)
    if not zone:
        raise HTTPException(status_code=404, detail=f"No zone found with id '{req.location_id}'")

    subscribers: list = []  # wire this to a real subscribers table to go live
    alerts_dispatch.send_alert(subscribers, zone["name"], zone["risk_level"])

    return {
        "status": "dispatched" if subscribers else "no_subscribers",
        "zone_name": zone["name"],
        "risk_level": zone["risk_level"],
        "subscriber_count": len(subscribers),
        "note": (
            f"Notification triggered by {user['sub']}, but no subscriber database is "
            "connected yet - see backend/alerts_dispatch.py and SETUP.md to wire a real "
            "SMS/push provider and a subscribers table."
        ),
    }


@app.post("/api/predict", response_model=MLPredictionResponse)
def predict_landslide(req: MLPredictionRequest):
    rain_3d_sum, rain_30d_sum = model.estimate_rolling_rainfall(req.rainfall_24h, req.rainfall_7d)

    proba, confidence, importances = model.predict(
        rain_1d=req.rainfall_24h,
        rain_3d_sum=rain_3d_sum,
        rain_7d_sum=req.rainfall_7d,
        rain_30d_sum=rain_30d_sum,
        slope_deg=req.slope,
    )
    risk_level = model.risk_level_from_probability(proba)

    factor_weights = model.build_factor_weights(
        feature_values={
            "rain_1d": req.rainfall_24h,
            "rain_3d_sum": rain_3d_sum,
            "rain_7d_sum": req.rainfall_7d,
            "rain_30d_sum": rain_30d_sum,
            "slope_deg": req.slope,
        },
        importances=importances,
    )

    return {
        "probability": round(proba, 3),
        "risk_level": risk_level,
        "confidence": round(confidence, 3),
        "latitude": req.latitude,
        "longitude": req.longitude,
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S UTC"),
        "factor_weights": factor_weights,
        "explanation": model.build_explanation(risk_level, req.slope, req.rainfall_24h),
    }


@app.get("/api/zones", response_model=List[MonitoredLocation])
def get_zones():
    return zones_module.get_zones()


@app.get("/api/alerts", response_model=List[AlertNotification])
def get_alerts():
    return zones_module.get_alerts()


@app.get("/api/analytics", response_model=AnalyticsResponse)
def get_analytics():
    return {
        "stateSummaries": zones_module.get_state_summaries(),
        "modelPerformance": metrics.get_model_performance(),
    }


@app.get("/api/models", response_model=ModelListResponse)
def list_models():
    """Both trained models available in this deployment, with real metrics for each."""
    return {
        "models": [
            {
                "id": "ner",
                "name": "NER Rainfall + Slope Model",
                "description": "Trained on rainfall (1/3/7/30-day sums) and slope angle for 17 monitored points in the North Eastern Region.",
                "dataSource": "Synthetic rainfall series + SRTM-derived slope, 17 NER points",
                "metrics": metrics.get_model_performance(),
            },
            {
                "id": "india",
                "name": "India-Wide Seasonal + Regional Model",
                "description": "Trained on real recorded landslide events across India: where and when they happened, not live rainfall or slope.",
                "dataSource": "NASA Global Landslide Catalog (GLC), India subset, 2007-2016, 1,265 events",
                "metrics": india_model.get_model_metrics(),
            },
            {
                "id": "region",
                "name": "Regional Model (India + Himalayan Border Countries)",
                "description": "Same method as the India-wide model, expanded to Nepal, Bhutan, Myanmar, Bangladesh, and Tibet (China) - the hilly belt connected to India's borders.",
                "dataSource": "NASA Global Landslide Catalog, India + Nepal + Bhutan + Myanmar + Bangladesh + Tibet, 2007-2016, 1,886 events",
                "metrics": region_model.get_model_metrics(),
            },
        ]
    }


@app.post("/api/predict/india", response_model=IndiaPredictionResponse)
def predict_india(req: IndiaPredictionRequest):
    on_date = datetime.strptime(req.date, "%Y-%m-%d").date() if req.date else None
    return india_model.predict(req.latitude, req.longitude, on_date)


@app.post("/api/predict/region", response_model=IndiaPredictionResponse)
def predict_region(req: IndiaPredictionRequest):
    on_date = datetime.strptime(req.date, "%Y-%m-%d").date() if req.date else None
    return region_model.predict(req.latitude, req.longitude, on_date)
