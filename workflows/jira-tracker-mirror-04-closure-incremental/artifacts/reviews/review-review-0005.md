# Review review-0005: jira-tracker-mirror-04-closure-incremental

## Verdict

FAILURE.

- Frozen source commit: `17ae33962bb15eb7aead9c0cc08986a7b5ba2983`
- Frozen source tree: `ac0e81e19b6f2d44f294c33cee14ab472797519e`
- Review base commit: `5eae0ebeb765aa3e1fb9732402f447715757f8e2`
- Ticket: `tracker/tickets/jira-tracker-mirror-04-closure-incremental.md`, current version with the criteria added on 2026-11-16.

The original seven criteria are met. The five criteria added in `5eae0ebe` are not met. The source does not implement them. The ticket says any unmet criterion blocks.

## Scope

Diff: `git diff 5eae0ebe...17ae3396`, 3 files, +430 −33.

- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/jira-mirror.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/jira-mirror.test.ts`
- `mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/references/stores/jira.md`

Criteria status:

| # | Criterion | Status |
|---|-----------|--------|
| 1 | `closure: [children]` with `parent in (...)` batches | Met. `jira-mirror.ts:207`, test `jira-mirror.test.ts:275` |
| 2 | `closure: [blockers]` with `key in (...)`, repeat until none new | Met. `jira-mirror.ts:226-238`, test `:256` |
| 3 | No per-ticket call | Met. Closure uses batch JQL only. `--key` uses one `workitem get` by design |
| 4 | Incremental `updated >=` | Met. `jira-mirror.ts:99,116,365-384`, test `:301` |
| 5 | `--full`, stale mark, no delete | Met. `jira-mirror.ts:144-154`, test `:322` |
| 6 | `--key <KEY>` | Met. `jira-mirror.ts:110-111`, test `:348` |
| 7 | Tests: outside blocker chain, epic without children, stale key | Met |
| 8 | `closure: [parents]` | Not met. F1 |
| 9 | reckonone definition with new query and closure | Not met. F2 |
| 10 | `--full` with new definition, then one commit deletes stale files | Not met. F3 |
| 11 | Tracker pane shows blocker loop as warning | Not met. F4 |
| 12 | `herdr-app shot` of the Tracker pane | Not met. F5 |

## Findings

### Blocking

NO ADR : F1 (major). `closure: [parents]` is not implemented.

  - [jira-mirror.ts:57] `MirrorClosure` is `"children" | "blockers"` only.
  - [jira-mirror.ts:283] The definition parser rejects `parents` with "mirror.closure must be a list of children and blockers".
  - [jira-mirror.ts:218] `fetchClosure` has no step that fetches parents with `key in (...)`, filters `statusCategory != Done`, and then feeds those epics to the children closure.
  - Required change: add `parents` to `MirrorClosure` and the parser. In `fetchClosure`, collect the `parent` key of each fetched or mirrored ticket that is not known, fetch them in batches with `key in (...) AND statusCategory != Done`, and run the children closure on the result. Add unit tests: a parent that is done is not mirrored; an open parent's children are mirrored; batching holds. Update `references/stores/jira.md` and the help text.
  - Validation: `bun test skills/reading-and-writing-tickets/scripts` in `mise/conf.d/devtools-agent/bundles/matt-pocock`.

NO ADR : F2 (major). The reckonone tracker definition is not changed.

  - [shared-context/github-com-reckon-limited-reckonone-monorepo--cf409636/docs/agents/issue-tracker.md:1] The definition must hold one query `project = RWR AND assignee = currentUser() AND parent is not EMPTY` with `closure: [parents, children, blockers]`, and must not hold `payroll-epics` or `payroll-open-issues`. The implementation receipt records only an uncommitted `closure: [children, blockers]` line. F1 blocks this change.
  - Required change: after F1, edit and commit the definition in the zeno shared-context repo with Q's approval.
  - Validation: `mq` read of the definition frontmatter `mirror` block.

NO ADR : F3 (major). The stale-file cleanup did not run.

  - [jira-mirror.ts:144] The stale mark exists, but no `--full` sync with the new definition ran and no commit deletes the stale files. Commit `72fb5776` (10199 issues) is still the mirror state.
  - Required change: after F1 and F2, run one `--full` sync, then make one commit in the reckonone shared context that deletes exactly the files with `mirror_status: stale`. Record both commits and the counts as evidence.
  - Validation: `git show --stat <delete-commit>` lists only deletions, and each deleted path had `mirror_status: stale` in the parent commit.

NO ADR : F4 (major). The Tracker pane still fails on a blocker loop.

  - [mise/conf.d/devtools-herdrapp/app/mods/shared-context/data.ts:103] The mod calls `loadExplorerSnapshot(context, exec)` without a diagnostics sink. The same applies at `:145` and `:159`. The unscoped strict form calls `validateRelations` and throws "Cycle in ticket blocker graph". The live mirror has 27 loops (implementation receipt), so the pane shows an error, not the graph.
  - The uncommitted base change to `workflow.ts` keeps the throw for an unscoped strict load, so it does not fix this.
  - Required change: pass a diagnostics sink in the mod, show each cycle diagnostic as a warning, and draw the graph. Add a test in the Herdr-app mod tests with a two-ticket loop.
  - Validation: `mise exec -- bun test tests` in `mise/conf.d/devtools-herdrapp/app`.

NO ADR : F5 (major). No `herdr-app shot` evidence.

  - [workflows/jira-tracker-mirror-04-closure-incremental/artifacts/snapshots:1] No capture of the Tracker pane for reckonone exists. The receipt lists the old `collect-evidence` criterion as blocked. The ticket now names `herdr-app shot`.
  - Required change: after F1-F4, capture the pane with `herdr-app shot`, with epics, a blocker graph, and the loop warning visible. Store it as workflow evidence.
  - Validation: the evidence file exists and shows the three elements.

### Non-blocking notes

- N1 [jira-mirror.ts:209] `key in (...)` with a deleted key or a key that the `twg` user cannot see can make Jira reject the whole JQL. One bad blocker key would then fail the sync. The live run passed, so this is a plausible risk, not a confirmed bug. Consider a fallback that splits the batch on a JQL key error.
- N2 [jira-mirror.ts:222] In an incremental sync, the children of an already-mirrored epic get the time filter. If `children` is added to `mirror.closure` after the epics are mirrored, old children are not fetched until `--full`. `references/stores/jira.md` should say to run `--full` after a change to `mirror.closure`.
- N3 [jira-mirror.ts:233] The refresh of mirrored blockers runs only in round 0. A mirrored blocker first seen in a later round is not refreshed. Low impact.
- N4 [jira-mirror.ts:121] An incremental sync uses stale files as mirrored nodes. A stale epic still gets a children query. Low impact; `--full` corrects the marks.
- N5 [jira-mirror.ts:162] The `--key` result reports `queries: []` although the file keeps its query names. Correct, but the JSON field can mislead a reader.

## Validation

| argv | cwd | exit | detail |
|------|-----|------|--------|
| `bun test skills/reading-and-writing-tickets/scripts` | `<worktree>/mise/conf.d/devtools-agent/bundles/matt-pocock` | 0 | 75 pass, 0 fail |
| `bun run typecheck` | `<worktree>/mise/conf.d/devtools-agent/bundles/matt-pocock` | 127 | `tsc: command not found`. The worktree has no `node_modules` |
| `bun run typecheck` | scratch copy of `git archive 17ae3396 mise/conf.d/devtools-agent/bundles`, `matt-pocock` with base `node_modules` linked | 0 | Same frozen tree. The worktree was not changed |
| `bun test` | `<worktree>/mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree` | 0 | 105 pass, 0 fail |

`<worktree>` is `/home/zenobius/Projects/dotfiles.worktrees/feat-jira-tracker-mirror-04-closure-incremental`, at HEAD `17ae3396`, clean.

## Contracts and integration hazards

- `tracker-mirror/v1`: the sync adds the optional field `mirror_status: "stale"`. `workflow.ts:606-607` on master accepts it and maps it to `fields.stale`. No schema bump is needed. `renderMirrorFile` omits the field, so a returned key loses the mark. Correct.
- `mirror.closure`: F1 changes the allowed values. `workflow.ts:93` tells the user to "Add blockers to mirror.closure". That text stays valid.
- `MIRROR_SCHEMA`: unchanged. `workflow.ts:9` imports it; the worktree tests pass.
- Uncommitted base changes (`workflow.ts`, `inspect.test.ts`, `SKILL.md`, `references/troubleshooting/blocker-cycle.md`): no file overlap with this source.
  - The cycle error text changes from `Cycle in ticket blocker graph at <id>` to `Cycle in ticket blocker graph: A -> B -> A`. Any caller that matches the old text breaks. The implementation receipt quotes the old text.
  - A scoped strict load now checks loops only in the scoped tickets. An unscoped strict load still throws. The Herdr-app mod uses the unscoped strict form, so F4 still needs a mod change.
  - The worktree tests pass with the uncommitted changes in the base checkout. This review ran them in the source worktree, which does not hold those changes.
- Stale files take part in the snapshot graph and in cycle detection. Until F3 deletes them, loops in closed work still reach the pane.
