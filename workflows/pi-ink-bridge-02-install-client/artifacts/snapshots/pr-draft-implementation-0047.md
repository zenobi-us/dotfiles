---
title: Host-only AppLoad framing repair — attempt 16
type: Report
---

# Host-only AppLoad framing repair — attempt 16

## Ticket summary
[tracker/tickets/pi-ink-bridge-02-install-client.md](../../../../tracker/tickets/pi-ink-bridge-02-install-client.md). Whole-ticket status: BLOCKED. Held claim retained.

## Problem statement
Pinned AppLoad sends a header and a body record even for empty polls. The old backend left empty records queued and exited on the next header read. Native self-close remains ground truth; its causal relation is not end-to-end verified.

## Implementation summary
Consume every AppLoad body record, including empty SOCK_SEQPACKET records. Packet-aware reads reject truncated headers/bodies and length mismatches. Reused buffers and existing TLS fixture. Host regressions, race suite, vet, compiled CLI smoke and pinned ARM64 rebuild pass. Native acceptance remains blocked.

Fixed source commit `44069f77de3a8c6b5b35d63b9eb1efba791f97cd`; tree `653406595b0cb1a113fd195e371471defc0ca624`. Child `w6T:p7`. Parent completion pending.

## Changed files
- **Source:** `README.md`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/appload.go`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/tablet-client/appload_test.go`.

## Validation results
- **Old regression:** isolated pre-fix source failed with broken pipe after the first empty poll.
- **Fixed checks:** Go race suite and go vet passed; gofmt completed.
- **Compiled CLI:** four real empty-body polls returned synthetic TLS-verified identity and available/not-paired state. Explicit termination exited0.
- **ARM64 build:** pinned Go1.25.0 and Qt6.8.3; version0.4.0. ZIP members and decoded RCC content verified. Installer/sidebar source bytes unchanged.
- **Cleanup:** original-source copy, host binary, synthetic config/certificate/key and smoke sockets/server removed. Intended ignored dist outputs retained.
- **ZIP SHA256:** `ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33`; 2971444 bytes.
- **Binary SHA256:** `433d53403a9d3568a00458fe9a02af33813cbdce0489b0b8602693f0ff135051`; 7405752 bytes; Linux AArch64.

## Review history
Focused source self-review found no Standards or Spec findings. No independent worktree review has run. Earlier receipts and snapshots remain immutable.

## Resolved findings
The host empty-body framing mismatch is repaired. Truncated records and mismatched body lengths are rejected. Coordinator messages, maximum body size, disconnect and explicit termination are covered.

## Remaining findings
- **Approval boundary:** Separate exact approval is required for deploying this newly pinned payload and native launch retest; no deployment/restart/reopen is authorized here.
- **Approval boundary:** Repeat-install preservation acceptance requires its own approval.
- **Approval boundary:** Native self-close relation to this framing mismatch remains likely, not end-to-end verified.
- **Approval boundary:** Ticket direct blocker pi-ink-bridge-01-pen-prototype remains unchanged.

## Latest reviewer verdict
None. Self-review does not establish an independent verdict.

## Merge status
Not reviewed, merged or pushed. Parent owns phase completion and pane closure. Retain workspace, root shell and worktree.

## Next action
Parent validates this host-only result. Obtain separate exact approval for new-payload deployment and native retest. Repeat-install acceptance needs separate approval. No owner UI action is requested now.

## Operation counts
This attempt: tablet contacts0; SSH0; native launches0; restarts0; installs/deployments0; pairing0; live-service changes0; tracker changes0. Historical device actions remain historical.

