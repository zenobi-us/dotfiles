---
schema: worktree-pr-draft/v1
kind: snapshot
---
# Collect scoped native GUI evidence

## Ticket and problem

[collect-evidence-feedback-03-gui](../../../..//tracker/tickets/collect-evidence-feedback-03-gui.md) requires approved native GUI capture with common records and safe cleanup. The previous CLI rejected the GUI driver.

## Implementation

Implemented read-only Linux X11 GUI window/display capture, exact scope approval, real selected-surface doctor checks, stable-frame RGB assertions, native provenance, immutable common records and GUI playbook. Existing web and TUI drivers remain in place.

Source commit: `0e23bc5a95e72e69cdb4b5117b979cdd391fd510`. Source tree: `fcc897b3612aaf5ebe7faad12d773c2f7e55132f`.

The commit hook synchronized the marketplace bundle version with developer plugin 0.2.20. CLI version is 1.1.0.

## Changed files

- `mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json`
- `mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/SKILL.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/evidence-schema.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/gui.md`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/gui-driver.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/gui-plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/load-plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/pipeline.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/records.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/render-plan.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/gui-workflow.test.ts`
- `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts`

## Validation

- Public suite: 102 passed, 31 skipped, 0 failed; 943 assertions.
- Installed-copy GUI workflow: native PASS, pixel assertion FAIL, denied permission BLOCKED and changed title BLOCKED. Invalid scope and input plans returned exit 2.
- Inspected the original 480 × 260 PNG. Expected heading and coloured panels match. No unrelated desktop content appears.
- Borrowed fixture window remained viewable after all cases. Only the owning fixture harness stopped it afterward.
- Current public validator accepted the retained TUI transition archive and all four GUI outcomes.
- Additional live Surf regression: FAILURE at approved-space.3; expected Submitted, observed Not submitted. Preserve this failure for review.
- Fresh Playwright and TUI capture: BLOCKED by host prerequisites. No installs or sudo occurred.
- Typecheck unavailable. No TypeScript installation exists in this workspace.

## Review and merge

No independent review has run. Latest reviewer verdict: none. Resolved findings: none. Remaining findings: no independent findings recorded. The Surf validation failure remains open for review.

Not merged or pushed. Ticket remains claimed. Workspace remains open.

## Supporting records

- [Phase start](../../events/start-0001.yaml)
- [Implementation result](../../events/implementation-0002.yaml)
- [Validation details](validation-implementation-0002.json)
- [native-0001](../evidence/native-0001/run.json)
- [permission-0001](../evidence/permission-0001/run.json)
- [pixel-failure-0001](../evidence/pixel-failure-0001/run.json)
- [identity-blocked-0001](../evidence/identity-blocked-0001/run.json)
- [surf-regression-0001](../evidence/surf-regression-0001/run.json)

## Open questions

- The additional live Surf regression failed at approved-space.3 (expected Submitted, observed Not submitted). Independent review must assess this before integration; no Surf input handling changed.
- Fresh Playwright and TUI capture coverage is blocked by host prerequisites. The retained TUI transition archive validates.
- Native Wayland, macOS, Windows, GUI video, OCR and automated GUI input are explicit unsupported capabilities.
