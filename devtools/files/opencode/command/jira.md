---
description: Update Jira ticket status, sprint, and assignee
agent: build
---

**Ticket:** $1  
**New Status:** $2

Using ONLY these Atlassian tools:
1. `atlassian_atlassianUserInfo` - Get current user account ID
2. `atlassian_getJiraIssue` - Fetch ticket $1
3. `atlassian_getTransitionsForJiraIssue` - Get valid transitions for $1
4. `atlassian_transitionJiraIssue` - Transition $1 to status: $2
5. `atlassian_editJiraIssue` - Assign ticket to current user & update sprint field

Steps:
- Get your account ID
- Fetch the ticket to see current state
- List available transitions to find the right one for "$2"
- Transition the ticket to "$2"
- Edit the ticket to assign to you and add to current sprint

Report success or errors clearly.
