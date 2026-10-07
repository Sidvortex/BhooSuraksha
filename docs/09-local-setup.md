# 9. Local setup

Run BhooSuraksha on your own computer.

## You need

- **Python 3.12** (scikit-learn 1.8.0 and the saved models are tested on it)
- **Node.js 20+** and npm
- **git**

## 1. Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate              # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python create_admin.py <username>      # asks for a password (10+ characters)
uvicorn app:app --reload --port 8000
```

On Arch Linux without a virtual environment, add `--break-system-packages`.

Check it:

```bash
curl http://localhost:8000/health        # {"status":"ok"}
curl http://localhost:8000/api/models    # ner, india, region
```

The interactive API page is at http://localhost:8000/docs.

Without Turso settings, accounts and feedback go to `backend/data/auth.db`
and `backend/data/feedback.db` (both git-ignored).

## 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
echo "VITE_BACKEND_URL=http://localhost:8000" > .env.local
npm run dev
```

Open http://localhost:3000. Without `.env.local` the site runs on sample
data; you can also set the backend address at **Settings → Backend URL**
inside the authority console (or on the login page).

## 3. Try it

1. Home page: alerts, helplines, warning signs.
2. **Citizen Services → Near Me**: allow location; hospitals and police
   within 100 km appear (needs internet for OpenStreetMap).
3. **Login** (top right) with the account you created → `/authority/dashboard`.
4. **Run Prediction** → choose **Regional Model** → a point in Sikkim, a
   July date → a risk answer with factors and explanation.
5. **Risk Map** → switch to **3D**.
6. **Route Planner**: click a road near Haflong to block it and watch the
   route change.

## 4. Use it with Setu

Setu (the logistics project) expects BhooSuraksha on port 8000. Start Setu's
backend with `BHOOSURAKSHA_API_URL=http://localhost:8000` (see Setu's
`docs/08-local-setup.md`).

## 5. Retrain the models (optional)

```bash
cd backend/training
python train_india_model.py      # India-wide
python train_region_model.py     # Regional
```

Keep scikit-learn at 1.8.0, or the backend may not load the new files on
Render. See [Models](03-models.md).

## 6. Run the data pipeline (optional)

```bash
cd data-pipeline
pip install -r requirements.txt
python fetch_geosadak.py
python build_road_graph.py
```

See [Data](04-data.md#the-data-pipeline).

## Troubleshooting

| Problem | Fix |
|---|---|
| "Incorrect username or password" | Check the `[auth] storage` line in the backend log; create the account in that storage |
| Model fails to load / `InconsistentVersionWarning` | scikit-learn isn't 1.8.0: `pip install -r requirements.txt` in a fresh environment |
| Site shows sample data | `VITE_BACKEND_URL` not set (restart `npm run dev` after creating `.env.local`) or the backend isn't running |
| Near Me finds nothing | The Overpass API is busy or OpenStreetMap has little data there; try again |
| 3D map has no terrain | The MapLibre worker isn't loading; check `vite.config.ts` still has `worker: { format: 'es' }` |
| Location doesn't work on a phone | Browsers only give GPS on `https://` or `localhost` |
