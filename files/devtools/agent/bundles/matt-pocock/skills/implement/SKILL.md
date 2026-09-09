---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
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

Commit your work to the current branch.

## Local repository rules

Before reading or writing workflow or domain artifacts:

1. Follow [ALIGNMENT-ROOT.md](../../ALIGNMENT-ROOT.md).
2. Resolve alignment paths against `ALIGNMENT_ROOT`.
3. Keep source code and ordinary project files relative to `repository-root`.
4. Do not silently mix alignment roots.
5. All agent-authored prose MUST follow ASD-STE100 Simplified Technical English.
