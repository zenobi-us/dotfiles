---
type: Review
title: Web cutover review review-0017
schema: worktree-review/v1
---
# Web cutover review review-0017

## Verdict

FAILURE. One blocking Spec finding remains. Standards has one non-blocking advisory.

Timestamp: 2026-11-09T11:08:36.505231+00:00

## Scope

- **Ticket:** `tracker/tickets/collect-evidence-feedback-01-web.md`, backend `local-markdown`, in canonical base store `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`.
- **Initiative:** `tracker/initiatives/collect-evidence-feedback/index.md`, read in full from the canonical base store.
- **Branches:** `feature/collect-evidence-feedback-01-web` against `master`.
- **Frozen commit:** `3d1b282520a74db5409457f83ed0f766670b86cb`.
- **Frozen tree:** `0c68cbc0d31e344ea2071352e81ca33c13c31b9f`.
- **Fixed point:** `4a66d0606604299d82d1bd5149c70828b9eef726`.
- **Diff command:** `git diff 4a66d0606604299d82d1bd5149c70828b9eef726...3d1b282520a74db5409457f83ed0f766670b86cb`.
- **Commits:** `3d1b2825 fix: guard tracker/tickets/collect-evidence-feedback-01-web.md`; `0acff3b4 feat: implement tracker/tickets/collect-evidence-feedback-01-web.md`.
- **Boundary:** Complete 60-file web cutover, active callers, old entrypoint removal, all ticket criteria and applicable common initiative contracts. Future TUI, GUI and feedback UI are excluded.

Fresh general-purpose agents StandardsAxis and SpecAxis ran concurrently and independently. Neither changed files nor ran builds, lint, tests or formatters. Their reports remain separate. The parent ran validation after both returned. Existing implementation evidence was input, not proof of correctness.

Required standards included agent instructions, context map, domain rules, writing-skill anatomy, checklist and testing methodology. All twelve supplied smell heuristics were assessed. `CONTEXT.md` is absent. ADR 0001 concerns Pi Ink cleanup and does not govern this cutover.

## Standards

No blocking standards finding. One advisory remains.

Prior STD-001 is resolved by inspection. `load-plan.ts:15`, `records.ts:74` and `records.ts:197` use `checkPlan` at `records.ts:334–359`. Invalid IDs and unknown preconditions now reach the same structural checks before execution. Authoring checks remain separate.

### STD-R3-001

- **Severity:** P3, advisory, not blocking.
- **ADR reference:** NO ADR — ADR 0001 governs Pi Ink cleanup, not browser-driver interfaces.
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts`.
- **Changed line:** 330–334. Related: `drivers/surf-driver.ts:487–491`, `drivers/driver.ts:29,45`.
- **Description:** Possible Speculative Generality. The removed report consumer leaves cleanupRow, CleanupRow and both HTML-specific driver implementations unused. This confirms prior STD-002 as advisory, not a hard documented-rule violation.
- **Required change:** Optionally remove cleanupRow, CleanupRow and both implementations.
- **Validation command:** `mise x -- bun test /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test`, run by the parent from `/tmp` with the environment below.
- **Completion impact:** Not blocking. The smell baseline does not establish a mandatory cleanup rule.

No additional material standards finding arose. Driver dispatch follows the retained Plan/Driver boundaries. The axis reported that TypeScript LSP initialization could not find TypeScript; scoped source searches supplied reference evidence. The parent did not claim an LSP pass.

## Spec

One blocking finding. No additional confirmed scope expansion or obsolete active caller was found.

### SPEC-R3-001

Requirement, ticket line 23: “Preserve the existing Surf and Playwright drivers, typed browser plans…”

Requirement, initiative line 119: “Keep run, case, step, asset and annotation IDs stable when titles change.”

- **Severity:** P2, blocking.
- **ADR reference:** NO ADR — ADR 0001 governs Pi Ink cleanup, not browser-plan identities.
- **File:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/surf-driver.ts`.
- **Changed line:** 63; used at lines 123–126.
- **Description:** Accepted hyphenated case IDs remain in Surf-internal variable keys. The native guard at lines 123–126 emits substitutions such as %{dialog_case-one_1}. The reported Surf variable substitution failure remains applicable to valid plans. Renaming the fixture does not preserve supported typed-plan behavior.
- **Contract evidence:** `records.ts:365` accepts hyphens; `references/web.md:18` documents them. `varKey` replaces dots but leaves hyphens unchanged.
- **Required change:** Use a collision-free substitution-safe encoding for Surf-internal keys. Preserve public case/step IDs and add a real public hyphenated-ID workflow regression. Do not narrow accepted IDs.
- **Validation command:** From /tmp, use the installed collect-evidence.ts compile and run commands with a temporary resolved store, owned controlled page and unchanged case ID approved-space; verify PASS, native screenshot, stable IDs and owned-session cleanup.
- **Completion impact:** Accepted plans cannot reliably execute through the required Surf driver. This blocks complete preservation of supported typed plans.

