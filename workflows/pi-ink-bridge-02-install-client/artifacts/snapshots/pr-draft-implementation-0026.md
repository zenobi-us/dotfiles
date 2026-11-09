---
title: Activation blocked at cable preflight
type: Report
---

# Activation blocked at cable preflight

## Ticket summary
Ticket `tracker/tickets/pi-ink-bridge-02-install-client.md` remains claimed and blocked. No source or tracker changed.

## Problem statement
Strict cable SSH returned `Connection reset by peer` and `Broken pipe`, exit 255, with no stdout. Installed identities, compatibility and current service/PID could not be observed. No device defect is inferred.

## Implementation summary
Attempt 9 stopped at strict cable preflight. SSH exited 255 with no stdout. No restart or native launch occurred. Installation from attempt 8 remains recorded, but current device identity and preservation are unobserved.

Owner authorized exactly one restart after passing preflight and confirmed `Yes, all saved and closed`. The preflight failed; no operation-start or restart command was issued. No retry, reinstall, pairing, private content read, screenshot, service configuration change or prototype access occurred. Desktop service was not contacted or stopped. Port47840 was not contacted.

Frozen source commit `d7f4c61eafd5a1898cff3da85801c61a7c96c4fa`; tree `ca4cd0ea9ffd9e2dfcfd89a3fe73b9b055623cb8`. Fresh child pane `w6R:p7`, attempt 9, parent `start-0025`.

## Changed files
Only authorized workflow evidence, parent start/status, this result receipt, immutable snapshot and generated projections changed. The receipt lists all changed paths.

## Validation results
Canonical inspector passed before preflight: historyValid=true, unique source. Exactly one bounded read-only SSH preflight returned exit 255. Device stdout was empty. No native parser/build/test suites ran.

## Preservation checks
No mutation command ran. Fresh preservation postchecks were not attempted because preflight failed and retry was prohibited. Prior installation and its successful preservation checks remain historical evidence, not fresh proof.

## Native observations
Current model/firmware and PID transition: unobserved. Historical model Ferrari/aarch64, IMG_VERSION 3.28.0.172, PID 7463. Restart count: 0. Sidebar presence, text, readability, overlap, truncation and native connection state: unobserved. No documents were opened by this attempt.

## Review history
No independent review ran. Full prior history is retained below.

## Resolved findings
No acceptance finding resolved in this attempt. Stop-before-restart boundary respected.

## Remaining findings
Restore cable SSH access, then obtain scoped approval for a new preflight. Native sidebar/layout/connection acceptance and separately unapproved repeat-install preservation remain pending.

## Latest reviewer verdict
None.

## Merge status
Not reviewed, merged or pushed. Parent completion remains pending. Pane remains open for parent validation and closure.

## Next action
Restore cable SSH access, then obtain scoped approval for a new preflight. Native sidebar/layout/connection acceptance and separately unapproved repeat-install preservation remain pending. No native UI selection is requested until activation is permitted and completed.

## Supporting receipts and artifacts
- **Parent authority:** [start-0025](../events/start-0025.json).
- **Result receipt:** [implementation-0026](../events/implementation-0026.json).
- **Approval:** [approval-and-inspection](../artifacts/evidence/device-activation-0025/approval-and-inspection.json).
- **Intent:** [preflight-intent](../artifacts/evidence/device-activation-0025/preflight-intent.json).
- **Actual command/output:** [read-only-preflight](../artifacts/evidence/device-activation-0025/read-only-preflight.json).
- **Outcome:** [activation-outcome](../artifacts/evidence/device-activation-0025/activation-outcome.json).
- **Live identity:** [session-scope](../artifacts/evidence/device-activation-0025/session-scope.json).

## Historical report through start-complete-0024
The following retained report describes earlier attempts. Its approval, activation, inspector and pane statements are historical only. Current claims appear above.

---
title: Production client installed; native acceptance blocked
type: Report
---

# Production client installed; native acceptance blocked

## Ticket summary
Install and launch the production tablet client. Ticket `tracker/tickets/pi-ink-bridge-02-install-client.md` remains claimed. Attempt 8 installed the exact production payload once.

## Problem statement
Installation alone does not prove native activation, physical layout, connection-screen launch or repeat-install preservation. These remain separately approved actions.

