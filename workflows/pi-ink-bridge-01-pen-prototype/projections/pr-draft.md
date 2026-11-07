# Ticket 01 completed and published

- Canonical ticket: **completed**, published at `11b08f949123176234aa91d7b992d17117342487`; [completion result](../artifacts/evidence/ticket-01-closeout-0115/ticket-completion-result.json).
- Build/version record and explicit retention amendment are complete. Tested firmware `3.28.0.172`, client `0.3.1`, and exact framework/native fingerprints are recorded in the [build ledger](../artifacts/evidence/ticket-01-closeout-0115/build-version-reconciliation.json).
- Independent review: **SUCCESS**, Standards 0 findings, Spec 0 findings. [Immutable review](../artifacts/reviews/review-review-0060.md); [review acceptance](../events/review-complete-0061.yaml).
- Reviewed source `e8ab1391eaab3481131f3c3dfa934b7d523c38db`; single-parent integration `493db79b27dc2cc08295752a510a6e4ed6b7952b`; exact code tree `83cce09d711a12b72607aa735296c04eebe96dbc`. The owner-approved same-tree repair is recorded in [finish-0064](../events/finish-0064.yaml).
- [Integrated checks](../artifacts/evidence/ticket-01-closeout-0115/integrated-validation.json) passed: build, TypeScript, 23 Bun tests and Go race. Actual repaired-commit local HTTP/PDF/PNG completion and independent cancellation passed. Native hardware/tool callback proof remains separate.
- [Publication](../events/finish-0066.yaml) and [published ticket completion](../events/finish-0067.yaml) verified. No remaining ticket01 acceptance items. Production tickets 02–10 remain outside this qualification.

## Resource retention and terminal receipt

The installed prototype/tripletap, private work/credentials, protected original source and all prior evidence remain retained. This is **not baseline restoration**.

The temporary source workspace `w6M` is closed. The named temporary checkout `closeout/pi-ink-bridge-01` is clean and kept: the cleanup helper refused removal even though Worktrunk reports `integrated / merge_adds_nothing`. No force or retry bypassed the guard. [Cleanup outcome](../artifacts/evidence/ticket-01-closeout-0115/source-cleanup-outcome.json).

[finish-0068](../events/finish-0068.yaml) is `FINISH_FAILED` **only for that administrative source-cleanup refusal**. It records `ticket_completed: true`, `pushed: true`, `workspace_closed: true`, and `worktree_removed: false`; it does not reopen the completed ticket or claim full workflow cleanup.

[Repository notices](../artifacts/evidence/ticket-01-closeout-0115/publication-notices.json): GitHub reports 3 dependency alerts (1 high, 2 moderate). The pre-existing hk pending-stash journal remains untouched. Neither was remediated by this prototype closeout.

Previous generated views follow. They are historical, not current status.

---

# Ticket 01 integration verified — publication pending

- Independent acceptance: **SUCCESS**, Standards 0 findings, Spec 0 findings. [Review](../artifacts/reviews/review-review-0060.md); [parent acceptance](../events/review-complete-0061.yaml).
- Reviewed source `e8ab1391eaab3481131f3c3dfa934b7d523c38db`; integrated commit `493db79b27dc2cc08295752a510a6e4ed6b7952b`; both use tree `83cce09d711a12b72607aa735296c04eebe96dbc`. Integration has sole parent `7228b781af08fdddb2868abcd20e2704aec7c7e9`.
- Worktrunk first fast-forwarded without squashing. [finish-0063](../events/finish-0063.yaml) records that mismatch. The owner approved same-tree unpublished-tip repair; [finish-0064](../events/finish-0064.yaml) records the corrected integration without any file/index change, second code merge, reset, stash or force-push. Reviewed source remains protected in its branch and scoped backup ref.
- [Integrated checks](../artifacts/evidence/ticket-01-closeout-0115/integrated-validation.json): build, TypeScript, 23 Bun tests and Go race passed. Actual repaired-commit HTTP/Python PNG completion and independent cancellation passed. [Runtime](../artifacts/evidence/ticket-01-closeout-0115/integrated-host-runtime-smoke.json). Hardware proof remains separate.
- Latest checkpoint: [finish-0065](../events/finish-0065.yaml). No push or ticket completion yet. Ticket remains claimed.
- Installed prototype/tripletap and all protected source, notebooks, credentials and evidence remain retained. This is not baseline restoration.

Previous generated views follow. They are history, not current status.

---

# Ticket 01 final source review — 2026-11-07

## Ticket and problem

