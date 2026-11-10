---
schema: worktree-draft/v1
title: Web fix fix-0042
type: PRDraft
---

# Preserve Surf and Playwright in collect-evidence

The selected P2 findings are fixed. Fresh independent review is required. Browser acceptance remains unverified.

## Source

Ticket: tracker/tickets/collect-evidence-feedback-01-web.md. Branch: feature/collect-evidence-feedback-01-web. Base: master.

Source commit: 6923f54f331697f6e8e591346d8071951909bfc7. Source tree: 9ed7f6b5ed3a9f93da589cfac566a29938bf9bb7. The source workspace remains open and clean.

Two atomic commits: 35b4bbe9 validates optional Step fields; 6923f54f repairs the missing-media fixture. Both commit hooks passed with --stash none.

## Implementation

The existing checkPlan boundary validates capture.attr as string, click.dom and wait.gone as booleans, and wait/expect timeoutMs as finite non-negative numbers. Malformed inputs stop compile, render and run with versioned errors and exit 2 before generated output or driver dispatch. No public type, driver implementation or compatibility path changed.

Omitted optional fields, boolean false, zero and fractional timeouts, empty fill text, empty screenshot slugs and driver-specific locator syntax remain valid. Existing optional assertion, screenshot and says checks remain in place.

The missing-media fixture now gives genuine instructions for opening the page and checking its heading. Its public compile assertion, screenshot deletion, missing-media assertions, interruption checks and tamper checks remain intact. Public compile and render accepted the corrected fixture. This does not prove its later browser operations.

The existing web guide documents optional-field validation and the fixture's compile-before-browser boundary.

## Changed files

- **Validator:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts.
- **Public regressions:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts.
- **Workflow fixture:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts.
- **Existing guide:** mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/web.md.

## Verification

- **Before the fix:** All 32 malformed optional-field regressions failed at the public compile boundary: expected exit 2, observed exit 0. [Retained result](../evidence/fix-0042/regression-before.json).
- **After the fix:** The scoped non-browser suite passed once: 67 tests, 603 assertions, no failures. This includes compile/render/run rejection for both drivers and valid optional boundaries. [Retained result](../evidence/fix-0042/scoped-suite.json).
- **Strict TypeScript:** The scoped check passed with existing BASE dependencies and explicit declaration paths. No installation ran. [Configuration](../evidence/fix-0042/tsconfig.json), [result](../evidence/fix-0042/strict-typecheck.json).
- **Public smokes:** Commands ran from unrelated /tmp working directories in owned external workspaces. Both drivers rejected malformed attr, dom, gone and timeout through compile/render/run: 24 exit-2 errors, with only plan.ts and workspace.json retained. Both valid boundary plans compiled and rendered. The exact corrected missing-media fixture compiled and rendered. [Exact commands and output](../evidence/fix-0042/public-smokes.json), [corrected fixture](../evidence/fix-0042/corrected-missing-media-plan.json).
- **Resource limit:** No browser or fake driver ran. Rejection occurred at the plan-validation boundary before dispatch. No browser workflow or screenshot-deletion scenario was rerun. All owned temporary smoke workspaces were removed.

## Findings and limits

Resolved: SPEC-R6-001, SPEC-R6-002 and overlapping STD-R6-001. [Consumed review](../reviews/review-review-0039.md). No ADR applies to these findings.

Unselected and unchanged: P3 STD-R6-002, STD-R6-003 and historical STD-AXIS-001, STD-R3-001.

The historical Surf blocked.1 reset timeout remains unresolved: queueMs 0 and hard timeout 60041 ms. Earlier Playwright pass-case and approved-space assertion failures remain unresolved. Compile validation is not browser acceptance. No native timeout root cause is claimed.

LSP references were unavailable: initialization could not find a valid TypeScript installation. Existing static references identify loadPlan, finalizeRun and validateRun consumers of checkPlan. No dependency installation was authorized or attempted.

The guide retains its existing collect-evidence/v1 schema/kind frontmatter; no OKF concept schema migration applies. This standalone draft is validated as an OKF document. A full bundle audit is outside this fix.

## Ownership and next gate

The assigned fresh fixer executed parent phase-start fix-start-0041. Parent owns BASE publication, tracker comments, projections, acknowledgement, terminal closure and fix-complete. No merge, push, ticket completion or BASE commit occurred. The canonical ticket remains implemented.

Parent must validate this receipt and the new clean source, then obtain a fresh independent review. Prior review-0039 remains FAILURE for its recorded source; this fix is not a review verdict.

