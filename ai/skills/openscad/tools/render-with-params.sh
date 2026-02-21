#!/bin/bash
# Render OpenSCAD with parameters from a JSON file
# Usage: render-with-params.sh input.scad params.json output.stl|output.png

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

check_openscad

if [ $# -lt 3 ]; then
    echo "Usage: $0 input.scad params.json output.[stl|png]"
    echo ""
    echo "params.json format:"
    echo '  {"width": 60, "height": 40, "include_lid": true}'
    exit 1
fi

INPUT="$1"
PARAMS_FILE="$2"
OUTPUT="$3"

if [ ! -f "$INPUT" ]; then
    echo "Error: Input file not found: $INPUT"
    exit 1
fi

if [ ! -f "$PARAMS_FILE" ]; then
    echo "Error: Params file not found: $PARAMS_FILE"
    exit 1
fi

# Build -D arguments from JSON
DEFINES=()
while IFS= read -r line; do
    # Parse each key-value pair
    key=$(echo "$line" | cut -d'=' -f1)
    value=$(echo "$line" | cut -d'=' -f2-)
    
    if [ -n "$key" ]; then
        DEFINES+=("-D" "$key=$value")
    fi
done < <(
    # Use python or jq to parse JSON to key=value lines
    if command -v python3 &> /dev/null; then
        python3 -c "
import json
with open('$PARAMS_FILE') as f:
    params = json.load(f)
for k, v in params.items():
    if isinstance(v, bool):
        print(f'{k}={str(v).lower()}')
    elif isinstance(v, str):
        print(f'{k}=\"{v}\"')
    else:
        print(f'{k}={v}')
"
    elif command -v jq &> /dev/null; then
        jq -r 'to_entries | .[] | "\(.key)=\(.value)"' "$PARAMS_FILE"
    else
        echo "Error: Requires python3 or jq to parse JSON"
        exit 1
    fi
)

echo "Rendering with parameters from: $PARAMS_FILE"
echo "Parameters: ${DEFINES[*]}"

# Determine output type and set appropriate options
EXT="${OUTPUT##*.}"
case "$EXT" in
    stl|STL)
        $OPENSCAD "${DEFINES[@]}" -o "$OUTPUT" "$INPUT"
        ;;
    png|PNG)
        $OPENSCAD "${DEFINES[@]}" \
            --camera="0,0,0,55,0,25,0" \
            --imgsize="800,600" \
            --colorscheme="Tomorrow Night" \
            --autocenter --viewall \
            -o "$OUTPUT" "$INPUT"
        ;;
    *)
        echo "Unsupported output format: $EXT"
        echo "Supported: stl, png"
        exit 1
        ;;
esac

echo "Output saved: $OUTPUT"
