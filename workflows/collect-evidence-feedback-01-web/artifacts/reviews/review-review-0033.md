---
type: Review
schema: worktree-review/v1
title: Independent web review review-0033
---
# Independent web review review-0033

Review the frozen web cutover for the ticket owner and implementer.
Timestamp: 2026-11-10T06:58:27.435Z. Reader: parent workflow owner.

## Overview

FAILURE. Standards has no blocker and one P3 advisory. Spec has one reproduced P2 blocker. Reject malformed capture steps before generating successful output. Retained browser failures remain unresolved. This verdict does not claim complete driver acceptance.

[Scope](#scope) · [Standards](#standards) · [Spec](#spec) · [Checks and limits](#checks-and-limits)

## Scope

- **Ticket:** tracker/tickets/collect-evidence-feedback-01-web.md, backend local-markdown. Complete specification: tracker/initiatives/collect-evidence-feedback/index.md.
- **Canonical store:** /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles. Source-worktree tracker and workflow copies were not authoritative.
- **Source workspace:** /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web.
- **Branches:** feature/collect-evidence-feedback-01-web against master.
- **Frozen source:** commit 8c4015418f6b3fee244708d9937e45bb358fc45d; tree 28784b1a67c200888c53a947b3b056f2569cccbc.
- **Fixed point:** master resolved to a8e5a365151b620d8201fdc0efddf7249cce7120 at review start. Merge base: 859341b01ef7be474a3128b7f94772aab731c2f7. Diff: `git diff master...8c4015418f6b3fee244708d9937e45bb358fc45d`.
- **Commits:** 0acff3b4 implementation; 3d1b2825 guards; 12b6345a ID encoding; b711ef1b empty screenshot slug; 8c401541 separate Surf maps.
- **Coverage:** All 60 changed files, callers, typed plans, commands, records, storage, safety and retained validation. Future feedback, TUI and GUI implementation is outside this ticket.

Standards and Spec ran concurrently in fresh muxer sessions t1w and t1v. Neither axis edited source or ran tests, builds, lint, formatters or browser workflows. Both reported native done. Their assigned transport failed at /home, which is a symlink. Their retained JSON was inspected and preserved as evidence. Both owned terminals were closed and removed. Parent and source workspace remain open.

CONTEXT.md is absent. The architecture decision index lists only ADR 0001, Pi Ink cleanup trust boundary. It does not govern browser evidence.

## Standards

No blocking documented-standard violation was found. The supplied twelve-smell baseline remains a heuristic, not a mandatory style rule.

### STD-AXIS-001

- **Severity:** P3, non-blocking judgment call: possible Duplicated Code.
- **ADR reference:** NO ADR. ADR 0001 concerns Pi Ink cleanup, not Markdown generation.
- **Locations:** [pipeline.ts:48–55](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts#L48-L55) and [records.ts:450–453](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts#L450-L453).
- **Description:** Both helpers construct schema/kind frontmatter and invoke mise/mq with the OKF import. They differ in subprocess handling, lock policy, output format, overwrite policy and error classification.
- **Required change:** Optional. Extract shared generation into a leaf module if this avoids a dependency cycle. Preserve caller-specific overwrite and failure policies.
- **Validation command:** `mise exec -- bun test /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/workflow.test.ts`. Not run during this review.

The axis did not classify unexplained runtime failures as standards violations.

## Spec

### SPEC-R5-001

- **Severity:** P2, blocking.
- **ADR reference:** NO ADR. The ticket and initiative define input validation. ADR 0001 concerns a different subsystem.
- **Requirement:** Ticket: “Reject invalid records, missing media and unsupported explicit schemas without a valid-looking partial run.” Initiative commands require exit code 2 for invalid arguments or schemas.
- **Location:** [records.ts:354–357](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts#L354-L357). Required capture fields: [plan.ts:42](file:///run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/plan.ts#L42).
- **Description:** checkPlan validates action names, screenshot slugs and expect fields, but does not require capture.locator or capture.as. A plan containing `{ do: "capture", says: "Read the visible heading" }` passes public compile and render. Both return exit 0 with success:true. Compile writes compiled.json and workflows; render writes plan.json and test-plan.md. The axis also identified this gap in retained invalid-fixture execution. Invalid author input can reach the browser instead of failing at the input boundary.
- **Required change:** Validate required capture fields before compile/render writes or driver execution. Return exit 2 and a versioned error. Apply required-field checks to other Step variants while preserving fields that the typed contract makes optional.
- **Validation command:** `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts compile "$FRESH_WORKSPACE" --json --no-input`; repeat with `render`. Initialize separate external workspaces and copy the retained invalid-plan.ts into each. Require exit 2, kind:error, no generated outputs and no driver invocation. Add a public invalid-input regression.
- **Completion impact:** Blocks the specified invalid-input contract. This is a reproduced source defect, not an attribution of the old Surf or Playwright failures.

Standards: one advisory, no blocker. Spec: one blocker; worst severity P2. The axes remain separate.

## Checks and limits

- **Frozen diff:** Read master, merge base, commit list and actual source diff. The receipt writer rechecks source commit/tree. No source edits, commits, stash commands, merge or push ran in this review.
- **Public help smoke:** Ran executable collect-evidence.ts --help from /tmp with MISE_AUTO_INSTALL=false and BUN_INSTALL_AUTO=disable. Exit 0; documented web commands appeared. This proves executable resolution, not driver acceptance.
- **Distinct invalid-input smoke:** Public compile and render ran against separate owned temporary workspaces from /tmp. Both returned exit 0 and success:true for missing capture.locator/as. No driver ran. [Exact observations](../evidence/review-0033-invalid-plan/observations.json) retain arguments, output and file lists. [Invalid plan fixture](../evidence/review-0033-invalid-plan/invalid-plan.ts) preserves the input.
- **New evidence:** workflows/collect-evidence-feedback-01-web/artifacts/evidence/review-0033-invalid-plan. It contains the bounded smoke and inspected axis payloads, not a browser capture or fabricated media.
- **Retained suite:** fix-0026 final-scoped-suite.stderr.log records 15 pass, 2 fail, 73 expectations. The compile fixture was later corrected and its targeted check passed. Surf blocked.1 timed out before its workflow and credential fill. No failed suite or earlier failing workflow was rerun.
- **Native trace:** transport-recovery-0031/native-request-trace.json proves queueMs 0 and hard timeout after 60041 ms. It does not establish extension/browser root cause. Earlier Playwright pass-case and approved-space failures remain unexplained.
- **Parent integrity checks:** Parent reported both retained fix-0026 Surf and Playwright runs validate with exit 0 from /tmp. This proves sealed-record/media integrity only, not driver acceptance. These checks were not repeated here.
- **Recovery provenance:** review-start-0032 records approval for one fresh review. review-0029 was already reconciled by review-complete-0031 and had no usable verdict. It supplied diagnostics, not acceptance. Parent held BASE publication during its hook recovery, then explicitly cleared the hold. No transient missing file became a finding.
- **Limits:** No full tests, build, lint, formatter, video or browser acceptance run occurred. A full OKF bundle audit does not apply to this selected-record review. Complete passing acceptance remains unavailable. FAILURE rests on SPEC-R5-001 alone.

Parent owns tracker comments, publication and completion receipts. Fix SPEC-R5-001 before a new frozen-source review. Preserve all retained negative evidence.
