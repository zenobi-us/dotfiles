# Claim a ticket

1. Read the current ticket and configured claim operation. Inspect durable ownership evidence, owner liveness and active workflow/coordinator reservations. `claimed` alone proves neither current ownership nor phase progress.
2. If this workflow already holds the claim, retain it idempotently; do not clear, reassign or toggle state to rerun a phase. Observe a live owner rather than duplicate its work. Unknown or different ownership requires explicit scoped takeover approval and resolved liveness/reservations before mutation. Never auto-kill an agent.
3. Apply only the missing configured claim operation or explicitly consented transfer. Do not guess that assignment, a label, or a status change means “claimed.” Record the observed ownership and approval through the worktree's append-only recovery provenance when applicable; add no ticket frontmatter state.
4. Read the ticket back before source work starts and report whether the claim was retained or changed, with validation/publication evidence. Claiming is not an implementation receipt and does not select a worktree phase.
5. Do not change triage unless the user asks for that change.