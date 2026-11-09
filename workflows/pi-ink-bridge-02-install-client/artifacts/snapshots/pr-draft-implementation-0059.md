---
title: Pi Ink client implementation acceptance 0059
type: Report
---

## Implementation accepted — attempt 20

All named ticket criteria have passed. Fresh independent review is next. No review, merge, or push occurred.

### Final repeat-install acceptance

The unchanged pinned production installer ran exactly once and exited 0. Four bounded SSH invocations covered preflight, installation, postcheck, and scoped cleanup. No retries, repairs, restarts, reboots, native launches, pairings, or host-service mutations occurred.

All 29 public SHA-256 hashes, 42 protected metadata records, two exact link targets/inodes, 34 per-file metadata/absence records, and 13 QMD names were preserved. Existing state.json was absent before and after; no private fixtures or contents were exported. Only the three verified public downloads and the empty owned stage were removed.

Boot: `8e816d98-6bf4-4f9e-9abe-891fbf83d06f`. Xochitl: PID `7146`, active/running, NRestarts `0`. The previous native positive proof remains authoritative; no new launch was requested or performed.

### Source and tracker

Production source and pinned payload are unchanged. The canonical ticket now has `work_status: implemented`; triage, blockers, membership, unknown fields, and earlier comments remain intact.

Result source commit: `57491dc0da46ed141e9cb9dbcd6f0c9c02a86744`. Tree: `520dde688e1157a7cef836f9ec8cceb736bb9ea1`. Evidence commit: `f1936b8c125dc3c5ae60c4435304f96400acf708`.

### Supporting records

- [Implementation result](../../events/implementation-0059.json)
- [Native parent receipt](../../events/start-complete-0057.json)
- [Repeat-install acceptance](../evidence/repeat-install-0058/acceptance-summary.json)
- [Preservation proof](../evidence/repeat-install-0058/preservation-verification.json)
- [Cleanup result](../evidence/repeat-install-0058/cleanup-result.json)
- [Operation counts](../evidence/repeat-install-0058/operation-counts.json)

### Verification boundaries

Earlier host typecheck/build, 24 Bun tests/195 assertions, Go race suite, compiled CLI, strict firmware and altered-download rejection, full reboot, and actual native positive proof remain recorded in prior receipts. They were not rerun. No permanent test or source change was needed for this acceptance-only operation.

### Review and merge status

Latest independent verdict: none. Resolved review findings: none. Remaining review findings: none recorded. Fresh independent review remains required; the ticket is not merged or completed.

## Historical workflow record through parent receipt 0057

# Fixed payload and native connection verified
The pinned fixed client is deployed. The owner opened Pi Annotations once, waited at least15 seconds and reported that it stayed open with the server available. A single read-only parent check found clientPID8409 executing the new immutable release with SHA256433d53403a9d3568a00458fe9a02af33813cbdce0489b0b8602693f0ff135051. This is native evidence, not a host-emulator or screenshot claim.

The companion serves buildc5df23c290a5c31886c86d4e1af9a226e7d147007fd5843972919ecaa6d1e356 on58840/58841 after caller exit, with the retained server ID, certificate and bootstrap digest. Port47840 was not contacted or changed. The approved cutover published six new files and replaced only two production links. Old23 public hashes remain unchanged; post-restart29 hashes and42metadata records passed. Old release and private data were not overwritten.

Xochitl restarted once to PID7146, active/running NRestarts0 with all three native dependencies mapped; same boot ID8e816d98-6bf4-4f9e-9abe-891fbf83d06f. No additional full reboot, mod-helper invocation, pairing, repeated launch or installer execution occurred. Owner UI evidence confirms the prior self-close did not occur in this launch; no indefinite-stability claim.

[Parent receipt](../events/start-complete-0057.json), [parent validation](../artifacts/evidence/fixed-client-upgrade-0055/parent-validation.json), [owner observation](../artifacts/evidence/fixed-client-upgrade-0055/parent-native-owner-observation.json), [running native bytes](../artifacts/evidence/fixed-client-upgrade-0055/parent-native-verification-result.json). Frozen inspected source8350b3b4/treef920f4f13d2c6513084c8c0eb0b7e091ea85f66f; child workflow commit1f7ef1d3/tree253ebf07ac9bc444c7d43e3310a5a847290456b0 changed only41workflow files. Child w6T:pA done418 and closed. Retain root shell/workspace/worktree and claim.

## Remaining acceptance
Whole-ticket status remains BLOCKED only on the separately gated identical repeat-install preservation check. No review, merge or push occurred. No restart, full reboot, pairing or extra native launch is needed or authorized for that repeat check. The owned temporary public-download stage /home/root/.local/share/pi-ink-bridge/.upgrade-0055.eQVGWv remains until final proof/authorized scoped cleanup.

## Retained earlier reports
Earlier reports reflect their own observation windows and remain as history.

# Controlled fixed-client upgrade — attempt 19

Record the controlled deployment and hand native acceptance to the parent.
Reader: parent operator. Date: 2026-11-08T23:33:43.185363+00:00.

## Overview

The approved fixed client is deployed. Xochitl restarted once and is ready for the parent’s owner launch. Whole-ticket status remains BLOCKED.

Native launches: 0. Do not treat runtime mappings as native rendering or connection evidence. Parent must explicitly tell the owner to open Pi Annotations once. Repeat-install acceptance remains pending and outside this attempt.

