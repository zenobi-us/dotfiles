---
name: grill-me
description: A relentless interview to sharpen a plan or design.
disable-model-invocation: true
user-invocable: true
---

## Language

All agent-authored prose MUST follow **ASD-STE100 Simplified Technical English**. Apply it to questions, explanations, recommendations, issue text, reports, handoffs, and procedures.

- Use short, complete sentences and active voice.
- Use one term for one meaning.
- Put conditions before commands.
- Use imperative sentences for procedures.
- Keep code, identifiers, commands, quoted text, product names, and exact domain terms unchanged.
- Use the `iso-24495-1` skill for the full rule set.

## Context resolution

Before reading or writing workflow or domain artifacts, use the `agent-core:shared-context` skill from the repository root. Use the root that the skill resolves as `ALIGNMENT_ROOT`. Use the repository root for source code and ordinary project files. Do not inspect the prompt or environment, or derive an alignment path by hand.

For a write under a shared `ALIGNMENT_ROOT`, use the `agent-core:shared-context` skill to resolve tracker, workflow, source, and ADR targets. Use that skill to update the source index only after a source directory changes and to apply the publishing procedure after the write.
Follow [ALIGNMENT-ROOT.md](../../ALIGNMENT-ROOT.md) for the complete rule.



Call the Skill tool with "grilling".
