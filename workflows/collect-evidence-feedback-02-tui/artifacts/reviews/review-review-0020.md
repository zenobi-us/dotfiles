---
kind: review
schema: worktree-artifact/v1
title: Independent native TUI review
type: Review
---

# Independent native TUI review

This review checks the frozen native-terminal implementation against repository standards and its specification.

Reader: workflow owner. Attempt 3. Timestamp: 2026-11-11T21:05:20.778Z.

## Verdict

FAILURE. One High blocking Spec finding remains. The known Low Standards finding remains non-blocking.

## Scope

Ticket: tracker/tickets/collect-evidence-feedback-02-tui.md. Complete specification: tracker/initiatives/collect-evidence-feedback/index.md.

Source: feature/collect-evidence-feedback-02-tui. Base: master. Source checkout: /run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feature-collect-evidence-feedback-02-tui.

Frozen commit: a50eb7b56c79151c48abe4e5595b8da2b63eec98. Frozen tree: 0aafea468291c367eac265ad883de220cd48b442. Observed master: cd0e4d6a7becc5f8ad9c841346965f8a9bece0ec. Merge-base: dee00b4124b8f4b442b8774449018308a57e32b1.

Comparison: `git diff master...HEAD -- mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence mise/conf.d/devtools-agent/bundles/.claude-plugin/marketplace.json mise/conf.d/devtools-agent/bundles/developer/.claude-plugin/plugin.json`. Nonempty: 16 files, 733 additions, 51 deletions. Reviewed the full ticket slice, not only the latest fix. Unrelated master changes are excluded. Existing Surf and Playwright driver files are unchanged. Version metadata advances to 0.2.17.

Read parent review-0019, fix-0017/fix-0018, implementation-0005, review-0014 and its artifact, and pr-draft-fix-0018-final.md. Read the ticket, complete initiative, context map, domain rules and ADR index. CONTEXT.md is absent. ADR 0001 concerns Pi Ink cleanup, not this collector. Findings use NO ADR.

## Axis reports

Both independent axes ran concurrently in fresh terminals in the exact source worktree space. Reports below preserve their static findings. Coordinator runtime proof follows.

| Field | Standards | Spec |
| --- | --- | --- |
| Run | 6fb71b75-3474-487c-896b-dba8d2df95d9; t5w | ca5be092-cbd6-467c-ae79-5650b875b8d2; t5v |
| Full report | No new blocking standards finding. Reviewed the scoped committed diff against supplied AGENTS.md, docs/agents/domain.md, CONTEXT-MAP.md, the collect-evidence skill and its native/evidence reference contracts. CONTEXT.md is absent. ADR 0001 concerns Pi Ink cleanup and does not apply. Inspected native plan validation, the Driver boundary, private terminal lifecycle, input safety, native capture checks, common records, procedure/report changes, CLI registration, version changes and added regression code. The driver reuses the common Plan/Test/Step and verdict pipeline. Unexpected confirmations are checked in both terminal snapshots and OCR, including preconditions, waits and assertions. This is static evidence, not runtime proof. Preserve prior STD-01 as Low and nonblocking; no evidence supports escalation. No additional smell warrants a finding. No source changes, installs, tests, builds, lint or formatters were run. The coordinator owns runtime verification. | FAIL: one blocking safety gap. Read the complete initiative and ticket. Inspected the scoped diff, native driver, plan validation, pipeline, common records, reports, capability documentation and public workflow tests. The implementation uses termscope and foot on the same private tmux pane, captures through Cage/grim, checks native dimensions/RGB/text positions, and records identity and cleanup. The shared visible() path now checks confirmations during preconditions, waits and assertions as well as input; the prior SPEC-01 confirmation gap is fixed in the inspected source. Credential detection remains incomplete: ordinary API-token prompts can pass that same safety boundary. No unrelated scope expansion found. STD-01 remains outside this axis. Source commit and tree match the assigned snapshot. This was a read-only source review. No tests, builds, formatters, runtime capture or visual checks ran; the coordinator owns runtime verification. |
| Findings | 1 Low; 0 blocking | 1 High; 1 blocking |

