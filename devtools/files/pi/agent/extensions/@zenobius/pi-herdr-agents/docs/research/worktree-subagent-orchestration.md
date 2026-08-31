# Worktree-based subagent orchestration research

> This document records background evidence and design rationale. For supported package behavior and operating instructions, see [Worktree subagents](../worktree-subagents.md) and the [README](../../README.md).

**Date:** 2026-07-30  
**Question:** How are coding-agent products and open-source orchestrators using Git worktrees or equivalent isolated checkouts to run parallel tickets, report completion, review results, publish PRs, and clean up?

## Executive summary

There is no single standard for “worktree agent orchestration.” The products also vary: some allow shared checkouts, and some delegate commit, push, or PR creation to workers. The evidence nevertheless supports these **synthesis recommendations** for this extension:

1. **Give each writing ticket run one isolated checkout.** A branch, process, pane, or model context alone is not filesystem isolation.
2. **Treat agent completion as a handoff, not integration.** Preserve a diff, commit, branch, worktree, transcript, or PR for review.
3. **Reserve shared and irreversible actions for the orchestrator by default.** Workers edit, test, and commit locally; the parent provisions worktrees, verifies results, pushes, creates or updates PRs, merges, and cleans up. Repositories may explicitly choose a worker-publishes-PR policy instead.
4. **Parallelize implementation and serialize integration.** Worktrees prevent concurrent file overwrites, but branches can still conflict when integrated.
5. **Make cleanup state-aware.** Dirty files, untracked files, unique commits, unpushed branches, active processes, and unknown ownership require preservation rather than automatic deletion.
6. **Track runtime, checkout, branch, transcript, and PR as separate lifecycle resources.** They may be retained or removed independently.
7. **Treat stacked PRs as a separate advanced workflow.** They require dependency metadata, descendant restacking, lease-safe force pushes, bottom-up merge order, and re-running review/CI gates.

The closest precedents for the proposed first version are:

- **Claude Code worktree-isolated subagents:** caller/worker completion plus conservative temporary-worktree cleanup.
- **OpenAI Codex and Cursor local worktrees:** one conversation/task per managed worktree followed by an explicit review/apply/PR decision.
- **Claude Squad and Shoal:** local control planes mapping task → worktree → terminal/agent session.
- **OpenWeft and Vigla:** parallel workers with serialized integration.
- **Gas Town:** the most complete durable worker-to-merge-queue model, useful as long-term inspiration rather than a suitable first implementation.

For `pi-herdr-subagents`, the research supports a managed single-call `subagent(... worktree ...)` spawn, typed completion metadata, parent-owned verification, and explicit retention/removal. PR automation, durable ticket DAGs, merge queues, and stacks should come later.

## Terminology

