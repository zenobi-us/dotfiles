# Review review-0010: jira-tracker-mirror-02-sync-query

## Verdict

SUCCESS. No blocking finding.

- Frozen source commit: `b918ef940649f41b1bc586e68e4a4395cd124696`
- Frozen tree: `da2ec59d2c877de29694405f02b979568cae2b53`
- HEAD and tree match the frozen target. The worktree is clean.
- ADR: NO ADR. ADR 0001 (Pi Ink cleanup trust boundary) does not apply.

## Scope

Diff `git diff master...b918ef94`, 8 files:

- `scripts/jira-mirror.ts` (new), `scripts/jira-mirror.test.ts` (new)
- `scripts/adf-markdown.ts` (new), `scripts/adf-markdown.test.ts` (new)
- `scripts/twg-jira.ts`, `scripts/twg-jira.test.ts`
- `scripts/fixtures/twg/query-mirror-epics.json` (new)
- `references/stores/jira.md`

All paths are under `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/`.

Out of scope: closure, incremental sync, `--full`, `--key` (ticket 04).

### Acceptance criteria

| Criterion | Result | Evidence |
| --- | --- | --- |
| Reads `mirror.root` and `mirror.queries`; resolves root through shared-context | Met | `jira-mirror.ts:108-146`. Root comes from `resolveContextRecord(alignment)`, `validateRelativePath`, and `validateStorePath` (symlink escape check) at `jira-mirror.ts:70,76`. Test `jira-mirror.test.ts:206`. |
| Clear error on non-jira backend or missing `mirror` block | Met | `jira-mirror.ts:125,127`. Tests `jira-mirror.test.ts:194,200`. twg is not called before the check. |
| `tracker-mirror/v1` frontmatter with all 11 fields; body is ADF as Markdown | Met | `jira-mirror.ts:152-170`. Test `jira-mirror.test.ts:100-113`. |
| Queries include closed epics; no status filter | Met | JQL passes through unchanged (`jira-mirror.ts:140`, test line 94). Live run wrote 219 epics, including Cancelled and Done. |
| Second run with no Jira changes writes nothing | Met | `jira-mirror.ts:79-81` keeps the earlier `synced_at`. Test line 127. Live second run: 0 written, no commit. |
| One tracker commit for changed mirror files | Met | `jira-mirror.ts:193-201`. Tests lines 120-124, 160. Live commit `9eb5476`. |
| Real run on reckonone `cf[12059] = Payroll` epics | Met | `9eb5476` adds 219 files under `tracker/jira/`. Sample `RWR-958.md` has the expected frontmatter. |

### Initiative decisions

- Tracker definition `mirror` block: matches (`root`, `queries`). `closure` belongs to ticket 04.
- Step 1: `JIRA_ISSUE_FIELDS` adds `updated` (`twg-jira.ts:30`). `--limit 100` and paging stay in the shared parser (ticket 01).
- Step 4: file name `<root>/<KEY>.md`, key checked against `^[A-Z][A-Z0-9_]*-[0-9]+$` (`jira-mirror.ts:75`).
- Step 7: one commit per sync. Mirror files are committed.
- Verified twg behaviour: fields read directly from each issue, no `.fields` wrapper. Matches.

### Correctness checks

- Frontmatter encoding: each value is `JSON.stringify`, which is valid YAML. Quotes, colons, and `#` round-trip through `Bun.YAML` and the okf `mq` reader (test lines 142, 179).
- Path safety: `validateRelativePath` rejects `..`, absolute, backslash, and empty parts. `validateStorePath` rejects symlink escape.
- Unrelated staged changes: `git commit --only -- .` commits a temporary index of HEAD plus the mirror root. The test keeps `M  unrelated.txt` staged. Live receipt shows the earlier staged diff hash unchanged.
- Pre-commit hook that adds files: with `--only`, the hook runs against the temporary index, so a file the hook adds goes into the sync commit. In `zeno`, `hk` added a rebuilt `context.json` to `31cef2f` and `9eb5476`. The real index keeps the user's staged `context.json`. This is correct: the repository hook owns that policy, and `--no-verify` would be worse. The documentation wording is inexact (N2).

