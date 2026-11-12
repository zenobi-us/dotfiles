---
schema: worktree-pr-draft/v1
kind: projection
---
# Collect scoped native GUI evidence

## Ticket summary and problem

[Ticket](../../../tracker/tickets/collect-evidence-feedback-03-gui.md): capture only the approved native window or display, use common evidence records and preserve borrowed resources. The earlier public CLI rejected the GUI driver.

## Implementation

Implemented read-only Linux X11 GUI window/display capture, exact scope approval, real selected-surface doctor checks, stable-frame RGB assertions, native provenance, immutable common records and GUI playbook. Existing web and TUI drivers remain in place.

Source commit: `0e23bc5a95e72e69cdb4b5117b979cdd391fd510`. Source tree: `fcc897b3612aaf5ebe7faad12d773c2f7e55132f`.

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

## Validation results

- **PASSED**: RUN_GUI_EVIDENCE_TESTS=1 KEEP_GUI_EVIDENCE=1 GUI_EVIDENCE_SCOPE=<approved-fixture> GUI_EVIDENCE_IMAGE=<480x260-rgb-probes> mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test. Installed temporary copy from unrelated cwd with temporary resolved evidence store; actual GTK X11 fixture
- **PASSED**: Native image inspection. Expected heading, purple and cyan panels, fixture notice; no unrelated desktop content
- **PASSED**: GUI doctor and run with XAUTHORITY=/dev/null. Sealed BLOCKED; no assets; assertion not-run
- **PASSED**: GUI failed dimension assertion, title mismatch, scope mismatch, credential fill and Enter confirmation. Recorded in validation details.
- **PASSED**: Current public validate against retained TUI transition copy and four durable GUI runs. Recorded in validation details.
- **FAILED**: mise exec -- env COLLECT_EVIDENCE_REAL_DRIVERS=1 bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/browser-workflow.test.ts -t "surf: capture". approved-space.3 expected Submitted, got Not submitted
- **BLOCKED**: Public doctor --driver playwright. Chrome distribution absent at /opt/google/chrome/chrome; no installation attempted
- **BLOCKED**: Public doctor --driver tui. foot, grim and tesseract absent; no installation attempted
- **UNAVAILABLE**: TypeScript language server / compiler availability. LSP initialization failed: no workspace TypeScript installation. No tsc binary or local TypeScript dependency found. No typecheck claimed.
- **PASSED**: Borrowed GUI cleanup inspection. xwininfo found the fixture window after each public case. Only its owning smoke harness later stopped its service. No borrowed resource shutdown occurred.

## Review history and findings

Latest reviewer verdict: FAILURE for `4e5def3a26cf0ac700ee29b3c1f92e8a7704ca71`. Open blocking finding: CEGUI-R1 (P2). Standards: no hard breach; CEGUI-N1 is an optional P3 heuristic. Resolved findings: none. See the [immutable review](../artifacts/reviews/review-review-0006.md) and [result](../events/review-0006.yaml). The Surf failure remains unresolved; no diff-caused change was identified.

## Fix attempt fix-0009

Blocked: CEGUI-R1 conflicts with the exact reviewed source. The published plan already contains `lines: []`. Public init and compile of the unchanged mq-extracted example both returned exit 0 from `/tmp`, with no substitutions. No source edits or source commit were made. The historical review remains immutable; no replacement verdict is claimed.

- [Fix result](../events/fix-0009.yaml)
- [Compile proof](../artifacts/snapshots/validation-fix-0009.json)
- [Fix snapshot](../artifacts/snapshots/pr-draft-fix-0009.md)
- [Parent completion](../events/fix-0010.yaml)

## Merge status

Not merged or pushed. Source ticket remains claimed. Source worktree is retained and unchanged. Reviewer terminals are closed. Parent completion: [review-0007](../events/review-0007.yaml). Next action: reconcile the inconsistent CEGUI-R1 finding with the pinned source and compile proof before another phase.

## Supporting receipts and artifacts

- [Review start](../events/review-0005.yaml)
- [Review result](../events/review-0006.yaml)
- [Review completion](../events/review-0007.yaml)
- [Immutable review](../artifacts/reviews/review-review-0006.md)

- [Start receipt](../events/start-0001.yaml)
- [Implementation result](../events/implementation-0002.yaml)
- [Immutable PR draft](../artifacts/snapshots/pr-draft-implementation-0002.md)
- [Validation details](../artifacts/snapshots/validation-implementation-0002.json)
- [native-0001](../artifacts/evidence/native-0001/run.json)
- [permission-0001](../artifacts/evidence/permission-0001/run.json)
- [pixel-failure-0001](../artifacts/evidence/pixel-failure-0001/run.json)
- [identity-blocked-0001](../artifacts/evidence/identity-blocked-0001/run.json)
- [surf-regression-0001](../artifacts/evidence/surf-regression-0001/run.json)

## Open questions

- The additional live Surf regression failed at approved-space.3 (expected Submitted, observed Not submitted). Independent review must assess this before integration; no Surf input handling changed.
- Fresh Playwright and TUI capture coverage is blocked by host prerequisites. The retained TUI transition archive validates.
- Native Wayland, macOS, Windows, GUI video, OCR and automated GUI input are explicit unsupported capabilities.
