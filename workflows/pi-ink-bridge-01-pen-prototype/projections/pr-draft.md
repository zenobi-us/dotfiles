# Offline cleanup reader — implementation-0029

Prepare a bounded identity reader for later owner-approved cleanup evidence.
Date: 2026-11-04. Reader: parent integrator and device owner.

## Overview

Approved offline slice completed. Full ticket and production remain **BLOCKED**; canonical work_status remains claimed. No device command, staging, config retrieval, permission repair, restart, cleanup deletion, source edit or commit occurred. This is not a formal SUCCESS review.

[Canonical ticket](../../../tracker/tickets/pi-ink-bridge-01-pen-prototype.md) defines the full product scope. This result covers only the offline reader. [Frozen future device transaction](../artifacts/evidence/offline-reader-0029/device-proposal.json) is a proposal, not authority.

## Reader and verification

The production executable accepts no arguments or runtime path/ownership/digest overrides. Both fixed markers must match before either config opens. All components use no-follow descriptor opens; reads are nonblocking, regular-file-only and capped. Final descriptor/path/metadata checks gate both config result rows. Config bytes are hashed in process, never parsed, printed or copied to evidence. Reads may update atime.

- **Source:** [Fixed production entry](../artifacts/evidence/offline-reader-0029/main_linux.go), [Bounded reader engine](../artifacts/evidence/offline-reader-0029/reader_linux.go).
- **Host-only support:** [Refusal and boundary tests](../artifacts/evidence/offline-reader-0029/main_linux_test.go), [Separate synthetic smoke executable](../artifacts/evidence/offline-reader-0029/host_fixture_linux.go). Never deploy the host harness.
- **Build evidence:** [Reproducible offline validation driver](../artifacts/evidence/offline-reader-0029/verify.py), [Observed test/build/smoke output](../artifacts/evidence/offline-reader-0029/validation.json), [Frozen file digest index](../artifacts/evidence/offline-reader-0029/sha256-index.json).
- **Validation command:** python3 verify.py from the resolved offline-reader-0029 directory. One final format/test/build/smoke pass returned OFFLINE_TEST_BUILD_SMOKE_PASS_NO_DEVICE_EXECUTION.
- **Observed results:** Host tests passed. Static Linux amd64 and ARM64 builds passed. Separate synthetic host executable returned both expected digests without fixture bytes. Production rejected --fixture=/unapproved with exit1 and fixed REFUSAL ARGUMENTS. ELF inspection confirmed static AArch64 and no interpreter segment.
- **Covered boundaries:** Every variable ancestor/target root and all four leaves reject symlinks. Tests cover wrong UID/GID policy, directory/file mode, missing/oversized leaves, FIFO/directory/socket leaves, both marker mismatches before configs, exact caps and observed identity/metadata changes. Host ownership tests use real fstat against mismatched policy, not privileged chown.

ARM64 binary: reader-linux-arm64, 2489186 bytes, SHA256 03016b9c35aeecd82362fe34e4187037a7ee5ebf76014fd7df2f6264aca228d6. This is not device compatibility evidence.

## Device and ticket gates

The new reserved helper directory is /home/root/pi-ink-offline-reader-0029. Its vacancy is required but unobserved. Exclusive descriptor-safe staging must refuse any existing object. Helper staging, one guarded invocation and helper-only removal need NEW exact owner approval. A proven safe staging/removal executor and identity-preserving execution handoff remain missing prerequisites. The frozen transport/argv contract is not permission to run a naked pathname command.

Both actual device config hashes remain absent. No irreversible final cleanup program was built. Preserve opaque state, interrupted state temporaries, ownership markers, unknown files, source, documents and all earlier evidence. Partial implementation0026 remains open and is not finalized. No restart, fallback, retry, general inventory or private config value retrieval is permitted.

## Receipt and review history

[Parent start-0028](../events/start-0028.yaml) reserves this child result. [Blocked phase-result implementation-0029](../events/implementation-0029.yaml) records slice_status completed and device_execution false. Parent independently verifies, owns integration/commits and reserved start-complete-0030; the child does not write that completion.

Source remains branch prototype/pi-ink-bridge-01-pen-prototype, commit bb5df500f4a06c61ebde6073470ef5ed51f4b006, tree 9a9acbfbc65d17f87eb44f2e0a7898000b1d735b. Only BASE workflow artifacts/views changed. No formal review verdict exists; no findings were declared resolved by a reviewer; merge/push/ticket completion were not performed.

