---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
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



Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS - not the current workspace.

Include a "suggested skills" section in the document, naming which skills the next agent should call the Skill tool for.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
