---
title: Identical stdin preflight — attempt 13
type: Report
---

# Identical stdin preflight — attempt 13

## Ticket summary
Install and launch the tablet client. The claim is retained. Whole-ticket acceptance remains BLOCKED.

## Problem statement
The prior full exec argument reset before remote output. This attempt changes only script delivery to stdin for `sh -s`.

## Implementation summary
One authorized read-only SSH call passed. Exact script: 15490 UTF-8 bytes, SHA-256 `c700577a24beeeb4ed2cce252ccd8c3ace1f8fb82a1564d64ef0ac033e3528aa`. All guards and strict trust settings remained unchanged. The script ran from stdin, without a device staging file.

## Changed files
Only authorized parent records, this workflow's new evidence, result receipt, snapshot, manifest and projections. No source, tracker or installed-tool changes. The result receipt lists all paths.

## Validation results
Exit0 in 1.622440s; stdout9513 bytes; verbose stderr20151 bytes. No timeout or signal. Exec accepted; all11 fixed stages arrived through `STAGE=complete`. All91 host comparisons passed. The complete original postcheck matched after ignoring only fixed stage lines.

The model is reMarkable Ferrari; architecture aarch64; IMG_VERSION3.28.0.172. Six release files, both exact links, public CA hash, private metadata, all14 retained hashes/metadata and original12 QMDs plus the sole production addition matched. All ancestor/root-owner/private-mode and native dependency checks passed. Root `/` required metadata only, not writable status.

Xochitl PID remains7463. Service xochitl.service is loaded, active/running, MainPID7463, NRestarts0, with the stock executable and unit path. Private config contents were not read. Raw debug remains private outside Git; the evidence contains a redacted transcript and raw/redacted hashes.

Counts: SSH1, preflight1; retries0, restarts0, installers0, native launches0, pairing0, staging files0. No builds, tests or formatters ran.

## Review history
No independent review has run. Prior receipts and snapshots remain unchanged.

## Resolved findings
Fresh installed identities and preservation now match the retained expectations. The short exec command accepted the exact script on stdin.

## Remaining findings
Native restart/launch observation and repeat-install acceptance remain unapproved and unperformed. Current desktop host service state remains unverified. Stdin success supports the oversized exec hypothesis, but the tablet Dropbear compiled limit and exact prior server cause remain unconfirmed.

## Latest reviewer verdict
None.

## Merge status
Not reviewed, merged or pushed. Child w6T:p4 remains open for parent validation and closure. Parent owns phase completion.

## Proposed separate next action
Seek owner approval for saved/closed documents, one Xochitl restart and bounded native observation. Repeat-install acceptance needs separate approval. Do not request tablet UI selection yet.

## Supporting evidence
- **Result receipt:** [implementation-0038](../../events/implementation-0038.json)
- **Parent receipt:** [start-0037](../../events/start-0037.json)
- **authorization:** [authorization.json](../evidence/stdin-preflight-0037/authorization.json)
- **execution-start:** [execution-start.json](../evidence/stdin-preflight-0037/execution-start.json)
- **preflight-comparison:** [preflight-comparison.json](../evidence/stdin-preflight-0037/preflight-comparison.json)
- **preflight-intent:** [preflight-intent.json](../evidence/stdin-preflight-0037/preflight-intent.json)
- **preflight-outcome:** [preflight-outcome.json](../evidence/stdin-preflight-0037/preflight-outcome.json)
- **preflight-result:** [preflight-result.json](../evidence/stdin-preflight-0037/preflight-result.json)
- **session-scope:** [session-scope.json](../evidence/stdin-preflight-0037/session-scope.json)
- **workflow-inspection:** [workflow-inspection.json](../evidence/stdin-preflight-0037/workflow-inspection.json)