## Implementation summary
The exact approved corrected preflight passed, including host comparisons of returned metadata against the fixed capture manifest. The unchanged pinned generated command ran once with stricter SSH transport options only. The installer exited 0. All three downloads passed SHA-256 verification before shell execution or extraction.

Inspected source `3f8b679686fb3196fdd39f5b5ed80b7203503fb9`, tree `d4bbee6c9cfe001b83ec05cc6e8356d3ba14fa65`. No source, payload, protocol, tracker, or service configuration changed. Session pane `w6R:p6`. Parent [start-0022](../events/start-0022.json); result [implementation-0023](../events/implementation-0023.json).

## Changed files
Only authorized parent start/status records, this attempt's evidence, result receipt, immutable draft snapshot and generated projections changed. The result receipt lists every path.

## Validation results
Fresh trusted loopback command and server record matched approval. Installer, ZIP, sidebar and certificate DER hashes matched. Certificate-verified HTTPS health reported the pinned server ready.

The exact recorded preflight ran once over strict cable SSH. Ferrari/aarch64, IMG_VERSION `3.28.0.172`, stock/native hashes, parent identities and target absence matched. All 14 retained file types, owners, modes, sizes and hashes matched. All 12 bounded QMD names matched. The root check imposed no writability restriction.

The installer ran once and exited 0. The read-only postcheck verified six release hashes, regular-file types, exact sizes, root ownership and private modes. Both production symlinks match the immutable release. Installed CA bytes match the pinned public certificate. Initial config metadata is root:root 0600; no config content was read. State file is absent.

All 14 retained identities remain unchanged. The production QMD link is the only QMD-name addition. Xochitl PID `7463` remained unchanged. No restart was requested.

## Installed target identities
Release: `/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629`.

- **Production link:** `/home/root/xovi/exthome/appload/pi-annotations` → `/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/app`.
- **Production link:** `/home/root/xovi/exthome/qt-resource-rebuilder/pi-annotations.qmd` → `/home/root/.local/share/pi-ink-bridge/releases/03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629/sidebar.qmd`.

Public server ID `256377c7f22604161e086b332a63e19b`; origin `https://192.168.86.35:58841`; certificate DER SHA-256 `03fee0acc6c98861805f154244d33dbad2bdbea7087f7d61135a9e47e6a4a3d1`. Public identity derives from the exact hash-pinned bootstrap verified by the installer and matching installed CA. Private config was not inspected.

## Preservation and safety
No activation, backend/UI launch, pairing, repeat install, notebook/draft read or write, firmware, Developer Mode, firewall, cloud or account change occurred. No older prototype service was contacted or reconfigured. Port47840 was not contacted. The persistent desktop service on58840/58841 remains running. Installer-owned staging used its recorded cleanup; this session requested no device cleanup. Private retained resources remain outside Git and unchanged by this session.

## Review history
No independent review has run. All earlier receipts remain linked below. Earlier root guard failure was an overly broad agent check, not a device or firmware defect.

## Resolved findings
Fresh corrected preflight, pinned installation and authorized read-only postchecks passed. Installation is no longer pending.

## Remaining findings
- **Acceptance gate:** Fresh owner saved-and-closed confirmation and separate approval for exactly one Xochitl restart, then native Pi Annotations sidebar/layout/connection observation. No activation is authorized now.
- **Acceptance gate:** Separate repeat-install approval and data-preservation acceptance.

## Latest reviewer verdict
None.

## Merge status
Not reviewed, merged or pushed. Parent completion start-complete-0024 recorded and child pane closed; activation remains unapproved.

