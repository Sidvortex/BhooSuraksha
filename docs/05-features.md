# 5. Features

Every screen of BhooSuraksha, what it does, and where its data comes from.
"Backend" means the real FastAPI backend; "demo data" means data built into
the website (`frontend/src/data/`).

## Public site (no login)

### Home (`/`)

- Hero section and six quick-service tiles: District Safety Status, Near Me,
  Report a Hazard, Highway Corridors, Evacuation Shelters, Safety Guidelines.
- **Current landslide alerts** next to the **emergency helplines**. Alerts
  come from `GET /api/alerts` (backend), or demo data if the backend can't be
  reached.
- **Warning signs of a landslide** (traditional early indicators):
  - **New cracks** in the ground, roads, walls or foundations, or bulging soil
    at the base of a slope.
  - **Tilting trees and poles**: trees, fences or utility poles suddenly
    leaning downhill.
  - **Water changes**: new springs or seepage, or stream water suddenly
    turning muddy.
  - **Rumbling sounds**: a faint rumble that grows louder, or trees cracking
    with no wind.
- About and data-source sections.

A **Latest Alerts ticker** under the navigation bar shows the same alerts on
every page.

### Citizen portal (`/citizen/<tab>`)

| Tab | What it shows | Data |
|---|---|---|
| **My Safety Radar** (`safe-status`) | District safety status: whether the person is in or near an active danger zone; includes the **Subscribe for Alerts** form | Zones from the backend; subscription is not saved anywhere yet |
| **Near Me** (`near-me`) | The person's location (browser GPS), monitored risk zones and real **hospitals, police stations and military establishments within 100 km**, on a 2D or 3D map | Zones from the backend; facilities live from OpenStreetMap (Overpass API), up to 40 |
| **Highway Corridors** (`routes`) | Passability of major hill corridors, blockages and bypasses | Demo data |
| **Report Ground Hazard** (`report-hazard`) | Form for cracks, rockfall, springs or road blocks | Kept in the page only; not sent to the backend |
| **Evacuation Shelters** (`shelters`) | Relief camps with capacity and contacts | Demo data |
| **Safety Protocols** (`guidelines`) | What to do before, during and after a landslide | Built-in text |

The 100 km radius is one constant (`RADIUS_KM` in `NearMeMap.tsx`) that drives
the map framing, the facility search and the zone filter.

### Other public pages

- **Feedback** (`/feedback`): name, email (both optional), category and
  message → `POST /api/feedback`. Limited to 5 submissions per hour per
  visitor (HTTP 429 after that). Officials can read feedback through the API
  (`GET /api/feedback`); there's no screen for it yet.
- **Contact** (`/contact`): the six team members with their links, from
  `frontend/src/data/team.ts`.
- **Sitemap** (`/sitemap`).
- **About / credits**: a floating (i) button, bottom-left, opens the team
  modal.

### Site-wide

- **Government-portal layout:** tricolour strip, bilingual branding band
  (भूसुरक्षा | BhooSuraksha), navy navigation with dropdowns (About, Citizen
  Services, Resources) that work with mouse, keyboard and a mobile menu,
  breadcrumb band, multi-column footer. Fonts: Noto Sans and Noto Sans
  Devanagari. The site says *"A student initiative · Not an official
  Government of India website"* and uses an original shield-and-slope logo.
- **Language:** English / हिंदी with a first-visit chooser; navigation and
  headings only so far.
- **Accessibility tools** (top bar): high contrast, big cursor, highlighted
  links, reading-friendly font, extra line and letter spacing, reduced motion,
  text size (A-/A/A+), each driving real CSS and remembered in the browser.
- **Waking-up notice** while the free backend starts (see
  [Frontend](08-frontend.md#the-wake-up-call)).

## Authority console (`/authority/<tab>`, login required)

Click **Login** (top right), sign in with an account made by
`backend/create_admin.py`. Visiting `/authority/...` without a login redirects
to `/login`; the backend also checks the login on protected endpoints.
Sessions last 12 hours.

| Tab | What it does |
|---|---|
| **Dashboard** | KPI cards, early-warning banner when risk is high, alerts panel, risk map and zone details |
| **Route Planner** | Routing on the Dima Hasao road network (see below) |
| **Live Monitoring** | Environmental parameters per zone. **By default a demo simulation nudges rainfall and soil moisture every 8 seconds**; it can be switched off. No real sensors are connected |
| **Risk Map** | All monitored zones on a 2D map or a 3D terrain map (see below) |
| **Alerts & Reports** | Alert feed and timeline, citizen reports, and **Alert authorities** for a zone |
| **Analytics** | State-level summaries and the NER model's real hold-out performance |
| **Reports** | Disaster-management bulletins generated from the dashboard's data |
| **Settings** | System settings, including the **Backend URL** override |

### Prediction workbench

The blue **Run Prediction** button opens the workbench. A **Prediction
Model** dropdown chooses:

- **NER Station Model:** pick a monitored point, set 24-hour and 7-day
  rainfall and slope → `POST /api/predict`. Without a backend it uses a simple
  heuristic in the browser instead.
- **India-wide Model:** any latitude/longitude in India and a date →
  `POST /api/predict/india` (needs the backend).
- **Regional Model:** any point in India, Nepal, Bhutan, Myanmar, Bangladesh
  or Tibet and a date → `POST /api/predict/region` (needs the backend).

Each answer shows probability, risk level, confidence, the factors that
mattered and a plain-language explanation. A **Model Performance** tab shows
each model's real metrics from `GET /api/models`.

### Alert authorities

On an alert, **Alert authorities** calls `POST /api/alerts/notify` (login
required). The backend looks up the zone and calls the dispatch code, but no
subscriber list or SMS/push provider is connected, so it honestly reports
**0 recipients** with a note. Making it real is described in
[Roadmap](13-roadmap.md#real-alerts-to-phones).

### Route Planner (Dima Hasao pilot)

The first version of what became Setu, on the Dima Hasao (Assam) rural-road
network built by `data-pipeline/build_road_graph.py` (2,214 km, 87.7%
connected):

- Pick a start and destination (health facilities, the largest villages, or a
  point on the map) to get the fastest route, distance and travel time.
- Click any road to mark it blocked: the route recalculates, showing the
  detour and extra minutes, or **"Cut off — no route"**.
- For the blocked roads, it shows who loses road access from the district HQ:
  people, villages and facilities, health facilities called out.
- Blockages here are not saved (they live in the page), and "health
  facilities" still include veterinary dispensaries (Setu fixed both).

For the whole North East, use [Setu](https://github.com/Sidvortex/Setu).

### AI assistant

A chat panel answers questions such as "Which areas are at highest risk?" or
"What should authorities do if probability exceeds 80%?" from the dashboard's
current data. It is a **rule-based responder in the browser, not a language
model**, and labels its answers as prototype output.

## Maps

| | |
|---|---|
| 2D | Leaflet with OpenStreetMap tiles |
| 3D | MapLibre GL: OpenFreeMap `liberty` vector base map, **3D buildings** from OpenStreetMap heights (zoom 14+ in towns; sparse in villages; default height when untagged), **terrain relief and hillshading** from AWS Terrarium tiles, and **risk zones as 3D columns** whose height and colour follow risk probability (they shrink as you zoom in so buildings stay readable) |
| Where | Authority Risk Map and the public Near Me map, each with a 2D/3D toggle (`TerrainMap3D.tsx`) |

All map sources are free and need no API key.
