---
schema: worktree-implementation-log/v1
kind: projection
---
# GUI implementation history

## implementation-0002 — attempt 1

[Result receipt](../events/implementation-0002.yaml). Parent: [start-0001](../events/start-0001.yaml).

Implemented read-only Linux X11 GUI window/display capture, exact scope approval, real selected-surface doctor checks, stable-frame RGB assertions, native provenance, immutable common records and GUI playbook. Existing web and TUI drivers remain in place.

Source commit: `0e23bc5a95e72e69cdb4b5117b979cdd391fd510`. Source tree: `fcc897b3612aaf5ebe7faad12d773c2f7e55132f`.

### Changed files

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

### Validation results

- **PASSED**: RUN_GUI_EVIDENCE_TESTS=1 KEEP_GUI_EVIDENCE=1 GUI_EVIDENCE_SCOPE=<approved-fixture> GUI_EVIDENCE_IMAGE=<480x260-rgb-probes> mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test
- **PASSED**: Native image inspection
- **PASSED**: GUI doctor and run with XAUTHORITY=/dev/null
- **PASSED**: GUI failed dimension assertion, title mismatch, scope mismatch, credential fill and Enter confirmation
- **PASSED**: Current public validate against retained TUI transition copy and four durable GUI runs
- **FAILED**: mise exec -- env COLLECT_EVIDENCE_REAL_DRIVERS=1 bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts -t "surf: capture"
- **BLOCKED**: Public doctor --driver playwright
- **BLOCKED**: Public doctor --driver tui
- **UNAVAILABLE**: TypeScript language server / compiler availability
- **PASSED**: Borrowed GUI cleanup inspection

[Full validation details](../artifacts/snapshots/validation-implementation-0002.json).

### Unresolved questions

- The additional live Surf regression failed at approved-space.3 (expected Submitted, observed Not submitted). Independent review must assess this before integration; no Surf input handling changed.
- Fresh Playwright and TUI capture coverage is blocked by host prerequisites. The retained TUI transition archive validates.
- Native Wayland, macOS, Windows, GUI video, OCR and automated GUI input are explicit unsupported capabilities.

## fix-0009 — attempt 1

Blocked: requested `lines: []` already exists in reviewed commit `4e5def3a`. Changed files: none. Source remains clean and unchanged. Public init and compile of the exact documented example from `/tmp` passed with no substitutions. Historical review finding CEGUI-R1 requires reconciliation; no new review verdict is issued.

- [Fix result](../events/fix-0009.yaml)
- [Compile proof](../artifacts/snapshots/validation-fix-0009.json)
- [Immutable fix snapshot](../artifacts/snapshots/pr-draft-fix-0009.md)
- [Parent completion](../events/fix-0010.yaml)

## review-0006 — attempt 1

Verdict: FAILURE. Reviewed commit: `4e5def3a26cf0ac700ee29b3c1f92e8a7704ca71`. Source unchanged. No fix has run. Open blocking finding: CEGUI-R1.

- [Immutable review](../artifacts/reviews/review-review-0006.md)
- [Review result](../events/review-0006.yaml)
- [Parent completion](../events/review-0007.yaml)

Parent public native archive validation returned exit 0 from `/tmp`. The review confirmed that the published GUI example fails compile; its temporary correction passes. Surf failure and host coverage limits remain recorded. No merge, push or ticket completion occurred.
