"""
Download the NASA Global Landslide Catalog (GLC) and cut out India + its
Himalayan border countries - the data BhooSuraksha's landslide models were
trained on (see backend/README_INDIA_MODEL.md, README_REGION_MODEL.md).

Official source: NASA Goddard (Kirschbaum et al. 2010), published on
data.nasa.gov. This script uses a public GitHub copy of the same export
(global_landslide_catalog_export.csv, 11,033 events, 2007-2016) because it's
stable and scriptable. Public domain (US government work).

Usage:  python fetch_nasa_glc.py
"""
import hashlib
import json
import os
import urllib.request
from datetime import datetime, timezone

import pandas as pd

URL = "https://raw.githubusercontent.com/frm1789/landslide-ea/master/global_landslide_catalog_export.csv"
OUT = os.path.join(os.path.dirname(__file__), "data", "raw", "nasa_glc")
REGION = ["India", "Nepal", "Bhutan", "Myanmar", "Bangladesh"]


def main():
    os.makedirs(OUT, exist_ok=True)
    with urllib.request.urlopen(URL, timeout=120) as r:
        data = r.read()
    raw_path = os.path.join(OUT, "global_landslide_catalog_export.csv")
    with open(raw_path, "wb") as f:
        f.write(data)
    df = pd.read_csv(raw_path)
    region = df[df.country_name.fillna("").str.contains("|".join(REGION)) |
                (df.country_name.fillna("").str.contains("China") & df.admin_division_name.fillna("").str.contains("Tibet"))]
    region.to_csv(os.path.join(OUT, "glc_india_and_neighbours.csv"), index=False)
    with open(os.path.join(OUT, "MANIFEST.json"), "w") as f:
        json.dump({"url": URL, "fetched_at": datetime.now(timezone.utc).isoformat(), "bytes": len(data),
                   "sha256": hashlib.sha256(data).hexdigest(), "global_events": len(df),
                   "regional_events": len(region), "by_country": region.country_name.value_counts().to_dict()}, f, indent=2)
    print(f"{len(df)} global events, {len(region)} in India + neighbours -> {OUT}")


if __name__ == "__main__":
    main()
