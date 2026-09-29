# Use append-only receipts as worktree workflow state

Accepted. Record every worktree phase as an immutable receipt under the ticket anchor, and treat the receipt history as the workflow record. Use generated projections for convenience, but do not treat chat output, pane output, temporary handoffs, or projections as authoritative state.

## Considered Options

- Keep one mutable workflow record.
- Use chat and pane output as the handoff.
- Use append-only receipts with generated projections.

We chose append-only receipts because they preserve the full lifecycle and support reliable recovery after a failed phase.
