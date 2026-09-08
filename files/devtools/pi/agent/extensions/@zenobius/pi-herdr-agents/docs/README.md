# Documentation map

Use this page to find the authoritative document for a task. Current shipped behavior and accepted ADRs govern existing APIs. For the shipped first-flow review workflow, the recorded legacy issue #6 revision is the original product contract, the active plan records shipped behavior and deferred follow-up, `CONTEXT.md` defines terms, and research supplies non-binding evidence. A later, narrower decision supersedes an earlier example when they conflict; otherwise stop and reconcile the conflict rather than choosing whichever document is convenient.

## Shipped behavior

- [`../README.md`](../README.md) — installation, public API, configuration, lifecycle, and role authoring.
- [`worktree-subagents.md`](worktree-subagents.md) — canonical worktree operation, review, recovery, and cleanup.
- [`../RELEASING.md`](../RELEASING.md) — release checks and publication procedure.

## Domain language and active design

- [`../CONTEXT.md`](../CONTEXT.md) — workflow domain language and prototype evidence.
- [`orchestrated-review-workflow-plan.md`](orchestrated-review-workflow-plan.md) — shipped first-flow implementation and deferred follow-up. It records the reviewed legacy issue #6 revision (`2026-08-04T11:57:03Z`, `20a0d529770b…`) without depending on the retired issue tracker.

Workflow preparation, exact approval, Worker execution, isolated read-only children, bounded parallel review and synthesis, explicit non-retryable failure evidence, fail-closed cancellation, reload/restart ownership, and the bundled authoring skill are shipped. Automated package acceptance covers unit tests, lint, and `npm pack --dry-run`. Deterministic Herdr integration is a manual release gate run from inside Herdr. ADRs 0004–0007 are accepted for the shipped first flow.

## Operational references

- [Herdr agent guide](https://herdr.dev/agent-guide.md) — agent-safe operational workflow and workspace ownership.
- [Herdr CLI reference](https://herdr.dev/docs/cli-reference/) — current command syntax. Use this rather than guessing flags; `herdr workspace list` already emits JSON, and test-owned workspaces close with `herdr workspace close <workspace-id>`.
- [Git worktree documentation](https://git-scm.com/docs/git-worktree) — detached checkout semantics used by the workflow reader lane.

## Architecture decisions

| ADR | Status | Decision |
| --- | --- | --- |
| [`0001`](adr/0001-btw-ephemeral-side-questions.md) | Accepted | Add `/btw` as an ephemeral side-question child. |
| [`0002`](adr/0002-agent-workflow-skill-runtime-taxonomy.md) | Accepted in part; external CLI provisions superseded | Keep agent execution, workflows, skills, and Pi runtimes distinct. |
| [`0003`](adr/0003-installable-role-packs.md) | Accepted | Discover installable role packs through Pi's event bus. |
| [`0004`](adr/0004-require-active-user-approval-for-workflow-execution.md) | Accepted | Require active approval for exact workflow-script execution. |
| [`0005`](adr/0005-parent-owns-workflow-script-authority.md) | Accepted | Keep workflow-script authority with the parent. |
| [`0006`](adr/0006-limit-v1-execution-effects-to-isolated-worktrees.md) | Accepted | Limit the first workflow to read-only effects. |
| [`0007`](adr/0007-require-fresh-review-for-workflow-scripts.md) | Accepted | Require fresh review in skill-authored review workflows. |
| [`0008`](adr/0008-adopt-pi-only-subagent-execution.md) | Accepted; implemented | Remove the external CLI adapter and make subagent execution Pi-only. |

## Research

Research records pinned historical evidence and alternatives. Tables and baselines in these files are historical research snapshots, not current package status. They are not the user or implementation contract; do not update historical comparisons to imitate later implementation state.

- [`research/worktree-subagent-orchestration.md`](research/worktree-subagent-orchestration.md) — worktree orchestration background and deferred roadmap.
- [`research/pi-workflows-sol-advisor.md`](research/pi-workflows-sol-advisor.md) — preliminary comparison of dynamic workflows and Sol Advisor; later workflow decisions supersede its declarative recommendation.
- [`research/pdw-architecture-assessment.md`](research/pdw-architecture-assessment.md) — audited dynamic-workflow assessment that informs the active workflow plan.
