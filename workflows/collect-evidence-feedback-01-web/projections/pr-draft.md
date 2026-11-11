---
schema: worktree-draft/v1
title: Web fix fix-0048
type: PRDraft
---

# Preserve Surf and Playwright in collect-evidence

All three selected blocking findings are resolved. Both real controlled-page workflows passed. Independent review failed: SPEC-R8-001 remains blocking.

## Source

Ticket: tracker/tickets/collect-evidence-feedback-01-web.md. Branch: feature/collect-evidence-feedback-01-web. Base: master.

Commit: 4c0b7737acddf17e3a44b865fddb1fd0e0b2fc23. Tree: 97fa1a4794c2ab10d4676993de8414890c525134. Source is clean. One atomic source commit includes validation, regressions, acceptance retention and the existing web reference.

## Selected findings

- **STD-R7-001:** Exclude the authored identity alias from cross-workflow generated-key uniqueness. Keep distinct URL assertions and captures. The real Surf identity workflows passed.
- **SPEC-R7-001:** Validate present precondition locator, text and goto as strings. Validate timeoutMs as finite and non-negative. Preserve omitted fields, empty strings, zero and fractional timeouts. Malformed required checks return exit 2 before generation or dispatch.
- **SPEC-R7-002:** Current real Surf and Playwright controlled workflows passed. Actual selected-project and approved keyboard screenshots were inspected for both drivers. Credential stops, confirmation stops, intended failed assertions, resource cleanup, interruption, missing-media rejection and tamper rejection were exercised.

## Verification

| Check | Observed result |
|---|---|
| Scoped workflow, verdict and Playwright-driver suite | 95 pass, 0 fail, 871 assertions |
| Strict TypeScript with existing BASE dependencies | Exit 0 |
| Real Playwright public workflow | 1 pass, 0 fail, 28 assertions |
| Real Surf public workflow | 1 pass, 0 fail, 86 assertions |
| Standalone public invalid checks from /tmp | Both drivers rejected compile, render and run with exit 2 |
| Standalone live Playwright precondition and capture | Compile, render, run and validate returned 0 |
| Real Playwright native screenshot-loss injection | Exit 2; no sealed run |
| Unstashed pre-commit check | hk run pre-commit --staged passed |

[Validation](../evidence/fix-0048/validation-final.json), [image inspections and safety observations](../evidence/fix-0048/acceptance-inspection-final.json), [scoped suite](../evidence/fix-0048/scoped-suite.json), [Surf workflow](../evidence/fix-0048/surf-real-workflow.json), [Playwright workflow](../evidence/fix-0048/playwright-real-workflow.json).

## Real evidence and cleanup

Both retained runs live under artifacts/evidence/fix-0048/acceptance. Their screenshots show Project selected: Aurora and Submitted. Expected PASS, FAIL, BLOCKED and PARTIAL outcomes matched across all 12 cases for each driver. Missing-media, interruption and tamper checks were reached after the identity cases.

Surf initially had no native-host socket. The operator reconnected it. Doctor then passed, and the authorized workflow passed without restarting browsers or installing tools. Surf tab 498730810 retained chrome://newtab/ and its window identity. No collector session remained.

Playwright initially used absent /opt/google/chrome/chrome. Setting PLAYWRIGHT_MCP_EXECUTABLE_PATH to the existing chromium-1243/chrome-linux64/chrome enabled isolated launch. The control session remained open after normal collection, interruption and missing-media rejection. The fixer then closed only that fixer-created control session.

Historical Surf reset timeouts and Playwright assertion failures remain unchanged. Their historical causes are not established. These current passes do not rewrite earlier results. Initial blocked observations remain alongside the final evidence.

## Limits and ownership

P3 STD-R6-002 and STD-R6-003 remain unselected. Historical advisories remain unchanged. No ADR applies to the selected fixes. LSP initialization was unavailable; direct scoped tsc passed without installation.

No credential entry, tool installation, browser/service restart, remote Git operation, merge, rebase or push occurred. No borrowed tab or session was closed. Temporary standalone scripts, injected screenshot-loss wrapper and owned smoke workspaces were removed after retaining native diagnostics.

The source commit used HK=0 only after the same pre-commit check passed in documented --staged no-stash mode. This skipped the duplicate hook invocation and avoided the known stash failure.

Parent verified fix-complete-0049, acknowledged delivery and removed fixer t37. Current review is FAILURE; fix SPEC-R8-001 before another review. The canonical ticket remains implemented. Prior review-0045 remains FAILURE for its old source; it does not approve the new commit.




## Parent completion: fix-complete-0049

[Completion receipt](../events/fix-complete-0049.yaml). Parent verified the exact clean source commit and tree, validated both sealed runs from /tmp, and inspected both selected-project screenshots. Delivery hash acknowledged; only fixer t37 closed. Canonical ticket remains implemented. Next: fresh independent review because source changed after review-0045. No merge or push.



## Independent review review-0051

FAILURE for `4c0b7737acddf17e3a44b865fddb1fd0e0b2fc23`, tree `97fa1a4794c2ab10d4676993de8414890c525134`. Standards SUCCESS with two unchanged P3 advisories. Spec FAILURE: SPEC-R8-001 P2. [INFERENCE] Signal handling starts after doctor opens an owned Playwright browser; interruption in that prerequisite window may leave it open. This leak was not reproduced. The retained normal two-driver acceptance gate remains satisfied.

[Immutable review](../artifacts/reviews/review-review-0051.md), [review receipt](../events/review-0051.yaml), [parent completion](../events/review-complete-0052.yaml), [validation](../artifacts/evidence/review-0051/scoped-suite.json). Previous review/fix history remains intact. 95 scoped tests and 871 assertions passed; both retained sealed runs validated. Parent validation also passed from /tmp.

Delivery acknowledged; reviewer t3b and its axes closed. Worktree preserved. Ticket remains implemented. Next: fix current SPEC-R8-001 in a fresh session. No merge or push.

