#!/bin/bash
# Extract customizable parameters from an OpenSCAD file
# Usage: extract-params.sh input.scad [--json]
#
# Parses parameter declarations with special comments:
#   param = value;           // [min:max] Description
#   param = value;           // [min:step:max] Description  
#   param = value;           // [opt1, opt2] Description
#   param = value;           // Description only

set -e

if [ $# -lt 1 ]; then
    echo "Usage: $0 input.scad [--json]"
    exit 1
fi

INPUT="$1"
JSON_OUTPUT=false

if [ "$2" = "--json" ]; then
    JSON_OUTPUT=true
fi

if [ ! -f "$INPUT" ]; then
    echo "Error: File not found: $INPUT"
    exit 1
fi

# Extract parameters using Python for better parsing
extract_params() {
    python3 -c '
import sys
import re

filename = sys.argv[1]
in_block = 0

with open(filename, "r") as f:
    for line in f:
        # Track block depth (skip params inside modules/functions)
        in_block += line.count("{") - line.count("}")
        if in_block > 0:
            continue
            
        # Match: varname = value; // comment
        match = re.match(r"^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^;]+);\s*(?://\s*(.*))?", line)
        if not match:
            continue
            
        var_name = match.group(1)
        value = match.group(2).strip()
        comment = match.group(3) or ""
        
        # Determine type
        if value in ("true", "false"):
            var_type = "boolean"
        elif re.match(r"^-?\d+$", value):
            var_type = "integer"
        elif re.match(r"^-?\d*\.?\d+$", value):
            var_type = "number"
        elif value.startswith("\"") and value.endswith("\""):
            var_type = "string"
            value = value[1:-1]  # Remove quotes
        elif value.startswith("["):
            var_type = "array"
        else:
            var_type = "expression"
        
        # Parse comment for range/options
        range_val = ""
        options_val = ""
        description = comment
        
        range_match = re.match(r"\[([^\]]+)\]\s*(.*)", comment)
        if range_match:
            bracket_content = range_match.group(1)
            description = range_match.group(2)
            
            # Check if numeric range (contains :) or options (contains ,)
            if ":" in bracket_content and not "," in bracket_content:
                range_val = bracket_content
            else:
                options_val = bracket_content
        
        # Output pipe-delimited
        print(f"{var_name}|{value}|{var_type}|{range_val}|{options_val}|{description}")
' "$INPUT"
}

if [ "$JSON_OUTPUT" = true ]; then
    echo "["
    first=true
    while IFS='|' read -r name value type range options description; do
        if [ "$first" = true ]; then
            first=false
        else
            echo ","
        fi
        
        # Escape quotes in values
        value=$(echo "$value" | sed 's/"/\\"/g')
        description=$(echo "$description" | sed 's/"/\\"/g')
        
        # Build JSON object
        printf '  {\n'
        printf '    "name": "%s",\n' "$name"
        printf '    "value": "%s",\n' "$value"
        printf '    "type": "%s"' "$type"
        
        if [ -n "$range" ]; then
            printf ',\n    "range": "%s"' "$range"
        fi
        if [ -n "$options" ]; then
            printf ',\n    "options": "%s"' "$options"
        fi
        if [ -n "$description" ]; then
            printf ',\n    "description": "%s"' "$description"
        fi
        printf '\n  }'
    done < <(extract_params)
    echo ""
    echo "]"
else
    echo "Parameters in: $INPUT"
    echo "==============================================="
    printf "%-20s %-15s %-10s %s\n" "NAME" "VALUE" "TYPE" "CONSTRAINT/DESC"
    echo "-----------------------------------------------"
    
    while IFS='|' read -r name value type range options description; do
        constraint=""
        if [ -n "$range" ]; then
            constraint="[$range]"
        elif [ -n "$options" ]; then
            constraint="[$options]"
        fi
        if [ -n "$description" ]; then
            if [ -n "$constraint" ]; then
                constraint="$constraint $description"
            else
                constraint="$description"
            fi
        fi
        
        printf "%-20s %-15s %-10s %s\n" "$name" "$value" "$type" "$constraint"
    done < <(extract_params)
fi
