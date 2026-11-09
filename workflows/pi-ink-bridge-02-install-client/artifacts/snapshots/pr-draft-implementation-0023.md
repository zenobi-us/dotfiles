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

Inspected source `3f8b679686fb3196fdd39f5b5ed80b7203503fb9`, tree `d4bbee6c9cfe001b83ec05cc6e8356d3ba14fa65`. No source, payload, protocol, tracker, or service configuration changed. Session pane `w6R:p6`. Parent [start-0022](../../events/start-0022.json); result [implementation-0023](../../events/implementation-0023.json).

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
Not reviewed, merged or pushed. Parent completion and pane closure remain pending.

## Next approval
Confirm that all tablet documents are saved and closed. Separately approve exactly one Xochitl restart and native Pi Annotations sidebar/layout/connection observation. No activation now. Repeat-install needs separate approval.

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
- **start-complete-0015:** [start / phase-complete / blocked](../../events/start-complete-0015.json). Source `ebde5773082ca625ca366b8260e7f6ba102893b0`, tree `e464d4d467e90c09e91beb3d2a5c5dac36fc29bc`.
- **start-0016:** [start / phase-start / started](../../events/start-0016.json). Source `125a2d8af313f00baa289a5fb10fc34a0df77023`, tree `e7233a633267c8cc386827fde44ae3d8383ba219`.
- **implementation-0017:** [implementation / phase-result / blocked](../../events/implementation-0017.json). Source `125a2d8af313f00baa289a5fb10fc34a0df77023`, tree `e7233a633267c8cc386827fde44ae3d8383ba219`.
- **start-complete-0018:** [start / phase-complete / blocked](../../events/start-complete-0018.json). Source `2f9dd8ad6d3a67bfc2f060df88782aa7fca0c8b3`, tree `15d1b13869ad39f84748f932ec7ac616bf488db2`.
- **start-0019:** [start / phase-start / started](../../events/start-0019.json). Source `8bb048c03ee7182a1fb60b8581ed3115f14f4d64`, tree `d75cb1a5257af29c273a0bd67eb334d75d7cc777`.
- **implementation-0020:** [implementation / phase-result / blocked](../../events/implementation-0020.json). Source `8bb048c03ee7182a1fb60b8581ed3115f14f4d64`, tree `d75cb1a5257af29c273a0bd67eb334d75d7cc777`.
- **start-complete-0021:** [start / phase-complete / blocked](../../events/start-complete-0021.json). Source `e2a616f517777eff13e29fd670814c7c27d3c9aa`, tree `53c2ae046b423485a0458960aeb4815114135cd1`.
- **start-0022:** [start / phase-start / started](../../events/start-0022.json). Source `3f8b679686fb3196fdd39f5b5ed80b7203503fb9`, tree `d4bbee6c9cfe001b83ec05cc6e8356d3ba14fa65`.
- **implementation-0023:** [implementation / phase-result / blocked](../../events/implementation-0023.json). Source `3f8b679686fb3196fdd39f5b5ed80b7203503fb9`, tree `d4bbee6c9cfe001b83ec05cc6e8356d3ba14fa65`.

## Supporting evidence
- **cable-preflight.json:** [cable-preflight.json](../evidence/device-install-0022/cable-preflight.json).
- **installation-outcome.json:** [installation-outcome.json](../evidence/device-install-0022/installation-outcome.json).
- **operation-result.json:** [operation-result.json](../evidence/device-install-0022/operation-result.json).
- **operation-start.json:** [operation-start.json](../evidence/device-install-0022/operation-start.json).
- **postcheck-comparison.json:** [postcheck-comparison.json](../evidence/device-install-0022/postcheck-comparison.json).
- **postcheck-intent.json:** [postcheck-intent.json](../evidence/device-install-0022/postcheck-intent.json).
- **preflight-comparison.json:** [preflight-comparison.json](../evidence/device-install-0022/preflight-comparison.json).
- **preflight-start.json:** [preflight-start.json](../evidence/device-install-0022/preflight-start.json).
- **read-only-postcheck.json:** [read-only-postcheck.json](../evidence/device-install-0022/read-only-postcheck.json).
- **session-scope.json:** [session-scope.json](../evidence/device-install-0022/session-scope.json).
- **trust-preflight.json:** [trust-preflight.json](../evidence/device-install-0022/trust-preflight.json).