Sections: [Deployment passed](#deployment-passed), [Mutation counts](#mutation-counts), [Evidence and boundaries](#evidence-and-boundaries), [History and review](#history-and-review).

## Deployment passed

The companion remains `global/pi-ink-bridge`, PID2532009, supervised by retained Pitchfork PID1182041. Setup58840 and TLS58841 serve the new runtime `c5df23c290a5c31886c86d4e1af9a226e7d147007fd5843972919ecaa6d1e356` after the helper exits. Server ID, certificate, verified TLS origin, bootstrap bytes and installer bytes remain unchanged. Port47840 remains omp PID20453; no traffic or mutation touched it.

The new immutable release is `/home/root/.local/share/pi-ink-bridge/releases/ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33`. Its six regular files match the pinned manifest. Both production links now target this release. Each rename was individually atomic on filesystem65026; the pair was not atomic. The old six files, unrelated public files, retained QMD names and private metadata remain unchanged. All29 public hashes match.

Boot ID remains `8e816d98-6bf4-4f9e-9abe-891fbf83d06f`. Xochitl changed from PID3641 to PID7146, active/running with NRestarts0. XOVI, AppLoad and qt-resource-rebuilder remain mapped. One bounded read-only observation established readiness; no native client was running.

## Mutation counts

- **Host refresh:** one offline runtime preparation, one service stop, one service start. No supervisor restart or trust rotation.
- **Device cutover:** one exclusive private stage, three downloads, six new release files, one release publication and two production symlink replacements.
- **Device activation:** one Xochitl restart, zero full reboots, zero mod-helper calls and zero native launches.
- **Transport:** four SSH invocations: preflight, upgrade with postcheck, restart and one read-only restart observation.
- **Excluded actions:** zero ordinary-installer runs, repeat installations, pairings, source/tracker edits, retries, rollback, firmware or persistent system-configuration changes.

The retained stage is `/home/root/.local/share/pi-ink-bridge/.upgrade-0055.eQVGWv`. It contains the three verified public downloads; payload and staged links moved to their final locations. No broad cleanup ran. Do not reissue the upgrade or restart.

## Evidence and boundaries

- **Authorization and plan:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/fixed-client-upgrade-0055/authorization.json](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/fixed-client-upgrade-0055/authorization.json), [device-upgrade-plan.json](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/fixed-client-upgrade-0055/device-upgrade-plan.json).
- **Host verification:** [host-refresh-verification.json](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/fixed-client-upgrade-0055/host-refresh-verification.json), [host-final-persistence.json](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/fixed-client-upgrade-0055/host-final-persistence.json).
- **Device verification:** [device-preflight-result.json](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/fixed-client-upgrade-0055/device-preflight-result.json), [device-upgrade-result.json](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/fixed-client-upgrade-0055/device-upgrade-result.json), [device-upgrade-verification.json](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/fixed-client-upgrade-0055/device-upgrade-verification.json).
- **Activation verification:** [xochitl-restart-result.json](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/fixed-client-upgrade-0055/xochitl-restart-result.json), [xochitl-observation-1-result.json](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/fixed-client-upgrade-0055/xochitl-observation-1-result.json), [ready-for-parent.json](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/fixed-client-upgrade-0055/ready-for-parent.json).
- **Exact counts:** [operation-counts.json](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/fixed-client-upgrade-0055/operation-counts.json). Public script bytes, hashes and exact SSH argv are retained alongside the evidence. Config/state/private-key contents were not returned.
- **Source identity:** `8350b3b4769407536219c18c69c3cb8f4e627018` / tree `f920f4f13d2c6513084c8c0eb0b7e091ea85f66f`; unchanged. Bun host bundling was deployment preparation only. No pinned Go/ZIP rebuild, tests, formatter, independent review, merge or push ran.

## History and review

Implementation result: [implementation-0056.json](workflows/pi-ink-bridge-02-install-client/events/implementation-0056.json), parent [start-0055.json](workflows/pi-ink-bridge-02-install-client/events/start-0055.json).

Changed files are workflow evidence, one immutable snapshot, manifest and three current projections only. No source findings were changed. Earlier source fixes and review findings remain in the retained history. No new reviewer verdict exists; no merge or push occurred. Native fixed-client acceptance and repeat-install preservation remain unresolved.

Previous immutable report: [pr-draft-implementation-0053.md](workflows/pi-ink-bridge-02-install-client/artifacts/snapshots/pr-draft-implementation-0053.md). Earlier receipts and immutable snapshots remain unchanged.

<details>
<summary>Earlier report history — superseded current-state assertions</summary>

# Reboot with mods verified
The requested single full reboot and owner-triggered mod activation are complete. Whole-ticket status remains BLOCKED because the fixed payload is not deployed or natively accepted.

Boot ID changed from ca7919b4-52c7-424f-ab79-4a8490465f00 to 8e816d98-6bf4-4f9e-9abe-891fbf83d06f. Xochitl PID3641 is active/running with XOVI, AppLoad and qt-resource-rebuilder mapped. All23 public file hashes and 44 named metadata records match the preflight. No private contents were read.

The child correctly saw no mods during its three earlier observations and recorded a blocked result. After the owner separately confirmed the physical gesture complete, one authorized read-only parent check proved activation. No second reboot, direct helper call, additional Xochitl restart command, deployment or native launch occurred.

[Parent receipt](../events/start-complete-0054.json), [parent validation](../artifacts/evidence/owner-boot-0052/parent-validation.json), [additional check authority](../artifacts/evidence/owner-boot-0052/parent-activation-authorization.json) and [actual runtime evidence](../artifacts/evidence/owner-boot-0052/parent-activation-result.json). Frozen inspected source da7277f2/tree417e0ffbf02efeb2060bf6c8e9ec1deb089ab1cc; child workflow commitba64e4a5/tree53931f343865c1776b76a5036b1f7b0bf7e7e09d. Child w6T:p9 done402 and closed; retain root/workspace/worktree and claim.

## Next boundary
Existing installed client and both old-release launcher links remain unchanged. New ZIP ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33 is host-only. The ordinary installer rejects changed launcher targets; prepare an explicit old-to-new release/two-owned-link upgrade plan. Deployment, native fixed-client acceptance and repeat installation remain pending. No further boot/activation operation is authorized by this completed reboot-only scope. No independent review, merge or push occurred.

## Retained earlier reports
The following reports reflect their earlier observation windows and are preserved as history.

# Owner-assisted reboot attempt 18 — blocked

Canonical ticket: `tracker/tickets/pi-ink-bridge-02-install-client.md`.

## Problem and result

One approved normal full-device reboot completed. Mods-enabled runtime was not proved. Ticket implementation remains BLOCKED.

Owner readiness and temporary activation overrides were already approved. No further readiness approval was requested. The agent did not invoke the mod helper.

## Observed evidence

- **Old boot ID:** `ca7919b4-52c7-424f-ab79-4a8490465f00`.
- **New boot ID:** `8e816d98-6bf4-4f9e-9abe-891fbf83d06f`.
- **Runtime:** Xochitl PID 555, executable `/usr/bin/xochitl`; no XOVI, AppLoad or qt-resource-rebuilder mappings in any return observation.
- **Preservation:** All 23 public hashes, both old-release links and both private-file metadata records match in the preflight and all return observations. Private contents were not read.
- **Return observations:** Three successful SSH reads, finishing 38.28, 73.20 and 103.17 seconds after dispatch. No further observations or reboot retries.

