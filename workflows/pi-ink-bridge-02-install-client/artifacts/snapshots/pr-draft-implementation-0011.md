---
title: Pi Ink renewed cable preflight
type: Report
---

# Install and launch the tablet client

## Ticket summary

`tracker/tickets/pi-ink-bridge-02-install-client.md` remains claimed. Attempt 4 completed the renewed read-only cable observation, not native acceptance.

## Problem statement

The corrected firmware guard required a fresh current stock/dependency hash and named-path preflight. Native compatibility must be established before installation.

## Implementation summary

The single bounded SSH command passed with the existing strict host key. The device reports reMarkable Ferrari, aarch64, IMG_VERSION="3.28.0.172" and VERSION_ID=5.8.203. The corrected IMG_VERSION guard accepts this identity.

All four current binary hashes match retained baseline evidence. The three named installation targets are absent. Their checked parent directories are root-owned directories, not symlinks. Required home, AppLoad and rebuilder directories are writable.

Native dependency semantic/build versions and production AppLoad launcher/backend/QMD compatibility remain unknown. Prior evidence explicitly says semantic versions were not queried and AppLoad UI was not used. Matching hashes do not fill that gap. No additional tablet action occurred.

Exact inspected commit: `35e8dd62b6787101e79732208e933e37d18e204b`. Tree: `6f0c2fb45e8f2c4736768808de24c2b78ff2ee32`. Host correction remains `765593a9a36fdbf097d67bb3a41d613038150268636616447b9244b87c17578f` (installer SHA-256); client ZIP remains `03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629` per retained verification. No host tests or builds were rerun.

## Changed files

Only workflow records changed. Source, tracker, installer guard and all prior immutable records are unchanged.

- `workflows/pi-ink-bridge-02-install-client/events/implementation-0011.json`
- `workflows/pi-ink-bridge-02-install-client/artifacts/snapshots/pr-draft-implementation-0011.md`
- `workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-preflight-0010/cable-preflight.json`
- `workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-preflight-0010/compatibility-analysis.json`
- `workflows/pi-ink-bridge-02-install-client/manifest.yaml`
- `workflows/pi-ink-bridge-02-install-client/projections/pr-draft.md`
- `workflows/pi-ink-bridge-02-install-client/projections/implementation-log.md`
- `workflows/pi-ink-bridge-02-install-client/projections/latest-status.yaml`
- `workflows/pi-ink-bridge-02-install-client/events/start-0010.json`

## Validation results

- Existing known-host lookup: exit 0. StrictHostKeyChecking=yes remained enforced.
- One SSH command: exit 0, empty stderr, METADATA_COMPLETE; 25-second host deadline, 8-second connect timeout, one connection attempt, no connection reuse or forwards.
- Stock, XOVI, AppLoad and qt-resource-rebuilder hashes match the retained baseline.
- Named targets: `/home/root/.local/share/pi-ink-bridge`, `/home/root/xovi/exthome/appload/pi-annotations`, and `/home/root/xovi/exthome/qt-resource-rebuilder/pi-annotations.qmd` are absent.
- Native version/production compatibility: unknown, not passed.
- No native binary execution, helper transfer/execution, device writes, installation, restart, private record content access or desktop listener access occurred.

## Review history

No independent review has run. All previous implementation attempts remain blocked; their validation is retained, not rerun.

## Resolved findings

Current firmware, stock/native byte identities and named-target collision metadata are now observed. The earlier host firmware-field correction remains unchanged.

## Remaining findings

- Static publisher/build version or source revision mapping for each current native binary hash.
- Compatibility evidence for net.asivery.AppLoad 1.0, AppLoadLauncher.launchApplication, manifest loadsBackend/entry and backend SOCK_SEQPACKET protocol with these exact binaries.
- Production sidebar.qmd compatibility with current native rebuilder and retained patch context; prior prototype QMD checks cover different patches.
- Installation, separately approved restart with saved/closed confirmation, post-restart launch and repeat-install preservation remain untested.
- Desktop protocol-1 listener on port 47840 remains untouched.

## Latest reviewer verdict

None.

## Merge status

