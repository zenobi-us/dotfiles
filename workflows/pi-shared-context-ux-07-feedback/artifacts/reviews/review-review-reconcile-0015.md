---
description: Independent Standards and Spec review
title: Frozen source review
type: Report
---

# Frozen source review

Verdict: FAILURE. Standards: 0 findings. Spec: 2 findings, including one blocking scope change.

## Target and authority

Ticket: `tracker/tickets/pi-shared-context-ux-07-feedback.md`, backend `local-markdown`.
Canonical repository, alignment and workflow store: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles`.
Source worktree: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/feat-pi-shared-context-ux-07-feedback`.
Source branch: `feat/pi-shared-context-ux-07-feedback`. Base branch: `master`.
Reviewed commit: `b0cfa8812032fd61dfe90971514fec6e925f645f`.
Reviewed tree: `24209cbea354e15efcd34805596b7428993a8e99`.
Base and merge base: `188d65733aca442f860b18d323cf6db03bad1744`.
Diff: `git diff 188d65733aca442f860b18d323cf6db03bad1744...b0cfa8812032fd61dfe90971514fec6e925f645f`.
Commits: `bb305e78`, `d555eabf`, `b0cfa881`.

The review covered all seven changed paths and affected callers. It included inherited `actions.ts` and `model.ts`, current queues, shared recovery, source identity and dirty-source checks. Canonical ticket state remains claimed. Implementation and merge do not imply completion.

## Independent sessions

The Standards slice reviewed correctness, safety, module boundaries, behavioral coverage and exact-source workflow contracts. The Spec slice reviewed all seven ticket criteria and the initiative's preserved behavior. Both used the same frozen target and canonical records. Neither could edit source or workflow records.

- **Standards session:** Fresh Herdr/OMP pane `w8Z:p4`, run `674e6c64-0ec0-444a-91c8-1390091f260c`, session `01a19189-f44b-753a-85b1-80a31c3b4239`. Router completion signal: sequence 2, completed, source agent, `2026-10-31T10:39:54.422Z`. Final report ended FINISHED. Pane close returned ok.
- **Spec session:** Fresh Herdr/OMP pane `w8Z:p5`, run `b232849f-9b94-424a-a77c-9083c933519f`, session `01a1918a-328a-758a-aad7-c320114dc032`. Spawn transport timed out after launch. No replacement owner was launched. Herdr wait by pane returned agent_status done and completion_seq 1378. The final report was read through Herdr. Pane close returned ok.
- **Review owner:** Herdr/OMP pane `w8Z:p3`, session `01a19189-02d9-720a-bde1-8731d4905ea9`, run `7c004275-a7c0-4d36-97d4-d10ed9cbc194`, depth 1. Both subordinate sessions ran at depth 2. Workspace remains open.

## Standards

PASS. No actionable documented-standard violations or baseline smell findings.

Malformed-event isolation preserves readable events without accepting hidden authority. `workflow.ts:79–94` retains parse errors. Lines 153–169 return the error while historyValid remains false. `inspection.ts:13` preserves that value. `recovery.ts:54` blocks invalid history before successful-review or verified-finish decisions. `actions.ts` disables worktree actions when no recovery action exists.

The Standards reviewer exercised the actual recovery and action-choice functions with read-only Bun calls. Invalid history blocked all five worktree actions despite a retained SUCCESS review, matching clean source, readable artifact and finishVerified true. All eight untouched aliases retained malformed-history blocking and dirty-source takeover approval. Implemented, merged and reviewed each required takeover approval.

This safety result does not authorize the separate scope change below.

## Spec

### SPEC-01 — P2 — Display feedback changes workflow transition rules

File: `mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/recovery.ts:108–115`.
ADR: None. The canonical ADR index contains no decision entries. The applicable authority is the initiative's Out of Scope rule: “New agent commands, research conversion commands, or workflow transition rules.”

The shared classification adds `new` and `to do` to recovery's accepted states. This is not only a progress-display change. With no receipts, valid history, missing source and inactive ownership, master blocks both states as unknown. The reviewed source recommends start/begin without approval. The added recovery test explicitly requires this behavior.

Blocking: yes. The ticket asks for progress display and preserves workflow safeguards. It does not authorize new workflow transition rules. This broadens a safety-sensitive accepted-state boundary.

Required change: Keep the expanded classification for progress display. Restore master's accepted-state boundary in recoveryDecision, unless separate explicit authorization changes that contract.