## Implementation and changed files

Workflow evidence only under `workflows/pi-ink-bridge-02-install-client`. No source or tracker changes. One read-only preflight, one `/usr/sbin/reboot` dispatch, three read-only return observations. Zero automatic mod helpers, additional Xochitl restart dispatches, installations, deployments, native launches, pairings, persistent configuration changes or live host-service actions.

The public baseline comparator initially included the private certificate hash. The corrected comparator excludes it and compares private metadata only. No SSH retry occurred.

Inspected source `da7277f2a99969fa7970421e97f25a7d96b6a7f3`, tree `417e0ffbf02efeb2060bf6c8e9ec1deb089ab1cc`. New ZIP `ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33` remains host-only. The installed `03803b9f78398117cf3ca3ed6adcc5719a67d5acb71e75fafbfd818d01685629` release and links remain unchanged.

## Validation

Cable preflight and all three return commands exited 0. New boot ID proves the full reboot. Missing runtime mappings prevent mods-enabled reboot success. No tests, builds or formatters ran; this slice only observed the approved hardware operation.

## Remaining findings and next action

Owner activation is pending/unknown. No evidence proves whether the physical gesture occurred. No automatic activation or further device command is authorized by this exhausted slice. Parent must validate this blocked result and close the child pane. New payload deployment, native retest and repeat-install acceptance remain pending.

## Review and merge status

No new reviewer verdict. No findings resolved by this evidence-only attempt. Not merged; no implementation-done signal.

## Supporting records

- **Start receipt:** [workflows/pi-ink-bridge-02-install-client/events/start-0052.json](workflows/pi-ink-bridge-02-install-client/events/start-0052.json).
- **Result receipt:** [workflows/pi-ink-bridge-02-install-client/events/implementation-0053.json](workflows/pi-ink-bridge-02-install-client/events/implementation-0053.json).
- **Authorization:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/owner-boot-0052/authorization.json](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/owner-boot-0052/authorization.json).
- **Preflight intent:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/owner-boot-0052/preflight-intent.json](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/owner-boot-0052/preflight-intent.json).
- **Public comparison:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/owner-boot-0052/public-preflight-comparison.json](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/owner-boot-0052/public-preflight-comparison.json).
- **Reboot intent:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/owner-boot-0052/reboot-intent.json](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/owner-boot-0052/reboot-intent.json).
- **Reboot result:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/owner-boot-0052/reboot-result.json](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/owner-boot-0052/reboot-result.json).
- **Return evidence:** [workflows/pi-ink-bridge-02-install-client/artifacts/evidence/owner-boot-0052/reboot-outcome.json](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/owner-boot-0052/reboot-outcome.json), with numbered return intents and results.


## Retained prior history

# Reboot-only attempt 17 — blocked before dispatch

Canonical ticket: `tracker/tickets/pi-ink-bridge-02-install-client.md`. Ticket remains claimed; implementation and hardware acceptance remain blocked.

## Problem and decision

The owner approved one full reboot with existing mods enabled, without startup changes or physical owner steps. The single cable preflight completed successfully. It did not establish an eligible mods-enabled full-boot procedure, so no reboot was dispatched.

Current public identity: reMarkable Ferrari, aarch64, IMG_VERSION `3.28.0.172`; boot ID `ca7919b4-52c7-424f-ab79-4a8490465f00`; Xochitl PID `548`. The inspected Xochitl maps contain none of the three named XOVI, AppLoad or qt-resource-rebuilder libraries. The enabled `xovi-tripletap.service` and retained README describe owner triple-press activation after stock boot. The public `/home/root/xovi/start` helper creates tmpfs service overrides, reloads systemd and restarts services. Running it is not an authorized reboot-only operation.

## Validation and preservation

One read-only SSH preflight exited 0 without stderr or timeout. All 23 compared public installed, retained and native-dependency hashes match the previous native-activation preflight. The old payload remains installed. The new framing-fix ZIP `ba36897369a1c89f3299ca87e5b8a4fd9db919116580315095133ac2ffa3cb33` remains host-only.

Operation counts: 1 read-only SSH preflight; 0 reboot dispatches; 0 return checks; 0 Xochitl restarts; 0 installs/deployments; 0 Pi Annotations launches; 0 pairing; 0 live host-service actions; 0 persistent configuration changes. No tests, builds, formatters, screenshots, private content reads or tracker/source edits.

## Remaining prerequisites

The owner must approve a revised boot procedure that includes the physical post-boot triple-press, or identify an existing configuration-free mods-enabled boot interface for a fresh bounded inspection. This attempt does not authorize either. Deployment of the pinned new payload, native retest and repeat-install acceptance still need separately scoped approval. The prior ticket01 blocker is completed; ticket02 stays claimed and blocked on its remaining acceptance.

No new boot ID or post-reboot mod state exists because no reboot occurred. Alternate boot helpers were not exhaustively inspected. No repair or automatic retry occurred. No review verdict, merge, push or implementation-complete marker is asserted. Parent validation and completion remain pending; workspace, pane and root shell remain retained for the parent.

## Supporting records

- [Parent start-0049](workflows/pi-ink-bridge-02-install-client/events/start-0049.json)
- [Implementation result](workflows/pi-ink-bridge-02-install-client/events/implementation-0050.json)
- [Authorization](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-reboot-0049/authorization.json)
- [Child identity](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-reboot-0049/session-scope.json)
- [Exact preflight intent](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-reboot-0049/preflight-intent.json)
- [Preflight execution start](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-reboot-0049/preflight-execution-start.json)
- [Actual preflight result](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-reboot-0049/preflight-result.json)
- [Identity comparison](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-reboot-0049/identity-comparison.json)
- [Guarded reboot outcome](workflows/pi-ink-bridge-02-install-client/artifacts/evidence/device-reboot-0049/reboot-outcome.json)

## Retained full prior history

---
title: Host-only AppLoad framing repair — attempt 16
type: Report
---

# Host-only AppLoad framing repair — attempt 16

## Ticket summary
[tracker/tickets/pi-ink-bridge-02-install-client.md](../../../tracker/tickets/pi-ink-bridge-02-install-client.md). Whole-ticket status: BLOCKED. Held claim retained.

