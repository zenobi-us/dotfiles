# Review review-0011: jira-tracker-mirror-04-closure-incremental

## Verdict

FAILURE.

- Frozen source commit: `0b4ede0451accb74759e7b974f44500813a4f08d`
- Frozen source tree: `83ffe202acf36f55ccc032bdea83c4e7ddae752c`
- Review base commit: `7be23bdab8b74e3a4aa880fa2b35b9b3c50cecff`
- Merge base: `dc0b299c9effaad9fe6f2e134c3b5ad642d1d758`
- Ticket: `tracker/tickets/jira-tracker-mirror-04-closure-incremental.md`, read from the context checkout `/home/zenobius/Projects/dotfiles` (12 criteria). The branch copy holds only the first 8 criteria.
- Parent: `review-start-0010`, attempt 2.

Criteria 1-10 are met. Criterion 11 is met on the branch, but the change cannot merge: master moved the code that it edits (F6). Criterion 12 has no passing evidence (F5).

## Scope

Diff `dc0b299c..0b4ede04`: 14 files, +646 -53. Commits `a7e7964b`, `a606b850`, `17ae3396`, `e3b29197`, `5fe717c6`, `f140779a`, `555d5efd`, `0b4ede04`.

- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspection-exec.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/inspection-exec.test.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/stores/jira.md`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/jira-mirror.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/jira-mirror.test.ts`
- `mise/conf.d/devtools-herdrapp/app/mods/shared-context/{data.ts,graph-view.js,graph.js,main.js,ui.js}`
- `mise/conf.d/devtools-herdrapp/app/tests/{panel-state.fixture.mjs,request.test.ts,tree.test.ts}`
- `tracker/tickets/jira-tracker-mirror-04-closure-incremental.md`

Verified facts from the handoff:

1. `555d5efd` and `0b4ede04` follow `f140779a` (the `fix-0008` commit). No receipt covered them. This review covers them.
2. Master `7be23bda` is 126 commits after the merge base (`ce227ba3`, now master, is 127). It renames `app/mods/shared-context/data.ts` to `build/data.ts` (R060), deletes `request.ts`, `client.js` and the `app/tests/` files, and adds `app/bin/herdr-context.mjs`. Commits: `44de2f9b`, `27f0b55e`, `4f655214`.
3. F5 has no passing evidence. `after-receipt/helper-missing-master-mod.png` shows "Shared Context helper is missing. Deploy herdr-context on the selected machine."

## Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `closure: [children]`, `parent in (...)` batches | Met | `jira-mirror.ts:216-240`, test `jira-mirror.test.ts:276` |
| 2 | `closure: [blockers]`, `key in (...)`, repeat | Met | test `:257` |
| 3 | No per-ticket call | Met | batch JQL only |
| 4 | Incremental `updated >=` | Met | unchanged since review-0005 |
| 5 | `--full` marks stale, deletes nothing | Met | test `:358` |
| 6 | `--key <KEY>` | Met | unchanged since review-0005 |
| 7 | Tests: outside chain, epic without children, stale key | Met | `:257`, `:276`, `:358` |
| 8 | `closure: [parents]`, `statusCategory != Done`, then children | Met | `jira-mirror.ts:62,215,227-238,301`; tests `:300`, `:317` |
| 9 | reckonone definition | Met | zeno `1248308d`; HEAD frontmatter holds only `my-issues` and `closure: [parents, children, blockers]` |
| 10 | One `--full`, one commit deletes every stale file | Met | zeno `18c1eece`, `5909f930`. This review checked: 8779 files with `mirror_status: "stale"` in `18c1eece` equal the 8779 deletions in `5909f930`. The only other change is `context.json` (M) from the pre-commit hook |
| 11 | Pane shows loop as warning and draws the graph | Met on branch, not integrable | `data.ts:102-110`, `graph.js:2-28`; F6 |
| 12 | `herdr-app shot` with epics, graph, loop warning | Not met | F5 |

