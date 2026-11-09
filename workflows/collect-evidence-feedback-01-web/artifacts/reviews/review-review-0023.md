---
type: Review
title: Web cutover review review-0023
schema: worktree-review/v1
---
# Web cutover review review-0023

Review the complete web cutover for the ticket owner and implementer.

Timestamp: 2026-11-09T12:46:54.203Z

## Overview

FAILURE. Standards has one non-blocking advisory. Spec has two reproduced blocking findings. Fix both Spec findings before completion. The passing scoped suite does not cover them.

A separate fresh Playwright confirmation check failed. Its cause is unknown. This review preserves that result and does not treat it as a passing check.

[Scope](#scope) · [Standards](#standards) · [Spec](#spec) · [Validation](#validation) · [Diagnostics and limits](#diagnostics-and-limits) · [Delivery](#delivery)

## Scope

- **Ticket:** `tracker/tickets/collect-evidence-feedback-01-web.md`, backend `local-markdown`.
- **Canonical store:** `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`. The complete ticket and initiative `tracker/initiatives/collect-evidence-feedback/index.md` came from this base store. Source-worktree tracker and workflow copies are stale.
- **Branches:** `feature/collect-evidence-feedback-01-web` against `master`.
- **Frozen commit:** `12b6345ac32f4ae30b078e5344fb5bae7a1ee244`.
- **Frozen tree:** `77e90021870efcf8c8d8cb1f8dc36ac0cc0107f6`.
- **Fixed point:** `b7f84419e6242037c3b2e4e2e828ad84b9041aa6`. Merge base: `859341b01ef7be474a3128b7f94772aab731c2f7`.
- **Diff command:** `git diff b7f84419e6242037c3b2e4e2e828ad84b9041aa6...12b6345ac32f4ae30b078e5344fb5bae7a1ee244`.
- **Commits:** `12b6345a fix: encode ids tracker/tickets/collect-evidence-feedback-01-web.md`; `3d1b2825 fix: guard tracker/tickets/collect-evidence-feedback-01-web.md`; `0acff3b4 feat: implement tracker/tickets/collect-evidence-feedback-01-web.md`.
- **Boundary:** All 60 changed files, active callers, old entrypoint removal, all ticket criteria and applicable initiative common contracts. Future TUI, GUI and feedback UI are excluded.

StandardsAxis and SpecAxis ran concurrently as independent general-purpose agents. Both stayed read-only and ran no builds, tests, lint or formatters. Their reports remain separate and retain their order. Runtime validation started only after both returned.

Required standards included canonical agent instructions, context map, domain rules, skill anatomy, checklist and testing methodology. Both axes considered the supplied twelve-smell baseline. CONTEXT.md is absent. The indexed architecture decision record (ADR) 0001 concerns Pi Ink cleanup, not this web cutover. Existing evidence was input, not correctness proof.

## Standards

No blocking documented-standard breach was found. One advisory judgment call remains.

STD-001 is resolved by static inspection. [load-plan.ts:15](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/load-plan.ts#L15), records.ts:74 and records.ts:197 call the same [checkPlan](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts#L334-L359). It checks case and precondition IDs, duplicates, unknown preconditions and executable assertions before execution. The fresh suite exercised invalid IDs and unknown preconditions.

### STD-R3-001

- **Severity:** P3, advisory judgment call: possible Speculative Generality.
- **ADR reference:** NO ADR — ADR 0001 governs Pi Ink device cleanup, not browser reporting.
- **File and line:** [playwright-driver.ts:330–334](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts#L330-L334). Related: driver.ts:28–29,44–45 and surf-driver.ts:488–492.
- **Description:** CleanupRow and cleanupRow remain after their report consumer was removed. Static reference inspection found only the contract and both implementations.
- **Rule source:** The code-review smell baseline recommends removal of unused abstractions. It explicitly treats smells as judgment calls.
- **Required change:** Optionally remove the unused type, interface method and both implementations.
- **Validation command:** `mise x -- bun test /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test`, from `/tmp`.
- **Completion impact:** Not blocking. No documented mandatory rule makes this retained contract a release blocker.

The full diff removes the old skill, CLI and compatibility entrypoints. Active source and documentation searches found no remaining legacy caller. Historical inventory entries are not active callers. TypeScript language-server references were unavailable because initialization could not find a usable TypeScript installation. Static searches supplied reference evidence; no language-server pass is claimed.

## Spec

Two blocking findings. No additional active legacy caller or out-of-scope feature was found.

### SPEC-R4-001

Requirement: “Preserve the existing Surf and Playwright drivers, typed browser plans”.

- **Severity:** P2, blocking.
- **ADR reference:** NO ADR — ADR 0001 concerns Pi Ink, not evidence collection.
- **File and line:** [surf-driver.ts:376](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/surf-driver.ts#L371-L376); consumed at lines 437–438.
- **Description:** Accepted case IDs a and a.map collide on disk. The first case map and second case workflow both use <workId>-test-a.map.json. compileInto overwrites the map. Public compile returns 0; public run then returns 1 with Unsupported Surf driver map schema. Substitution-key encoding does not address this separate collision.
- **Required change:** Give Surf workflows and maps collision-free private paths. Preserve public IDs. Add both IDs to a real public workflow regression.
- **Validation command:** `MISE_AUTO_INSTALL=false mise x -- bun /tmp/review-0023-defects.ts`, from `/tmp`.
- **Completion impact:** Blocks completion because an accepted typed plan cannot complete required Surf collection.

### SPEC-R4-002

Requirement: “Preserve the existing Surf and Playwright drivers, typed browser plans”.

- **Severity:** P2, blocking.
- **ADR reference:** NO ADR — ADR 0001 does not govern browser-plan semantics.
- **File and line:** [records.ts:356](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts#L354-L357).
- **Description:** Validation rejects shot: `""`. The preserved public contract states: “An empty slug means the step takes no shot” at [plan.ts:16](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/plan.ts#L16-L17). Both drivers retain that meaning through truthiness checks. Public compile returns 2 with Invalid screenshot slug.
- **Required change:** Accept the documented empty slug. Add a public compile regression without renaming or removing the fixture value.
- **Validation command:** `MISE_AUTO_INSTALL=false mise x -- bun /tmp/review-0023-defects.ts`, from `/tmp`.
- **Completion impact:** Blocks completion because the cutover rejects a previously supported typed-plan value.

Prior SPEC-001 is corrected for named Enter, Space, Spacebar and literal-space activation. Prior SPEC-002 distinguishes parent traversal from ..captures. Prior SPEC-003 retains expected successful Surf screenshots and rejects missing media after preserving native logs. The single fresh suite exercised these paths.

SPEC-R3-001 is corrected for Surf substitution keys. Static inspection shows UTF-8 hex encoding. The fresh Surf public proof kept approved-space unchanged, passed approved-space, a-b, a.b and a_b, and checked distinct runtime variable keys. The suite also passed these IDs for both drivers. A separate fresh Playwright confirmation assertion failed as detailed below; it was not hidden.

## Validation

All runtime commands ran from `/tmp`. Environment: `MISE_AUTO_INSTALL=false`, `GIT_TERMINAL_PROMPT=0`, `GIT_ASKPASS=/bin/false`, `SSH_ASKPASS=/bin/false`, `COLLECT_EVIDENCE_REAL_DRIVERS=1`, `PLAYWRIGHT_MCP_EXECUTABLE_PATH=/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`.

### scoped-public-suite

Command: `mise x -- bun test /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test`

Working directory: `/tmp`. Started: 2026-11-09T12:42:36.127Z. Finished: 2026-11-09T12:43:38.434Z. Exit: 0.

### independent-public-identities

Command: `mise x -- bun /tmp/review-0023-public-proof.ts`

Working directory: `/tmp`. Started: 2026-11-09T12:43:43.376Z. Finished: 2026-11-09T12:44:12.740Z. Exit: 1.

### retained-surf-validate

Command: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts validate /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/collect-evidence-feedback-01-web/artifacts/evidence/fix-0020/surf --json`

Working directory: `/tmp`. Started: 2026-11-09T12:44:12.741Z. Finished: 2026-11-09T12:44:12.911Z. Exit: 0.

### retained-playwright-validate

Command: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts validate /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles/workflows/collect-evidence-feedback-01-web/artifacts/evidence/fix-0020/playwright --json`

Working directory: `/tmp`. Started: 2026-11-09T12:44:12.911Z. Finished: 2026-11-09T12:44:13.059Z. Exit: 0.

### focused-defects

Command: `mise x -- bun /tmp/review-0023-defects.ts`

Working directory: `/tmp`. Started: 2026-11-09T12:44:57.982Z. Finished: 2026-11-09T12:45:00.000Z. Exit: 0.

### playwright-owned-cleanup-observation

Command: `playwright-cli list`

Working directory: `/tmp`. Started: 2026-11-09T12:45:16.339Z. Finished: 2026-11-09T12:45:16.600Z. Exit: 0.

### Observed outcomes

- **Scoped public suite:** 14 passed, 0 failed, 116 expectations, 62.23 seconds. Both real drivers ran. This was the only scoped suite run in this review. Coverage included safety, missing media, assertions, sealing, read-only consumers, invalid plans, watched-tree exclusion and interruption.
- **Independent identity proof:** Process exit 1. Surf completed all four cases with PASS, unchanged public IDs, distinct native keys and matching before/after session lists. Playwright kept all public IDs and passed a-b, a.b and a_b, but approved-space.3 failed: expected Submitted once, got Ready. Its public run exited 1 and retained the failed assertion in a sealed run. The helper stopped at that nonzero result, so its later total-submission and Playwright before/after checks did not run.
- **Retained run validators:** Both returned 0 for existing fix-0020 Surf and Playwright evidence. This validates retained records; it does not establish a new evidence run.
- **Focused defects:** Helper exit 0 means both expected defects were reproduced. Collision compile exited 0; run exited 1 with Unsupported Surf driver map schema. The empty-slug compile exited 2 with Invalid screenshot slug. Surf session lists matched before and after the failed collision run.
- **Cleanup observation:** playwright-cli list returned “(no browsers)”. Only owned controlled-page servers and collector resources were used. No borrowed tab or session was closed.

Fresh visual inspection showed Submitted once in the Surf approved-space PNG at 1984×1068. The Playwright failed approved-space PNG at 1280×720 visibly showed Ready. The dotted-ID Playwright PNG visibly showed Identity a.b. Assertion results and screenshots agree on those inspected states.

## Diagnostics and limits

The earlier recorded suite failure remains unexplained. Its retained suite.txt records 13 passes and one Playwright failure at browser-workflow.test.ts:108: case pass expected PASS but returned FAIL. The available diagnostic copy at /tmp/ce-playwright-public-BXHDof contains later passing native observations for pass.2 and pass.4. Its console log records a password-field DOM warning on the credential page. Those later diagnostics do not establish the earlier failure cause. The failed suite's native case diagnostics are not retained in that evidence index. No causal claim or rerun-to-green is made.

The fresh independent proof also failed. Exact assertion: `ASSERT FAIL approved-space.3: expected "Submitted once", got "Ready"`. Its cause is unknown. This is not identified as the same cause as the earlier failure. No fixture or source was changed, and neither check was repeated.

Actual fresh diagnostics remain outside the watched source tree:

- **Command outputs:** `/tmp/ce-review-0023-checks-ejrCf2`, including scoped-public-suite.json, independent-public-identities.json, focused-defects.json and fresh-observations.json.
- **Native failed run:** `/tmp/ce-review-0023-proof-2TiFur/repository/workflows/review-0023/artifacts/evidence/playwright/native/runs/case-approved-space.log`. The sibling case manifest and PNG retain the failure.
- **Owned proof runs:** `/tmp/ce-review-0023-proof-2TiFur/repository/workflows/review-0023/artifacts/evidence/`. These are temporary public-proof outputs, not a new durable workflow evidence run.
- **Defect diagnostics:** `/tmp/ce-review-0023-defects-L8DflX/reproduction.json`. Incomplete collision staging: `/tmp/ce-review-0023-defects-L8DflX/collect-evidence-v4kWm4`.
- **Reproduction commands:** `mise x -- bun /tmp/review-0023-public-proof.ts` and `mise x -- bun /tmp/review-0023-defects.ts`. Both helpers remain external; neither is repository source or a permanent test.

No build, lint, formatter, installation, credential entry, remote Git operation, source edit, commit, push, merge or fixture change occurred. Existing services and ticket02 were untouched. This review does not claim new video verification.

## Delivery

Durable inputs include implementation-0005, fix-0020, fix-complete-0021, review-start-0022, both prior reviews, pr-draft-fix-0020 and the existing fix-0020 evidence index. The parent owns publication, ticket comments, projections, acknowledgement, pane closure and phase completion.

Before artifact creation, HEAD and tree matched the frozen target. git status --porcelain=v1 produced no output. The result writer will check the frozen identities again. This is the only complete review body. Its child phase-result is `workflows/collect-evidence-feedback-01-web/events/review-0023.yaml`.

Standards: one P3 advisory, no blocker. Spec: two P2 blockers. Verdict: FAILURE.
