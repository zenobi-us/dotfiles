# Review review-0012: jira-tracker-mirror-01-twg-parser

- Frozen source commit: `b0e993bd0fb7d93bcbda133334a7ea42299a0533`
- Frozen tree: `dc31b14ce89441f60e87599e0d557fc952b30dba`
- Branch: `fix/jira-tracker-mirror-01-twg-parser`. Base: `master`.
- Attempt: 2. Parent receipt: `review-start-0011`.
- ADR: NO ADR. ADR 0001 does not apply to this change.

## Verdict

**SUCCESS.** No blocking finding. All five acceptance criteria are met at `b0e993bd`.

## Scope

- Diff: `git diff master...b0e993bd`. 9 files: `scripts/twg-jira.ts`, `scripts/twg-jira.test.ts`, 6 fixtures under `scripts/fixtures/twg/`, and `scripts/dep-tree-cli.ts`. All files are under `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/`.
- Ticket: `tracker/tickets/jira-tracker-mirror-01-twg-parser.md`.
- Initiative section "Verified `twg` behaviour" in `tracker/initiatives/jira-tracker-mirror/index.md`.
- Repository standards: `AGENTS.md` and `~/.claude/CLAUDE.md`.

### Acceptance criteria

| Criterion | Result | Evidence |
| --- | --- | --- |
| One parser module returns key, title, type, status name, status category, parent key, blocker keys, description | Met | `twg-jira.ts:9-19` declares `JiraIssueRecord`. `parseJiraIssue` at `twg-jira.ts:82-100` fills all eight fields. |
| The parser follows every query page | Met | `queryJiraIssues` at `twg-jira.ts:30-45` loops on `pageInfo.nextCursor` with `--after`. It stops when `nextCursor` is absent and throws on a repeated cursor. |
| Clear error on an unexpected shape, no empty data | Met | `record` and `nonEmptyString` errors name the path. Tests cover `data.data.issues`, the `fields` wrapper, missing `issuelinks`, a key mismatch, a missing cursor, and a repeated cursor. |
| `dep-tree-cli.ts jira` uses the parser; `--epic` and `--ticket` print a DAG | Met | `dep-tree-cli.ts:7` imports the module. Live runs of `--epic RWR-19529` and `--ticket RWR-19543` printed the DAG. |
| Unit tests use recorded `twg` JSON for one page, two pages, no `pageInfo`, inward and outward links | Met | Fixtures `query-one-page`, `query-page-1`/`-2`, `query-no-page-info`, `get-inward-blocked-by`, `get-outward-blocks`. RWR-20902 has an inward `relates to` link and an outward `is blocked by` link. RWR-20903 has an inward `is blocked by` link. |

### Verified `twg` behaviour

- Query issues at `.data.issues[]`: `twg-jira.ts:58-60`.
- Get returns `.data` as an array with exactly one issue: `twg-jira.ts:74-76`.
- Flat fields, no `.fields` wrapper: `twg-jira.ts:86` rejects the wrapper.
- Blocker direction: only a link with `type.inward` "is blocked by" and `inwardIssue` counts as a blocker (`twg-jira.ts:115`). An outward link is skipped. This matches the initiative.
- Paging: `--limit 100`. A missing or null `pageInfo` ends the loop (`twg-jira.ts:61`). The fixtures confirm that `pageInfo` sits at the envelope top level.
- `--fields`: every query and get passes `JIRA_ISSUE_FIELDS` (`twg-jira.ts:35`, `twg-jira.ts:49`).

### Standards

- The module and test are TypeScript run by bun. `dep-tree-cli.ts` keeps the required shebang. No Python. No tsconfig `paths`. Pinned imports are unchanged.
- The new code follows the style of `dep-tree-shared.ts`: it uses `record`, `nonEmptyString`, `run`, and `parseJson`.
- The fixtures hold no personal data. A scan for account IDs, email addresses, display names, avatars, and home paths found none. The only site value is the company Jira host `reckon.atlassian.net`.

## Findings

### Blocking

None.

### Non-blocking notes

1. `twg-jira.test.ts:6` says the fixtures are trimmed from real output. The receipt `implementation-0005` says `query-one-page.json` is composed: live `twg` leaves out `pageInfo` on a single page. The comment should name that fixture as composed.
2. `twg-jira.ts:129-136`: the ADF conversion keeps `text` nodes only. It drops `mention`, `inlineCard`, `emoji`, `date`, and `status` nodes, and it joins table cells with no separator. This matters for later mirror tickets that show descriptions.
3. `dep-tree-cli.ts:68-70`: `jiraEpicChildren` gets full records from the query, keeps only the keys, and then `buildDependencyForest` calls `workitem get` for each child again. This is one extra `twg` call per child. The records from the query already hold the blocker keys.
4. `twg-jira.ts:114` and `twg-jira.ts:124`: strict parsing fails the whole graph on one malformed link or a non-ADF description. This matches the acceptance criterion "fails with a clear error".
5. The worktree has no `node_modules`, so `bun run typecheck` fails with `tsc: command not found` (exit 127) until `node_modules` is linked from the base checkout.

## Validation

| Command | Directory | Exit | Result |
| --- | --- | --- | --- |
| `git rev-parse HEAD 'HEAD^{tree}'; git status --porcelain` | worktree root | 0 | HEAD and tree match the frozen values. Worktree clean. |
| `mise exec -- bun test` | `.../skills/reading-and-writing-tickets` | 0 | 48 pass, 0 fail, 281 `expect()` calls across 5 files. |
| `mise exec -- bun run typecheck` | `.../bundles/matt-pocock`, with `node_modules` linked from the base checkout for the run and removed after | 0 | `tsc --noEmit` with no errors. Worktree clean after the link was removed. |
| `mise x -- <worktree>/.../scripts/dep-tree-cli.ts jira --epic RWR-19529` | `/home/zenobius/Projects/reckonone-monorepo` | 0 | DAG printed. RWR-19543 shows "blocked by RWR-19541". Read-only. |
| `mise x -- <worktree>/.../scripts/dep-tree-cli.ts jira --ticket RWR-19543` | `/home/zenobius/Projects/reckonone-monorepo` | 0 | Same DAG printed. Read-only. |

The recorded validation in `implementation-0005` matches these results. That receipt names commit `58c0b8a4`. `review-start-0011` records that `b0e993bd` is a rebase of `58c0b8a4` with an identical range-diff. This review ran every check against `b0e993bd`.
