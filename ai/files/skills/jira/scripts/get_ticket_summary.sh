#!/bin/bash
# Get comprehensive Jira ticket summary in one call
# Usage: ./get_ticket_summary.sh TICKET-123 [--json|--human]
# Output: Human-readable summary by default, or JSON if --json flag is used

set -euo pipefail

# Check arguments
if [[ $# -eq 0 ]]; then
  echo "Usage: $(basename "$0") TICKET-ID [--json|--human]" >&2
  echo "Example: $(basename "$0") RWR-13629" >&2
  exit 1
fi

TICKET_ID="$1"
OUTPUT_FORMAT="${2:---human}"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Get Cloud ID
CLOUD_ID=$("$SCRIPT_DIR/get_cloud_id.sh" --id)

if [[ -z "$CLOUD_ID" ]]; then
  echo "Error: Failed to retrieve Cloud ID" >&2
  exit 1
fi

# Fetch ticket details
TICKET_DATA=$(mise x node@20 -- mcporter call "atlassian.getJiraIssue(cloudId: \"$CLOUD_ID\", issueIdOrKey: \"$TICKET_ID\", fields: [\"key\", \"summary\", \"status\", \"assignee\", \"description\", \"issuetype\", \"priority\", \"sprint\", \"customfield_10020\", \"labels\", \"created\", \"updated\"])" 2>&1)

if ! echo "$TICKET_DATA" | jq empty 2>/dev/null; then
  echo "Error: Failed to retrieve ticket $TICKET_ID" >&2
  echo "$TICKET_DATA" >&2
  exit 1
fi

# Fetch remote links (PRs, etc.)
REMOTE_LINKS=$(mise x node@20 -- mcporter call "atlassian.getJiraIssueRemoteIssueLinks(cloudId: \"$CLOUD_ID\", issueIdOrKey: \"$TICKET_ID\")" 2>&1)

if ! echo "$REMOTE_LINKS" | jq empty 2>/dev/null; then
  REMOTE_LINKS="[]"
fi

# Output based on format
if [[ "$OUTPUT_FORMAT" == "--json" ]]; then
  # Combine into single JSON object
  jq -n \
    --argjson ticket "$TICKET_DATA" \
    --argjson links "$REMOTE_LINKS" \
    '{ticket: $ticket, remoteLinks: $links}'
else
  # Human-readable format
  echo "=== Jira Ticket Summary ==="
  echo ""
  echo "Key:         $(echo "$TICKET_DATA" | jq -r '.key')"
  echo "Summary:     $(echo "$TICKET_DATA" | jq -r '.fields.summary')"
  echo "Type:        $(echo "$TICKET_DATA" | jq -r '.fields.issuetype.name')"
  echo "Status:      $(echo "$TICKET_DATA" | jq -r '.fields.status.name')"
  echo "Priority:    $(echo "$TICKET_DATA" | jq -r '.fields.priority.name // "None"')"
  echo "Assignee:    $(echo "$TICKET_DATA" | jq -r '.fields.assignee.displayName // "Unassigned"')"
  echo "Created:     $(echo "$TICKET_DATA" | jq -r '.fields.created')"
  echo "Updated:     $(echo "$TICKET_DATA" | jq -r '.fields.updated')"
  
  # Labels
  LABELS=$(echo "$TICKET_DATA" | jq -r '.fields.labels // [] | join(", ")')
  if [[ -n "$LABELS" ]]; then
    echo "Labels:      $LABELS"
  fi
  
  echo ""
  echo "=== Description ==="
  echo ""
  echo "$TICKET_DATA" | jq -r '.fields.description // "No description"'
  
  # Remote links (PRs, etc.)
  LINK_COUNT=$(echo "$REMOTE_LINKS" | jq 'length')
  if [[ "$LINK_COUNT" -gt 0 ]]; then
    echo ""
    echo "=== Linked Resources ($LINK_COUNT) ==="
    echo ""
    echo "$REMOTE_LINKS" | jq -r '.[] | "  • \(.object.title // "Link"): \(.object.url)"'
  fi
  
  # URL to ticket
  JIRA_URL=$("$SCRIPT_DIR/get_cloud_id.sh" --url)
  echo ""
  echo "View in Jira: $JIRA_URL/browse/$TICKET_ID"
fi
