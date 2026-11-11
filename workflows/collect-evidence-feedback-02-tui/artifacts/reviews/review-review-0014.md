---
kind: review
schema: worktree-artifact/v1
title: Independent native TUI review
type: Review
verdict: FAILURE
---

# Independent native TUI review

This review lets the parent decide whether the frozen native terminal slice meets its contract.

Reader: worktree workflow owner. Timestamp: 2026-11-11T12:21:54Z. Attempt: 2. Result: review-0014.

## Verdict

FAILURE. One blocking Spec finding remains. Standards has one non-blocking rule violation. Do not merge this frozen source as reviewed-successful.

## Scope

Canonical ticket: `tracker/tickets/collect-evidence-feedback-02-tui.md`. Complete specification: `tracker/initiatives/collect-evidence-feedback/index.md`.

Source branch: `feature/collect-evidence-feedback-02-tui`. Base branch: `master`.

Frozen commit: `acca2d29294e8c60bf8a97d0b98dbdbb4bb095aa`. Frozen tree: `1c5b4864e098d70b53519051d2df6d05184f5729`.

Observed master: `ca6bb1af1b2a8b3e654a91a0491f3366851115fe`. Merge-base: `dee00b4124b8f4b442b8774449018308a57e32b1`.

Comparison: `git diff master...HEAD -- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence`, plus plugin version metadata. Reviewed the full ticket slice, not unrelated changes on master. Neither existing web driver changed. Reviewed native driver, plan validation, common pipeline, records, rendering, CLI integration, tests and playbook.

Read base fix-0011/fix-0012, review-0008, review-0013, latest `pr-draft-fix-0011-final.md`, canonical ticket and initiative, CONTEXT-MAP.md, domain configuration and ADR index. ADR 0001 concerns Pi Ink device cleanup, not this collector. Findings therefore use NO ADR. No source, ticket or projection edits occurred.

Two axis launches rejected duplicate source-workspace placement safely. The parent explicitly authorized `/tmp` as the axis working directory. Fresh independent sessions read the explicit frozen source path. Existing source workspaces and terminal t5c remained intact. Both axis results passed delivery verification and acknowledgement. Only the axis terminals were closed.

## Standards

Fresh axis: `aecbeeac-15be-47fa-9def-7bce383db594`, terminal `t5f`.

No blocking findings. Reviewed master...HEAD at the frozen commit/tree. Read the complete ticket, initiative, applicable agent rules, SKILL.md and evidence-schema.md.

### STD-01 — Low — NO ADR — Non-blocking

Location: `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts:118`.

The generated grim shim contains shell `case` logic. The documented Scripts rule in `mise/conf.d/devtools-agent/AGENTS.md` requires TypeScript/Bun and limits shell to a one-line wrapper. This is a documented-standard breach, not a smell judgement. The parent checked the cited rule.

Required change: replace the failure-injection shell script with a Bun TypeScript executable. Preserve doctor pass-through and collection capture failure.

Validation command: `RUN_NATIVE_EVIDENCE_TESTS=1 mise exec -- bun test <absolute-installed-skill>/scripts/browser-evidence/test/native-workflow.test.ts -t 'preserves capture outcomes'`, with the prepared native-tools PATH.

Judgement-call smells: no material finding. The existing Plan/Driver boundary remains the shared abstraction. No new generic layer or web-driver fork appeared. Native checks preserve native pixels and keep assertions separate from capture status.

Historical STD-01/STD-02 from review-0008 are separate findings. Current code classifies native capture failure and registers diagnostics before preconditions. The isolated capture regression and full-suite precondition regression passed. The full-suite capture timeout remains a validation limit below.

## Spec

Fresh axis: `f4a1f632-80fa-477c-9fb7-2860ed6b47d3`, terminal `t5d`.

One blocking specification finding. Native prerequisites, terminal/display binding, synchronization, image assertions, records, validation, cleanup and playbook otherwise match the scoped requirements inspected. The parent supplied runtime proof for the finding below.

### SPEC-01 — P2 — NO ADR — Blocking

Location: `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/tui-driver.ts:161-169`. Related callers: lines 35, 120 and 125.

Requirement: initiative Capture drivers and safe operation decision 38 states, “Stop an affected case when a credential prompt or an unapproved operation appears.” Story 19 requires stopping when “an unapproved confirmation appears”.

Unexpected confirmations are checked only when `beforeInput=true`. Preconditions, wait and expect omit that flag. An unapproved prompt can therefore remain in a captured screen and receive PASS if the expected heading and image probes still match. This blocks completion because PASS does not identify the required safety stop.

The parent reproduced this through the actual public CLI. A harmless owned fixture showed `Ready screen`, `Selected item`, the purple bar, and `Delete files? [y/N]`. The plan contained only one expect step and no approved input IDs. The command exited 0; verdicts returned PASS; validate succeeded. The case recorded assertionResult=passed, no errors and released owned resources. The original PNG visibly contains the unapproved prompt. Its SHA-256 is `7500ec5ac44ceca863bb412bf508b8de9b6fb19e47fd330aa0f73ad328994fca`.

