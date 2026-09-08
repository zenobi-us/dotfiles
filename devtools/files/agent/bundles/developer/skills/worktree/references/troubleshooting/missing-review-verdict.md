# Troubleshooting: submit/finish blocked on review gate

## Symptom

`submit` or `finish` cannot proceed: no persisted `SUCCESS` verdict exists at `<ALIGNMENT_ROOT>/docs/agents/reviews/{ticket-id}.md`, or the file's scope does not match the resolved ticket.

## Cause

The `submit` and `finish` playbooks both hard-require a matching persisted `SUCCESS` verdict from the `review` playbook. Chat context saying "it looks fine" does not satisfy this gate — the review artifact must exist on disk (and be pushed/committed if `storage="shared"`).

## Fix

- Do not bypass the gate. Do not fabricate or backdate a review artifact.
- Run the `review` subcommand for this ticket first.
- If the verdict comes back `FAILURE`, run `fix`, then `review` again (chained automatically by the `fix` playbook).
- If a review artifact exists but its scope does not match, resolve which ticket is actually correct before continuing — ask the user if unclear.

Source: `references/playbooks/submit.md` and `references/playbooks/finish.md` Preconditions.
