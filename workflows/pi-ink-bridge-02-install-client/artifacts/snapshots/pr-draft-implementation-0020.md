---
title: Cable installation preflight stopped
type: Report
---

# Cable installation stopped before mutation

## Ticket summary
Install and launch the production tablet client. Ticket `tracker/tickets/pi-ink-bridge-02-install-client.md` remains claimed. Attempt 7 is blocked.

## Problem statement
The fresh preflight stopped at an added guard that required `/` to be writable. That guard was too broad. It is not evidence of a firmware or payload defect.

## Implementation summary
No installer execution occurred. No operation-start intent was written because the mutation gate did not pass. No device download, extraction, staging, repair or cleanup occurred. No source or tracker change occurred.

Inspected commit `8bb048c03ee7182a1fb60b8581ed3115f14f4d64`, tree `d75cb1a5257af29c273a0bd67eb334d75d7cc777`. Fresh session `/home/zenobius/.omp/agent/sessions/--run-media-zenobius-Store-Projects-Mine-Github-Dotfiles.worktrees-feature-pi-ink-bridge-02-install-client--/2026-11-08T01-40-30-312Z_01a1b8d0-6fe8-73be-aa68-cd13edac627a.jsonl`, pane `w6R:p5`. Parent: [start-0019](../events/start-0019.json). Result: [implementation-0020](../events/implementation-0020.json).

## Changed files
Only the parent start/status records and this attempt's workflow evidence, receipt, immutable snapshot and generated projections changed.

## Validation results
Live installer, ZIP, sidebar, exact public server record and certificate DER hashes matched approval. The live loopback command matched the approved command. Certificate-verified HTTPS health reported the pinned server ready.

One strict cable connection reached Ferrari/aarch64, IMG_VERSION `3.28.0.172`. Stock Xochitl, XOVI, AppLoad and rebuilder hashes matched. Three production target roots were absent. Home and launcher directories were writable.

The preflight exited `41` with `STOP=unsafe boundary: /`. It stopped before retained QMD inventory/hashes, full ownership/mode checks, and prototype preservation checks. Those checks did not pass and were not retried.

## Installed target identities
None created. The immutable release and two launcher links were not installed. No postinstall evidence exists.

## Preservation and safety
No persistent or temporary device writes were requested. No restart, reboot, pairing, native UI/backend launch, notebook/draft access, or port47840 access occurred. No retained QMD/prototype byte-preservation claim is made because those checks were not reached. The desktop service was left running.

## Review history
No independent review has run. Earlier receipt history and supporting records remain below.

## Resolved findings
Live public trust and payload identities matched. No source correction was authorized or made.

## Remaining findings
The full preflight remains incomplete. Installation, native activation/layout/connection observation and repeat-install acceptance remain untested.

## Latest reviewer verdict
None.

## Merge status
Not reviewed, merged or pushed. Parent must validate this result and close the pane.

## Next precise approval
Approve a new fresh preflight and at most one execution of the same pinned installer after all checks pass. Correct the proposed preflight so / is checked for directory/type/owner, not writability; require writability only for approved production-home and launcher write parents. No source or pinned payload changes. No restart, activation, pairing, repeat-install or automatic retry.

If a later installation succeeds, obtain fresh owner saved-and-closed confirmation and separate approval for exactly one Xochitl restart and native Pi Annotations launch/connection observation. This attempt does not request or authorize activation. Repeat-install needs separate approval.

## Supporting evidence
- **Trust checks:** [Public identities and six release file hashes](../artifacts/evidence/device-install-0019/trust-preflight.json).
- **Instruction comparison:** [Exact approved command](../artifacts/evidence/device-install-0019/instruction-comparison.json).
- **Cable failure:** [Exact argv, exit, stdout and stderr](../artifacts/evidence/device-install-0019/cable-preflight.json).
- **Operation outcome:** [No install and explicit limits](../artifacts/evidence/device-install-0019/operation-result.json).

