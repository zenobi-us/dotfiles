# Playbook: continue

`continue` resumes an in-flight ticket by finding its last known state and re-dispatching to the correct next subcommand's playbook.

## Ticket resolution

Run the shared-context CLI from the repository before reading tracker
configuration, workflow records, or review artifacts. Use its reported
alignment `root` as `ALIGNMENT_ROOT` and read
`docs/agents/issue-tracker.md` from that root. Load `references/issue-tracker.md`
and the ticket skill. Resolve the selector and return the canonical ticket
`ref` and backend. Then run
`shared-context resolve workflow --id <ticket-id>`. Do not derive paths. Ask
when the selector is missing or ambiguous.

## Process

1. Resolve the ticket and workflow root.
2. Read `manifest.yaml`, `events/`, and the immutable review artifacts under
   `artifacts/reviews/`.
3. Determine the last known state from the latest valid event. Use projections
   only as convenience views:
   - No review artifact yet → next step is `review`.
   - Latest review receipt has `verdict: FAILURE` → next step is `fix`.
   - Latest review receipt has `verdict: SUCCESS`, no submit receipt exists →
     next step is `submit` or `finish`. Ask which.
   - Latest review receipt has `verdict: SUCCESS` and a submit receipt exists →
     nothing remains to continue. Report this and stop.
4. If step 3 is ambiguous, an event parent is missing, or the worktree no longer
   exists, ask the user which step to resume. Do not guess.
5. Re-resolve the muxer and agent with the `muxer-subagents` skill, then dispatch to
   the selected playbook with the same resolved ticket.

## Unchanged

Whatever playbook `continue` dispatches to carries its own full Preconditions, Process, and Safety rules. `continue` only decides which one to call.
