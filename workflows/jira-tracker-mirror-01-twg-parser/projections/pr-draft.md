# fix(tickets): share one twg Jira parser for jira-tracker-mirror-01-twg-parser

Ticket: `tracker/tickets/jira-tracker-mirror-01-twg-parser.md`
Receipt: `events/implementation-0005.yaml` (parent `start-0004`, attempt 2). Earlier attempt: `events/implementation-0002.yaml`.
Source: `fix/jira-tracker-mirror-01-twg-parser` at `58c0b8a4e4c608991076afe5a5d7da3f0e703f07` (tree `62dfc338d2e15dfbd225978ddbb76f3e1416e7e8`)

## Problem

`dep-tree-cli.ts jira` read `data.data.issues` and `issue.fields`. `twg` returns neither path, so every Jira graph run failed. The old code also counted an outward "blocks" link as a blocker, and it read only the first query page.

## Change

- New module `scripts/twg-jira.ts`. It parses `twg` query and get output into issue records: key, title, type, status name, status category, parent key, blocker keys, description (ADF converted to plain text).
- `queryJiraIssues` follows `pageInfo.nextCursor` with `--after`. A missing `pageInfo` or `hasNextPage: false` ends the loop. A repeated cursor or a next page with no cursor is an error.
- Every call passes `--fields summary,status,issuetype,parent,issuelinks,description`.
- An unexpected shape throws an error that names the path. A `fields` wrapper, a missing `issuelinks` array, a non-array get `data`, and a key mismatch all fail.
- A blocker is a link whose `type.inward` is "is blocked by" and which has `inwardIssue`.
- `scripts/dep-tree-cli.ts jira` uses the module for epic children and for each issue.

## Changed files

- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/twg-jira.ts` (new)
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/twg-jira.test.ts` (new)
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/fixtures/twg/*.json` (6 new fixtures)
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/dep-tree-cli.ts`

## Validation

Attempt 2 (implementation-0005) reran the checks on the same source. No source change.

| Command | Result |
| --- | --- |
| `mise exec -- bun test` in `reading-and-writing-tickets` | passed: 48 pass, 0 fail |
| `bun run typecheck` in `bundles/matt-pocock` (base checkout `node_modules` linked, then removed) | passed: 0 errors |
| `records.ts check --repository <worktree> --ticket jira-tracker-mirror-01-twg-parser` | passed |
| `dep-tree-cli.ts jira --epic RWR-19529` (live, read-only) | passed: DAG printed, 18 lines |

Attempt 1 (implementation-0002):

| Command | Result |
| --- | --- |
| `mise exec -- bun test` in `reading-and-writing-tickets` | passed: 48 pass, 0 fail (11 new) |
| `bun run typecheck` in `bundles/matt-pocock` (with the base checkout `node_modules` linked, because the worktree has none) | passed: 0 errors |
| `records.ts check --repository <worktree> --ticket jira-tracker-mirror-01-twg-parser` | passed |
| `dep-tree-cli.ts jira --epic RWR-19529` (live, read-only) | passed: DAG printed |
| `dep-tree-cli.ts jira --ticket RWR-19543` (live, read-only) | passed: 18 nodes printed |
| `dep-tree-cli.ts jira --epic RWR-18175` (live, read-only) | failed as designed: real Jira cycle RWR-20177 ↔ RWR-20171 (links 169991, 169995) |

## Fixtures

Trimmed from real `twg` output recorded on 2026-11-12. `self` URLs, avatars, and personal data are removed. Descriptions keep their first paragraph. The three query fixtures reuse real issues and a real `pageInfo` cursor inside composed envelopes; the `hasNextPage: false` page is composed, because live `twg` leaves out `pageInfo` on a single page.

## Review history

None yet.

## Open questions

- `description` is plain text converted from ADF. Later tickets may need Markdown.
- Attempt 1 recorded `phase: start` on its phase-result. Attempt 2 (`implementation-0005`) records `phase: implementation`.
- RWR-18175 has a two-way blocker cycle in Jira. The graph command rejects it. The data needs a Jira fix, not a code fix.

## Merge status

Not merged. Not pushed.

## Latest reviewer verdict

None. No review receipt exists.

## Resolved findings

None.

## Remaining findings

None.

## Supporting records

- `events/start-0001.yaml` (attempt 1 phase-start)
- `events/implementation-0002.yaml` (attempt 1 phase-result, recorded `phase: start`)
- `events/start-0003.yaml` (attempt 1 phase-complete)
- `events/start-0004.yaml` (attempt 2 phase-start, retry)
- `events/implementation-0005.yaml` (attempt 2 phase-result, `phase: implementation`)
- `artifacts/snapshots/pr-draft-implementation-0002.md`
- `artifacts/snapshots/pr-draft-implementation-0005.md`

## Review history

- review-0008 (attempt 1), reviewed 58c0b8a4e4c608991076afe5a5d7da3f0e703f07: **SUCCESS**, no blocking findings. Artifact: [review-review-0008.md](../artifacts/reviews/review-review-0008.md). Receipts: [review-start-0007](../events/review-start-0007.yaml), [review-0008](../events/review-0008.yaml), [review-complete-0009](../events/review-complete-0009.yaml).
- Non-blocking notes: fixture provenance comment in twg-jira.test.ts:6; ADF to text drops inline nodes; strict parsing fails the whole graph on one odd issue; worktree typecheck needs node_modules.

## Merge status

Not merged. Latest verdict SUCCESS for 58c0b8a4e4c608991076afe5a5d7da3f0e703f07.
