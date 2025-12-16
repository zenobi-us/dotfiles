#!/bin/bash
# Find all open issues assigned to current user with PR links
# Usage: ./find-my-open-issues.sh

set -euo pipefail

CLOUD_ID=$(mise x node@20 -- mcporter call atlassian.getAccessibleAtlassianResources | jq -r '.[0].id')

echo "Finding open issues assigned to you..."
ISSUES=$(mise x node@20 -- mcporter call atlassian.searchJiraIssuesUsingJql \
  --cloud-id "$CLOUD_ID" \
  --jql "assignee = currentUser() AND status = Open" | \
  jq -r '.issues[] | "\(.key):\(.fields.status.name)"')

while read -r issue_data; do
  issue_key="${issue_data%:*}"
  issue_status="${issue_data#*:}"
  echo "=== $issue_key ($issue_status) ==="
  
  pr_count=$(mise x node@20 -- mcporter call atlassian.getJiraIssueRemoteIssueLinks --cloud-id "$CLOUD_ID" --issue-id-or-key "$issue_key" 2>/dev/null | \
    jq '[.[]? | select(.type.name == "GitHub" or (.globalId | contains("github")))] | length')
  
  if [ "$pr_count" -eq 0 ]; then
    echo "  No linked PRs"
  else
    mise x node@20 -- mcporter call atlassian.getJiraIssueRemoteIssueLinks --cloud-id "$CLOUD_ID" --issue-id-or-key "$issue_key" | \
      jq -r '.[]? | select(.type.name == "GitHub" or (.globalId | contains("github"))) | "  \(.object.title) → \(.object.url)"'
  fi
done <<< "$ISSUES"