## Problem statement
Pinned AppLoad sends a header and a body record even for empty polls. The old backend left empty records queued and exited on the next header read. Native self-close remains ground truth; its causal relation is not end-to-end verified.

## Implementation summary
Consume every AppLoad body record, including empty SOCK_SEQPACKET records. Packet-aware reads reject truncated headers/bodies and length mismatches. Reused buffers and existing TLS fixture. Host regressions, race suite, vet, compiled CLI smoke and pinned ARM64 rebuild pass. Native acceptance remains blocked.

Fixed source commit `44069f77de3a8c6b5b35d63b9eb1efba791f97cd`; tree `653406595b0cb1a113fd195e371471defc0ca624`. Child `w6T:p7`. Parent completion start-complete-0048 recorded; child closed.

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
Not reviewed, merged or pushed. Parent completion start-complete-0048 recorded and child pane closed. Retain workspace, root shell and worktree.

## Next action
Parent validated this host-only result. Obtain separate exact approval for new-payload deployment and native retest. Repeat-install acceptance needs separate approval. No owner UI action is requested now.

## Operation counts
This attempt: tablet contacts0; SSH0; native launches0; restarts0; installs/deployments0; pairing0; live-service changes0; tracker changes0. Historical device actions remain historical.

## Receipt history
| Receipt | Phase/event | Status | Parent |
| --- | --- | --- | --- |
| [implementation-0002](../events/implementation-0002.json) | implementation/phase-result | blocked | start-0001 |
| [implementation-0005](../events/implementation-0005.json) | implementation/phase-result | blocked | start-0004 |
| [implementation-0008](../events/implementation-0008.json) | implementation/phase-result | blocked | start-0007 |
| [implementation-0011](../events/implementation-0011.json) | implementation/phase-result | blocked | start-0010 |
| [implementation-0014](../events/implementation-0014.json) | implementation/phase-result | blocked | start-0013 |
| [implementation-0017](../events/implementation-0017.json) | implementation/phase-result | blocked | start-0016 |
| [implementation-0020](../events/implementation-0020.json) | implementation/phase-result | blocked | start-0019 |
| [implementation-0023](../events/implementation-0023.json) | implementation/phase-result | blocked | start-0022 |
| [implementation-0026](../events/implementation-0026.json) | implementation/phase-result | blocked | start-0025 |
| [implementation-0029](../events/implementation-0029.json) | implementation/phase-result | blocked | start-0028 |
| [implementation-0032](../events/implementation-0032.json) | implementation/phase-result | blocked | start-0031 |
| [implementation-0035](../events/implementation-0035.json) | implementation/phase-result | blocked | start-0034 |
| [implementation-0038](../events/implementation-0038.json) | implementation/phase-result | blocked | start-0037 |
| [implementation-0041](../events/implementation-0041.json) | implementation/phase-result | blocked | start-0040 |
| [implementation-0044](../events/implementation-0044.json) | implementation/phase-result | blocked | start-0043 |
| [implementation-0047](../events/implementation-0047.json) | implementation/phase-result | blocked | start-0046 |
| [start-0001](../events/start-0001.json) | start/phase-start | started | None |
| [start-0004](../events/start-0004.json) | start/phase-start | started | start-complete-0003 |
| [start-0007](../events/start-0007.json) | start/phase-start | started | start-complete-0006 |
| [start-0010](../events/start-0010.json) | start/phase-start | started | start-complete-0009 |
| [start-0013](../events/start-0013.json) | start/phase-start | started | start-complete-0012 |
| [start-0016](../events/start-0016.json) | start/phase-start | started | start-complete-0015 |
| [start-0019](../events/start-0019.json) | start/phase-start | started | start-complete-0018 |
| [start-0022](../events/start-0022.json) | start/phase-start | started | start-complete-0021 |
| [start-0025](../events/start-0025.json) | start/phase-start | started | start-complete-0024 |
| [start-0028](../events/start-0028.json) | start/phase-start | started | start-complete-0027 |
| [start-0031](../events/start-0031.json) | start/phase-start | started | start-complete-0030 |
| [start-0034](../events/start-0034.json) | start/phase-start | started | start-complete-0033 |
| [start-0037](../events/start-0037.json) | start/phase-start | started | start-complete-0036 |
| [start-0040](../events/start-0040.json) | start/phase-start | started | start-complete-0039 |
| [start-0043](../events/start-0043.json) | start/phase-start | started | start-complete-0042 |
| [start-0046](../events/start-0046.json) | start/phase-start | started | start-complete-0045 |
| [start-complete-0003](../events/start-complete-0003.json) | start/phase-complete | blocked | implementation-0002 |
| [start-complete-0006](../events/start-complete-0006.json) | start/phase-complete | blocked | implementation-0005 |
| [start-complete-0009](../events/start-complete-0009.json) | start/phase-complete | blocked | implementation-0008 |
| [start-complete-0012](../events/start-complete-0012.json) | start/phase-complete | blocked | implementation-0011 |
| [start-complete-0015](../events/start-complete-0015.json) | start/phase-complete | blocked | implementation-0014 |
| [start-complete-0018](../events/start-complete-0018.json) | start/phase-complete | blocked | implementation-0017 |
| [start-complete-0021](../events/start-complete-0021.json) | start/phase-complete | blocked | implementation-0020 |
| [start-complete-0024](../events/start-complete-0024.json) | start/phase-complete | blocked | implementation-0023 |
| [start-complete-0027](../events/start-complete-0027.json) | start/phase-complete | blocked | implementation-0026 |
| [start-complete-0030](../events/start-complete-0030.json) | start/phase-complete | blocked | implementation-0029 |
| [start-complete-0033](../events/start-complete-0033.json) | start/phase-complete | blocked | implementation-0032 |
| [start-complete-0036](../events/start-complete-0036.json) | start/phase-complete | blocked | implementation-0035 |
| [start-complete-0039](../events/start-complete-0039.json) | start/phase-complete | blocked | implementation-0038 |
| [start-complete-0042](../events/start-complete-0042.json) | start/phase-complete | blocked | implementation-0041 |
| [start-complete-0045](../events/start-complete-0045.json) | start/phase-complete | blocked | implementation-0044 |

