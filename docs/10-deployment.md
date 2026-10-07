# 10. Deployment

BhooSuraksha is deployed on free plans, alongside Setu.

| Part | Host | Plan |
|---|---|---|
| Backend (`bhoosuraksha-api`) | Render | Free |
| Website | Vercel | Hobby (free) |
| Database (accounts, feedback) | Turso | Free (its own database, separate from Setu's) |

Setu's full step-by-step guide covering both projects is in Setu's
`docs/09-deployment.md`. This page has everything specific to BhooSuraksha.

**Never paste tokens, passwords or secrets into chats, issues, commits or
screenshots.**

## What "free" means

- The backend **sleeps after 15 minutes without traffic**; the next visitor
  waits about a minute while the site shows *"Waking up the server…"*. Setu
  also wakes it when Setu's backend starts.
- **750 free instance hours per month per Render workspace**, shared with
  Setu. Don't add an uptime pinger.
- The server's **disk is wiped** on sleep or redeploy, so accounts and
  feedback must be in Turso.
- **No shell on the free plan:** create accounts from your computer.
- 512 MB of memory and 0.1 CPU: BhooSuraksha uses about 310 MB.

## Files that drive the deployment

| File | Purpose |
|---|---|
| `render.yaml` | Render Blueprint: free Python web service, root `backend`, build `pip install -r requirements.txt`, start `uvicorn app:app --host 0.0.0.0 --port $PORT`, health check `/health`, region Singapore, `PYTHON_VERSION=3.12.11`, generated `AUTH_SECRET`, and three values you enter (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `ALLOWED_ORIGINS`) |
| `backend/requirements.txt` | Pinned; scikit-learn 1.8.0 for the saved models |
| `frontend/vercel.json` | Vite build into `dist/`, every path rewritten to `index.html` |
| `.python-version` | `3.12` for local tools |

## Steps

1. **Turso:** create a database named `bhoosuraksha` (Mumbai,
   `aws-ap-south-1`); note its URL and create a token.
2. **Render:** New → Blueprint → `Sidvortex/BhooSuraksha`. Enter the Turso URL
   and token, and `ALLOWED_ORIGINS` = `*` for now. Apply. Check
   `https://<bhoosuraksha-api>.onrender.com/health`.
3. **Officer accounts**, from your computer in `backend/`:

   ```bash
   pip install -r requirements.txt
   export TURSO_DATABASE_URL="libsql://bhoosuraksha-<you>.aws-ap-south-1.turso.io"
   read -rs TURSO_AUTH_TOKEN && export TURSO_AUTH_TOKEN   # Enter, paste the token on the empty line, Enter
   python create_admin.py <username>                       # asks for the password, hidden
   ```

   Use a new terminal if you just did the same for Setu, so its values aren't
   reused.
4. **Vercel:** Add New → Project → `Sidvortex/BhooSuraksha`, Root Directory
   `frontend`, environment variable `VITE_BACKEND_URL` = the Render address
   (no trailing slash). Deploy.
5. **Check:** the authority login works, and the authority Risk Map lists
   the real zones ("Monitoring Point 1"…; the sample data uses place names
   such as "Papum Pare Highway Sector 4"). With the real backend the home page
   currently says *"No active landslide alerts right now"* (see
   [Known issues](12-known-issues.md)).
6. **Lock down:** set `ALLOWED_ORIGINS` on Render to the Vercel address, e.g.
   `https://bhoosuraksha.vercel.app` (exact, `https://`, no trailing slash).
   Setu's backend is server-to-server and isn't affected.
7. **Give Setu the address:** Setu's `BHOOSURAKSHA_API_URL` is this backend's
   Render address.

## Day-to-day

| Task | How |
|---|---|
| Ship a change | Push to `main`; Render and Vercel redeploy automatically |
| Errors | Render → `bhoosuraksha-api` → Logs |
| Before a demo | Open the site 2 minutes early |
| New officer | Step 3 again; `--reset` to change a password |
| Rotate the Turso token | Invalidate tokens in Turso, create a new one, paste it into Render |
| Retrained a model | Commit the new `.pkl` and metrics files (scikit-learn 1.8.0) and push |

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `WSServerHandshakeError: 400` from `wss://…turso.io` at startup | Old `libsql-client` (WebSocket), refused by newer Turso databases | Fixed: `turso_http.py` uses HTTPS |
| `Illegal header value b'Bearer …\n'` | Token pasted with a newline | Fixed in code; re-paste without a blank line anyway |
| `RuntimeError: AUTH_SECRET must be set…` | Weak or missing secret on Render | Let the Blueprint generate it, or set 64 random characters |
| `UNIQUE constraint failed: users.username` | Account already exists | Use `--reset` |
| Site shows sample data in production | `VITE_BACKEND_URL` missing, backend asleep or down, or CORS blocked | Set it and redeploy; check `/health`; check `ALLOWED_ORIGINS` |
| Every visitor gets "Too many submissions" on Feedback | Rate limit counted the proxy's address (fixed: the visitor's address now comes from `X-Forwarded-For`) | Make sure the fixed `app.py` is deployed |
