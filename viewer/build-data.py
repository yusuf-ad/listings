#!/usr/bin/env python3
"""
Generates data.js from all studio JSON files in the project.
Run this script whenever you update any JSON file to sync the viewer.
Usage: python3 build-data.py   (from the viewer/ directory)
"""
import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
OUTPUT = os.path.join(SCRIPT_DIR, "data.js")

BUILDINGS = ["aristotelous", "artemidos", "kleious", "saranti"]

all_listings = []

for building in BUILDINGS:
    building_dir = os.path.join(PROJECT_DIR, building)
    if not os.path.isdir(building_dir):
        continue
    # Sort files so studio1 comes before studio2, etc.
    files = sorted(f for f in os.listdir(building_dir) if f.startswith("studio") and f.endswith(".json"))
    for file_name in files:
        file_path = os.path.join(building_dir, file_name)
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        # Inject _meta at the top level
        entry = {
            "_meta": {
                "building": building,
                "file": file_name,
                "path": f"{building}/{file_name}",
            }
        }
        entry.update(data)
        all_listings.append(entry)

with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write("const LISTINGS_DATA = ")
    json.dump(all_listings, f, indent=2, ensure_ascii=False)
    f.write(";\n")

try:
    print(f"✅ data.js rebuilt from {len(all_listings)} JSON files.")
except UnicodeEncodeError:
    print(f"data.js rebuilt from {len(all_listings)} JSON files.")
