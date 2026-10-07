# 4. Data

Every dataset BhooSuraksha uses or prepares: where it comes from, its licence,
how it is fetched, what is wrong with it and how to refresh it. The
`data-pipeline/` folder also builds the road networks used by BhooSuraksha's
Route Planner and by [Setu](https://github.com/Sidvortex/Setu).

## Sources at a glance

| # | Source | Used for | Status | Script |
|---|---|---|---|---|
| 1 | PMGSY GeoSadak | Roads, villages, facilities, block boundaries | Fetched and processed | `fetch_geosadak.py` |
| 2 | NASA Global Landslide Catalog | Training the India-wide and Regional models | Fetched and used | `fetch_nasa_glc.py` |
| 3 | NER rainfall + slope dataset | Training and scoring the NER model | In the repo (`backend/data/`); origin pipeline not in the repo | — |
| 4 | Open-Meteo weather + GloFAS flood forecasts | Rainfall and river-flood forecasts | Script written, **never run** | `fetch_openmeteo.py` |
| 5 | ASDMA flood reports and memoranda (Assam) | Which roads failed, yearly damage totals | Manual download; 2022–2025 totals extracted | `parse_asdma_reports.py` |
| 6 | OpenStreetMap via Overpass API | Hospitals, police, military near the user (Near Me) | Live, in the browser | — |
| 7 | OpenStreetMap, OpenFreeMap, AWS Terrain tiles | Map display | Live, in the browser | — |

"Fetched and processed" means our scripts downloaded and processed the data
successfully. "Script written, never run" means the script follows the
documented API but couldn't be tested (the build environment couldn't reach
the site); run it once and check the output.

---

## 1. PMGSY GeoSadak (Ministry of Rural Development)

The government's national rural-road GIS from the Pradhan Mantri Gram Sadak
Yojana. It covers far more North East village roads than OpenStreetMap.

- Official portal: https://geosadak-pmgsy.nic.in/OpenData
- Mirror used by the script: https://github.com/datameet/pmgsy-geosadak
- Viewer: http://pmgsy-grris.nic.in
- Snapshot: DataMeet mirror, **last updated March 2022**

**Licence:** Government Open Data License – India. Free to copy, reuse and
redistribute, including commercially. **Attribution is required**, exactly:

> Ministry of Rural Development, 2022. PMGSY Rural Connectivity Datasets,
> https://geosadak-pmgsy.nic.in/opendata/. Published under India's Government
> Open Data License: https://data.gov.in/government-open-data-license-india

**Files:** 8 NER states × 5 layers + a master sheet, 41 files, about 163 MB,
with checksums in `data/raw/geosadak/MANIFEST.json`.

| Layer | Geometry | Key fields | Notes |
|---|---|---|---|
| `Road_DRRP` | lines | `RoadCatego`, `RoadName`, `RoadOwner`, `DISTRICT_I`, `BLOCK_ID` | District Rural Roads Plan; includes NH/SH/MDR |
| `Habitation` | points | `HAB_NAME`, `TOT_POPULA` | Population is a field estimate based on Census 2011 |
| `Facilities` | points | `FAC_DESC`, `FAC_CATEGO` (Medical, Education, Agro, Transport/Admin) | "Medical" includes veterinary dispensaries |
| `Bound_Block` | polygons | `BLOCK_ID`, `DISTRICT_I` | Not official boundaries; may be outdated |
| `Proposals` | lines | Sanctioned PMGSY road proposals | Only Assam has data |
| `MasterData.xls` | table | State / district / block ids → names | Needed to find districts by name |

Road categories (Assam counts): `RR(VR)` village road (37,035), `RR(TRACK)`
track (1,879), `RR(ODR)` other district road (1,032), `MDR` (322), `NH`
(212), `SH` (197), `OT` (27), `BR` (8).

**Known problems:**

- **Roads don't connect at junctions.** Lines were traced on satellite
  imagery and don't share endpoints (raw Dima Hasao: 443 separate pieces, the
  largest with 5 junctions). The build scripts repair this.