## Receipt history
| Receipt | Phase/event | Status | Parent |
| --- | --- | --- | --- |
| [implementation-0002](../../events/implementation-0002.json) | implementation/phase-result | blocked | start-0001 |
| [implementation-0005](../../events/implementation-0005.json) | implementation/phase-result | blocked | start-0004 |
| [implementation-0008](../../events/implementation-0008.json) | implementation/phase-result | blocked | start-0007 |
| [implementation-0011](../../events/implementation-0011.json) | implementation/phase-result | blocked | start-0010 |
| [implementation-0014](../../events/implementation-0014.json) | implementation/phase-result | blocked | start-0013 |
| [implementation-0017](../../events/implementation-0017.json) | implementation/phase-result | blocked | start-0016 |
| [implementation-0020](../../events/implementation-0020.json) | implementation/phase-result | blocked | start-0019 |
| [implementation-0023](../../events/implementation-0023.json) | implementation/phase-result | blocked | start-0022 |
| [implementation-0026](../../events/implementation-0026.json) | implementation/phase-result | blocked | start-0025 |
| [implementation-0029](../../events/implementation-0029.json) | implementation/phase-result | blocked | start-0028 |
| [implementation-0032](../../events/implementation-0032.json) | implementation/phase-result | blocked | start-0031 |
| [implementation-0035](../../events/implementation-0035.json) | implementation/phase-result | blocked | start-0034 |
| [implementation-0038](../../events/implementation-0038.json) | implementation/phase-result | blocked | start-0037 |
| [implementation-0041](../../events/implementation-0041.json) | implementation/phase-result | blocked | start-0040 |
| [implementation-0044](../../events/implementation-0044.json) | implementation/phase-result | blocked | start-0043 |
| [implementation-0047](../../events/implementation-0047.json) | implementation/phase-result | blocked | start-0046 |
| [start-0001](../../events/start-0001.json) | start/phase-start | started | None |
| [start-0004](../../events/start-0004.json) | start/phase-start | started | start-complete-0003 |
| [start-0007](../../events/start-0007.json) | start/phase-start | started | start-complete-0006 |
| [start-0010](../../events/start-0010.json) | start/phase-start | started | start-complete-0009 |
| [start-0013](../../events/start-0013.json) | start/phase-start | started | start-complete-0012 |
| [start-0016](../../events/start-0016.json) | start/phase-start | started | start-complete-0015 |
| [start-0019](../../events/start-0019.json) | start/phase-start | started | start-complete-0018 |
| [start-0022](../../events/start-0022.json) | start/phase-start | started | start-complete-0021 |
| [start-0025](../../events/start-0025.json) | start/phase-start | started | start-complete-0024 |
| [start-0028](../../events/start-0028.json) | start/phase-start | started | start-complete-0027 |
| [start-0031](../../events/start-0031.json) | start/phase-start | started | start-complete-0030 |
| [start-0034](../../events/start-0034.json) | start/phase-start | started | start-complete-0033 |
| [start-0037](../../events/start-0037.json) | start/phase-start | started | start-complete-0036 |
| [start-0040](../../events/start-0040.json) | start/phase-start | started | start-complete-0039 |
| [start-0043](../../events/start-0043.json) | start/phase-start | started | start-complete-0042 |
| [start-0046](../../events/start-0046.json) | start/phase-start | started | start-complete-0045 |
| [start-complete-0003](../../events/start-complete-0003.json) | start/phase-complete | blocked | implementation-0002 |
| [start-complete-0006](../../events/start-complete-0006.json) | start/phase-complete | blocked | implementation-0005 |
| [start-complete-0009](../../events/start-complete-0009.json) | start/phase-complete | blocked | implementation-0008 |
| [start-complete-0012](../../events/start-complete-0012.json) | start/phase-complete | blocked | implementation-0011 |
| [start-complete-0015](../../events/start-complete-0015.json) | start/phase-complete | blocked | implementation-0014 |
| [start-complete-0018](../../events/start-complete-0018.json) | start/phase-complete | blocked | implementation-0017 |
| [start-complete-0021](../../events/start-complete-0021.json) | start/phase-complete | blocked | implementation-0020 |
| [start-complete-0024](../../events/start-complete-0024.json) | start/phase-complete | blocked | implementation-0023 |
| [start-complete-0027](../../events/start-complete-0027.json) | start/phase-complete | blocked | implementation-0026 |
| [start-complete-0030](../../events/start-complete-0030.json) | start/phase-complete | blocked | implementation-0029 |
| [start-complete-0033](../../events/start-complete-0033.json) | start/phase-complete | blocked | implementation-0032 |
| [start-complete-0036](../../events/start-complete-0036.json) | start/phase-complete | blocked | implementation-0035 |
| [start-complete-0039](../../events/start-complete-0039.json) | start/phase-complete | blocked | implementation-0038 |
| [start-complete-0042](../../events/start-complete-0042.json) | start/phase-complete | blocked | implementation-0041 |
| [start-complete-0045](../../events/start-complete-0045.json) | start/phase-complete | blocked | implementation-0044 |

