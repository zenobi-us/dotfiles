# Playbook: continue

`continue` resumes an in-flight ticket by finding its last known state and re-dispatching to the correct next subcommand's playbook.

## Ticket resolution

Run the shared-context CLI from the repository being worked on before reading tracker configuration, workflow records, or review artifacts. Use its reported `root` as `ALIGNMENT_ROOT` and read `docs/agents/issue-tracker.md` from that root. Do not derive the root or tracker path from the repository path, ticket ID, origin slug, or environment. Then load `references/issue-tracker.md` and the ticket skill. Use the ticket skill to resolve the selector and return the canonical `ticket` and `tracker path`. If no identifier is present, use the most recent unambiguous ticket mention in the conversation. Ask when it is missing or ambiguous. Do not guess.

## Process

1. Resolve the ticket.
2. Read the persisted workflow record for the ticket (written by `start`/`fix`) and the review artifact at the tracker-defined path, if one exists.
3. Determine the last known state from what is present:
   - No review artifact yet → next step is `review`.
   - Review artifact with verdict `FAILURE` → next step is `fix`.
   - Review artifact with verdict `SUCCESS`, no PR recorded → next step is `submit` or `finish` (ask which, per the `review` playbook's own "Next step" output).
   - Review artifact with verdict `SUCCESS` and a PR already recorded → nothing left to continue; report this and stop.
4. If step 3 is ambiguous — conflicting records, a record with no verdict, or a worktree that no longer exists — ask the user which step to resume. Do not guess.
5. Re-run Rule 1 (muxer) and Rule 2 (agent) detection, then dispatch to the playbook named in step 3, passing the same resolved ticket so it does not re-resolve from scratch.

## Unchanged

Whatever playbook `continue` dispatches to carries its own full Preconditions, Process, and Safety rules. `continue` only decides which one to call.
