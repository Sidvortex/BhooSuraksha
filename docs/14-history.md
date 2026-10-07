# 14. History

How BhooSuraksha got here, the decisions along the way, and problems fixed.

## Timeline (2026)

**The start: `landslide-ews`.** A first pipeline produced the NER dataset
(17 points, rainfall and slope, 2015–2018) and the first RandomForest model.
The web app began as an AI Studio template and was called **NER
LandslideGuard**.

**More models.** The India-wide model was added, trained on 1,265 real events
from the NASA Global Landslide Catalog; then the Regional model, extending
the same method to Nepal, Bhutan, Myanmar, Bangladesh and Tibet (1,886
events). All three became selectable in the prediction workbench, each with
real hold-out metrics.

**Real app foundations.** React Router replaced single-page tab switching
(`/`, `/citizen`, `/authority/:tab`, `/login`); a real login system replaced
the "choose a portal" page (bcrypt + JWT, backend-enforced, Turso-backed);
an About/credits modal showed the six-person team; `alerts_dispatch.py` got
real integration code for MSG91, Twilio and Firebase.

**Public safety features.** The public map became **Near Me** with real
hospitals, police stations and military establishments from OpenStreetMap;
its radius grew from 40 km to **100 km**. The SMS panel was removed from the
public pages and replaced by a compact **Subscribe for Alerts** section; an
**Alert authorities** action was added to the authority console. The
traditional warning signs of a landslide went on the home page.

**3D maps** on both the authority risk map and Near Me: terrain, hillshading,
3D buildings and risk columns, with no API keys.

**Government-portal redesign.** Inspired by ISRO, IRCTC and india.gov.in: a
tricolour strip, bilingual branding band, navy navigation with dropdowns, a
Latest Alerts ticker, a new home page, breadcrumb bands, a multi-column footer,
an accessibility toolbar, an English/हिंदी switch with a first-visit chooser,
team links, a feedback form with rate limiting, Contact and Sitemap pages. The
header stopped claiming "Government of India" and the State Emblem was
replaced by an original logo. The project was renamed **BhooSuraksha**.

**September: SIH logistics problem statement.** The team researched road and
disaster data and built `data-pipeline/`: GeoSadak roads for 8 states, the
NASA catalogue, an Open-Meteo script, ASDMA parsing, the Dima Hasao pilot
network and a **Route Planner** in the authority console. That work then
became its own project, **Setu** (first called Sampark NE), which uses
BhooSuraksha's `POST /api/predict/region` for landslide risk.
`build_region_network.py`, which builds Setu's whole-region network, stayed
here.

**7 October: deployed** on Render (backend), Vercel (website) and Turso
(database), together with Setu. Along the way: pinned dependencies with
scikit-learn fixed at 1.8.0, `VITE_BACKEND_URL` so every visitor uses the real
backend, CORS from `ALLOWED_ORIGINS`, a startup guard against weak secrets, a
wake-up notice for the sleeping free server, an HTTPS Turso client, and a
safer `create_admin.py`. AI Studio leftovers were removed, the docs were
reorganised into `docs/`, and the feedback rate limit was fixed.

## Decisions and why

| Decision | Why |
|---|---|
| Three complementary models, not one | The datasets answer different questions (weather-driven vs where/when reported); faking rainfall for 1,265 events would be guessing |
| Pseudo-absence sampling for negatives | Standard in landslide-susceptibility work when only presence records exist |
| Regional model includes only Tibet from China | The rest of China isn't connected to India's borders |
| No public sign-up | Like real government portals: staff accounts are issued, not self-registered |
| "Not an official Government of India website" and an original logo | A student project must not claim to be government or use the State Emblem |
| Public map radius 100 km | Hill-district services can be far apart; 40 km missed too much |
| Logistics moved to Setu | Judges should see a logistics platform for the logistics problem statement; landslide risk supports it |
| Free hosting | No billing for a student prototype |

## Problems found and fixed

| Problem | Cause | Fix |
|---|---|---|
| 3D terrain never rendered; Vite warned the MapLibre worker "does not exist" | The worker's URL is a runtime string the bundler can't see, so it 404'd | `?worker&url` import + `setWorkerUrl`, `worker.format: 'es'` |
| Terrain and risk columns missing on slow connections | Layers set up on `load`, which waits for every tile | `style.load` |
| Roads couldn't be clicked; map layers stacked wrongly | Leaflet's CSS loaded from a CDN | Bundled from npm |
| The floating accessibility button covered the authority sidebar's Settings item | Fixed positioning | Moved into the top utility bar |
| The top dropdown menu didn't open | Menu bug | Fixed (works on hover, keyboard and mobile) |
| The header claimed "Government of India" | Template text | Replaced with the student-initiative notice |
| The deployed site showed sample data for most visitors | The backend address existed only in each visitor's browser settings | `VITE_BACKEND_URL` built into the site |
| Models could fail to load on Render | Unpinned scikit-learn; Render's default Python is 3.14 | scikit-learn 1.8.0 pinned; `PYTHON_VERSION=3.12.11` |
| Direct links (`/authority/...`) gave 404 on Vercel | No single-page-app rewrite | `vercel.json` |
| Deploy crashed with `WSServerHandshakeError: 400` | `libsql-client` uses WebSocket, refused by newer Turso databases | `turso_http.py` over HTTPS |
| Deploy crashed with `Illegal header value b'Bearer …\n'` | Token pasted with a newline | Whitespace stripped |
| Feedback rate limit shared by all visitors on Render | It counted the proxy's address; raw IPs were stored | Visitor address from `X-Forwarded-For`, stored only as a keyed hash |
| `feedback.db` could be committed | Only `auth.db` was git-ignored | `backend/data/*.db` ignored |
| UI text said both models were "trained on real data" | Out of date, and wrong for the NER model | Corrected in the workbench |
| AI Studio leftovers (`metadata.json`, AI Studio README, unused `@google/genai`, `express`, `dotenv`, `motion` packages, Gemini env lines) | Template origin | Removed |
