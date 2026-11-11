---
kind: pr-draft
schema: worktree-artifact/v1
title: Native credential safety fix
type: Report
---

# collect-evidence-feedback-02-tui

## Status

Fix attempt 5 resolves SPEC-02 at 3d05a5611dae33c992d8bbd81ed265a27d23892c, tree e758e20e8bc45d732d01028960802390d347d11b. Source is committed and clean. Parent accepted fix-0024; fresh independent review is required. The latest review verdict is historical FAILURE for a50eb7b56c79151c48abe4e5595b8da2b63eec98, not a verdict on this fix. STD-01 remains Low and nonblocking. No merge, rebase, push or ticket completion occurred.

## Ticket and problem

The [canonical ticket](../../../tracker/tickets/collect-evidence-feedback-02-tui.md) and [complete initiative](../../../tracker/initiatives/collect-evidence-feedback/index.md) require native pixels and unconditional credential stops. Initiative decision 38 prohibits filling credential prompts. Review-0020 proved that API-token prompts passed expect-only checks and received approved harmless input.

## Implementation

Added prompt-specific token, API-key, PIN and OTP detection to both existing snapshot and native OCR guards. Colon/question-mark fields and input requests match; ordinary non-prompt words do not. Existing password/login detection and confirmation safety remain unchanged. Approval cannot bypass credential stops. Added eighteen native prompt/action regressions and one non-prompt case through the public CLI. Updated the native playbook after smoke verification. ADR: NO ADR; ADR 0001 concerns Pi Ink cleanup and does not apply. CONTEXT.md is absent.

## Changed files

- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/tui-driver.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/tui.md
- mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json

The commit hook advanced developer metadata to 0.2.18 in both JSON files. Neither web driver changed.

## Verification

- **Native suite:** 28 pass, 0 fail, 362 assertions; 66.15 seconds. Six prompt variants across expect, approved fill and approved Enter return credential BLOCKED with no input and owned cleanup. Ordinary words pass.
- **Common suites:** 99 pass, 0 fail, 892 assertions; 56.54 seconds.
- **Public smoke:** doctor/init/render/compile/run/validate/verdicts/report from /tmp and temporary resolved repository stores. Delayed transition PASS; twelve API-token/API-key/PIN/OTP scenarios BLOCKED with exit 3 and no input. All read-only commands exit 0. Thirteen retained runs validate after copy.
- **Original images:** inspected Ready and Details PNGs, 1280x720. Distinct headings, purple bar, Selected item on the next 20px line, matching source SHA-256 and shared terminal/display identity. No reconstruction.
- **Cleanup:** smoke runtimes absent and owned processes exited. Borrowed sentinel pane PID 2958856 remained unchanged through public doctor with inherited TMUX. Only owned fixture resources were removed.
- **Limits:** English prompt patterns/OCR; prepared private Linux display; no native video. Snapshot credential stops may occur before image capture. Compiler/LSP remains unavailable; no compiler success or new web-driver runtime proof is claimed.

[Exact validation](../artifacts/snapshots/validation-fix-0023.json). [Retained public fixture](../artifacts/snapshots/native-smoke-fix-0023.ts). [Real smoke commands and outcomes](../artifacts/evidence/fix-0023-smoke/validation.json). [Transition run](../artifacts/evidence/fix-0023-smoke/repository/workflows/native/artifacts/evidence/transition/run.json). [Blocked approved token fill](../artifacts/evidence/fix-0023-smoke/repository/workflows/native/artifacts/evidence/credential-0-fill/run.json).

## Review and fix history

| Review | Recorded outcome | Following fix |
| --- | --- | --- |
| [review-0008](../artifacts/reviews/review-review-0008.md) | Historical FAILURE | [fix-0011](../events/fix-0011.yaml) |
| [review-0014](../artifacts/reviews/review-review-0014.md) | Historical FAILURE | [fix-0017](../events/fix-0017.yaml) and [parent acceptance](../events/fix-0018.yaml) resolved SPEC-01 |
| [review-0020](../artifacts/reviews/review-review-0020.md) | FAILURE; SPEC-02 High blocking, STD-01 Low nonblocking | This fix resolves SPEC-02; review pending |

[Prior immutable draft](../artifacts/snapshots/pr-draft-fix-0018-final.md) preserves implementation and earlier recovery history. [Review result](../events/review-0020.yaml), [review completion](../events/review-0021.yaml), [fix authorization](../events/fix-0022.yaml), [fix result](../events/fix-0023.yaml) and [implementation log](implementation-log.md) retain the receipt chain.

## Findings and merge status

Resolved in this attempt: SPEC-02 (High, NO ADR). Prior SPEC-01 remains resolved. Unresolved: STD-01 (Low, nonblocking, NO ADR), the test-only grim shell shim; explicitly outside selected scope. No new blocking finding is known from this fix's exercised checks. Independent review has not yet assessed this source. Not merged or published. Parent owns phase completion, acknowledgement and publication of workflow artifacts.



## Parent acceptance — fix-0024

[Completion receipt](../events/fix-0024.yaml) accepts [fix-0023](../events/fix-0023.yaml) for clean source `3d05a5611dae33c992d8bbd81ed265a27d23892c`, tree `e758e20e8bc45d732d01028960802390d347d11b`. Parent verified the delivered payload against its immutable event, current clean source, child completion sequence 3 and acknowledged hash. All thirteen retained runs validate through the public CLI: positive transition PASS, twelve credential cases BLOCKED with no received input. Parent inspected the original native Details image. Only completed child t61 was targeted for removal. No merge, push or ticket completion. Next: fresh independent review. STD-01 remains Low and nonblocking.
