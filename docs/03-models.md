# 3. Models

BhooSuraksha has three landslide-risk models. All three are scikit-learn
`RandomForestClassifier`s with 300 trees and a maximum depth of 8, saved as
`.pkl` files in `backend/models/` and loaded when the backend starts. They
answer different questions from different data, so they complement each
other rather than compete.

| | 1. NER Station | 2. India-wide | 3. Regional |
|---|---|---|---|
| Code | `model.py` | `india_model.py` | `region_model.py` |
| File | `risk_model.pkl` | `india_risk_model.pkl` | `region_risk_model.pkl` |
| Question | Given recent rainfall and slope at a point, how likely is a landslide? | Given a place in India and a date, how likely is a recorded landslide? | Same, for India and its Himalayan neighbours |
| Inputs | 1/3/7/30-day rainfall, slope | latitude, longitude, month, the state's share of past events | same as India-wide |
| Training data | 24,837 daily rows, 17 points, 2015–2018, **synthetic rainfall** | 1,265 real events (NASA catalogue) + pseudo-absences | 1,886 real events + pseudo-absences |
| ROC-AUC (hold-out) | 0.952 | 0.841 | 0.834 |
| Endpoint | `POST /api/predict`, and the zones/alerts | `POST /api/predict/india` | `POST /api/predict/region` (used by Setu) |

**Important:** scikit-learn must stay at **1.8.0**, the version the `.pkl`
files were saved with. Another version may refuse to load them or give
different answers. `backend/requirements.txt` pins it.

## Risk levels

All three models turn a probability into the same five levels:

| Probability | Level |
|---|---|
| 0.85 and above | CRITICAL |
| 0.70 – 0.85 | VERY_HIGH |
| 0.50 – 0.70 | HIGH |
| 0.30 – 0.50 | MODERATE |
| below 0.30 | LOW |

Zones at HIGH or above become alerts: CRITICAL → severity CRITICAL,
VERY_HIGH → HIGH, HIGH → WARNING.

**Confidence** is how much the 300 trees agree on the answer:
`1 − standard deviation of the trees' votes`. **Factor weights** come from
the model's overall feature importances (not a per-prediction explanation).

---

## Model 1: NER Station (rainfall + slope)

**Features** (in this exact order): `rain_1d`, `rain_3d_sum`, `rain_7d_sum`,
`rain_30d_sum`, `slope_deg`.

**Data:** `backend/data/training_dataset.csv`: one row per day per point,
17 points across the North East (5 of them in Sikkim and the Darjeeling
hills), 1 January 2015 to 31 December 2018, 24,837 rows, of which 2,362
(9.5%) are labelled landslide. Slope comes from an SRTM-derived elevation grid
(`backend/data/elevation_grid.csv`, 1,015 points).

**Where it came from:** an earlier pipeline (`landslide-ews`) that is not in
this repo. The backend describes its own data source as *"Synthetic rainfall
series + SRTM-derived slope, 17 NER points"*. How the landslide labels were
assigned is not documented here.

**Hold-out metrics** (80/20 split, `random_state=42`, computed live by
`metrics.py` and shown in Analytics):

| Metric | Value |
|---|---|
| Accuracy | 0.826 |
| Precision | 0.346 |
| Recall | 0.934 |
| F1 | 0.505 |
| ROC-AUC | 0.952 |
| False-alarm rate | 0.185 |
| Test rows | 4,968 |

**How to read this honestly:**

- The rainfall is synthetic, so these numbers measure how well the model
  learned that dataset, not how well it predicts real landslides.
- Precision 0.35 means about two of every three "landslide" calls in the test
  set were false alarms; recall 0.93 means it rarely misses one. For early
  warning that trade-off is deliberate, but it should be stated.
- The labels depend strongly on location (six points have no landslide days,
  three Sikkim/Darjeeling points have 33%), so location alone explains much
  of the result.
- Slopes are small (at most 6.6°) because the elevation grid is coarse; real
  hillside slopes are much steeper.

**How the zones use it:** `zones.py` takes the **latest row** for each of the
17 points (31 December 2018, a dry winter day) and scores it. With the real
backend, all 17 points currently come out **LOW**, so there are no alerts.
The names are generic ("Monitoring Point 1"…). See
[Known issues](12-known-issues.md).

**Manual predictions** (`POST /api/predict`): the workbench sends 24-hour and
7-day rainfall and slope. The model also needs 3-day and 30-day totals, which
are estimated by assuming the 7-day average daily rate continues
(`estimate_rolling_rainfall()`). The request accepts other fields (soil
moisture, NDVI, elevation, land use, geology…) but the model does **not** use
them.

**Retraining:** there is no training script for this model in the repo. To
retrain, write one that reads `training_dataset.csv`, uses the same feature
order and saves `models/risk_model.pkl` with scikit-learn 1.8.0.

---

## Model 2: India-wide

