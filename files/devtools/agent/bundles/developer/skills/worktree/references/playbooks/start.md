# Playbook: start

Create an isolated Worktrunk worktree and start an implementation agent.

This playbook receives `muxer` and `agent` from the `worktree` skill. It does not detect either.

## Preconditions

- Read `references/receipts.md`.
- Load the issue-tracker reference and ticket skill. Resolve the canonical ticket and tracker path. Ask when the selector is missing or ambiguous.
- Use Worktrunk and the active muxer and agent contracts.
- Run the shared-context CLI from the repository. Use its reported root and storage mode.
- Follow `ALIGNMENT-ROOT.md` before reading context, ADRs, or `docs/agents/`.
- Resolve the workflow root with
  `cli.ts path workflow --id <ticket-id>`. Do not construct the path by hand.
- Use the applicable Matt Pocock engineering skill.

## Process

1. Resolve and validate the ticket. Run its preflight and claim operation.
2. Read the relevant context, ADRs, and agent instructions.
3. Resolve the base branch and create the source branch with Worktrunk.
4. Create the workflow root and its fixed internal directories. Write the
   initial `start` phase-start receipt under `events/`. Generate `manifest.yaml`
   and the initial projections from the event.
5. Write a temporary implementation handoff. Include the ticket, branch,
   worktree, base branch, context root and storage mode, workflow root, relevant
   files, requirements, validation commands, receipt path, and these completion
   requirements:
   - Implement the ticket.
   - Run validation.
   - Write an immutable implementation receipt under `events/`.
   - Write `artifacts/snapshots/pr-draft-<receipt-id>.md`.
   - Regenerate `manifest.yaml`, `projections/pr-draft.md`,
     `projections/implementation-log.md`, and
     `projections/latest-status.yaml`.
   - End the final response with `WORKTREE_IMPLEMENTATION_DONE` only when implementation and validation pass.
6. Open one agent pane or session with the active muxer contract. Pass the handoff file to the agent contract's launch command.
7. Do not open another implementation session for this worktree while one is active.
8. Wait for completion using the muxer contract. Read the final output and verify the marker.
9. If the agent is blocked, fails validation, or omits the marker, append a failed phase-complete receipt and keep the worktree.
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
- next command: `review <ticket-id>`
