# Setup Guide

## 1. Run the backend

```bash
cd backend
pip install -r requirements.txt
python create_admin.py <yourusername> <yourpassword>   # creates your login
uvicorn app:app --reload --port 8000
```

Check it:
```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/models     # should list ner, india, region
```

## 2. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the printed local URL. You'll land on the public home page. Go to
**Settings → Backend URL** and set it to `http://localhost:8000` to
connect everything to the real backend (works standalone without it too,
using mock data).

## 3. Logging into the Authority Command Center

There's no landing "choose a portal" page anymore — click **Login** in
the top nav (top-right, like a standard Indian government site), sign in
with the account you created with `create_admin.py`, and you're taken to
`/authority/dashboard`. Visiting any `/authority/*` URL directly without
being logged in redirects you to `/login` — this is enforced by real
backend authentication (JWT), not just a client-side check.

**Adding more team members' accounts**: run `create_admin.py` again with
a different username for each person. There's deliberately no public
sign-up page — the same way you can't self-register as staff on a real
government portal.

**Production**: set the `AUTH_SECRET` environment variable to a long
random string before deploying (`python -c "import secrets;
print(secrets.token_hex(32))"`) — the default is only safe for local
testing, and using it in production would let anyone forge a valid login
token.

### "Incorrect username or password" even though you're sure they're right

This almost always means **the account doesn't exist in whatever storage
the running backend is actually reading** — not a typo. The backend now
prints exactly this on every startup, so check its logs first:

```
[auth] storage: local sqlite (/path/to/backend/data/auth.db) | registered accounts: 0
[auth] No accounts exist yet - every login will fail until you run: python create_admin.py <username> <password>
```

The most common way to hit this: you ran `create_admin.py` once locally,
then deployed the backend somewhere — but `auth.db` is (correctly)
gitignored, so the deployed instance starts with zero accounts. You need
to run `create_admin.py` again, targeted at wherever the backend is
actually running (see the Turso section right below — this is exactly
the problem it solves).

### Using Turso instead of the local database

This is implemented and tested, not just documented — `backend/auth.py`
automatically switches storage based on environment variables:

```bash
pip install libsql-client   # already in requirements.txt
```

Set these two environment variables wherever your backend runs
(locally, or in your deployment platform's config):
```bash
export TURSO_DATABASE_URL="libsql://your-db-name-yourorg.turso.io"
export TURSO_AUTH_TOKEN="your-turso-token"
```

That's it — no code changes needed. With those two variables set,
`auth.py` talks to Turso instead of a local file; without them, it falls
back to local sqlite automatically. This is the fix for the ephemeral-
filesystem problem above: Turso is a real persistent database, so
accounts created with `create_admin.py` survive restarts, redeploys, and
multiple server instances — a local file does not.

**Recommended workflow**: create your Turso database once, set those two
env vars in your deployment platform, then run
`TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... python create_admin.py <username> <password>`
locally (pointed at the same Turso database) whenever you need to add a
teammate's account — you don't need to redeploy or SSH into anything.

### If you'd rather use Firebase Auth (Google Cloud) instead

Since you already have Google Cloud, Firebase Authentication is a solid
alternative to the bcrypt+JWT system above — it hands you email/password,
Google sign-in, and session management out of the box. What I'd need
from you to wire it in instead:
1. A Firebase project with Authentication enabled (email/password
   provider at minimum).
2. The web app's Firebase config object (from Firebase Console → Project
   Settings → General → Your apps).
3. A decision: keep the backend as the source of truth for
   authority-only accounts (Firebase issues the token, the backend just
   verifies it with the Firebase Admin SDK) — this is the standard
   pattern and what I'd recommend.

Tell me if you want this instead and I'll swap it in — it's a clean
substitution for `auth.py` and the `Login.tsx` page, not a rewrite of
anything else. Given you already have a working Turso-backed system
after this update, I'd only bother with this if you specifically want
Google sign-in (not just email/password).

## 4. Using all three models

Prediction workbench (blue "Run Prediction" button) → **Prediction
Model** dropdown:
- **NER Station Model** — 17 monitored points, rainfall + slope sliders.
- **India-Wide Model** — any lat/lon in India + a date.
- **Regional Model** — any lat/lon across India, Nepal, Bhutan, Myanmar,
  Bangladesh, or Tibet + a date. See `backend/README_REGION_MODEL.md`.

