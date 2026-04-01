#!/bin/bash
# Get design tokens/variables for a Figma node
# Usage: ./get_variables.sh [NODE_ID]
# Output: Variable definitions (colors, fonts, sizes, spacings)

set -euo pipefail

# Parse arguments
NODE_ID=""
CLIENT_LANGUAGES=""
CLIENT_FRAMEWORKS=""

while [[ $# -gt 0 ]]; do
  case $1 in
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
      echo "Get design tokens/variables for a Figma node."
      echo "If NODE_ID is omitted, uses the currently selected node in Figma Desktop."
      echo ""
      echo "Variables are reusable values that can be applied to design properties:"
      echo "  - Colors"
      echo "  - Fonts"
      echo "  - Sizes"
      echo "  - Spacings"
      echo ""
      echo "Options:"
      echo "  --languages LANGS     Comma-separated list of languages (for logging)"
      echo "  --frameworks FRAMES   Comma-separated list of frameworks (for logging)"
      echo "  --help, -h            Show this help message"
      echo ""
      echo "Examples:"
      echo "  $(basename "$0")                  # Variables for current selection"
      echo "  $(basename "$0") \"123:456\"        # Variables for specific node"
      echo ""
      echo "Output example:"
      echo "  {'icon/default/secondary': '#949494', 'spacing/sm': '8px'}"
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
if [[ -n "$PARAMS" ]]; then
  mise x node@20 -- mcporter call "figma-desktop.get_variable_defs($PARAMS)"
else
  mise x node@20 -- mcporter call "figma-desktop.get_variable_defs()"
fi
