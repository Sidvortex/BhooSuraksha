# Data Sources — BhooSuraksha Logistics Intelligence (SIH)

Every dataset the platform uses: where it comes from, its licence, how we
fetch it, what's in it, what's wrong with it, and how to refresh it. Keep this
file current whenever a source, script or snapshot changes.

Status legend:
- **Fetched & tested** — downloaded and processed successfully by our scripts
- **Script ready, untested** — script written against the documented API/format
  but not yet run against the live source; run once and check the output
- **Manual** — source doesn't allow scripted download; fetch by hand

| # | Source | What we use it for | Status | Script |
|---|---|---|---|---|
| 1 | PMGSY GeoSadak | Road network, villages, facilities, block boundaries | Fetched & tested | `fetch_geosadak.py` |
| 2 | NASA Global Landslide Catalog | Landslide model training data | Fetched & tested | `fetch_nasa_glc.py` |
| 3 | Open-Meteo (weather + GloFAS flood) | Rainfall + river-flood forecasts | Script ready, untested | `fetch_openmeteo.py` |
| 4 | ASDMA daily flood reports + flood memoranda | Which roads failed, when; yearly damage totals | Manual; memoranda figures extracted & verified (2022–2025) | `parse_asdma_reports.py` |
| 5 | OpenFreeMap / AWS Terrain Tiles | 3D map display only (not analysis) | In use in the web app | — |

---

## 1. PMGSY GeoSadak (Ministry of Rural Development)

**What:** The government's national rural-road GIS, created under the
Pradhan Mantri Gram Sadak Yojana. Covers far more NER village roads than
OpenStreetMap.

- Official portal: https://geosadak-pmgsy.nic.in/OpenData
- Scriptable mirror (used by our script): https://github.com/datameet/pmgsy-geosadak
- Viewer: http://pmgsy-grris.nic.in

**Licence:** Government Open Data License – India. Free to copy, reuse and
redistribute, including commercially. **Attribution is required.** Use exactly:

> Ministry of Rural Development, 2022. PMGSY Rural Connectivity Datasets,
> https://geosadak-pmgsy.nic.in/opendata/. Published under India's Government
> Open Data License: https://data.gov.in/government-open-data-license-india

Put this in the app footer/About and in the SIH submission.

**Snapshot we have:** DataMeet mirror, last updated **March 2022**. The
official portal is updated more often. To get newer data, download the same
layers by hand from the portal into `data/raw/geosadak/<Layer>/<State>.zip`
(same names), re-run the pipeline, and note the new date here.

**Files (8 NER states × 5 layers + master sheet, 41 files, ~163 MB)** —
checksums in `data/raw/geosadak/MANIFEST.json`:

| Layer | Geometry | Key fields | Notes |
|---|---|---|---|
| `Road_DRRP` | lines | `RoadCatego`, `RoadName`, `RoadOwner`, `DISTRICT_I`, `BLOCK_ID` | District Rural Roads Plan. Includes NH/SH/MDR, not only village roads |
| `Habitation` | points | `HAB_NAME`, `TOT_POPULA` | Population is a field-engineer estimate based on Census 2011 |
| `Facilities` | points | `FAC_DESC`, `FAC_CATEGO` (Medical / Education / Agro / Transport-Admin) | "Medical" includes veterinary dispensaries |
| `Bound_Block` | polygons | `BLOCK_ID`, `DISTRICT_I` | Not official boundaries; may be outdated |
| `Proposals` | lines | sanctioned PMGSY road proposals | **Only Assam has data**; the other 7 states' zips are empty |
| `MasterData.xls` | table | state/district/block IDs → names | Needed to find districts by name |

Road categories seen in Assam: `RR(VR)` village road (37,035), `RR(TRACK)`
track (1,879), `RR(ODR)` other district road (1,032), `MDR` (322), `NH` (212),
`SH` (197), `OT` (27), `BR` (8).

**Known problems (all confirmed in the data):**
- **Roads don't connect at junctions.** Lines were traced on satellite imagery
  and don't share endpoints. Raw Dima Hasao data = 443 separate fragments, the
  largest with 5 junctions. `build_road_graph.py` fixes this (see §Pilot).
- **No surface-type field.** We can't tell paved from unpaved roads from this
  data, which matters because unpaved roads fail first in monsoon.
- **District names are old.** Dima Hasao appears as `N.C.Hills`; newer
  districts created after the snapshot won't exist.
- Quality varies by state (collected by each state separately).

---

## 2. NASA Global Landslide Catalog (GLC)

**What:** 11,033 recorded landslide events worldwide, 2007–2016, compiled by
NASA Goddard from news and disaster reports (Kirschbaum et al. 2010). We use
the 1,886 events in India, Nepal, Bhutan, Myanmar, Bangladesh and Tibet — the
training data for BhooSuraksha's India-wide and regional models.

