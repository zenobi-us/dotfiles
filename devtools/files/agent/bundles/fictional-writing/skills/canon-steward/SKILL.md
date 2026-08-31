---
name: canon-steward
description: Separate official canon, secondary sources, and original material, record source evidence and uncertainty, and prevent copied source text when stories use licensed settings.
---

# Canon Steward

Keep setting facts traceable. Store summaries and source evidence. Keep official canon separate from original work. Do not copy a book, webpage, or other source into the repository.

## When to Use

Use this skill when a story uses licensed setting material, when a source adds world facts, when two sources conflict, or when a user asks for official background in repository files.

Use it before `character-designer`, `world-builder`, `faction-designer`, or `story-architect` adds a fact from an external source.

Do not use it to write a story, design original setting material, or decide an unresolved conflict without evidence.

## References

Read `references/source-use-for-character-and-lore.md` when source facts affect a character, faction, place, event, or story.

## Repository Anchors

Read these files before you write:

- `CONTEXT.md` for the project canon boundary and approved terms.
- `docs/agents/narrative-domain.md` for facet types, metadata, and paths.
- `docs/agents/narrative-workflow.md` for storage and update rules.
- Relevant files in `docs/adr/` for hard-to-reverse canon decisions.

Use the active alignment root for `CONTEXT.md`, `docs/adr/`, and `docs/agents/` when the repository defines one. Keep source notes, canon notes, and facets in the repository.

## Canon Layers

Use these labels consistently:

| Label | Meaning |
|---|---|
| `official-red` | Official material for Cyberpunk RED or its stated timeline. |
| `official-2077` | Official material for Cyberpunk 2077 or its stated timeline. |
| `official-other` | Official material from another named Cyberpunk product. |
| `original` | Material created for this repository. |
| `secondary` | A guide, discussion, or summary that is not the primary source. |
| `unverified` | A claim with no reliable source or unresolved evidence. |

Do not treat `secondary` or `unverified` facts as official.

## Source Record

Create one Markdown source record in `docs/sources/` for each external source that contributes facts. Use a short stable filename.

```markdown
---
id: source.cyberpunk-red-example
kind: source
canon: official-red
title: Example Source
publisher: Example Publisher
url: https://example.com/source
accessed: 2026-08-30
---

# Example Source

## Scope

_Record the source sections used by this repository._

## Summary

_Write a short paraphrase. Do not reproduce the source._

## Used claims

- _Claim ID — short paraphrase — page, section, or URL locator._
```

Record the exact title, publisher, URL or file name, access date, and page or section locator when available. Do not invent a locator. State when a locator is unavailable.

## Claim and Facet Rules

Write facts as short paraphrases. Add the source ID and locator to each sourced fact.

Create or update a reusable facet only when a fact can affect another story. Store it in the path defined by `docs/agents/narrative-domain.md`.

Use the canon label in the facet frontmatter. Keep original additions marked `original` even when they extend an official faction, place, or event.

Keep these separate:

- Source claim: what the source states.
- Project interpretation: what the repository infers.
- Original addition: what this project creates.

When a fact is uncertain, write the uncertainty beside the fact. Do not turn an inference into an official claim.

## Conflict Rules

When two sources conflict, preserve both claims first.

Record a reconciliation note in `docs/canon/<slug>-reconciliation.md`:

```markdown
# Cyberpunk RED and Cyberpunk 2077 Reconciliation

## Conflict

_Record the two claims and their source locators._

## Current handling

_Record the selected project rule, if one exists._

## Status

- _resolved, provisional, or unresolved_

## Consequence

_Record what stories must do while the conflict remains._
```

Select a claim only when the project context, an ADR, or stronger source evidence supports the choice. If no evidence selects a claim, mark the conflict `unresolved` and leave the project context unchanged.

Create an ADR only when the project makes a hard-to-reverse decision about the conflict. Do not create an ADR for every source difference.

## Copyright-Safe Source Use

Use source material to identify facts. Write a summary instead of a reproduction.

