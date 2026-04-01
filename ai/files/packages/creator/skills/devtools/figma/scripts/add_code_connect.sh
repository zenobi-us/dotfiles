#!/bin/bash
# Map a Figma node to a code component using Code Connect
# Usage: ./add_code_connect.sh [NODE_ID] --source PATH --name COMPONENT --label FRAMEWORK
# Output: Confirmation of mapping

set -euo pipefail

# Parse arguments
NODE_ID=""
SOURCE=""
COMPONENT_NAME=""
LABEL=""
CLIENT_LANGUAGES=""
CLIENT_FRAMEWORKS=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --source|-s)
      SOURCE="$2"
      shift 2
      ;;
    --name|-n)
      COMPONENT_NAME="$2"
      shift 2
      ;;
    --label|-l)
      LABEL="$2"
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
      echo "Usage: $(basename "$0") [NODE_ID] --source PATH --name COMPONENT --label FRAMEWORK"
      echo ""
      echo "Map a Figma component to a code component using Code Connect."
      echo "If NODE_ID is omitted, uses the currently selected node in Figma Desktop."
      echo ""
      echo "Required Options:"
      echo "  --source, -s PATH       Path to component in codebase"
      echo "  --name, -n COMPONENT    Name of the component"
      echo "  --label, -l FRAMEWORK   Framework/language label"
      echo ""
      echo "Valid labels:"
      echo "  React, Web Components, Vue, Svelte, Storybook, Javascript"
      echo "  Swift UIKit, Objective-C UIKit, SwiftUI"
      echo "  Compose, Java, Kotlin, Android XML Layout"
      echo "  Flutter, Markdown"
      echo ""
      echo "Optional:"
      echo "  --languages LANGS       Comma-separated list of languages (for logging)"
      echo "  --frameworks FRAMES     Comma-separated list of frameworks (for logging)"
      echo "  --help, -h              Show this help message"
      echo ""
      echo "Examples:"
      echo "  $(basename "$0") --source src/components/Button.tsx --name Button --label React"
      echo "  $(basename "$0") \"123:456\" -s src/Button.vue -n Button -l Vue"
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

# Validate required parameters
if [[ -z "$SOURCE" ]]; then
  echo "Error: --source is required" >&2
  echo "Use --help for usage information" >&2
  exit 1
fi

if [[ -z "$COMPONENT_NAME" ]]; then
  echo "Error: --name is required" >&2
  echo "Use --help for usage information" >&2
  exit 1
fi

if [[ -z "$LABEL" ]]; then
  echo "Error: --label is required" >&2
  echo "Use --help for usage information" >&2
  exit 1
fi

# Build the mcporter call parameters
PARAMS="source: \"$SOURCE\", componentName: \"$COMPONENT_NAME\", label: \"$LABEL\""

if [[ -n "$NODE_ID" ]]; then
  PARAMS="nodeId: \"$NODE_ID\", $PARAMS"
fi

if [[ -n "$CLIENT_LANGUAGES" ]]; then
  PARAMS="$PARAMS, clientLanguages: \"$CLIENT_LANGUAGES\""
fi

if [[ -n "$CLIENT_FRAMEWORKS" ]]; then
  PARAMS="$PARAMS, clientFrameworks: \"$CLIENT_FRAMEWORKS\""
fi

# Execute the mcporter call
mise x node@20 -- mcporter call "figma-desktop.add_code_connect_map($PARAMS)"

echo "✓ Code Connect mapping added: $COMPONENT_NAME → $SOURCE ($LABEL)"
