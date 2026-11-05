# Integrated host recovery — implementation-0049

## Status and ticket

Host implementation and validation passed. The full ticket remains incomplete, with `work_status: claimed`. Hardware acceptance and production remain blocked. No device connection or operation ran.

[Canonical ticket](../../../../tracker/tickets/pi-ink-bridge-01-pen-prototype.md) · [Parent start-0048](../../events/start-0048.yaml) · [Implementation result](../../events/implementation-0049.yaml).

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

Renames and exact source identities appear in [source identity](../evidence/integrated-host-recovery-0046/source-identity-0049.json). No unrelated file was staged. The user's base-worktree `mise.toml` was not touched.

## Validation

- **Final checks:** Build, typecheck, 19 Bun tests with 142 assertions, Go race tests and Go vet passed. [Commands and logs](../evidence/integrated-host-recovery-0046/checks-0049-r2.json). Build retains dependency-directive and large-chunk warnings.
- **Real data path:** The registered `image_editor`, compiled Go client, certificate-verified HTTPS/WSS and real PDF worker completed one source-sized marked PNG. Actual QML action JavaScript ran against simulated native Library events. [Runtime proof](../evidence/integrated-host-recovery-0046/host-smoke-0049-r3.json).
- **Isolation checks:** Save/Close did not complete the request. Unassociated/closed documents, alternate server/request selection, switched confirmation and cancelled requests were refused. Clipping required explicit result-specific consent; the full PDF remained available.
- **Pixel checks:** The PNG is 800 × 1000. It has 35,923 changed pixels and 28,240 changed red-dominant pixels. All four retained 40 × 40 corner-marker regions match exactly. [Pixel result](../evidence/integrated-host-recovery-0046/pixel-verification-0049-r3.json).
- **Native syntax:** The final component passes Qt AST parsing. Private native types, physical geometry and input were not instantiated. [Parser result](../evidence/integrated-host-recovery-0046/qml-parse-0049-r3.json).
- **Simulation limits:** Stock HTTP, native Library events, browser launching and test-process exit were controlled host boundaries. The retained marked PDF was replayed. No new tablet drawing or cable-free integrated Send is proved.

The first pixel checker used outer page corners instead of the retained marker regions. A later smoke driver invoked Import before the preceding QML folder callback released `actionBusy`. Those failures and corrected checks remain recorded; see [dispositions](../evidence/integrated-host-recovery-0046/review-dispositions-0049.json).

## Review history and findings

Two fresh read-only review sessions inspected the WIP source. Both panes closed after completion. These internal reviews are not a formal workflow SUCCESS verdict.

- **Standards axis:** [One finding](../evidence/integrated-host-recovery-0046/standards-review-0049.json) identifies unauthenticated HTTP self-update. The requested development updater contract is retained. The runtime warning and documentation explicitly reject publisher-trust claims from discovery or adjacent checksums. This production security risk is not fixed or concealed.
- **Spec axis:** [One finding](../evidence/integrated-host-recovery-0046/spec-review-0049.json) identified inferred folder ownership. It is corrected. `folders_test.go` fails against the preserved pre-fix source and passes in the final Go race suite.
- **Formal review:** None for this commit. Parent must arrange fresh review before integration. No merge, rebase, push or ticket completion occurred.

## Candidate and next approval boundary

[Activation proposal](../evidence/integrated-host-recovery-0046/candidate-activation-0049-r3.json) · [Frozen payload](../evidence/integrated-host-recovery-0046/candidate-payload-0049-r3.tar.gz).

Payload SHA256: `f3a7d6f0c54aa9f27fe46817d482d195e060d6e0c07cb15bf3c8eda0d66c760e`.

Installed ARM64 client SHA256: `713ea330666e51fd09c4bb30010277646932c1552cdb42ce63c143dac5292087`. Version `0.3.0`; one installed executable at `/home/root/pi-ink-client/pi-ink-client`. The production candidate contains no simulated boundary file or credentials.

Separate owner approval must cover the exact payload, trusted setup identity, cable installation/repair, synthetic document operations, saved/closed restart, loopback activation checks and explicit rollback. It must account for unknown existing device state and path collisions. Do not execute the proposal without that approval.

## Remaining acceptance and history

Real app pairing, native root-folder creation/visibility, import destination semantics, current-document/foldout behavior, integrated USB-disconnected Send and owner pen/palm/erase/undo/zoom/orientation/lifecycle verdict remain pending on firmware `3.28.0.172` only. Creating an associated folder does not automatically relocate an import. The parent UUID is labelled as observed at import, not as a live parent.

Cleanup0038 remains `STOPPED_POSSIBLE_PARTIAL_REMOVAL_PRESERVE_NO_RETRY`. Unknown device state, partial0026, all earlier receipts, source and evidence remain preserved. No old helper, process scan, process kill or cleanup retry ran.

Earlier source evidence remains authoritative within its original limits: [implementation-0023](../../events/implementation-0023.yaml) and [implementation-0017](../../events/implementation-0017.yaml). The failed launch before start-0048 is not implementation success.
