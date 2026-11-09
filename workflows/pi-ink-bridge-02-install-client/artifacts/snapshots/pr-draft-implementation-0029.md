---
title: Cable preflight blocked — attempt 10
type: Report
---

# Cable preflight blocked — attempt 10

## Ticket summary
Install and launch the production tablet client. `tracker/tickets/pi-ink-bridge-02-install-client.md` remains claimed and BLOCKED. Existing claim retained; no tracker or source changes.

## Problem statement
The sole authorized preflight exited 255 with empty stdout: connection reset by peer / broken pipe. No device, firmware or payload defect is inferred.

## Implementation summary
Attempt 10 executed exactly one unchanged strict bounded read-only installed-target cable preflight. SSH exited 255 with empty stdout and connection reset/broken pipe. No retry, restart, installation or native observation occurred. Current device identities, retained resources and PID are unobserved; attempt 8 installation remains historical evidence.

Owner reply `confirmed` authorized only this read-only preflight. Restart and repeat installation are not authorized. No UI action is requested. No private contents/config, pairing, screenshots, repairs or cleanup were accessed or performed. The prototype, port47840 and persistent desktop service were not contacted; no service was stopped.

Frozen source commit `f71077758c721908704cc24b0ded0a84d0932571`; tree `04c5d1a4fe8d195dbb7d927ebe51a3e594351178`. Child `w6R:p8`; attempt 10; parent `start-0028`. Parent validation and pane closure remain pending.

## Changed files
Only authorized workflow records changed.

- **Workflow path:** `workflows/pi-ink-bridge-02-install-client/artifacts/evidence/cable-preflight-0028/authorization.json`.
- **Workflow path:** `workflows/pi-ink-bridge-02-install-client/artifacts/evidence/cable-preflight-0028/preflight-intent.json`.
- **Workflow path:** `workflows/pi-ink-bridge-02-install-client/artifacts/evidence/cable-preflight-0028/read-only-preflight.json`.
- **Workflow path:** `workflows/pi-ink-bridge-02-install-client/artifacts/evidence/cable-preflight-0028/preflight-outcome.json`.
- **Workflow path:** `workflows/pi-ink-bridge-02-install-client/artifacts/evidence/cable-preflight-0028/session-scope.json`.
- **Workflow path:** `workflows/pi-ink-bridge-02-install-client/artifacts/evidence/cable-preflight-0028/workflow-inspection.json`.
- **Workflow path:** `workflows/pi-ink-bridge-02-install-client/artifacts/evidence/cable-preflight-0028/markdown-validation.json`.
- **Workflow path:** `workflows/pi-ink-bridge-02-install-client/events/start-0028.json`.
- **Workflow path:** `workflows/pi-ink-bridge-02-install-client/events/implementation-0029.json`.
- **Workflow path:** `workflows/pi-ink-bridge-02-install-client/artifacts/snapshots/pr-draft-implementation-0029.md`.
- **Workflow path:** `workflows/pi-ink-bridge-02-install-client/manifest.yaml`.
- **Workflow path:** `workflows/pi-ink-bridge-02-install-client/projections/pr-draft.md`.
- **Workflow path:** `workflows/pi-ink-bridge-02-install-client/projections/implementation-log.md`.
- **Workflow path:** `workflows/pi-ink-bridge-02-install-client/projections/latest-status.yaml`.

## Validation results
Canonical pre-operation inspector exited 0; historyValid=true; source uniquely identified. Exact prior argv and all guards/transport options were retained. Exclusive intent was fsynced before execution. SSH exited 255 in 0.173995 seconds, without timeout or signal; stdout 0 bytes, stderr 103 bytes.

Preflights 1; restarts 0; installers 0; retries 0. Native observation not attempted. No builds, tests or formatters ran.

## Installed and retained comparisons
Fresh model, architecture, IMG_VERSION, stock/native dependencies, six release identities, two links, public CA, 14 retained resources, 12 original QMD names plus the production link, service identity and PID are unobserved. No host comparison can pass without device output. Attempt 8 remains historical installation/preservation proof only.

## Review history
No independent review has run. The complete receipt history and all durable input/output references are retained below.

## Resolved findings
No acceptance finding resolved. One-preflight and stop-before-mutation boundaries respected.