## Supporting artifacts
- **authorization.json:** [artifacts/evidence/cable-preflight-0028/authorization.json](../evidence/cable-preflight-0028/authorization.json).
- **markdown-validation.json:** [artifacts/evidence/cable-preflight-0028/markdown-validation.json](../evidence/cable-preflight-0028/markdown-validation.json).
- **parent-validation.json:** [artifacts/evidence/cable-preflight-0028/parent-validation.json](../evidence/cable-preflight-0028/parent-validation.json).
- **preflight-intent.json:** [artifacts/evidence/cable-preflight-0028/preflight-intent.json](../evidence/cable-preflight-0028/preflight-intent.json).
- **preflight-outcome.json:** [artifacts/evidence/cable-preflight-0028/preflight-outcome.json](../evidence/cable-preflight-0028/preflight-outcome.json).
- **read-only-preflight.json:** [artifacts/evidence/cable-preflight-0028/read-only-preflight.json](../evidence/cable-preflight-0028/read-only-preflight.json).
- **session-scope.json:** [artifacts/evidence/cable-preflight-0028/session-scope.json](../evidence/cable-preflight-0028/session-scope.json).
- **workflow-inspection.json:** [artifacts/evidence/cable-preflight-0028/workflow-inspection.json](../evidence/cable-preflight-0028/workflow-inspection.json).
- **activation-outcome.json:** [artifacts/evidence/device-activation-0025/activation-outcome.json](../evidence/device-activation-0025/activation-outcome.json).
- **approval-and-inspection.json:** [artifacts/evidence/device-activation-0025/approval-and-inspection.json](../evidence/device-activation-0025/approval-and-inspection.json).
- **preflight-intent.json:** [artifacts/evidence/device-activation-0025/preflight-intent.json](../evidence/device-activation-0025/preflight-intent.json).
- **read-only-preflight.json:** [artifacts/evidence/device-activation-0025/read-only-preflight.json](../evidence/device-activation-0025/read-only-preflight.json).
- **session-scope.json:** [artifacts/evidence/device-activation-0025/session-scope.json](../evidence/device-activation-0025/session-scope.json).
- **cable-preflight.json:** [artifacts/evidence/device-install-0019/cable-preflight.json](../evidence/device-install-0019/cable-preflight.json).
- **corrected-preflight-proposal.json:** [artifacts/evidence/device-install-0019/corrected-preflight-proposal.json](../evidence/device-install-0019/corrected-preflight-proposal.json).
- **corrected-preflight-proposal.sh:** [artifacts/evidence/device-install-0019/corrected-preflight-proposal.sh](../evidence/device-install-0019/corrected-preflight-proposal.sh).
- **instruction-comparison.json:** [artifacts/evidence/device-install-0019/instruction-comparison.json](../evidence/device-install-0019/instruction-comparison.json).
- **operation-result.json:** [artifacts/evidence/device-install-0019/operation-result.json](../evidence/device-install-0019/operation-result.json).
- **trust-preflight.json:** [artifacts/evidence/device-install-0019/trust-preflight.json](../evidence/device-install-0019/trust-preflight.json).
- **cable-preflight.json:** [artifacts/evidence/device-install-0022/cable-preflight.json](../evidence/device-install-0022/cable-preflight.json).
- **installation-outcome.json:** [artifacts/evidence/device-install-0022/installation-outcome.json](../evidence/device-install-0022/installation-outcome.json).
- **operation-result.json:** [artifacts/evidence/device-install-0022/operation-result.json](../evidence/device-install-0022/operation-result.json).
- **operation-start.json:** [artifacts/evidence/device-install-0022/operation-start.json](../evidence/device-install-0022/operation-start.json).
- **postcheck-comparison.json:** [artifacts/evidence/device-install-0022/postcheck-comparison.json](../evidence/device-install-0022/postcheck-comparison.json).
- **postcheck-intent.json:** [artifacts/evidence/device-install-0022/postcheck-intent.json](../evidence/device-install-0022/postcheck-intent.json).
- **preflight-comparison.json:** [artifacts/evidence/device-install-0022/preflight-comparison.json](../evidence/device-install-0022/preflight-comparison.json).
- **preflight-start.json:** [artifacts/evidence/device-install-0022/preflight-start.json](../evidence/device-install-0022/preflight-start.json).
- **read-only-postcheck.json:** [artifacts/evidence/device-install-0022/read-only-postcheck.json](../evidence/device-install-0022/read-only-postcheck.json).
- **session-scope.json:** [artifacts/evidence/device-install-0022/session-scope.json](../evidence/device-install-0022/session-scope.json).
- **trust-preflight.json:** [artifacts/evidence/device-install-0022/trust-preflight.json](../evidence/device-install-0022/trust-preflight.json).
- **cable-preflight.json:** [artifacts/evidence/device-preflight-0004/cable-preflight.json](../evidence/device-preflight-0004/cable-preflight.json).
- **compatibility-analysis.json:** [artifacts/evidence/device-preflight-0004/compatibility-analysis.json](../evidence/device-preflight-0004/compatibility-analysis.json).
- **cable-preflight.json:** [artifacts/evidence/device-preflight-0010/cable-preflight.json](../evidence/device-preflight-0010/cable-preflight.json).
- **compatibility-analysis.json:** [artifacts/evidence/device-preflight-0010/compatibility-analysis.json](../evidence/device-preflight-0010/compatibility-analysis.json).
- **parent-provenance.json:** [artifacts/evidence/device-preflight-0010/parent-provenance.json](../evidence/device-preflight-0010/parent-provenance.json).
- **verification.json:** [artifacts/evidence/firmware-field-0007/verification.json](../evidence/firmware-field-0007/verification.json).
- **host-20261108-install-001:** [artifacts/evidence/host-20261108-install-001](../evidence/host-20261108-install-001).
- **device-approval-request.json:** [artifacts/evidence/host-20261108-install-001/device-approval-request.json](../evidence/host-20261108-install-001/device-approval-request.json).
- **bootstrap-verification.json:** [artifacts/evidence/host-bootstrap-0016/bootstrap-verification.json](../evidence/host-bootstrap-0016/bootstrap-verification.json).
- **certificate.pem:** [artifacts/evidence/host-bootstrap-0016/certificate.pem](../evidence/host-bootstrap-0016/certificate.pem).
- **installation-approval-request.json:** [artifacts/evidence/host-bootstrap-0016/installation-approval-request.json](../evidence/host-bootstrap-0016/installation-approval-request.json).
- **server.json:** [artifacts/evidence/host-bootstrap-0016/server.json](../evidence/host-bootstrap-0016/server.json).
- **artifact-hashes.json:** [artifacts/evidence/host-framing-fix-0046/artifact-hashes.json](../evidence/host-framing-fix-0046/artifact-hashes.json).
- **authorization.json:** [artifacts/evidence/host-framing-fix-0046/authorization.json](../evidence/host-framing-fix-0046/authorization.json).
- **compiled-cli-smoke.json:** [artifacts/evidence/host-framing-fix-0046/compiled-cli-smoke.json](../evidence/host-framing-fix-0046/compiled-cli-smoke.json).
- **go-race-suite.json:** [artifacts/evidence/host-framing-fix-0046/go-race-suite.json](../evidence/host-framing-fix-0046/go-race-suite.json).
- **markdown-validation.json:** [artifacts/evidence/host-framing-fix-0046/markdown-validation.json](../evidence/host-framing-fix-0046/markdown-validation.json).
- **regression-before.json:** [artifacts/evidence/host-framing-fix-0046/regression-before.json](../evidence/host-framing-fix-0046/regression-before.json).
- **self-review.json:** [artifacts/evidence/host-framing-fix-0046/self-review.json](../evidence/host-framing-fix-0046/self-review.json).
- **workflow-inspection.json:** [artifacts/evidence/host-framing-fix-0046/workflow-inspection.json](../evidence/host-framing-fix-0046/workflow-inspection.json).
- **activation-outcome.json:** [artifacts/evidence/native-activation-0040/activation-outcome.json](../evidence/native-activation-0040/activation-outcome.json).
- **authorization.json:** [artifacts/evidence/native-activation-0040/authorization.json](../evidence/native-activation-0040/authorization.json).
- **failure-observation-intent.json:** [artifacts/evidence/native-activation-0040/failure-observation-intent.json](../evidence/native-activation-0040/failure-observation-intent.json).
- **failure-observation-result.json:** [artifacts/evidence/native-activation-0040/failure-observation-result.json](../evidence/native-activation-0040/failure-observation-result.json).
- **host-health-intent.json:** [artifacts/evidence/native-activation-0040/host-health-intent.json](../evidence/native-activation-0040/host-health-intent.json).
- **host-health-result.json:** [artifacts/evidence/native-activation-0040/host-health-result.json](../evidence/native-activation-0040/host-health-result.json).
- **owner-observation-0001.json:** [artifacts/evidence/native-activation-0040/owner-observation-0001.json](../evidence/native-activation-0040/owner-observation-0001.json).
- **owner-observation-0002.json:** [artifacts/evidence/native-activation-0040/owner-observation-0002.json](../evidence/native-activation-0040/owner-observation-0002.json).
- **owner-observation-checkpoint.json:** [artifacts/evidence/native-activation-0040/owner-observation-checkpoint.json](../evidence/native-activation-0040/owner-observation-checkpoint.json).
- **parent-existing-log-intent.json:** [artifacts/evidence/native-activation-0040/parent-existing-log-intent.json](../evidence/native-activation-0040/parent-existing-log-intent.json).
- **parent-existing-log-result.json:** [artifacts/evidence/native-activation-0040/parent-existing-log-result.json](../evidence/native-activation-0040/parent-existing-log-result.json).
- **post-restart-status-1.json:** [artifacts/evidence/native-activation-0040/post-restart-status-1.json](../evidence/native-activation-0040/post-restart-status-1.json).
- **post-restart-status-2.json:** [artifacts/evidence/native-activation-0040/post-restart-status-2.json](../evidence/native-activation-0040/post-restart-status-2.json).
- **post-restart-status-intent.json:** [artifacts/evidence/native-activation-0040/post-restart-status-intent.json](../evidence/native-activation-0040/post-restart-status-intent.json).
- **preflight-comparison.json:** [artifacts/evidence/native-activation-0040/preflight-comparison.json](../evidence/native-activation-0040/preflight-comparison.json).
- **preflight-execution-start.json:** [artifacts/evidence/native-activation-0040/preflight-execution-start.json](../evidence/native-activation-0040/preflight-execution-start.json).
- **preflight-intent.json:** [artifacts/evidence/native-activation-0040/preflight-intent.json](../evidence/native-activation-0040/preflight-intent.json).
- **preflight-result.json:** [artifacts/evidence/native-activation-0040/preflight-result.json](../evidence/native-activation-0040/preflight-result.json).
- **preservation-metadata-comparison.json:** [artifacts/evidence/native-activation-0040/preservation-metadata-comparison.json](../evidence/native-activation-0040/preservation-metadata-comparison.json).
- **preservation-observation.json:** [artifacts/evidence/native-activation-0040/preservation-observation.json](../evidence/native-activation-0040/preservation-observation.json).
- **restart-operation-result.json:** [artifacts/evidence/native-activation-0040/restart-operation-result.json](../evidence/native-activation-0040/restart-operation-result.json).
- **restart-operation-start.json:** [artifacts/evidence/native-activation-0040/restart-operation-start.json](../evidence/native-activation-0040/restart-operation-start.json).
- **session-scope.json:** [artifacts/evidence/native-activation-0040/session-scope.json](../evidence/native-activation-0040/session-scope.json).
- **authorization.json:** [artifacts/evidence/native-logs-0043/authorization.json](../evidence/native-logs-0043/authorization.json).
- **capture-intent.json:** [artifacts/evidence/native-logs-0043/capture-intent.json](../evidence/native-logs-0043/capture-intent.json).
- **capture-result.json:** [artifacts/evidence/native-logs-0043/capture-result.json](../evidence/native-logs-0043/capture-result.json).
- **diagnosis.json:** [artifacts/evidence/native-logs-0043/diagnosis.json](../evidence/native-logs-0043/diagnosis.json).
- **markdown-validation.json:** [artifacts/evidence/native-logs-0043/markdown-validation.json](../evidence/native-logs-0043/markdown-validation.json).
- **parent-framing-analysis.json:** [artifacts/evidence/native-logs-0043/parent-framing-analysis.json](../evidence/native-logs-0043/parent-framing-analysis.json).
- **privacy-report.json:** [artifacts/evidence/native-logs-0043/privacy-report.json](../evidence/native-logs-0043/privacy-report.json).
- **redacted-excerpt.json:** [artifacts/evidence/native-logs-0043/redacted-excerpt.json](../evidence/native-logs-0043/redacted-excerpt.json).
- **workflow-inspection.json:** [artifacts/evidence/native-logs-0043/workflow-inspection.json](../evidence/native-logs-0043/workflow-inspection.json).
- **capture-manifest.json:** [artifacts/evidence/sidebar-resources-0013/capture-manifest.json](../evidence/sidebar-resources-0013/capture-manifest.json).
- **host-validation.json:** [artifacts/evidence/sidebar-resources-0013/host-validation.json](../evidence/sidebar-resources-0013/host-validation.json).
- **installation-proposal.json:** [artifacts/evidence/sidebar-resources-0013/installation-proposal.json](../evidence/sidebar-resources-0013/installation-proposal.json).
- **authorization.json:** [artifacts/evidence/ssh-diagnostic-0031/authorization.json](../evidence/ssh-diagnostic-0031/authorization.json).
- **diagnostic-intent.json:** [artifacts/evidence/ssh-diagnostic-0031/diagnostic-intent.json](../evidence/ssh-diagnostic-0031/diagnostic-intent.json).
- **diagnostic-outcome.json:** [artifacts/evidence/ssh-diagnostic-0031/diagnostic-outcome.json](../evidence/ssh-diagnostic-0031/diagnostic-outcome.json).
- **diagnostic-result.json:** [artifacts/evidence/ssh-diagnostic-0031/diagnostic-result.json](../evidence/ssh-diagnostic-0031/diagnostic-result.json).
- **markdown-validation.json:** [artifacts/evidence/ssh-diagnostic-0031/markdown-validation.json](../evidence/ssh-diagnostic-0031/markdown-validation.json).
- **session-scope.json:** [artifacts/evidence/ssh-diagnostic-0031/session-scope.json](../evidence/ssh-diagnostic-0031/session-scope.json).
- **workflow-inspection.json:** [artifacts/evidence/ssh-diagnostic-0031/workflow-inspection.json](../evidence/ssh-diagnostic-0031/workflow-inspection.json).
- **authorization.json:** [artifacts/evidence/staged-preflight-0034/authorization.json](../evidence/staged-preflight-0034/authorization.json).
- **dropbear-upstream-boundary.json:** [artifacts/evidence/staged-preflight-0034/dropbear-upstream-boundary.json](../evidence/staged-preflight-0034/dropbear-upstream-boundary.json).
- **execution-start.json:** [artifacts/evidence/staged-preflight-0034/execution-start.json](../evidence/staged-preflight-0034/execution-start.json).
- **markdown-validation.json:** [artifacts/evidence/staged-preflight-0034/markdown-validation.json](../evidence/staged-preflight-0034/markdown-validation.json).
- **preflight-intent.json:** [artifacts/evidence/staged-preflight-0034/preflight-intent.json](../evidence/staged-preflight-0034/preflight-intent.json).
- **preflight-outcome.json:** [artifacts/evidence/staged-preflight-0034/preflight-outcome.json](../evidence/staged-preflight-0034/preflight-outcome.json).
- **preflight-result.json:** [artifacts/evidence/staged-preflight-0034/preflight-result.json](../evidence/staged-preflight-0034/preflight-result.json).
- **session-scope.json:** [artifacts/evidence/staged-preflight-0034/session-scope.json](../evidence/staged-preflight-0034/session-scope.json).
- **workflow-inspection.json:** [artifacts/evidence/staged-preflight-0034/workflow-inspection.json](../evidence/staged-preflight-0034/workflow-inspection.json).
- **authorization.json:** [artifacts/evidence/stdin-preflight-0037/authorization.json](../evidence/stdin-preflight-0037/authorization.json).
- **execution-start.json:** [artifacts/evidence/stdin-preflight-0037/execution-start.json](../evidence/stdin-preflight-0037/execution-start.json).
- **markdown-validation.json:** [artifacts/evidence/stdin-preflight-0037/markdown-validation.json](../evidence/stdin-preflight-0037/markdown-validation.json).
- **preflight-comparison.json:** [artifacts/evidence/stdin-preflight-0037/preflight-comparison.json](../evidence/stdin-preflight-0037/preflight-comparison.json).
- **preflight-intent.json:** [artifacts/evidence/stdin-preflight-0037/preflight-intent.json](../evidence/stdin-preflight-0037/preflight-intent.json).
- **preflight-outcome.json:** [artifacts/evidence/stdin-preflight-0037/preflight-outcome.json](../evidence/stdin-preflight-0037/preflight-outcome.json).
- **preflight-result.json:** [artifacts/evidence/stdin-preflight-0037/preflight-result.json](../evidence/stdin-preflight-0037/preflight-result.json).
- **session-scope.json:** [artifacts/evidence/stdin-preflight-0037/session-scope.json](../evidence/stdin-preflight-0037/session-scope.json).
- **workflow-inspection.json:** [artifacts/evidence/stdin-preflight-0037/workflow-inspection.json](../evidence/stdin-preflight-0037/workflow-inspection.json).
- **launch-start-0001.json:** [artifacts/snapshots/launch-start-0001.json](launch-start-0001.json).
- **pr-draft-implementation-0002.md:** [artifacts/snapshots/pr-draft-implementation-0002.md](pr-draft-implementation-0002.md).
- **pr-draft-implementation-0005.md:** [artifacts/snapshots/pr-draft-implementation-0005.md](pr-draft-implementation-0005.md).
- **pr-draft-implementation-0008.md:** [artifacts/snapshots/pr-draft-implementation-0008.md](pr-draft-implementation-0008.md).
- **pr-draft-implementation-0011.md:** [artifacts/snapshots/pr-draft-implementation-0011.md](pr-draft-implementation-0011.md).
- **pr-draft-implementation-0014.md:** [artifacts/snapshots/pr-draft-implementation-0014.md](pr-draft-implementation-0014.md).
- **pr-draft-implementation-0017.md:** [artifacts/snapshots/pr-draft-implementation-0017.md](pr-draft-implementation-0017.md).
- **pr-draft-implementation-0020.md:** [artifacts/snapshots/pr-draft-implementation-0020.md](pr-draft-implementation-0020.md).
- **pr-draft-implementation-0023.md:** [artifacts/snapshots/pr-draft-implementation-0023.md](pr-draft-implementation-0023.md).
- **pr-draft-implementation-0026.md:** [artifacts/snapshots/pr-draft-implementation-0026.md](pr-draft-implementation-0026.md).
- **pr-draft-implementation-0029.md:** [artifacts/snapshots/pr-draft-implementation-0029.md](pr-draft-implementation-0029.md).
- **pr-draft-implementation-0032.md:** [artifacts/snapshots/pr-draft-implementation-0032.md](pr-draft-implementation-0032.md).
- **pr-draft-implementation-0035.md:** [artifacts/snapshots/pr-draft-implementation-0035.md](pr-draft-implementation-0035.md).
- **pr-draft-implementation-0038.md:** [artifacts/snapshots/pr-draft-implementation-0038.md](pr-draft-implementation-0038.md).
- **pr-draft-implementation-0041.md:** [artifacts/snapshots/pr-draft-implementation-0041.md](pr-draft-implementation-0041.md).
- **pr-draft-implementation-0044.md:** [artifacts/snapshots/pr-draft-implementation-0044.md](pr-draft-implementation-0044.md).
- **pr-draft-implementation-0047.md:** [artifacts/snapshots/pr-draft-implementation-0047.md](pr-draft-implementation-0047.md).