**Data:** the NASA Global Landslide Catalog (GLC), compiled by NASA Goddard
from news reports, disaster databases and scientific sources (Kirschbaum et
al. 2010, *"A global landslide catalog for hazard applications: method,
results, and limitations"*, Natural Hazards 52, 561–575). Public domain.

- `backend/training/nasa_glc_raw.csv`: the copy used, 11,033 events worldwide
  (dates from 1988 to 2017, almost all 2007–2016).
- `backend/training/india_landslide_events.csv`: the India subset,
  **1,265 events** (March 2007 to October 2016), each with date, latitude,
  longitude, state, category, trigger, size and fatalities.

**Method** (`backend/training/train_india_model.py`):

1. **Positives:** the 1,265 real events (`landslide = 1`), with the month
   taken from the date.
2. **Negatives (pseudo-absence sampling):** for each real event, one
   synthetic "no recorded landslide" point, made by moving the event's
   location 0.3–1.5° (roughly 30–150 km) and giving it a random unrelated
   month. This is a standard technique in landslide-susceptibility modelling.
3. **Features:** `latitude`, `longitude`, `month_sin` and `month_cos`
   (season as a circle, so December is next to January), and `state_freq`
   (that state's share of all recorded events, computed from the training
   split only so test labels don't leak in).
4. **Model:** RandomForest (300 trees, depth 8, `class_weight="balanced"`),
   80/20 stratified split.

**Hold-out metrics** (`backend/models/india_model_metrics.json`):

| Accuracy | Precision | Recall | F1 | ROC-AUC | Test size | States |
|---|---|---|---|---|---|---|
| 0.771 | 0.719 | 0.889 | 0.795 | 0.841 | 506 | 32 |

**Answer:** probability, risk level, confidence, the nearest state (by
nearest state centroid, an approximation), the month, and which input
mattered most (state history, season or location), with a plain-language
explanation.

**Limits:**

- **Reporting bias.** GLC is built from news and reports. A place with no
  record may be safe, or just remote and under-reported. "Negative" means "no
  recorded report", not "verified safe".
- **No terrain or weather.** It can't say "it's raining hard now, is this
  slope at risk"; only "this region and season have/haven't had reported
  events".
- **State frequency dominates.** It captures real regional differences
  (Uttarakhand, Jammu & Kashmir and Himachal Pradesh have many records) but
  can't tell a risky slope from a safe one in the same state.
- **2007–2016 only.** No later land-use, construction or climate change.
- **Not validated for operational use.** A demonstration of what open event
  data supports.

The Western and Eastern Ghats are covered: Maharashtra (70 events), Kerala
(50), Tamil Nadu (40), Karnataka (31), Goa (22), Andhra Pradesh (21) and
Odisha (10) are in the data.

**Retrain:**

```bash
cd backend/training
python train_india_model.py
```

This regenerates `models/india_risk_model.pkl`, `india_state_freq.json` and
`india_model_metrics.json`. A better event dataset (GSI Bhukosh, ISRO NRSC, a
state disaster authority) can be swapped in if it has the same columns
(`latitude`, `longitude`, `event_date`, `admin_division_name`) or the loading
code is adjusted.

---

## Model 3: Regional (India + Himalayan neighbours)

Same source, method and model as the India-wide model, on a wider area: every
hilly or Himalayan country connected to India's borders.

| Country / region | Events |
|---|---|
| India | 1,265 |
| Nepal | 481 |
| Bangladesh | 58 |
| Myanmar | 44 |
| Bhutan | 20 |
| Tibet Autonomous Region (China) | 18 |
| **Total** | **1,886** |

China is limited to Tibet on purpose (the rest of China isn't connected to
India's borders); change the filter in `training/train_region_model.py` to
include more.

**Hold-out metrics** (`backend/models/region_model_metrics.json`):

| Accuracy | Precision | Recall | F1 | ROC-AUC | Test size | Regions |
|---|---|---|---|---|---|---|
| 0.746 | 0.696 | 0.873 | 0.774 | 0.834 | 755 | 37 |

Slightly lower than India-only, as expected with more varied geography and
thin data in some countries (Bhutan and Tibet have about 20 events each). The
same limits apply, plus very uneven data density between countries.

**Retrain:** `cd backend/training && python train_region_model.py`
(regenerates `region_risk_model.pkl`, `region_state_freq.json`,
`region_model_metrics.json`).

This is the model Setu uses for "landslide risk today".

---

## `GET /api/models`

Lists the three models with their id (`ner`, `india`, `region`), name,
description, data source and metrics, for the prediction workbench's model
dropdown and the Model Performance tab.

## Improving the models

See [Roadmap](13-roadmap.md). In short: real rainfall (IMD or Open-Meteo
archive) at the event dates, real slope from a finer DEM, the ISRO Landslide
Atlas and GSI inventories for events, and live rainfall for "risk today".