- Official: NASA Goddard via data.nasa.gov
- Copy used by our script: https://raw.githubusercontent.com/frm1789/landslide-ea/master/global_landslide_catalog_export.csv
- **Licence:** US government work, public domain. Cite Kirschbaum et al. 2010.

**Files:** `data/raw/nasa_glc/global_landslide_catalog_export.csv` (full,
~9.7 MB), `glc_india_and_neighbours.csv` (1,886 rows), `MANIFEST.json`.

**Known problems:** built from news reports, so it over-represents populated
and well-reported places (reporting bias); ends in 2016; no rainfall/slope
per event. See `backend/README_INDIA_MODEL.md`.

---

## 3. Open-Meteo (weather + flood forecasts)

**What:** Free forecast APIs, no API key.
- Weather: `https://api.open-meteo.com/v1/forecast` — daily/hourly rainfall, 16-day forecast
- Flood: `https://flood-api.open-meteo.com/v1/flood` — river discharge from
  GloFAS v4 (Copernicus), ~5 km grid, 1984 to up to 7 months ahead

**Licence / terms:** free for non-commercial and low-volume use. Fine for
SIH; a production deployment would need their commercial plan or a
self-hosted instance. Attribution: "Weather data by Open-Meteo.com".

**How we query:** `fetch_openmeteo.py` queries the centre of every block in
a district. Raw JSON saved per block per run in
`data/raw/openmeteo/<UTC timestamp>/`, plus `forecast_by_block.csv`.

**Status: script ready, untested** — the build environment couldn't reach
open-meteo.com. Run it once and check the output.

