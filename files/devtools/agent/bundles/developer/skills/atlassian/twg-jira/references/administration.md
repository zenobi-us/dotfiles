---
description: Manage Jira fields, contexts, screens, schemes, workflows, priorities, issue types, components, versions, filters, dashboards, and boards.
---

# Jira Administration

Keep Jira configuration separate from workitem data.

Administration includes global or project-level definitions such as fields,
field contexts, screens, schemes, workflows, priorities, issue types,
components, versions, filters, dashboards, boards, and project settings.

Workitem operations include reading or writing field values, comments, links,
watchers, attachments, and transitions for a specific key.

In particular:

- `jira field create/update/delete` manages field definitions; it does not set a
  value on a workitem.
- Workitem field metadata determines which fields are accepted for a particular
  create or update.
- For workitem issue types, use `jira workitem types get --id <id-or-ari>` only
  when the issue type ID or ARI is already known. Use
  `jira workitem types query --project <project-key-or-id>` to list types for a
  project; `--project-key`, `--project-id`, and `--issue` are selector aliases.
  The older `jira workitem types query --id` form is still accepted for
  compatibility, but prefer `get --id`. Do not run issue type `query` without a
  project scope unless using the deprecated ID compatibility path.
- Configuration mutations can affect many users and projects. Read the current
  definition, identify scope, state impact, obtain approval, then verify.
- Do not substitute Atlassian organization administration commands for Jira
  product administration. Organization administration may use separate
  credentials and APIs.
