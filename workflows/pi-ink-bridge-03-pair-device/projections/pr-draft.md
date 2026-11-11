---
title: Pairing recovery attempt 3
type: Concept
---

# Pairing recovery attempt 3

Prepare host-only metadata recovery and an offline upgrade decision. Date: 2026-11-09. Reader: parent coordinator and tablet owner.

## Overview

Ticket [pi-ink-bridge-03-pair-device](../../../tracker/tickets/pi-ink-bridge-03-pair-device.md) remains claimed and IMPLEMENTING/blocked. Preserved code-bearing implementation c8684bc956cc99896884fe1c05dcb97f4ba7f97e. Verified unchanged 0.5.0 payload pins; prepared owner-gated offline manual upgrade and acceptance proposal. No product code, tablet operation, old experiment cleanup, base checkout mutation, review, merge, push or completion.

The service and production AppLoad client need real-device acceptance before review readiness. The [offline upgrade proposal](../artifacts/snapshots/offline-upgrade-implementation-0008.json) specifies payload pins, preservation, guarded launcher replacement, approval gates, rollback and acceptance. It is not execution approval or a runnable device script.

Contents: [Inspect history](#inspect-history), [Preserve the implementation](#preserve-the-implementation), [Identify changed files](#identify-changed-files), [Check host evidence](#check-host-evidence), [Resolve blockers](#resolve-blockers), [Retain review and merge limits](#retain-review-and-merge-limits).

## Inspect history

Generated from all canonical event bytes, not copied base projections. Parent inspection from the surviving base validates the preserved receipt graph. No immutable receipt was rewritten or supplemented.

- **start-0001:** [start started](../events/start-0001.json); parent none.
- **implementation-0002:** [implementation blocked](../events/implementation-0002.yaml); parent start-0001.
- **start-complete-0003:** [start blocked](../events/start-complete-0003.json); parent implementation-0002.
- **start-publication-0004:** [start blocked](../events/start-publication-0004.json); parent start-complete-0003.
- **start-0005:** [start started](../events/start-0005.json); parent start-publication-0004.
- **start-complete-0006:** [start blocked](../events/start-complete-0006.json); parent start-0005.
- **start-0007:** [start started](../events/start-0007.json); parent start-complete-0006.
- **implementation-0008:** [Current blocked result](../events/implementation-0008.yaml), parent start-0007; final metadata commit/tree and actual publication are recorded there.

Attempt 1 supplied host implementation and blocked native acceptance. Parent 0003 reconciled it; 0004 records failed dirty-base metadata publication and verified restoration. Attempt 2 failed before child creation; 0005/0006 preserve that failure. Attempt 3 uses a fresh pane after the parent-owned launcher fix.

## Preserve the implementation

Implemented all reachable host service and production AppLoad pairing behavior: installed-trust manual address/fingerprint verification, verified HTTPS, bounded onboarding, matching code and explicit desktop approval, protected PNG access checks, persistent hashed/revocable credentials, active WebSocket revocation, protocol negotiation, and loopback management protections. Built ARM64 release 0.5.0. Actual Connections.qml and compiled production backend passed host-emulated AppLoad transport plus real HTTPS/WSS and browser-form smoke. Native Paper Pro acceptance is not complete and no completion is claimed.

Code-bearing commit: `c8684bc956cc99896884fe1c05dcb97f4ba7f97e`; tree: `8898c39e90234d5b3134f32b8fb41e9198ab9c10`. Initial metadata HEAD: `35bcd03f3be95396a7e7893801a9d50631e35e86`; tree: `89f7993fa8a5085bd43d46db72a9a6401151f939`. Recovery changes only workflow metadata. The result records final exact HEAD separately; generated status intentionally identifies tested code, not its own containing metadata commit.

## Identify changed files

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

- **Recovery metadata:** `workflows/pi-ink-bridge-03-pair-device/artifacts/snapshots/offline-upgrade-implementation-0008.json`.
- **Recovery metadata:** `workflows/pi-ink-bridge-03-pair-device/artifacts/snapshots/pr-draft-implementation-0008.md`.
- **Recovery metadata:** `workflows/pi-ink-bridge-03-pair-device/projections/pr-draft.md`.
- **Recovery metadata:** `workflows/pi-ink-bridge-03-pair-device/projections/implementation-log.md`.
- **Recovery metadata:** `workflows/pi-ink-bridge-03-pair-device/projections/latest-status.yaml`.
- **Recovery metadata:** `workflows/pi-ink-bridge-03-pair-device/manifest.yaml`.

Six existing uncommitted receipts were scoped at entry and preserved byte-for-byte: implementation-0002, start-complete-0003, start-publication-0004, start-0005, start-complete-0006, start-0007. The current result remains uncommitted after final HEAD capture.

## Check host evidence

- **Recovery check:** `sha256sum tablet-client/dist/client.zip tablet-client/production-install.sh` — PASS: ZIP 8468df658f658820bbf6f31e6b8c0d683a67109a5998a86467c959ca803d8962; installer b5baa9d881b6693496cb622c29c96e0408c878b27a5197c04ac8882956686eae. No rebuild.
- **Recovery check:** `Offline archive/member/ELF/source-manifest smoke (Eval)` — PASS: exactly six safe regular members; VERSION 0.5.0; ELF AArch64; manifest, backend entry and sidebar match source; member hashes in proposal.
- **Recovery check:** `mise exec -- go run . install-client --help` — Flags observed: archive-sha256, source, server; exits 1 with flag: help requested. Help-only; no installation. No upgrade/replace flag.
- **Recovery check:** `worktree scripts/inspect.ts tracker/tickets/pi-ink-bridge-03-pair-device.md --json` — BLOCKED: Missing receipt parent: start-publication-0004; raw seven-event graph has every parent. Preserved discrepancy; no fabricated repair.
- **Recovery check:** `Fresh launcher live smoke` — Fresh session 01a1bf39-e896-72e4-9188-e31e3b1f44d1 executing successfully in pane w72:p4; no prior session resumed.

[Existing host verification](../artifacts/evidence/host-pairing-0002/verification.json) remains consumed evidence, not new execution.

- **Consumed, not rerun:** `mise exec -- bun test` — passed: 34 tests, 284 assertions, zero failures.
- **Consumed, not rerun:** `mise exec -- go test -race ./...` — passed; production AppLoad backend exercised against real Bun service, HTTPS and WebSockets.
- **Consumed, not rerun:** `mise exec -- bun run typecheck` — passed.
- **Consumed, not rerun:** `mise exec -- bun run build` — passed; ARM64 client ZIP and browser bundle built; existing dependency directive/chunk warnings remain.
- **Consumed, not rerun:** `mise exec -- go test -race -run TestProductionAppLoadPairing -v` — passed; protected PNG SHA-256 8fc5a10f2a577810e1552a07c378954d6be3a11b20d33b669d70c2e96963aeaa.
- **Consumed, not rerun:** `host compiled pi-ink-client appload + Qt 6.8.3 Connections.qml + browser management forms` — passed: manual fingerprint/address verification; matching code 219590; approval; real PNG display; active WebSocket revocation observed; native AppLoad transport host-emulated only.
- **Consumed, not rerun:** `mise exec -- mq --allow-http-import -I raw -F json 'import "github.com/harehare/okf.mq" | okf::okf_parse(.) | okf::okf_validate(.)' <snapshot> <pr-draft> <implementation-log>` — passed: each generated document returned [] validation errors; workflow is not an OKF bundle so bundle checking is not applicable..
- **Consumed, not rerun:** `sha256sum tablet-client/dist/client.zip tablet-client/production-install.sh` — client ZIP 8468df658f658820bbf6f31e6b8c0d683a67109a5998a86467c959ca803d8962; installer b5baa9d881b6693496cb622c29c96e0408c878b27a5197c04ac8882956686eae.

[Prior immutable snapshot](../artifacts/snapshots/pr-draft-implementation-0002.md) retains original host screenshots, corrections and acceptance limits. No new hardware evidence run exists. This workflow is not an OKF bundle; validate generated documents individually.

## Resolve blockers

- **Open prerequisite:** Native Paper Pro 0.5.0 acceptance remains unverified. No device access authorized.
- **Open prerequisite:** Owner must approve bounded preflight, exact live-bound upgrade/rollback manifest, separate restart and native acceptance.
- **Open prerequisite:** Surviving-base parent inspection validates all receipt parents without rewriting historical records. The source-worktree inspection discrepancy is resolved for canonical recovery.

Existing installer rejects occupied launcher links for another release. Do not use generic reinstallation or delete links. The proposal uses private verified staging, intact old release, two guarded same-filesystem link renames and an explicitly non-atomic pair. Parent must freeze live identities before owner approval. Historical firmware/release data is not live preflight.

## Retain review and merge limits

Review history: none for this ticket. Latest reviewer verdict: null. Resolved independent findings: none. Remaining persisted reviewer findings: none; acceptance blockers above are not a review verdict. Merge status: not merged, not pushed. No ticket completion or worktree removal. Parent owns history disposition, publication to base, review and orchestration.



## Parent reconciliation

[Parent completion start-complete-0009](../events/start-complete-0009.json) validates the delivered result, unchanged historical receipt hashes, pinned payload and metadata-only source 257d121e. The child pane closed. Metadata commit passed normal hooks in the isolated worktree. No tablet access, remote push, review or merge occurred. Native acceptance still requires the owner approval gates in the offline upgrade proposal.

The launcher readiness fix passed 11 regression tests and an actual fresh launch. Its applied base-checkout changes and new parent receipts remain uncommitted; the known dirty-base hk failure was not retried or bypassed.

## Review deployment checkpoint 0022

Not ready for independent review: native Paper Pro 0.5 acceptance remains unverified. The preserved tracked implementation is unchanged; only workflow records are untracked in its source workspace.

The approved observation completed successfully. Read [current receipt 0022](../events/start-upgrade-proposal-0022.json), the [frozen deployment proposal](../artifacts/evidence/upgrade-proposal-0022/proposal.json), and [latest status](latest-status.yaml) for the current blockers; earlier blocker notes above are historical. The proposal separates the desktop refresh, tablet mutation/UI cycle and bounded prelaunch rollback approvals. No deployment has run.

Native acceptance must still prove fingerprint/code comparison, explicit local approval, protected HTTPS image/WSS access, restart persistence and revocation against the actual service and tablet. Host fixtures and QML emulator images do not satisfy that gate.

## Resolve staging checkpoint 0025

[Deployment outcome 0024](../events/start-deployment-blocked-0024.json): desktop refresh succeeded with unchanged server/TLS/private identity and verified HTTPS protocol 1. Do not repeat that completed deployment. Tablet staging SSH reset before completion proof; persistent stage/release state is unknown. No UI stop, live-link cutover, UI start or retry was requested.

[Recovery proposal 0025](../artifacts/evidence/stage-recovery-proposal-0025/proposal.json) requires explicit read-only reconciliation scope or conditional compact framed-input continuation. It checks lingering stage execution without returning command-line values, reconciles a proved complete owned stage, and never repeats unknown/partial/foreign work. The staging program bytes remain unchanged; only transport is proposed to change. No further device connection has run. Native and browser acceptance remain unverified.

## Resolve portable staging checkpoint 0028

[Read-only outcome 0027](../events/start-stage-recovery-blocked-0027.json) proved the tablet untouched: no stage/target/backup, no lingering staging shell, and intact original public/private/launcher/UI pins. The unavailable base64 capability blocked all continuation. No staging retry or UI cycle ran.

[Portable proposal 0028](../artifacts/evidence/portable-stage-proposal-0028/proposal.json) carries identical staging code and raw ZIP through bounded POSIX printf frames. Five local shell cases passed; no decoder/package installation is needed. It requires a fresh read-only capability/ownership gate and explicit continuation approval. The completed desktop refresh must not be repeated. Upstream [Dropbear 2025.88 command limits](https://github.com/mkj/dropbear/blob/DROPBEAR_2025.88/src/sysoptions.h#L84) support compact exec requests; vendor compiled limits were not inspected.

## New-boot reconciliation checkpoint 0031

[Outcome 0030](../events/start-portable-stage-blocked-0030.json): portable staging completed exactly once, with immutable release hash verification and the completed desktop generation still ready. Cutover SSH closed before completion. The approved recovery refused `STOP=boot_changed`; neither new nor old UI start was attempted. Live launcher, backup and UI persistence remain unknown. No cutover retry or further device call ran.

[Proposal 0031](../artifacts/evidence/boot-reconciliation-proposal-0031/proposal.json) requests one bounded read-only new-boot/transaction/status snapshot. It permits no upload, file write, service action, rollback, cleanup or credential access beyond metadata/hash checks. The boot-change cause is not established.
