#!/bin/bash
# Get Jira Cloud ID (required for all operations)
# Usage: ./get_cloud_id.sh [--url|--id]
# Output: Cloud ID by default, or URL if --url flag is used

set -euo pipefail

# Get accessible resources
RESOURCES=$(mise x node@20 -- mcporter call atlassian.getAccessibleAtlassianResources 2>&1)

# Handle errors
if ! echo "$RESOURCES" | jq empty 2>/dev/null; then
  echo "Error: Failed to retrieve Atlassian resources. Make sure you're authenticated." >&2
  exit 1
fi

# Parse arguments
if [[ $# -eq 0 ]] || [[ "$1" == "--id" ]]; then
  # Return cloud ID (default)
  echo "$RESOURCES" | jq -r '.[0].id'
elif [[ "$1" == "--url" ]]; then
  # Return Jira URL
  echo "$RESOURCES" | jq -r '.[0].url'
else
  echo "Usage: $(basename "$0") [--id|--url]" >&2
  exit 1
fi
