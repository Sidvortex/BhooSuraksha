# 6. API reference

The backend is a JSON API. An interactive version is at
`<backend address>/docs` (FastAPI's Swagger page), for example
`http://localhost:8000/docs`.

## Conventions

- **Base address:** `http://localhost:8000` locally; the Render URL when
  deployed.
- **Auth:** endpoints marked **Official** need
  `Authorization: Bearer <token>` from `POST /api/auth/login`. Tokens are JWTs
  (HS256), valid for **12 hours**; otherwise HTTP 401.
- **Errors:** `{"detail": "..."}` with 401, 404, 422 (invalid input) or 429
  (rate limit).
- **Risk levels:** `LOW`, `MODERATE`, `HIGH`, `VERY_HIGH`, `CRITICAL` (see
  [Models](03-models.md#risk-levels)).

## Health and login

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/health` | — | — | `{"status": "ok"}` |
| POST | `/api/auth/login` | — | `{"username", "password"}` | `{"token", "user": {"id", "username", "role"}}`; 401 if wrong |
| GET | `/api/auth/me` | Official | — | `{"id", "username", "role"}` |

## Risk: zones, alerts, analytics

| Method | Path | Auth | Returns |
|---|---|---|---|
| GET | `/api/zones` | — | The 17 monitored points, each a `MonitoredLocation` (below), scored by the NER model |
| GET | `/api/alerts` | — | Zones at HIGH or above as `AlertNotification`s; an empty list when none are |
| GET | `/api/analytics` | — | `stateSummaries` (per state: `avgRisk, highRiskZones, criticalZones, alerts, totalMonitored`) and `modelPerformance` (the NER model's hold-out metrics) |
| GET | `/api/models` | — | `{"models": [{id, name, description, dataSource, metrics}]}` for `ner`, `india`, `region` |

**`MonitoredLocation`:** `id, name, district, state, latitude, longitude,
risk_probability, risk_level, confidence, parameters, population_exposure,
critical_infrastructure, last_updated, has_active_geofence,
geofence_radius_km`, where `parameters` has `rainfall_1h, rainfall_24h,
rainfall_7d, soil_moisture, slope, elevation, temperature, ndvi,
geological_susceptibility, land_use, road_distance,
historical_landslide_frequency`.

**`AlertNotification`:** `id, locationId, locationName, district, state,
risk_probability, risk_level, timestamp, primary_factors,
recommended_actions, status (ACTIVE|ACKNOWLEDGED|RESOLVED),
severity (HIGH|CRITICAL|WARNING)`.

## Predictions

| Method | Path | Auth | Body | Model |
|---|---|---|---|---|
| POST | `/api/predict` | — | `latitude, longitude, rainfall_24h, rainfall_7d, slope` (required); `rainfall_1h, soil_moisture, elevation, temperature, ndvi, geological_susceptibility, land_use, road_distance, historical_landslide_frequency` (optional, **not used by the model**) | NER Station |
| POST | `/api/predict/india` | — | `{"latitude", "longitude", "date": "YYYY-MM-DD"}` (`date` optional, default today) | India-wide |
| POST | `/api/predict/region` | — | same as India | Regional |

**`/api/predict` returns:** `probability, risk_level, confidence, latitude,
longitude, timestamp, factor_weights[{factor, importance, impactLevel,
description}], explanation`.

**`/api/predict/india` and `/region` return:** `probability, risk_level,
confidence, state, latitude, longitude, month, factor_weights[...],
explanation`.

Example (what Setu sends):

```bash
curl -X POST https://<bhoosuraksha-api>.onrender.com/api/predict/region \
  -H "Content-Type: application/json" \
  -d '{"latitude": 25.17, "longitude": 93.02, "date": "2026-07-15"}'
```

```json
{"probability": 0.671, "risk_level": "HIGH", "confidence": 0.763,
 "state": "Manipur", "latitude": 25.17, "longitude": 93.02, "month": 7,
 "factor_weights": [{"factor": "Season (Month)", "importance": 54, ...}, ...],
 "explanation": "..."}
```

## Alerts to authorities

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/api/alerts/notify` | Official | `{"location_id": "zone-1", "message": "..."}` | `{status, zone_name, risk_level, subscriber_count, note}`. With no subscriber list connected: `status = "no_subscribers"`, `subscriber_count = 0`. 404 for an unknown zone |

## Feedback

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/api/feedback` | — | `{"name", "email", "category", "message"}` (name and email optional) | `{"status": "received"}`; 422 for an empty message; 429 after 5 per hour from the same visitor |
| GET | `/api/feedback` | Official | — | `{"items": [{id, name, email, category, message, created_at}]}` |

## Route Planner (Dima Hasao pilot)

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/api/logistics/network` | — | — | `district`, `hq` (Haflong), `report` (build summary), `roads` (GeoJSON with `edge_id`) |
| GET | `/api/logistics/places` | — | — | `hq`, `facilities[{id, name, category, lat, lon}]`, `villages[{id, name, population, lat, lon}]` |
| POST | `/api/logistics/route` | — | `{"origin": {"lat","lon"}, "destination": {"lat","lon"}, "blocked_edge_ids": []}` | `status`, `normal` and `current` (`minutes, km, edge_ids, geometry`), `delay_min`, `snap_m` |
| POST | `/api/logistics/impact` | — | `{"blocked_edge_ids": [...], "origin": {"lat","lon"}}` (`origin` optional, default the HQ) | `origin`, `facilities_cut_off[]`, `facilities_delayed[]`, `villages_cut_off`, `population_cut_off` |

Blockages are passed in each request; nothing is stored. Setu has the
region-wide, stateful version of these endpoints.
