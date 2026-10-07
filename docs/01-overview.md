# 1. Overview

## The problem

Landslides are a yearly disaster in India's North Eastern Region and the
Himalayan belt around it. Steep slopes, fragile geology and very heavy monsoon
rain combine, and road cuts make it worse. Every year landslides block
highways, bury homes and isolate villages. Two things help most:

1. **Knowing where and when risk is high**, so authorities can prepare,
   close roads or move people early.
2. **Telling people clearly** what the risk is near them, what warning signs
   to watch for, and where to go.

BhooSuraksha (भूसुरक्षा, "land safety") is a prototype that does both.

## What BhooSuraksha does

**For the public (no login):**

- **District Safety Status:** current landslide risk for monitored places.
- **Near Me:** the person's location, risk zones, and hospitals, police
  stations and military establishments within **100 km** (live from
  OpenStreetMap).
- **Report a Hazard:** cracks, rockfall, tilting trees, muddy springs.
- **Highway Corridors:** road status before travelling through the hills.
- **Evacuation Shelters:** relief camps and their capacity.
- **Safety Guidelines:** what to do before, during and after a landslide.
- **Subscribe for Alerts** (form only for now), **Feedback**, **Contact**,
  **Sitemap**, emergency helplines, and the **warning signs** of a landslide:
  new cracks; tilting trees and poles; new springs or suddenly muddy water;
  rumbling sounds.

**For authorities (login):**

- **Dashboard** with KPIs, an alerts panel and the risk map.
- **Prediction workbench:** run any of the three models for a place.
- **Risk Map** in 2D and 3D (terrain, buildings, risk zones as 3D columns).
- **Live Monitoring**, **Alerts & Reports**, **Analytics** (including real
  model performance), **Reports**, **Settings**.
- **Route Planner** on the Dima Hasao rural-road network (the first version
  of what became Setu).
- **Alert authorities** for a zone from the alerts panel (the endpoint is real
  and login-protected; no subscriber list or SMS/push provider is connected
  yet, so it reports 0 recipients).

**For other systems:** a risk API. The sister project
[Setu](https://github.com/Sidvortex/Setu) calls `POST /api/predict/region`
to show "landslide risk today" for a district and to check landslide reports.

## The three models

| | NER Station | India-wide | Regional |
|---|---|---|---|
| Question | Given recent rainfall and slope at a point, how likely is a landslide? | Given a place in India and a date, how likely is a recorded landslide? | Same, across India and its Himalayan neighbours |
| Data | Rainfall + slope series for 17 points (synthetic rainfall) | 1,265 real events (NASA catalogue, 2007–2016) | 1,886 real events: India, Nepal, Bhutan, Myanmar, Bangladesh, Tibet |
| ROC-AUC | 0.952 | 0.841 | 0.834 |

Details, limits and how to retrain: [Models](03-models.md).

## Who it is for

| User | Uses |
|---|---|
| Residents and travellers in the hills | Risk near me, warning signs, shelters, helplines |
| District disaster management staff | Risk map, alerts, predictions, analytics |
| Other platforms (Setu) | The risk API |

## What is real and what is not

**Real:** the three trained models and their hold-out metrics; zone, alert
and analytics scoring by the NER model; logins (bcrypt + JWT, stored in
Turso); the feedback system with rate limiting; the Near Me search; the 2D/3D
maps; the Dima Hasao route planner; the deployment.

**Not real yet, or simulated:**

- No live weather, soil-moisture or satellite feeds. The NER model's zones are
  scored from the latest day in its dataset (31 December 2018), so with the
  real backend all 17 points currently show LOW risk.
- The NER model was trained on a **synthetic** rainfall series; its high
  ROC-AUC says little about real-world skill.
- Citizen hazard reports, highway corridors, shelters and alert subscriptions
  use built-in demo data and are not saved on the server.
- No SMS or push messages are sent; the integration code exists but no
  provider is connected.
- The "AI assistant" is a rule-based responder, not a language model.
- When the backend can't be reached, the site quietly shows built-in sample
  data.
- Hindi covers navigation and headings only.

The full list is in [Known issues](12-known-issues.md).

## Name

The project started as *NER LandslideGuard* (code name `landslide-ews`) and was
renamed **BhooSuraksha**. The site states *"A student initiative · Not an
official Government of India website"* and uses an original logo, not the
State Emblem.