**Known problems:**
- Flood discharge is **modelled, not measured**.
- The flood API returns the **largest river within ~5 km** of the point, which
  may not be the river you mean. For road bridges, query a point on the river
  itself (nudging coordinates by 0.1° helps, per Open-Meteo's docs).

---

## 4. ASDMA Daily Flood Reports (Assam)

**What:** Assam State Disaster Management Authority's daily flood report
(DRIMS system), published during the flood season. Lists damaged
infrastructure road by road, with the road name, PWD division, damage
description and coordinates — the best public record of which roads actually
failed and when. Assam only.

- Report list: https://asdma.assam.gov.in/information-services/assam-flood-report
- URL pattern seen: `https://www.asdma.gov.in/pdf/flood_report/<YEAR>/Daily_Flood_Report_<DD.MM.YYYY>.pdf`

**⚠ Access: manual only.** ASDMA's site disallows automated crawling
(robots.txt). Do **not** scrape it. Either:
1. download the reports you need by hand into `data/raw/asdma/` (keep the
   original file names — the parser reads the date from them), or
2. request bulk historical data from ASDMA officially (a data-request letter
   from the institute for an SIH project is the right route; data.gov.in or
   RTI are fallbacks).

**Parser:** `parse_asdma_reports.py` → `data/processed/asdma_road_incidents.csv`
(date, file, lon, lat, damage type, row text).

**Status:** coordinate and damage-type extraction tested on text from real
reports (including glued coordinates like `94.5327.38` → 94.53 E, 27.38 N).
The full PDF table layout wasn't available to test, so **check the first
run against the PDFs by eye.**

**Known problems:** some reports print latitude without decimals (e.g. `26`),
so those points are only accurate to ~50 km north–south; format may change
between years.


### 4a. Documents collected by the team (Sept 2026)

Stored locally in `data/raw/asdma/` (git-ignored, ~300 MB, 28 PDFs). Not
redistributable by us; keep them in the team's shared drive.

| Documents | Use |
|---|---|
| Assam flood memoranda 2015–2025 (state's damage claims to the Centre) | Yearly roads/bridges/health-centre damage, people affected |
| ASDMA Annual Reports 2018–19, 2019–20; Assam SDMP (2021) | Background, institutional context |
| NRSC/ISRO Landslide Atlas of India (2023); Flood Hazard Zonation Atlas of Assam (1998–2023) | Official hazard inventories and zonation |
| NDMA NLRMP Phase-1 (2025); NDMA Flood Management Guidelines | Policy framing |
| Meghalaya SDMP; HRVA Saiha (Mizoram); NIDM/SDMA Tripura urban flooding report | State-level context |
| Research papers on Mizoram landslides (Aizawl, Lunglei, Laipuitlang; Landslides 2025) | Literature for the SIH submission |

**Extracted so far:** `data/processed/assam_flood_damage_2022_2025.csv` —
people affected, PWD roads and road-km affected, breaches, damaged bridges and
health centres, per year. Every figure was checked against the surrounding
memorandum text. 2015–2021 memoranda use different layouts and weren't
extracted reliably; don't use automated numbers from them without checking.
The 2025 memorandum was filed mid-season, so its figures are partial.

**Still needed:** the *daily* flood reports (the road-by-road PDFs with
coordinates) that `parse_asdma_reports.py` is built for. The memoranda are
annual totals, not road-level records.

---

## 5. Map display services (web app only)

Used by the 3D map, not by the analysis pipeline. No downloads involved.
- **OpenFreeMap** (`tiles.openfreemap.org`, style `liberty`) — free vector
  tiles, no key. Attribution: © OpenMapTiles, © OpenStreetMap contributors.
- **AWS Terrain Tiles** (Terrarium) — public elevation tiles, no key.
- **OpenStreetMap** raster tiles for the 2D map. © OpenStreetMap contributors.

---

## Considered, not used (yet)

| Source | Why not now |
|---|---|
| OpenStreetMap road extracts (Geofabrik) | GeoSadak already includes NH/SH and has far better village-road coverage in NER. Useful later to fill GeoSadak gaps and for ferries (`route=ferry`) |
| OpenRouteService | Our own graph (below) is needed anyway because local roads aren't in OSM; ORS remains an option for inter-district routing |
| IMD data | Official, but API access generally needs registration/approval; Open-Meteo is the no-friction substitute for the prototype |
| Live road status / vehicle GPS / delivery records | **No public source exists.** Comes from our own field-reporting and driver apps; the demo uses clearly-labelled simulated data |

---

## Pilot: Dima Hasao road network (`build_road_graph.py`, `route_demo.py`)

Real results on GeoSadak data, `--tolerance 30`:

| | Raw | After build |
|---|---|---|
| Separate pieces | 443 | 43 |
| Largest connected network | 0.5% of junctions | 87.7% |
| Population within 1 km of main network | — | 95.9% (150,261 of 156,695) |

83 connectors added, 388 m total (longest 26 m) — tiny digitising gaps, not
guesses across real distances. Tolerance sensitivity (why 30 m):

| Tolerance | Connectors | Largest network | Pop ≤1 km |
|---|---|---|---|
| 5 m | 60 (111 m) | 44.5% | 60.6% |
| 15 m | 76 (241 m) | 81.5% | 87.9% |
| **30 m** | **83 (388 m)** | **87.7%** | **95.9%** |
| 60 m | 92 (810 m) | 87.9% | 95.9% |
| 100 m | 104 (1,724 m) | 88.4% | 95.9% |

**Routing finding:** from Haflong (district HQ), all 24 medical facilities are
reachable (median 4.3 h at assumed speeds). One 7.9 km State Highway segment
carries 19 of those 24 routes; in a **simulated** blockage of it, all 19 are cut
off with no alternate route in the data. Either a real single point of failure
or a gap in the road data — both worth surfacing as a bottleneck.

**Assumptions to replace with real data later:**
- Speeds per road category (NH 35, SH 30, MDR 25, ODR 20, village 15, track 8 km/h)
- Crossings treated as junctions (wrong for flyovers)
- The blockage is simulated; swap in real blocked segments from field reports or ASDMA

## Region: all 8 NER states (`build_region_network.py`)

One routable network for the whole region, used by Sampark NE. Real results
(`--tolerance 30 --join-distance 60`):

| | Raw | After build |
|---|---|---|
| Road segments / fragments | 59,313 segments in 53,299 separate pieces | 277,986 routable segments |
| Largest connected network | — | 93.9% of 208,034 junctions |
| Rural population within 1 km of it | — | 89.5% of 4.09 crore |

Two repair passes: (1) dead ends snapped to a road within 30 m (19,094
connectors); (2) separate pieces joined where two junctions are within 60 m
(447 joins, longest 59.7 m) — this fixed state-border digitising gaps, e.g.
Tripura–Assam (51 m), which took Tripura from 12% to 90% connected.

**Deliberately not bridged** (real multi-km gaps in the source data, not
digitising errors): Sikkim (128 km — its road link runs through West Bengal,
outside NER data), southern Mizoram (~7 km; Lunglei, Lawngtlai, Saiha),
Tawang, Dibang Valley. The roads exist in reality; OpenStreetMap could fill
these gaps later.

Per-state share of rural population on the main network: Assam 93.7%,
Manipur 91.7%, Tripura 90.4%, Meghalaya 84.5%, Arunachal 74.6%, Nagaland
74.4%, Mizoram 36.3%, Sikkim 0% (see above).

Outputs (`data/processed/ner/`, ~17 MB): edges, nodes, packed road shapes,
per-district stats, villages and facilities with nearest junction. Build time
~100 s. Copy them to Sampark NE's `backend/data/networks/ner/`.

---

## Refresh checklist

| Source | How often | Command |
|---|---|---|
| GeoSadak | when the portal updates (check quarterly) | manual portal download or `python fetch_geosadak.py` |
| Open-Meteo | every few hours during monsoon | `python fetch_openmeteo.py --district "..."` |
| ASDMA reports | daily in flood season (manual) | download PDFs → `python parse_asdma_reports.py` |
| NASA GLC | static (ends 2016) | `python fetch_nasa_glc.py` |

After any GeoSadak refresh, re-run `build_road_graph.py` and `route_demo.py`
and update the pilot numbers above.
