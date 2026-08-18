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
- Store review artifacts under `<ALIGNMENT_ROOT>/docs/agents/reviews/{ticket-id}.md`, inside the active shared agent context root. Never write review artifacts to `/tmp` or leave them only in chat.
- Follow `SHARED-CONTEXT-LINKS.md`'s write rule for every file you create or update under `ALIGNMENT_ROOT`. `worktree-finish`, `worktree-fix`, and `worktree-submit` read the review artifact from there and will not see an uncommitted or unpushed copy.
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
   - the actual diff against the base branch,
   - every relevant ADR in the active alignment root.
7. For every blocking finding, identify the violated ADR. Record each finding in this format:
   ```md
   {ADR id} {ADR name} : {violation description}

     - [filename:lineno] {specific finding}
   ```
   Use the exact ADR ID and name. Include one file and line reference for each affected location. If no ADR applies, write `NO ADR` and state why the finding is blocking.
8. Run the smallest validation command that proves the reviewed work passes.
9. Write the review artifact to `<ALIGNMENT_ROOT>/docs/agents/reviews/{ticket-id}.md`, overwriting any prior review artifact for the same ticket. Include the exact scope, source branch, base branch, commit, active `ALIGNMENT_ROOT`, findings, validation command, validation result, verdict, and timestamp.
   - If `storage="shared"`, follow `SHARED-CONTEXT-LINKS.md`'s write rule for the review artifact before reporting the verdict.
10. Use `SUCCESS` when no blocking findings remain. Use `FAILURE` when blocking findings remain.
11. If the verdict is `FAILURE`, ask whether to run `worktree-fix`. Pass only the blocking findings, ADR references, exact files, and validation command.
12. If the verdict is `SUCCESS`, ask whether to run `worktree-finish` or `worktree-submit`.

# Output

Use this format:

```md
## Verdict
SUCCESS or FAILURE

## Scope
{issue, branch, pull request, or user request reviewed}

## Findings
- {blocking finding, or "None"}

For each blocking finding, use:

```md
{ADR id} {ADR name} : {violation description}

  - [filename:lineno] {specific finding}
```

Use `NO ADR` when no ADR applies. State why the finding is blocking.

## Validation
- {command}: {result}

## Review artifact
{path}

## Next step
{Ask for worktree-finish/worktree-submit or worktree-fix.}
```

UserRequest: $ARGUMENTS