## Earlier projection history
The following retained text describes earlier attempts. Its pending approvals are historical, not the current attempt's authority.

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

Not merged or pushed. Pane w6R:p3 is closed after parent validation.

## Next approval

Approve trusted host bootstrap preparation on a compatible explicitly selected endpoint that leaves port 47840 and existing prototype services untouched. Generate and show the actual server ID, HTTPS origin, certificate fingerprint and trust-record SHA-256. No device access or installation is included in bootstrap preparation. Final hash-pinned installation approval follows only after those real values are available; restart requires separate saved/closed confirmation and activation approval.

The installation proposal pins installer `765593a9a36fdbf097d67bb3a41d613038150268636616447b9244b87c17578f` and ZIP `03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629`.

The actual server trust record is not captured or fabricated. Its digest, identity and certificate fingerprint must be pinned through the trusted host surface before installation. Recheck stock/native hashes, firmware/model, target absence/ownership/writability and the QMD manifest at any later authorized install. Preserve all prototype files and services.

## Receipt history

- **start-0001:** [start / phase-start / started](../events/start-0001.json). Source `155e01d9a88d0b2a4bff539d1685f637a4ccc3ad`, tree `74872d499498a25af7a95b67d849d2acec021216`.
- **implementation-0002:** [implementation / phase-result / blocked](../events/implementation-0002.json). Source `82edbf73a1cc78d61079be62fa97d98eff445ecd`, tree `9824944411da9971edcb5d12a98b24f67064bd67`.
- **start-complete-0003:** [start / phase-complete / blocked](../events/start-complete-0003.json). Source `6d45cd8c4d63c394a1f0cbacec62a1a67e0d235d`, tree `af615daebe9c5d603e5400098ad20dd83b7e5e67`.
- **start-0004:** [start / phase-start / started](../events/start-0004.json). Source `5a662108044deba17ed09e453be8e2b0e1c98ffb`, tree `34c20c0956c512abdeac946e7e44129f3533fe3d`.
- **implementation-0005:** [implementation / phase-result / blocked](../events/implementation-0005.json). Source `5a662108044deba17ed09e453be8e2b0e1c98ffb`, tree `34c20c0956c512abdeac946e7e44129f3533fe3d`.
- **start-complete-0006:** [start / phase-complete / blocked](../events/start-complete-0006.json). Source `bad0a4b9878c4f3466920daa472e26a9c7cfe1a7`, tree `8827f5180c73f1465154de736c27d35e802f9ed8`.
- **start-0007:** [start / phase-start / started](../events/start-0007.json). Source `d6e7fb74c5de6f5bc5383b9651b730ab60159952`, tree `0e65b383eeec0a3483a18d6167c965038d0a9ff6`.
- **implementation-0008:** [implementation / phase-result / blocked](../events/implementation-0008.json). Source `42a23605724aff8da6238f4b28af15780e15527b`, tree `a85126303434b449f2f986d5a2ddf95c5bc357d0`.
- **start-complete-0009:** [start / phase-complete / blocked](../events/start-complete-0009.json). Source `ccdc1f2ed312c70e1cc976f2175b99bbc38fe201`, tree `c979de68e6644ed7bb30d7f99f92e62379e0bfda`.
- **start-0010:** [start / phase-start / started](../events/start-0010.json). Source `35e8dd62b6787101e79732208e933e37d18e204b`, tree `6f0c2fb45e8f2c4736768808de24c2b78ff2ee32`.
- **implementation-0011:** [implementation / phase-result / blocked](../events/implementation-0011.json). Source `35e8dd62b6787101e79732208e933e37d18e204b`, tree `6f0c2fb45e8f2c4736768808de24c2b78ff2ee32`.
- **start-complete-0012:** [start / phase-complete / blocked](../events/start-complete-0012.json). Source `04170ea49d3af431b9af281189439fb8a50b8764`, tree `49c056c95232d349a9e9cc38a462e22a0deddbf5`.
- **start-0013:** [start / phase-start / started](../events/start-0013.json). Source `bdad43bd891932a86d3ef3e85cd616743147580b`, tree `a0e9d58b6e0c2a1338f2b98a15817bb8d3ca580c`.
- **implementation-0014:** [implementation / phase-result / blocked](../events/implementation-0014.json). Source `bdad43bd891932a86d3ef3e85cd616743147580b`, tree `a0e9d58b6e0c2a1338f2b98a15817bb8d3ca580c`.