- **Worktree:** a linked Git checkout with its own working files, `HEAD`, and index while sharing repository objects and most refs. It is isolation from file overwrites, not a security sandbox. ([Git](https://git-scm.com/docs/git-worktree))
- **Ticket run:** one orchestration attempt for one ticket, including its base commit, branch, worktree, agent session, and result.
- **Worker completion:** the coding agent has stopped and reported a result. It does not imply that the result was accepted, pushed, reviewed, or merged.
- **Integration:** the shared operation that applies or publishes worker changes: local merge, push/PR, merge queue, or stack update.
- **Finalization:** an explicit decision to publish, retain, discard, or remove a completed ticket run.

## Product landscape

> Historical research baseline table only. Product rows below are pinned evidence from the research date, not current package status.

| Product | Concurrent unit | Isolation | Handoff and integration lesson |
| --- | --- | --- | --- |
| [OpenAI Codex](https://learn.chatgpt.com/docs/environments/git-worktrees) | Desktop/cloud chat | Desktop uses a managed Git worktree per chat; cloud uses a container checkout | Worktree execution is separate from **Handoff**, branch creation, commit, push, and PR. Managed cleanup retains recent worktrees and snapshots state before eviction. |
| [Claude Code](https://code.claude.com/docs/en/worktrees) | Session or subagent | Local sessions can use worktrees; custom subagents support `isolation: worktree`; cloud uses isolated VMs | Background child completion returns to the caller. Clean unchanged temporary worktrees can disappear, but changed/untracked/unpushed work is retained. ([Subagents](https://code.claude.com/docs/en/sub-agents)) |
| [Cursor](https://cursor.com/docs/configuration/worktrees) | Local task or best-of-N candidate | One local worktree per task/candidate; Cloud Agents use VMs and clones | The user reviews a result and separately applies it, commits/pushes it, or opens a PR. Worktree cleanup is capped by age/count. ([Agents Window](https://cursor.com/docs/agent/agents-window)) |
| [GitHub Copilot cloud agent](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent) | Cloud task/session | Ephemeral Actions environment plus one task branch, not a local worktree | Branch/commit/push can be automated while PR creation may be deferred until the user reviews and iterates. Stopping runtime preserves pushed commits. ([Session management](https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/manage-and-track-agents)) |
| [Google Jules](https://jules.google/docs/environment/) | Task | Short-lived VM and cloned repository | Completion yields summary/diff and an explicit publish-branch or publish-PR action. Multiple tasks have independent VMs, logs, and changes. ([Tasks](https://jules.google/docs/tasks-repos/)) |
| [Devin](https://docs.devin.ai/work-with-devin/advanced-capabilities) | Managed child/session | Cloud children use isolated VMs; Desktop conversations use native worktrees | Devin provides a real coordinator/worker precedent: decomposition, bounded parallel children, progress, intervention, conflict handling, and synthesis. Desktop still leaves merge/winner choice to the user. ([Desktop worktrees](https://docs.devin.ai/desktop/cascade/worktrees)) |

### Product-level conclusions

- Coordination and isolation are orthogonal. Claude agent teams have shared tasks and messaging, but Anthropic still warns that teammates editing the same files can overwrite one another unless separate isolation is used. ([Claude agent teams](https://code.claude.com/docs/en/agent-teams))
- Products consistently stop at a reviewable artifact rather than treating child exit as merge approval.
- The control surface matters: Cursor’s Agents Window, GitHub’s agents panel, and Devin’s coordinator expose parallel state while preserving a distinct review/integration decision.
- Cloud VMs provide a stronger security/runtime boundary than worktrees. The proposed local feature should promise checkout isolation only.

## Open-source projects

### Closest local control-plane precedents

#### Claude Squad

[`smtg-ai/claude-squad`](https://github.com/smtg-ai/claude-squad) maps each operator-created task to one Git worktree and one tmux session. It persists branch ownership, base commit, status, and session metadata in JSON. Pause and delete are separate: pause can retain the branch for resume, while deletion removes only worktrees/branches that Claude Squad owns. Its “submit” path pushes and opens the branch URL but does not create or merge a PR. ([README](https://github.com/smtg-ai/claude-squad/blob/2dd388e9857233e07712c8c5b3e2bf3b471b39fa/README.md), [worktree lifecycle](https://github.com/smtg-ai/claude-squad/blob/2dd388e9857233e07712c8c5b3e2bf3b471b39fa/session/git/worktree_ops.go))

**Useful lesson:** explicitly record whether the orchestrator created the branch; never delete a pre-existing branch as incidental cleanup.

#### Shoal

[`TheShoal/shoal-cli`](https://github.com/TheShoal/shoal-cli) persists `task/session → branch → worktree → tmux runtime → status/journal` in SQLite. Provisioning rolls back partial resources. Finalization can either push/create a GitHub PR or merge locally, and conflicted work is preserved for manual repair. ([Architecture](https://github.com/TheShoal/shoal-cli/blob/3d45e0b9eb1bc981b612429c720827d71324e9dd/ARCHITECTURE.md), [lifecycle](https://github.com/TheShoal/shoal-cli/blob/3d45e0b9eb1bc981b612429c720827d71324e9dd/src/shoal/services/lifecycle.py))

**Useful lesson:** a vendor-neutral terminal control plane can provide value without embedding a sophisticated planner or merge engine.

#### Vibe Kanban

[`BloopAI/vibe-kanban`](https://github.com/BloopAI/vibe-kanban) creates a workspace branch and one worktree per selected repository, then launches external coding-agent processes inside it. It persists workspace/session/process/action/turn state and logs. PR publication and guarded local squash integration are separate paths. Worktree deletion and branch deletion are separately controlled. The project’s docs also make the key counterexample explicit: multiple sessions inside one workspace still share files and use last-writer-wins behavior. ([Worktree creation](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/crates/workspace-manager/src/workspace_manager.rs), [shared-session warning](https://github.com/BloopAI/vibe-kanban/blob/4deb7eca8f381f7cbc1f9d15515a9ab8f8009053/docs/workspaces/multi-repo-sessions.mdx))

**Useful lesson:** isolation belongs to the ticket run, not merely to the conversation or process.

### Workflow orchestrators

#### OpenWeft

[`NeuraCerebra-AI/openweft`](https://github.com/NeuraCerebra-AI/openweft) divides work into overlap-safe phases, runs bounded workers in separate worktrees, checkpoints worktree/session identity before agent execution, and then priority-sorts and merges completed branches serially. Conflicts are resolved in the feature checkout through bounded worker retries. ([Scheduler](https://github.com/NeuraCerebra-AI/openweft/blob/30427ac8e8f592cf34f771517f12cb25d7fbc9f7/src/orchestrator/realRun.ts), [checkpoint](https://github.com/NeuraCerebra-AI/openweft/blob/30427ac8e8f592cf34f771517f12cb25d7fbc9f7/src/state/checkpoint.ts))

**Useful lesson:** parallel execution does not require parallel integration. Serialize only the shared critical section.

#### Vigla

[`Kilbex/Vigla`](https://github.com/Kilbex/Vigla) uses a mission-level supervisor branch/worktree plus one worktree per dependency-aware worker. Accepted workers integrate serially into the supervisor branch; only explicit final acceptance touches the user’s target branch. Git refs/tags provide recovery anchors in addition to persisted orchestration events. ([Mission workspace](https://github.com/Kilbex/Vigla/blob/bbd19ae2d5a77401502756c550b5dcd4ae59bbc9/crates/orchestrator/src/mission_workspace/mod.rs), [DAG dispatcher](https://github.com/Kilbex/Vigla/blob/bbd19ae2d5a77401502756c550b5dcd4ae59bbc9/crates/orchestrator/src/mission_supervisor_run/mission_loop.rs))

**Useful lesson:** if local multi-ticket integration is added later, a dedicated integration branch is safer than letting each worker mutate the user’s target.

#### Gas Town

[`gastownhall/gastown`](https://github.com/gastownhall/gastown) is the fullest verified example. It separates durable worker identity, reusable worktree, terminal runtime, assignment, and merge request. Worker completion pushes and verifies an exact submitted SHA before creating a durable merge-request record. A separate Refinery serializes target integration, runs gates, handles conflicts as tracked repair work, and can bisect failing batches. ([Architecture](https://github.com/gastownhall/gastown/blob/649b832b7672bc7a2dbef26f5983aba6198b819b/docs/design/architecture.md), [completion handoff](https://github.com/gastownhall/gastown/blob/649b832b7672bc7a2dbef26f5983aba6198b819b/internal/cmd/done.go), [merge engine](https://github.com/gastownhall/gastown/blob/649b832b7672bc7a2dbef26f5983aba6198b819b/internal/refinery/engineer.go))

**Useful lesson:** a mature autonomous integrator needs a durable ledger, exact SHA fencing, serialized gates, repair tasks, and crash recovery. This is a later architecture, not an appropriate v1 scope.

#### Baton

[`mraza007/baton`](https://github.com/mraza007/baton) is a bounded GitHub-issue queue: each issue maps to one branch/worktree and Claude process. The worker is prompted to commit, push, and create a PR; the controller recognizes the PR and releases the claim but does not merge. ([Dispatcher](https://github.com/mraza007/baton/blob/7bb5fb7/symphony/orchestrator.py), [workspace manager](https://github.com/mraza007/baton/blob/7bb5fb7/symphony/workspace.py))

**Useful lesson:** one external ticket can be the stable identity for one run, but delegating push/PR to workers trades implementation simplicity for weaker central control and recovery.

### Other useful implementations

- [Crystal](https://github.com/stravu/crystal) implemented one process/worktree per session, conflict preflight, rebase, and fast-forward integration, but is deprecated in favor of Nimbalyst. It is useful source material, not a dependency recommendation.
- Vibe Kanban’s current repository says the product is sunsetting. Its implementation remains useful evidence, but it should not become a new dependency.
- [Conductor](https://www.conductor.build/docs/concepts/git-worktrees) is a relevant commercial product benchmark, but its application source is not public.
- [`harms-haus/pi-worktrees`](https://github.com/harms-haus/pi-worktrees) provides Pi worktree commands but not parallel agent orchestration.
- [`aleclarson/agent-merge`](https://github.com/aleclarson/agent-merge) handles integration after agents/worktrees already exist; it intentionally has no session or job lifecycle.

## Standards and mature workflow patterns

### Git worktree invariants

The extension should rely on Git’s supported worktree interface rather than filesystem assumptions:

- `git worktree list --porcelain -z` provides scriptable path, branch/detached, lock, and prunable state. ([Git](https://git-scm.com/docs/git-worktree#_porcelain_format))
- Git normally refuses to check out one branch in multiple worktrees. `--force` bypasses occupancy and stale-path safeguards and should not be a normal recovery strategy. ([Git](https://git-scm.com/docs/git-worktree#Documentation/git-worktree.txt---force))
- A worktree lock prevents pruning, movement, and ordinary deletion and can store a reason. ([Git](https://git-scm.com/docs/git-worktree#Documentation/git-worktree.txt-lock))
- Normal removal accepts only clean linked worktrees. Forced removal can discard dirty and untracked state. ([Git](https://git-scm.com/docs/git-worktree#Documentation/git-worktree.txt-remove))
- Worktrees share most refs and repository configuration. They isolate checkout/index state, not every Git mutation. ([Git refs](https://git-scm.com/docs/git-worktree#_refs))
- `git worktree repair` and `prune` have distinct recovery purposes; orchestrators should never edit `.git/worktrees/*` directly. ([Git details](https://git-scm.com/docs/git-worktree#_details))

### Scheduling

Python’s `TopologicalSorter` is a useful standard-library model for future ticket DAGs: validate cycles before side effects, dispatch only `get_ready()` nodes, and release descendants only after explicit `done()` acknowledgement. ([Python](https://docs.python.org/3/library/graphlib.html#graphlib.TopologicalSorter))

GitHub Actions provides a mature failure-propagation analogy: failed/skipped prerequisites prevent dependent jobs unless an explicit always-run path is defined. Cleanup/reconciliation should be such an always-run path, while dependent implementation should fail closed. ([GitHub Actions `needs`](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idneeds))

### Reconciliation and crash recovery

Kubernetes controllers provide the relevant architectural pattern for a later durable orchestrator: persist desired state, observe actual Git/runtime/GitHub state, and apply only missing transitions. ([Kubernetes controller pattern](https://kubernetes.io/docs/concepts/architecture/controller/#controller-pattern))

This matters around ambiguous side effects:

- after worktree creation, adopt only an exact path/ref/base/ownership match;
- after push timeout, fetch the exact remote ref before retrying;
- after PR-create timeout, query by full head/base before creating again;
- after merge timeout, query the PR’s merged state before retrying;
- after cleanup failure, keep a visible `cleanup_pending` state.

### GitHub publication and gates

GitHub treats PR head/base, draft status, required reviews, checks, merge queues, merged state, and branch deletion as distinct facts. Rulesets may layer with branch protection, so GitHub—not a local reimplementation—is authoritative for mergeability. ([Protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches), [Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets))

If rewritten branches are ever supported, use exact `--force-with-lease=<ref>:<expected-sha>` rather than plain force. ([Git push](https://git-scm.com/docs/git-push#Documentation/git-push.txt---force-with-leaseltrefnamegtltexpectgt))

## Stacked PRs

Graphite is the clearest mature reference. It stores parent relationships that vanilla Git does not, recursively restacks descendants after parent changes, and recommends bottom-up merging followed by sync/restack/submit of the remaining stack. ([Restacking](https://graphite.com/docs/restack-branches), [Manual stack merge](https://graphite.com/docs/merge-stack-prs-github))

Its worktree guidance is especially relevant: Graphite generally avoids modifying a branch checked out in another worktree, so a stack spread across worktrees requires deliberate operations in each checkout. ([Graphite worktrees](https://graphite.com/docs/multiple-worktrees))

A stack therefore adds:

- parent/child branch metadata beyond Git;
- a serialization lock for rewrites;
- descendant `stale_base` states;
- lease-safe force pushes;
- bottom-up merge order;
- re-evaluation of checks, reviews, CODEOWNERS, and conflicts after rewrites;
- compatibility decisions for GitHub merge queues and stale-review policies.

**Recommendation:** default to independent PRs based on trunk. Allow hard-dependent work only after its predecessor merges. Add native or Graphite-backed stacks later as an explicit repository capability, not as part of worktree spawning.

## Implications for `pi-herdr-subagents`

The extension already has several pieces that comparable tools need:

- asynchronous launch and parent wake-up;
- stable child session files and resume flow;
- Herdr pane status and interruption;
- a parent widget for concurrent work;
- bounded completion delivery;
- an internal launch path that can accept a pre-created Herdr surface;
- `cwd`-aware child execution.

The missing seam is **ticket-run placement and handoff metadata**, not a new general orchestration framework.

### Recommended first version

Expose one atomic operation through the existing `subagent` interface:

```ts
subagent({
  name: "Ticket 123",
  agent: "worker",
  task: "...",
  worktree: {
    branch: "ticket/123",
    base: "main"
  }
})
```

Internally:

1. Resolve the source repository and exact base SHA.
2. Before creating resources, persist a small ownership manifest with run ID, source repository, intended branch/base SHA, and label. This need not be a database or full controller.
3. Use `herdr worktree create --cwd ... --branch ... --base ... --label ... --no-focus`.
4. Parse the returned Herdr workspace, root pane, worktree path, and branch. Retain the already-resolved base SHA from the manifest because the create response does not include it.
5. Update the manifest with observed resource identities, then launch the child in the returned root pane and worktree cwd.
6. Record the same worktree metadata on the running subagent for live status and delivery.
7. On completion, verify and return machine-readable Git state alongside the prose summary.
8. Leave changed work available for parent review; do not automatically remove the worktree.

Suggested completion metadata:

```text
run ID
worktree path and Herdr workspace ID
branch and resolved base SHA
HEAD/commit SHA and commits ahead
changed files
clean/dirty/untracked/conflicted state
checks reported by the worker
session path and resume reference
```

Suggested first-version states:

```text
provisioning -> running -> ready_for_review
                       -> failed
ready_for_review -> revising
                 -> retained
                 -> discarded
                 -> finalized
```

Keep these ticket-run states separate from the existing process/turn/delivery lifecycle.

### Ownership policy

| Action | Worker | Parent/orchestrator |
| --- | ---: | ---: |
| Edit, test, make focused commits | Yes | Verify |
| Create/open/remove worktree | No | Yes |
| Select branch and base | No | Yes |
| Push branch | No by default | Explicit action |
| Create/update PR | No by default | Explicit action |
| Merge or enqueue | No | Explicit action |
| Decide retain/discard/cleanup | No | Yes |

### Conservative cleanup policy

Automatic removal is safe only when all of the following are proven:

- the extension created and still owns the worktree;
- no child process is active;
- the checkout is clean and not mid-merge/rebase;
- no untracked files exist;
- no unique/unpushed commits would be lost;
- the branch retention decision is explicit.

Otherwise, report the blocker and keep the worktree. Pane/process cleanup, worktree cleanup, branch cleanup, transcript retention, and PR retention must remain independent actions.

### Explicitly defer

Do not include these in the first version:

- autonomous push/PR/merge;
- stacked PR orchestration;
- ticket dependency DAGs;
- a full durable database or controller loop beyond the minimal ownership manifest;
- pooled/reused worktrees;
- automatic conflict-resolution agents;
- merge queues;
- best-of-N candidates;
- multi-repository ticket workspaces.

Add each only after the atomic isolated ticket run and review/resume/cleanup path is reliable.

## Recommended implementation sequence

1. **Managed worktree spawn:** one worker, one Herdr-managed worktree, one ownership manifest, one completion handoff.
2. **Review and resume:** parent can inspect and resume the same child/worktree without losing state.
3. **Explicit finalization:** retain or safely remove; publication can initially use normal `git`/`gh` commands.
4. **Run reconciliation:** recover and reconcile extension-owned worktrees after Pi/Herdr restart.
5. **Bounded ticket fleet:** queue and concurrency cap for independent tickets.
6. **PR adapter:** parent-owned push/create/update with exact branch/SHA metadata.
7. **Dependency scheduling:** explicit DAG and blocked-upstream behavior.
8. **Advanced integration:** supervisor branch, merge queue, or opt-in stacked PR adapter.

## Primary sources

### Standards and workflow primitives

- Git worktrees: <https://git-scm.com/docs/git-worktree>
- Git push leases: <https://git-scm.com/docs/git-push#Documentation/git-push.txt---force-with-leaseltrefnamegtltexpectgt>
- Python `TopologicalSorter`: <https://docs.python.org/3/library/graphlib.html#graphlib.TopologicalSorter>
- GitHub protected branches: <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches>
- GitHub rulesets: <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets>
- GitHub merge queues: <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue>
- Kubernetes controller pattern: <https://kubernetes.io/docs/concepts/architecture/controller/#controller-pattern>
- Graphite worktrees: <https://graphite.com/docs/multiple-worktrees>
- Graphite restacking: <https://graphite.com/docs/restack-branches>

### Products and projects

- OpenAI Codex worktrees: <https://learn.chatgpt.com/docs/environments/git-worktrees>
- Claude Code worktrees: <https://code.claude.com/docs/en/worktrees>
- Claude Code subagents: <https://code.claude.com/docs/en/sub-agents>
- Cursor worktrees: <https://cursor.com/docs/configuration/worktrees>
- GitHub Copilot cloud agent: <https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent>
- Google Jules environment: <https://jules.google/docs/environment/>
- Devin managed children: <https://docs.devin.ai/work-with-devin/advanced-capabilities>
- Claude Squad: <https://github.com/smtg-ai/claude-squad>
- Shoal: <https://github.com/TheShoal/shoal-cli>
- Vibe Kanban: <https://github.com/BloopAI/vibe-kanban>
- OpenWeft: <https://github.com/NeuraCerebra-AI/openweft>
- Vigla: <https://github.com/Kilbex/Vigla>
- Gas Town: <https://github.com/gastownhall/gastown>
- Baton: <https://github.com/mraza007/baton>