## Remaining findings
- **Open gate:** Cable SSH failed again. No further device access is authorized; parent must resolve a separate scoped next action.
- **Open gate:** Native sidebar/layout/connection acceptance and separately unapproved repeat-install preservation remain pending.

## Latest reviewer verdict
None.

## Merge status
Not reviewed, merged or pushed. Worktree/workspace and fresh pane remain open for parent validation and closure. No WORKTREE_IMPLEMENTATION_DONE signal.

## Receipt history

### start-0001

[start-0001.json](../../events/start-0001.json) — start / phase-start / started. Parent `None`; attempt 1. Source `155e01d9a88d0b2a4bff539d1685f637a4ccc3ad`; tree `74872d499498a25af7a95b67d849d2acec021216`.


### implementation-0002

[implementation-0002.json](../../events/implementation-0002.json) — implementation / phase-result / blocked. Parent `start-0001`; attempt 1. Source `82edbf73a1cc78d61079be62fa97d98eff445ecd`; tree `9824944411da9971edcb5d12a98b24f67064bd67`.

Implemented one per-user Pitchfork-managed installation service with pinned mise tools, trusted loopback/extension digests, verified SSH bootstrap, persistent server TLS identity, preflight and data-preserving tablet installation, and a thin sidebar launcher for an AppLoad connection screen. Browser and completed PNG contracts remain unchanged. Required native device acceptance is blocked by missing scoped owner approval.


### start-complete-0003

[start-complete-0003.json](../../events/start-complete-0003.json) — start / phase-complete / blocked. Parent `implementation-0002`; attempt 1. Source `6d45cd8c4d63c394a1f0cbacec62a1a67e0d235d`; tree `af615daebe9c5d603e5400098ad20dd83b7e5e67`.


### start-0004

[start-0004.json](../../events/start-0004.json) — start / phase-start / started. Parent `start-complete-0003`; attempt 2. Source `5a662108044deba17ed09e453be8e2b0e1c98ffb`; tree `34c20c0956c512abdeac946e7e44129f3533fe3d`.


### implementation-0005

[implementation-0005.json](../../events/implementation-0005.json) — implementation / phase-result / blocked. Parent `start-0004`; attempt 2. Source `5a662108044deba17ed09e453be8e2b0e1c98ffb`; tree `34c20c0956c512abdeac946e7e44129f3533fe3d`.

Read-only cable preflight only. Preserved all existing implementation and history. Verified cable SSH identity and read model, architecture, and firmware metadata once. Stopped on production firmware-guard mismatch. No source or tracker changes. Host tests and builds were not repeated.


### start-complete-0006

[start-complete-0006.json](../../events/start-complete-0006.json) — start / phase-complete / blocked. Parent `implementation-0005`; attempt 2. Source `bad0a4b9878c4f3466920daa472e26a9c7cfe1a7`; tree `8827f5180c73f1465154de736c27d35e802f9ed8`.


### start-0007

[start-0007.json](../../events/start-0007.json) — start / phase-start / started. Parent `start-complete-0006`; attempt 3. Source `d6e7fb74c5de6f5bc5383b9651b730ab60159952`; tree `0e65b383eeec0a3483a18d6167c965038d0a9ff6`.


### implementation-0008

[implementation-0008.json](../../events/implementation-0008.json) — implementation / phase-result / blocked. Parent `start-0007`; attempt 3. Source `42a23605724aff8da6238f4b28af15780e15527b`; tree `a85126303434b449f2f986d5a2ddf95c5bc357d0`.

Corrected the exact supported firmware comparison to IMG_VERSION=3.28.0.172 with no VERSION_ID fallback. The actual installer entry point passes focused host regression and smoke checks. README explains the field, sandbox test requirements and invalidation of old trusted instructions. Whole-ticket native acceptance remains blocked.


### start-complete-0009

[start-complete-0009.json](../../events/start-complete-0009.json) — start / phase-complete / blocked. Parent `implementation-0008`; attempt 3. Source `ccdc1f2ed312c70e1cc976f2175b99bbc38fe201`; tree `c979de68e6644ed7bb30d7f99f92e62379e0bfda`.


### start-0010

[start-0010.json](../../events/start-0010.json) — start / phase-start / started. Parent `start-complete-0009`; attempt 4. Source `35e8dd62b6787101e79732208e933e37d18e204b`; tree `6f0c2fb45e8f2c4736768808de24c2b78ff2ee32`.


