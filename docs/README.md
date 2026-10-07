# BhooSuraksha documentation

Everything about BhooSuraksha, from what it is to how the models were built,
where the data comes from, how to run and deploy it, and what is still
missing.

Read in order the first time. Later, jump to the part you need.

| # | Document | What's in it |
|---|---|---|
| 1 | [Overview](01-overview.md) | The problem, what BhooSuraksha does, who it is for, what's real and what isn't |
| 2 | [Architecture](02-architecture.md) | The parts of the system, how they talk, how Setu uses BhooSuraksha |
| 3 | [Models](03-models.md) | The three landslide-risk models: data, method, metrics, limits, retraining |
| 4 | [Data](04-data.md) | Every dataset and licence, the data pipeline scripts, the road-network builds |
| 5 | [Features](05-features.md) | Every screen of the public site and the authority console |
| 6 | [API reference](06-api.md) | Every backend endpoint: inputs, outputs, who can call it |
| 7 | [Backend](07-backend.md) | Python modules, settings, storage, startup checks |
| 8 | [Frontend](08-frontend.md) | Pages, components, sample-data fallback, maps, theme |
| 9 | [Local setup](09-local-setup.md) | Running BhooSuraksha on your own computer |
| 10 | [Deployment](10-deployment.md) | Render + Vercel + Turso, and day-to-day operation |
| 11 | [Security](11-security.md) | Logins, secrets, CORS, rate limits, privacy |
| 12 | [Known issues](12-known-issues.md) | Every known limitation and gap, honestly listed |
| 13 | [Roadmap](13-roadmap.md) | What to build next, including real alerts to phones |
| 14 | [History](14-history.md) | How the project got here and problems fixed along the way |

## The short version

BhooSuraksha (भूसुरक्षा, "land safety") estimates landslide risk for India's
North Eastern Region and its Himalayan neighbours, and helps people act on it.

- **Code:** `backend/` (FastAPI, Python 3.12, scikit-learn), `frontend/`
  (React 19, TypeScript, Vite), `data-pipeline/` (scripts that fetch and
  process public data).
- **Models:** three RandomForest classifiers: NER rainfall + slope,
  India-wide, and India + Himalayan neighbours (NASA landslide records).
- **Sister project:** [Setu](https://github.com/Sidvortex/Setu), the road
  logistics platform, asks BhooSuraksha for landslide risk.
- **Hosting:** backend on Render, website on Vercel, database on Turso, all on
  free plans.

## Keeping these docs current

When you change something, update the document that describes it in the same
commit. When you retrain a model, update the metrics in [Models](03-models.md).
