#!/bin/bash
# Validate an OpenSCAD file for syntax errors
# Usage: validate.sh input.scad

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

check_openscad

if [ $# -lt 1 ]; then
    echo "Usage: $0 input.scad"
    exit 1
fi

INPUT="$1"

if [ ! -f "$INPUT" ]; then
    echo "Error: File not found: $INPUT"
    exit 1
fi

echo "Validating: $INPUT"

# Create temp file for output
TEMP_OUTPUT=$(mktemp /tmp/openscad_validate.XXXXXX.echo)
trap "rm -f $TEMP_OUTPUT" EXIT

# Run OpenSCAD with echo output (fastest way to check syntax)
# Using --export-format=echo just parses and evaluates without rendering
if $OPENSCAD -o "$TEMP_OUTPUT" --export-format=echo "$INPUT" 2>&1; then
    echo "✓ Syntax OK"
    
    # Check for warnings in stderr
    if [ -s "$TEMP_OUTPUT" ]; then
        echo ""
        echo "Echo output:"
        cat "$TEMP_OUTPUT"
    fi
    
    exit 0
else
    echo "✗ Validation failed"
    exit 1
fi
