---
purpose: diagnostic-recovery
status: blocked
title: Surf diagnostic recovery review-0029
type: Review
---

# Diagnostic recovery review-0029

## Outcome

Blocked. No acceptance verdict is issued. The retained Surf timeout remains unexplained. The new bounded probes did not reproduce it. No actionable blocking source finding is established. A green diagnostic arm does not erase the failed suite.

## Frozen scope

Ticket: tracker/tickets/collect-evidence-feedback-01-web.md. Initiative: tracker/initiatives/collect-evidence-feedback/index.md. Canonical store: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles. Source worktree: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-01-web. Branch: feature/collect-evidence-feedback-01-web. Base branch: master. Commit: 8c4015418f6b3fee244708d9937e45bb358fc45d. Tree: 28784b1a67c200888c53a947b3b056f2569cccbc. Fixed point: d1e14fdf1ad8820d7d5e5236f10432d5244d5a15. Merge base: 859341b01ef7be474a3128b7f94772aab731c2f7. Timestamp: 2026-11-09T22:28:05.646Z.

This is read-only diagnostic recovery, not a new complete acceptance review. SPEC-R4-001, SPEC-R4-002 and the five earlier fixes remain unchanged. STD-R3-001 and unrelated Playwright failures are outside this diagnostic scope. No source, tests, configuration, generated files or daemon binaries were modified. The source HEAD/tree matched the frozen target before and after the probes. Both source status checks were empty.

Reviewer: fresh Herdr pane w73:p8, workspace w73. Session: /home/zenobius/.omp/agent/sessions/--run-media-zenobius-Store-Projects-Mine-Github-Dotfiles.worktrees-feature-collect-evidence-feedback-01-web--/2026-11-09T22-19-30-126Z_01a1c265-21ce-7572-97d7-5ff7d2670106.jsonl. Caller run: ffc5ae8d-7399-40f8-a68c-7bc6eb536b00. Operation: collect-evidence-feedback-01-web-recovery-0029.

## Retained negative evidence

Canonical fix-0026 and fix-complete-0027 both have status failed. The immutable draft and fix-0026 evidence index explicitly preserve that failure. The only scoped suite returned exit 1: 15 passed, 2 failed, 73 expectations. checks/final-scoped-suite.stderr.log:87–98 shows blocked expected BLOCKED but received FAIL. failed-suite-surf/native/runs/case-blocked.log:1 contains exactly: navigate failed: Error: Request timed out. The sealed case records an operation error at blocked.1. blocked.2 has no observations. These records do not show credential entry.

The separate empty-slug compile fixture lacked required metadata. Its corrected targeted check passed. The new a/a.map and empty-slug focused workflows passed both real drivers. The parent's distinct three-case public smoke also passed. None of these passes closes the Surf suite failure. Earlier Playwright pass-case and approved-space failures remain unexplained and were not rerun.

## Independent axis: execution/resource lifecycle

LifecycleAxis independently inspected the retained logs and source. pipeline.ts:167–186 awaits cases in one owned session. sh.ts:13–24 drains output and awaits child exit. No collector-managed subprocess overlap is established. This does not prove backend resource release.

The preceding capture workflow reports all eight commands complete. Its screenshot took 217 ms. Metadata followed in 105 ms and recorded 2026-11-09T21:39:20.426Z. The sealed run ends approximately 60.4 seconds later. That interval includes other operations; it is not a measured blank-navigation duration.

surf-driver.ts:443–450 first checks native dialogs and live page safety, then calls navigate about:blank. The retained navigate error identifies that reset boundary. surf do at lines 452–455 was not reached. Successful preflight output was discarded. The failed run lacks command timestamps, request IDs, failure-time tab/browser epoch, queue ownership and navigation events. Lifecycle cause remains unknown.

## Independent axis: contract/failure semantics

SemanticsAxis independently inspected the failure classification. surf-driver.ts:448–450 returns attempts: 0 and no records for pre-workflow failure. It marks blocked only for SAFETY STOP. verdict.ts:37–64 maps other driver failures to FAIL. Thus FAIL is legitimate for this transport failure. Expected BLOCKED assumes execution reaches the credential guard. This run stopped earlier.

plan.ts:156–178 detects visible credential prompts. Surf inserts guards before workflow steps, after navigation and before typing. The authored FAIL criterion is not proof that typing occurred. Reclassifying all transport timeouts as BLOCKED would conceal a distinct failure class. The retained evidence does not justify that production change.

## Ranked falsifiable hypotheses

These were shown before the new experiments. None is a causal conclusion.

1. Native navigation completion stalls. Prediction: an actual owned-tab reset fails after dispatch, including without a preceding capture.
2. The preceding capture affects navigation. Prediction: capture→reset fails while a fresh-session reset succeeds.
3. Session targeting changes. Prediction: the owned tab identity differs across reset.

## Probe construction and observations

