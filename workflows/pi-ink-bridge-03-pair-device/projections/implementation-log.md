---
title: Pairing recovery attempt 3
type: Concept
---

# Pairing implementation history

Retain implementation and recovery provenance. Date: 2026-11-09. Reader: parent coordinator.

## Preserve phase history

- **start-0001:** [start started](../events/start-0001.json); parent none.
- **implementation-0002:** [implementation blocked](../events/implementation-0002.yaml); parent start-0001.
- **start-complete-0003:** [start blocked](../events/start-complete-0003.json); parent implementation-0002.
- **start-publication-0004:** [start blocked](../events/start-publication-0004.json); parent start-complete-0003.
- **start-0005:** [start started](../events/start-0005.json); parent start-publication-0004.
- **start-complete-0006:** [start blocked](../events/start-complete-0006.json); parent start-0005.
- **start-0007:** [start started](../events/start-0007.json); parent start-complete-0006.
- **implementation-0008:** [Attempt 3 blocked result](../events/implementation-0008.yaml); host-only proposal, metadata recovery, no product changes.

## Compare changed files

Attempt 1 product changes:

- **Prior product file:** `README.md`.
- **Prior product file:** `mise/conf.d/devtools-omp/extensions/image-annotator/device-pairing.ts`.
- **Prior product file:** `mise/conf.d/devtools-omp/extensions/image-annotator/installation-client.ts`.
- **Prior product file:** `mise/conf.d/devtools-omp/extensions/image-annotator/installation-service.ts`.
- **Prior product file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-appload/Connections.qml`.
- **Prior product file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/appload.go`.
- **Prior product file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/appload_pairing.go`.
- **Prior product file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/appload_pairing_test.go`.
- **Prior product file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/appload_test.go`.
- **Prior product file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/build.sh`.
- **Prior product file:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/state.go`.
- **Prior product file:** `mise/conf.d/devtools-omp/extensions/image-annotator/test/device-pairing.test.ts`.

Attempt 2: no child or source change. Attempt 3 workflow changes:

- **Recovery metadata:** `workflows/pi-ink-bridge-03-pair-device/artifacts/snapshots/offline-upgrade-implementation-0008.json`.
- **Recovery metadata:** `workflows/pi-ink-bridge-03-pair-device/artifacts/snapshots/pr-draft-implementation-0008.md`.
- **Recovery metadata:** `workflows/pi-ink-bridge-03-pair-device/projections/pr-draft.md`.
- **Recovery metadata:** `workflows/pi-ink-bridge-03-pair-device/projections/implementation-log.md`.
- **Recovery metadata:** `workflows/pi-ink-bridge-03-pair-device/projections/latest-status.yaml`.
- **Recovery metadata:** `workflows/pi-ink-bridge-03-pair-device/manifest.yaml`.

## Check validation by phase

Attempt 1 consumed evidence, not rerun:

- **Consumed, not rerun:** `mise exec -- bun test` — passed: 34 tests, 284 assertions, zero failures.
- **Consumed, not rerun:** `mise exec -- go test -race ./...` — passed; production AppLoad backend exercised against real Bun service, HTTPS and WebSockets.
- **Consumed, not rerun:** `mise exec -- bun run typecheck` — passed.
- **Consumed, not rerun:** `mise exec -- bun run build` — passed; ARM64 client ZIP and browser bundle built; existing dependency directive/chunk warnings remain.
- **Consumed, not rerun:** `mise exec -- go test -race -run TestProductionAppLoadPairing -v` — passed; protected PNG SHA-256 8fc5a10f2a577810e1552a07c378954d6be3a11b20d33b669d70c2e96963aeaa.
- **Consumed, not rerun:** `host compiled pi-ink-client appload + Qt 6.8.3 Connections.qml + browser management forms` — passed: manual fingerprint/address verification; matching code 219590; approval; real PNG display; active WebSocket revocation observed; native AppLoad transport host-emulated only.
- **Consumed, not rerun:** `mise exec -- mq --allow-http-import -I raw -F json 'import "github.com/harehare/okf.mq" | okf::okf_parse(.) | okf::okf_validate(.)' <snapshot> <pr-draft> <implementation-log>` — passed: each generated document returned [] validation errors; workflow is not an OKF bundle so bundle checking is not applicable..
- **Consumed, not rerun:** `sha256sum tablet-client/dist/client.zip tablet-client/production-install.sh` — client ZIP 8468df658f658820bbf6f31e6b8c0d683a67109a5998a86467c959ca803d8962; installer b5baa9d881b6693496cb622c29c96e0408c878b27a5197c04ac8882956686eae.

Attempt 2: parent 0006 records two rejected launches and no child. Attempt 3:

- **Recovery check:** `sha256sum tablet-client/dist/client.zip tablet-client/production-install.sh` — PASS: ZIP 8468df658f658820bbf6f31e6b8c0d683a67109a5998a86467c959ca803d8962; installer b5baa9d881b6693496cb622c29c96e0408c878b27a5197c04ac8882956686eae. No rebuild.
- **Recovery check:** `Offline archive/member/ELF/source-manifest smoke (Eval)` — PASS: exactly six safe regular members; VERSION 0.5.0; ELF AArch64; manifest, backend entry and sidebar match source; member hashes in proposal.
- **Recovery check:** `mise exec -- go run . install-client --help` — Flags observed: archive-sha256, source, server; exits 1 with flag: help requested. Help-only; no installation. No upgrade/replace flag.
- **Recovery check:** `worktree scripts/inspect.ts tracker/tickets/pi-ink-bridge-03-pair-device.md --json` — BLOCKED: Missing receipt parent: start-publication-0004; raw seven-event graph has every parent. Preserved discrepancy; no fabricated repair.
- **Recovery check:** `Fresh launcher live smoke` — Fresh session 01a1bf39-e896-72e4-9188-e31e3b1f44d1 executing successfully in pane w72:p4; no prior session resumed.

## Resolve open questions

- **Open prerequisite:** Native Paper Pro 0.5.0 acceptance remains unverified. No device access authorized.
- **Open prerequisite:** Owner must approve bounded preflight, exact live-bound upgrade/rollback manifest, separate restart and native acceptance.
- **Open prerequisite:** Surviving-base parent inspection validates all receipt parents without rewriting historical records. The source-worktree inspection discrepancy is resolved for canonical recovery.

Use [offline upgrade proposal](../artifacts/snapshots/offline-upgrade-implementation-0008.json). Preserve [prior snapshot](../artifacts/snapshots/pr-draft-implementation-0002.md) and [host verification](../artifacts/evidence/host-pairing-0002/verification.json). Ticket remains claimed; no review, merge or push.



## Parent reconciliation

[Parent completion start-complete-0009](../events/start-complete-0009.json) validates the delivered result, unchanged historical receipt hashes, pinned payload and metadata-only source 257d121e. The child pane closed. Metadata commit passed normal hooks in the isolated worktree. No tablet access, remote push, review or merge occurred. Native acceptance still requires the owner approval gates in the offline upgrade proposal.

The launcher readiness fix passed 11 regression tests and an actual fresh launch. Its applied base-checkout changes and new parent receipts remain uncommitted; the known dirty-base hk failure was not retried or bypassed.

## Track observation and upgrade preparation through 0022

- [Receipt 0019](../events/start-input-ref-repair-0019.json) records the authorized checksum-bound input-reference supplement. Original receipt 0018 bytes remain unchanged; ten inspector regression tests passed.
- [Receipt 0021](../events/start-runtime-layout-0021.json) records the two approved runtime/private-layout observations. Production backend ownership, fixed private paths and server identity were verified. Config/CA remain root 0600; state is absent. The exact new metadata reader was removed. No service was changed.
- [Receipt 0022](../events/start-upgrade-proposal-0022.json) freezes the [guarded deployment proposal](../artifacts/evidence/upgrade-proposal-0022/proposal.json). Owned real-supervisor and filesystem guard/rollback smoke checks passed. The actual desktop daemon, tablet launchers and UI are unchanged.
- Await separate desktop refresh, saved-documents tablet scope and conditional prelaunch recovery approvals. Full tablet cutover requires the intended desktop runtime and verified protocol first. No native 0.5 pairing, persistence or revocation acceptance is claimed.
- Base tooling and workflow publication remain local/uncommitted; no failed base commit or hook bypass was retried. Earlier reconciliation notes above are historical.

## Resolve staging checkpoint 0025

[Deployment outcome 0024](../events/start-deployment-blocked-0024.json): desktop refresh succeeded with unchanged server/TLS/private identity and verified HTTPS protocol 1. Do not repeat that completed deployment. Tablet staging SSH reset before completion proof; persistent stage/release state is unknown. No UI stop, live-link cutover, UI start or retry was requested.

[Recovery proposal 0025](../artifacts/evidence/stage-recovery-proposal-0025/proposal.json) requires explicit read-only reconciliation scope or conditional compact framed-input continuation. It checks lingering stage execution without returning command-line values, reconciles a proved complete owned stage, and never repeats unknown/partial/foreign work. The staging program bytes remain unchanged; only transport is proposed to change. No further device connection has run. Native and browser acceptance remain unverified.

## Resolve portable staging checkpoint 0028

[Read-only outcome 0027](../events/start-stage-recovery-blocked-0027.json) proved the tablet untouched: no stage/target/backup, no lingering staging shell, and intact original public/private/launcher/UI pins. The unavailable base64 capability blocked all continuation. No staging retry or UI cycle ran.

[Portable proposal 0028](../artifacts/evidence/portable-stage-proposal-0028/proposal.json) carries identical staging code and raw ZIP through bounded POSIX printf frames. Five local shell cases passed; no decoder/package installation is needed. It requires a fresh read-only capability/ownership gate and explicit continuation approval. The completed desktop refresh must not be repeated. Upstream [Dropbear 2025.88 command limits](https://github.com/mkj/dropbear/blob/DROPBEAR_2025.88/src/sysoptions.h#L84) support compact exec requests; vendor compiled limits were not inspected.

## New-boot reconciliation checkpoint 0031

[Outcome 0030](../events/start-portable-stage-blocked-0030.json): portable staging completed exactly once, with immutable release hash verification and the completed desktop generation still ready. Cutover SSH closed before completion. The approved recovery refused `STOP=boot_changed`; neither new nor old UI start was attempted. Live launcher, backup and UI persistence remain unknown. No cutover retry or further device call ran.

[Proposal 0031](../artifacts/evidence/boot-reconciliation-proposal-0031/proposal.json) requests one bounded read-only new-boot/transaction/status snapshot. It permits no upload, file write, service action, rollback, cleanup or credential access beyond metadata/hash checks. The boot-change cause is not established.
