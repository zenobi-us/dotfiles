# Review review-0005: jira-tracker-mirror-02-sync-query

- Frozen source commit: `5c9c2859ed8371a06dff37e159b899a8b7a82b1f`
- Frozen tree: `ba4e4fa1e0f24825edd8f29cb9cea35f2af6c4e3`
- Diff: `git diff master...5c9c2859` (8 files)
- Parent receipt: `review-start-0004`

## Verdict

SUCCESS. No blocking finding. NO ADR applies.

## Scope

- Ticket `tracker/tickets/jira-tracker-mirror-02-sync-query.md`, all 7 acceptance criteria.
- Initiative `tracker/initiatives/jira-tracker-mirror/index.md`: tracker definition `mirror` block, sync steps 1, 4, 7, and "Verified `twg` behaviour". Closure, incremental sync, `--full`, and `--key` are out of scope (ticket 04).
- Files: `scripts/jira-mirror.ts`, `scripts/adf-markdown.ts`, `scripts/twg-jira.ts`, their tests, `scripts/fixtures/twg/query-mirror-epics.json`, `references/stores/jira.md`, all under `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/`.
- Live run: commits `31cef2f` and `9eb5476` in `/home/zenobius/Projects/zeno`, and the mirror file `RWR-12937.md`. Read only.

### Acceptance criteria

| Criterion | Result | Evidence |
| --- | --- | --- |
| Reads `mirror.root` and `mirror.queries`; resolves root through shared-context | Met | `jira-mirror.ts:108-146` uses `resolveSharedContext`, `resolveContextRecord`, `validateRelativePath`, `validateStorePath` |
| Clear error on non-jira backend or missing `mirror` block | Met | `jira-mirror.ts:125-127`; tests `jira-mirror.test.ts:194-204` |
| Frontmatter fields and ADF body | Met | `jira-mirror.ts:152-170`; test `jira-mirror.test.ts:100-118`; live file `RWR-12937.md` |
| Closed epics included; no status filter | Met | JQL passes unchanged (`jira-mirror.ts:62-63`); test asserts exact JQL (`jira-mirror.test.ts:94`); live run returned 219 epics, Done included |
| Second run writes no changes | Met | `jira-mirror.ts:79-81` keeps `synced_at`; test `jira-mirror.test.ts:127-140`; live second run: 0 written, no commit |
| One tracker commit for changed mirror files | Met | `jira-mirror.ts:193-201`; tests check one commit and the file list |
| Real run on reckonone shared context | Met | commit `9eb5476`, 219 mirror files |

### Specific checks

- Frontmatter encoding: each value is `JSON.stringify` output, valid YAML. Test covers quotes, colon, and `#`, parsed by `okf_parse`.
- Path safety: `mirror.root` must pass `validateRelativePath` (no `..`, no absolute path). `validateStorePath` checks the root and each file for symlink escape. Jira keys must match `^[A-Z][A-Z0-9_]*-[0-9]+$` before use as a file name.
- Unrelated staged changes: `git commit --only -- .` keeps them staged. Test asserts `M  unrelated.txt` after both runs. Live receipt records the same staged-diff hash before and after.
- Pre-commit hook that adds files: see note N1. Judged correct.
- Fixtures: mention names and IDs are replaced with `@Example Person` and `000000:example-person`. No email or account ID remains. Company URLs (`reckon.atlassian.net`, Figma, Aha) remain; they are not personal data.
- Standards: exact shebang on `jira-mirror.ts`, executable bit set. No Python. No tsconfig `paths`. No new npm import. Cross-bundle relative import to shared-context matches `setup.ts` and `dep-tree-markdown.ts`.
- `references/stores/jira.md` matches the CLI flags, the `mirror` block shape, and the commit behaviour, except the wording in N1.

## Findings

### Blocking

None.

### Non-blocking notes

N1. NO ADR : Commit scope under a pre-commit hook.

  - [mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/jira-mirror.ts:199] `git commit --only` runs hooks on a temporary index. A hook that stages a file adds it to the tracker commit. In `/home/zenobius/Projects/zeno` the `hk` hook added `context.json` to `31cef2f` and `9eb5476`. That file is a derived index of the committed paths, so the hook keeps a repository invariant. Bypassing it with `--no-verify` would be worse. The behaviour is correct.
  - [mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/stores/jira.md:41] "It commits only the mirror root" is not exact. Suggested text: "It stages only the mirror root. A pre-commit hook of the store repository can add its own files to the commit."

N2. NO ADR : Failed commit leaves the mirror staged.

  - [mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/jira-mirror.ts:195] `git add --all -- .` stages into the real index before the commit. If the hook rejects the commit, the mirror files stay staged, mixed with the user's staged work. The next sync commits them, so no data is lost.

N3. NO ADR : Store that is not a Git repository.

  - [mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/jira-mirror.ts:194] `git -C <mirrorRoot>` walks up to any parent repository. A shared-context store outside Git commits into whatever repository contains it, for example a home-directory repository. Consider a check that `git rev-parse --show-toplevel` contains the store root.

N4. NO ADR : `synced_at` means "last changed", not "last synced".

  - [mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/jira-mirror.ts:79] Unchanged files keep the old `synced_at`, which the idempotency criterion requires. The initiative says the Herdr-app mod shows "the age of the newest `synced_at`" (ticket 05). After a no-change sync, that age does not reset. Ticket 03 or 05 needs another freshness source, for example the tracker commit date or a sync-state file.

N5. NO ADR : ADF to Markdown does not escape Markdown text.

  - [mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/adf-markdown.ts:115] Text with `*`, `_`, `<`, a leading `#`, or a leading `1.` renders as Markdown syntax. A code mark with a backtick, a link `href` with `)`, and a code block with a triple backtick break their delimiters (`adf-markdown.ts:57`, `:132`, `:137`). Words are kept; only formatting changes. Acceptable for a read-only mirror.

N6. NO ADR : Live mirror holds real names.

  - The live file `RWR-12937.md` in `/home/zenobius/Projects/zeno` contains real mention names from Jira. That is the private store and expected. The committed fixture in this repository is clean.

## Validation

| Command | Directory | Result |
| --- | --- | --- |
| `git rev-parse HEAD HEAD^{tree}`; `git status --porcelain` | worktree | `5c9c2859…`, `ba4e4fa1…`, clean |
| `mise exec -- bun test` | `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets` | 67 pass, 0 fail, 326 expect calls |
| `git show --stat 31cef2f 9eb5476` | `/home/zenobius/Projects/zeno` | `31cef2f`: tracker definition + `context.json`. `9eb5476`: 219 mirror files + `context.json` |
| `git show 9eb5476 -- context.json` | `/home/zenobius/Projects/zeno` | Hook output: index entries for the committed paths |
| Read `tracker/jira/RWR-12937.md` | live shared context | Frontmatter matches the schema; body is Markdown |
| Fixture scan for `accountId`, emails, `@` names | `scripts/fixtures/twg` | Only placeholder names and IDs |

Not rerun: `bun run typecheck`. The worktree has no `node_modules`. The implementation receipt records a pass with a temporary link.
