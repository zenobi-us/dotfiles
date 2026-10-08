---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
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



Spin up a **background agent** to do the research, so you keep working while it reads.

Its job:

1. Investigate the question against **primary sources** (official docs, source code, specs, first-party APIs), not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Write the findings to a single Markdown file, citing each claim's source.
3. Save it where the repo already keeps such notes; match the existing convention, and if there is none, put it somewhere sensible and say where.