## Supporting artifacts
- **authorization.json:** [artifacts/evidence/cable-preflight-0028/authorization.json](../artifacts/evidence/cable-preflight-0028/authorization.json).
- **markdown-validation.json:** [artifacts/evidence/cable-preflight-0028/markdown-validation.json](../artifacts/evidence/cable-preflight-0028/markdown-validation.json).
- **parent-validation.json:** [artifacts/evidence/cable-preflight-0028/parent-validation.json](../artifacts/evidence/cable-preflight-0028/parent-validation.json).
- **preflight-intent.json:** [artifacts/evidence/cable-preflight-0028/preflight-intent.json](../artifacts/evidence/cable-preflight-0028/preflight-intent.json).
- **preflight-outcome.json:** [artifacts/evidence/cable-preflight-0028/preflight-outcome.json](../artifacts/evidence/cable-preflight-0028/preflight-outcome.json).
- **read-only-preflight.json:** [artifacts/evidence/cable-preflight-0028/read-only-preflight.json](../artifacts/evidence/cable-preflight-0028/read-only-preflight.json).
- **session-scope.json:** [artifacts/evidence/cable-preflight-0028/session-scope.json](../artifacts/evidence/cable-preflight-0028/session-scope.json).
- **workflow-inspection.json:** [artifacts/evidence/cable-preflight-0028/workflow-inspection.json](../artifacts/evidence/cable-preflight-0028/workflow-inspection.json).
- **activation-outcome.json:** [artifacts/evidence/device-activation-0025/activation-outcome.json](../artifacts/evidence/device-activation-0025/activation-outcome.json).
- **approval-and-inspection.json:** [artifacts/evidence/device-activation-0025/approval-and-inspection.json](../artifacts/evidence/device-activation-0025/approval-and-inspection.json).
- **preflight-intent.json:** [artifacts/evidence/device-activation-0025/preflight-intent.json](../artifacts/evidence/device-activation-0025/preflight-intent.json).
- **read-only-preflight.json:** [artifacts/evidence/device-activation-0025/read-only-preflight.json](../artifacts/evidence/device-activation-0025/read-only-preflight.json).
- **session-scope.json:** [artifacts/evidence/device-activation-0025/session-scope.json](../artifacts/evidence/device-activation-0025/session-scope.json).
- **cable-preflight.json:** [artifacts/evidence/device-install-0019/cable-preflight.json](../artifacts/evidence/device-install-0019/cable-preflight.json).
- **corrected-preflight-proposal.json:** [artifacts/evidence/device-install-0019/corrected-preflight-proposal.json](../artifacts/evidence/device-install-0019/corrected-preflight-proposal.json).
- **corrected-preflight-proposal.sh:** [artifacts/evidence/device-install-0019/corrected-preflight-proposal.sh](../artifacts/evidence/device-install-0019/corrected-preflight-proposal.sh).
- **instruction-comparison.json:** [artifacts/evidence/device-install-0019/instruction-comparison.json](../artifacts/evidence/device-install-0019/instruction-comparison.json).
- **operation-result.json:** [artifacts/evidence/device-install-0019/operation-result.json](../artifacts/evidence/device-install-0019/operation-result.json).
- **trust-preflight.json:** [artifacts/evidence/device-install-0019/trust-preflight.json](../artifacts/evidence/device-install-0019/trust-preflight.json).
- **cable-preflight.json:** [artifacts/evidence/device-install-0022/cable-preflight.json](../artifacts/evidence/device-install-0022/cable-preflight.json).
- **installation-outcome.json:** [artifacts/evidence/device-install-0022/installation-outcome.json](../artifacts/evidence/device-install-0022/installation-outcome.json).
- **operation-result.json:** [artifacts/evidence/device-install-0022/operation-result.json](../artifacts/evidence/device-install-0022/operation-result.json).
- **operation-start.json:** [artifacts/evidence/device-install-0022/operation-start.json](../artifacts/evidence/device-install-0022/operation-start.json).
- **postcheck-comparison.json:** [artifacts/evidence/device-install-0022/postcheck-comparison.json](../artifacts/evidence/device-install-0022/postcheck-comparison.json).
- **postcheck-intent.json:** [artifacts/evidence/device-install-0022/postcheck-intent.json](../artifacts/evidence/device-install-0022/postcheck-intent.json).
- **preflight-comparison.json:** [artifacts/evidence/device-install-0022/preflight-comparison.json](../artifacts/evidence/device-install-0022/preflight-comparison.json).
- **preflight-start.json:** [artifacts/evidence/device-install-0022/preflight-start.json](../artifacts/evidence/device-install-0022/preflight-start.json).
- **read-only-postcheck.json:** [artifacts/evidence/device-install-0022/read-only-postcheck.json](../artifacts/evidence/device-install-0022/read-only-postcheck.json).
- **session-scope.json:** [artifacts/evidence/device-install-0022/session-scope.json](../artifacts/evidence/device-install-0022/session-scope.json).
- **trust-preflight.json:** [artifacts/evidence/device-install-0022/trust-preflight.json](../artifacts/evidence/device-install-0022/trust-preflight.json).
- **cable-preflight.json:** [artifacts/evidence/device-preflight-0004/cable-preflight.json](../artifacts/evidence/device-preflight-0004/cable-preflight.json).
- **compatibility-analysis.json:** [artifacts/evidence/device-preflight-0004/compatibility-analysis.json](../artifacts/evidence/device-preflight-0004/compatibility-analysis.json).
- **cable-preflight.json:** [artifacts/evidence/device-preflight-0010/cable-preflight.json](../artifacts/evidence/device-preflight-0010/cable-preflight.json).
- **compatibility-analysis.json:** [artifacts/evidence/device-preflight-0010/compatibility-analysis.json](../artifacts/evidence/device-preflight-0010/compatibility-analysis.json).
- **parent-provenance.json:** [artifacts/evidence/device-preflight-0010/parent-provenance.json](../artifacts/evidence/device-preflight-0010/parent-provenance.json).
- **verification.json:** [artifacts/evidence/firmware-field-0007/verification.json](../artifacts/evidence/firmware-field-0007/verification.json).
- **host-20261108-install-001:** [artifacts/evidence/host-20261108-install-001](../artifacts/evidence/host-20261108-install-001).
- **device-approval-request.json:** [artifacts/evidence/host-20261108-install-001/device-approval-request.json](../artifacts/evidence/host-20261108-install-001/device-approval-request.json).
- **bootstrap-verification.json:** [artifacts/evidence/host-bootstrap-0016/bootstrap-verification.json](../artifacts/evidence/host-bootstrap-0016/bootstrap-verification.json).
- **certificate.pem:** [artifacts/evidence/host-bootstrap-0016/certificate.pem](../artifacts/evidence/host-bootstrap-0016/certificate.pem).
- **installation-approval-request.json:** [artifacts/evidence/host-bootstrap-0016/installation-approval-request.json](../artifacts/evidence/host-bootstrap-0016/installation-approval-request.json).
- **server.json:** [artifacts/evidence/host-bootstrap-0016/server.json](../artifacts/evidence/host-bootstrap-0016/server.json).
- **artifact-hashes.json:** [artifacts/evidence/host-framing-fix-0046/artifact-hashes.json](../artifacts/evidence/host-framing-fix-0046/artifact-hashes.json).
- **authorization.json:** [artifacts/evidence/host-framing-fix-0046/authorization.json](../artifacts/evidence/host-framing-fix-0046/authorization.json).
- **compiled-cli-smoke.json:** [artifacts/evidence/host-framing-fix-0046/compiled-cli-smoke.json](../artifacts/evidence/host-framing-fix-0046/compiled-cli-smoke.json).
- **go-race-suite.json:** [artifacts/evidence/host-framing-fix-0046/go-race-suite.json](../artifacts/evidence/host-framing-fix-0046/go-race-suite.json).
- **markdown-validation.json:** [artifacts/evidence/host-framing-fix-0046/markdown-validation.json](../artifacts/evidence/host-framing-fix-0046/markdown-validation.json).
- **regression-before.json:** [artifacts/evidence/host-framing-fix-0046/regression-before.json](../artifacts/evidence/host-framing-fix-0046/regression-before.json).
- **self-review.json:** [artifacts/evidence/host-framing-fix-0046/self-review.json](../artifacts/evidence/host-framing-fix-0046/self-review.json).
- **workflow-inspection.json:** [artifacts/evidence/host-framing-fix-0046/workflow-inspection.json](../artifacts/evidence/host-framing-fix-0046/workflow-inspection.json).
- **activation-outcome.json:** [artifacts/evidence/native-activation-0040/activation-outcome.json](../artifacts/evidence/native-activation-0040/activation-outcome.json).
- **authorization.json:** [artifacts/evidence/native-activation-0040/authorization.json](../artifacts/evidence/native-activation-0040/authorization.json).
- **failure-observation-intent.json:** [artifacts/evidence/native-activation-0040/failure-observation-intent.json](../artifacts/evidence/native-activation-0040/failure-observation-intent.json).
- **failure-observation-result.json:** [artifacts/evidence/native-activation-0040/failure-observation-result.json](../artifacts/evidence/native-activation-0040/failure-observation-result.json).
- **host-health-intent.json:** [artifacts/evidence/native-activation-0040/host-health-intent.json](../artifacts/evidence/native-activation-0040/host-health-intent.json).
- **host-health-result.json:** [artifacts/evidence/native-activation-0040/host-health-result.json](../artifacts/evidence/native-activation-0040/host-health-result.json).
- **owner-observation-0001.json:** [artifacts/evidence/native-activation-0040/owner-observation-0001.json](../artifacts/evidence/native-activation-0040/owner-observation-0001.json).
- **owner-observation-0002.json:** [artifacts/evidence/native-activation-0040/owner-observation-0002.json](../artifacts/evidence/native-activation-0040/owner-observation-0002.json).
- **owner-observation-checkpoint.json:** [artifacts/evidence/native-activation-0040/owner-observation-checkpoint.json](../artifacts/evidence/native-activation-0040/owner-observation-checkpoint.json).
- **parent-existing-log-intent.json:** [artifacts/evidence/native-activation-0040/parent-existing-log-intent.json](../artifacts/evidence/native-activation-0040/parent-existing-log-intent.json).
- **parent-existing-log-result.json:** [artifacts/evidence/native-activation-0040/parent-existing-log-result.json](../artifacts/evidence/native-activation-0040/parent-existing-log-result.json).
- **post-restart-status-1.json:** [artifacts/evidence/native-activation-0040/post-restart-status-1.json](../artifacts/evidence/native-activation-0040/post-restart-status-1.json).
- **post-restart-status-2.json:** [artifacts/evidence/native-activation-0040/post-restart-status-2.json](../artifacts/evidence/native-activation-0040/post-restart-status-2.json).
- **post-restart-status-intent.json:** [artifacts/evidence/native-activation-0040/post-restart-status-intent.json](../artifacts/evidence/native-activation-0040/post-restart-status-intent.json).
- **preflight-comparison.json:** [artifacts/evidence/native-activation-0040/preflight-comparison.json](../artifacts/evidence/native-activation-0040/preflight-comparison.json).
- **preflight-execution-start.json:** [artifacts/evidence/native-activation-0040/preflight-execution-start.json](../artifacts/evidence/native-activation-0040/preflight-execution-start.json).
- **preflight-intent.json:** [artifacts/evidence/native-activation-0040/preflight-intent.json](../artifacts/evidence/native-activation-0040/preflight-intent.json).
- **preflight-result.json:** [artifacts/evidence/native-activation-0040/preflight-result.json](../artifacts/evidence/native-activation-0040/preflight-result.json).
- **preservation-metadata-comparison.json:** [artifacts/evidence/native-activation-0040/preservation-metadata-comparison.json](../artifacts/evidence/native-activation-0040/preservation-metadata-comparison.json).
- **preservation-observation.json:** [artifacts/evidence/native-activation-0040/preservation-observation.json](../artifacts/evidence/native-activation-0040/preservation-observation.json).
- **restart-operation-result.json:** [artifacts/evidence/native-activation-0040/restart-operation-result.json](../artifacts/evidence/native-activation-0040/restart-operation-result.json).
- **restart-operation-start.json:** [artifacts/evidence/native-activation-0040/restart-operation-start.json](../artifacts/evidence/native-activation-0040/restart-operation-start.json).
- **session-scope.json:** [artifacts/evidence/native-activation-0040/session-scope.json](../artifacts/evidence/native-activation-0040/session-scope.json).
- **authorization.json:** [artifacts/evidence/native-logs-0043/authorization.json](../artifacts/evidence/native-logs-0043/authorization.json).
- **capture-intent.json:** [artifacts/evidence/native-logs-0043/capture-intent.json](../artifacts/evidence/native-logs-0043/capture-intent.json).
- **capture-result.json:** [artifacts/evidence/native-logs-0043/capture-result.json](../artifacts/evidence/native-logs-0043/capture-result.json).
- **diagnosis.json:** [artifacts/evidence/native-logs-0043/diagnosis.json](../artifacts/evidence/native-logs-0043/diagnosis.json).
- **markdown-validation.json:** [artifacts/evidence/native-logs-0043/markdown-validation.json](../artifacts/evidence/native-logs-0043/markdown-validation.json).
- **parent-framing-analysis.json:** [artifacts/evidence/native-logs-0043/parent-framing-analysis.json](../artifacts/evidence/native-logs-0043/parent-framing-analysis.json).
- **privacy-report.json:** [artifacts/evidence/native-logs-0043/privacy-report.json](../artifacts/evidence/native-logs-0043/privacy-report.json).
- **redacted-excerpt.json:** [artifacts/evidence/native-logs-0043/redacted-excerpt.json](../artifacts/evidence/native-logs-0043/redacted-excerpt.json).
- **workflow-inspection.json:** [artifacts/evidence/native-logs-0043/workflow-inspection.json](../artifacts/evidence/native-logs-0043/workflow-inspection.json).
- **capture-manifest.json:** [artifacts/evidence/sidebar-resources-0013/capture-manifest.json](../artifacts/evidence/sidebar-resources-0013/capture-manifest.json).
- **host-validation.json:** [artifacts/evidence/sidebar-resources-0013/host-validation.json](../artifacts/evidence/sidebar-resources-0013/host-validation.json).
- **installation-proposal.json:** [artifacts/evidence/sidebar-resources-0013/installation-proposal.json](../artifacts/evidence/sidebar-resources-0013/installation-proposal.json).
- **authorization.json:** [artifacts/evidence/ssh-diagnostic-0031/authorization.json](../artifacts/evidence/ssh-diagnostic-0031/authorization.json).
- **diagnostic-intent.json:** [artifacts/evidence/ssh-diagnostic-0031/diagnostic-intent.json](../artifacts/evidence/ssh-diagnostic-0031/diagnostic-intent.json).
- **diagnostic-outcome.json:** [artifacts/evidence/ssh-diagnostic-0031/diagnostic-outcome.json](../artifacts/evidence/ssh-diagnostic-0031/diagnostic-outcome.json).
- **diagnostic-result.json:** [artifacts/evidence/ssh-diagnostic-0031/diagnostic-result.json](../artifacts/evidence/ssh-diagnostic-0031/diagnostic-result.json).
- **markdown-validation.json:** [artifacts/evidence/ssh-diagnostic-0031/markdown-validation.json](../artifacts/evidence/ssh-diagnostic-0031/markdown-validation.json).
- **session-scope.json:** [artifacts/evidence/ssh-diagnostic-0031/session-scope.json](../artifacts/evidence/ssh-diagnostic-0031/session-scope.json).
- **workflow-inspection.json:** [artifacts/evidence/ssh-diagnostic-0031/workflow-inspection.json](../artifacts/evidence/ssh-diagnostic-0031/workflow-inspection.json).
- **authorization.json:** [artifacts/evidence/staged-preflight-0034/authorization.json](../artifacts/evidence/staged-preflight-0034/authorization.json).
- **dropbear-upstream-boundary.json:** [artifacts/evidence/staged-preflight-0034/dropbear-upstream-boundary.json](../artifacts/evidence/staged-preflight-0034/dropbear-upstream-boundary.json).
- **execution-start.json:** [artifacts/evidence/staged-preflight-0034/execution-start.json](../artifacts/evidence/staged-preflight-0034/execution-start.json).
- **markdown-validation.json:** [artifacts/evidence/staged-preflight-0034/markdown-validation.json](../artifacts/evidence/staged-preflight-0034/markdown-validation.json).
- **preflight-intent.json:** [artifacts/evidence/staged-preflight-0034/preflight-intent.json](../artifacts/evidence/staged-preflight-0034/preflight-intent.json).
- **preflight-outcome.json:** [artifacts/evidence/staged-preflight-0034/preflight-outcome.json](../artifacts/evidence/staged-preflight-0034/preflight-outcome.json).
- **preflight-result.json:** [artifacts/evidence/staged-preflight-0034/preflight-result.json](../artifacts/evidence/staged-preflight-0034/preflight-result.json).
- **session-scope.json:** [artifacts/evidence/staged-preflight-0034/session-scope.json](../artifacts/evidence/staged-preflight-0034/session-scope.json).
- **workflow-inspection.json:** [artifacts/evidence/staged-preflight-0034/workflow-inspection.json](../artifacts/evidence/staged-preflight-0034/workflow-inspection.json).
- **authorization.json:** [artifacts/evidence/stdin-preflight-0037/authorization.json](../artifacts/evidence/stdin-preflight-0037/authorization.json).
- **execution-start.json:** [artifacts/evidence/stdin-preflight-0037/execution-start.json](../artifacts/evidence/stdin-preflight-0037/execution-start.json).
- **markdown-validation.json:** [artifacts/evidence/stdin-preflight-0037/markdown-validation.json](../artifacts/evidence/stdin-preflight-0037/markdown-validation.json).
- **preflight-comparison.json:** [artifacts/evidence/stdin-preflight-0037/preflight-comparison.json](../artifacts/evidence/stdin-preflight-0037/preflight-comparison.json).
- **preflight-intent.json:** [artifacts/evidence/stdin-preflight-0037/preflight-intent.json](../artifacts/evidence/stdin-preflight-0037/preflight-intent.json).
- **preflight-outcome.json:** [artifacts/evidence/stdin-preflight-0037/preflight-outcome.json](../artifacts/evidence/stdin-preflight-0037/preflight-outcome.json).
- **preflight-result.json:** [artifacts/evidence/stdin-preflight-0037/preflight-result.json](../artifacts/evidence/stdin-preflight-0037/preflight-result.json).
- **session-scope.json:** [artifacts/evidence/stdin-preflight-0037/session-scope.json](../artifacts/evidence/stdin-preflight-0037/session-scope.json).
- **workflow-inspection.json:** [artifacts/evidence/stdin-preflight-0037/workflow-inspection.json](../artifacts/evidence/stdin-preflight-0037/workflow-inspection.json).
- **launch-start-0001.json:** [artifacts/snapshots/launch-start-0001.json](../artifacts/snapshots/launch-start-0001.json).
- **pr-draft-implementation-0002.md:** [artifacts/snapshots/pr-draft-implementation-0002.md](../artifacts/snapshots/pr-draft-implementation-0002.md).
- **pr-draft-implementation-0005.md:** [artifacts/snapshots/pr-draft-implementation-0005.md](../artifacts/snapshots/pr-draft-implementation-0005.md).
- **pr-draft-implementation-0008.md:** [artifacts/snapshots/pr-draft-implementation-0008.md](../artifacts/snapshots/pr-draft-implementation-0008.md).
- **pr-draft-implementation-0011.md:** [artifacts/snapshots/pr-draft-implementation-0011.md](../artifacts/snapshots/pr-draft-implementation-0011.md).
- **pr-draft-implementation-0014.md:** [artifacts/snapshots/pr-draft-implementation-0014.md](../artifacts/snapshots/pr-draft-implementation-0014.md).
- **pr-draft-implementation-0017.md:** [artifacts/snapshots/pr-draft-implementation-0017.md](../artifacts/snapshots/pr-draft-implementation-0017.md).
- **pr-draft-implementation-0020.md:** [artifacts/snapshots/pr-draft-implementation-0020.md](../artifacts/snapshots/pr-draft-implementation-0020.md).
- **pr-draft-implementation-0023.md:** [artifacts/snapshots/pr-draft-implementation-0023.md](../artifacts/snapshots/pr-draft-implementation-0023.md).
- **pr-draft-implementation-0026.md:** [artifacts/snapshots/pr-draft-implementation-0026.md](../artifacts/snapshots/pr-draft-implementation-0026.md).
- **pr-draft-implementation-0029.md:** [artifacts/snapshots/pr-draft-implementation-0029.md](../artifacts/snapshots/pr-draft-implementation-0029.md).
- **pr-draft-implementation-0032.md:** [artifacts/snapshots/pr-draft-implementation-0032.md](../artifacts/snapshots/pr-draft-implementation-0032.md).
- **pr-draft-implementation-0035.md:** [artifacts/snapshots/pr-draft-implementation-0035.md](../artifacts/snapshots/pr-draft-implementation-0035.md).
- **pr-draft-implementation-0038.md:** [artifacts/snapshots/pr-draft-implementation-0038.md](../artifacts/snapshots/pr-draft-implementation-0038.md).
- **pr-draft-implementation-0041.md:** [artifacts/snapshots/pr-draft-implementation-0041.md](../artifacts/snapshots/pr-draft-implementation-0041.md).
- **pr-draft-implementation-0044.md:** [artifacts/snapshots/pr-draft-implementation-0044.md](../artifacts/snapshots/pr-draft-implementation-0044.md).
- **pr-draft-implementation-0047.md:** [artifacts/snapshots/pr-draft-implementation-0047.md](../artifacts/snapshots/pr-draft-implementation-0047.md).

