# 8. Frontend

React 19 + TypeScript, built with Vite 6, styled with Tailwind CSS 4, in
`frontend/`. Run with `npm install` then `npm run dev` (http://localhost:3000).

## Routes

Defined in `src/main.tsx`, all inside `GlobalChrome` (utility bar,
navigation, footer, language chooser, wake-up notice).

| Path | Renders |
|---|---|
| `/` | `pages/Home.tsx` |
| `/citizen`, `/citizen/:tab` | `App.tsx`, citizen portal (`safe-status`, `near-me`, `routes`, `report-hazard`, `shelters`, `guidelines`) |
| `/authority`, `/authority/:tab` | `App.tsx`, authority console (`dashboard`, `route-planner`, `monitoring`, `risk-map`, `alerts`, `analytics`, `reports`, `settings`); requires login |
| `/login` | `pages/Login.tsx` |
| `/feedback`, `/contact`, `/sitemap` | The matching page |
| anything else | `App.tsx` |

Browser back/forward work, because tabs are real URLs.

## Folder layout

```
src/
├── main.tsx              routes and providers; imports Leaflet's CSS
├── App.tsx               citizen portal + authority console shell, data loading, demo simulation
├── index.css             Tailwind + the government-portal theme (@theme)
├── components/
│   ├── GlobalChrome, TopUtilityBar, GovNav, Navbar, Sidebar, gov/   layout
│   ├── KpiCards, EarlyWarningBanner, AlertPanel, ZoneDetailPanel     dashboard
│   ├── GisMap (2D), TerrainMap3D (3D)                                maps
│   ├── LiveMonitoringPanel, AnalyticsPanel, ReportsPanel, SettingsPanel
│   ├── PredictionModal   prediction workbench + model performance
│   ├── RoutePlanner      Dima Hasao route planner
│   ├── AiChatbot         rule-based assistant
│   ├── AboutCredits, TeamMemberLinks, LanguageChooserModal, ServerWake
│   └── citizen/          CitizenPortal, CitizenSafetyStatus, NearMeMap, HighwayCorridorChecker,
│                         CitizenReportHazard, ReliefSheltersView, SafetyGuidelinesView, SubscribeForAlerts
├── context/              AuthContext, LanguageContext, A11yContext
├── services/             api.ts, predictionService.ts, logistics.ts, aiChatService.ts
├── utils/                backendUrl.ts, serverWake.ts, geoDistance.ts
├── data/                 mockData.ts, citizenData.ts (demo data), team.ts, links.ts
└── types/landslide.ts    shared types
```

## Where the backend is

`utils/backendUrl.ts`, in this order:

1. an address saved in **Settings → Backend URL** (or on the login page),
   kept in the browser as `ner_landslideguard_backend_url`;
2. `VITE_BACKEND_URL`, built into the site at build time (set it in Vercel);
3. nothing: the site runs on sample data.

`VITE_BACKEND_URL` is baked in at build time: change it, then redeploy.

## Sample-data fallback

`services/api.ts` asks the backend for zones, alerts and analytics. If no
backend is configured, **or the request fails**, it quietly returns the
built-in sample data from `data/mockData.ts` (marked *"DEMO / PROTOTYPE DATA
ONLY"*). That keeps the site usable offline and in demos, but a visitor
can't tell which they are seeing. Predictions behave like this:

| Model | Without a backend |
|---|---|
| NER Station | A simple heuristic in the browser (`mockPredictLandslideRisk`) |
| India-wide, Regional | Not available (error message) |

Citizen hazard reports, highway corridors and shelters always come from
`data/citizenData.ts`.

## The wake-up call

The free backend sleeps (Render). `utils/serverWake.ts` pings `/health` when a
page opens, retries every 2.5 s for up to 90 s, and `<ServerWake />` shows
*"Waking up the server…"* after 3 s, *"Connected."* when it answers (only if
it had to wait), or *"Can't reach the server right now. Showing sample data
until it's back."* with *Try again*. Every backend call in `services/` and
the login waits for this ping (`waitForServer()`), so requests don't fail
while the server boots. There is no keep-alive timer.

## Demo simulation

`App.tsx` runs a **simulation that is on by default**: every 8 seconds it
nudges each zone's 24-hour rainfall and soil moisture by a small random
amount, so the Live Monitoring panel looks alive. It does not change the
model's risk scores. It can be switched off in the console. It is not sensor
data.

## Maps

- **2D:** `GisMap.tsx` (authority risk map), `NearMeMap.tsx` (public),
  `RoutePlanner.tsx`: Leaflet with OpenStreetMap tiles. Leaflet's CSS is
  bundled from npm (in `main.tsx`); loading it from a CDN broke layer order
  and road clicks.
- **3D:** `TerrainMap3D.tsx`, shared by the risk map and Near Me: MapLibre GL
  with OpenFreeMap's `liberty` style, 3D buildings, AWS Terrarium terrain with
  hillshading, and risk zones as 3D columns.
  - The MapLibre worker is bundled explicitly (`?worker&url` import +
    `setWorkerUrl`, `worker: { format: 'es' }` in `vite.config.ts`). Without
    it the worker 404s and terrain silently never renders.
  - 3D layers are added on `style.load`, not `load` (which waits for every
    tile; one stalled tile used to mean no 3D layers).

## Translation

`context/LanguageContext.tsx` has a `DICTIONARY` with `en` and `hi` for each
key; components call `t('key')`. Saved as `bhoosuraksha_language`. Only
navigation, headings and the wake-up notice are translated; add keys and
replace hard-coded strings to translate more.

## Accessibility

`context/A11yContext.tsx` stores the settings (`bhoosuraksha_a11y_settings`)
and applies a CSS class or variable for each: high contrast, big cursor,
highlighted links, reading-friendly font, line/letter spacing, reduced motion,
font size.

## Theme and links

- The light government theme is the `@theme` block at the top of
  `src/index.css`: `gov-navy`, `gov-saffron`, `gov-green`, `gov-page`, and the
  standard Tailwind scales remapped for a light UI.
- External links (repo, docs, ISRO Landslide Atlas, NDMA) are in
  `data/links.ts`. Team members (About modal and Contact page) are in
  `data/team.ts`; edit once, both update.

## Browser storage keys

| Key | Holds |
|---|---|
| `auth_token`, `auth_user` | Login session |
| `ner_landslideguard_backend_url` | Backend address override |
| `bhoosuraksha_language` | `en` or `hi` |
| `bhoosuraksha_a11y_settings` | Accessibility settings |

## Code note: `class=` instead of `className=`

Most components use `class="..."` in JSX instead of React's `className`. The
site renders correctly (React passes the attribute through and browsers apply
it), but React logs a warning per element and some tools expect `className`.
Fixing it is a mechanical find-and-replace across the `.tsx` files
(`class="` → `className="`, `class={` → `className={`), then `npm run lint` and
a visual check. Setu already uses `className` everywhere.

## Build and deploy

```bash
npm run lint      # TypeScript check
npm run build     # production build into dist/
npm run preview   # serve the build
```

`frontend/vercel.json` runs `npm install` and `npm run build`, serves `dist/`,
and sends every path to `index.html` (so `/authority/alerts` or
`/citizen/near-me` open directly). `frontend/.env.example` lists the one build
variable, `VITE_BACKEND_URL`.
