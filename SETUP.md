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

### Using Turso instead of the local database

You mentioned already using Turso for your blog. The auth system
(`backend/auth.py`) uses plain sqlite by default, in the same
sqlite-wire-protocol family Turso speaks. To point it at your Turso
database instead:

```bash
pip install libsql-experimental
```

Then in `auth.py`, replace the `_connect()` function's body with:
```python
import libsql_experimental as libsql
conn = libsql.connect(
    os.environ["TURSO_DATABASE_URL"],
    auth_token=os.environ["TURSO_AUTH_TOKEN"],
)
```
Everything else (`create_user`, `verify_login`, `issue_token`,
`decode_token`) stays exactly the same — the API surface matches
sqlite3 closely enough that nothing else needs to change. Set
`TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` as environment variables
wherever you deploy the backend.

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
anything else.

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

## 7. Deploying so nothing lags

**Backend** (FastAPI): Render, Railway, or Google Cloud Run all work well
and are essentially "point at your GitHub repo, it builds and runs."
Cloud Run is the natural pick since you already have Google Cloud:
```bash
cd backend
gcloud run deploy landslide-backend --source . --region asia-south1 --allow-unauthenticated
```
(`asia-south1` = Mumbai — pick whichever Google Cloud region is closest
to your users to cut latency.) Set `AUTH_SECRET` and, if using Turso,
`TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` as environment variables in the
Cloud Run service config, not committed to the repo.

**Frontend**: Vercel or Netlify — both auto-detect Vite, `npm run build`,
serve the `dist/` folder over a CDN. This is what actually prevents lag:
static assets served from edge locations near your users, rather than a
single server.

**Connecting them**: after both are deployed, set the frontend's Settings
→ Backend URL to your Cloud Run URL, or bake it in as a default via
`window.ENV_BACKEND_URL` in `index.html` so users don't have to set it
manually.

**CORS**: `backend/app.py` currently allows all origins
(`allow_origins=["*"]`). Once you have a real frontend domain, restrict
it to that domain — leaving it wide open in production is a real
security gap, not just a style choice.

**What actually causes lag in an app like this**: the map tile requests
(CARTO/OSM, already fast and free) and the `/api/zones` call scoring 17
points through a RandomForest on every request — at this scale (17
points, a few hundred trees) that's milliseconds, not a bottleneck. If
you scale to thousands of monitored points, cache `/api/zones`'s result
for a minute or two instead of recomputing on every request.

## 8. Team credits

`frontend/src/components/AboutCredits.tsx` has a floating (i) icon,
bottom-left of every page, opening a modal styled as a small "regional
disaster-preparedness initiative" credit. I put in placeholder names
(`Member 1`...`Member 6`) since I don't have your teammates' real names —
open that file and edit the `TEAM` array with the actual six names.