Not merged or pushed. Current pane w6R:p2 remains open for parent durable-result validation and closure.

## Receipt history

- [start-0001](../../events/start-0001.json): start / phase-start / started; source `155e01d9a88d0b2a4bff539d1685f637a4ccc3ad`, tree `74872d499498a25af7a95b67d849d2acec021216`.
- [implementation-0002](../../events/implementation-0002.json): implementation / phase-result / blocked; source `82edbf73a1cc78d61079be62fa97d98eff445ecd`, tree `9824944411da9971edcb5d12a98b24f67064bd67`.
- [start-complete-0003](../../events/start-complete-0003.json): start / phase-complete / blocked; source `6d45cd8c4d63c394a1f0cbacec62a1a67e0d235d`, tree `af615daebe9c5d603e5400098ad20dd83b7e5e67`.
- [start-0004](../../events/start-0004.json): start / phase-start / started; source `5a662108044deba17ed09e453be8e2b0e1c98ffb`, tree `34c20c0956c512abdeac946e7e44129f3533fe3d`.
- [implementation-0005](../../events/implementation-0005.json): implementation / phase-result / blocked; source `5a662108044deba17ed09e453be8e2b0e1c98ffb`, tree `34c20c0956c512abdeac946e7e44129f3533fe3d`.
- [start-complete-0006](../../events/start-complete-0006.json): start / phase-complete / blocked; source `bad0a4b9878c4f3466920daa472e26a9c7cfe1a7`, tree `8827f5180c73f1465154de736c27d35e802f9ed8`.
- [start-0007](../../events/start-0007.json): start / phase-start / started; source `d6e7fb74c5de6f5bc5383b9651b730ab60159952`, tree `0e65b383eeec0a3483a18d6167c965038d0a9ff6`.
- [implementation-0008](../../events/implementation-0008.json): implementation / phase-result / blocked; source `42a23605724aff8da6238f4b28af15780e15527b`, tree `a85126303434b449f2f986d5a2ddf95c5bc357d0`.
- [start-complete-0009](../../events/start-complete-0009.json): start / phase-complete / blocked; source `ccdc1f2ed312c70e1cc976f2175b99bbc38fe201`, tree `c979de68e6644ed7bb30d7f99f92e62379e0bfda`.
- [start-0010](../../events/start-0010.json): start / phase-start / started; source `35e8dd62b6787101e79732208e933e37d18e204b`, tree `6f0c2fb45e8f2c4736768808de24c2b78ff2ee32`.
- [implementation-0011](../../events/implementation-0011.json): implementation / phase-result / blocked; source `35e8dd62b6787101e79732208e933e37d18e204b`, tree `6f0c2fb45e8f2c4736768808de24c2b78ff2ee32`.

## Supporting records

- [Current exact command and actual output](../../artifacts/evidence/device-preflight-0010/cable-preflight.json)
- [Current compatibility interpretation and missing evidence](../../artifacts/evidence/device-preflight-0010/compatibility-analysis.json)
- [Host correction verification, not rerun](../../artifacts/evidence/firmware-field-0007/verification.json)
- [Earlier host acceptance evidence, not rerun](../../artifacts/evidence/host-20261108-install-001/verification.json)
- [Earlier preflight](../../artifacts/evidence/device-preflight-0004/cable-preflight.json)
- [Previous immutable snapshot](../../artifacts/snapshots/pr-draft-implementation-0008.md)

## Next bounded approval request

Authorize host-only identification of the three observed native dependency hashes against retained or publisher build provenance, and a compatibility assessment for net.asivery.AppLoad 1.0, AppLoadLauncher.launchApplication, the manifest/backend SOCK_SEQPACKET contract, and sidebar.qmd on IMG_VERSION 3.28.0.172. No tablet access, helper execution, source/guard changes, installation, collision repair, listener access, restart, or reboot. If static evidence is unavailable, return an exact bounded metadata-only proposal naming documented version files for separate approval; do not probe the device.

A final hash-pinned installation proposal is withheld until native compatibility passes. Any installation, repeat installation or activation requires separate approval. A restart also requires fresh saved/closed confirmation. The protocol-1 listener on port 47840 remains untouched.