- **No surface type** (paved vs unpaved), though unpaved roads fail first.
- **Old district names:** Dima Hasao is `N.C.Hills`; districts created after
  2022 don't exist.
- Quality varies by state.

For newer data, download the same layers by hand from the official portal
into `data/raw/geosadak/<Layer>/<State>.zip`, re-run the builds and note the
new date here.

---

## 2. NASA Global Landslide Catalog (GLC)

Recorded landslides worldwide, compiled by NASA Goddard from news and disaster
reports (Kirschbaum et al. 2010). Public domain (US government work); cite
the paper.

- Copy used: https://raw.githubusercontent.com/frm1789/landslide-ea/master/global_landslide_catalog_export.csv
- In the repo: `backend/training/nasa_glc_raw.csv` (11,033 events),
  `india_landslide_events.csv` (1,265), `region_landslide_events.csv` (1,886)
- Raw download (not in git): `data-pipeline/data/raw/nasa_glc/`

**Known problems:** built from news reports, so populated and well-reported
places are over-represented; ends in 2016; no rainfall or slope per event.
See [Models](03-models.md).

---

## 3. NER rainfall + slope dataset

`backend/data/training_dataset.csv`: daily rows for 17 points across the
North East, 2015–2018 (24,837 rows): 1/3/7/30-day rainfall sums, latitude,
longitude, slope and a landslide label. `backend/data/elevation_grid.csv`
(1,015 points: latitude, longitude, elevation, slope) supplies elevations.

