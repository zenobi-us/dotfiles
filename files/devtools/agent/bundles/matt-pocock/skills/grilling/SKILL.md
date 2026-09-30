---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
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

Interview me relentlessly about every aspect of this until we reach a shared understanding. Walk down each branch of the decision tree, resolving dependencies between decisions one-by-one. Group related questions into rounds, but ask only one question per turn. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing. A round is a related branch of decisions, not a batch of unanswered questions. Asking multiple questions at once is bewildering.

If a *fact* can be found by exploring the environment (filesystem, tools, etc.), look it up rather than asking me. The *decisions*, though, are mine — put each one to me and wait for my answer.

Do not act on it until I confirm we have reached a shared understanding.

## Context resolution

Before reading or writing workflow or domain artifacts, run the shared-context CLI procedure from `agent-core:shared-context` in the repository root. Use its `root` output as `ALIGNMENT_ROOT` and its `repository-root` output for source code and ordinary project files. Do not inspect the prompt or environment, or derive an alignment path by hand.

For a write under a shared `ALIGNMENT_ROOT`, use `cli.ts path` for tracker,
workflow, source, and ADR targets. Run `cli.ts index <dir>` only after a source
directory changes. Read the shared-context publishing procedure after the write.
Follow [ALIGNMENT-ROOT.md](../../ALIGNMENT-ROOT.md) for the complete rule.
