#!/bin/bash
# Generate preview images from multiple angles
# Usage: multi-preview.sh input.scad output_dir/ [-D 'var=value']

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

check_openscad

if [ $# -lt 2 ]; then
    echo "Usage: $0 input.scad output_dir/ [-D 'var=value' ...]"
    exit 1
fi

INPUT="$1"
OUTPUT_DIR="$2"
shift 2

# Collect -D parameters
DEFINES=()
while [ $# -gt 0 ]; do
    case "$1" in
        -D)
            shift
            DEFINES+=("-D" "$1")
            ;;
    esac
    shift
done

mkdir -p "$OUTPUT_DIR"

# Get base name without extension
BASENAME=$(basename "$INPUT" .scad)

echo "Generating multi-angle previews for: $INPUT"
echo "Output directory: $OUTPUT_DIR"
echo ""

# Define angles as name:camera pairs
# Camera format: translate_x,translate_y,translate_z,rot_x,rot_y,rot_z,distance
ANGLES="iso:0,0,0,55,0,25,0
front:0,0,0,90,0,0,0
back:0,0,0,90,0,180,0
left:0,0,0,90,0,90,0
right:0,0,0,90,0,-90,0
top:0,0,0,0,0,0,0"

echo "$ANGLES" | while IFS=: read -r angle camera; do
    output="$OUTPUT_DIR/${BASENAME}_${angle}.png"
    
    echo "  Rendering $angle view..."
    $OPENSCAD \
        --camera="$camera" \
        --imgsize="800,600" \
        --colorscheme="Tomorrow Night" \
        --autocenter \
        --viewall \
        "${DEFINES[@]}" \
        -o "$output" \
        "$INPUT" 2>/dev/null
done

echo ""
echo "Generated previews:"
ls -la "$OUTPUT_DIR"/${BASENAME}_*.png
