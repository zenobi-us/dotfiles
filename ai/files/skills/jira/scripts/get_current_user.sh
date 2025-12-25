#!/bin/bash
# Get current user information from Jira
# Usage: ./get_current_user.sh [--account-id] [--email] [--display-name]
# Output: JSON object with user info or specific field if requested

set -euo pipefail

# Get user info from Atlassian
USER_INFO=$(mise x node@20 -- mcporter call atlassian.atlassianUserInfo 2>&1)

# Handle errors
if ! echo "$USER_INFO" | jq empty 2>/dev/null; then
  echo "Error: Failed to retrieve user information. Make sure you're authenticated." >&2
  exit 1
fi

# Parse arguments for specific field extraction
if [[ $# -eq 0 ]]; then
  # Return full object
  echo "$USER_INFO" | jq '.'
elif [[ "$1" == "--account-id" ]]; then
  echo "$USER_INFO" | jq -r '.accountId'
elif [[ "$1" == "--email" ]]; then
  echo "$USER_INFO" | jq -r '.email'
elif [[ "$1" == "--display-name" ]]; then
  echo "$USER_INFO" | jq -r '.displayName'
else
  echo "Usage: $(basename "$0") [--account-id|--email|--display-name]" >&2
  exit 1
fi
