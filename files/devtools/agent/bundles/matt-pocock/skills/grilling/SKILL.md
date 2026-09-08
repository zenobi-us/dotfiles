---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
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

## Local repository rules

Before reading or writing workflow or domain artifacts:

1. Follow [ALIGNMENT-ROOT.md](../../ALIGNMENT-ROOT.md).
2. Resolve alignment paths against `ALIGNMENT_ROOT`.
3. Keep source code and ordinary project files relative to `repository-root`.
4. Do not silently mix alignment roots.
5. All agent-authored prose MUST follow ASD-STE100 Simplified Technical English.
