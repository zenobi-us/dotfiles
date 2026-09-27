# Playbook: review

Review completed work for the resolved ticket scope in the current or inferred Worktrunk worktree.

Review never opens a new pane or launches a fresh agent — it only inspects the current worktree. The muxer and agent contracts do not apply to this playbook.

## Ticket resolution

Load `references/issue-tracker.md` and the ticket skill before resolving the ticket. Use the ticket skill to return the canonical `ticket` and `tracker path`. If no identifier is present, use the most recent unambiguous ticket mention in the conversation. Cross-check it against workflow records. Ask when it is missing or ambiguous. Do not guess.

Use conversation context only to identify the scope. Do not use it as evidence that the review passed.

# Preconditions

- Use the `worktrunk` skill. Worktrunk is required for worktree and branch inspection.
- Use the Matt Pocock `code-review` skill.
- Treat the shared agent context as durable project memory. Run `<shared-context-skillroot>/scripts/shared-context/cli.ts` from the repository being reviewed and use its reported `root` and `storage` fields. Do not derive `ALIGNMENT_ROOT` or a ticket path by hand.
- Follow `ALIGNMENT-ROOT.md` from the reported root before reading alignment files. `storage: repository` and a shared store with no remote are valid local-only modes; do not initialise or publish them.
- Use `cli.ts anchor --source local --key <ticket-id>` for ticket-scoped files and use its returned directory. Respect the shared-context access boundary: private or local-only stores use local paths or `SharedContext/<relative-path>`, not public URLs.
- Prefer `storage: shared` for memory shared across worktrees when the CLI reports it. Record any durable domain or architecture decision with `domain-modeling` or `codebase-design` in the active alignment storage.
- Store the review artifact at the path returned by the ticket skill for the active tracker.
- Never write review artifacts to `/tmp` or leave them only in chat.
- Follow the `agent-core:shared-context` skill's write and publishing rules for every file you create or update under the CLI-reported root. The `fix`, `finish`, and `submit` playbooks read the tracker-defined review artifact and will not see an uncommitted or unpushed copy. Stop on a non-zero shared-context CLI result.
- Do not change source code during review.
- Do not rely on chat context as the review gate.

# Exit early

Ask the user for the missing ticket before continuing. Exit only if the ticket remains unresolved.

You must identify all of these items:

1. The Worktrunk worktree.
2. The source branch or pull request.
3. The issue, ticket, or requested scope.

# Process

1. Run the shared-context CLI from the repository being reviewed. Use its reported root and storage mode; do not construct either path manually.
2. Read the relevant `CONTEXT.md` or `CONTEXT-MAP.md`, ADRs, and `docs/agents/` files from that reported root.
3. Resolve the current worktree (for `herdr`: `herdr worktree list --cwd "$PWD" --json`; other muxers have no equivalent lookup — use `git`/`wt` state directly instead).
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
9. Use the ticket skill to write the review artifact at its configured path, overwriting the prior artifact for this ticket. Provide the exact scope, branches, commit, tracker path, findings, validation, verdict, and timestamp. Follow its publication and tracker commit rules.
10. Use `SUCCESS` when no blocking findings remain. Use `FAILURE` when blocking findings remain.
11. If the verdict is `FAILURE`, ask whether to run this skill again with `fix {ticket-id}`. Pass only the blocking findings, ADR references, exact files, and validation command.
12. If the verdict is `SUCCESS`, ask whether to run this skill again with `finish {ticket-id}` or `submit {ticket-id}`.

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
{Ask for finish/submit or fix.}
```