### implementation-0011

[implementation-0011.json](../../events/implementation-0011.json) — implementation / phase-result / blocked. Parent `start-0010`; attempt 4. Source `35e8dd62b6787101e79732208e933e37d18e204b`; tree `6f0c2fb45e8f2c4736768808de24c2b78ff2ee32`.

Completed one approved renewed read-only cable metadata/hash preflight. Current firmware, stock/native binary hash identities, named target absence and writable parent directories passed. Native semantic/build-version mapping and production AppLoad/QMD compatibility remain unknown. Source and installer guard are unchanged. No final installation proposal is ready.


### start-complete-0012

[start-complete-0012.json](../../events/start-complete-0012.json) — start / phase-complete / blocked. Parent `implementation-0011`; attempt 4. Source `04170ea49d3af431b9af281189439fb8a50b8764`; tree `49c056c95232d349a9e9cc38a462e22a0deddbf5`.


### start-0013

[start-0013.json](../../events/start-0013.json) — start / phase-start / started. Parent `start-complete-0012`; attempt 5. Source `bdad43bd891932a86d3ef3e85cd616743147580b`; tree `a0e9d58b6e0c2a1338f2b98a15817bb8d3ca580c`.


### implementation-0014

[implementation-0014.json](../../events/implementation-0014.json) — implementation / phase-result / blocked. Parent `start-0013`; attempt 5. Source `bdad43bd891932a86d3ef3e85cd616743147580b`; tree `a0e9d58b6e0c2a1338f2b98a15817bb8d3ca580c`.

Read-only bounded cable resource capture passed. Host-only exact pinned qmldiff application passed for current 12 retained patches and for retained patches plus production sidebar.qmd. No source/guard correction is needed. Installation/activation acceptance remains gated.


### start-complete-0015

[start-complete-0015.json](../../events/start-complete-0015.json) — start / phase-complete / blocked. Parent `implementation-0014`; attempt 5. Source `ebde5773082ca625ca366b8260e7f6ba102893b0`; tree `e464d4d467e90c09e91beb3d2a5c5dac36fc29bc`.


### start-0016

[start-0016.json](../../events/start-0016.json) — start / phase-start / started. Parent `start-complete-0015`; attempt 6. Source `125a2d8af313f00baa289a5fb10fc34a0df77023`; tree `e7233a633267c8cc386827fde44ae3d8383ba219`.


### implementation-0017

[implementation-0017.json](../../events/implementation-0017.json) — implementation / phase-result / blocked. Parent `start-0016`; attempt 6. Source `125a2d8af313f00baa289a5fb10fc34a0df77023`; tree `e7233a633267c8cc386827fde44ae3d8383ba219`.

Authorized host-only persistent bootstrap passed using production provision-tablet.sh and registered /annotate add-device. Exact approved downloads and stable real identity verified after callers exited. Service remains running independently under Pitchfork. Whole ticket remains blocked on separate device installation/activation/repeat-install approvals.


### start-complete-0018

[start-complete-0018.json](../../events/start-complete-0018.json) — start / phase-complete / blocked. Parent `implementation-0017`; attempt 6. Source `2f9dd8ad6d3a67bfc2f060df88782aa7fca0c8b3`; tree `15d1b13869ad39f84748f932ec7ac616bf488db2`.


### start-0019

[start-0019.json](../../events/start-0019.json) — start / phase-start / started. Parent `start-complete-0018`; attempt 7. Source `8bb048c03ee7182a1fb60b8581ed3115f14f4d64`; tree `d75cb1a5257af29c273a0bd67eb334d75d7cc777`.


### implementation-0020

[implementation-0020.json](../../events/implementation-0020.json) — implementation / phase-result / blocked. Parent `start-0019`; attempt 7. Source `8bb048c03ee7182a1fb60b8581ed3115f14f4d64`; tree `d75cb1a5257af29c273a0bd67eb334d75d7cc777`.

Fresh read-only preflight exited 41 at added writable-directory guard for /. This guard was broader than the authorized production-home write boundary. Do not infer a device defect or payload failure. No retry was made.


### start-complete-0021

