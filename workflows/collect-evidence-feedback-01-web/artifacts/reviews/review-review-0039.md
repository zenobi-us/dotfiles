---
schema: worktree-review/v1
title: Independent web review review-0039
type: Review
---

# Independent web review review-0039

Review the full web cutover for the parent workflow owner and implementer.
Timestamp: 2026-11-10T11:36:55.796598Z. Frozen-source review; not a browser acceptance certificate.

## Overview

FAILURE. Both axes found current P2 source defects. Standards has one blocker and two P3 advisories. Spec has two blockers. One fixture defect appears in both axes; the findings remain separate. SPEC-R5-001 is fixed for required Step fields. Invalid optional Step fields still pass the public boundary. The new validator also rejects an unchanged real-workflow fixture before its intended media check.

[Scope](#scope) · [Standards](#standards) · [Spec](#spec) · [Findings](#findings) · [Validation](#validation) · [Verdict](#verdict)

## Scope

- **Canonical ticket:** tracker/tickets/collect-evidence-feedback-01-web.md, backend local-markdown, status implemented. Complete specification: tracker/initiatives/collect-evidence-feedback/index.md. Both came from BASE, not source-worktree copies.
- **Canonical repository:** /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles. Shared-context independently resolved repository workflow storage, root BASE, ref workflows/collect-evidence-feedback-01-web.
- **Source workspace:** /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web. Branch feature/collect-evidence-feedback-01-web; base master.
- **Frozen identity:** commit 3dbab24ce09d4cf1c3eaedf467af63e007b9e976; tree 213b91da7d7589912d53f67c19cc5e5c76adc54f.
- **Fixed point:** master resolved to c5800af59dd710006722a688f9b8a6c3a3006261. Merge base: 859341b01ef7be474a3128b7f94772aab731c2f7. Comparison: `git diff c5800af59dd710006722a688f9b8a6c3a3006261...3dbab24ce09d4cf1c3eaedf467af63e007b9e976`.
- **Commit scope:** 0acff3b4 implementation; 3d1b2825 guards; 12b6345a ID encoding; b711ef1b empty slug; 8c401541 Surf map paths; 3dbab24c required Step fields. All 60 changed files and active callers were in scope. Future TUI, GUI and feedback UI implementation was excluded.
- **Context sources:** CONTEXT-MAP.md, docs/agents/domain.md, docs/agents/issue-tracker.md and docs/adr/index.md. CONTEXT.md is absent. ADR 0001 concerns Pi Ink cleanup; it does not govern this web contract.

The inspector reported the already-started review-0038 attempt as retry. This is its assigned fresh reviewer, not a second outer review. review-start-0038 records user approval and prior-session closure. Consumed fix-0036 and fix-complete-0037 establish the frozen source, not a verdict.

Standards and Spec ran concurrently through the installed muxer router in fresh terminals t21 and t22. Both stayed read-only. They ran no builds, lint, tests, formatters or browsers. Both returned typed code-review-axis/v1 artifacts and native done. Their envelopes, source identities, schemas, findings and hashes were validated before acknowledgement. Only these two child terminals were closed and removed. The parent terminal and workspace remain open.

## Standards

One blocking public-workflow regression and two non-blocking judgement calls. The full diff preserves mise/Bun/Crust entrypoints and mq Markdown access. No relevant ADR applies. SPEC-R5-001 is addressed in source: checkPlan now requires capture.locator/as and other required Step fields. That change invalidates a remaining real-workflow fixture. Retained browser failures remain acceptance gaps, not proof of a transport defect or additional standards violations.

### STD-R6-001

- **Severity:** P2, blocking.
- **ADR or rule:** NO ADR; tracker/initiatives/collect-evidence-feedback/index.md, Testing Decisions 3 and 14; references/web.md, Plan approval.
- **File and line:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts:148`.
- **Description:** Hard documented public-workflow coverage violation. The missing-media fixture omits says from navigate and expect, but line 152 requires compile exit 0. checkPlan now rejects both actions before compilation. Once earlier driver failures are resolved, this branch cannot reach its real screenshot-deletion check or subsequent interruption checks. This is a source finding, not a rerun result.
- **Required change:** Add genuine reader instructions to both fixture steps. Keep the missing-media scenario valid until its intended filesystem failure.
- **Axis validation command:** `COLLECT_EVIDENCE_REAL_DRIVERS=1 mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts`. Proposed, not executed by the axis. A browser-suite rerun remains outside this review's authorization. Use the bounded public compile checks under Validation first.
- **Completion impact:** Blocks completion because the required public workflow cannot reach its intended safety and media checks.

### STD-R6-002

- **Severity:** P3, advisory.
- **ADR or rule:** NO ADR; baseline Duplicated Code, judgement call.
- **File and line:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts:48`.
- **Description:** Possible Duplicated Code. This markdown helper and records.ts:479 both construct schema/kind frontmatter and invoke mise/mq. Their output format, lock policy, overwrite policy and error handling already differ.
- **Required change:** Optional: use one leaf Markdown writer with explicit caller policies. Avoid a pipeline/records dependency cycle.
- **Axis validation command:** `mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts`. Proposed, not executed by the axis. A browser-suite rerun remains outside this review's authorization. Use the bounded public compile checks under Validation first.
- **Completion impact:** Non-blocking judgement call. No mandatory documented rule makes this a release blocker.

### STD-R6-003

- **Severity:** P3, advisory.
- **ADR or rule:** NO ADR; baseline Duplicated Code and Shotgun Surgery, judgement call.
- **File and line:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/playwright-driver.ts:47`.
- **Description:** Possible Duplicated Code. The complete click/Enter/Space/Spacebar/literal-space approval predicate repeats at surf-driver.ts:127. One safety-policy change needs edits in both drivers despite their shared safetyCode owner.
- **Required change:** Optional: define confirmation classification once beside safetyCode and call it from both compilers.
- **Axis validation command:** `COLLECT_EVIDENCE_REAL_DRIVERS=1 mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts`. Proposed, not executed by the axis. A browser-suite rerun remains outside this review's authorization. Use the bounded public compile checks under Validation first.
- **Completion impact:** Non-blocking judgement call. No mandatory documented rule makes this a release blocker.

## Spec

Two source findings remain. The required-field defect SPEC-R5-001 is fixed, but optional Step fields still bypass validation. The required-field change also leaves a malformed Surf workflow fixture. Acceptance remains blocked separately: the ticket requires both real driver workflows before removing the old skill. Retained Surf and Playwright failures do not establish a transport root cause. Compile success does not satisfy that gate. No unrelated scope expansion was identified.

### SPEC-R6-001

- **Severity:** P2, blocking.
- **ADR or rule:** NO ADR; ADR 0001 concerns Pi Ink cleanup.
- **File and line:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts:354`.
- **Description:** Ticket: ‘Reject invalid records, missing media and unsupported explicit schemas without a valid-looking partial run.’ checkPlan leaves capture.attr, click.dom, wait.gone and timeoutMs unchecked. For example, gone: "false" passes validation but both drivers treat it as true and wait for disappearance. compile/render can emit successful generated output for this invalid typed Step. This follows from source inspection, not a runtime reproduction.
- **Required change:** Validate present optional Step fields against their declared types. Reject invalid timeouts before generation or execution. Preserve omitted fields, timeoutMs: 0, empty fill text, empty shot and visible: false.
- **Axis validation command:** `Run public compile/render/run with malformed optional fields for both drivers; require exit 2, versioned errors, no generated writes and no driver execution.`. Proposed, not executed by the axis. A browser-suite rerun remains outside this review's authorization. Use the bounded public compile checks under Validation first.
- **Completion impact:** Blocks completion because invalid typed input produces successful generated output and can change the action semantics.

### SPEC-R6-002

- **Severity:** P2, blocking.
- **ADR or rule:** NO ADR.
- **File and line:** `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts:148`.
- **Description:** Ticket: ‘Update the relevant docs and public workflow checks.’ The Surf missing-media fixture omits says on navigate and expect, yet line 152 requires compile exit 0. The new required-field validator rejects this fixture. Once earlier cases pass, this assertion prevents the missing-media, interruption and tamper checks from running.
- **Required change:** Add valid reader-facing says fields to both fixture steps. Keep missing-media assertions and subsequent checks reachable.
- **Axis validation command:** `COLLECT_EVIDENCE_REAL_DRIVERS=1 mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts`. Proposed, not executed by the axis. A browser-suite rerun remains outside this review's authorization. Use the bounded public compile checks under Validation first.
- **Completion impact:** Blocks completion because the required public workflow cannot reach its intended safety and media checks.

## Findings

Standards: STD-R6-001 is P2 blocking; STD-R6-002 and STD-R6-003 are P3 advisories. Spec: SPEC-R6-001 and SPEC-R6-002 are P2 blocking. STD-R6-001 and SPEC-R6-002 identify the same fixture from different axes. They are not two independent runtime failures.

The parent confirmed the fixture defect at browser-workflow.test.ts:148–152 against checkPlan at records.ts:357. The exact fixture steps omit says. Public compile rejects them with exit 2, while the test requires 0. This is a new reachable-source regression, separate from the old Surf timeout.

The parent also reproduced SPEC-R6-001 for `{ do: "wait", locator: "h1", gone: "false" }`. Both drivers accepted compile and render with exit 0 and success:true. Compilation wrote compiled.json and workflows. Rendering added plan.json and test-plan.md. The generated Playwright workflow selected state detached. The typed contract requires gone to be boolean at plan.ts:84. Both driver compilers branch on its truthiness. No browser executed this malformed plan.

The other optional fields named by SPEC-R6-001 were inspected statically, not exercised. Validate present optional fields without making them required. Preserve valid omissions, boolean false, timeoutMs: 0, empty fill text and empty shot. A boundary regression must check invalid types through the public CLI, not generated-source text alone.

Required-field handling for SPEC-R5-001 is complete in the inspected switch. Navigation, click, fill, capture, wait, scroll, press, human and expect retain their typed required fields. loadPlan calls checkPlan before compile/render writes and before run reaches the driver. Wait and scroll may omit says; capture may omit attr; URL-only expect may omit locator. Public positive checks exercised those boundaries for both drivers.

Historical STD-AXIS-001 and STD-R3-001 were unselected and unchanged. STD-R6-002 independently identifies the earlier Markdown duplication concern. No source cleanup was authorized or performed.

## Validation

All new public commands ran from /tmp, after both axes completed. Environment disabled automatic tool setup with MISE_AUTO_INSTALL=false and BUN_INSTALL_AUTO=disable. NO_COLOR=1 and TERM=dumb were set. Each workspace came from public init with repository BASE, workflow collect-evidence-feedback-01-web, a new review0039-prefixed run ID and the stated driver. Init resolved destinations but did not create evidence runs.

Entrypoint: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts`.

Owned external root: `/tmp/review0039-boundary-d95a3gl7`. Each scenario below used its own child directory. Actual command form: `<entrypoint> <operation> <scenario-directory> --json --no-input`.

| Scenario directory | Driver | Operations | Observed result |
|---|---|---|---|
| missing-media-fixture | surf | compile, render, run | Each returned exit 2, kind error, success false, code 2, message Step says must be a string. Only plan.ts and workspace.json remained. |
| optional-gone-surf | surf | compile, render | Each returned exit 0 and success true for gone as the string false. Generated outputs appeared. Defect reproduced. |
| optional-gone-playwright | playwright | compile, render | Each returned exit 0 and success true for the same invalid field. Generated outputs appeared. Defect reproduced. |
| valid-surf | surf | compile, render | Each returned exit 0. Optional omissions, gone false, visible false, timeoutMs 0, empty fill text and empty shot were accepted. |
| valid-playwright | playwright | compile, render | Each returned exit 0 for the same valid boundaries. |

Reproduction of the fixture blocker needs only the exact two steps at browser-workflow.test.ts:148–149 and public compile. It must become a valid plan and compile with exit 0 before any separately authorized missing-media workflow runs. The new optional-field check must instead reject the malformed wait before generated files or driver execution. Repeat public compile and render for both drivers with fresh workspaces. After the fix, public run must reject the invalid plan before reaching doctor.

No browser was opened. No media was captured or finalized. No new evidence run is claimed or attached to this receipt. Temporary command observations are transport diagnostics, not canonical evidence. The receipt retains exact command arguments and outputs. This report does not infer browser behavior from compilation.

### Retained checks and limits

- **Fix evidence:** fix-0036 records the failing-before required-field regression, passing 35-test/283-expectation non-browser suite, passing scoped strict TypeScript and invalid-capture smokes. Parent fix-complete-0037 records independent Surf compile and Playwright render rejection. These are retained observations, not checks rerun here.
- **Known failures:** fix-0026 retains 15 pass and 2 fail. Surf blocked.1 reset timed out before the workflow and credential fill. Earlier Playwright pass-case and approved-space assertion failures remain unresolved. No failed workflow or full browser suite was rerun.
- **Native trace:** transport-recovery-0031/native-request-trace.json records queueMs 0 and hard timeout after 60041 ms. It does not establish the extension, browser or navigation-completion cause. review-review-0029.md and review-complete-0031 preserve the diagnostic limits.
- **Acceptance boundary:** Both real driver workflows remain unproven as complete passing acceptance. Earlier successes, compile output and sealed-record integrity do not close this gap. This FAILURE rests on current source findings, not speculative timeout attribution.
- **Source preservation:** No source, test, configuration or generated source file changed. No build, lint, formatter, test suite, installation, browser restart, credential entry, remote Git operation, commit, merge or push ran. The receipt writer rechecks the exact source commit and tree.
- **Document validation:** The immutable review has OKF type Review and worktree-review/v1 frontmatter. Only this selected document is validated; no full bundle audit or owned-guide schema migration applies.

## Verdict

FAILURE for frozen commit 3dbab24ce09d4cf1c3eaedf467af63e007b9e976 and tree 213b91da7d7589912d53f67c19cc5e5c76adc54f. Standards has one P2 blocker and two P3 advisories. Spec has two P2 blockers. The axes remain separate.

Correct malformed optional-field validation and the stale missing-media fixture before a fresh review. Preserve all retained failures. Any new browser experiment requires a distinct source- or trace-supported question and the existing safety limits. Do not rerun the failed suite merely to obtain green.

Parent owns tracker comments, projections, publication, acknowledgement, reviewer closure and phase completion. No ticket completion, merge or push is authorized.

