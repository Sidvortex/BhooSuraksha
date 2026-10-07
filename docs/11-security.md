# 11. Security

## Officer logins

- **No public sign-up.** Accounts are made with `backend/create_admin.py`.
- **Passwords:** bcrypt with a random salt per password; at least 10
  characters; `create_admin.py` asks for them without showing them and can
  `--reset` them.
- **Sessions:** JWTs signed with `AUTH_SECRET` (HS256), valid for 12 hours,
  checked by the backend on every protected endpoint
  (`Depends(auth.require_auth)`): `/api/auth/me`, `/api/alerts/notify`,
  `GET /api/feedback`. The authority pages also redirect to `/login`, but the
  backend check is the real protection.
- **Startup guard:** on Render (or with `BHOOSURAKSHA_ENV=production`) the
  backend refuses to start if `AUTH_SECRET` is the development default or
  shorter than 32 characters. Use a different secret from Setu's.

Gaps: no limit on failed logins, no two-factor login, tokens kept in the
browser's `localStorage` (readable by any script on the page), no server-side
logout before expiry.

## Secrets

| Secret | Lives in | Never |
|---|---|---|
| `AUTH_SECRET` | Render (generated) | git, chat, shared with Setu |
| `TURSO_AUTH_TOKEN` | Render; your terminal only while creating accounts | git, chat, screenshots |
| Future SMS/push keys (MSG91, Twilio, Firebase) | Render | git, the frontend |
| Officer passwords | The person | Visible commands, chat |

- `.env` files and `*.db` files are git-ignored (`backend/data/*.db`).
- Enter tokens with `read -rs TURSO_AUTH_TOKEN && export TURSO_AUTH_TOKEN` so
  they stay out of shell history.
- If a token or password is ever shown anywhere, replace it (Turso:
  invalidate tokens and create a new one; passwords: `--reset`) and clear
  shell history (`history -c`).
- Connection errors can print the token inside the `Authorization` header.
  Delete those lines before sharing logs.

## CORS

`ALLOWED_ORIGINS` limits which websites' pages a browser lets call the API.
Set it to the BhooSuraksha website's address in production. It stops other
websites from using their visitors' browsers against the API; it does **not**
stop scripts or `curl`, which ignore CORS. Setu's backend calls BhooSuraksha
server-to-server and isn't affected.

## Public endpoints

| Endpoint | Protection |
|---|---|
| `POST /api/feedback` | 5 per hour per visitor (HTTP 429); empty messages rejected |
| `POST /api/predict`, `/api/predict/india`, `/api/predict/region` | None: anyone can call them. They are read-only, but heavy use would cost free hosting hours |
| `GET /api/zones`, `/api/alerts`, `/api/analytics`, `/api/models`, `/api/logistics/*` | Read-only |

**Feedback rate limit:** the visitor is identified by the first address in
`X-Forwarded-For` (Render's proxy adds it), stored only as
`sha256(AUTH_SECRET + "|" + ip)` cut to 32 characters. Raw IPs are not stored.
A client can fake that header to get around the limit; using the address added
by Render's proxy instead is on the [Roadmap](13-roadmap.md).

(Before 7 October 2026 the limit used the connection's address, which on
Render is the proxy's, so all visitors shared one limit, and raw addresses
were stored. Rows saved before the fix may still hold raw addresses.)

## Personal data held

| Data | Why | Who sees it |
|---|---|---|
| Officer usernames | Login | Officials |
| Feedback name and email (both optional) and message | Follow-up | Officials, via `GET /api/feedback` |
| Hashed IP per feedback | Rate limit | Nobody (not reversible without the secret) |
| A visitor's location (Near Me) | Find nearby facilities | Stays in the browser; sent only to the Overpass API as the search point |

No automatic deletion yet. Before a real launch: decide retention, publish a
privacy notice.

## Input validation

Request bodies are validated by pydantic (types, required fields); invalid
input gets HTTP 422. SQL uses parameter placeholders for every value.

## Dependencies

Python packages are pinned (`requirements.txt`), npm packages locked
(`package-lock.json`). Update deliberately; scikit-learn must stay 1.8.0
unless the models are re-saved.
