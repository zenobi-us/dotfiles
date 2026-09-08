# Playbook: continue

`continue` resumes an in-flight ticket by finding its last known state and re-dispatching to the correct next subcommand's playbook.

## Ticket resolution

Same rule as every other subcommand: explicit identifier in `UserRequest`, else the most recent unambiguous ticket mention in the conversation, else ask. Do not guess.

## Process

1. Resolve the ticket.
2. Read the persisted workflow record for the ticket (written by `start`/`fix`) and the review artifact at `<ALIGNMENT_ROOT>/docs/agents/reviews/{ticket-id}.md`, if one exists.
3. Determine the last known state from what is present:
   - No review artifact yet → next step is `review`.
   - Review artifact with verdict `FAILURE` → next step is `fix`.
   - Review artifact with verdict `SUCCESS`, no PR recorded → next step is `submit` or `finish` (ask which, per the `review` playbook's own "Next step" output).
   - Review artifact with verdict `SUCCESS` and a PR already recorded → nothing left to continue; report this and stop.
4. If step 3 is ambiguous — conflicting records, a record with no verdict, or a worktree that no longer exists — ask the user which step to resume. Do not guess.
5. Re-run rule 0 (muxer) and rule 1 (agent) detection, then dispatch to the playbook named in step 3, passing the same resolved ticket so it does not re-resolve from scratch.

## Unchanged

Whatever playbook `continue` dispatches to carries its own full Preconditions, Process, and Safety rules. `continue` only decides which one to call.
