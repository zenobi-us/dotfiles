---
schema: worktree-draft/v1
title: Web fix fix-0036
type: PRDraft
---

# Preserve Surf and Playwright in collect-evidence

SPEC-R5-001 is fixed. Fresh independent review is required. Complete browser acceptance remains unverified.

## Source

Ticket: tracker/tickets/collect-evidence-feedback-01-web.md. Branch: feature/collect-evidence-feedback-01-web. Base: master.

Commit: 3dbab24ce09d4cf1c3eaedf467af63e007b9e976. Tree: 213b91da7d7589912d53f67c19cc5e5c76adc54f. Source workspace remains open and clean.

## Change

The existing checkPlan boundary now validates required Step string fields before compile, render or run can proceed. It rejects missing capture.locator and capture.as. It also checks navigation, click, fill, wait, scroll, press, human and reader-facing says fields. Assertion fields retain their typed optionality and reject incorrect types.

Wait and scroll can omit says. Capture can omit attr. URL-only assertions can omit locator. Empty fill text, empty screenshot slugs, visible: false and timeoutMs: 0 remain valid. CSS and Playwright locator syntax remain unchanged. Driver implementations and public types are unchanged.

The existing web guide documents this boundary. No compatibility layer or new abstraction was added.

## Verification

- **Regression before:** The public CLI regression failed all 18 malformed Step cases before the implementation changed. Missing capture fields returned exit 0 instead of 2.
- **Scoped suite after:** 35 passed, 0 failed, 283 expectations across workflow, verdict and Playwright compiler tests. This excluded the historical browser suite.
- **Independent smoke:** Eight separately initialized external workspaces ran public commands from /tmp. Both drivers rejected invalid captures through compile, render and run. Two additional compile/render workspaces used the exact retained review fixture. All returned versioned errors with exit 2 and retained only plan.ts and workspace.json. Driver execution guards recorded no invocation.
- **Optional boundaries:** Public compile/render tests passed for both drivers with the optional-field cases described above.
- **TypeScript:** Scoped strict typecheck passed using existing BASE dependencies. Initial temporary configurations could not resolve versioned Crust imports; explicit installed declaration paths resolved that fixture issue. LSP initialization was unavailable.
- **Commit hooks:** bundle-versions passed with --stash none. No stash command ran.

[Exact smoke observations](../evidence/fix-0036/public-smoke.json). [Retained fixture observations](../evidence/fix-0036/retained-fixture-smoke.json). [Passing typecheck](../evidence/fix-0036/typecheck-resolved.json). [Failing-before regression](../evidence/fix-0036/regression-before.txt). [Passing scoped suite](../evidence/fix-0036/regression-after.txt).

## Findings and limits

Resolved: SPEC-R5-001 only. Unselected and unchanged: STD-AXIS-001 and STD-R3-001. No ADR applies to this input-validation fix. [Consumed review](../reviews/review-review-0033.md).

The prior Surf blocked.1 timeout remains unresolved: queue 0 and hard timeout after 60041 ms. Earlier Playwright pass-case and approved-space failures remain unexplained. No historical browser workflow was rerun. These compile and validation checks do not establish browser acceptance.

The initial temporary smoke repository omitted a required route adapter. Init failed before creating a workspace. Only that temporary fixture was corrected. Both initial typecheck configuration failures remain retained beside the passing result.

The existing web guide uses collect-evidence/v1 schema/kind frontmatter, not an OKF concept type. The generic OKF concept validator reports its pre-existing missing type field. Its owned schema was not migrated. This standalone draft passes OKF validation; no full bundle migration applies.

No merge, push, ticket completion, browser restart, installation or BASE commit occurred. Prior sealed evidence and third-party output remain unchanged. The canonical ticket remains implemented. Parent owns BASE publication, projections, tracker comments, acknowledgement, terminal closure and phase completion.