## Supporting evidence

- **Capture evidence:** [Fixed manifest and actual SSH commands](../artifacts/evidence/sidebar-resources-0013/capture-manifest.json).
- **Host evidence:** [Pinned source, extraction and native application](../artifacts/evidence/sidebar-resources-0013/host-validation.json).
- **Installation proposal:** [Exact payloads and remaining preconditions](../artifacts/evidence/sidebar-resources-0013/installation-proposal.json).
- **Publisher provenance:** [Resolved dependency versions and static AppLoad contracts](../artifacts/evidence/device-preflight-0010/parent-provenance.json).
- **Earlier validation:** [Host implementation evidence](../artifacts/evidence/host-20261108-install-001/verification.json).
- **Earlier target metadata:** [Approved device preflight](../artifacts/evidence/device-preflight-0010/cable-preflight.json).



## Parent reconciliation: start-complete-0015

The parent validated implementation-0014, exact commit/tree, capture manifest, native parser application and immutable draft. Three bounded resource reads passed. The exact pinned parser applied both current baseline and baseline plus production sidebar to exact stock QML. No source correction is needed. Native runtime, physical layout and post-restart launch remain untested. Herdr reported the child done; pane w6R:p3 is closed. Private diagnostic inputs remain outside Git with a verified 0700 root directory.

Next approve host bootstrap preparation only. Show the actual server identity, HTTPS origin, certificate fingerprint and trust-record digest before requesting final device installation approval. Leave port 47840 untouched. Installation, restart and repeat-install acceptance remain separately gated.

[Parent completion](../events/start-complete-0015.json).


## Host bootstrap result — implementation-0017

Host bootstrap passed. Ticket remains blocked. See [immutable result snapshot](../artifacts/snapshots/pr-draft-implementation-0017.md), [receipt](../events/implementation-0017.json), and [exact installation approval request](../artifacts/evidence/host-bootstrap-0016/installation-approval-request.json). All previous receipt and review history above remains valid historical evidence. No review, merge, source or tracker change occurred. Installation, activation and repeat-install remain unapproved.

- **Check:** exit 0; existing production bootstrap created persistent Pitchfork service; caller exited
- **Check:** exit 0; info notification; same identity, fingerprint, command and setup URL; caller exited
- **Check:** passed; protocol 2 ready; all three approved payload hashes match; exact trust record digest occurs in trusted generated command
- **Check:** passed; certificate chain and IP/SAN verified without insecure bypass; same health as loopback; repeated after both callers exited
- **Check:** 58840/58841 owned by bun PID1182586; global/pi-ink-bridge running; parent PID1182041; state 0700 and identity/key/certificate/runtime 0600. Existing 47840 remains omp PID20453 fd41.


## Parent reconciliation: start-complete-0018

The parent validated implementation-0017, exact source/tree, immutable snapshot, public trust record and certificate digests, pinned payload evidence and final installation request. Herdr reported the child done; pane w6R:p4 is closed. A certificate-verified HTTPS health request after pane closure returned protocol 2, the same server identity/fingerprint/build and ready state. The persistent service remains running independently. No tablet connection, installation or restart occurred.

Next approval covers one exact hash-pinned cable installation after fresh strict read-only preflight, using the recorded real trust identity. No restart or reboot. Activation and repeat-install remain separately gated.

[Parent completion](../events/start-complete-0018.json). [Exact installation approval request](../artifacts/evidence/host-bootstrap-0016/installation-approval-request.json).

