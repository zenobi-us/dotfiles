---
schema: worktree-artifact/v1
kind: pr-draft
---
# collect-evidence-feedback-02-tui

## Status

Implementation acceptance passed in attempt 2. Parent completion passed. Independent review is pending. No merge, push, publication or ticket completion occurred.

## Ticket summary and problem

The [canonical ticket](../../../tracker/tickets/collect-evidence-feedback-02-tui.md) requires real native TUI pixels from the controlled terminal. A matching text buffer cannot prove colour, line spacing or a current frame.

## Implementation

Preserved the original Plan/Driver implementation. Real native exercise found that single-block Tesseract OCR discarded readable sparse terminal text beside tmux padding. Changed native OCR to sparse-text mode. Kept native capture, stable-frame checks, dimensions, RGB probes, spacing and credential checks intact. Added an opt-in public regression with a genuine delayed terminal frame. Updated the playbook and capability claims only after actual image inspection.

Frozen implementation: d87d03613efcfbd9ff1b079d9cb90b8c6ca905b7, tree a5b300690ed096e654cc23f777377fc501304c72. Prior final source: 621ebb571da6a30274ed8b2cab387936f5d8dd02, tree a7d660233d6cf7a65297571a0f2273a57eba4270. The result receipt records the final HEAD including workflow artifacts.

## Changed files

- mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json
- mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/SKILL.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/references/tui.md
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/tui-driver.ts
- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts

The commit hook updated the developer bundle version to 0.2.15 in both metadata files. Attempt 1's complete changed-file list remains in its [immutable draft](../artifacts/snapshots/pr-draft-implementation-0002.md).

## Validation

- **Native transition:** transition-02 passed both real PNG assertions. Inspected Ready screen and Details screen after a 1.5 second Loading screen. Both images are 1280 × 720. RGB probes matched. Text tops 11/31 px confirm 20 px spacing. Native media hashes and terminal/display identities match.
- **Safety stops:** unapproved-01 and credential-01 returned exit 3 and BLOCKED before forbidden input. The fixture recorded only approved n and c inputs.
- **Interruption:** SIGINT returned exit 1. No interrupt run was sealed. Owned runtime disappeared. The borrowed session retained pane PID 2220414.
- **Common consumers:** validate, verdicts, report and comment passed. All four retained native runs validate after byte-preserving copies from the temporary resolved store.
- **Regression suite:** 102 passed, three opt-in browser checks skipped, zero failed. The real native opt-in check ran.
- **Static-tool limit:** TypeScript/LSP remains unavailable. No compiler check is claimed.

[Exact validation](../artifacts/snapshots/validation-implementation-0005.json). [Actual passing native run](../artifacts/evidence/transition-02/run.json). [Initial native OCR failure](../artifacts/evidence/transition-01/run.json). [Unapproved-input stop](../artifacts/evidence/unapproved-01/run.json). [Credential stop](../artifacts/evidence/credential-01/run.json). [Incomplete interruption diagnostics](../artifacts/snapshots/interrupted-implementation-0005/).

## Review history and findings

No review or fix phase ran. No reviewer verdict exists. Resolved runtime defect: native sparse OCR. No native acceptance blocker remains. Private headless capture, host-specific font metrics and unavailable native video remain explicit limits. The original tmux border and unused-area dots remain in the pixels; no cropping or reconstruction occurred.

## Recovery and prior history

Attempt 1 [implementation-0002](../events/implementation-0002.yaml) was blocked by missing tools. Parent [start-0003](../events/start-0003.yaml) retained that outcome. Parent [start-0004](../events/start-0004.yaml) authorized this fresh takeover after [separate provisioning](../artifacts/snapshots/provisioning-start-0004.json). Existing source, dirty workflow outputs and older artifacts remain intact. The claim was not changed.

Prior web coverage gaps remain unchanged: Playwright Chrome is absent; Surf expected Submitted and observed Not submitted. Neither web driver changed, and those failed checks were not rerun. The historical [web diagnostic](../artifacts/evidence/controlled/run.json) is not native proof.

## Approval and ownership

Parent approved the bounded local fixture and private resources. Exact command, cwd and input step IDs are recorded in the plan and validation snapshot. No credential entry, remote Git operation, installation or graphics-version override occurred during capture. Native images were collected before commits. Publication remains separate and unapproved.

## Handoff

Child terminal t4z, parent t4t, run a9b3db3b-2456-4b2a-ad85-babd66c2428b. [Result receipt](../events/implementation-0005.yaml). Parent verified and acknowledged the result and closed child terminal t4z. [Parent acceptance](../events/implementation-0006.yaml) records clean review target 68acd4074c636933fdf5e8645a09d1acf6abdf67 and its workflow-only advance. Keep the source worktree.
