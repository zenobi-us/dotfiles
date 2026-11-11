---
title: Herdr Context and Tracker independent review — review-0015
type: Report
---

# Independent review — review-0015

## Verdict

SUCCESS. No blocking finding remains in the four-correction scope. This verdict applies only to the frozen commit and tree below. Any source change invalidates it.

## Frozen scope

Ticket: `tracker/tickets/herdr-context-panels.md` (local-markdown). Source branch: `closeout/herdr-context-panels`. Base branch: `master`.

Source checkout: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/closeout-herdr-context-panels`. Workflow and evidence store: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`, `workflows/herdr-context-panels`.

Reviewed commit: `6fac3b638ca19c670ce9df7f4d1ee20b0414d40c`. Reviewed tree: `c813ac0a32a4ef7103a424b7c5395a2192f39b84`. Fixed point and base-before: `358da5adabbc33bb14c42646fb5b82cad8f3a7f2`.

Diff: `git diff 358da5adabbc33bb14c42646fb5b82cad8f3a7f2...6fac3b638ca19c670ce9df7f4d1ee20b0414d40c`.

Reviewed commits: `66754765bfc98baa79181e80e4b64c70c54e3ca8` and `6fac3b638ca19c670ce9df7f4d1ee20b0414d40c`. Prior failed source: `fa5a5e221fa8a31c3cae3be355f426aabf9e5e1c`, tree `67b6bdd4a5722a71d6c9c3a2306628b8d412d90c`.

The review covers only S-001, P-001, P-002 and P-003 and their caller, test and documentation effects. It does not reopen unrelated work. Existing canonical APIs, additional graphs, initiative membership, queues, C/C2 rendering and explicit fresh-session actions remain in scope for regression inspection.

The source was clean and matched the handoff before review and before publication. The read-only workflow inspector reported a valid history and the same source identity. Its retry/observe state describes this active review; `review-start-0014` supplies the authorization.

## Standards

Standards: no blocking findings.

Documented standards: no breach found in the four corrections or their callers, tests, and documentation. CONTEXT-MAP.md and docs/agents/domain.md govern context ownership and terminology. CONTEXT.md is absent. The ADR index contains only the unrelated Pi Ink decision. No applicable ADR exists.

S-001 is resolved in source: mise/conf.d/devtools-herdrapp/app/mods/shared-context/main.js:103–120 restores saved expanded folders before requesting every retained path. loadFolder at lines 166–176 preserves repository-revision guards. tests/panel-state.fixture.mjs:63–87 covers refreshed descendant contents, settings restoration, and obsolete repository responses. Supplied nested-refreshed.png and nested-settings-restored-settled.png show populated descendants; these are consumed evidence, not checks I ran.

Caller review: tree.js:6–54 restores blockedBy traversal and canonical references. main.js:246–258 retains shared C/C2 rendering and reference navigation. graph-view.js:23,65–83 supplies the graph action identity consumed by action.js:20–23. Action-menu input/preset handlers invalidate preparation. main.js:187–195 guards preview success and failure with the same monotonic request generation. Behavioral tests cover stale success/error, A-B-A, newer busy-state retention, and unchanged launch once. README.md:644–652 documents the corrected behavior.

Baseline smells: no material judgement-call finding. Shared invalidation and existing view state conventions avoid a second abstraction.

Validation: fresh read-only inspection of the pinned diff and supplied workflow/evidence records. No builds, lint, tests, formatters, native app operations, or source changes. Parent must run independent verification before a final verdict.

Fresh session: terminal `t6n`, run `e24867e0-8485-493a-b529-c7f4af164b38`. No mid-flight build, lint, test, formatter or app operation ran.

## Spec

No blocking Spec findings in the four-correction scope. Read all nine original ticket criteria and the supplied review/fix records. No applicable ADR.

P-001: tree.js:6-25,31-54 now traverses blockedBy, validates cycles/missing records, nests prerequisites, and retains canonical references beneath collapsed ancestors. main.js:246-269 shares this tree between C/C2 and reveals canonical paths. Initiative membership and the additional graph remain intact. tree.test.ts:15-64 covers nesting, references, queue context, membership errors and cycles. Supplied native tree-c2.png visibly shows both dependency paths and the shared arrow; acceptance.json records C/C2 navigation.

P-002: action.js:18-40 binds preparation to generation, panel revision, open-menu identity and repository/record identity before pane.split. main.js:62-88,137-143 and action-menu.js:17-20,47-75,133-137 invalidate relevant changes. Success, error and busy completion use the same guard. panel-state.fixture.mjs:110-143 covers stale success/error, input/repository/record/closure changes, newer busy state and one unchanged launch. Supplied native evidence records delayed real preparation and the fresh-session launch.

P-003: main.js:187-197 uses monotonic fileRevision for success and failure; returning to the tree invalidates requests at line 227. Fixture lines 90-108 cover stale failure and A-B-A success/failure. Supplied native evidence records both failure orderings.

S-001 interaction: main.js:114-120 reloads every retained expanded folder, including restored descendants, while loadFolder retains repository guards. Fixture lines 63-88 and supplied nested-refresh/settings captures address the original gap. README changes document these corrections. No missing requirement or unrequested behavior found within this bounded diff. Parent verification remains required.

Fresh session: terminal `t6p`, run `c2eadf27-68fb-4a14-8ef7-6aad0276b40f`. Both axes ran in parallel. No earlier reviewer or fixer session was reused.

## Prior findings

