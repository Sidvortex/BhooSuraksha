"""
Rainfall forecast + river-flood forecast for every block in a district,
from Open-Meteo (free, no API key; non-commercial / low-volume terms).

  Weather: https://api.open-meteo.com/v1/forecast
  Flood:   https://flood-api.open-meteo.com/v1/flood  (GloFAS v4, ~5 km grid,
           1984 -> up to 7 months ahead; returns the LARGEST river within ~5 km
           of the point, so query points near the river you care about)

Points queried: the centre of each block in the district (from GeoSadak's
Bound_Block layer). Raw JSON responses are saved untouched, plus one tidy CSV.

STATUS: written against Open-Meteo's documented API but NOT run by its author
(the build sandbox couldn't reach open-meteo.com). Run it once and check
data/raw/openmeteo/ before relying on it.

Usage:
  python fetch_openmeteo.py --state Assam --district "N.C.Hills"
"""
import argparse
import csv
import json
import os
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

import geopandas as gpd
import pandas as pd

RAW_GEOSADAK = os.path.join(os.path.dirname(__file__), "data", "raw", "geosadak")
OUT = os.path.join(os.path.dirname(__file__), "data", "raw", "openmeteo")
WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
FLOOD_URL = "https://flood-api.open-meteo.com/v1/flood"


def get_json(url: str, params: dict) -> dict:
    full = f"{url}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(full, timeout=60) as r:
        return json.loads(r.read())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--state", default="Assam")
    ap.add_argument("--district", default="N.C.Hills")
    args = ap.parse_args()

    master = pd.read_excel(os.path.join(RAW_GEOSADAK, "MasterData.xls"))
    rows = master[(master.STATE_NAME.str.lower() == args.state.lower()) & (master.DISTRICT_NAME.str.lower() == args.district.lower())]
    if rows.empty:
        raise SystemExit("District not found in MasterData.xls")
    names = dict(zip(rows.BLOCK_ID, rows.BLOCK_NAME))
    blocks = gpd.read_file(f"zip://{RAW_GEOSADAK}/Bound_Block/{args.state}.zip")
    blocks = blocks[blocks.BLOCK_ID.isin(names)]
    centres = blocks.to_crs(32646).geometry.centroid.to_crs(4326)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%MZ")
    out_dir = os.path.join(OUT, stamp)
    os.makedirs(out_dir, exist_ok=True)
    tidy = []
    for block_id, pt in zip(blocks.BLOCK_ID, centres):
        lat, lon = round(pt.y, 4), round(pt.x, 4)
        weather = get_json(WEATHER_URL, {"latitude": lat, "longitude": lon, "daily": "precipitation_sum",
                                         "hourly": "precipitation", "forecast_days": 16, "timezone": "Asia/Kolkata"})
        flood = get_json(FLOOD_URL, {"latitude": lat, "longitude": lon,
                                     "daily": "river_discharge,river_discharge_max", "forecast_days": 30})
        for kind, payload in (("weather", weather), ("flood", flood)):
            with open(os.path.join(out_dir, f"{kind}_block{block_id}.json"), "w") as f:
                json.dump(payload, f)
        for i, day in enumerate(weather["daily"]["time"]):
            tidy.append({"block_id": block_id, "block": names[block_id], "lat": lat, "lon": lon, "date": day,
                         "rain_mm": weather["daily"]["precipitation_sum"][i],
                         "river_discharge_m3s": (flood["daily"]["river_discharge"][i]
                                                 if day in flood["daily"]["time"] else None)})
        print(f"block {names[block_id]:20s} ok")
        time.sleep(0.5)  # be polite to a free service
    with open(os.path.join(out_dir, "forecast_by_block.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=tidy[0].keys())
        w.writeheader()
        w.writerows(tidy)
    print(f"-> {out_dir}")


if __name__ == "__main__":
    main()