## Standards

### STD-01 — Low — Non-blocking

Axis: Standards. ADR: NO ADR.

Location: `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts:123`.

The existing test-only grim failure shim still uses #!/bin/sh. collect-evidence/SKILL.md, Commands, documents the mise/Bun executable convention. Retain the prior nonblocking finding; this shim does not establish a production capture defect.

Required change: Outside the scoped fix: replace the test shim with an equivalent mise/Bun executable while preserving doctor.png passthrough and failure for collection captures.

Validation: `RUN_NATIVE_EVIDENCE_TESTS=1 mise exec -- bun test mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts`.

Coordinator checked the documented Scripts rule in mise/conf.d/devtools-agent/AGENTS.md. It requires TypeScript/Bun and limits shell to a one-line wrapper. This is the prior finding at its current line 123. No evidence supports escalation.

## Spec

### SPEC-02 — High — Blocking

Axis: Spec. ADR: NO ADR.

Location: `mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/drivers/tui-driver.ts:22`.

Initiative decision 38 requires stopping at credential prompts. The credential matcher omits API-token prompts. A harmless fixture displayed Ready screen and API token:. Public run exited 0/PASS for expect-only and 0/PARTIAL for approved fill; the fixture received literal fixture-probe. The native PNG confirms the prompt. API token is reproduced; API-key, PIN and OTP variants remain static inference.

Required change: Recognize common token, API-key, PIN and OTP credential prompts in both terminal snapshots and native OCR. Keep credential stops unconditional, including explicitly approved input steps. Add public native workflow regressions that retain the expected heading, display these prompts, and prove BLOCKED/exit 3 with no input received.

Validation: `env PATH=/home/zenobius/.local/share/collect-evidence/native-tools/fedora-45-x86_64/bin:$PATH RUN_NATIVE_EVIDENCE_TESTS=1 mise exec -- bun test <source>/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence/scripts/browser-evidence/test/native-workflow.test.ts; add public API-token expect/fill regressions requiring exit 3/BLOCKED and absent input`.

Requirement: initiative Capture drivers and safe operation decision 38: “Stop an affected case when a credential prompt or an unapproved operation appears. Never fill a credential prompt.” Ticket safety acceptance criterion also requires stopping at credentials.

The matcher at line 22 controls both snapshot and OCR checks at lines 155 and 160. The approved fill reaches input at line 118. The static axis marked this path as inference. The coordinator then reproduced both read-only acceptance and submitted harmless text through the public CLI. This blocks completion because approval of an ordinary step must not bypass an unconditional credential stop. No real credential or destructive action was used.

Reproduction: start with the retained native-smoke-fix-0017.ts fixture. Render an extra line `API token:` below its purple bar. For read-only proof, keep the expect-only plan. For input proof, use one approved fill step: locator screen, screen Ready screen, text fixture-probe, approval.confirmations [case.1]. Run init/render/compile/run/validate/verdicts/report from an unrelated directory with the prepared native tools. Both run commands currently exit 0; required result is exit 3/BLOCKED without input.

## Prior findings

SPEC-01 is resolved at the frozen source: confirmations now stop preconditions, waits and expect-only cases. Native regressions and the independent public prompt smoke pass. STD-01 remains Low and non-blocking. Earlier review failures remain historical records; this review does not rewrite them.

## Validation

Define `<source>` as the exact source checkout above. Define `<skill>` as `<source>/mise/conf.d/devtools-agent/bundles/developer/skills/browsers/collect-evidence`. Native commands used `PATH=/home/zenobius/.local/share/collect-evidence/native-tools/fedora-45-x86_64/bin:$PATH`.

