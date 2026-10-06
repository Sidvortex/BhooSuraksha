# NER LandslideGuard

A landslide risk monitoring & early warning system for India's North
Eastern Region and its Himalayan-border neighbors, with a public safety
site and a real-login Authority Command Center.

**For step-by-step setup — including auth, deployment, and the alerts
question — see [SETUP.md](./SETUP.md).**

## What's in here

```
landslide-project/
├── backend/
│   ├── app.py                    API endpoints
│   ├── auth.py                   Real login system (bcrypt + JWT + sqlite/Turso)
│   ├── create_admin.py           Script to create authority accounts
│   ├── alerts_dispatch.py        Ready-to-wire SMS/push integration code
│   ├── model.py                  Model 1: NER rainfall + slope
│   ├── india_model.py            Model 2: India-wide seasonal/regional
│   ├── region_model.py           Model 3: India + Himalayan border countries
│   ├── zones.py / metrics.py     Real live zone scoring + hold-out metrics
│   ├── training/                 Training scripts + real source data
│   ├── models/                   Pre-trained .pkl files (all three models)
│   ├── README_INDIA_MODEL.md     Full writeup of Model 2
│   ├── README_REGION_MODEL.md    Full writeup of Model 3
│   └── requirements.txt
├── frontend/                     React + TypeScript + Leaflet + React Router
└── SETUP.md
```

## Three models now

| | NER Station | India-Wide | Regional |
|---|---|---|---|
| File | `model.py` | `india_model.py` | `region_model.py` |
| Data | Rainfall + slope, 17 NER points | 1,265 real events, India (NASA GLC) | 1,886 real events, India + Nepal + Bhutan + Myanmar + Bangladesh + Tibet |
| Coverage | North Eastern Region | All of India | India + hilly border countries |
| ROC-AUC | 0.952 | 0.841 | 0.834 |

All three are selectable from the prediction workbench's model dropdown,
each with real hold-out metrics shown in the Model Performance tab.

## What changed in this pass

- **Color theme**: recolored using the real palette from
  [soviet.nvim](https://github.com/rezniqov/soviet.nvim), applied as a
  Tailwind v4 `@theme` token override in `index.css` — one file, whole
  app, since every component already used named color tokens.
- **Fonts & readability**: switched to Source Sans 3 and raised every
  9-11px text instance to a 12px minimum.
- **Real routing**: React Router now drives navigation
  (`/`, `/citizen`, `/authority/:tab`, `/login`) — browser back/forward
  works properly, no more single-page-feel tab switching.
- **Real authentication**: the portal gateway landing page is gone,
  replaced by a government-site-style top nav with a **Login** button.
  Logging in is real — bcrypt-hashed passwords, JWT sessions, backend-
  enforced route protection (see `backend/auth.py`).
- **Third model**: expanded the India-wide model's approach to cover the
  hilly belt actually connected to India's borders (Nepal, Bhutan,
  Myanmar, Bangladesh, Tibet), using more real NASA GLC data.
- **About/Credits**: a floating (i) button, bottom-left, opens a modal
  crediting the six-person project team with real names and links
  (from `frontend/src/data/team.ts`).
- **Alert dispatch groundwork**: `alerts_dispatch.py` has real
  integration code for MSG91/Twilio/Firebase push, not wired to a live
  account since that needs your credentials — see SETUP.md's alerts
  section for the concrete trade-offs.
- **3D maps**: both the Authority Risk Map and the public Near Me map have a
  2D/3D toggle — vector base map, 3D buildings, terrain relief with
  hillshading, and risk zones as 3D columns (MapLibre GL + free OpenFreeMap
  and AWS terrain data, no API key). See SETUP.md §9.
- **Public map radius: 40km → 100km**, one constant, drives the map
  zoom, the nearby-facility search, and the zone filter together.
- **Accessibility toolbar**: real, working toggles (high contrast, big
  cursor, link highlighting, reading-friendly font, line/letter spacing,
  reduced motion, font size) — every one drives actual CSS, not
  decoration. Lives in the top utility bar (not a floating button, which
  used to physically collide with the Authority sidebar).
- **Language toggle** (English/हिंदी) with a first-visit chooser, for
  navigation/header copy — see SETUP.md §11 for the honest scope note
  on what's translated and what isn't yet.
- **Feedback system**: a real public form with real rate limiting
  (5/hour/IP, backend-enforced, verified live), stored the same way
  auth accounts are.
- **Contact & Sitemap pages**.

## Route Planner (logistics — SIH)

Authority dashboard → **Route Planner**. Runs on the real Dima Hasao rural-road
network built by `data-pipeline/` (PMGSY GeoSadak, 2,214 km, 87.7% connected).

- Pick a start and destination (health facilities, largest villages, or click
  the map) to get the fastest route, distance and travel time.
