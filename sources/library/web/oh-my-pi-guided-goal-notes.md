---
type: Concept
title: "Run a shared-context initiative with OMP guided-goal"
date: "2026-10-24"
---
# Run a shared-context initiative with OMP guided-goal

Purpose: Configure a bounded goal that runs existing tickets through the worktree workflow.
Reader: The owner of this dotfiles repository.
Checked: OMP 18.10.3 and Worktrunk 0.80.0, 2026-10-24.

## Overview

Use one interactive OMP session as the coordinator. Use `/guided-goal` to define its persistent objective. Explicitly authorize the installed `worktree` skill to implement, review, fix, and finish each ticket. Start with one ticket at a time in dependency order.

This is a prompt-directed workflow, not a built-in DAG scheduler. The goal runtime stores one objective and continues work. Your ticket skill owns dependency selection. Your worktree skill owns execution and durable receipts.

Use `/skill:worktree goal <initiative-id>` for new or partially completed initiatives. The [goal playbook](../../../mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/goal.md) prepares a receipt-based recovery map and a populated prompt without changing state. Implemented tickets can proceed to review; reviewed tickets can proceed to finish. Active agents are observed, and uncertain ownership requires takeover approval. Interrupted finish operations resume from verified integration/publication boundaries instead of repeating the merge.

