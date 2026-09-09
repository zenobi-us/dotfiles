---
description: Find and prioritize Jira workitems with JQL, project, assignee, sprint, status, type, priority, labels, and time filters.
---

# Jira Querying

Use the Jira-native workitem search when the target is definitely Jira and the
user has fuzzy text rather than structured filters:

```text
twg jira workitem search "login failures" --limit 20
```

The command safely builds `text ~ "..." ORDER BY updated DESC` and runs it
through Jira's JQL REST search. Use explicit JQL when the user needs exact issue
filters, custom ordering, or counts.

Examples of suitable constraints:

```text
project = PROJ AND statusCategory != Done ORDER BY priority DESC, rank ASC
assignee = currentUser() AND updated >= -7d ORDER BY updated DESC
assignee = currentUser() AND statusCategory = "In Progress" ORDER BY updated DESC
sprint in openSprints() AND issuetype in (Bug, Story)
```

Guidance:

- Use `jira workitem search` for Jira-only fuzzy text. Use
  `jira workitem query --jql <jql>` for project, assignee, sprint, status, type,
  priority, label, and time constraints.
- Preserve the user's requested ordering. For "what should I pick next," use
  Jira priority/rank or the named board backlog.
- Use board/backlog commands when the user identifies a concrete board and its
  backlog order matters.
- Use top-level `search --app jira` only when semantic Rovo discovery is wanted;
  hydrate selected Jira keys with `jira workitem get`.
- Pair the query with context only for the few workitems whose relationships
  affect the answer.
- Treat current assigned Jira work as an exact JQL query. If the query reports
  a missing default site, relay its repair and stop; do not inspect auth files
  or fall back to broad activity queries.
- State truncation when a limit prevents exhaustive coverage.

Do not borrow projection flags or org scopes unless the exact Jira command
contract advertises them.