Ticket: [pi-ink-bridge-01-pen-prototype](../../../tracker/tickets/pi-ink-bridge-01-pen-prototype.md). Prove the stock-editor native prototype and preserve the owner's retained installation. Production tickets 02–10 remain outside this gate.

## Current implementation

- Source: `e8ab1391eaab3481131f3c3dfa934b7d523c38db`; tree `83cce09d711a12b72607aa735296c04eebe96dbc`; branch `closeout/pi-ink-bridge-01`.
- Fixed base: `7228b781af08fdddb2868abcd20e2704aec7c7e9`. Upstream and the separately authorized Hister change are preserved. The original deployed `8cc3cb89` source worktree is untouched.
- Changed files and reconciliation: [implementation-0057](../events/implementation-0057.yaml), accepted by [start-complete-0058](../events/start-complete-0058.yaml).
- All 31 native files match the deployed source. The entire prototype payload matches the validated `e3ba4ade` candidate.

## Validation

- Parent-observed candidate checks: Go race, TypeScript and production build passed. After the required app build, Bun reported 23 pass and 0 fail. The first pre-build run failed because built app assets were absent; it is preserved, not relabelled a pass.
- Exact final-source runtime: actual local HTTP/Python PNG completion for A at 80×100; B remained pending, then cancelled without an image or change to A. Both servers closed. This is host proof, not a native tablet callback.
- Separate real native callback and owner evidence remain linked by the [acceptance matrix](../artifacts/evidence/ticket-01-closeout-0115/acceptance-matrix.json).
- Source/build mapping: [final-source-mapping](../artifacts/evidence/ticket-01-closeout-0115/final-source-mapping.json), [candidate validation](../artifacts/evidence/ticket-01-closeout-0115/candidate-validation.json), [final runtime](../artifacts/evidence/ticket-01-closeout-0115/final-host-runtime-smoke.json).

## Review history and findings

[review-0059](../events/review-0059.yaml) starts a fresh independent review with separate Standards and Spec sessions. Verdict: pending. No current SUCCESS or closure is claimed. Earlier advisory and failed attempts below remain historical.

## Merge and retention

No prototype integration or publication has occurred. Ticket remains claimed. Device retention is owner-approved, not baseline restoration. The [build record](../artifacts/evidence/ticket-01-closeout-0115/build-version-reconciliation.json) and [owned-only future maintenance/removal plan](../artifacts/evidence/ticket-01-closeout-0115/retained-maintenance-removal-plan.json) remain authoritative evidence. No further device operation or generic cleanup is authorized.

---

# Current prototype closeout — review pending

## Ticket summary

[Prove Paper Pro pen input](../../../tracker/tickets/pi-ink-bridge-01-pen-prototype.md) is a prototype gate, not production readiness. The canonical owner-approved end state retains the tested integration with protected work and documented recovery/removal.

## Problem and implementation

The normal stock editor now supplies real pen annotation; the native toolbar binds the current document to its trusted server/job and explicit Send returns the annotated source-sized PNG. No replacement drawing app is introduced. Current source is `8cc3cb89c7aa50ea0862a83763edc0a339d69eb9`, tree `25872168b7dff239a95e876827916b77c3b41001`.

## Changed files and validation

[Current implementation snapshot](../artifacts/snapshots/pr-draft-implementation-0052.md), [current source provenance](../artifacts/evidence/ticket-01-closeout-0115/source-reconciliation.json), and [old implementation record](../events/implementation-0049.yaml) enumerate cumulative source changes and retained validation. [Fresh installed build ledger](../artifacts/evidence/ticket-01-closeout-0115/build-version-reconciliation.json) pins client0.3.1, XOVI/AppLoad and exact QML/QMD/adapter identities. [Actual native Send](../artifacts/evidence/tablet-activation-0054/native-send-0101-outcome.json) and [terminal cancellation](../artifacts/evidence/tablet-activation-0054/native-terminal-cancellation-0112.json) are device/consumer proof, not protocol simulation. Parent will run one scoped integrated validation after independent review and merge.

## Review history and remaining work

No current formal verdict yet. Old advisory audits below are historical and do not authorize merge. [Acceptance matrix](../artifacts/evidence/ticket-01-closeout-0115/acceptance-matrix.json) maps all ten criteria to observed proof and approved retention. Production service/startup/pairing hardening/durable recovery/discovery/final acceptance belong to tickets02–10. Known limits include only tested firmware3.28.0.172, qualitative latency, one server, no positive native clipping-confirmation run, and required separate manual Go start after OS boot.

## Merge status

