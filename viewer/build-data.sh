#!/bin/bash
# Generates data.js from all studio JSON files in the project.
# Run this script whenever you update any JSON file to sync the viewer.
# Usage: cd viewer && bash build-data.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT="$SCRIPT_DIR/data.js"

echo "const LISTINGS_DATA = [" > "$OUTPUT"

FIRST=true
for building in aristotelous artemidos kleious saranti; do
  DIR="$PROJECT_DIR/$building"
  [ -d "$DIR" ] || continue
  for json_file in "$DIR"/studio*.json; do
    [ -f "$json_file" ] || continue
    FILE_NAME="$(basename "$json_file")"

    if [ "$FIRST" = true ]; then
      FIRST=false
    else
      echo "," >> "$OUTPUT"
    fi

    # Add _meta and the JSON content
    echo "  {" >> "$OUTPUT"
    echo "    \"_meta\": {" >> "$OUTPUT"
    echo "      \"building\": \"$building\"," >> "$OUTPUT"
    echo "      \"file\": \"$FILE_NAME\"," >> "$OUTPUT"
    echo "      \"path\": \"$building/$FILE_NAME\"" >> "$OUTPUT"
    echo "    }," >> "$OUTPUT"

    # Strip the opening { from the JSON and append the rest
    tail -c +2 "$json_file" >> "$OUTPUT"
  done
done

echo "];" >> "$OUTPUT"

echo "✅ data.js rebuilt from $(grep -c '"_meta"' "$OUTPUT") JSON files."