## Prior findings

| ID | Status at `0b4ede04` |
|----|----------------------|
| F1 | Resolved. |
| F2 | Resolved. |
| F3 | Resolved. Deletion set checked by this review. |
| F4 | Resolved on the branch. Not integrable with master; see F6. |
| F5 | Open. |

## Findings

### Blocking

NO ADR : F5 (major). No `herdr-app shot` evidence of the Tracker pane for reckonone.

  - [workflows/jira-tracker-mirror-04-closure-incremental/artifacts/evidence/fix-0008/tracker-pane-loading.png:1] Shows only the loading state.
  - [workflows/jira-tracker-mirror-04-closure-incremental/artifacts/evidence/fix-0008/after-receipt/helper-missing-master-mod.png:1] Shows "Shared Context helper is missing". The live app runs the master mod design, which needs `herdr-context`.
  - Why it blocks: criterion 12 is an acceptance criterion. No capture shows epics, a blocker graph and a loop warning.
  - Required change: after F6, deploy the rebased mod and helper, open the Tracker pane for reckonone, and capture it with `herdr-app shot`. Store it under `artifacts/evidence/<fix-run>/`.
  - Validation: the image exists and shows epics, a blocker graph, and a loop warning.

NO ADR : F6 (blocker). The Herdr-app changes target files that master moved or deleted.

  - [mise/conf.d/devtools-herdrapp/app/mods/shared-context/data.ts:102] `snapshotWithWarnings` (F4) and `:128` (ticket-body removal, `0b4ede04`) edit a file that master renamed to `mise/conf.d/devtools-herdrapp/build/data.ts`. `git merge-tree --write-tree 7be23bda 0b4ede04` reports a content conflict in `build/data.ts`.
  - [mise/conf.d/devtools-herdrapp/app/tests/request.test.ts:1], [app/tests/tree.test.ts:1], [app/tests/panel-state.fixture.mjs:1] Master deleted these files. Merge-tree reports modify/delete conflicts. The F4 loop tests would be lost.
  - On master, `build/data.ts:125` `tracker()` reads through `build/read-session.ts:27` `readSnapshot`, which calls `loadExplorerSnapshot(context, exec, undefined, undefined, progress)` without a diagnostics sink. `build/data.ts:173` does the same. So on master a blocker loop still stops the load, and criterion 11 regresses after any merge that takes master's side.
  - Why it blocks: the branch cannot merge cleanly, and a merge that drops the branch side loses F4 and the body removal. The reviewed source does not prove criterion 11 on the code that will ship.
  - Required change: rebase onto current master (Q approved). Keep `e3b29197`, `f140779a` and `555d5efd` (no conflict). Port F4 into the new design: give `readSnapshot` (or its callers in `build/data.ts` for tracker, detail and prepare) a diagnostics sink, return `warnings` from `tracker()` including the `treeOnly` path, and keep the `graph.js`, `graph-view.js`, `main.js` and `ui.js` warning display. Port the ticket-body removal to `build/data.ts` `tracker()`, and check that `app/bin/herdr-context.mjs` and `build/cache.ts` do not need the body. Move the two-ticket loop tests to master's test locations (`mise/conf.d/devtools-herdrapp/tests/*.test.mjs` or `build/*.test.ts`). Then do F5.
  - Validation: `git merge-tree --write-tree master HEAD` reports no conflict; `mise exec -- bun test` in the master Herdr-app test locations passes with a loop test; the four integration checks below pass.

### Non-blocking notes

