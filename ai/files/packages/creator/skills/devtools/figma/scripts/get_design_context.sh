#!/bin/bash
# Get design context and generated code from Figma
# Usage: ./get_design_context.sh [NODE_ID] [--languages "typescript,css"] [--frameworks "react"]
# Output: Design context with generated code

set -euo pipefail

# Parse arguments
NODE_ID=""
CLIENT_LANGUAGES=""
CLIENT_FRAMEWORKS=""
FORCE_CODE="false"
ARTIFACT_TYPE=""
TASK_TYPE=""

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
    --force)
      FORCE_CODE="true"
      shift
      ;;
    --artifact-type)
      ARTIFACT_TYPE="$2"
      shift 2
      ;;
    --task-type)
      TASK_TYPE="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $(basename "$0") [NODE_ID] [OPTIONS]"
      echo ""
      echo "Get design context and generated code from Figma."
      echo "If NODE_ID is omitted, uses the currently selected node in Figma Desktop."
      echo ""
      echo "Options:"
      echo "  --languages LANGS     Comma-separated list of languages (e.g., 'typescript,css')"
      echo "  --frameworks FRAMES   Comma-separated list of frameworks (e.g., 'react,tailwind')"
      echo "  --force               Force code output even for large designs"
      echo "  --artifact-type TYPE  Type: WEB_PAGE_OR_APP_SCREEN, COMPONENT_WITHIN_A_WEB_PAGE_OR_APP_SCREEN,"
      echo "                        REUSABLE_COMPONENT, DESIGN_SYSTEM"
      echo "  --task-type TYPE      Task: CREATE_ARTIFACT, CHANGE_ARTIFACT, DELETE_ARTIFACT"
      echo "  --help, -h            Show this help message"
      echo ""
      echo "Examples:"
      echo "  $(basename "$0")                                    # Use current selection"
      echo "  $(basename "$0") \"123:456\"                          # Specific node"
      echo "  $(basename "$0") \"123:456\" --languages typescript   # With tech context"
      echo "  $(basename "$0") \"123:456\" --frameworks react --force"
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

if [[ "$FORCE_CODE" == "true" ]]; then
  if [[ -n "$PARAMS" ]]; then
    PARAMS="$PARAMS, "
  fi
  PARAMS="${PARAMS}forceCode: true"
fi

if [[ -n "$ARTIFACT_TYPE" ]]; then
  if [[ -n "$PARAMS" ]]; then
    PARAMS="$PARAMS, "
  fi
  PARAMS="${PARAMS}artifactType: \"$ARTIFACT_TYPE\""
fi

if [[ -n "$TASK_TYPE" ]]; then
  if [[ -n "$PARAMS" ]]; then
    PARAMS="$PARAMS, "
  fi
  PARAMS="${PARAMS}taskType: \"$TASK_TYPE\""
fi

# Execute the mcporter call
if [[ -n "$PARAMS" ]]; then
  mise x node@20 -- mcporter call "figma-desktop.get_design_context($PARAMS)"
else
  mise x node@20 -- mcporter call "figma-desktop.get_design_context()"
fi