Prior SPEC-001 is corrected: both drivers guard Enter, Space, Spacebar and literal space before dispatch. Prior SPEC-002 is corrected: `pipeline.ts:45` distinguishes parent traversal from `..captures`. Prior SPEC-003 is corrected: Surf retains successful screenshot references, and `pipeline.ts:181–183` rejects missing files after saving native logs. The fresh public suite exercised these paths.

## Validation

All runtime commands ran from `/tmp`. Environment: `MISE_AUTO_INSTALL=false`, `GIT_TERMINAL_PROMPT=0`, `COLLECT_EVIDENCE_REAL_DRIVERS=1`, `PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`.

### scoped-public-workflow

Command: `mise x -- bun test /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test`

Started: 2026-11-09T11:06:41.486080+00:00. Finished: 2026-11-09T11:07:30.990446+00:00. Exit: 0.

14 passed, 0 failed, 93 expectations. Both real Surf and Playwright workflows ran. Coverage included confirmation guards, assertions, capture/result separation, missing-media rejection, sealing, read-only consumers, invalid plans, watched-tree exclusion and interruption. This was the only scoped suite run.

### retained-surf-validation

Command: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts validate /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/collect-evidence-feedback-01-web/artifacts/evidence/fix-0014/surf --json`

Started: 2026-11-09T11:07:38.386250+00:00. Finished: 2026-11-09T11:07:38.542338+00:00. Exit: 0.

The installed validator accepted the existing sealed run. No new evidence run is claimed.

### retained-playwright-validation

Command: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts validate /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/collect-evidence-feedback-01-web/artifacts/evidence/fix-0014/playwright --json`

Started: 2026-11-09T11:07:38.552894+00:00. Finished: 2026-11-09T11:07:38.683522+00:00. Exit: 0.

The installed validator accepted the existing sealed run. No new evidence run is claimed.

### accepted-hyphenated-plan-compile

Command: `mise x -- bun /tmp/ce-review-0017-hyphen.ts`

Started: 2026-11-09T11:07:38.683710+00:00. Finished: 2026-11-09T11:07:39.140274+00:00. Exit: 0.

Public init and compile both returned 0 for case ID `case-one`. Compilation emitted `dialog_case-one_1`, `dialog_case-one_2` and guards containing `%{dialog_case-one_1}` and `%{dialog_case-one_2}`. This establishes that the accepted-plan contract still reaches the affected substitution boundary. The proof did not run Surf or repeat the reported failure. The existing Surf failure remains ground truth. The script removed its owned temporary repository and workspace.

### Visual and ownership limits

The reviewer inspected both retained submitted-state PNGs. Both visibly show “Submitted once”. Surf is 1984×1068; Playwright is 1280×720. These historical images do not prove the frozen code correct. The fresh suite checked public workflows but removed its temporary captures; no fresh visual inspection of those removed PNGs is claimed.

The review did not rerun the reported hyphenated-ID Surf failure or change fixtures to hide it. The focused external proof checked only accepted public compilation. No credentials, remote Git operations or tool installation occurred. No borrowed tab or session was closed by the reviewer. No source, tests, configuration, ticket comments or projections changed. Existing services and ticket02 were untouched.

Before artifact creation and result delivery, `git rev-parse HEAD HEAD^{tree}` matched the frozen commit/tree. `git status --porcelain=v1` produced no output. The fixed point also resolved to the supplied commit.

## Inputs and delivery

Canonical durable inputs: implementation-0005, fix-0014, fix-complete-0015, review-start-0016, prior review-review-0011, pr-draft-fix-0014 and existing evidence `artifacts/evidence/fix-0014` under this workflow. The source checkout's stale tracker/workflow copies were not authoritative.

This is the only complete review body. The typed child result is `workflows/collect-evidence-feedback-01-web/events/review-0017.yaml`. The parent owns publication, ticket comments, current views, acknowledgement, pane closure and phase completion.

Standards: 1 advisory; no blocking finding. Spec: 1 blocking finding, P2 SPEC-R3-001. Verdict: FAILURE.
