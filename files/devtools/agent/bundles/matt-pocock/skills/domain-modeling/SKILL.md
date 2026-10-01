---
name: domain-modeling
description: Build and sharpen a project's domain model. Use when the user wants to pin down domain terminology or a ubiquitous language, record an architectural decision, or when another skill needs to maintain the domain model.
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

# Domain Modeling

Before reading or writing domain artifacts, load `agent-core:shared-context`, then run `shared-context` in the repository root. Use its reported `root` as `ALIGNMENT_ROOT`; every structure below is rooted at that CLI-reported root. Follow [ALIGNMENT-ROOT.md](../../ALIGNMENT-ROOT.md).

Actively build and sharpen the project's domain model as you design. This is the *active* discipline — challenging terms, inventing edge-case scenarios, and writing the glossary and decisions down the moment they crystallise. (Merely *reading* `CONTEXT.md` for vocabulary is not this skill — that's a one-line habit any skill can do. This skill is for when you're changing the model, not just consuming it.)

Inspect source code and committed domain artifacts when you check the model. Use `/reading-and-writing-tickets` to read issue tracker content and resolve its canonical path or URL. Treat that content as planning input, not as codebase truth. This skill owns domain terms and decisions, not ticket mechanics.

## File structure

Read `CONTEXT-MAP.md` under the CLI-reported `ALIGNMENT_ROOT`.

For one domain, the map points to:

```text
<ALIGNMENT_ROOT>/CONTEXT.md
<ALIGNMENT_ROOT>/docs/adr/
```

For multiple domains, the map points to:

```text
<ALIGNMENT_ROOT>/domains/<domain>/CONTEXT.md
<ALIGNMENT_ROOT>/docs/adr/
```

Keep ADRs central under `docs/adr/`. Do not put domain documents or ADRs under
the repository source tree.

Create files lazily. Update `CONTEXT-MAP.md` when you create the first domain
document. Update `docs/adr/index.md` when you add or rename an ADR.

## During the session

### Challenge against the glossary

When the user uses a term that conflicts with the existing language in `CONTEXT.md`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things."

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"

### Update the domain context inline

When a term is resolved, update the domain file linked from `CONTEXT-MAP.md`
immediately. Use root `CONTEXT.md` for one domain and
`domains/<domain>/CONTEXT.md` for multiple domains. Do not batch these updates.
Use the format in [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md). After a shared-root
write, read the shared-context publishing procedure.

`CONTEXT.md` should be totally devoid of implementation details. Do not treat `CONTEXT.md` as a spec, a scratch pad, or a repository for implementation decisions. It is a glossary and nothing else.

### Offer ADRs sparingly

Only offer to create an ADR when all three are true:

1. **Hard to reverse** — the cost of changing your mind later is meaningful
2. **Surprising without context** — a future reader will wonder "why did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons

If any of the three is missing, skip the ADR. Use the format in
[ADR-FORMAT.md](./ADR-FORMAT.md), resolve its path with
`shared-context path adr --id <ID>`, and update `docs/adr/index.md`.

## Context resolution

Before reading or writing workflow or domain artifacts, load `agent-core:shared-context`, then run `shared-context` in the repository root. Use its `root` output as `ALIGNMENT_ROOT` and its `repository-root` output for source code and ordinary project files. Do not inspect the prompt or environment, or derive an alignment path by hand.

For a write under a shared `ALIGNMENT_ROOT`, use `shared-context path` for tracker,
workflow, source, and ADR targets. Run `shared-context index <dir>` only after a source
directory changes. Read the shared-context publishing procedure after the write.
Follow [ALIGNMENT-ROOT.md](../../ALIGNMENT-ROOT.md) for the complete rule.