All commands ran from /tmp with MISE_AUTO_INSTALL=false. Installed Surf and Chrome were used. No mock returned a fabricated timeout. Only newly owned sessions and loopback pages were used. The harness imported the frozen surfDriver directly. It compiled temporary workflows and invoked open, runTest and close. There was no fill step and no credential entry. Credential-page navigation itself reaches the post-navigation safety guard.

First command: MISE_AUTO_INSTALL=false bun /tmp/review-0029-probe.ts. Exit 0, 2.49 seconds. Fresh credential navigation reached SAFETY STOP in 1893 ms, attempts 1. The next capture and aftercapture arms stopped in preflight because the same session remained on the credential page. Those two arms were contaminated and do not validate capture→reset. This negative fixture result is preserved, not counted as a valid comparison.

Corrected comparison command: MISE_AUTO_INSTALL=false bun /tmp/review-0029-probe-matrix.ts. Exit 0, 7.60 seconds. Each arm used a separate owned session. The fresh arm navigated to the credential page. The second arm first completed an owned-page capture, then navigated to the credential page. The assertion requires blocked=true and attempts=1, and rejects a failed predecessor capture. It can return red for the retained pre-workflow timeout. It did not reproduce that timeout. A deterministic or high-rate reproduction is not established.

An external PATH wrapper delegated every command to the unchanged installed Surf executable. It recorded actual command start-to-exit duration, status, output and session identity. No repository executable or native daemon was replaced.

| Measured boundary | Duration ms | Exit | Observation |
|---|---:|---:|---|
| Fresh pre-workflow about:blank reset | 597 | 0 | OK; owned tab 498730754 |
| Capture-arm initial about:blank reset | 566 | 0 | OK; owned tab 498730757 |
| Capture workflow | 1718 | 0 | Real owned-page screenshot completed |
| Post-capture about:blank reset | 612 | 0 | OK; same owned tab 498730757 |
| Fresh credential workflow | 1135 | 1 | SAFETY STOP blocked.1; blocked=true |
| Post-capture credential workflow | 1218 | 1 | SAFETY STOP blocked.1; blocked=true |

The fresh case total was 2012 ms. The capture case total was 2566 ms. The post-capture blocked case total was 2188 ms. The owned server observed /credential in both valid arms. Session close exited 0 in both arms. Owned servers stopped. The initial probe also closed its owned session. No borrowed tab was read or closed.

The simple predecessor-capture hypothesis did not reproduce the failure under these conditions. The observed target did not change in the capture arm. These results do not rule out an intermittent queue, transport, navigation acknowledgement or target-lifecycle failure in the original run.

## Trace protection and limits

Raw originals remain outside the repository under /tmp/review-0029-probe-g8ENWL, /tmp/review-0029-matrix-qZah64 and /tmp/review-0029-native-trace.jsonl. The wrapper's raw session.list response can include unrelated session metadata. It was excluded from this report. Only owned-session command summaries, measured resets and guard outcomes appear here. No tokens, cookies, credentials, private page content or user URLs were copied into this artifact.

The raw failure did not include native request correlation or failure-time browser events. A later green reset cannot recover them. No native scheduler cause is claimed. No old full suite, tests, build, lint or formatter was run. surf doctor returned OK before probing. No tools were installed, browser settings changed, services restarted or killed, remote Git operations performed, or source commits made. This standalone review artifact is not a new evidence run or bundle migration.

Two muxer-router diagnostic-axis launches timed out after 30 seconds before assigning targets. Their retained run records have empty target fields: 07b0679a-d46d-44d9-a1a6-8ecea44188a8 and 85e20cb2-0937-40e7-9ca0-8a81b3aaa2e1. They were not relaunched or treated as completed. Two independent read-only task-tool fallback axes completed instead. Their conclusions remain separate above.

## Findings and next action

No supported actionable blocking source finding. NO ADR: ADR 0001 governs Pi/Ink cleanup trust boundaries and does not establish this Surf transport cause. No production fix is proposed from a speculative cause.

Keep the diagnostic blocked. Obtain a failing-run trace that correlates CLI request start/end, request ID, native queue/resource transitions, extension response, session/tab/browser epoch and navigation completion. Capture only the owned session across the predecessor capture and about:blank reset. Existing logs or an authorized external trace facility must supply that data; this run did not add native instrumentation. A useful next experiment must produce the exact timeout at a repeatable rate or replay a correlated failing trace. Do not repeat the full suite merely to obtain green. Do not retry side-effecting workflows automatically.

## Result delivery prerequisite

The required installed write-result.ts validates every phase=review result at line 92 by requiring SUCCESS or FAILURE, even for status blocked. This recovery explicitly forbids a verdict without usable findings or closed validation prerequisites. The truthful prepared result therefore omits verdict. The mandated writer will be invoked without fabricating one. Its validation guard can prevent the event and transport write. The parent must resolve this protocol conflict before receipt delivery can complete. No manual event or second delivery tool is authorized.

