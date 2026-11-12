# fix(tickets): share one twg Jira parser for jira-tracker-mirror-01-twg-parser

Ticket: `tracker/tickets/jira-tracker-mirror-01-twg-parser.md`
Receipt: `events/implementation-0002.yaml` (parent `start-0001`)
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
- The handoff asked for `phase: start` on this phase-result receipt. Earlier workflows use `phase: implementation`.
- RWR-18175 has a two-way blocker cycle in Jira. The graph command rejects it. The data needs a Jira fix, not a code fix.
