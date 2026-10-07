# 12. Known issues

Everything we know is missing, approximate or fragile. The most important
ones for a demo are first.

## Most important

| Issue | Effect | What to do |
|---|---|---|
| **With the real backend, all 17 zones show LOW risk and there are no alerts.** `zones.py` scores each point from the *last* row of the NER dataset (31 December 2018, a dry winter day) | The live site's risk map, alerts and ticker look empty; the richer picture people have seen comes from the sample data | Score zones from live or forecast rainfall (Open-Meteo), or from a chosen scenario date, and say which on screen ([Roadmap](13-roadmap.md)) |
| **Zones have generic names** ("Monitoring Point 1"…), `district` = the state name, no population exposure; soil moisture, temperature and NDVI show as 0 and slopes are tiny (e.g. 0.07°) | Less meaningful than the sample data's named places; the safety page shows "0 mm rainfall, 0% soil moisture" | Give the 17 points real place names and districts; hide fields the data doesn't have |
| **The site silently falls back to sample data** whenever the backend is unset or unreachable | Visitors can't tell real scores from demo data | Show a visible "sample data" label when falling back |
| **The NER model is trained on synthetic rainfall**; how its labels were assigned isn't documented here; its training script isn't in the repo | Its 0.952 ROC-AUC says little about real-world skill; precision is only 0.35 | Retrain on real rainfall (IMD / Open-Meteo archive) at real event dates |
| **Live Monitoring's demo simulation is on by default** (random nudges to rainfall and soil moisture every 8 s) | Looks like live telemetry but isn't | Default it off, or label it "simulation" |

## Models and data

| Issue | Effect |
|---|---|
| India-wide and Regional models learn **where and in which month landslides were reported** (NASA catalogue, 2007–2016), not weather | "Risk" is a seasonal/historical background level; it won't react to today's rain. Setu's "landslide risk today" inherits this |
| **Reporting bias** in the NASA catalogue | Remote, under-reported areas look safer than they are |
| **State is guessed by nearest state centroid** | Points near borders can get the wrong state name (and state frequency) |
| **Slope from a coarse elevation grid** (max 6.6° in the data) | Real hillside slopes are far steeper; manual predictions with realistic slopes are outside the training range |
| Extra prediction inputs (soil moisture, NDVI, geology, land use…) are **accepted but ignored** | The form suggests they matter |
| No live rainfall, soil moisture, NDVI or satellite feeds | No real-time early warning |
| `fetch_openmeteo.py` has **never been run** | Untested |
| ASDMA reports are **manual only** (robots.txt); only 2022–2025 yearly totals extracted | No road-level failure history yet |
| GeoSadak snapshot is **March 2022**; old district names | Newer roads/districts missing |

## Features

| Issue | Effect |
|---|---|
| **Alerts aren't delivered.** No subscriber list or SMS/push provider; "Alert authorities" reports 0 recipients | No one is notified outside the site |
| **Subscribe for Alerts** isn't saved anywhere | Subscriptions are lost |
| **Citizen hazard reports** stay in the page; they aren't sent to the backend | Officials never receive them |
| **Highway Corridors** and **Evacuation Shelters** are demo data | Not real road or shelter status |
| **AI assistant is rule-based**, not a language model | Answers only the patterns it knows |
| **Feedback has no review screen** | Officials can read it only through `GET /api/feedback` |
| **Route Planner covers Dima Hasao only**, blockages aren't saved, and "health facilities" include veterinary dispensaries | For the whole region, use Setu (which fixes all three) |
| **Hindi** covers navigation and headings only | Most text is English |
| **Near Me** depends on the public Overpass API and OpenStreetMap coverage | Can be slow or empty in remote areas |
| **Helpline numbers** are typed into the site | Verify each with state authorities before a public launch |

## Hosting

| Issue | Effect |
|---|---|
| Free Render backend sleeps after 15 minutes | First visitor waits ~1 minute (notice shown); meanwhile sample data may appear |
| 750 free hours per month per workspace, shared with Setu | Don't add keep-alive pingers |
| 0.1 CPU, 512 MB (uses ~310 MB) | Slow cold start |
| Third-party tiles and Overpass | Fair-use limits; outages blank maps or Near Me |

## Security

- No limit on failed login attempts; no two-factor login.
- Login tokens in `localStorage`; no server-side logout before the 12-hour
  expiry.
- The feedback rate limit trusts the first `X-Forwarded-For` entry, which a
  client can fake.
- Prediction endpoints have no rate limit.
- Feedback rows saved before 7 October 2026 may contain raw IP addresses.

## Code

| Issue | Note |
|---|---|
| **`class=` instead of `className=`** in most components | Renders fine; React warns per element. Mechanical fix, see [Frontend](08-frontend.md#code-note-class-instead-of-classname) |
| **No automated tests** | Setu has a pytest suite to copy from |
| Theme inverts parts of the Tailwind palette | Use `gov-*` colours for new UI |
