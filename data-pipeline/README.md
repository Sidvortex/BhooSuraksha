# data-pipeline — BhooSuraksha Logistics Intelligence (SIH)

Scripts that fetch real public data for North East India and turn it into a
routable road network. Full source documentation (licences, caveats, refresh
schedule): **[DATA_SOURCES.md](DATA_SOURCES.md)**.

## Setup

```bash
cd data-pipeline
pip install -r requirements.txt   # add --break-system-packages on Arch, or use a venv
```

## Run

```bash
python fetch_geosadak.py          # PMGSY roads/villages/facilities, 8 NER states (~163 MB)
python fetch_nasa_glc.py          # NASA landslide catalog (~10 MB)
python build_road_graph.py        # Dima Hasao road network (default pilot)
python route_demo.py              # routes to medical facilities + simulated blockage
python fetch_openmeteo.py         # rainfall + flood forecasts per block (untested, see docs)
python parse_asdma_reports.py     # after downloading ASDMA PDFs by hand into data/raw/asdma/
```

Another district: `python build_road_graph.py --state Meghalaya --district "<name from MasterData.xls>"`
(then `route_demo.py --network data/processed/<folder> --origin-lat .. --origin-lon ..`).

## Layout

```
data/raw/         downloaded source files — NOT in git (large, re-fetchable); MANIFEST.json has checksums
data/processed/   pipeline outputs — the Dima Hasao pilot is committed for the web demo
```

The raw files are shared separately as a zip. If you have it, unzip it so the
`data/raw/` folder sits inside `data-pipeline/`; otherwise just run the fetch scripts.