## Parent reconciliation start-complete-0048
Validated fixed source44069f77 and tree653406595b0cb1a113fd195e371471defc0ca624; later child commit9e9113c7 changed workflow records only. Parent test-only commit5e7c12fa removes exact-error-wording coupling while preserving invalid-frame rejection, disconnect and EOF behavior. The scoped AppLoad race checks passed after that refinement. [Parent validation](../artifacts/evidence/host-framing-fix-0046/parent-validation.json); [parent receipt](../events/start-complete-0048.json).

The old isolated source failed the new empty-poll regression. Fixed full Go race suite and host compiled-CLI smoke passed: four synthetic TLS-verified poll replies, then explicit bounded clean termination. Rebuilt ARM64 ZIP and contained client hashes were independently read and match the [artifact manifest](../artifacts/evidence/host-framing-fix-0046/artifact-hashes.json). Installer/sidebar bytes unchanged. Rebuilt RCC bytes changed, but decoded QML matches unchanged source; no deterministic/native-rendering claim. Parent test-only changes do not change production package bytes.

Closed done child w6T:p7 after completion_seq372; root shell/workspace/worktree and claim retained. Zero tablet contacts, deployment, native launch, restart or live-service changes in this host-fix attempt. Host repair is complete; native acceptance is not. A separate exact-payload deployment/cutover plan and native retest approval are required before device actions. Repeat-install acceptance remains separately gated.



