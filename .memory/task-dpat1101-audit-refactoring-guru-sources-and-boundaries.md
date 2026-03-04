---
id: dpat1101
title: Audit Refactoring.Guru sources and derivative-content boundaries
epic_id: dpat2601
phase_id: dpatp101
story_id: null
created_at: 2026-03-04T20:04:20+10:30
updated_at: 2026-03-04T20:27:00+10:30
status: completed
assigned_to: session-20260304-2003
---

# Task: Audit Refactoring.Guru sources and derivative-content boundaries

## Objective
Create a source inventory and explicit usage boundaries so design-pattern skills can be authored without licensing ambiguity or accidental copy-heavy derivatives.

## Related Story
N/A

## Steps
1. Crawl Refactoring.Guru pattern index + each candidate pilot pattern page using `lynx` dumps.
2. Record what metadata is safe to reuse (pattern names, intent summaries, relationship mapping) vs what must be rewritten from scratch.
3. Define attribution format required in every generated skill artifact.
4. Produce a boundary matrix with examples of allowed/disallowed content transformations.
5. Store findings in a research artifact linked to epic `dpat2601` and phase `dpatp101`.

## Unit Tests
- N/A (planning/research task).

## Expected Outcome
A reviewed source-boundary document that unblocks skill authoring with clear legal/sourcing guardrails.

## Actual Outcome
Completed source boundary audit and produced:
- `research-dpatr002-refactoring-guru-content-usage-boundaries.md`

Audit established an actionable derivative policy for this project:
- Use Refactoring.Guru for taxonomy anchoring and factual pattern relationships.
- Rewrite all explanatory prose in original language.
- Keep direct quotations short/non-substantial and always attributed.
- Do not reproduce large text sections or artwork without explicit permission.

## Lessons Learned
- Refactoring.Guru publishes a dedicated Content Usage Policy with specific reuse allowances; this is stronger evidence than relying on generic Terms text.
- The safest authoring posture is “concept extraction + full rewrite,” not summary-by-paraphrase of long source passages.
- Embedding mandatory attribution in the template contract (dpat1102) is necessary to prevent drift.
