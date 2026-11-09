---
title: Guarded native activation — attempt 14
type: Report
---

# Guarded native activation — attempt 14

## Ticket summary

Install and launch the production tablet client. Whole-ticket acceptance remains BLOCKED; the claim stays retained.

## Problem statement

Installed identities were verified, but actual native launch acceptance remained untested.

## Implementation summary

The exact 15490-byte stdin guard passed 91/91 host comparisons. Certificate-verified HTTPS health matched the expected public server identity and reported ready. One authorized Xochitl restart succeeded. No source, tracker or global-tool changes occurred.

## Changed files

Only this workflow's authorized parent records, evidence, result receipt, immutable snapshot and generated views changed. The result receipt lists exact paths.

## Validation results

Xochitl PID changed from 7463 to 29794. Two immediate observations and the later post-failure observation show active/running, NRestarts=0. The one restart command returned exit 0. No restart remains authorized.

The owner reported: `i see "PI annotations" launch, it says "checking server connection", some details appear and it closes itself`.

This is a native launch/runtime failure, not acceptance. Exact server identity, connection state and sidebar layout acceptance were not captured. No screenshot was taken. No app was reopened. No exact technical cause is established.

After the owner's observation, no pi-ink-client PID was returned. All 23 release/retained/dependency hashes and all 29 metadata/link comparisons matched the preflight. Owned runtime state was absent. No private configuration, key, token, notebook or draft contents were read. No logs were collected.

Counts: preflight 1; SSH 5; requested restart 1; native launch 1 by owner; host health read 1. Retries, reinstall, pairing, staging, source changes, builds, tests and formatters: 0.

## Review history

No independent review has run. All prior receipts and immutable snapshots remain intact.

## Resolved findings

Fresh installed identity, current host readiness and the one requested Xochitl restart are verified. No automatic Xochitl restarts were observed.

## Remaining findings

The native app closes after briefly displaying details. Cause unknown. Repeat-install preservation remains separately unapproved. Host readiness does not prove tablet LAN reachability. No new owner UI action is requested.

## Latest reviewer verdict

None.

## Merge status

Not reviewed, merged or pushed. Parent reconciliation and child closure are pending. Preserve the root shell, workspace, worktree, release and links.

## Next action

Parent must reconcile this blocked result. Further runtime diagnosis, repair, reopening or repeat-install requires separate scoped approval. Do not restart again.

## Receipt history

| Receipt | Phase/event | Status | Parent |
| --- | --- | --- | --- |
| [start-0001](../../events/start-0001.json) | start/phase-start | started | None |
| [implementation-0002](../../events/implementation-0002.json) | implementation/phase-result | blocked | start-0001 |
| [start-complete-0003](../../events/start-complete-0003.json) | start/phase-complete | blocked | implementation-0002 |
| [start-0004](../../events/start-0004.json) | start/phase-start | started | start-complete-0003 |
| [implementation-0005](../../events/implementation-0005.json) | implementation/phase-result | blocked | start-0004 |
| [start-complete-0006](../../events/start-complete-0006.json) | start/phase-complete | blocked | implementation-0005 |
| [start-0007](../../events/start-0007.json) | start/phase-start | started | start-complete-0006 |
| [implementation-0008](../../events/implementation-0008.json) | implementation/phase-result | blocked | start-0007 |
| [start-complete-0009](../../events/start-complete-0009.json) | start/phase-complete | blocked | implementation-0008 |
| [start-0010](../../events/start-0010.json) | start/phase-start | started | start-complete-0009 |
| [implementation-0011](../../events/implementation-0011.json) | implementation/phase-result | blocked | start-0010 |
| [start-complete-0012](../../events/start-complete-0012.json) | start/phase-complete | blocked | implementation-0011 |
| [start-0013](../../events/start-0013.json) | start/phase-start | started | start-complete-0012 |
| [implementation-0014](../../events/implementation-0014.json) | implementation/phase-result | blocked | start-0013 |
| [start-complete-0015](../../events/start-complete-0015.json) | start/phase-complete | blocked | implementation-0014 |
| [start-0016](../../events/start-0016.json) | start/phase-start | started | start-complete-0015 |
| [implementation-0017](../../events/implementation-0017.json) | implementation/phase-result | blocked | start-0016 |
| [start-complete-0018](../../events/start-complete-0018.json) | start/phase-complete | blocked | implementation-0017 |
| [start-0019](../../events/start-0019.json) | start/phase-start | started | start-complete-0018 |
| [implementation-0020](../../events/implementation-0020.json) | implementation/phase-result | blocked | start-0019 |
| [start-complete-0021](../../events/start-complete-0021.json) | start/phase-complete | blocked | implementation-0020 |
| [start-0022](../../events/start-0022.json) | start/phase-start | started | start-complete-0021 |
| [implementation-0023](../../events/implementation-0023.json) | implementation/phase-result | blocked | start-0022 |
| [start-complete-0024](../../events/start-complete-0024.json) | start/phase-complete | blocked | implementation-0023 |
| [start-0025](../../events/start-0025.json) | start/phase-start | started | start-complete-0024 |
| [implementation-0026](../../events/implementation-0026.json) | implementation/phase-result | blocked | start-0025 |
| [start-complete-0027](../../events/start-complete-0027.json) | start/phase-complete | blocked | implementation-0026 |
| [start-0028](../../events/start-0028.json) | start/phase-start | started | start-complete-0027 |
| [implementation-0029](../../events/implementation-0029.json) | implementation/phase-result | blocked | start-0028 |
| [start-complete-0030](../../events/start-complete-0030.json) | start/phase-complete | blocked | implementation-0029 |
| [start-0031](../../events/start-0031.json) | start/phase-start | started | start-complete-0030 |
| [implementation-0032](../../events/implementation-0032.json) | implementation/phase-result | blocked | start-0031 |
| [start-complete-0033](../../events/start-complete-0033.json) | start/phase-complete | blocked | implementation-0032 |
| [start-0034](../../events/start-0034.json) | start/phase-start | started | start-complete-0033 |
| [implementation-0035](../../events/implementation-0035.json) | implementation/phase-result | blocked | start-0034 |
| [start-complete-0036](../../events/start-complete-0036.json) | start/phase-complete | blocked | implementation-0035 |
| [start-0037](../../events/start-0037.json) | start/phase-start | started | start-complete-0036 |
| [implementation-0038](../../events/implementation-0038.json) | implementation/phase-result | blocked | start-0037 |
| [start-complete-0039](../../events/start-complete-0039.json) | start/phase-complete | blocked | implementation-0038 |
| [start-0040](../../events/start-0040.json) | start/phase-start | started | start-complete-0039 |
| [implementation-0041](../../events/implementation-0041.json) | implementation/phase-result | blocked | start-0040 |

