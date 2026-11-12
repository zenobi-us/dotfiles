---
schema: "tracker-ticket/v1"
id: "jira-tracker-mirror-02-sync-query"
title: "Sync configured Jira queries into mirror files"
type: "enhancement"
triage: "ready-for-agent"
work_status: "unclaimed"
parent: "jira-tracker-mirror"
sequence: 2
blocked_by: ["jira-tracker-mirror-01-twg-parser"]
---

## What to build

Add a sync command to the ticket skill. The command reads the `mirror` block of a Jira tracker definition. It runs each named JQL query through the shared parser and writes one Markdown file for each issue into the mirror root. The mirror root is in the shared-context store. Jira stays the source of truth.

## Acceptance criteria

- [ ] The command reads `mirror.root` and `mirror.queries` from the tracker definition. It resolves the root through shared-context.
- [ ] The command fails with a clear error if the backend is not `jira` or the `mirror` block is missing.
- [ ] Each issue file has `schema: tracker-mirror/v1` frontmatter with `id`, `title`, `type`, `status`, `status_category`, `parent`, `blocked_by`, `queries`, `jira_updated`, `synced_at`, and `ref`. The body is the description converted from ADF to Markdown.
- [ ] Queries include closed epics. The command adds no status filter.
- [ ] A second run with no Jira changes writes no changes.
- [ ] The command commits the changed mirror files as one tracker commit.
- [ ] A real run on the reckonone shared context with `cf[12059] = Payroll` epics writes the expected files.

## Comments
