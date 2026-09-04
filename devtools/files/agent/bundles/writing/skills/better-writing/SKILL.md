---
name: better-writing
description: Rewrite, draft, and review prose so it is clear, specific, human, and fits its context. Use when improving emails, reports, documentation, marketing copy, UI text, or posts that sound generic, AI-written, verbose, salesy, or formulaic. Covers voice calibration, anti-slop audits, and pre-flight checks.
license: MIT
---

# Better Writing

Use this skill to make prose stronger without flattening the writer. The goal is not to make everything casual or punchy. The goal is to make the text fit its audience, purpose, and medium while removing generic AI tells, filler, fake authority, and formulaic structure.

## Core workflow

1. Read the brief before editing.
   - Identify the audience, channel, purpose, stakes, relationship, and requested dialect.
   - Preserve required facts, citations, constraints, legal wording, quoted text, and formatting.
   - If the user gives a voice sample, treat it as the style source of truth.

2. Set the writing read.
   - State this internally unless the user wants a plan: "Reading this as: [genre] for [audience], with [tone], optimising for [outcome]."
   - Choose dials for directness, warmth, personality, density, evidence, and polish. See `references/voice-and-context.md`.
   - If there is a voice sample, record its profile (sentence lengths, openers, contractions, person, hedges, punctuation, recurring words) before editing and recompute it after. The procedure is under Voice calibration in the same file.

3. Audit the text.
   - For AI-writing tells, use `references/ai-writing-patterns.md`.
   - For slop phrases and formulaic structures, use `references/structures-and-phrases.md`.
   - For genre-specific fingerprints and exemptions, use `references/genre-tells.md`.
   - Work in order: scan for near-conclusive artefacts first; then count clustered tells in context; then apply genre exemptions; never edit on a single feature.
   - Look for clusters of tells, not isolated quirks. The most durable tell is uniform tone that never adapts to audience or genre. Do not destroy valid style just because it is polished.

4. Rewrite. Each rule below is a target with an example of the sentence to write; the ban lists in `references/` are for the audit, not for the rewrite.
   - Keep the meaning and coverage unless the user asks for cuts.
   - Every claim names its actor, object, and evidence. "The compiler rejects a renamed column at build time", not "type safety is improved". When the source is vague and gives no fact to name, keep it vague or mark the gap: "powerful search" does not become "search covers everything you have written". A concrete-sounding claim the source does not contain is worse than a vague one.
   - Sentences say what happens, in the order it happens, with the doer as subject. "The loader parses the file", not "the file is parsed".
   - Sentence length follows the idea: a short sentence for the point, a longer one for the reasoning behind it. "It works. The regex that makes it work took three rewrites and a Friday evening."
   - The first sentence makes the point and the last sentence is the strongest fact or the next action. "The migration runs on Saturday 12 July", not "I wanted to reach out about the migration".
   - The literal phrase wins over the figurative one. "Three services call the same endpoint", not "a symphony of microservices".
   - Subtract and surface. Never add. Cut the tells, then let what the source already holds show through. Do not add a next step, a claim about what has or has not happened, a joke or aside in the writer's manner, a sensory detail, a typo, slang, or a contraction the source lacks. Where a gap needs filling, mark it or ask.
   - When the brief asks for a light edit or to keep the writer's voice, change only what is wrong. A lone word or punctuation mark from a tell list, such as one "delve" or a single em dash, is the writer's choice and stays. So are the writer's contractions or lack of them, first-person sentences, and hedges: on a keep-my-voice brief none of these move.

5. Self-audit and revise.
   - Ask: "What still sounds generic, evasive, or AI-written?" and "Does every word mean something different and additive?"
   - Fix the answer before delivering.
   - Run the pre-flight checklist in `references/preflight.md`.

## Default output

Match the user's requested deliverable.

- For a rewrite request, return the final rewritten text first.
- For a review request, return specific findings before any rewrite.
- For a draft-from-scratch request, deliver the finished draft, not an outline unless the user asked for one.
- Include a short change note only when useful.
- Do not expose a long diagnostic audit unless the user asks for it or the risk is high.
- When editing a file in place, change prose only. Code blocks, inline code, YAML front matter, tables, link targets, image references, and quoted text stay byte for byte. Match the file's existing heading levels and list style. Judge the result by information kept, not by paragraph count matched.

The formatting rules in this skill describe the source text. Current models already format lightly when asked for prose, so apply them to what you are editing, and use headings, lists, and tables in your own output wherever the medium reads better with them.

When the user asks to "humanise", "de-AI", "remove slop", "make this sound less ChatGPT", or similar, use a stricter pass. The target is text that reads as if one person wrote it in one sitting for one reader:

- Sentences end with full stops or commas. Where the source has an em dash or en dash, end the sentence or use a comma; a colon or parentheses in the dash's place swaps one tell for another. En dashes stay in numeric and date ranges. This is a register choice, not detector-evasion. See `references/ai-writing-patterns.md` for the full dash policy, including the lighter touch in normal rewrites.
- Headings are sentence case, bullets carry new information rather than restating a label, and emoji appear only where the medium expects them.
- The text speaks to its reader and never to a chat user: no "let me know", "here is", "of course", knowledge-cutoff disclaimers, or other pasted chatbot artefacts.
- Every sentence is literal. "Please remove all mannered prose" is the one-line version: where a plain phrase is available, use it.
- The last sentence is the real point. No vague positive ending.

## Editing principles

- Specific beats impressive. Name the person, object, constraint, date, place, evidence, or trade-off.
- Direct beats announced. Do the thing instead of saying "let's explore" or "here's what matters".
- Context beats blanket rules. A support email, a board memo, a product page, and a personal essay need different levels of warmth and polish.
- Voice beats cleanliness. Preserve human asides, mixed feelings, unusual details, and defendable quirks.
- Evidence beats authority theatre. Replace "experts say" with the named source or remove the claim.
- Trust the reader. Cut hand-holding, moralising, and permission-giving unless the relationship calls for reassurance.
- Flat is a tell too. After the cuts, check the piece still has a position, varied rhythm, and detail only this writer would use. Surface what the source has; never invent it. See `references/voice-and-context.md`.

## Guardrails

- Do not invent facts, quotes, names, studies, links, or statistics to make prose feel concrete. The same applies to next steps, claims about what has or has not happened, opinions, and jokes or asides in the writer's manner. Invented voice is fabrication.
- Do not invent a baseline. "Healthy", "well within range", and "realistic" need a named comparison in the source.
- Editing is not fact-checking. If a fact in the source looks wrong, flag it in a note. Do not silently correct it.
- Do not make neutral reference, legal, medical, financial, or technical text more opinionated than the genre allows.
- Do not remove nuance that protects accuracy.
- Do not over-compress if it drops required coverage.
- Do not rewrite quoted text unless the user explicitly asks.
- Preserve code identifiers, API names, product names, regulatory terms, and exact UI labels unless the task is to rename them.

## References

- `references/voice-and-context.md`: audience, genre, dials, voice calibration, and genre exemptions.
- `references/ai-writing-patterns.md`: AI-writing tells, confidence tiers, near-conclusive artefacts, and false-positive checks.
- `references/structures-and-phrases.md`: slop phrase and structure audit.
- `references/genre-tells.md`: genre-specific phrase banks for email, social, marketing, academic, fiction, and code.
- `references/preflight.md`: final delivery checks and scoring.
- `references/sources.md`: source projects and attribution notes.
