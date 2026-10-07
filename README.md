# BhooSuraksha (भूसुरक्षा)

Landslide risk monitoring and early warning for India's North East.

- Public safety site: risk near you, with hospitals, police and shelters within 100 km, warning signs and helplines; no login needed
- Authority console: risk map in 2D and 3D, alerts, predictions, analytics and a route planner
- Three machine-learning risk models covering the North East, all of India, and India with its Himalayan neighbours
- Risk API used by the sister project [Setu](https://github.com/Sidvortex/Setu)

Built for Smart India Hackathon 2026.

## Run locally

```bash
# backend (Python 3.12)
cd backend
pip install -r requirements.txt
python create_admin.py <username>
uvicorn app:app --reload --port 8000

# frontend (Node 20+), in another terminal
cd frontend
npm install
echo "VITE_BACKEND_URL=http://localhost:8000" > .env.local
npm run dev
```

## Documentation

Everything else, including the models, data, API, deployment and known issues, is in [`docs/`](docs/).

## Team

Ravada Siddharth (lead) · Mala Kumari · Vinayak Kapoor · Ayush Mishra · Arpit Kumar · Vidit Sharma

---

Landslide data: NASA Global Landslide Catalog (Kirschbaum et al., 2010). Road data: Ministry of Rural Development, 2022. PMGSY Rural Connectivity Datasets, https://geosadak-pmgsy.nic.in/opendata/. Published under India's Government Open Data License: https://data.gov.in/government-open-data-license-india. Map data © OpenStreetMap contributors.