| Finding | Resolution | Source and proof |
| --- | --- | --- |
| S-001 | Resolved | `main.js:103-120,166-176` reloads retained expanded paths after Refresh and restoration. The real-method fixture checks descendant contents and repository guards. Native restored-tree capture shows both files under `nested/deep`. |
| P-001 | Resolved | `tree.js:6-54` traverses `blockedBy`, chooses dependency roots and retains canonical shared references. `main.js:246-269` uses one tree in C/C2 and reveals reference paths. Behavioral tree checks cover nesting, collapsed canonical paths, queue context, missing records and deterministic cycle errors. Native C/C2 captures show hierarchy and navigation. |
| P-002 | Resolved | `action.js:18-40` binds preparation to generation, revision, open menu and repository/record identity. Callers invalidate changes. Stale success, error and final busy-state updates are discarded. Real-method checks prove repository/record/input/close orderings, newer busy retention and one unchanged launch. Native evidence records delayed real preparation and one real OMP session. |
| P-003 | Resolved | `main.js:187-197,227` guards preview success and failure with monotonically increasing `fileRevision`. Real-method checks prove stale A failure and both old A success/failure after A-B-A. Native delayed binary failure leaves fresh A visible. |

No new suspected blocking issue required reproduction. No source-text assertion or mock echo serves as behavior proof. The fixture loads unchanged production methods and controls only native/API boundaries.

## Actual validation

After both axis reports returned, this reviewer ran one scoped verification sequence from `mise/conf.d/devtools-herdrapp/app`:

```sh
mise exec -- bun test tests/tree.test.ts tests/panel-state.test.ts && mise exec -- node --experimental-vm-modules --test tests/panel-state.fixture.mjs
```

Result: exit 0. Bun: 9 passed, 0 failed, 24 assertions. Direct Node execution: 15 passed, 0 failed. Node emitted its expected experimental VM-module warning. The Bun wrapper also runs the same ordering fixture; these are not 30 distinct ordering cases.

The checks exercised real dependency traversal and real panel/action methods. They proved expanded descendant reload/restoration, stale repository directory rejection, preview A-B/A-B-A orderings, obsolete preparation success/error after selection/input/close changes, unchanged launch once and newer busy-state preservation. Native boundaries were synthetic; pane splitting was captured, not executed by this review.

Independent SHA-256 comparison matched all 15 current JavaScript modules to the source/native hash pairs in `native-source-hashes.json`.

No full build, lint, TypeScript or native checker was rerun. The fix receipt's broader test/type/native/API results remain consumed evidence, not this reviewer's executions.

## Native proof consumed

Evidence root: `workflows/herdr-context-panels/artifacts/evidence/fix-0011-native`.

Read `acceptance.json`, `final-validation.json`, `native-source-hashes.json`, `launch-record-pane-observation.json`, `preview-A-B-A-response.json`, `fresh-session-summary.json` and `delay-runtime.py`.

Inspected these retained screenshots:

- **Dependency tree:** `media/tree-c2.png` shows alpha/base and beta/base, with a shared-reference arrow.
- **C navigation:** `media/c-reference-navigated.png` shows canonical base selected in the C drawer.
- **Restored folders:** `media/nested-settings-restored-settled.png` shows expanded `nested/deep` with `after.txt` and `before.txt`.
- **Stale launch:** `media/stale-record-no-pane.png` shows beta current with no extra terminal. The pane observation records equal before/after inventories.
- **Repository switch:** `media/stale-repository-error-discarded.png` shows repository B without an obsolete error or extra pane. It has no visible tracker panel; the screenshot alone is not a complete ordering proof.
- **Preview ordering:** `media/preview-fresh-A-after-release.png` shows fresh A after the held old binary failure.
- **Fresh session:** `media/fresh-session-output.png` shows the real OMP session's read-only result.

The retained helper runs the unchanged canonical request with real Bun, captures its actual result and waits for an owned release file. This supports real response ordering rather than fabricated payloads. The delayed preview record contains the real binary-file error and distinct capture/release timestamps.

`final-validation.json` records successful post-rebase native mod checks and canonical context/directory/file/prepare outputs. The directory output includes nested files. Preparation contains the canonical Ask Matt prompt and repository. These checks belong to the fixer.

Native proof uses private headless cage/Xwayland and software rendering, not a physical display. The smoke qualifier lost spaces during native input. The real Ask Matt session made 13 read-only tool calls and returned advice, not the requested marker. Its ticket hashes remained unchanged. No claim, implementation, merge or push action ran. Initial display-unavailable checker failures are retained limitations; this review did not rerun those failures.

## Inputs and ownership

Consumed the canonical ticket, `review-start-0014.json`, `fix-0011.yaml`, `fix-complete-0013.json`, `review-0008.yaml`, prior immutable `review-review-0008.md`, current `pr-draft-fix-0011.md` and the native evidence above. Read source `CONTEXT-MAP.md`, `docs/agents/domain.md`, `docs/agents/issue-tracker.md` and `docs/adr/index.md`. `CONTEXT.md` is absent. No ADR applies; the index's only decision concerns Pi Ink.

Reviewer terminal `t6m`, pane `p6f7c9b20ae3f4c3b51c44aac4f561517`, run/session `327e5ce8-3af7-46fc-b871-100b8b375568`. Both axis results were transport-validated and acknowledged. Only owned terminals `t6n` and `t6p` were stopped and removed. Parent `t60` owns tracker updates, integration, commits, push and this reviewer's terminal cleanup.

The review changed no source, test, configuration, generated file or tracker record. It did not exercise the live user app. App reads and child-tab operations served only required session mechanics. No historical pre-publication review is asserted.

## Axis totals

Standards: 0 findings; no blocking issue. Spec: 0 findings; no blocking issue.

Timestamp: `2026-11-11T23:02:18.447368+00:00`.

