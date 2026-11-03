# Pi Ink native UI revision

## Ticket and problem

[Prove Paper Pro pen input](../../../tracker/tickets/pi-ink-bridge-01-pen-prototype.md). Global navigation retained a hidden-sidebar inset and toggled the manager closed. The document action used the full manager and both sidebar positions were wrong.

## Implementation

Global Pi Ink is last before the top-section spacer. Repeated selection calls showManager. Geometry follows actual sidebar visibility/width and native content-header height. Document Pi Ink is immediately before the preserved TOC button. Its native foldout uses two native rows for status and explicit Send/confirmation. Native selection, dismissal and orientation remain authoritative. Pairing protocol and consent checks are unchanged.

## Source

Commit `bb5df500f4a06c61ebde6073470ef5ed51f4b006`, tree `9a9acbfbc65d17f87eb44f2e0a7898000b1d735b`.

- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-qml/PiInkToolbar.qml`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-qml/pi-ink-bridge.qmd`
- `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-qml/activation-proposal.json`

## Validation

All 12 preserved QMD hashes match. Offline QMLDiff loaded 13 patches and processed all five affected native resources. Qt AST parsing passed for all five outputs and the component. Extracted actual JavaScript smoke passed. Build, typecheck, 15 Bun tests and Go race tests passed. Build reported dependency directive and chunk-size warnings. No private native-type instantiation or physical layout/input proof is available.

## Review history and findings

Two fresh read-only review axes found stale activation-proposal descriptions. Those descriptions were corrected before the source commit. These are source self-checks, not formal workflow SUCCESS verdicts. Latest formal reviewer verdict: none. No formal review/fix receipts exist in this history.

## Remaining blockers and merge status

Hardware UI acceptance, association/Send proof and original-proxy restoration remain blocked. No tablet commands, screenshots, capture helpers, installation, restart or restoration ran in this attempt. New exact payload/restart/rollback approval is required. Credentials and experiment cleanup remain open. Ticket stays claimed; production stays blocked. No merge, rebase or push occurred.

## Receipt history

- [implementation-0005](../events/implementation-0005.yaml) — phase-result, blocked, source `564c037546911f6e26936383b63eab9129819b97`.
- [implementation-0008](../events/implementation-0008.yaml) — phase-result, blocked, source `564c037546911f6e26936383b63eab9129819b97`.
- [implementation-0011](../events/implementation-0011.yaml) — phase-result, failed, source `564c037546911f6e26936383b63eab9129819b97`.
- [implementation-0014](../events/implementation-0014.yaml) — phase-result, blocked, source `564c037546911f6e26936383b63eab9129819b97`.
- [implementation-0017](../events/implementation-0017.yaml) — phase-result, blocked, source `ff9ec2a2f5aedbf804ad8cce7c8843ec95f25456`.
- [implementation-0023](../events/implementation-0023.yaml) — phase-result, completed, source `bb5df500f4a06c61ebde6073470ef5ed51f4b006`.
- [start-0001](../events/start-0001.yaml) — phase-start, started, source `d17c0898f2219b3097f6a4e37bafd430f4c53b89`.
- [start-0004](../events/start-0004.yaml) — phase-start, started, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-0007](../events/start-0007.yaml) — phase-start, started, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-0010](../events/start-0010.yaml) — phase-start, started, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-0013](../events/start-0013.yaml) — phase-start, started, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-0016](../events/start-0016.yaml) — phase-start, started, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-0019](../events/start-0019.yaml) — phase-start, started, source `ff9ec2a2f5aedbf804ad8cce7c8843ec95f25456`.
- [start-0022](../events/start-0022.yaml) — phase-start, started, source `4614293693e7973722a6a470a761e563221a7c28`.
- [start-complete-0003](../events/start-complete-0003.yaml) — phase-complete, blocked, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-complete-0006](../events/start-complete-0006.yaml) — phase-complete, blocked, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-complete-0009](../events/start-complete-0009.yaml) — phase-complete, blocked, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-complete-0012](../events/start-complete-0012.yaml) — phase-complete, failed, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-complete-0015](../events/start-complete-0015.yaml) — phase-complete, blocked, source `564c037546911f6e26936383b63eab9129819b97`.
- [start-complete-0018](../events/start-complete-0018.yaml) — phase-complete, blocked, source `ff9ec2a2f5aedbf804ad8cce7c8843ec95f25456`.
- [start-complete-0021](../events/start-complete-0021.yaml) — phase-complete, blocked, source `4614293693e7973722a6a470a761e563221a7c28`.

## Supporting artifacts

- [build.log](../artifacts/evidence/implementation-0023/build.log).
- [final-validation.json](../artifacts/evidence/implementation-0023/final-validation.json).
- [go-race.log](../artifacts/evidence/implementation-0023/go-race.log).
- [offline-inputs.json](../artifacts/evidence/implementation-0023/offline-inputs.json).
- [qmd-native-context-final.json](../artifacts/evidence/implementation-0023/qmd-native-context-final.json).
- [qmd-native-context-with-hashtab.json](../artifacts/evidence/implementation-0023/qmd-native-context-with-hashtab.json).
- [qmd-native-context.json](../artifacts/evidence/implementation-0023/qmd-native-context.json).
- [qt-native-syntax.json](../artifacts/evidence/implementation-0023/qt-native-syntax.json).
- [review-resolutions.json](../artifacts/evidence/implementation-0023/review-resolutions.json).
- [source-identity.json](../artifacts/evidence/implementation-0023/source-identity.json).
- [tests.log](../artifacts/evidence/implementation-0023/tests.log).
- [typecheck.log](../artifacts/evidence/implementation-0023/typecheck.log).
- [ui-handler-smoke.json](../artifacts/evidence/implementation-0023/ui-handler-smoke.json).

## Earlier artifacts

- [pr-draft-implementation-0005.md](../artifacts/snapshots/pr-draft-implementation-0005.md).
- [pr-draft-implementation-0008-links-0009.md](../artifacts/snapshots/pr-draft-implementation-0008-links-0009.md).
- [pr-draft-implementation-0008.md](../artifacts/snapshots/pr-draft-implementation-0008.md).
- [pr-draft-implementation-0011.md](../artifacts/snapshots/pr-draft-implementation-0011.md).
- [pr-draft-implementation-0014.md](../artifacts/snapshots/pr-draft-implementation-0014.md).
- [pr-draft-implementation-0017.md](../artifacts/snapshots/pr-draft-implementation-0017.md).

- [geometry-001 evidence](../artifacts/evidence/geometry-001/).
- [implementation-0008 evidence](../artifacts/evidence/implementation-0008/).
- [implementation-0011 evidence](../artifacts/evidence/implementation-0011/).
- [implementation-0014 evidence](../artifacts/evidence/implementation-0014/).
- [implementation-0017 evidence](../artifacts/evidence/implementation-0017/).
- [implementation-0020 evidence](../artifacts/evidence/implementation-0020/).
- [implementation-0023 evidence](../artifacts/evidence/implementation-0023/).
- [pen-round-trip-001 evidence](../artifacts/evidence/pen-round-trip-001/).
- [pen-round-trip-002 evidence](../artifacts/evidence/pen-round-trip-002/).
- [stock-editor-attempt-002 evidence](../artifacts/evidence/stock-editor-attempt-002/).
- [stock-editor-cable-free-001 evidence](../artifacts/evidence/stock-editor-cable-free-001/).
- [stock-editor-round-trip-001 evidence](../artifacts/evidence/stock-editor-round-trip-001/).
