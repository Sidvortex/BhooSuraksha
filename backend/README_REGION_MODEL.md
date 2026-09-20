# The Regional Model (India + Himalayan Border Countries)

This is the third model, alongside the NER model (`model.py`) and the
India-only model (`india_model.py`, see `README_INDIA_MODEL.md` — read
that first, since this model uses the exact same method, just on a wider
dataset).

## What's different from the India-only model

Same NASA Global Landslide Catalog source, same pseudo-absence method,
same RandomForest architecture — but the training data now includes real
recorded events from every hilly/Himalayan country actually connected to
India's borders:

| Country/Region | Real events used |
|---|---|
| India (all states, incl. Western & Eastern Ghats) | 1,265 |
| Nepal | 481 |
| Bangladesh | 58 |
| Myanmar | 44 |
| Bhutan | 20 |
| Tibet Autonomous Region (China) | 18 |
| **Total** | **1,886** |

China was deliberately restricted to the Tibet Autonomous Region only —
the rest of China's GLC events (Sichuan, Yunnan, Guangdong, etc.) were
excluded because they aren't the part connected to India's borders, per
your request. If you'd rather include all of China (or add other
countries), edit the country filter in `training/train_region_model.py`.

## Real hold-out metrics

| Metric | Value |
|---|---|
| Accuracy | 0.746 |
| Precision | 0.696 |
| Recall | 0.873 |
| F1 | 0.774 |
| ROC-AUC | 0.834 |

Slightly lower than the India-only model's numbers — expected, since this
model now has to generalize across more geography and less-dense data in
several of the added countries (Bhutan and Tibet only have ~20 events
each). Same limitations as `README_INDIA_MODEL.md` apply, plus one more:
**per-country data density is very uneven** (India: 1,265 events, Bhutan:
20), so the model is much more confident about Indian states than about,
say, specific parts of Bhutan.

## Retraining

```bash
cd backend/training
python train_region_model.py
```

Regenerates `backend/models/region_risk_model.pkl`,
`region_state_freq.json`, and `region_model_metrics.json`.
