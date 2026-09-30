---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
user-invocable: true
---

## Language

All agent-authored prose MUST follow **ASD-STE100 Simplified Technical English**. Apply it to questions, explanations, recommendations, issue text, reports, handoffs, and procedures.

- Use short, complete sentences and active voice.
- Use one term for one meaning.
- Put conditions before commands.
- Use imperative sentences for procedures.
- Keep code, identifiers, commands, quoted text, product names, and exact domain terms unchanged.
- Use the `simple-english` skill for the full rule set.

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the committed, staged, and unstaged changes. The review MUST include the worktree when the implementation is not committed yet.

Before implementation, use the `reading-and-writing-tickets` skill to resolve the ticket, read its requirements and blockers, claim it, and run any configured local tracker preflight.

Commit your work to the current branch. Before every commit, call the `writing-and-creating-git-commits` skill. Pass the resolved ticket reference from the ticket skill. Keep the commit title within the normal subject limit.

Use the `reading-and-writing-tickets` skill to update ticket state. Set completion only after validation, review, merge, and push succeed.

## Context resolution

Before reading or writing workflow or domain artifacts, run the shared-context CLI procedure from `agent-core:shared-context` in the repository root. Use its `root` output as `ALIGNMENT_ROOT` and its `repository-root` output for source code and ordinary project files. Do not inspect the prompt or environment, or derive an alignment path by hand.

For a write under a shared `ALIGNMENT_ROOT`, use `cli.ts path` for tracker,
workflow, source, and ADR targets. Run `cli.ts index <dir>` only after a source
directory changes. Read the shared-context publishing procedure after the write.
Follow [ALIGNMENT-ROOT.md](../../ALIGNMENT-ROOT.md) for the complete rule.