## 5. Do landslides actually occur in the Western and Eastern Ghats?

Yes — confirmed by the real data now in this project. The Western Ghats
(Kerala, Karnataka, Goa, Maharashtra, Tamil Nadu) and Eastern Ghats
(Odisha, Andhra Pradesh) both have real recorded events in the India
dataset: Maharashtra (70), Kerala (50), Tamil Nadu (40), Karnataka (31),
Goa (22), Andhra Pradesh (21), Odisha (10). The 2018 and 2019 Kerala
floods triggered some of the deadliest landslide clusters in the Western
Ghats in recent history (Kavalappara, Puthumala) — well outside the
catalog's 2007-2016 window, so not in this dataset, but a reminder that
this region is a genuine, active risk zone and this project's India-wide
and regional models already cover it.

## 6. Sending real alerts to phones in affected districts

Not wired to a live provider — that needs an account and API key only
you can create — but `backend/alerts_dispatch.py` has real, ready
integration code for three concrete options:

- **MSG91** — the SMS provider most Indian gov/enterprise senders use;
  requires DLT (Distributed Ledger Technology) template registration,
  which is a regulatory requirement for sending commercial/transactional
  SMS to Indian phone numbers, not just a signup step. Budget a few days
  for DLT approval.
- **Twilio** — simpler to set up, works globally, but not DLT-registered
  for India by default, so Indian carriers may filter or block messages
  sent through it at scale.
- **Firebase Cloud Messaging (push)** — since you already have Google
  Cloud, this is the fastest to wire up: no telecom registration, works
  for a PWA/mobile app, but only reaches people who've installed
  something and granted notification permission, not everyone with a
  phone number in a district.

**A realistic path**: use FCM push for anyone using the app (fast, free,
already have the Google Cloud account), and treat SMS as a second phase
once you're ready to handle DLT registration — most real Indian
government alert systems (e.g. NDMA's SACHET) went through exactly this
kind of phased rollout.

Either way, you'd also need a **subscribers table** (phone/device token +
district), which isn't in this project — that's the "SMS Alert
Subscribe" citizen tab currently, but it doesn't persist anywhere yet.
Wiring it to `alerts_dispatch.py` end to end is a reasonable next step
once you've picked a provider.

## 7. Full deployment, step by step

Since you have Google Cloud already, this uses Cloud Run for the backend
and Vercel for the frontend (Cloud Run doesn't serve static SPAs as
cleanly as a CDN-based host does — Vercel/Netlify are genuinely better
suited to that half).

### 7.1 Backend → Google Cloud Run

Needs the `gcloud` CLI installed and logged in (`gcloud auth login`,
`gcloud config set project <your-project-id>`).

```bash
cd backend
gcloud run deploy landslide-backend \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars AUTH_SECRET="$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
```
(`asia-south1` = Mumbai — the closest Google Cloud region to India,
matters for latency. `--allow-unauthenticated` means the API endpoints
are public, which they need to be for the frontend to call them — your
own auth system, not Cloud Run's, is what actually protects
`/authority/*`.)

This prints a service URL like `https://landslide-backend-xxxxx-el.a.run.app`
— that's your backend's real address. Verify it:
```bash
curl https://landslide-backend-xxxxx-el.a.run.app/health
```

**If you're using Turso** (recommended — see section 3), add those two
variables to the same deploy command or afterward:
```bash
gcloud run services update landslide-backend \
  --region asia-south1 \
  --set-env-vars TURSO_DATABASE_URL="libsql://your-db.turso.io",TURSO_AUTH_TOKEN="your-token"
```
Then create your first account against that same Turso database from
your own machine (no need to redeploy):
```bash
TURSO_DATABASE_URL="libsql://your-db.turso.io" TURSO_AUTH_TOKEN="your-token" \
  python create_admin.py yourname yourpassword
```

**A Cloud Run-specific gotcha**: by default Cloud Run can scale to zero
and run multiple instances — each one gets its own empty filesystem. If
you skip the Turso setup and rely on local sqlite here, every cold start
or scale-up event effectively wipes your accounts. This is the deployed-
equivalent of the exact bug from section 3 — Turso is the real fix, not
a nice-to-have.

### 7.2 Frontend → Vercel

```bash
cd frontend
npm install -g vercel   # one-time
vercel
```
Follow the prompts (it auto-detects Vite). For the production deploy:
```bash
vercel --prod
```