## Supporting evidence

- **activation-outcome:** [activation-outcome.json](../evidence/native-activation-0040/activation-outcome.json)
- **authorization:** [authorization.json](../evidence/native-activation-0040/authorization.json)
- **failure-observation-intent:** [failure-observation-intent.json](../evidence/native-activation-0040/failure-observation-intent.json)
- **failure-observation-result:** [failure-observation-result.json](../evidence/native-activation-0040/failure-observation-result.json)
- **host-health-intent:** [host-health-intent.json](../evidence/native-activation-0040/host-health-intent.json)
- **host-health-result:** [host-health-result.json](../evidence/native-activation-0040/host-health-result.json)
- **owner-observation-0001:** [owner-observation-0001.json](../evidence/native-activation-0040/owner-observation-0001.json)
- **owner-observation-0002:** [owner-observation-0002.json](../evidence/native-activation-0040/owner-observation-0002.json)
- **owner-observation-checkpoint:** [owner-observation-checkpoint.json](../evidence/native-activation-0040/owner-observation-checkpoint.json)
- **post-restart-status-1:** [post-restart-status-1.json](../evidence/native-activation-0040/post-restart-status-1.json)
- **post-restart-status-2:** [post-restart-status-2.json](../evidence/native-activation-0040/post-restart-status-2.json)
- **post-restart-status-intent:** [post-restart-status-intent.json](../evidence/native-activation-0040/post-restart-status-intent.json)
- **preflight-comparison:** [preflight-comparison.json](../evidence/native-activation-0040/preflight-comparison.json)
- **preflight-execution-start:** [preflight-execution-start.json](../evidence/native-activation-0040/preflight-execution-start.json)
- **preflight-intent:** [preflight-intent.json](../evidence/native-activation-0040/preflight-intent.json)
- **preflight-result:** [preflight-result.json](../evidence/native-activation-0040/preflight-result.json)
- **preservation-metadata-comparison:** [preservation-metadata-comparison.json](../evidence/native-activation-0040/preservation-metadata-comparison.json)
- **preservation-observation:** [preservation-observation.json](../evidence/native-activation-0040/preservation-observation.json)
- **restart-operation-result:** [restart-operation-result.json](../evidence/native-activation-0040/restart-operation-result.json)
- **restart-operation-start:** [restart-operation-start.json](../evidence/native-activation-0040/restart-operation-start.json)
- **session-scope:** [session-scope.json](../evidence/native-activation-0040/session-scope.json)

## Earlier result snapshots

- **implementation-0002:** [Snapshot](../../artifacts/snapshots/pr-draft-implementation-0002.md)
- **implementation-0005:** [Snapshot](../../artifacts/snapshots/pr-draft-implementation-0005.md)
- **implementation-0008:** [Snapshot](../../artifacts/snapshots/pr-draft-implementation-0008.md)
- **implementation-0011:** [Snapshot](../../artifacts/snapshots/pr-draft-implementation-0011.md)
- **implementation-0014:** [Snapshot](../../artifacts/snapshots/pr-draft-implementation-0014.md)
- **implementation-0017:** [Snapshot](../../artifacts/snapshots/pr-draft-implementation-0017.md)
- **implementation-0020:** [Snapshot](../../artifacts/snapshots/pr-draft-implementation-0020.md)
- **implementation-0023:** [Snapshot](../../artifacts/snapshots/pr-draft-implementation-0023.md)
- **implementation-0026:** [Snapshot](../../artifacts/snapshots/pr-draft-implementation-0026.md)
- **implementation-0029:** [Snapshot](../../artifacts/snapshots/pr-draft-implementation-0029.md)
- **implementation-0032:** [Snapshot](../../artifacts/snapshots/pr-draft-implementation-0032.md)
- **implementation-0035:** [Snapshot](../../artifacts/snapshots/pr-draft-implementation-0035.md)
- **implementation-0038:** [Snapshot](../../artifacts/snapshots/pr-draft-implementation-0038.md)