### Repository standards

- `jira-mirror.ts` has the exact shebang and mode `100755`. Library modules have no shebang, as in the existing code.
- No Python. No tsconfig `paths` change. No new npm imports.
- Style matches `twg-jira.ts` and `dep-tree-shared.ts`: shared `record`, `nonEmptyString`, `compareIds` helpers; one-line head comments.
- `references/stores/jira.md` matches the code, except N2.

## Findings

### Blocking

None.

### Non-blocking notes

- **N1** `scripts/fixtures/twg/query-mirror-epics.json:537,932,905` — the fixture holds real employer Figma file URLs (file keys `KltpzGaNBpeeHWhy0PVZvv`, `oalf9pmJERJI3ZGCoAfmdB`) and an Aha idea URL. `zenobi-us/dotfiles` is PUBLIC. This is not personal data, so it does not fail the ticket criterion, and master fixtures already hold Jira titles. But a Figma file key can grant access when link sharing is on. Recommend: replace both with `https://www.figma.com/design/EXAMPLE/...` and keep the assertion at `twg-jira.test.ts:109` (`toContain("...<https://www.figma.com/design/")` still passes). [bias: fix before merge; costs two lines.]
- **N2** `references/stores/jira.md:41` — "It commits only the mirror root" is false when a pre-commit hook stages files (live `context.json` case). Add: "A pre-commit hook can add its own files to that commit."
- **N3** `scripts/jira-mirror.ts:199` — if the commit fails (hook rejects), mirror files stay staged in the real index from `git add` at line 195. The next run commits them. Acceptable, not documented.
- **N4** `scripts/jira-mirror.ts:194` — `git -C <mirrorRoot>` uses the nearest parent repository. If the store is not a Git repository, the commit lands in an unrelated enclosing repository or fails. Same as review-0005 N3.
- **N5** `scripts/jira-mirror.ts:79` — `synced_at` holds the time of the last change, not the last sync. Ticket 05 ("age of newest `synced_at`") needs another freshness source, for example the commit time or a sync stamp file.
- **N6** `scripts/adf-markdown.ts:115,57,137` — text is not Markdown-escaped. A backtick in a `code` mark, ``` in a code block, or `)` in a link href breaks the delimiters. Read-only mirror; low impact.
- **N7** `scripts/jira-mirror.ts:73-84` — a bad key throws mid-loop after earlier files are written. Files stay uncommitted until the next good run. Low impact; Jira keys always match.
- **N8** Live mirror files in `zeno` hold real mention names. The store is private. Not a code defect.

## Validation

| Command | Directory | Exit | Result |
| --- | --- | --- | --- |
| `git rev-parse HEAD HEAD^{tree}; git status --porcelain` | worktree | 0 | `b918ef94` / `da2ec59d`; clean |
| `mise exec -- bun test` | `.../reading-and-writing-tickets` | 0 | 67 pass, 0 fail, 326 expect calls |
| `git ls-tree b918ef94 .../scripts/` | worktree | 0 | `jira-mirror.ts` mode `100755` |
| `gh repo view --json visibility` | worktree | 0 | `PUBLIC` (input to N1) |
| `git show --stat 31cef2f` / `9eb5476` | `/home/zenobius/Projects/zeno` | 0 | `31cef2f`: `context.json` + `issue-tracker.md`. `9eb5476`: 219 mirror files + `context.json` (220 files) |
| read `tracker/jira/RWR-958.md`, count files | `/home/zenobius/Projects/zeno/shared-context/...cf409636/` | 0 | 219 files; frontmatter as specified |

Typecheck not re-run. The implementation receipt records `bun run typecheck` exit 0 on the byte-identical diff. No sync was run against `zeno`; nothing was changed there.