- N1 [inspection-exec.ts:41-98] `555d5efd` is outside the ticket text, in the shared worktree skill. It is a performance fix that F5 needs (848 s to 49 s per the commit). The logic is exact: the index holds every prefix of each `-<digits>` run, and `includes` confirms each candidate, so the answer equals `git log --all --fixed-strings --grep`. The test compares with real git. The cache holds the history for one sweep; a commit made during a sweep is not seen until the next sweep. Accept.
- N2 [data.ts:128] Dropping `body` is safe for the branch UI: no mod `.js` file reads `ticket.body` from the tracker response; `detail` still returns the body (`main.js:363`). Recheck on master consumers during F6.
- N3 [tracker/tickets/jira-tracker-mirror-04-closure-incremental.md:7] The branch copy has the old 8 criteria. Merge-tree merges it without a conflict. Take master's text on rebase.
- N4 Prior notes N1, N3-N5 of review-0005 stay open and non-blocking. N2 of review-0005 is fixed in `jira.md:52`.
- N5 The zeno commits include `context.json` changes from the pre-commit hook and are pushed to `origin/gh-pages`. Q decided the push. No action for this ticket.

## Validation

All runs at `0b4ede04`. The worktree stayed clean (`git status --short` empty; HEAD and tree unchanged).

| argv | cwd | exit | detail |
|------|-----|------|--------|
| `bun test skills/reading-and-writing-tickets/scripts` | `<worktree>/mise/conf.d/devtools-agent/bundles/matt-pocock` | 0 | 77 pass, 0 fail |
| `bun run typecheck` | scratch `git archive 0b4ede04 mise/conf.d/devtools-agent/bundles`, `matt-pocock` with base-checkout `node_modules` linked | 0 | `tsc --noEmit` clean. The worktree has no `node_modules` |
| `bun test skills/git/worktree/scripts` | `<worktree>/mise/conf.d/devtools-agent/bundles/developer` | 0 | 106 pass, 0 fail (includes the new `555d5efd` test) |
| `mise exec -- bun test tests` | `<worktree>/mise/conf.d/devtools-herdrapp/app` | 0 | 45 pass, 0 fail |
| `git merge-tree --write-tree --name-only 7be23bda 0b4ede04` | base checkout | 1 | 4 conflicts: `build/data.ts` (content), `app/tests/{panel-state.fixture.mjs,request.test.ts,tree.test.ts}` (modify/delete). Writes objects only |
| `git grep -l '^mirror_status: "stale"' 18c1eece -- <reckonone>/tracker/jira` vs `git show --name-only --diff-filter=D 5909f930` | `/home/zenobius/Projects/zeno` | 0 | 8779 = 8779, identical lists |

`<worktree>` is `/home/zenobius/Projects/dotfiles.worktrees/feat-jira-tracker-mirror-04-closure-incremental`.

## Contracts and integration hazards

- Jira mirror definition (`mirror.closure`): allowed values are now `parents`, `children`, `blockers` (`jira-mirror.ts:62-63,301`). The error text changes. `workflow.ts` "Add blockers to mirror.closure" stays valid.
- `tracker-mirror/v1` files: optional `mirror_status: "stale"`. Master `workflow.ts` accepts it.
- `jira-mirror.ts sync` JSON result: `closure` counts gain `parents`.
- Shared-context mod tracker response (`data.ts tracker()`): adds `warnings: {ref, error}[]`; `tickets[]` lose `body`. On master the producer is `build/data.ts` and the consumer path runs through `app/bin/herdr-context.mjs` and `build/cache.ts`. F6.
- `loadExplorerSnapshot` diagnostics parameter: the 4th parameter on both sides; master adds a 5th `onProgress`. Master `readSnapshot` passes `undefined`.
- `graph.js` layout result: adds `warnings: string[]`; a loop no longer throws. Master did not change `graph.js`; merge-tree auto-merges `graph-view.js` and `main.js`.
- Worktree inspection executor (`createInspectionExecutor`): answers `git -C <repo> log --all --format=%H --fixed-strings --grep=<text>` from a per-sweep cache. Any caller that issues that exact argv in one sweep gets cached history.
- Master workflow.ts changes since review-0005: not in this branch diff. The branch tests pass against the branch copy only. Run the integration checks again after rebase.
