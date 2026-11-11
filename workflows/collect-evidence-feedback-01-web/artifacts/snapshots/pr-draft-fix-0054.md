---
schema: worktree-draft/v1
title: Web lifecycle fix fix-0054
type: PRDraft
---
# Preserve Surf and Playwright in collect-evidence

SPEC-R8-001 is resolved at fc122615ba485d1059313b5b6ed54d3a459a0704, tree 5385016678fec6057d508c1c5bb9561180afb9cc. Source is clean. Fresh independent review is required. Review-0051 remains FAILURE for its older source.

## Change

Doctor and run now have one command-scoped cancellation state. Run calls the prerequisite check within its existing scope instead of installing a second handler. Acquisition finishes recording ownership before cleanup. Signals stop later work; repeated signals do not kill cleanup. Interrupted commands return exit 1 and do not claim completion.

The public regression pauses after the installed Playwright CLI has opened a real owned browser. It covers standalone doctor and run prerequisites with SIGINT and SIGTERM. It checks the owned browser is gone, the control session survives, no later run browser opens, and no run is finalized.

## Verification

| Check | Result |
|---|---|
| Failing-before real doctor SIGINT | Exit 130; owned browser remained open |
| Final prerequisite regression | Four scenarios; 36 assertions passed |
| Full real Playwright workflow plus prerequisite regression | Two tests; 64 assertions passed |
| Full real Surf workflow | One test; 86 assertions passed |
| Scoped workflow, verdict and driver suite | 95 tests; 871 assertions passed |
| Strict TypeScript with existing BASE dependencies | Passed |
| Independent installed doctor commands from /tmp | Both drivers returned 0; no Playwright browsers remained |
| Unstashed pre-commit | hk run pre-commit --staged passed |

Both actual selected-project images were inspected. They show Project selected: Aurora. Existing confirmation and credential stops, missing-media rejection, later collection interruption, tamper rejection and read-only consumers also passed. Surf tab 498730810 retained chrome://newtab/ and window 498730809. Fixture-created control sessions survived interruption checks, then the fixture closed only its own resources.

[Validation](../evidence/fix-0054/validation-final.json), [failing-before](../evidence/fix-0054/prerequisite-before-lifecycle.json), [final prerequisite proof](../evidence/fix-0054/prerequisite-after-final.json), [Playwright acceptance](../evidence/fix-0054/playwright-after.json), [Surf acceptance](../evidence/fix-0054/surf-after.json), [independent smoke](../evidence/fix-0054/standalone-smoke.json).

## Limits and ownership

Failing-before proof covers standalone doctor SIGINT. Passing-after proof covers both commands and both signals. The PATH barrier executes the real installed browser command; it does not simulate browser output. No historical failure was rerun to infer a cause.

Initial regression-fixture setup errors and initial strict type errors remain retained. They were corrected before the final checks. LSP initialization was unavailable; strict tsc passed without installation. No new ADR. P3 advisories and prior historical records remain unchanged.

The single atomic source commit includes the implementation, regression and existing web reference. HK=0 skipped only duplicate hook invocation after the documented no-stash hook passed. No pending stash journal or recovery stash was touched.

No credentials, installation, browser/service restart, remote Git, rebase, merge, push or borrowed-resource closure occurred. Temporary prerequisite fixtures were removed. The canonical ticket remains implemented. Parent owns acknowledgement, phase-complete, workflow-artifact publication and pane closure.
