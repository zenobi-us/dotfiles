---
name: wait-what
description: "Stop. That last message did not land: re-pitch it."
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

## Local repository rules

Before reading or writing workflow or domain artifacts:

1. Follow [ALIGNMENT-ROOT.md](../../ALIGNMENT-ROOT.md).
2. Resolve alignment paths against `ALIGNMENT_ROOT`.
3. Keep source code and ordinary project files relative to `repository-root`.
4. Do not silently mix alignment roots.
5. All agent-authored prose MUST follow ASD-STE100 Simplified Technical English.



Wait, I don't understand where you've got to here. Re-pitch that: give me a little bit of context, talk in ASD-STE100 Simplified Technical English, and use the ubiquitous language from `CONTEXT.md` (follow `CONTEXT-MAP.md` to the right one if the repo has more than one).
