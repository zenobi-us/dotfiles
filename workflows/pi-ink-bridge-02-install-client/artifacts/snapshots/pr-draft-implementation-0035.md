---
title: Guarded preflight boundary — attempt 12
type: Report
---

# Guarded preflight failed before first stage — attempt 12

## Outcome
The single approved preflight exited 255 in 0.185829 seconds. Stdout was empty. No signal or timeout occurred. No activation occurred. The ticket remains claimed and BLOCKED.

## Observed boundary
TCP, `dropbear_2025.88`, KEX, existing ED25519 host-key verification, publickey authentication and session channel open succeeded. The client sent the exec request with confirmation requested. No exec acceptance or remote `STAGE=begin` appeared before `Connection reset by peer`. The later disconnect reported `Broken pipe`.

Local stdin debug also reported `Broken pipe`. That line alone is not fatal: attempt11 returned its marker and exit0 after the same local debug. The full command failed here; command-length and server causes remain unproven. Debug echoes of the script are not remote stage output.

## Guard and transport proof
The script was one 15490-byte exec argument, SHA-256 `c700577a24beeeb4ed2cce252ccd8c3ace1f8fb82a1564d64ef0ac033e3528aa`. Removing only the 11 fixed STAGE printf statements reproduces the prior script exactly. All original checks, paths and expected comparisons remain. SSH options changed only by adding `-vvv` and `UpdateHostKeys=no`. The exclusive intent was fsynced before execution. The deadline was 45 seconds. No device script file was staged.

## Verification limits
All fresh model, architecture, IMG_VERSION, stock/native hashes, six owned release identities, exact links, public CA, retained14 identities, original12 QMD inventory and xochitl PID/service values are unobserved. Host comparison did not run because no output arrived. Attempt8 installation proof remains historical. The current desktop host service state is unobserved.

## Operation counts
| Operation | Count |
|---|---:|
| Preflight | 1 |
| Network SSH | 1 |
| Retry | 0 |
| Restart | 0 |
| Installer | 0 |
| Native launch | 0 |
| Device mutation command | 0 |

No private config, credential, notebook or draft content was read. No source, tracker or installed-tool file changed. No builds, tests or formatters ran. The retained private capture was untouched. Raw debug logs remain outside Git in a 0700 directory with 0600 files. The result records raw hashes, redacted transcript integrity and the redaction list.

## Provenance
Frozen source commit `c3ff963a80cf0fd488d08a1cc532e37d85250e91`; tree `8c32b67418cf814c32c0f1ace8c39d3762768e03`. Independent child `w6T:p3`; parent start-0034; attempt12. Workflow and evidence store: repository. Workflow ref: `workflows/pi-ink-bridge-02-install-client`; evidence ref: `workflows/pi-ink-bridge-02-install-client/artifacts/evidence/staged-preflight-0034`.

## Remaining approval
No owner UI action is requested now. Native restart/observation and repeat-install acceptance still need separate approval. Proposed next diagnostic: one bounded read-only SSH invocation that sends this exact guarded script through stdin to `sh -s`, with the same strict trust, markers and deadline. This would distinguish exec-argument transport from script execution; it is not authorized or executed here.

## Evidence
- [Parent start receipt](../../events/start-0034.json)
- [Implementation result and changed paths](../../events/implementation-0035.json)
- [Authorization](../evidence/staged-preflight-0034/authorization.json)
- [Exact intent and equality proof](../evidence/staged-preflight-0034/preflight-intent.json)
- [Execution reservation](../evidence/staged-preflight-0034/execution-start.json)
- [Result and redacted debug transcript](../evidence/staged-preflight-0034/preflight-result.json)
- [Observed boundary and uncertainties](../evidence/staged-preflight-0034/preflight-outcome.json)
- [Session and scope](../evidence/staged-preflight-0034/session-scope.json)
- [Canonical source inspection](../evidence/staged-preflight-0034/workflow-inspection.json)
- [Markdown validation](../evidence/staged-preflight-0034/markdown-validation.json)
- [Prior minimal diagnostic](../evidence/ssh-diagnostic-0031/diagnostic-outcome.json)
- [Historical installation proof](../evidence/device-install-0022/postcheck-comparison.json)

The child pane, workspace, root shell and worktree remain for parent validation and closure. No review, merge or push occurred.

