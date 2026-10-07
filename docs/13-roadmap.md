# 13. Roadmap

What to build next, in rough order of value.

## Before the next demo

| Task | Why |
|---|---|
| **Make live zones meaningful:** score the 17 points from live or forecast rainfall, or from a clearly labelled scenario date, and give them real place names | With the real backend everything shows LOW today ([Known issues](12-known-issues.md)) |
| **Label sample data** visibly when the site falls back to it | Honesty in front of judges |
| **Default the Live Monitoring simulation off**, or label it | It looks like real telemetry |
| **Full Hindi translation** | Multilingual requirement |
| **Verify helpline numbers** | Public safety |
| **Open the site 2 minutes early** | The free backend sleeps |

## Real alerts to phones

The integration code exists in `backend/alerts_dispatch.py` for three
options; none is connected, because each needs an account only the team can
create.

| Option | Pros | Cons |
|---|---|---|
| **Firebase Cloud Messaging (push)** | Free, fast to set up, no telecom registration | Reaches only people who installed the app/site and allowed notifications |
| **MSG91 (SMS)** | What most Indian government and enterprise senders use; reaches any phone | Requires **DLT** (Distributed Ledger Technology) template registration, a regulatory step for SMS to Indian numbers that takes days |
| **Twilio (SMS)** | Simplest signup, global | Not DLT-registered for India by default; Indian carriers may filter messages at scale |

**Suggested path:** push notifications first (for anyone using the site),
SMS second once DLT registration is done. Real Indian alert systems (for
example NDMA's SACHET) rolled out in phases like this.

**What's needed in the code:**

1. A `subscribers` table: phone number and/or device token, district,
   consent time.
2. Make **Subscribe for Alerts** save to it (with consent text and an
   unsubscribe path).
3. In `POST /api/alerts/notify`, load the zone's district subscribers instead
   of the empty list, and call `alerts_dispatch.send_alert()`.
4. Provider keys as Render environment variables (`MSG91_AUTH_KEY`,
   `MSG91_TEMPLATE_ID`, or `TWILIO_*`, or `GOOGLE_APPLICATION_CREDENTIALS`).
5. Rate-limit and log every dispatch.

## Better models

| Task | Why |
|---|---|
| **Real rainfall for the NER model** (IMD gridded data or the Open-Meteo archive) at real landslide dates, with labels from the NASA catalogue, ISRO's Landslide Atlas and GSI inventories | Replace synthetic training data |
| **Finer slope and terrain** (30 m DEM), geology and land cover | Slope from the current grid is far too flat |
| **Live rainfall in "risk today"** for the India-wide/Regional models (or a combined model) | So risk reacts to weather; Setu benefits directly |
| **A training script for the NER model** in the repo | Reproducibility |
| **Proper evaluation:** spatial cross-validation (hold out whole areas), calibration of probabilities | Today's metrics flatter the models |
| **Use ASDMA road-failure records** once obtained officially | Ground truth for roads |

## Product

| Task | Why |
|---|---|
| Save **citizen hazard reports** to the backend, with photo and GPS, reviewed by officials (Setu already has this flow to reuse) | Reports currently go nowhere |
| **Feedback review screen** in the authority console | Data exists, no UI |
| Real **shelters** and **highway corridor** data from state disaster authorities | Replace demo data |
| A real assistant (an LLM on the backend, grounded in the dashboard's data), keeping the key server-side | The current one is rule-based |

## Engineering

| Task | Why |
|---|---|
| **pytest suite** like Setu's | No automated tests |
| `class=` → `className=` across components | Correct React; no console warnings |
| Rate-limit failed logins and prediction endpoints; use the proxy-added client IP | Security |
| Data-retention policy and privacy notice | Feedback contains personal data |

## Integration with Setu

BhooSuraksha already serves Setu's landslide risk. Next: share the citizen
hazard-report flow with Setu's field reports, and feed live rainfall-driven
risk to Setu's routing (flag roads in high-risk zones before they fail).