## Parent reconciliation start-complete-0051
Validated [implementation-0050](../events/implementation-0050.json), exact inspected source8e094dec/tree211b1339895438b831df426e19c5606049cded91 and workflow-only result commit4df74bd8/tree2caec0790b641c516ab53c0c174c6615e9657ccc. Independently compared all23 public file hashes against the retained native baseline; no mismatches. The single preflight exited0, without stderr or timeout. Boot IDca7919b4-52c7-424f-ab79-4a8490465f00 and PID548 are preflight observations, not post-reboot proof.

No reboot was dispatched. Named XOVI/AppLoad/rebuilder runtime maps were absent. README documents normal stock boot then owner triple-press to start existing mods. The inspected start helper makes temporary service overrides and restarts configured services; it was not invoked. No exhaustive claim about alternate helpers is made. Owner physical-step readiness is needed for a revised bounded attempt.

Child w6T:p8 completed at sequence394 and closed successfully. Retain root shell, workspace/worktree and held claim. [Parent validation](../artifacts/evidence/device-reboot-0049/parent-validation.json), [new host payload byte check](../artifacts/evidence/device-reboot-0049/parent-payload-preflight.json) and [parent receipt](../events/start-complete-0051.json). No deployment, launch, pairing, restart, persistent configuration change, review, merge or push occurred. Old installed payload remains unchanged. The installer still requires an explicit upgrade plan for changed launcher targets.

## Snapshot metadata validation
Current generated reports have Report frontmatter. The immutable child snapshot pr-draft-implementation-0050.md remains byte-identical. It is readable Markdown, but its missing top-level type field fails OKF metadata validation. That historical metadata defect is not a reboot or device verification result.
</details>
