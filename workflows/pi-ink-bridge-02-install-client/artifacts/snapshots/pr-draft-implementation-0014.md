---
title: Production sidebar host validation
type: Report
---

# Production sidebar host validation

Validate the production sidebar before installation. Reader: tablet owner and parent coordinator. Date: 2026-11-08.

## Overview

Offline native application passed. Installation, activation and native post-restart launch remain unauthorized and untested. No source or tracker change occurred.

Inspected source: `bdad43bd891932a86d3ef3e85cd616743147580b`. Tree: `a0e9d58b6e0c2a1338f2b98a15817bb8d3ca580c`. Ticket: `tracker/tickets/pi-ink-bridge-02-install-client.md` remains claimed.

Sections: [Ticket summary](#ticket-summary), [Problem statement](#problem-statement), [Implementation summary](#implementation-summary), [Changed files](#changed-files), [Validation results](#validation-results), [Review history](#review-history), [Resolved findings](#resolved-findings), [Remaining findings](#remaining-findings), [Latest reviewer verdict](#latest-reviewer-verdict), [Merge status](#merge-status), [Next approval](#next-approval), [Receipt history](#receipt-history), [Supporting evidence](#supporting-evidence).

## Ticket summary

Install and launch the production tablet client. This attempt covers only approved read-only capture and host-only validation.

## Problem statement

Earlier native parser evidence used different prototype patches and unavailable temporary inputs. It did not prove production `sidebar.qmd` against current firmware and retained patches.

## Implementation summary

Captured the stock binary, hashtab and 12 validated direct QMD files. The stock hash matches the approved firmware identity. Host-only ELF decoding extracted the exact firmware sidebar.

Compiled qmldiff `25681c3cc7addb93fdbb41ceac1f1bdce8b2625d`, pinned by rebuilder `7874154dba6793cc68a15fae0fb9dd272c4ed20a`, with its original lockfile. The native library loaded and applied both the current baseline and baseline plus production patch in fresh processes.

The emitted output adds the AppLoad import and production launcher before the retained prototype launcher and spacer. The exact native SidebarItem type supports the used properties. This static check does not prove runtime QML types, pixel fit, navigation or launch.

## Changed files

Only the workflow records below changed. Raw firmware, resource QML and captured patch text are outside Git.

- **Workflow record:** `workflows/pi-ink-bridge-02-install-client/artifacts/evidence/sidebar-resources-0013/capture-manifest.json`.
- **Workflow record:** `workflows/pi-ink-bridge-02-install-client/artifacts/evidence/sidebar-resources-0013/host-validation.json`.
- **Workflow record:** `workflows/pi-ink-bridge-02-install-client/artifacts/evidence/sidebar-resources-0013/installation-proposal.json`.
- **Workflow record:** `workflows/pi-ink-bridge-02-install-client/events/implementation-0014.json`.
- **Workflow record:** `workflows/pi-ink-bridge-02-install-client/artifacts/snapshots/pr-draft-implementation-0014.md`.
- **Workflow record:** `workflows/pi-ink-bridge-02-install-client/events/start-0013.json`.
- **Workflow record:** `workflows/pi-ink-bridge-02-install-client/manifest.yaml`.
- **Workflow record:** `workflows/pi-ink-bridge-02-install-client/projections/pr-draft.md`.
- **Workflow record:** `workflows/pi-ink-bridge-02-install-client/projections/implementation-log.md`.
- **Workflow record:** `workflows/pi-ink-bridge-02-install-client/projections/latest-status.yaml`.

## Validation results

| Context | Loaded QMD files | Input bytes | Output bytes | Native result |
| --- | ---: | ---: | ---: | --- |
| Current retained baseline | 12 | 16737 | 16820 | Pass |
| Baseline plus production | 13 | 16737 | 17299 | Pass |

The 3 bounded SSH connections each exited 0 with empty stderr. All 14 captured files matched fixed sizes and SHA256 hashes. Final QMD inventory matched the initial manifest, with live and broken symlinks explicitly rejected.

The host build passed with 8 upstream deprecation warnings. No native parser/application error occurred. Only exact Sidebar.qml application is claimed; other retained targets were not processed.

The packaged sidebar matches the validated source: `33580da2dfe58623ff5b31d6c3a679dd4f678ab8a65d057c497f24078b2447be`.

Private diagnostic inputs remain at `/tmp/pi-ink-sidebar-resources-0013-kj8de78d`. Directories are 0700; files are 0600. The temporary host source/build/harness/stages were removed.

No intentional tablet writes, helper/native execution, installation, restart, service/listener access or private-record content reads occurred. Command audit does not prove the absence of incidental SSH daemon logging.

Host probe failures are recorded in host-validation.json. The absent CONTEXT.md read failed once. Host objdump lacked AArch64 support; host-only instruction decoding replaced it. Qt6Core pkg-config was unavailable; no Qt runtime validation is claimed.

## Review history

No independent review has run. Earlier blocked receipts retain their original findings and validation. This attempt resolves the offline production-sidebar question only.

## Resolved findings

Production parser syntax, selectors and actual application to exact firmware Sidebar.qml pass in the current retained patch context. Publisher dependency provenance remains in parent-provenance.json. No correction proposal is needed.

## Remaining findings

- **Acceptance gate:** Owner approval for exact-payload installation and trusted bootstrap preparation is missing. Compatible desktop endpoint must leave port 47840 untouched.
- **Acceptance gate:** One later Xochitl restart requires separate approval and fresh saved/closed confirmation. Native post-restart launch and physical layout remain untested.
- **Acceptance gate:** Repeat-install preservation acceptance remains untested.

## Latest reviewer verdict

None.

## Merge status

Not merged or pushed. Pane w6R:p3 remains open for parent validation and closure.

## Next approval

Approve only trusted host bootstrap preparation on an explicitly selected compatible endpoint that leaves port 47840 untouched, then a fresh cable preflight and one installation of the pinned installer and ZIP listed here. Do not restart Xochitl, reboot, pair, modify notebooks/drafts, replace prototype files, change firmware/Developer Mode/firewall/cloud/account settings, or remove unrelated files. Obtain separate saved/closed confirmation and activation approval before one later Xochitl restart and native launch observation.

The installation proposal pins installer `765593a9a36fdbf097d67bb3a41d613038150268636616447b9244b87c17578f` and ZIP `03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629`.

The actual server trust record is not captured or fabricated. Its digest, identity and certificate fingerprint must be pinned through the trusted host surface before installation. Recheck stock/native hashes, firmware/model, target absence/ownership/writability and the QMD manifest at any later authorized install. Preserve all prototype files and services.

## Receipt history

- **start-0001:** [start / phase-start / started](../../events/start-0001.json). Source `155e01d9a88d0b2a4bff539d1685f637a4ccc3ad`, tree `74872d499498a25af7a95b67d849d2acec021216`.
- **implementation-0002:** [implementation / phase-result / blocked](../../events/implementation-0002.json). Source `82edbf73a1cc78d61079be62fa97d98eff445ecd`, tree `9824944411da9971edcb5d12a98b24f67064bd67`.
- **start-complete-0003:** [start / phase-complete / blocked](../../events/start-complete-0003.json). Source `6d45cd8c4d63c394a1f0cbacec62a1a67e0d235d`, tree `af615daebe9c5d603e5400098ad20dd83b7e5e67`.
- **start-0004:** [start / phase-start / started](../../events/start-0004.json). Source `5a662108044deba17ed09e453be8e2b0e1c98ffb`, tree `34c20c0956c512abdeac946e7e44129f3533fe3d`.
- **implementation-0005:** [implementation / phase-result / blocked](../../events/implementation-0005.json). Source `5a662108044deba17ed09e453be8e2b0e1c98ffb`, tree `34c20c0956c512abdeac946e7e44129f3533fe3d`.
- **start-complete-0006:** [start / phase-complete / blocked](../../events/start-complete-0006.json). Source `bad0a4b9878c4f3466920daa472e26a9c7cfe1a7`, tree `8827f5180c73f1465154de736c27d35e802f9ed8`.
- **start-0007:** [start / phase-start / started](../../events/start-0007.json). Source `d6e7fb74c5de6f5bc5383b9651b730ab60159952`, tree `0e65b383eeec0a3483a18d6167c965038d0a9ff6`.
- **implementation-0008:** [implementation / phase-result / blocked](../../events/implementation-0008.json). Source `42a23605724aff8da6238f4b28af15780e15527b`, tree `a85126303434b449f2f986d5a2ddf95c5bc357d0`.
- **start-complete-0009:** [start / phase-complete / blocked](../../events/start-complete-0009.json). Source `ccdc1f2ed312c70e1cc976f2175b99bbc38fe201`, tree `c979de68e6644ed7bb30d7f99f92e62379e0bfda`.
- **start-0010:** [start / phase-start / started](../../events/start-0010.json). Source `35e8dd62b6787101e79732208e933e37d18e204b`, tree `6f0c2fb45e8f2c4736768808de24c2b78ff2ee32`.
- **implementation-0011:** [implementation / phase-result / blocked](../../events/implementation-0011.json). Source `35e8dd62b6787101e79732208e933e37d18e204b`, tree `6f0c2fb45e8f2c4736768808de24c2b78ff2ee32`.
- **start-complete-0012:** [start / phase-complete / blocked](../../events/start-complete-0012.json). Source `04170ea49d3af431b9af281189439fb8a50b8764`, tree `49c056c95232d349a9e9cc38a462e22a0deddbf5`.
- **start-0013:** [start / phase-start / started](../../events/start-0013.json). Source `bdad43bd891932a86d3ef3e85cd616743147580b`, tree `a0e9d58b6e0c2a1338f2b98a15817bb8d3ca580c`.
- **implementation-0014:** [implementation / phase-result / blocked](../../events/implementation-0014.json). Source `bdad43bd891932a86d3ef3e85cd616743147580b`, tree `a0e9d58b6e0c2a1338f2b98a15817bb8d3ca580c`.

## Supporting evidence

- **Capture evidence:** [Fixed manifest and actual SSH commands](../../artifacts/evidence/sidebar-resources-0013/capture-manifest.json).
- **Host evidence:** [Pinned source, extraction and native application](../../artifacts/evidence/sidebar-resources-0013/host-validation.json).
- **Installation proposal:** [Exact payloads and remaining preconditions](../../artifacts/evidence/sidebar-resources-0013/installation-proposal.json).
- **Publisher provenance:** [Resolved dependency versions and static AppLoad contracts](../../artifacts/evidence/device-preflight-0010/parent-provenance.json).
- **Earlier validation:** [Host implementation evidence](../../artifacts/evidence/host-20261108-install-001/verification.json).
- **Earlier target metadata:** [Approved device preflight](../../artifacts/evidence/device-preflight-0010/cable-preflight.json).

