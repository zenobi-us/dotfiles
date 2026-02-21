#!/bin/bash
# Generate a preview PNG from an OpenSCAD file
# Usage: preview.sh input.scad output.png [options]
#
# Options:
#   --camera=x,y,z,rx,ry,rz,dist  Camera position
#   --size=WxH                     Image size (default: 800x600)
#   -D 'var=value'                 Set parameter value

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

check_openscad

if [ $# -lt 2 ]; then
    echo "Usage: $0 input.scad output.png [--camera=...] [--size=WxH] [-D 'var=val']"
    echo ""
    echo "Camera format: x,y,z,rotx,roty,rotz,distance"
    echo "Common cameras:"
    echo "  Isometric: --camera=0,0,0,55,0,25,200"
    echo "  Front:     --camera=0,0,0,90,0,0,200"
    echo "  Top:       --camera=0,0,0,0,0,0,200"
    exit 1
fi

INPUT="$1"
OUTPUT="$2"
shift 2

# Defaults
CAMERA="0,0,0,55,0,25,0"
SIZE="800,600"
DEFINES=()

# Parse options
while [ $# -gt 0 ]; do
    case "$1" in
        --camera=*)
            CAMERA="${1#--camera=}"
            ;;
        --size=*)
            SIZE="${1#--size=}"
            SIZE="${SIZE/x/,}"
            ;;
        -D)
            shift
            DEFINES+=("-D" "$1")
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
    shift
done

# Ensure output directory exists
mkdir -p "$(dirname "$OUTPUT")"

# Run OpenSCAD
echo "Rendering preview: $INPUT -> $OUTPUT"
$OPENSCAD \
    --camera="$CAMERA" \
    --imgsize="${SIZE}" \
    --colorscheme="Tomorrow Night" \
    --autocenter \
    --viewall \
    "${DEFINES[@]}" \
    -o "$OUTPUT" \
    "$INPUT"

echo "Preview saved to: $OUTPUT"
