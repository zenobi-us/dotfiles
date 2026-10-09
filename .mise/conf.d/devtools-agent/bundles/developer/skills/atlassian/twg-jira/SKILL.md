---
name: twg-jira
description: >
  Use with root `twg` for Jira workitems, projects, boards, sprints, fields,
  transitions, comments, links, and administration. Applies Jira semantics and
  safe mutation rules.
---

# twg-jira

Use with the root `twg` skill whenever Jira is the source of truth or a Jira
mutation is required. This skill owns Jira semantics and safety; exact command
grammar comes from live `twg help`.

## CLI launcher fallback

Run `twg <command>`. On shell `command not found`, use `$HOME/.local/bin/twg`
(macOS/Linux) / `$env:LOCALAPPDATA\Programs\twg\bin\twg.exe` (PowerShell), then
tell user to add that directory to PATH. Do not treat auth or command errors as
PATH failures.

## Use When

- A Jira key, issue URL, project key, board, sprint, filter, or dashboard is the
  primary anchor.
- The user asks to create, update, transition, comment on, link, watch, or
  delete Jira work.
- Required or custom fields must be discovered and populated.
- A workflow skill needs authoritative Jira fields or status.

Do not load this skill merely because Jira appears as one supporting artifact
inside a cross-product answer.

## First Route

| Intent                         | Route                                 |
| ------------------------------ | ------------------------------------- |
| Known workitem                 | Native workitem `get`                 |
| Jira-only fuzzy text discovery | Workitem `search` (JQL-backed)        |
| Exact Jira filtering           | Workitem `query` with JQL             |
| Semantic Jira discovery        | Top-level `search --app jira` (Rovo)  |
| Related artifacts or people    | Native read plus `context`            |
| Link implementation artifacts  | `jira workitem link pr|repo|deployment|build|branch|commit|loom|meeting` |
| Create or update               | Field metadata, then mutation         |
| Change workflow state          | Discover transitions, then transition |
| Board or sprint ordering       | Board/backlog/sprint command          |
| Jira configuration             | Jira administration namespace         |

Run one focused `twg help describe "<exact path>"` before an unfamiliar or
consequential mutation.

## Jira Semantics

- "Issue" and "workitem" refer to the same Jira object in user language.
- Jira projects/spaces are not Atlas projects. Use Jira for issue containers,
  schemes, boards, versions, components, filters, and dashboards.
- JSM requests have an underlying Jira workitem, but approvals, portals, queues,
  request types, and SLAs belong to JSM.
- Search results are candidate anchors. Use the native workitem read for final
  fields, comments, links, and status.
- For "what should I pick next," query actual open Jira work or the requested
  board backlog. Do not rank from broad activity alone.

## Safe Reads And Writes

- Resolve the site and workitem key before mutation.
- Read current state before update, transition, link, comment, or delete.
- Discover create/update field metadata before supplying required or custom
  fields.
- Use returned `customfield_*` IDs rather than display names in writes.
- Discover available transitions instead of guessing a transition name or ID.
- Keep global Jira field administration separate from workitem field values.
- Use typed workitem artifact links when the request is to add Jira remote links
  to PRs, repos, deployments, builds, branches, commits, Loom videos, or meetings.
  These are not Jira Software devinfo/provider writes.
- Verify mutations with a native read and report the resulting key and URL.

## Handoffs

- Load `twg-context-discovery` for dependencies, related documents, or
  implementation links; load `twg-responsibility-routing` for owners, experts,
  authority, or escalation.
- Load `twg-status-rollups` for project, sprint, team, or leadership synthesis.
- Load `twg-engineering-work` when the Jira anchor must be traced to PRs or
  repositories.
- Load `twg-operational-health` for incident, PIR, or reliability workflows.

## References

- `references/workitems.md` - workitem reads, writes, comments, and links
- `references/fields-and-transitions.md` - metadata-first fields and workflow changes
- `references/querying.md` - JQL and board/backlog selection
- `references/rich-content.md` - descriptions, comments, and mentions
- `references/administration.md` - Jira configuration versus workitem data
