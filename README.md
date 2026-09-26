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
  crediting the six-person project team (placeholder names — edit
  `AboutCredits.tsx`).
- **Alert dispatch groundwork**: `alerts_dispatch.py` has real
  integration code for MSG91/Twilio/Firebase push, not wired to a live
  account since that needs your credentials — see SETUP.md's alerts
  section for the concrete trade-offs.
- **3D terrain maps**: both the Authority Risk Map and the public Near
  Me map now have a 2D/3D toggle (MapLibre GL + free AWS terrain tiles,
  no API key). Verified with a real headless-browser test, not just
  "should work" — see SETUP.md §9.
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
