---
schema: tracker-initiative/v1
id: jira-tracker-mirror
title: Jira tracker mirror in shared context
---

## Problem Statement

A repository with a Jira tracker (`backend: jira`) shows no tickets in the Herdr-app shared-context mod. The Tracker pane shows this error:

> Jira backend loads one ticket at a time. Pass the canonical ticket reference.

`jiraSnapshot` in `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/workflow.ts` throws this error when no scope is given. With a scope, it loads one issue and returns no initiatives. Epics never appear, and the dependency graph is empty.

`dep-tree-cli.ts jira` can build an epic graph, but it makes one `twg` call per ticket and keeps no cache.

## Solution

Keep Jira as the source of truth and keep `backend: jira`. Add a read-only mirror: a sync command runs configured JQL queries through `twg` and writes one Markdown file per issue into the shared-context store. The tracker snapshot reads the mirror. Epics become initiatives, and Jira "is blocked by" links become `blocked_by` edges. The Herdr-app mod then shows epics, their tickets, and the blocker graph, the same as it does for local Markdown.

Writes (claim, comment, transition) stay live through `twg`. After a write, the caller syncs the changed key.

## User Stories

1. As a developer on a Jira repository, I want the Tracker pane to list epics and their child tickets without passing a ticket reference.
2. As a developer, I want to see which tickets block which, as a graph.
3. As a developer, I want the tracker to load quickly and work offline from the last sync.
4. As a developer, I want to start a sync from the mod and see how old the mirror is.
5. As a developer, I want to declare the JQL queries for a repository in its tracker definition.

## Implementation Decisions

### Tracker definition

Add a `mirror` block to the frontmatter of `docs/agents/issue-tracker.md`:

```yaml
backend: jira
site: https://reckon.atlassian.net
mirror:
  root: tracker/jira
  queries:
    payroll-epics: 'project = RWR AND issuetype = Epic AND cf[12059] = Payroll'
    mine: 'project = RWR AND assignee = currentUser() AND statusCategory != Done'
  closure: [children, blockers]
```

- `root` is relative to the alignment store. Resolve it through shared-context; do not join paths by hand.
- `queries` maps a stable name to a JQL string.
- `closure` adds the children of each epic and every blocker that the queries do not already return.
- Queries include closed epics. Do not filter out `statusCategory = Done` epics by default.

### Sync command

Add `scripts/jira-mirror.ts sync [--full] [--key <KEY>]` in the `reading-and-writing-tickets` skill. Every Jira call goes through `twg`.

1. Run each query with `twg jira workitem query --jql --fields summary,status,issuetype,parent,issuelinks,description,updated --limit 100`. Always pass `--fields`; the default field set leaves out `parent`, `issuelinks`, and `description`.
2. Fetch epic children in batches with `parent in (...)`. Fetch outside blockers in batches with `key in (...)`. Do not make one call per ticket.
3. Page every query: pass `pageInfo.nextCursor` to `--after` until `hasNextPage` is false. A response with no `pageInfo` is the last page.
4. Write `<root>/<KEY>.md` for each issue, with this frontmatter: `schema: tracker-mirror/v1`, `id`, `title`, `type`, `status`, `status_category`, `parent`, `blocked_by`, `queries`, `jira_updated`, `synced_at`, `ref`. The body is the description, converted from ADF to Markdown.
5. An incremental sync adds `AND updated >= "<last sync>"` to each query.
6. A `--full` sync marks keys that no query returns as `mirror_status: stale`. It does not delete them.
7. Commit the mirror changes to the shared-context repository as one tracker commit per sync. Mirror files are committed, not ignored by Git.

### Snapshot

`jiraSnapshot` reads the mirror files and needs no scope. Issues of type Epic become initiatives. `parent` gives membership. `blocked_by` gives edges. `validateRelations` and the "Ungrouped" collection then work as they do for local Markdown. The backend check against the tickets route stays.

### Herdr-app mod

- Add a `sync` operation to `request.ts` and a Sync button in the Tracker header.
- Show the age of the newest `synced_at`.
- Per-ticket Git inspection keeps working, because branch names contain the Jira key.

### Cleanup

- Move the Jira parsing in `dep-tree-cli.ts` into a shared module. The mirror and the graph CLI both use it.
- Remove the repository-local `cli:` adapter (`scripts/jira-tracker-cli.ts` in the reckonone shared context). It exists only to answer `get-issue`.
- Update `references/stores/jira.md` to describe the mirror.

## Verified `twg` behaviour

Checked 2026-11-12 against live `twg` in `reckonone-monorepo`, read-only.

1. **Output shape.** `workitem query` returns issues at `.data.issues[]`. `workitem get` returns `.data` as an array, so one issue is `.data[0]`. Fields sit directly on each issue, with no `.fields` wrapper: `.status.statusCategory.key`, `.parent.key`, `.issuelinks[].type.inward` with `.inwardIssue.key`. Each link has only one of `inwardIssue` or `outwardIssue`. The description is ADF (`type: "doc"`).
2. **Existing parser bug.** `dep-tree-cli.ts` reads `data.data.issues` and `issue.fields`; neither path exists. `dep-tree-cli.ts jira` is broken now. The shared parsing module fixes this. `jira-tracker-cli.ts` reads the correct shape.
3. **Pagination.** The default page is 50 and the maximum is 100; a larger `--limit` still returns 100. `twg` does not page automatically. A test of 15 pages returned 1500 keys with no duplicates.
4. **List length.** `key in (...)` with 1500 keys (a 15,008-character query) worked. No limit is documented. `parent in (...)` was not tested separately.
5. **Squad field.** `customfield_12059`, a select field. Payroll option ID is `12275`. `cf[12059] = Payroll` and `Squad = Payroll` both work. `project = RWR AND cf[12059] = Payroll AND issuetype = Epic AND statusCategory != Done` returned 44 open epics, 8 of them "On hold".
6. **No read-only field list.** The field ID came from one issue's update metadata.

## Testing Decisions

- Unit-test the mirror writer against recorded `twg` JSON fixtures, including a page boundary, an epic with no children, an outside blocker, and a stale key.
- Unit-test `jiraSnapshot` against a mirror directory fixture: epics as initiatives, `blocked_by` edges, cycle rejection.
- Run one real sync against the reckonone shared context and capture the Tracker pane with `collect-evidence`.

## Out of Scope

- Writing to Jira from the mirror. Writes stay live through `twg`.
- GitHub or GitLab mirrors.
- Two-way conflict handling. The mirror is read-only; Jira always wins.

## Tickets

## Comments

- 2026-11-12: Q decided: mirror files are committed; queries include closed epics; publish as an initiative.
- 2026-11-12: S recorded the `twg` research results under "Verified `twg` behaviour". Because closed epics are included, "On hold" epics are included too.
