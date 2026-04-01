#!/bin/bash
# Get screenshot of a Figma node
# Usage: ./get_screenshot.sh [NODE_ID] [--output FILE]
# Output: Screenshot data (base64 or raw depending on output)

set -euo pipefail

# Parse arguments
NODE_ID=""
OUTPUT_FILE=""
CLIENT_LANGUAGES=""
CLIENT_FRAMEWORKS=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --output|-o)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    --languages)
      CLIENT_LANGUAGES="$2"
      shift 2
      ;;
    --frameworks)
      CLIENT_FRAMEWORKS="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $(basename "$0") [NODE_ID] [OPTIONS]"
      echo ""
      echo "Capture a screenshot of a Figma node."
      echo "If NODE_ID is omitted, uses the currently selected node in Figma Desktop."
      echo ""
      echo "Options:"
      echo "  --output, -o FILE     Save screenshot to file"
      echo "  --languages LANGS     Comma-separated list of languages (for logging)"
      echo "  --frameworks FRAMES   Comma-separated list of frameworks (for logging)"
      echo "  --help, -h            Show this help message"
      echo ""
      echo "Examples:"
      echo "  $(basename "$0")                              # Screenshot current selection"
      echo "  $(basename "$0") \"123:456\"                    # Screenshot specific node"
      echo "  $(basename "$0") \"123:456\" -o component.png   # Save to file"
      exit 0
      ;;
    *)
      # Assume positional argument is NODE_ID
      if [[ -z "$NODE_ID" ]]; then
        NODE_ID="$1"
      fi
      shift
      ;;
  esac
done

# Build the mcporter call parameters
PARAMS=""

if [[ -n "$NODE_ID" ]]; then
  PARAMS="nodeId: \"$NODE_ID\""
fi

if [[ -n "$CLIENT_LANGUAGES" ]]; then
  if [[ -n "$PARAMS" ]]; then
    PARAMS="$PARAMS, "
  fi
  PARAMS="${PARAMS}clientLanguages: \"$CLIENT_LANGUAGES\""
fi

if [[ -n "$CLIENT_FRAMEWORKS" ]]; then
  if [[ -n "$PARAMS" ]]; then
    PARAMS="$PARAMS, "
  fi
  PARAMS="${PARAMS}clientFrameworks: \"$CLIENT_FRAMEWORKS\""
fi

# Execute the mcporter call
if [[ -n "$OUTPUT_FILE" ]]; then
  if [[ -n "$PARAMS" ]]; then
    mise x node@20 -- mcporter call "figma-desktop.get_screenshot($PARAMS)" > "$OUTPUT_FILE"
  else
    mise x node@20 -- mcporter call "figma-desktop.get_screenshot()" > "$OUTPUT_FILE"
  fi
  echo "Screenshot saved to: $OUTPUT_FILE"
else
  if [[ -n "$PARAMS" ]]; then
    mise x node@20 -- mcporter call "figma-desktop.get_screenshot($PARAMS)"
  else
    mise x node@20 -- mcporter call "figma-desktop.get_screenshot()"
  fi
fi