Not merged/pushed/completed by this closeout yet. Source-bound independent review, verified integration/publication and tracker completion are still required. [Owner retention and future removal plan](../artifacts/evidence/ticket-01-closeout-0115/retained-maintenance-removal-plan.json) preserve tripletap, data and the old LAN-proxy quarantine; no uninstall was performed.

## Current receipts

- [start-0051](../events/start-0051.yaml).
- [implementation-0052](../events/implementation-0052.yaml).
- [start-complete-0053](../events/start-complete-0053.yaml).

## Historical projection retained verbatim

# Integrated host recovery — implementation-0049

## Status and ticket

Host implementation and validation passed. The full ticket remains incomplete, with `work_status: claimed`. Hardware acceptance and production remain blocked. No device connection or operation ran.

[Canonical ticket](../../../tracker/tickets/pi-ink-bridge-01-pen-prototype.md) · [Parent start-0048](../events/start-0048.yaml) · [Implementation result](../events/implementation-0049.yaml).

## Problem and implementation

The retained stock-editor runtime and the later bootstrap client had separate entry points. Setup preconfigured credentials instead of providing app pairing. Observed import parents also appeared as folder ownership.

The existing discovery, coordinator and updater now share one `pi-ink-client` with explicit `serve`. New app pairing uses a setup-provisioned HTTPS identity and local desktop approval. Explicit native folder associations remain separate from document-parent provenance. Current-document UUID, request binding, Send, clipping consent, full PDF retention and cancellation reuse the retained implementation. The native manager and document foldout layout fixes remain intact. HTTP bootstrap exposes no authenticated job API.

Source commit: `ff7cb07414b2c907a1aeec24c1f14888cf1a959a`. Tree: `d0c1e3fddeef5295a869b9acd64601de78a470d6`. Branch: `prototype/pi-ink-bridge-01-pen-prototype`.

## Changed files