Do not create a plain-text copy of an official book, webpage, adventure, background story, or other substantial source.

Do not fill a source record with copied paragraphs. Do not create a complete transcript under a new filename. Do not use a source URL as permission to copy its contents.

Store short quotations only when they are necessary, clearly marked, attributed, and permitted by the source terms. Prefer paraphrase.

If the user supplies a source file, use it as evidence. Do not copy the file into the repository. Keep only the needed summaries, claims, and locators.

## Process

### 1. Read the project anchors

Read `CONTEXT.md`, the narrative domain document, the narrative workflow document, and relevant ADRs.

Record the project's canon layers and conflict rule before adding facts. If the project has no conflict rule, mark the decision as an open question.

### 2. Inspect the source

Identify the source type, title, publisher, date, URL or file name, and available locators.

Separate direct source statements from your interpretation. Mark missing or weak evidence as `unverified`.

### 3. Create the source record

Create `docs/sources/` when it does not exist. Add one source record. Add only summaries, claims, citations, and necessary short quotations.

### 4. Extract reusable claims

For each reusable claim, record:

- Claim text in your own words.
- Canon label.
- Era or timeline position.
- Source ID.
- Page, section, or URL locator.
- Confidence or uncertainty.
- Affected facets.

Update existing facets instead of creating duplicates. Add a new facet only when no matching ID exists.

### 5. Reconcile conflicts

Search the existing facets and timeline for related claims.

Preserve conflicting claims and their evidence. Create a reconciliation note when the conflict affects story decisions.

Apply an existing ADR or project conflict rule. Otherwise mark the conflict `unresolved`.

### 6. Report the result

Report:

- Sources read.
- Source records created or updated.
- Claims extracted.
- Facets created or updated.
- Conflicts found.
- Decisions applied.
- Unresolved questions.
- Any source text that was intentionally not copied.

## Common Mistakes

| Mistake | Correct action |
|---|---|
| Copy an official webpage into `.txt` | Create a cited Markdown source record with paraphrased claims. |
| Treat a fan wiki as official | Mark it `secondary` and seek a primary source. |
| Resolve a conflict by choosing the newer source automatically | Apply the project rule or mark the conflict `unresolved`. |
| Mix source facts with original additions | Mark each fact and keep the source claim separate. |
| Invent page numbers or dates | State that the locator is unavailable. |
| Create duplicate faction or place facets | Search stable IDs and update the existing facet. |
| Store all source text in `docs/sources/` | Store only summaries, claims, citations, and permitted short quotations. |
| Change `CONTEXT.md` to settle a local dispute | Record the dispute first. Use an ADR for a hard-to-reverse project decision. |
| Treat an inference as a fact | Label the inference and record its evidence. |

## Completion Criteria

The canon review is complete only when:

- The project anchors were read.
- Each source has a source record or an existing record was updated.
- Each stored claim has a canon label and source locator, when available.
- Reusable claims are stored in the correct facet files, including character facets when applicable.
- Source claims, interpretations, and original additions are separate.
- Conflicts remain traceable to their evidence.
- Unresolved conflicts are marked `unresolved`.
- No substantial source text was copied.
- The report lists all files created or updated and all open questions.

## State Machine

```text
[Request uses licensed material]
              |
              v
[Read CONTEXT, domain docs, ADRs]
              |
              v
[Inspect source]
              |
              v
[Classify claims]
              |
              v
[Create source record]
              |
              v
[Extract paraphrased claims]
              |
              v
[Search existing facets and timeline]
              |
        +-----+-----+
        |           |
        v           v
 [No conflict] [Conflict]
        |           |
        |           v
        |   [Preserve both claims]
        |           |
        |           v
        |   [Apply ADR or rule]
        |           |
        |      +----+----+
        |      |         |
        |      v         v
        | [Resolved] [Unresolved]
        |      |         |
        +------+---------+
               |
               v
[Update reusable facets]
               |
               v
[Report sources, claims, conflicts, omissions]
```