Required change: check unapproved confirmations on every inspected native screen, including preconditions, waits and assertions. Permit a prompt only when the approved operation explicitly covers it. Return exit 3/BLOCKED for this fixture. Preserve native diagnostics and owned cleanup. Keep explicitly approved prompt behavior working.

Validation command: `RUN_NATIVE_EVIDENCE_TESTS=1 mise exec -- bun test <absolute-installed-skill>/scripts/browser-evidence/test/native-workflow.test.ts`. Add a public expect-only unexpected-prompt case. Require exit 3/BLOCKED, no submitted input, retained diagnostics and owned cleanup.

Reproduction uses the existing public native transition fixture and common init/render/compile/run/validate/verdicts commands. Add this harmless line after its purple bar: `process.stdout.write('\x1b[0m\r\nDelete files? [y/N]\r\n')`. Keep only the Ready expect step, set `approval.confirmations=[]`, and use line probes `{text:'Ready screen',top:11}` and `{text:'Selected',top:31}`. Keep the 1280×720 dimensions and RGB [201,166,255] probe at (10,55). Sparse OCR splits the second word of `Selected item` in this fixture; the `Selected` probe still verifies its actual second-line position. Use a new run identity.

Historical SPEC-1's before-input retained-heading scenario now blocks in the native regression. Historical SPEC-2's capture failure separation passed in isolation. SPEC-01 covers a different remaining path: no input follows the unexpected prompt.

## Validation

Commands ran from `/tmp` unless stated otherwise. `<source>` means the frozen source worktree. `<skill>` means `<source>/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence`. Native commands used `PATH=/home/zenobius/.local/share/collect-evidence/native-tools/fedora-45-x86_64/bin:$PATH`.

- **Common regressions:** `mise exec -- bun test <skill>/scripts/browser-evidence/test/workflow.test.ts <skill>/scripts/browser-evidence/test/verdict.test.ts`, from source. Result: 99 pass, 0 fail, 892 assertions.
- **Native public regressions:** `RUN_NATIVE_EVIDENCE_TESTS=1 mise exec -- bun test <skill>/scripts/browser-evidence/test/native-workflow.test.ts`. Result: 5 pass, 1 fail, 37 assertions. Capture scenario timed out after 60000ms; Bun reported one killed dangling process. Root cause remains unconfirmed. This is not a clean full-suite pass.
- **Isolated capture regression:** same command with `-t 'preserves capture outcomes'`. Result: 1 pass, 0 fail, 5 assertions, 1.95 seconds. The isolated pass does not erase the full-suite timeout.
- **Public positive smoke:** `<skill>/scripts/collect-evidence.ts doctor --driver tui --json`, then `init`, `render`, `compile`, `run`, `validate`, `verdicts` and `report` against a temporary resolved repository store. Every command exited 0. Delayed Ready→Loading→Details transition returned PASS. No installation or remote Git command ran during capture.
- **Original image inspection:** inspected both actual 1280×720 PNGs. Ready and Details differ visibly. The selected-item line sits 20px below the heading. Purple bar RGB and spacing remain native. Hashes: Ready `2493a3a4e51d475e6f0bac03014d1c51e4e182d9526a78c6de677aa4cdbf5a6f`; Details `b6c7cd3ce3061d69feb27c979bf960ed49c44f411734afb9219626e3aeb8ca5a`. Public validate verified original hashes and sealed inventory. Both assets identify the same owned terminal/display; cleanup is released.
- **Public safety smoke:** expect-only prompt fixture described in SPEC-01. `run` exited 0 and `verdicts` returned PASS instead of required BLOCKED. `validate` exited 0. Inspected the original prompt PNG, not a reconstruction. No input was sent. An earlier fixture invocation used the wrong executable and failed to settle; it is not evidence for the finding. A second attempt failed only its full second-line OCR probe; the final valid two-line probe reproduced PASS.
- **Retained evidence:** public `validate <run> --json` returned 0 for base runs fix-transition-0011, fix-unexpected-0011, fix-precondition-0011, fix-capture-0011, credential-01 and unapproved-01. These retained records are historical, not new execution claims.
- **Source identity:** before and after review, `git status --porcelain=v1` was empty and `git rev-parse HEAD HEAD^{tree}` matched the frozen identity. No compiler success is claimed; the earlier TypeScript prerequisite was unavailable.

Only this review artifact and review-0014 phase-result are new durable workflow records. Temporary smoke fixtures used an external owned directory and harmless inputs. Retained base evidence remains unchanged. Parent owns ticket recording and workflow completion. No fix, commit, push, merge, publication or goal dispatch occurred.

Standards: 1 non-blocking finding, worst Low. Spec: 1 blocking finding, worst P2. Verdict: FAILURE.

