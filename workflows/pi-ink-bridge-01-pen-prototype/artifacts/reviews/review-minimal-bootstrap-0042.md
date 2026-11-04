# Minimal bootstrap review 0042

- Ticket: `tracker/tickets/pi-ink-bridge-01-pen-prototype.md`.
- Branches: source `master`; base `master`.
- Baseline: `029e232162273d8822fb2b151e98504c23bc152a`.
- Reviewed commit: `ea313cdc54cd0679e1d3709fd87a6f1edb49ed45`.
- Reviewed tree: `d5f5297e5f910c896403cb9bb170bcbba55e4d51`.
- Review completion: `2026-11-04T23:15:16.813Z`.
- Scope: the three minimal bootstrap parts. No prototype workflow takeover or phase transition occurred.
- Validation: typecheck, eight tests with 44 assertions, and the complete local smoke passed. No real SSH, tablet contact, or live harness restart ran.

Paths below are relative to `mise/conf.d/devtools-omp/extensions/image-annotator/`.

## Standards

**FAILURE — one low-severity standards breach.**

`index.ts:107–119` places the new `startCoordinator` helper before the public `imageAnnotatorExtension` entry point at line 121. This violates `iso-24495-code`, rule 1: put the public entry point before its helpers. Move `startCoordinator` below the entry point. Keep `CoordinatorState` instance-owned. This is a source-order issue, not a runtime defect.

Both the HTTP handler and startup helper are at module scope. The startup promise remains in each extension instance. The installer validates its URL through the client before creating its prefix. The public coordinator remains separate from the private editor. No additional actionable smell or functional defect was found.

## Spec

**SUCCESS.**

No requested part is missing within this scope:

- The extension starts a local HTTP coordinator and exposes health and bundle routes.
- The build packages the ARM64 client, installer, and version file. HTTP serves that bundle and its checksum.
- The extension-owned provisioning script fetches and checks the bundle, transfers it through SSH, and runs the installer.

No material scope expansion or blocking defect was found. The existing browser editor stays available. The source adds no drawing UI, XOVI integration, daemon, pairing, process detector, or automatic deployment. The installer/client validation mismatch is fixed. Hardware acceptance remains deferred.

Both reviews were read-only. Parent-reported runtime evidence was not independently repeated. Staged `mise.toml` and old workflow evidence were excluded.

## Verdict

**FAILURE for this source commit.** Standards: 1 low-severity ordering breach. Spec: 0 findings. Preserve this review and review the corrected source in fresh sessions.

