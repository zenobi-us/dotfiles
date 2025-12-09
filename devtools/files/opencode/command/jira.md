---
description: Update Jira ticket status, sprint, and assignee
agent: jira
subtask: true
---

## UserRequest

Transition Jira ticket `$1` to status `$2`. Ensure the ticket is assigned to the current user and added to the appropriate sprint (ask if not currently in one).

## Parameters

- **$1**: Jira issue key or ID (e.g., PROJ-123)
- **$2**: Target status (e.g., "In Progress", "Done")

## Operating Steps

Follow the protocol defined in `agent/jira.md` for transitioning issue status:

1. Get your account ID using `atlassian_atlassianUserInfo`
2. Fetch the ticket using `atlassian_getJiraIssue` to see current state
3. Check available transitions with `atlassian_getTransitionsForJiraIssue`
4. **If the ticket is not in a sprint**, ask the user which sprint to assign it to
5. Update the sprint field if needed using `atlassian_editJiraIssue`
6. Perform the status transition using `atlassian_transitionJiraIssue`
7. Assign the ticket to the current user using `atlassian_editJiraIssue`
8. Confirm all changes were successful

Report the final ticket state, new status, sprint assignment, and assignee.