- **Source file:** `README.md`.
- **Source file:** `bun.lock`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/.gitignore`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/coordinator-discovery.ts`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/coordinator.ts`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/index.ts`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/package.json`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/scripts/provision-tablet.sh`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/build.sh`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/client_test.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/discovery.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/discovery_test.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/folders_test.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/go.mod`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/go.sum`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/install.sh`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/main.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/mdns.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/mdns_records.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/mdns_records_test.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/operations.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/pairing.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/runtime.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/state.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/stock.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/switch_test.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/transport.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/update.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/update_test.go`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-gateway.ts`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-qml/PiInkToolbar.qml`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-qml/activation-proposal.json`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-qml/pi-ink-bridge.qmd`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet/go.mod`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet/go.sum`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/test/coordinator-identity.test.ts`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/test/tablet-install.test.ts`.
- **Source file:** `mise/conf.d/devtools-omp/extensions/image-annotator/test/tablet-pairing.test.ts`.

Renames and exact source identities appear in [source identity](../artifacts/evidence/integrated-host-recovery-0046/source-identity-0049.json). No unrelated file was staged. The user's base-worktree `mise.toml` was not touched.

## Validation

- **Final checks:** Build, typecheck, 19 Bun tests with 142 assertions, Go race tests and Go vet passed. [Commands and logs](../artifacts/evidence/integrated-host-recovery-0046/checks-0049-r2.json). Build retains dependency-directive and large-chunk warnings.
- **Real data path:** The registered `image_editor`, compiled Go client, certificate-verified HTTPS/WSS and real PDF worker completed one source-sized marked PNG. Actual QML action JavaScript ran against simulated native Library events. [Runtime proof](../artifacts/evidence/integrated-host-recovery-0046/host-smoke-0049-r3.json).
- **Isolation checks:** Save/Close did not complete the request. Unassociated/closed documents, alternate server/request selection, switched confirmation and cancelled requests were refused. Clipping required explicit result-specific consent; the full PDF remained available.
- **Pixel checks:** The PNG is 800 × 1000. It has 35,923 changed pixels and 28,240 changed red-dominant pixels. All four retained 40 × 40 corner-marker regions match exactly. [Pixel result](../artifacts/evidence/integrated-host-recovery-0046/pixel-verification-0049-r3.json).
- **Native syntax:** The final component passes Qt AST parsing. Private native types, physical geometry and input were not instantiated. [Parser result](../artifacts/evidence/integrated-host-recovery-0046/qml-parse-0049-r3.json).
- **Simulation limits:** Stock HTTP, native Library events, browser launching and test-process exit were controlled host boundaries. The retained marked PDF was replayed. No new tablet drawing or cable-free integrated Send is proved.

The first pixel checker used outer page corners instead of the retained marker regions. A later smoke driver invoked Import before the preceding QML folder callback released `actionBusy`. Those failures and corrected checks remain recorded; see [dispositions](../artifacts/evidence/integrated-host-recovery-0046/review-dispositions-0049.json).

## Review history and findings

Two fresh read-only review sessions inspected the WIP source. Both panes closed after completion. These internal reviews are not a formal workflow SUCCESS verdict.

- **Standards axis:** [One finding](../artifacts/evidence/integrated-host-recovery-0046/standards-review-0049.json) identifies unauthenticated HTTP self-update. The requested development updater contract is retained. The runtime warning and documentation explicitly reject publisher-trust claims from discovery or adjacent checksums. This production security risk is not fixed or concealed.
- **Spec axis:** [One finding](../artifacts/evidence/integrated-host-recovery-0046/spec-review-0049.json) identified inferred folder ownership. It is corrected. `folders_test.go` fails against the preserved pre-fix source and passes in the final Go race suite.
- **Formal review:** None for this commit. Parent must arrange fresh review before integration. No merge, rebase, push or ticket completion occurred.

## Candidate and next approval boundary

[Activation proposal](../artifacts/evidence/integrated-host-recovery-0046/candidate-activation-0049-r3.json) · [Frozen payload](../artifacts/evidence/integrated-host-recovery-0046/candidate-payload-0049-r3.tar.gz).

Payload SHA256: `f3a7d6f0c54aa9f27fe46817d482d195e060d6e0c07cb15bf3c8eda0d66c760e`.

Installed ARM64 client SHA256: `713ea330666e51fd09c4bb30010277646932c1552cdb42ce63c143dac5292087`. Version `0.3.0`; one installed executable at `/home/root/pi-ink-client/pi-ink-client`. The production candidate contains no simulated boundary file or credentials.

Separate owner approval must cover the exact payload, trusted setup identity, cable installation/repair, synthetic document operations, saved/closed restart, loopback activation checks and explicit rollback. It must account for unknown existing device state and path collisions. Do not execute the proposal without that approval.

## Remaining acceptance and history

Real app pairing, native root-folder creation/visibility, import destination semantics, current-document/foldout behavior, integrated USB-disconnected Send and owner pen/palm/erase/undo/zoom/orientation/lifecycle verdict remain pending on firmware `3.28.0.172` only. Creating an associated folder does not automatically relocate an import. The parent UUID is labelled as observed at import, not as a live parent.

Cleanup0038 remains `STOPPED_POSSIBLE_PARTIAL_REMOVAL_PRESERVE_NO_RETRY`. Unknown device state, partial0026, all earlier receipts, source and evidence remain preserved. No old helper, process scan, process kill or cleanup retry ran.

Earlier source evidence remains authoritative within its original limits: [implementation-0023](../events/implementation-0023.yaml) and [implementation-0017](../events/implementation-0017.yaml). The failed launch before start-0048 is not implementation success.

## Retained historical projection

The following text is preserved history, not current device authority.

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




## Frozen cleanup attempt implementation-0038

Full ticket and production remain BLOCKED; work_status remains claimed. Cleanup slice failed.

The exact approved launcher ran once from BASE and exited 1. Its only recorded phase was host-check, exit 1, with `CLEANUP_REFUSAL OWNED_PROCESS_VISIBILITY`. Launcher stdout was `STOPPED_POSSIBLE_PARTIAL_REMOVAL_PRESERVE_NO_RETRY`; stderr was empty.

No removed or retained path rows were reported. No device transaction, helper staging/removal, or host apply phase was recorded. No deletion is recorded in this attempt. Existing process/helper and target state remain unobserved beyond this refusal. All manifest-scope removal remains unproven. No retry, repair, probe, process action, or source change followed. Partial0026 and all earlier history remain preserved.

Native pairing, folder associations, and explicit Send acceptance remain outside cleanup scope. No full cleanup or universal credential-erasure claim is made. Parent reconciliation and commits remain pending. Latest reviewer verdict remains unchanged (none); no review or merge occurred.

Evidence and receipts:

- [Parent start](../events/start-0037.yaml)
- [Phase result](../events/implementation-0038.yaml)
- [Owner approval](../artifacts/evidence/cleanup-run-0038/approval.json)
- [Actual outcome](../artifacts/evidence/cleanup-run-0038/execution-outcome.json)
- [Raw stdout](../artifacts/evidence/cleanup-run-0038/launcher-stdout.txt)
- [Raw stderr](../artifacts/evidence/cleanup-run-0038/launcher-stderr.txt)
- [Exact command and exit](../artifacts/evidence/cleanup-run-0038/launcher-exit.json)
- [Executor attempt](../artifacts/evidence/cleanup-executor-0036/execution-0036/attempt.json)
- [Executor result](../artifacts/evidence/cleanup-executor-0036/execution-0036/result.json)

Changed files: only the new execution/evidence records, implementation-0038 receipt, versioned draft snapshot, and generated manifest/projections. Source branch remains prototype/pi-ink-bridge-01-pen-prototype at bb5df500f4a06c61ebde6073470ef5ed51f4b006/tree9a9acbfbc65d17f87eb44f2e0a7898000b1d735b, as established by pre-execution inspection. No source mutation command ran.



### Host follow-up and remaining hardware gate — 2026-11-05

Parent reconciliation: [start-complete-0050](../events/start-complete-0050.yaml). Original integrated host source: `ff7cb07414b2c907a1aeec24c1f14888cf1a959a`. Current source: `19730eb0700cf48ea8f54e5d4b0e189d3c8349db`, tree `a5ce7c9bb7a7367dccfd0cf30a37013db73f5d07`.

- **Pairing recovery:** [Real HTTPS proof](../artifacts/evidence/integrated-host-recovery-0046/pairing-recovery-0052.json). Desktop rejection clears an unwanted pending request without ending the annotation. Regression failed before the fix; typecheck, 19 tests/151 assertions and the standalone HTTPS smoke passed afterward.
- **Current source audit:** [Independent Standards and Spec results](../artifacts/evidence/integrated-host-recovery-0046/pre-deployment-audit-0052.json). No new source blocker identified. The inherited unsigned HTTP updater remains a disclosed development limit. These are advisory results, not a formal workflow review verdict.
- **Device gate:** [Read-only preflight proposal](../artifacts/evidence/integrated-host-recovery-0046/device-preflight-0052.json) is not authorized or executed. Actual tablet pairing, native folder/current-document behavior, cable-free integrated Send, owner pen/geometry/lifecycle acceptance and final approved restoration/cleanup remain open.

The tablet payload remains unchanged at SHA-256 `f3a7d6f0c54aa9f27fe46817d482d195e060d6e0c07cb15bf3c8eda0d66c760e`. Source remains in the retained worktree, not merged or pushed. Ticket claimed; production blocked. No tablet access, screenshots, process scanner, old-session reuse or cleanup0038 retry.


### Read-only preflight stopped — no hardware gate passed

The owner approved one read-only preflight0052. It read OS VERSION_ID=5.8.203 and stopped before every hash/path check. The guard was incorrect: retained baseline metadata records OS VERSION_ID=5.8.203 and product IMG_VERSION=3.28.0.172. This is not evidence of a firmware upgrade. Current product firmware and path occupancy remain unverified.

[Original outcome](../artifacts/evidence/integrated-host-recovery-0046/device-preflight-0052-outcome.json) and [diagnosis](../artifacts/evidence/integrated-host-recovery-0046/device-preflight-0052-diagnosis.json) remain immutable. The corrected IMG_VERSION guard passes supported, unsupported and missing-field cases [offline](../artifacts/evidence/integrated-host-recovery-0046/device-preflight-0053-offline-verification.json). Its [new exact-script proposal](../artifacts/evidence/integrated-host-recovery-0046/device-preflight-0053.json) requires separate one-shot approval.

No device writes, uploads, document operations, restarts, screenshots, process scans or cleanup ran. The previous approval is consumed; no reconnect or automatic retry is authorized. Ticket claimed; hardware acceptance and production remain blocked.


### Corrected read-only preflight0053 passed

The separately approved one-shot preflight completed with exit0. Product IMG_VERSION is 3.28.0.172. The stock binary and hashtab hashes match the retained baseline. The existing client is a root-owned regular0700 file; its hash is recorded. All proposed new experiment/QMD/loopback paths are absent. The existing original webserver-remote.so file matches its retained hash; loaded state and listener bindings were not inspected.

[Observed outcome](../artifacts/evidence/integrated-host-recovery-0046/device-preflight-0053-outcome.json) and [bounded interpretation](../artifacts/evidence/integrated-host-recovery-0046/device-preflight-0053-interpretation.json) preserve the exact scope. No files were uploaded or changed, no document operation or restart ran, and cleanup0038 was not retried. This approval is consumed.

The next work is HOST-ONLY preparation of a hash-pinned staging/activation/restoration procedure and an actual originating OMP request with private setup trust. Device installation, saved/closed restarts, synthetic document operations and restoration still need separate exact approval. Native acceptance and production remain blocked.