- **Retained receipt:** [start-0001](../events/start-0001.yaml)
- **Retained receipt:** [start-complete-0003](../events/start-complete-0003.yaml)
- **Retained receipt:** [start-0004](../events/start-0004.yaml)
- **Retained receipt:** [implementation-0005](../events/implementation-0005.yaml)
- **Retained receipt:** [start-complete-0006](../events/start-complete-0006.yaml)
- **Retained receipt:** [start-0007](../events/start-0007.yaml)
- **Retained receipt:** [implementation-0008](../events/implementation-0008.yaml)
- **Retained receipt:** [start-complete-0009](../events/start-complete-0009.yaml)
- **Retained receipt:** [start-0010](../events/start-0010.yaml)
- **Retained receipt:** [implementation-0011](../events/implementation-0011.yaml)
- **Retained receipt:** [start-complete-0012](../events/start-complete-0012.yaml)
- **Retained receipt:** [start-0013](../events/start-0013.yaml)
- **Retained receipt:** [implementation-0014](../events/implementation-0014.yaml)
- **Retained receipt:** [start-complete-0015](../events/start-complete-0015.yaml)
- **Retained receipt:** [start-0016](../events/start-0016.yaml)
- **Retained receipt:** [implementation-0017](../events/implementation-0017.yaml)
- **Retained receipt:** [start-complete-0018](../events/start-complete-0018.yaml)
- **Retained receipt:** [start-0019](../events/start-0019.yaml)
- **Retained receipt:** [start-complete-0021](../events/start-complete-0021.yaml)
- **Retained receipt:** [start-0022](../events/start-0022.yaml)
- **Retained receipt:** [implementation-0023](../events/implementation-0023.yaml)
- **Retained receipt:** [start-complete-0024](../events/start-complete-0024.yaml)
- **Retained receipt:** [start-0025](../events/start-0025.yaml)
- **Retained receipt:** [start-0028](../events/start-0028.yaml)

[Exact session, store, scope and limit observations](../artifacts/evidence/offline-reader-0029/scope-observations.json) records the new child session identity. Earlier product implementation0023 was already reconciled by0024 and was not repeated.

## Historical projection retained verbatim

The following text is the earlier source-only projection, not current device authority. Its old quarantine/restoration claims are historical; consult retained0026 outcome evidence and the current gates above.

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


# Approved device transaction — implementation-0033

## Ticket and outcome
[Prove Paper Pro pen input](../../../tracker/tickets/pi-ink-bridge-01-pen-prototype.md) remains **BLOCKED**, with work_status claimed. The approved one-run device slice completed. No source changes, tests, rebuilds, restart, older cleanup, commit or integration occurred. Partial0026 remains open.

## Implementation and validation
The frozen launcher ran exactly once from BASE with a 120-second host tool timeout. It returned exit0 and DEPLOYMENT_COMPLETE. Its local result records both fixed config hash roles, transaction exit0, READER_EXIT_ZERO and HELPER_REMOVED_AND_DIRECTORY_EMPTY_REMOVED. Reader termination and removal of only the new helper and empty directory are proven by this transaction. No private config values were returned. No further device command ran.

## Changed artifacts and supporting evidence
- [Owner approval](../artifacts/evidence/device-digests-0033/approval.json)
- [Frozen plan](../artifacts/evidence/offline-deployment-0031/plan.json)
- [Actual outcome and exact command](../artifacts/evidence/device-digests-0033/execution-outcome.json)
- [Raw launcher stdout](../artifacts/evidence/device-digests-0033/launcher-stdout.txt) and [stderr](../artifacts/evidence/device-digests-0033/launcher-stderr.txt)
- [Raw transaction stdout](../artifacts/evidence/device-digests-0033/transaction-stdout.txt) and [stderr](../artifacts/evidence/device-digests-0033/transaction-stderr.txt)
- [Consumed attempt](../artifacts/evidence/offline-deployment-0031/execution-0031/attempt.json) and [actual result](../artifacts/evidence/offline-deployment-0031/execution-0031/result.json)
- [Parent start-0032](../events/start-0032.yaml) and [child result implementation-0033](../events/implementation-0033.yaml)
- [Confirmed trust boundary ADR0001](../../../docs/adr/0001-pi-ink-cleanup-trust-boundary.md)

## Review, findings and remaining boundary
Latest formal reviewer verdict: none. No review findings resolved by this device slice. ADR0001 supersedes the historical separate descriptor-safe deployment executor prerequisite, not the reader safeguards. Both actual hashes are now available; earlier text asserting absence is historical. Full native UI, associations, Send and cable-free quality-gate acceptance remain unproved. Older experiment cleanup is neither performed nor approved by this run. No retry or extra SSH is authorized. Parent owns result reconciliation and integration; no full-ticket completion or merge is claimed.

Source remains prototype/pi-ink-bridge-01-pen-prototype at bb5df500f4a06c61ebde6073470ef5ed51f4b006, tree 9a9acbfbc65d17f87eb44f2e0a7898000b1d735b. Fresh child session 01a1a634-48a1-7750-a713-cbe6fdf4b659, pane w6S:p2.