Validation: Run a read-only Bun comparison of recoveryDecision from the base and reviewed source for statuses `new` and `to do`, with the fixture above. The review owner executed this comparison by transpiling `git show <base>:<recovery.ts>` in memory. Actual output: base blocked/Inspect tracker state; reviewed start/begin/requiredApproval false for both statuses. After repair, both must remain blocked while initiative rows still display todo for untouched aliases.

### SPEC-02 — P3 — Action menu advertises an inactive copy shortcut

File: `mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/explorer.ts:783–784`; conflicting guard at line 605.
ADR: None. The initiative requires: “All visible keyboard hints must match actual input behavior.”

The footer adds `c copy path` whenever copyTarget succeeds, including the action menu. The input guard excludes the action screen. Select a Local Markdown ticket and press `a`: the menu advertises a key that cannot invoke copyPath. Settled capture `13-recovery-actions.txt` also shows the hint.

Blocking: no, in isolation. This is a discoverability defect, not a destructive-action bypass. It still requires correction to satisfy the initiative.

Required change: Hide the copy hint on the action screen, matching the existing input guard.

Validation: A read-only Bun smoke constructed GraphExplorer with one Local Markdown ticket, loaded it, sent Enter then a, rendered, sent c, and rendered again. Actual output: `{"advertisesCopy":true,"unchanged":true,"execs":0}`. After repair, the action-menu footer must omit the copy hint; the normal initiative list must retain working copy behavior.

### Acceptance coverage

- **Receipt density:** Short warning rows and full inspection remain available. Invalid events remain inspectable and block recovery.
- **Selection and spacing:** Rendering emits one marker per selected item, retains selectedBg and adds item/detail spacing. Recorded settled frames support the intended structure.
- **Body reader:** Code uses the separate padded customMessageBg surface. Captured fallback-theme HTML does not establish visually distinct backgrounds; this remains an evidence limit.
- **Initiative copy:** Canonical resolver targets index.md. Local Markdown receives the shortcut; hosted fixtures suppress it. Copy success status is fresh evidence, not fresh clipboard byte proof.
- **Feedback retention:** Canonical feedback remains appendable. All six original screenshot links and files remain present, as checked by the Spec reviewer.
- **Progress:** Todo, started zero, mixed and completed states are represented. Implemented and merged remain started, not completed. The shared recovery scope change is SPEC-01.

## Inputs and verification

Consumed canonical ticket and initiative, CONTEXT-MAP.md, docs/agents/issue-tracker.md, docs/agents/domain.md and docs/adr/index.md. Optional CONTEXT.md is absent. Local Markdown reads used mq with okf.mq and explicit formats. No full bundle check applies to this read-only record review.

Consumed `artifacts/evidence/review-reconcile-0014/target.json`, `events/implementation-reconcile-0012.json`, `events/source-reconcile-complete-0013.json`, `events/review-reconcile-start-0014.json`, and `artifacts/snapshots/pr-draft-implementation-reconcile-0012.md` under this workflow.

Consumed source-reconcile-0011 validation-results.json, capture-manifest.json, termscope-protocol-complete.json and modal-harness-source.txt. Independent reviewers inspected settled terminal captures, including 12, 13, 15, 16, 17, 18, 22, 23 and 24. Early stale frames do not establish settled behavior.

Recorded implementation checks: 132 tests, 2056 assertions, 12 files, no failures; affected-source typecheck passed. These checks were not rerun during review. Full-bundle wait.ts type errors remain known, unrelated failures; this review does not call that check passing.

Actual Pi 1.4.0 modal execution is retained in implementation evidence. Progress and hosted cases use labeled fixtures. Native clipboard readback timed out; historical byte proof is not fresh proof. No native PNGs exist for this run. The isolated profile lacked the worktree command, so actual phase launch was not exercised. Runtime recovery/action checks and the two review-owner smoke cases cover the concrete findings, not a complete terminal acceptance rerun.

At review entry, git rev-parse reported the frozen commit and tree and git status --porcelain printed nothing. No reviewer edited source. No merge, rebase, commit, push, tracker mutation, worktree removal or workspace closure occurred.

## Result

Standards: 0 findings. Spec: 2 findings; worst severity P2. Verdict FAILURE. Parent must not finish this source on this review. Preserve the immutable result and obtain a repaired, freshly reviewed target before integration.

Review timestamp: 2026-10-31T10:42:27.714968Z

