---
description: Review completed Worktrunk work in Herdr and persist a verdict.
---

Review completed work for the resolved ticket scope in the current or inferred Worktrunk worktree.

## Ticket resolution

Resolve the ticket before reviewing work.

1. Use an explicit issue or ticket identifier in `UserRequest`.
2. If `UserRequest` has no identifier, use the most recent unambiguous ticket mention in the conversation.
3. Cross-check the inferred ticket against the current worktree and persisted workflow or review records.
4. If no unique ticket matches, or candidates conflict, ask the user which ticket to review.
5. Do not guess or silently choose a ticket.

Use conversation context only to identify the scope. Do not use it as evidence that the review passed.

# Preconditions

- Require `HERDR_ENV=1`. If Herdr is not active, stop.
- Use the `worktrunk` skill. Worktrunk is required for worktree and branch inspection.
- Use the Matt Pocock `code-review` skill.
- Treat the shared agent context as durable project memory. Resolve `ALIGNMENT_ROOT` from `<shared-agent-context>` or fall back to the repository root. Follow `ALIGNMENT-ROOT.md` before reading alignment files.
- Prefer `storage="shared"` for memory shared across worktrees when it is active. Record any durable domain or architecture decision with `domain-modeling` or `codebase-design` in the active alignment storage.
- Do not change source code during review.
- Do not rely on chat context as the review gate.

# Exit early

Ask the user for the missing ticket before continuing. Exit only if the ticket remains unresolved.

You must identify all of these items:

1. The Worktrunk worktree.
2. The source branch or pull request.
3. The issue, ticket, or requested scope.

# Process

1. Resolve the active `ALIGNMENT_ROOT` and run `/eng-context report`.
2. Read the relevant `CONTEXT.md` or `CONTEXT-MAP.md`, ADRs, and `docs/agents/` files from the active alignment root.
3. Resolve the current Herdr worktree with `herdr worktree list --cwd "$PWD" --json`.
4. Use Worktrunk and Git to identify the source branch, base branch, and actual diff.
5. Use the `code-review` skill, and use `domain-modeling` or `codebase-design` when the findings concern domain terms or module boundaries.
6. Review the work against:
   - the ticket requirements,
   - repository standards,
   - recorded validation output,
   - the actual diff against the base branch.
7. Run the smallest validation command that proves the reviewed work passes.
8. Write a persistent review artifact with the exact scope, source branch, base branch, commit, active `ALIGNMENT_ROOT`, findings, validation command, validation result, verdict, and timestamp.
9. Use `SUCCESS` when no blocking findings remain. Use `FAILURE` when blocking findings remain.
10. If the verdict is `FAILURE`, ask whether to run `worktree-fix`. Pass only the blocking findings, exact files, and validation command.
11. If the verdict is `SUCCESS`, ask whether to run `worktree-finish` or `worktree-submit`.

# Output

Use this format:

```md
## Verdict
SUCCESS or FAILURE

## Scope
{issue, branch, pull request, or user request reviewed}

## Findings
- {blocking finding, or "None"}

## Validation
- {command}: {result}

## Review artifact
{path}

## Next step
{Ask for worktree-finish/worktree-submit or worktree-fix.}
```

UserRequest: $ARGUMENTS