- **Native public suite:** `RUN_NATIVE_EVIDENCE_TESTS=1 mise exec -- bun test <skill>/scripts/browser-evidence/test/native-workflow.test.ts`, source cwd. Observed 9 pass, 0 fail, 90 assertions; 25.45 seconds.
- **Common public suites:** `mise exec -- bun test <skill>/scripts/browser-evidence/test/workflow.test.ts <skill>/scripts/browser-evidence/test/verdict.test.ts`, source cwd. Observed 99 pass, 0 fail, 892 assertions; 57.30 seconds.
- **Fresh public positive/safety smoke:** `mise exec -- bun /tmp/ce-review0020-vVL9XI/smoke.ts`, cwd /tmp. Exercised doctor/init/render/compile/run/validate/verdicts/report. Transition run exited 0/PASS after a 1.5-second delayed frame. Expect-only Delete files? [y/N] exited 3/BLOCKED, no approved input IDs and no input file. All consumer commands exited 0. Temporary diagnostic record: /tmp/ce-fix-0017-E019TL/validation.json.
- **Fresh credential reproduction:** `mise exec -- bun /tmp/ce-review0020-vVL9XI/token-smoke.ts`, cwd /tmp. API-token expect exited 0/PASS; approved fill exited 0/PARTIAL and recorded fixture-probe. All validates, verdicts and reports exited 0. Temporary diagnostic record: /tmp/ce-fix-0017-UIK40O/validation.json. These successful command exits prove the defect, not a safe outcome.
- **Retained consumers:** public validate/verdicts/report against both unchanged parent fix-0017-smoke runs exited 0. Transition remained PASS; expect-confirmation remained BLOCKED. These are historical evidence reads, not recaptures.
- **Original native images:** inspected Ready, Details and blocked-confirmation PNGs from both retained and fresh smoke evidence. Inspected fresh API-token PNG. Ready changes to Details; Selected item remains on the next 20px line. Purple RGB [201,166,255], native 1280x720 dimensions and unmodified tmux padding remain visible. The API-token PNG visibly contains API token:. Native hashes matched common records.
- **Owned cleanup:** native suite passed its private runtime/server/process cleanup checks. Fresh transition runtime /tmp/ce-native-SR7pue is absent; Cage PID 2806142 and foot PID 2806162 are absent. Both image assets identify the same pane/socket/display. No borrowed terminal was attached or closed.
- **Axis delivery:** verified domain schemas, run/operation identities, payload hashes and frozen commit/tree. Observed native completion signals for both axes; acknowledged hashes and closed only owned terminals t5w and t5v. The source workspace and coordinator terminal remain for the parent.
- **Frozen source:** initial and final git status were empty. HEAD, tree, branch and base remained identical. Receipt writer independently checks exact source identity.

## Evidence references and limits

Retained evidence root: workflows/collect-evidence-feedback-02-tui/artifacts/evidence/fix-0017-smoke. It was resolved separately through shared-context. New smoke stores are temporary diagnostics outside source, not new authoritative workflow outputs.

| Native image | SHA-256 |
| --- | --- |
| Ready | 2493a3a4e51d475e6f0bac03014d1c51e4e182d9526a78c6de677aa4cdbf5a6f |
| Details | b6c7cd3ce3061d69feb27c979bf960ed49c44f411734afb9219626e3aeb8ca5a |
| API-token prompt | 5ab0a683dde277d300199c4fbaefb16f93d1e936c9b0fd5f75dcf005625480d2 |

Only the prepared Linux CPU-rendered private display and English OCR were exercised. Native video is unavailable. No borrowed desktop reproduction is claimed. TypeScript compiler/LSP was not run: the prior prerequisite was unavailable. No compiler success is claimed. No new Surf/Playwright runtime run was performed. Historical native timeout remains historical; this review ran the required current suite once, not to reconfirm that failure. API-key, PIN and OTP variants were not exercised.

Only this immutable review artifact and review-0020 phase-result are new durable workflow records. No source changes, installs, merges, rebases, pushes or ticket mutations occurred. Parent owns ticket recording, projections, phase completion, acknowledgement and coordinator shutdown.