[start-complete-0021.json](../../events/start-complete-0021.json) — start / phase-complete / blocked. Parent `implementation-0020`; attempt 7. Source `e2a616f517777eff13e29fd670814c7c27d3c9aa`; tree `53c2ae046b423485a0458960aeb4815114135cd1`.


### start-0022

[start-0022.json](../../events/start-0022.json) — start / phase-start / started. Parent `start-complete-0021`; attempt 8. Source `3f8b679686fb3196fdd39f5b5ed80b7203503fb9`; tree `d4bbee6c9cfe001b83ec05cc6e8356d3ba14fa65`.


### implementation-0023

[implementation-0023.json](../../events/implementation-0023.json) — implementation / phase-result / blocked. Parent `start-0022`; attempt 8. Source `3f8b679686fb3196fdd39f5b5ed80b7203503fb9`; tree `d4bbee6c9cfe001b83ec05cc6e8356d3ba14fa65`.

One fresh unchanged corrected preflight passed. One pinned production installation succeeded. All authorized read-only postchecks passed. No restart, native launch, pairing, retry, source or tracker change occurred. Whole-ticket acceptance remains blocked.


### start-complete-0024

[start-complete-0024.json](../../events/start-complete-0024.json) — start / phase-complete / blocked. Parent `implementation-0023`; attempt 8. Source `bdaf47d5763fc6013ec66443ae96fc3907b77798`; tree `5b2274210a9f77154fa6774d29c82b23c98c6d86`.


### start-0025

[start-0025.json](../../events/start-0025.json) — start / phase-start / started. Parent `start-complete-0024`; attempt 9. Source `d7f4c61eafd5a1898cff3da85801c61a7c96c4fa`; tree `ca4cd0ea9ffd9e2dfcfd89a3fe73b9b055623cb8`.


### implementation-0026

[implementation-0026.json](../../events/implementation-0026.json) — implementation / phase-result / blocked. Parent `start-0025`; attempt 9. Source `d7f4c61eafd5a1898cff3da85801c61a7c96c4fa`; tree `ca4cd0ea9ffd9e2dfcfd89a3fe73b9b055623cb8`.

Attempt 9 stopped at strict cable preflight. SSH exited 255 with no stdout. No restart or native launch occurred. Installation from attempt 8 remains recorded, but current device identity and preservation are unobserved.


### start-complete-0027

[start-complete-0027.json](../../events/start-complete-0027.json) — start / phase-complete / blocked. Parent `implementation-0026`; attempt 9. Source `15b3cef2cf02987872531fe2c5e25f56525a86d0`; tree `234db279648fbd87c00d71657d86b1d1e46f9b0c`.


### start-0028

[start-0028.json](../../events/start-0028.json) — start / phase-start / started. Parent `start-complete-0027`; attempt 10. Source `f71077758c721908704cc24b0ded0a84d0932571`; tree `04c5d1a4fe8d195dbb7d927ebe51a3e594351178`.


### implementation-0029

[implementation-0029.json](../../events/implementation-0029.json) — implementation / phase-result / blocked. Parent `start-0028`; attempt 10. Source `f71077758c721908704cc24b0ded0a84d0932571`; tree `04c5d1a4fe8d195dbb7d927ebe51a3e594351178`.

Attempt 10 executed exactly one unchanged strict bounded read-only installed-target cable preflight. SSH exited 255 with empty stdout and connection reset/broken pipe. No retry, restart, installation or native observation occurred. Current device identities, retained resources and PID are unobserved; attempt 8 installation remains historical evidence.


## Supporting receipts and artifacts

