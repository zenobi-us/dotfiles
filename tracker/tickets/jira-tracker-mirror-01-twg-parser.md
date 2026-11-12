---
schema: "tracker-ticket/v1"
id: "jira-tracker-mirror-01-twg-parser"
title: "Share one twg Jira parser and fix the Jira dependency graph"
type: "bug"
triage: "ready-for-agent"
work_status: "completed"
parent: "jira-tracker-mirror"
sequence: 1
blocked_by: []
---

## What to build

The Jira dependency graph command fails today. It reads `data.data.issues` and `issue.fields`, but `twg` returns neither path. Make one shared parser that reads the real `twg` output, and make the dependency graph command use it.

Verified `twg` output (2026-11-12, see the initiative):

- `workitem query` returns issues at `.data.issues[]`.
- `workitem get` returns `.data` as an array; one issue is `.data[0]`.
- Fields sit directly on each issue, with no `.fields` wrapper: `.summary`, `.status.statusCategory.key`, `.issuetype.name`, `.parent.key`, `.issuelinks[]`.
- Each issue link has only one of `inwardIssue` or `outwardIssue`. A blocker is a link whose `type.inward` is "is blocked by" and which has `inwardIssue`.
- The description is ADF.
- A query page holds 100 issues at most. Follow `pageInfo.nextCursor` with `--after` until `hasNextPage` is false. A response with no `pageInfo` is the last page.
- Always pass `--fields`. The default field set leaves out `parent`, `issuelinks`, and `description`.

## Acceptance criteria

- [ ] One parser module turns `twg` query and get output into issue records: key, title, type, status name, status category, parent key, blocker keys, description.
- [ ] The parser follows every query page.
- [ ] The parser fails with a clear error on an unexpected shape. It does not return empty data.
- [ ] The Jira dependency graph command uses the parser. `--epic` and `--ticket` print a DAG for a real RWR epic.
- [ ] Unit tests use recorded `twg` JSON: one page, two pages, a response with no `pageInfo`, and an issue with inward and outward links.

## Comments

- 2026-11-12T10:05Z, S: Review verdict **SUCCESS** for commit `58c0b8a4e4c608991076afe5a5d7da3f0e703f07`. Artifact: `workflows/jira-tracker-mirror-01-twg-parser/artifacts/reviews/review-review-0008.md`.
- 2026-11-12T10:34Z, S: Completed. Reviewed source `b0e993bd` (review-0012 SUCCESS, artifact `workflows/jira-tracker-mirror-01-twg-parser/artifacts/reviews/review-review-0012.md`) fast-forwarded onto `master` and pushed to `origin/master`. Integrated validation passed. Earlier review-0008 covered `58c0b8a4` before the rebase.