If the same OMP goal is paused, preparation returns `/goal resume` with recovery context. Otherwise, send its returned `/guided-goal` prompt. Once execution is authorized, the [coordinator journal](../../../mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/receipts.md#goal-coordinator-journal) preserves scope, reservations, limits, and approvals across restarts. Unknown accounting requires explicit renewal. The manual example below describes a fresh run; use the playbook's current policy for recovery.

## Understand guided-goal

The [v18.10.3 interview prompt](https://github.com/can1357/oh-my-pi/blob/v18.10.3/packages/coding-agent/src/prompts/goals/guided-goal-interview.md) asks one question per reply, with no tools during the interview. It aims for six questions. It requires deterministic success criteria, exact verification, an attempt cap, boundaries, and stop conditions. After these are settled, it creates the goal and starts work immediately. There is no mandatory extra approval after creation.

The objective uses five headings: Objective, Success criteria, Verification, Boundaries, and Stop conditions. Prepare repository facts before entering the interview because the interviewer cannot inspect files during it.

The [goal runtime](https://github.com/can1357/oh-my-pi/blob/v18.10.3/packages/coding-agent/src/goals/runtime.ts) stores a single objective, status, budget, and usage. The [continuation prompt](https://github.com/can1357/oh-my-pi/blob/v18.10.3/packages/coding-agent/src/prompts/goals/goal-continuation.md) tells the agent to continue until it has current evidence for every deliverable. Completion still depends on the agent calling the goal tool; the runtime does not independently execute your acceptance commands.

An attempt cap in the objective is an agent instruction, not a runtime counter. A token budget changes runtime status to budget-limited and prevents active-goal continuation; it is not an exact hard spending cutoff. Usage includes input, cache writes, and output, but excludes cache reads. Do not assume this bounds separately launched child processes. The default [continuation mode](https://github.com/can1357/oh-my-pi/blob/v18.10.3/packages/coding-agent/src/goals/settings.ts) is interactive.

Installed `omp --help` confirms `--goal` starts immediately and is interactive-only. It bypasses the interview. It cannot combine with an explicit resume, positional prompt, or startup plan mode. For this workflow, prefer ordinary `omp` followed by `/guided-goal`.

## Prepare the initiative

Read [tracker configuration](../../../docs/agents/issue-tracker.md), then use the [ticket skill](../../../mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/SKILL.md). Resolve all record paths through shared-context. Use mq for Markdown.

For this repository, tickets use `parent` for initiative membership and `blocked_by` for direct dependencies. A ticket is completed only after validation, review, merge, and push. Initiative index links provide graph roots; blocker traversal can reach prerequisites outside the initiative. Treat outside prerequisites as blockers unless you explicitly authorize their execution.

Run the ticket skill's graph CLI with the repository root and `--initiative INITIATIVE_ID`. `/worktree tasks` is also a read-only graph route. It does not execute the graph.

The resolver returned `tracker/initiatives` here, but that directory did not exist during this research. No concrete initiative or ticket DAG was available for a full dry run. In a repository that contains your initiative, resolve its ID or exact spec reference first. A spec without tickets is not an executable ticket DAG; create and approve its tickets before starting execution.

## Supply the execution contract

First ask OMP, outside guided-goal, to resolve the initiative, read its spec and plan, graph its tickets, and identify exact validation commands. Request read-only preparation, without claims or worktree creation. Then paste the following into the interactive session. Replace the uppercase fields with the resolved facts.

```text
/guided-goal Complete initiative INITIATIVE_ID, using SPEC_REF as its specification and PLAN_REF as its plan.

I explicitly authorize the installed worktree skill for this goal: tasks, start, review, fix, and finish. Use shared-context, reading-and-writing-tickets, worktrunk, and muxer-subagents through that workflow. Do not substitute OMP's built-in /worktree command.

Keep this session as coordinator. Freeze the initiative's in-scope ticket IDs after preflight. Use the tracker as authority for status and blocked_by. Execute one ticket at a time. Select only unclaimed, ready tickets whose direct blockers are completed. Finish each prerequisite before starting its dependents. Do not claim another agent's ticket.

For each ticket, run start, wait for and validate the implementation receipt, then run a fresh review. If review fails, run a fresh fix session and review again. Allow at most two fix/review cycles per ticket. After a SUCCESS review of the exact current source commit and tree, run finish against BASE_BRANCH. I authorize the required scoped commits, local squash merge, push to REMOTE/BASE_BRANCH, and ticket completion for these tickets only. Do not use submit as a substitute for finish.

Success means every frozen in-scope ticket is completed, every finish has a successful durable receipt, the reviewed work is present on REMOTE/BASE_BRANCH, and VALIDATION_COMMANDS pass on the final integrated state. Verify both tracker state and remote commit state; status labels alone are insufficient.

Change only the selected tickets' required code, tests, documentation, and resolved workflow/tracker records. Preserve unrelated user changes. Do not deploy, alter secrets, force-push, bypass hook approval, or execute out-of-scope tickets.

Stop and request human input for ambiguous requirements, missing or cyclic blockers, untrusted hooks, unresolved conflicts, failed push, invalid receipts, or changed source after review. If incomplete tickets remain and none is runnable, stop as blocked, not successful. Stop after two unsuccessful fix/review cycles for any ticket or 30 coordinator execution turns. Track these counters durably. Use a 500000-token goal budget. Do not mark the goal complete when blocked or capped; request a pause and report exact recovery state.
```

The attempt and token values are example policies, not measured capacity requirements. Replace them if the initiative needs different bounds. The interview can still ask for missing details.

For a review-only policy, replace merge/push authorization with an explicit stop for approval. That produces a human gate, not unattended completion of a dependent DAG.

## Preserve workflow safety

The installed [worktree skill](../../../mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/SKILL.md) declares `disable-model-invocation: true`. Explicit authorization avoids relying on automatic skill selection. Its start, review, and fix phases require independent sessions. Worktrunk manages git worktrees; Herdr manages the agent sessions. Keep the coordinator out of implementation panes.

The [receipt contract](../../../mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/receipts.md) makes append-only events authoritative. Pane output and projections are not enough. A SUCCESS review applies only to its exact source commit and tree.

Do not use `continue` as the unattended scheduler. Its [playbook](../../../mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/continue.md) asks whether to submit or finish after successful review. It also considers a submitted workflow to have nothing left to continue. The coordinator must dispatch explicit phases and require finish for this goal.

The [finish playbook](../../../mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/references/playbooks/finish.md) requires push and ticket completion before worktree removal. Installed `wt merge --help` says default merge removes the source worktree and never fetches. Preserve the worktree during merge with `--no-remove`, update the base explicitly, and remove it only after push and ticket completion succeed. Let the playbook control these operations.

Your [Worktrunk skill](../../../mise/conf.d/devtools-agent/bundles/developer/skills/git/worktrunk/SKILL.md) requires human approval when project hooks are untrusted. Review and pre-approve them with `wt config approvals add`; do not let the agent add `--yes` to bypass that decision.

For repository-local context, worktrees have separate branch snapshots of tracker files. Keep claims and completion under one coordinator, commit/publish required context changes, and ensure new worktrees contain current context before selecting the next ticket. Serial execution avoids concurrent writes to the same tracker state.

Use `/goal show`, `/goal pause`, `/goal resume`, `/goal budget 500000`, and `/goal drop` to manage the goal. See the [interactive command implementation](https://github.com/can1357/oh-my-pi/blob/v18.10.3/packages/coding-agent/src/modes/interactive-mode.ts). Resuming a saved thread normally pauses an active goal; inspect it and use `/goal resume`. Pausing the coordinator does not prove that independently launched children stopped; inspect them through the muxer workflow before recovery.

Verification performed: installed version/help inspection; installed worktree dispatcher `route 'start EXAMPLE'` returned the start playbook; local tracker and workflow reads; shared-context source and initiative resolution. The v18.10.3 interview, runtime, and settings sources match upstream main at commit `0b5c27ab24719c86a5986b95ee55f4e75bc1aaa0`. No initiative execution, model interview, merge, push, or configuration change was performed. A bundle check is not applicable to this standalone authored research note.