Then either:
- Tell users to set the Backend URL themselves on first login (the field
  now on the Login page, saved to their browser after that), or
- Bake in a default so nobody has to: add this to
  `frontend/index.html`'s `<head>`, before your bundled script tag:
  ```html
  <script>window.ENV_BACKEND_URL = "https://landslide-backend-xxxxx-el.a.run.app";</script>
  ```
  This makes it the default for everyone, while still letting the Login
  page's field override it per-browser if needed.

### 7.3 Lock down CORS

`backend/app.py` currently allows all origins (`allow_origins=["*"]`).
Once you have your real Vercel domain, restrict it:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-app.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```
Leaving it wide open in production is a real security gap (anyone's
website could call your API from a user's browser), not just a style
preference — do this before sharing the deployed link widely.

### 7.4 What actually causes lag here, and what doesn't

- Map tiles (CARTO/OSM) — already fast, free, nothing to optimize.
- `/api/zones` scoring 17 points through a RandomForest per request — at
  this scale that's single-digit milliseconds, not a bottleneck. If you
  later monitor thousands of points, cache the result for a minute
  instead of recomputing on every request.
- Cloud Run cold starts — if the service scaled to zero and nobody hit
  it in a while, the first request after that has a few seconds of
  startup delay (loading the RandomForest pickles). Set
  `--min-instances 1` on the Cloud Run deploy if this matters for your
  demo/judging, at the cost of a small always-on charge.
- The frontend bundle is ~670KB minified — fine for a demo, but if you
  want to trim it later, code-splitting the map/chart libraries with
  dynamic `import()` would be the next real lever, not anything in this
  guide.

### 7.5 Post-deploy checklist

- [ ] `curl https://<backend-url>/health` → `{"status":"ok"}`
- [ ] `curl https://<backend-url>/api/models` → lists `ner`, `india`, `region`
- [ ] Backend startup logs show `registered accounts: N` where N ≥ 1
- [ ] Frontend loads, map tiles render, `/citizen` works with no login
- [ ] Login with a real account succeeds and lands on `/authority/dashboard`
- [ ] CORS restricted to your real frontend domain (not `*`)
- [ ] `AUTH_SECRET` is a random value, not the dev default

## 8. Team credits

The six team members (names, roles, email/GitHub/LinkedIn/portfolio) live
in one file, `frontend/src/data/team.ts`, which feeds both the floating (i)
About modal (bottom-left on every page) and the Contact page. Edit that
file and both update.

## 9. 3D maps (both public and admin)

Both the Authority Risk Map and the public Near Me map have a 2D/3D toggle,
sharing one component (`TerrainMap3D.tsx`, MapLibre GL). The 3D view shows:

- a vector base map (roads, rivers, place names) from **OpenFreeMap**
  (`liberty` style — free, no API key, no sign-up)
- **3D buildings** extruded from OpenStreetMap heights — zoom into a town
  (~zoom 14+) to see them. Coverage follows OpenStreetMap: good in cities
  like Guwahati and Shillong, sparse in remote villages; buildings with no
  height tag get a default height.
- **real terrain relief + hillshading** from AWS Terrarium elevation tiles
- **risk zones as 3D columns** — height and colour track risk probability;
  columns shrink as you zoom in so buildings stay readable

Two bugs fixed along the way, worth knowing about:

- **The maplibre web worker 404'd** in both `npm run dev` and production
  builds (the "file does not exist ... optimize deps" warning). maplibre
  locates its worker at runtime from a string, which bundlers can't see.
  The worker is what builds terrain, so 3D terrain was silently never
  rendering — the map was just tilted. Fixed by bundling it explicitly
  (`?worker&url` import + `setWorkerUrl`, and `worker.format: 'es'` in
  `vite.config.ts`). Verified: worker loads (HTTP 200) in dev and in the
  production build.
- **3D layers were set up on MapLibre's `load` event**, which waits for
  *every* initial tile. On a slow or flaky connection one stalled tile
  meant terrain and risk columns never appeared. Now uses `style.load`.

Testing note: the sandbox these changes were built in blocks the tile
domains, so imagery couldn't be seen there. What was verified with a real
headless browser: terrain on, hillshade and 3D-building layers added,
risk columns built (17 on the admin map, the in-radius zones on Near Me),
no JavaScript errors, and no control overlap.

