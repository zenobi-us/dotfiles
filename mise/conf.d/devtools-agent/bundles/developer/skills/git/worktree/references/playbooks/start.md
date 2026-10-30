# Playbook: start

Create an isolated Worktrunk worktree and start an implementation agent.

This playbook receives `muxer`, `agent`, `muxerContract`, and `agentContract` from the `worktree` skill, which resolves them with the `muxer-subagents` skill. It does not detect either.

## Inspect and recover first

Resolve the canonical ticket and absolute installed `WORKTREE_SKILL_ROOT`. From the repository or surviving base worktree run:

```sh
"$WORKTREE_SKILL_ROOT/scripts/inspect.ts" <canonical-ticket-ref> --json
```

Follow the shared decision and execution gates in `references/receipts.md` before the normal process below. This command recovers its own interrupted attempt. Inspection is read-only; the playbook performs any authorized reconciliation or retry. If a different action is recommended, dispatch that playbook rather than bypassing its gates. Observe active owners, check reservations and ownership, obtain required scoped takeover approval, and never auto-kill a session. Append recovery provenance; preserve prior receipts and partial source.

## Preconditions

- Read `references/receipts.md`.
- Load the issue-tracker reference and ticket skill. Resolve the canonical ticket
  `ref` and backend. Ask when the selector is missing or ambiguous.
- Use Worktrunk and the `muxerContract` and `agentContract` resolved by the
  `muxer-subagents` skill.
- Run the shared-context CLI from the repository. Record its route table and
  alignment root.
- Follow `ALIGNMENT-ROOT.md` before reading context, ADRs, or `docs/agents/`.
- Resolve the workflow root with
  `shared-context resolve workflow --id <ticket-id> --json`.
- Use the applicable Matt Pocock engineering skill.

## Process

1. Resolve and validate the ticket. Run its preflight and claim operation.
   Before making a tracker write, inspect the Git status of the repository
   containing the resolved tracker store. Classify existing changes by their
   resolved shared-context paths and ownership; do not assume that unrelated
   files merely inside the same Git repository are shared-context changes. If
   there are uncommitted shared-context changes relevant to the workflow,
   include them in atomic commit groups using the `commit` skill before starting
   source work. Every such commit title must include the resolved ticket
   reference. Preserve and do not stage unrelated user changes. A scoped
   tracker commit may proceed alongside unrelated dirty files only when the
   `commit` skill permits safe path-specific staging. If changes cannot be
   safely classified or isolated, stop and report the paths and ask for
   direction. Never silently discard, stash, or commit unrelated changes.
2. Read the relevant context, ADRs, and agent instructions.
3. For `begin`, resolve the base branch and create the source branch with Worktrunk. For authorized `takeover`, verify repository, recorded source branch/commit and base identity, liveness, reservations, and ownership. Reuse the existing worktree and preserve partial source, including dirty work. If the worktree was removed but the surviving source branch is uniquely identified and verified, use Worktrunk to recreate a checkout of that existing branch after those same checks. Never reset source, create a replacement branch, overwrite an occupied path, or infer branch identity from a name alone. If identity cannot be established, stop for targeted recovery instructions. Reconcile an existing valid result without launching another implementer. A missing/unusable result requires a fresh implementation session and new attempt, not a fabricated completion.
4. Create the workflow root and fixed internal directories only for an authorized new workflow write. For recovery, preserve existing storage and append a new `start` phase-start receipt linked to prior attempt and consumed inputs. Regenerate projections from events without resetting history.
5. Write a temporary implementation handoff. Include the ticket `ref` and
   backend, branch, worktree, base branch, workflow store and reference,
   relevant files, requirements, validation commands, receipt path, and these
   completion requirements:
   - Implement the ticket.
   - Run validation.
   - Write an immutable implementation receipt under `events/`.
   - Write `artifacts/snapshots/pr-draft-<receipt-id>.md`.
   - Regenerate `manifest.yaml`, `projections/pr-draft.md`,
     `projections/implementation-log.md`, and
     `projections/latest-status.yaml`.
   - End the final response with `WORKTREE_IMPLEMENTATION_DONE` only when implementation and validation pass.
6. Open one agent session with the `muxer-subagents` skill. Pass the worktree path as the target directory and the handoff file to the agent contract's launch command.
7. Do not open another implementation session for this worktree while one is active.
8. Wait for completion using the muxer contract. Read final output, but validate the durable result independently: a marker alone is not success and its absence alone does not invalidate an otherwise verified result.
9. If the result is blocked, validation fails, or no usable result exists, append an accurate failed/blocked phase-complete receipt and keep the worktree and partial source. A later start recovers this attempt through a fresh session after the recovery gates.
10. If the agent succeeds, verify the implementation phase-result receipt, draft snapshot, and projections. Record their paths in a phase-complete receipt.
11. Close the implementation pane. Keep the worktree and workspace available for review.

## Receipt requirements

The implementation receipt MUST record the exact source commit and tree after implementation, changed files, validation results, implementation summary, open questions, agent, session or pane identifier, and parent `start` receipt.

## Output

Report:

- ticket
- status
- source branch
- base branch
- worktree path
- muxer, workspace path, and pane or session identifier
- implementation receipt
- draft snapshot and projection paths
- handoff path
- validation result
- pane close result
- next action and reason from a fresh shared inspection after recording the actual outcome; report `review <ticket-id>` only when a valid clean implementation result supports it. For failed, blocked, or missing results, report the inspected recovery/observation requirement instead of promising review.
