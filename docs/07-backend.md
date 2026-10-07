# 7. Backend

Python 3.12, FastAPI, in `backend/`. Run with
`uvicorn app:app --reload --port 8000`.

## Modules

| File | Responsibility |
|---|---|
| `app.py` | The FastAPI app: CORS (from `ALLOWED_ORIGINS`), startup checks (refuses to run on Render with a weak `AUTH_SECRET`; logs CORS origins and account count), all endpoints except logistics |
| `auth.py` | `users` table, bcrypt hashes, JWT sessions (12 h), `create_user`, `set_password`, `verify_login`, `require_auth`; Turso or local SQLite (`data/auth.db`) |
| `create_admin.py` | Create an officer account or reset a password |
| `turso_http.py` | Minimal Turso client over HTTPS (`/v2/pipeline`); cleans stray whitespace from the URL and token |
| `feedback.py` | `feedback` table, per-visitor rate limit (5 per hour), Turso or local SQLite (`data/feedback.db`) |
| `model.py` | Model 1 (NER): loads `models/risk_model.pkl`, risk levels, rolling-rainfall estimate, factor weights, explanation |
| `india_model.py` | Model 2 (India-wide): loads its model and state frequencies, nearest-state labelling |
| `region_model.py` | Model 3 (Regional): same for India + neighbours |
| `zones.py` | Scores the 17 NER points with Model 1 from their latest data row; builds alerts; caches in memory |
| `metrics.py` | Computes Model 1's hold-out metrics once (80/20 split, `random_state=42`) |
| `logistics.py` | Dima Hasao road routing on a networkx graph (`/api/logistics/*`) |
| `alerts_dispatch.py` | Ready-to-use code for MSG91 SMS, Twilio SMS and Firebase push; **not connected** |
| `schemas.py` | Pydantic request/response models |
| `training/` | `train_india_model.py`, `train_region_model.py` and the NASA catalogue CSVs |
| `models/` | The three `.pkl` models and their metrics/state-frequency JSON files |
| `data/` | `training_dataset.csv`, `elevation_grid.csv`, `networks/dima_hasao/` |

## Settings (environment variables)

| Variable | Default | Meaning |
|---|---|---|
| `AUTH_SECRET` | an insecure dev value | Signs login tokens; keys the feedback IP hashes. Render generates it; must differ from Setu's |
| `ALLOWED_ORIGINS` | `*` | Websites allowed to call the API (CORS), comma-separated |
| `TURSO_DATABASE_URL` | empty | `libsql://...turso.io`; empty = local SQLite files in `backend/data/` |
| `TURSO_AUTH_TOKEN` | empty | Turso token |
| `RENDER` | set by Render | When present (or `BHOOSURAKSHA_ENV=production`), startup refuses a default or short (< 32 characters) `AUTH_SECRET` |
| `BHOOSURAKSHA_ENV` | empty | `production` turns on the same check outside Render |
| `PYTHON_VERSION` | — | Render only: `3.12.11` (in `render.yaml`) |
| `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `GOOGLE_APPLICATION_CREDENTIALS` | — | Only when `alerts_dispatch.py` is connected to a provider (not yet) |

Never commit a `.env` file or a `*.db` file.

## Storage

Only two things are written at runtime:

| Table | Columns |
|---|---|
| `users` | `id, username (unique), password_hash, role, created_at` |
| `feedback` | `id, name, email, category, message, ip_address (a keyed hash, not the IP), created_at` |

With Turso both live in the same database; locally they are
`data/auth.db` and `data/feedback.db`. Everything else (models, datasets, road
network) is read-only files in the repo.

## Officer accounts

```bash
python create_admin.py <username>             # asks for the password twice (hidden)
python create_admin.py <username> --reset     # change an existing account's password
python create_admin.py <username> <password>  # non-interactive (ends up in shell history)
```

Passwords need at least 10 characters. For the deployed database, set
`TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in the same terminal first (see
[Deployment](10-deployment.md)).

The startup log always says where accounts are read from and how many exist:

```
[auth] storage: Turso | registered accounts: 1
```

If it says 0, every login fails until an account is created in *that*
storage.

## Dependencies

Pinned in `requirements.txt`:

| Package | Version | Note |
|---|---|---|
| fastapi / uvicorn / starlette / pydantic | 0.141.1 / 0.53.0 / 1.6.0 / 2.13.5 | Web framework |
| **scikit-learn** | **1.8.0** | Must match the version the `.pkl` models were saved with |
| joblib | 1.6.0 | Loads the models |
| pandas / numpy | 3.0.2 / 2.4.4 | Data |
| networkx / shapely / pyproj | 3.6.1 / 2.1.2 / 3.8.0 | Dima Hasao routing |
| bcrypt / PyJWT | 5.0.0 / 2.7.0 | Logins |
| httpx | 0.28.1 | Turso client |

## Memory and startup

About 310 MB with all three models loaded (Render free limit 512 MB); about
7 s to start on a normal computer, longer on Render's 0.1 CPU.

## Tests

There is no automated test suite in this repo yet (Setu has one). Manual
checks:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/models        # ner, india, region
curl -X POST http://localhost:8000/api/predict/region -H "Content-Type: application/json" \
  -d '{"latitude": 27.3, "longitude": 88.6, "date": "2026-07-15"}'
```

Adding pytest tests like Setu's is on the [Roadmap](13-roadmap.md).
