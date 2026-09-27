"""
Turn ASDMA daily flood report PDFs into a road-disruption dataset.

ASDMA (Assam State Disaster Management Authority) publishes a daily flood
report during the flood season listing damaged infrastructure, including
individual roads, with coordinates. These are the best public record of
*which roads actually failed, and when*, in Assam.

ASDMA's site disallows automated crawling (robots.txt), so this script does
NOT download anything: download the PDFs by hand into data/raw/asdma/ (keep
the original file names, e.g. Daily_Flood_Report_04.07.2024.pdf), or request
bulk historical data from ASDMA directly. See DATA_SOURCES.md.

Output: data/processed/asdma_road_incidents.csv
  date, source_file, lon, lat, damage_type, row_text

STATUS: coordinate/keyword extraction is tested on text fragments from real
reports, but the full PDF table layout was not available to test against.
Check the first run's output against the PDFs by eye.

Usage:
  pip install pdfplumber
  python parse_asdma_reports.py
"""
import csv
import glob
import os
import re

HERE = os.path.dirname(__file__)
IN_DIR = os.path.join(HERE, "data", "raw", "asdma")
OUT = os.path.join(HERE, "data", "processed", "asdma_road_incidents.csv")

# Coordinates appear as "lon lat" with 2 decimals, and PDF extraction often
# glues them together ("94.5327.38"). Longitudes 88-97 and latitudes 21-30
# bound North East India, which also filters out stray numbers.
COORD = re.compile(r"(?<!\d)(8[89]|9[0-7])\.(\d{2})\s*(2[1-9]|30)(?:\.(\d{1,2}))?(?!\d)")
DATE_IN_NAME = re.compile(r"(\d{2})\.(\d{2})\.(\d{4})")
DAMAGE_WORDS = {
    "submerged": "submerged", "overtop": "overtopped", "breach": "breach", "erosion": "erosion",
    "washed": "washed away", "damage": "damaged", "landslide": "landslide", "culvert": "culvert damage",
}
ROAD_HINT = re.compile(r"\broad\b|\bRd\b|PWD|bridge|culvert|chariali|tiniali", re.I)


def extract_incidents(text: str):
    """Yield (lon, lat, damage_type, snippet) for every coordinate in a road-related row."""
    for line in re.split(r"\n{2,}|(?<=\d)\s{3,}", text):
        if not ROAD_HINT.search(line):
            continue
        for m in COORD.finditer(line):
            lon = float(f"{m.group(1)}.{m.group(2)}")
            lat = float(f"{m.group(3)}.{m.group(4) or 0}")
            low = line.lower()
            damage = next((v for k, v in DAMAGE_WORDS.items() if k in low), "unspecified")
            yield lon, lat, damage, " ".join(line.split())[:300]


def main():
    import pdfplumber  # only needed when parsing real files

    pdfs = sorted(glob.glob(os.path.join(IN_DIR, "*.pdf")))
    if not pdfs:
        raise SystemExit(f"No PDFs in {IN_DIR}. Download reports by hand first (see DATA_SOURCES.md).")
    rows = []
    for path in pdfs:
        d = DATE_IN_NAME.search(os.path.basename(path))
        date = f"{d.group(3)}-{d.group(2)}-{d.group(1)}" if d else ""
        with pdfplumber.open(path) as pdf:
            text = "\n\n".join(page.extract_text() or "" for page in pdf.pages)
        for lon, lat, damage, snippet in extract_incidents(text):
            rows.append({"date": date, "source_file": os.path.basename(path), "lon": lon, "lat": lat,
                         "damage_type": damage, "row_text": snippet})
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["date", "source_file", "lon", "lat", "damage_type", "row_text"])
        w.writeheader()
        w.writerows(rows)
    print(f"{len(rows)} road incidents from {len(pdfs)} reports -> {OUT}")


if __name__ == "__main__":
    main()
