# Review review-0008: jira-tracker-mirror-01-twg-parser

- Frozen source commit: `58c0b8a4e4c608991076afe5a5d7da3f0e703f07`
- Frozen source tree: `62dfc338d2e15dfbd225978ddbb76f3e1416e7e8`
- Branch: `fix/jira-tracker-mirror-01-twg-parser`. Base: `master`.
- Parent receipt: `review-start-0007`.

## Verdict

SUCCESS. No blocking finding.

## Scope

Diff: `git diff master...58c0b8a4`. Nine files under `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/`:

- `twg-jira.ts` (new shared parser)
- `twg-jira.test.ts` (new tests)
- `fixtures/twg/*.json` (six fixtures)
- `dep-tree-cli.ts` (now uses the parser)

Checked against:

- the ticket `tracker/tickets/jira-tracker-mirror-01-twg-parser.md`, five acceptance criteria;
- the initiative section "Verified `twg` behaviour";
- `AGENTS.md` and `~/.claude/CLAUDE.md` script rules;
- receipts `implementation-0002` and `implementation-0005`.

ADRs: NO ADR. ADR 0001 (Pi Ink cleanup trust boundary) does not apply to this change.

### Acceptance criteria

| Criterion | Result | Evidence |
| --- | --- | --- |
| One parser module gives key, title, type, status name, status category, parent key, blocker keys, description | Met | `twg-jira.ts:9-19` `JiraIssueRecord`; `parseJiraIssue` at `twg-jira.ts:82-100` |
| Parser follows every query page | Met | `queryJiraIssues` at `twg-jira.ts:30-45` loops on `pageInfo.nextCursor` with `--after`; test "follows pageInfo.nextCursor with --after" |
| Clear error on unexpected shape, no empty data | Met | Every path goes through `record`/`nonEmptyString` with a labelled path. Tests reject `data.data.issues`, a `fields` wrapper, missing `issuelinks`, a key mismatch, a missing cursor and a repeated cursor |
| Dependency graph command uses the parser; `--epic` and `--ticket` print a DAG for a real RWR epic | Met | `dep-tree-cli.ts:7,63-71`. Live run in this review: `--epic RWR-19529` and `--ticket RWR-19543` both exit 0 and print the DAG |
| Unit tests use recorded `twg` JSON for one page, two pages, no `pageInfo`, inward and outward links | Met | Fixtures `query-one-page`, `query-page-1`/`-2`, `query-no-page-info`, `get-inward-blocked-by`, `get-outward-blocks` |

### Verified `twg` behaviour

- Query reads `.data.issues[]` (`twg-jira.ts:59`). Get reads `.data` as a one-item array (`twg-jira.ts:74-75`).
- Fields are read flat. A `fields` wrapper on the issue throws (`twg-jira.ts:86`).
- Blocker direction is correct. A link with `type.inward` "is blocked by" and `inwardIssue` names a blocker (`twg-jira.ts:115-116`). Fixture `get-inward-blocked-by` gives `RWR-20903` blocked by `RWR-20902`. Fixture `get-outward-blocks` gives no blockers. Live output shows `RWR-19543` blocked by `RWR-19541`.
- Each link must have exactly one endpoint (`twg-jira.ts:114`).
- Every call passes `--fields summary,status,issuetype,parent,issuelinks,description` (`twg-jira.ts:25`).
- Page size is `--limit 100`. A missing `pageInfo` ends the loop. `hasNextPage: false` ends the loop. A repeated cursor throws, so the loop cannot run forever.

### Repository standards

- `dep-tree-cli.ts` keeps the required shebang. `twg-jira.ts` is a module, not a script, so it has no shebang. This matches `dep-tree-shared.ts`.
- No Python, no tsconfig `paths`, no new npm imports.
- `twg` runs through `execFileSync` with an argument array. No shell. JQL input comes from a key that `jiraIssue` validates first.
- Fixtures hold no personal data. No `assignee`, `reporter`, `accountId`, `emailAddress`, `displayName` or avatar fields. They hold issue keys, summaries, statuses and the site name `reckon.atlassian.net`.

## Findings

### Blocking

None.

### Non-blocking notes

1. Fixture provenance comment is not exact.
   - [twg-jira.test.ts:6] The comment says all fixtures are trimmed from real output. `query-one-page.json` is composed: live `twg` leaves out `pageInfo` on a single page, as receipt `implementation-0005` states. `query-page-1.json` holds a cursor that decodes to the JQL `project = RWR AND updated >= -30d`, but its `request.jql` is `key in (...)`. The fixture is stitched from two runs. The tests stay valid. Correct the comment when the file is next changed.
   - Live `query-page-2.json` (a real last page) also has no `pageInfo`. The `hasNextPage: false` branch at `twg-jira.ts:63-66` may never occur live. It is harmless defensive code.
2. ADF to text conversion loses some content.
   - [twg-jira.ts:129-136] Inline nodes such as `mention`, `inlineCard`, `emoji`, `date` and `status` give no text. Table cells join with no separator. This does not affect the dependency graph. Later mirror tickets (02 onward) that show descriptions need a better converter, as receipt `implementation-0005` already notes.
3. Strict parsing fails the whole graph on one odd issue.
   - [twg-jira.ts:114,124] A link with two or zero endpoints, or a description that is not an ADF `doc`, throws for the whole command. This matches the acceptance criterion "fails with a clear error". Record it as a known trade-off for the sync tickets.
4. Typecheck needs `node_modules`.
   - The worktree has no `node_modules`, so `bun run typecheck` fails with exit 127 inside it. This review ran the typecheck in a scratch copy of the frozen commit. This is a workflow gap, not a defect in this change.

## Validation

| Command | Directory | Result |
| --- | --- | --- |
| `git rev-parse HEAD HEAD^{tree}; git status --porcelain` | worktree | HEAD and tree match the frozen values. Worktree is clean |
| `mise exec -- bun test` | `.../skills/reading-and-writing-tickets` | 48 pass, 0 fail, 281 `expect()` calls, 5 files |
| `bun run typecheck` | scratch copy of `git archive 58c0b8a4`, `node_modules` linked from the base checkout | `tsc --noEmit` exit 0 |
| `mise x -- <worktree>/.../dep-tree-cli.ts jira --epic RWR-19529` | `/home/zenobius/Projects/reckonone-monorepo` | exit 0, 18 lines, `RWR-19543` blocked by `RWR-19541`. Read-only |
| `mise x -- <worktree>/.../dep-tree-cli.ts jira --ticket RWR-19543` | `/home/zenobius/Projects/reckonone-monorepo` | exit 0, same DAG. Read-only |
| Fixture key scan for personal data | `scripts/fixtures/twg` | No personal fields found |
