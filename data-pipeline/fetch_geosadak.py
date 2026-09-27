"""
Download PMGSY GeoSadak open data for the 8 North Eastern states.

Source of truth: https://geosadak-pmgsy.nic.in/OpenData (Ministry of Rural
Development). The portal serves downloads through its web UI, so this script
uses the DataMeet GitHub mirror, which has the same files in a scriptable form.
The mirror is a snapshot (last updated March 2022); the portal may have newer
data. See DATA_SOURCES.md for how to fetch newer files by hand.

License: Government Open Data License - India. Free to use, including
commercially; ATTRIBUTION REQUIRED (see DATA_SOURCES.md for the exact text).

Usage:
  python fetch_geosadak.py                 # all layers, all 8 NER states
  python fetch_geosadak.py --states Assam  # just one state
"""
import argparse
import hashlib
import json
import os
import urllib.request
from datetime import datetime, timezone

MIRROR = "https://raw.githubusercontent.com/datameet/pmgsy-geosadak/master/data"
NER_STATES = ["ArunachalPradesh", "Assam", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Sikkim", "Tripura"]
LAYERS = ["Road_DRRP", "Habitation", "Facilities", "Bound_Block", "Proposals"]
OUT = os.path.join(os.path.dirname(__file__), "data", "raw", "geosadak")


def download(url: str, dest: str) -> dict:
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with urllib.request.urlopen(url, timeout=120) as r, open(dest, "wb") as f:
        data = r.read()
        f.write(data)
    return {"url": url, "file": os.path.relpath(dest, OUT), "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--states", nargs="+", default=NER_STATES)
    ap.add_argument("--layers", nargs="+", default=LAYERS)
    args = ap.parse_args()

    manifest = {"source": "PMGSY GeoSadak via DataMeet mirror", "mirror": MIRROR,
                "fetched_at": datetime.now(timezone.utc).isoformat(), "files": []}
    manifest["files"].append(download(f"{MIRROR}/MasterData.xls", os.path.join(OUT, "MasterData.xls")))
    for layer in args.layers:
        for state in args.states:
            entry = download(f"{MIRROR}/{layer}/{state}.zip", os.path.join(OUT, layer, f"{state}.zip"))
            manifest["files"].append(entry)
            print(f"{entry['file']:40s} {entry['bytes']/1e6:7.2f} MB")
    with open(os.path.join(OUT, "MANIFEST.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"\n{len(manifest['files'])} files -> {OUT}  (checksums in MANIFEST.json)")


if __name__ == "__main__":
    main()