- Click any road to mark it blocked: the route recalculates, showing the detour
  and extra minutes, or **"Cut off — no route"**.
- For any set of blocked roads it shows who loses road access from the district
  HQ: people, villages, facilities (health facilities called out).
- Real example: blocking the one road out of Haflong cuts the HQ off from
  1,52,435 people, 644 villages and 311 facilities, including 19 health.

API: `backend/logistics.py` (`/api/logistics/network`, `/places`, `/route`,
`/impact`). Travel times use assumed hill-road speeds; blockages are entered by
the user for now (field reports will feed them later).

## UI redesign: government-portal style

The whole interface was rebuilt in the layout Indian government portals
use (ISRO, IRCTC, india.gov.in), on a light theme:

- **Header**: tricolour strip, a white bilingual branding band
  (भूसुरक्षा | BhooSuraksha), and a navy navigation bar with dropdown
  menus (About, Citizen Services, Resources) that work on hover, keyboard
  focus, and a hamburger menu on mobile.
- **Latest Alerts ticker** under the nav, fed by live `/api/alerts`.
- **New home page** (`/`): hero, six quick-service tiles, current alerts
  beside emergency helplines, the warning signs of a landslide, and
  About / Data sources sections.
- **Breadcrumb + page-title band** on every inner page.
- **Multi-column navy footer** with services, resources (ISRO Landslide
  Atlas, NDMA, docs, source) and helplines.
- **Authority console** restyled as a navy MIS-style header over white
  cards; the login page gets the same header and a navy-topped login card.
- **Fonts**: Noto Sans + Noto Sans Devanagari, so Hindi renders properly.

Deliberate choices: the site says "A student initiative · Not an official
Government of India website" (the old header claimed "Government of
India", which a non-government project must not do), and it uses an
original shield-and-slope logo instead of the State Emblem, whose use is
legally restricted to government bodies.

## What's real vs. still a placeholder

✓ Real: all three trained models, live zone/alert/analytics scoring, the
map (free tiles, no key, now with a verified 3D mode), the AI assistant
(local rule-based, not an LLM), real authentication, and the accessibility/
feedback/rate-limiting systems described above.

✗ Still placeholder: live rainfall/soil-moisture/NDVI ingestion, a
production spatial database (Turso swap-in documented but not required),
actual SMS/push delivery (integration code is real, provider account is
not yet connected), Firebase Auth (documented as an alternative, not
implemented), and full-app Hindi translation (navigation/headers are
real; most page content isn't translated yet). One pre-existing issue
worth knowing about: the whole codebase uses `class=` instead of React's
`className=` in JSX — cosmetically harmless (renders fine) but not
technically correct; see SETUP.md §12 for the fix if you want it.

## Team

| Name | Role | Responsibilities | GitHub | LinkedIn |
|---|---|---|---|---|
| Ravada Siddharth | Project Lead | Model implementation, prediction & analytics, deployment, testing, GIS/mapping, authentication, backend/database, real-time environmental data, AI assistant | [Sidvortex](https://github.com/Sidvortex) | [LinkedIn](https://www.linkedin.com/in/siddharth-ravada-a032b52a2/) |
| Mala Kumari | Member | Real-time environmental data, backend/database, authentication, testing | [mala9311](https://github.com/mala9311) | [LinkedIn](https://www.linkedin.com/in/mala-kumari-930aa9295/) |
| Vinayak Kapoor | Member | Documentation, testing | [vinayak605](https://github.com/vinayak605) | [LinkedIn](https://www.linkedin.com/in/vinayak-kapoor-0a47b2380) |
| Ayush Mishra | Member | Testing, documentation, deployment | [ayush77-pro](https://github.com/ayush77-pro) | [LinkedIn](https://www.linkedin.com/in/ayush-mishra-53bb99311) |
| Arpit Kumar | Member | Prediction & analytics, model implementation, testing, citizen platform, backend/database | [arpitkumar1275hacker](https://github.com/arpitkumar1275hacker) | [LinkedIn](https://www.linkedin.com/in/arpit-kumar1) |
| Vidit Sharma | Member | Citizen platform, testing, prediction & analytics, model implementation, authentication | — | [LinkedIn](https://www.linkedin.com/in/vidit-sharma-a58471324) |

The same team data powers the site's About modal and Contact page —
edit `frontend/src/data/team.ts` to change it in both places.

## Setup

See **[SETUP.md](./SETUP.md)**. Short version:

```bash
# backend
cd backend && pip install -r requirements.txt
python create_admin.py yourname yourpassword
uvicorn app:app --reload --port 8000

# frontend
cd frontend && npm install && npm run dev
```

Then: Settings → Backend URL → `http://localhost:8000`, then Login (top
right) with the account you just created.