## Next approval
Confirm that all tablet documents are saved and closed. Separately approve exactly one Xochitl restart and native Pi Annotations sidebar/layout/connection observation. No activation now. Repeat-install needs separate approval.

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
- **start-complete-0015:** [start / phase-complete / blocked](../events/start-complete-0015.json). Source `ebde5773082ca625ca366b8260e7f6ba102893b0`, tree `e464d4d467e90c09e91beb3d2a5c5dac36fc29bc`.
- **start-0016:** [start / phase-start / started](../events/start-0016.json). Source `125a2d8af313f00baa289a5fb10fc34a0df77023`, tree `e7233a633267c8cc386827fde44ae3d8383ba219`.
- **implementation-0017:** [implementation / phase-result / blocked](../events/implementation-0017.json). Source `125a2d8af313f00baa289a5fb10fc34a0df77023`, tree `e7233a633267c8cc386827fde44ae3d8383ba219`.
- **start-complete-0018:** [start / phase-complete / blocked](../events/start-complete-0018.json). Source `2f9dd8ad6d3a67bfc2f060df88782aa7fca0c8b3`, tree `15d1b13869ad39f84748f932ec7ac616bf488db2`.
- **start-0019:** [start / phase-start / started](../events/start-0019.json). Source `8bb048c03ee7182a1fb60b8581ed3115f14f4d64`, tree `d75cb1a5257af29c273a0bd67eb334d75d7cc777`.
- **implementation-0020:** [implementation / phase-result / blocked](../events/implementation-0020.json). Source `8bb048c03ee7182a1fb60b8581ed3115f14f4d64`, tree `d75cb1a5257af29c273a0bd67eb334d75d7cc777`.
- **start-complete-0021:** [start / phase-complete / blocked](../events/start-complete-0021.json). Source `e2a616f517777eff13e29fd670814c7c27d3c9aa`, tree `53c2ae046b423485a0458960aeb4815114135cd1`.
- **start-0022:** [start / phase-start / started](../events/start-0022.json). Source `3f8b679686fb3196fdd39f5b5ed80b7203503fb9`, tree `d4bbee6c9cfe001b83ec05cc6e8356d3ba14fa65`.
- **implementation-0023:** [implementation / phase-result / blocked](../events/implementation-0023.json). Source `3f8b679686fb3196fdd39f5b5ed80b7203503fb9`, tree `d4bbee6c9cfe001b83ec05cc6e8356d3ba14fa65`.

## Supporting evidence
- **cable-preflight.json:** [cable-preflight.json](../artifacts/evidence/device-install-0022/cable-preflight.json).
- **installation-outcome.json:** [installation-outcome.json](../artifacts/evidence/device-install-0022/installation-outcome.json).
- **operation-result.json:** [operation-result.json](../artifacts/evidence/device-install-0022/operation-result.json).
- **operation-start.json:** [operation-start.json](../artifacts/evidence/device-install-0022/operation-start.json).
- **postcheck-comparison.json:** [postcheck-comparison.json](../artifacts/evidence/device-install-0022/postcheck-comparison.json).
- **postcheck-intent.json:** [postcheck-intent.json](../artifacts/evidence/device-install-0022/postcheck-intent.json).
- **preflight-comparison.json:** [preflight-comparison.json](../artifacts/evidence/device-install-0022/preflight-comparison.json).
- **preflight-start.json:** [preflight-start.json](../artifacts/evidence/device-install-0022/preflight-start.json).
- **read-only-postcheck.json:** [read-only-postcheck.json](../artifacts/evidence/device-install-0022/read-only-postcheck.json).
- **session-scope.json:** [session-scope.json](../artifacts/evidence/device-install-0022/session-scope.json).
- **trust-preflight.json:** [trust-preflight.json](../artifacts/evidence/device-install-0022/trust-preflight.json).
- **workflow-inspection.json:** [workflow-inspection.json](../artifacts/evidence/device-install-0022/workflow-inspection.json).


## Workflow inspector limit

The initial pre-operation inspector passed. After the result receipt, the inspector failed in its generated mq query with `Unexpected token catch`. This is a workflow-tool failure, not an installation failure. No tool or source correction was attempted. Parent must validate the durable result before completion. See [exact inspector output](../artifacts/evidence/device-install-0022/workflow-inspection.json).


## Parent reconciliation start-complete-0024
Validated the exact source/result trees and workflow-only commit scope, immutable child result, installation output and preservation postchecks. Fresh corrected preflight ran once; pinned installer ran once and exited 0. Closed completed child pane w6R:p6; retained the source worktree and existing desktop service. No restart, activation, pairing or repeat installation occurred.

The post-result canonical inspector failed in its generated mq query at document-cache.ts:64 (Unexpected token catch). Initial pre-operation inspection passed; current history validation and next-phase selection remain unavailable. The failure was preserved and reported; no bypass, correction or repeated device action occurred.

[Parent receipt](../events/start-complete-0024.json). Native acceptance still requires fresh owner confirmation that documents are saved and closed plus separate approval for exactly one Xochitl restart and sidebar/layout/connection observation. Repeat installation is separately gated.


