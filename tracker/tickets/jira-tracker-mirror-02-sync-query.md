---
schema: "tracker-ticket/v1"
id: "jira-tracker-mirror-02-sync-query"
title: "Sync configured Jira queries into mirror files"
type: "enhancement"
triage: "ready-for-agent"
work_status: "completed"
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

- 2026-11-12T11:41Z, S: Review verdict **SUCCESS** for commit `5c9c2859ed8371a06dff37e159b899a8b7a82b1f`. Artifact: `workflows/jira-tracker-mirror-02-sync-query/artifacts/reviews/review-review-0005.md`.
- 2026-11-12T22:48Z, S: Review verdict **SUCCESS** for the rebased commit `b918ef940649f41b1bc586e68e4a4395cd124696`. Artifact: `workflows/jira-tracker-mirror-02-sync-query/artifacts/reviews/review-review-0010.md`.
- 2026-11-12T23:10Z, S: Completed. Reviewed source `b918ef94` fast-forwarded onto `master` and pushed to `origin/master`. Integrated validation passed. Q chose to publish the fixture `query-mirror-epics.json` with real epic content (review note N1).
