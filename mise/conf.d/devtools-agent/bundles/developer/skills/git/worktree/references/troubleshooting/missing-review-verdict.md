# Troubleshooting: submit/finish blocked on review gate

## Symptom

`submit` or `finish` cannot proceed: no immutable `SUCCESS` review receipt covers the current source commit, or the review scope does not match the resolved ticket.

## Cause

The `submit` and `finish` playbooks both hard-require a matching immutable `SUCCESS` receipt from the `review` playbook. The receipt must identify the exact source commit and tree. Chat context saying "it looks fine" does not satisfy this gate. The receipt and review artifact must exist in the configured storage and be published or committed when required.

## Fix

- Do not bypass the gate. Do not fabricate or backdate a review artifact.
- Run the `review` subcommand for this ticket first.
- If the verdict comes back `FAILURE`, run `fix`, then run a fresh `review` for the new source commit.
- If a review receipt exists but its source commit or scope does not match, run a new review for the current source commit. Resolve which ticket is correct before continuing. Ask the user if unclear.

Source: `references/playbooks/submit.md` and `references/playbooks/finish.md` Preconditions.