- **Historical reference:** `063298ca28c8e0c66d74f9bd35122d651df9dd36` (retained as recorded; not resolved to a local path).
- **Historical reference:** `36cec71d9964147ca65246d8c3cf1c29471b7990` (retained as recorded; not resolved to a local path).
- **Historical reference:** `82edbf73a1cc78d61079be62fa97d98eff445ecd` (retained as recorded; not resolved to a local path).
- **Record:** [CONTEXT-MAP.md](../../../../CONTEXT-MAP.md).
- **Record:** [docs/adr/0001-pi-ink-cleanup-trust-boundary.md](../../../../docs/adr/0001-pi-ink-cleanup-trust-boundary.md).
- **Record:** [mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/installation.go](../../../../mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/installation.go).
- **Record:** [mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/production-install.sh](../../../../mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/production-install.sh).
- **Record:** [tracker/initiatives/pi-ink-bridge/index.md](../../../../tracker/initiatives/pi-ink-bridge/index.md).
- **Record:** [tracker/tickets/pi-ink-bridge-02-install-client.md](../../../../tracker/tickets/pi-ink-bridge-02-install-client.md).
- **Record:** [workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0008/findings.json](../../../pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0008/findings.json).
- **Record:** [workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/baseline-fingerprints.json](../../../pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/baseline-fingerprints.json).
- **Record:** [workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/findings.json](../../../pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0014/findings.json).
- **Record:** [workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0020/phase-b-preinstall-guards.json](../../../pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0020/phase-b-preinstall-guards.json).
- **Record:** [workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0023/offline-inputs.json](../../../pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0023/offline-inputs.json).
- **Record:** [workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0023/qmd-native-context-final.json](../../../pi-ink-bridge-01-pen-prototype/artifacts/evidence/implementation-0023/qmd-native-context-final.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/cable-preflight-0028/authorization.json](../evidence/cable-preflight-0028/authorization.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/cable-preflight-0028/markdown-validation.json](../evidence/cable-preflight-0028/markdown-validation.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/cable-preflight-0028/preflight-intent.json](../evidence/cable-preflight-0028/preflight-intent.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/cable-preflight-0028/preflight-outcome.json](../evidence/cable-preflight-0028/preflight-outcome.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/cable-preflight-0028/read-only-preflight.json](../evidence/cable-preflight-0028/read-only-preflight.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/cable-preflight-0028/session-scope.json](../evidence/cable-preflight-0028/session-scope.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/cable-preflight-0028/workflow-inspection.json](../evidence/cable-preflight-0028/workflow-inspection.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-activation-0025/activation-outcome.json](../evidence/device-activation-0025/activation-outcome.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-activation-0025/approval-and-inspection.json](../evidence/device-activation-0025/approval-and-inspection.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-activation-0025/preflight-intent.json](../evidence/device-activation-0025/preflight-intent.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-activation-0025/read-only-preflight.json](../evidence/device-activation-0025/read-only-preflight.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-activation-0025/session-scope.json](../evidence/device-activation-0025/session-scope.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-install-0019/cable-preflight.json](../evidence/device-install-0019/cable-preflight.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-install-0019/corrected-preflight-proposal.json](../evidence/device-install-0019/corrected-preflight-proposal.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-install-0019/corrected-preflight-proposal.sh](../evidence/device-install-0019/corrected-preflight-proposal.sh).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-install-0019/instruction-comparison.json](../evidence/device-install-0019/instruction-comparison.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-install-0019/operation-result.json](../evidence/device-install-0019/operation-result.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-install-0019/trust-preflight.json](../evidence/device-install-0019/trust-preflight.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-install-0022/cable-preflight.json](../evidence/device-install-0022/cable-preflight.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-install-0022/installation-outcome.json](../evidence/device-install-0022/installation-outcome.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-install-0022/operation-result.json](../evidence/device-install-0022/operation-result.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-install-0022/operation-start.json](../evidence/device-install-0022/operation-start.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-install-0022/postcheck-comparison.json](../evidence/device-install-0022/postcheck-comparison.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-install-0022/postcheck-intent.json](../evidence/device-install-0022/postcheck-intent.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-install-0022/preflight-comparison.json](../evidence/device-install-0022/preflight-comparison.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-install-0022/preflight-start.json](../evidence/device-install-0022/preflight-start.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-install-0022/read-only-postcheck.json](../evidence/device-install-0022/read-only-postcheck.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-install-0022/session-scope.json](../evidence/device-install-0022/session-scope.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-install-0022/trust-preflight.json](../evidence/device-install-0022/trust-preflight.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-preflight-0004/cable-preflight.json](../evidence/device-preflight-0004/cable-preflight.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-preflight-0004/compatibility-analysis.json](../evidence/device-preflight-0004/compatibility-analysis.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-preflight-0010/cable-preflight.json](../evidence/device-preflight-0010/cable-preflight.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-preflight-0010/compatibility-analysis.json](../evidence/device-preflight-0010/compatibility-analysis.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-preflight-0010/parent-provenance.json](../evidence/device-preflight-0010/parent-provenance.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/firmware-field-0007/verification.json](../evidence/firmware-field-0007/verification.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/host-20261108-install-001](../evidence/host-20261108-install-001).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/host-20261108-install-001/device-approval-request.json](../evidence/host-20261108-install-001/device-approval-request.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/host-bootstrap-0016/bootstrap-verification.json](../evidence/host-bootstrap-0016/bootstrap-verification.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/host-bootstrap-0016/certificate.pem](../evidence/host-bootstrap-0016/certificate.pem).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/host-bootstrap-0016/installation-approval-request.json](../evidence/host-bootstrap-0016/installation-approval-request.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/host-bootstrap-0016/server.json](../evidence/host-bootstrap-0016/server.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/sidebar-resources-0013/capture-manifest.json](../evidence/sidebar-resources-0013/capture-manifest.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/sidebar-resources-0013/host-validation.json](../evidence/sidebar-resources-0013/host-validation.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/sidebar-resources-0013/installation-proposal.json](../evidence/sidebar-resources-0013/installation-proposal.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/snapshots/launch-start-0001.json](launch-start-0001.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/snapshots/pr-draft-implementation-0002.md](pr-draft-implementation-0002.md).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/snapshots/pr-draft-implementation-0005.md](pr-draft-implementation-0005.md).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/snapshots/pr-draft-implementation-0008.md](pr-draft-implementation-0008.md).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/snapshots/pr-draft-implementation-0011.md](pr-draft-implementation-0011.md).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/snapshots/pr-draft-implementation-0014.md](pr-draft-implementation-0014.md).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/snapshots/pr-draft-implementation-0017.md](pr-draft-implementation-0017.md).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/snapshots/pr-draft-implementation-0020.md](pr-draft-implementation-0020.md).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/snapshots/pr-draft-implementation-0023.md](pr-draft-implementation-0023.md).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/snapshots/pr-draft-implementation-0026.md](pr-draft-implementation-0026.md).
- **Record:** [workflows/pi-ink-bridge-02-install-client/artifacts/snapshots/pr-draft-implementation-0029.md](pr-draft-implementation-0029.md).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/implementation-0002.json](../../events/implementation-0002.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/implementation-0005.json](../../events/implementation-0005.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/implementation-0008.json](../../events/implementation-0008.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/implementation-0011.json](../../events/implementation-0011.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/implementation-0014.json](../../events/implementation-0014.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/implementation-0017.json](../../events/implementation-0017.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/implementation-0020.json](../../events/implementation-0020.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/implementation-0023.json](../../events/implementation-0023.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/implementation-0026.json](../../events/implementation-0026.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/implementation-0029.json](../../events/implementation-0029.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/start-0001.json](../../events/start-0001.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/start-0004.json](../../events/start-0004.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/start-0007.json](../../events/start-0007.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/start-0010.json](../../events/start-0010.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/start-0013.json](../../events/start-0013.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/start-0016.json](../../events/start-0016.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/start-0019.json](../../events/start-0019.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/start-0022.json](../../events/start-0022.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/start-0025.json](../../events/start-0025.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/start-0028.json](../../events/start-0028.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/start-complete-0003.json](../../events/start-complete-0003.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/start-complete-0006.json](../../events/start-complete-0006.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/start-complete-0009.json](../../events/start-complete-0009.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/start-complete-0012.json](../../events/start-complete-0012.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/start-complete-0015.json](../../events/start-complete-0015.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/start-complete-0018.json](../../events/start-complete-0018.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/start-complete-0021.json](../../events/start-complete-0021.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/start-complete-0024.json](../../events/start-complete-0024.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/events/start-complete-0027.json](../../events/start-complete-0027.json).
- **Record:** [workflows/pi-ink-bridge-02-install-client/manifest.yaml](../../manifest.yaml).
- **Record:** [workflows/pi-ink-bridge-02-install-client/projections/implementation-log.md](../../projections/implementation-log.md).
- **Record:** [workflows/pi-ink-bridge-02-install-client/projections/latest-status.yaml](../../projections/latest-status.yaml).
- **Record:** [workflows/pi-ink-bridge-02-install-client/projections/pr-draft.md](../../projections/pr-draft.md).