It came from an earlier pipeline (`landslide-ews`) that isn't in this repo.
The backend describes it as **synthetic rainfall with SRTM-derived slope**.
Treat it as demonstration data. See [Models](03-models.md#model-1-ner-station-rainfall--slope).

---

## 4. Open-Meteo (weather + flood forecasts)

Free forecast APIs, no key.

- Weather: `https://api.open-meteo.com/v1/forecast`: daily/hourly rainfall,
  16-day forecast.
- Flood: `https://flood-api.open-meteo.com/v1/flood`: river discharge from
  GloFAS v4 (Copernicus), ~5 km grid, 1984 to up to 7 months ahead.

**Terms:** free for non-commercial and low-volume use (fine for SIH);
production would need their commercial plan or self-hosting. Attribution:
"Weather data by Open-Meteo.com".

**How the script queries:** `fetch_openmeteo.py --state Assam --district
N.C.Hills` asks for the centre of every block in a district and saves raw
JSON per block per run in `data/raw/openmeteo/<UTC timestamp>/`, plus
`forecast_by_block.csv`.

**Status: never run.** The build environment couldn't reach open-meteo.com.

**Known problems:** flood discharge is modelled, not measured, and the flood
API returns the largest river within ~5 km of the point, which may not be the
one you mean. For bridges, query a point on the river itself (nudging by 0.1°
helps).

---

## 5. ASDMA flood reports (Assam)

The Assam State Disaster Management Authority publishes a daily flood report
(DRIMS) in the flood season, listing damaged infrastructure road by road with
names, PWD division, damage and coordinates: the best public record of which
roads actually failed and when. Assam only.

- List: https://asdma.assam.gov.in/information-services/assam-flood-report
- URL pattern: `https://www.asdma.gov.in/pdf/flood_report/<YEAR>/Daily_Flood_Report_<DD.MM.YYYY>.pdf`

**Access: manual only.** ASDMA's `robots.txt` disallows automated crawling, so
**do not scrape it.** Either download reports by hand into `data/raw/asdma/`
(keep the original file names; the parser reads the date from them), or
request bulk historical data officially (a data-request letter from the
institute is the right route; data.gov.in or RTI are fallbacks).

**Parser:** `parse_asdma_reports.py` → `data/processed/asdma_road_incidents.csv`
(date, file, longitude, latitude, damage type, row text). Coordinate and
damage-type extraction was tested on text from real reports, including glued
coordinates like `94.5327.38` (→ 94.53 E, 27.38 N). The full PDF table layout
wasn't available to test, so check the first run against the PDFs by eye.
Some reports print latitude without decimals (e.g. `26`), so those points are
only accurate to ~50 km north–south.

**Documents collected by the team (September 2026):** 28 PDFs (~300 MB) kept
locally in `data/raw/asdma/` and the team's shared drive, not in git and not
ours to redistribute:

| Documents | Use |
|---|---|
| Assam flood memoranda 2015–2025 | Yearly roads, bridges and health-centre damage; people affected |
| ASDMA Annual Reports 2018–19, 2019–20; Assam SDMP (2021) | Background |
| NRSC/ISRO Landslide Atlas of India (2023); Flood Hazard Zonation Atlas of Assam | Official hazard inventories |
| NDMA NLRMP Phase-1 (2025); NDMA Flood Management Guidelines | Policy framing |
| Meghalaya SDMP; HRVA Saiha (Mizoram); Tripura urban flooding report | State context |
| Research papers on Mizoram landslides | Literature |

**Extracted:** `data-pipeline/data/processed/assam_flood_damage_2022_2025.csv`:
per year, people affected, PWD roads and road-km affected, breaches, damaged
bridges and health centres, each figure checked against the memorandum text.
The 2015–2021 memoranda use different layouts and weren't extracted reliably.
The 2025 memorandum was filed mid-season, so its figures are partial.

**Still needed:** the daily, road-by-road reports for the parser.

---

## 6. Near Me: Overpass API (OpenStreetMap)

The Near Me page asks `https://overpass-api.de/api/interpreter` from the
user's browser for hospitals (`amenity=hospital`), police
(`amenity=police`) and military areas (`landuse=military`) within 100 km of
the user's location, up to 40 results. © OpenStreetMap contributors. Coverage
follows OpenStreetMap, which is thin in remote areas.

## 7. Map display services

| Service | Used for | Attribution |
|---|---|---|
| OpenStreetMap tiles | 2D maps | © OpenStreetMap contributors |
| OpenFreeMap (`liberty` style) | 3D base map and 3D buildings | © OpenMapTiles, © OpenStreetMap contributors |
| AWS Terrain Tiles (Terrarium) | 3D terrain and hillshade | Mapzen / AWS open data |

---

## The data pipeline

```bash
cd data-pipeline
pip install -r requirements.txt     # add --break-system-packages on Arch, or use a venv
```

| Script | Does | Output |
|---|---|---|
| `fetch_geosadak.py [--states …] [--layers …]` | Downloads GeoSadak layers for the 8 NER states (~163 MB) | `data/raw/geosadak/` + `MANIFEST.json` |
| `fetch_nasa_glc.py` | Downloads the NASA catalogue (~10 MB), filters India + neighbours | `data/raw/nasa_glc/` |
| `build_road_graph.py [--state Assam --district N.C.Hills --tolerance 30]` | Routable network for **one district** (networkx) | `data/processed/<district>/` |
| `route_demo.py [--network … --origin-lat … --origin-lon …]` | Routes from a district HQ to every medical facility, then a **simulated** blockage of the most-used segment | GeoJSON routes + `route_demo_report.json` |
| `build_region_network.py [--tolerance 30 --join-distance 60]` | One routable network for **all 8 states** (used by Setu) | `data/processed/ner/` |
| `fetch_openmeteo.py [--state … --district …]` | Rainfall + flood forecast per block (never run) | `data/raw/openmeteo/` |
| `parse_asdma_reports.py` | Road incidents from hand-downloaded ASDMA PDFs | `data/processed/asdma_road_incidents.csv` |

`data/raw/` is not in git (large and re-fetchable); the team keeps a zip of
it. Unzip it so `data/raw/` sits inside `data-pipeline/`, or run the fetch
scripts. `data/processed/dima_hasao/` and the Assam damage CSV are committed.

### Dima Hasao pilot (`build_road_graph.py`, `route_demo.py`)

Real results on GeoSadak data with `--tolerance 30`:

| | Raw | After build |
|---|---|---|
| Separate pieces | 443 | 43 |
| Largest connected network | 0.5% of junctions | 87.7% |
| Population within 1 km of the main network | — | 95.9% (1,50,261 of 1,56,695) |
| Road length | 2,214 km | |

83 connectors were added, 388 m in total (longest 26 m): tiny digitising
gaps, not guesses across real distances.

| Tolerance | Connectors | Largest network | Population ≤ 1 km |
|---|---|---|---|
| 5 m | 60 (111 m) | 44.5% | 60.6% |
| 15 m | 76 (241 m) | 81.5% | 87.9% |
| **30 m** | **83 (388 m)** | **87.7%** | **95.9%** |
| 60 m | 92 (810 m) | 87.9% | 95.9% |
| 100 m | 104 (1,724 m) | 88.4% | 95.9% |

**Routing finding:** from Haflong (district HQ) all 24 "Medical" facilities
are reachable (median 4.3 h at assumed speeds). One 7.9 km State Highway
segment carries 19 of those 24 routes, and a **simulated** blockage of it cuts
all 19 off. Note: the 24 include veterinary dispensaries; counting only
facilities for people, it is **13 of 16** (Setu applies this correction).

The Route Planner in BhooSuraksha's authority console runs on these files
(copied to `backend/data/networks/dima_hasao/`). After re-running the pilot,
copy them across:

```bash
cp data-pipeline/data/processed/dima_hasao/{network.graphml,roads_network.geojson,facilities.geojson,habitations.geojson,network_report.json} backend/data/networks/dima_hasao/
```

### Whole region (`build_region_network.py`), used by Setu

| | Raw | After build |
|---|---|---|
| Road segments / pieces | 59,313 segments in 53,299 pieces | 2,77,986 routable segments |
| Largest connected network | — | 93.9% of 2,08,034 junctions |
| Rural population within 1 km of it | — | 89.5% of 4.09 crore |

Two repair passes: dead ends snapped to a road within 30 m (19,094
connectors), then separate pieces joined where two junctions are within 60 m
(447 joins, longest 59.7 m). The second pass fixed state-border gaps such as
Tripura–Assam (51 m), taking Tripura from 12% to 90% connected.

Deliberately **not bridged** (real multi-km gaps): Sikkim (128 km; its link
runs through West Bengal), southern Mizoram (~7 km; Lunglei, Lawngtlai,
Saiha), Tawang, Dibang Valley.

Share of rural population on the main network: Assam 93.7%, Manipur 91.7%,
Tripura 90.4%, Meghalaya 84.5%, Arunachal Pradesh 74.6%, Nagaland 74.4%,
Mizoram 36.3%, Sikkim 0%.

Output: `data/processed/ner/` (~17 MB, about 100 s to build). Copy its
contents to Setu's `backend/data/networks/ner/`, and clear Setu's road
blockages first (edge ids change on every rebuild). Full details are in
Setu's `docs/03-data.md`.

### Assumptions to replace with real data

- Speeds per road category: NH 35, SH 30, MDR 25, ODR 20, village 15,
  track 8 km/h (BR and OT 15; repair connectors 5).
- Road crossings treated as junctions (wrong for flyovers and bridges).
- Blockages in the demo are simulated.

## Considered, not used (yet)

| Source | Why not now |
|---|---|
| OpenStreetMap road extracts (Geofabrik) | GeoSadak has better village-road coverage; OSM is useful later to fill gaps and for ferries (`route=ferry`) |
| OpenRouteService | Our own graph is needed anyway because local roads aren't in OSM |
| IMD data | Official, but API access needs registration; Open-Meteo is the no-friction substitute for the prototype |
| Live road status, vehicle GPS, delivery records | No public source exists; Setu collects these itself |

## Refresh checklist

| Source | How often | Command |
|---|---|---|
| GeoSadak | When the portal updates (check quarterly) | Manual portal download or `python fetch_geosadak.py` |
| Open-Meteo | Every few hours in the monsoon (once in use) | `python fetch_openmeteo.py --district "..."` |
| ASDMA reports | Daily in the flood season (manual) | Download PDFs → `python parse_asdma_reports.py` |
| NASA GLC | Static (ends 2016) | `python fetch_nasa_glc.py` |

After a GeoSadak refresh, re-run the network builds and update the numbers in
this document (and in Setu's docs).