## 10. Public map radius: now 100km

`NearMeMap.tsx`'s `RADIUS_KM` constant went from 40 to 100 — this drives
the map's zoom/framing, the Overpass API facility search radius, and the
monitored-zone distance filter, all from one place.

## 11. Accessibility toolbar, language toggle, feedback system

- **Accessibility tools** (top utility bar → "Accessibility"): high
  contrast, big cursor, link highlighting, a reading-friendly font, extra
  line height/letter spacing, reduced motion, and font-size (A-/A/A+) —
  every toggle drives a real CSS class/variable
  (`frontend/src/context/A11yContext.tsx`), persisted in localStorage.
  This replaced an earlier version that floated as a fixed button and
  physically overlapped the Authority sidebar's "Settings" nav item —
  moved into the normal document flow specifically to fix that.
- **Language toggle** (English/हिंदी), including a first-visit chooser
  modal. Scope note, stated plainly: this translates navigation, headers,
  and the highest-visibility labels — not every string in the app.
  Translating everything (every form label and helper sentence across
  ~30 components) is a much bigger job than wiring the mechanism; what's
  here is verified working for its actual scope
  (`frontend/src/context/LanguageContext.tsx`'s `DICTIONARY`), and ready
  to extend — add a key to `DICTIONARY` and call `t('your.key')` anywhere.
- **Feedback system**: a real public form (`/feedback`) posting to
  `POST /api/feedback`, stored in the same sqlite/Turso pattern as
  `auth.py`, with real rate limiting (5 submissions per IP per hour,
  verified live: the 6th attempt in a row gets HTTP 429). Authority-only
  `GET /api/feedback` to review submissions (not yet in the UI — the data
  is there, a page to browse it isn't built yet).
- **Contact Us and Sitemap pages** (`/contact`, `/sitemap`), linked from
  the top utility bar.

## 12. One thing I found while testing, not yet fixed

Running a real headless-browser check on this project (see section 9)
surfaced something worth knowing: **every component in this codebase
uses `class="..."` in JSX instead of React's `className="..."`.** This
predates this session's changes — it's been there since the original
scaffold. React logs a console warning for every element ("Invalid DOM
property `class`. Did you mean `className`?") but the app still renders
correctly, because React passes unrecognized lowercase attributes through
to the DOM directly, and browsers apply a literal `class` attribute
identically to `className` for CSS purposes. So visually nothing is
broken — but it's technically wrong React, it spams the browser console,
and some tooling (certain linters, some testing utilities) assumes
`className` is used. Fixing it is a mechanical, low-risk, whole-codebase
find/replace (`class="` → `className="`, `class={` → `className={`)
across every `.tsx` file — I didn't do it in this pass since it wasn't
part of what was asked, but it's a quick, safe follow-up if you want it.

## 13. Theme and links

- The light gov theme lives in one place: the `@theme` block at the top of
  `frontend/src/index.css`. Gov identity colours are `gov-navy`,
  `gov-saffron`, `gov-green`, `gov-page`; the standard Tailwind scales are
  remapped for a light UI there too.
- External links (repo, docs, ISRO Landslide Atlas, NDMA) live in
  `frontend/src/data/links.ts`. **`REPO_URL` assumes the repo will be
  `github.com/Sidvortex/bhoosuraksha`** — change it if the real repo name
  differs, and the header, utility bar and footer all update.

## 14. Route Planner data

The Route Planner (backend/logistics.py) loads the road network from
`backend/data/networks/dima_hasao/` at startup (~3 s). Those files are copies
of `data-pipeline/data/processed/dima_hasao/`. After re-running the pipeline
(new GeoSadak data, different tolerance), copy them across again:

```bash
cp data-pipeline/data/processed/dima_hasao/{network.graphml,roads_network.geojson,facilities.geojson,habitations.geojson,network_report.json} backend/data/networks/dima_hasao/
```

New backend dependencies: `networkx`, `shapely`, `pyproj` (already in
`requirements.txt`). Deploying to Cloud Run works as before: the network files
are inside `backend/`, so `gcloud run deploy --source backend` includes them.

Also changed: Leaflet's CSS is now bundled from npm (imported in `main.tsx`)
instead of loaded from the unpkg CDN. Without it the map layers stack wrongly
and roads can't be clicked, so it shouldn't depend on a third-party server —
especially for low-network areas.
