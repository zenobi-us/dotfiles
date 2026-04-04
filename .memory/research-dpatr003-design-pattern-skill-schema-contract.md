---
id: dpatr003
type: research
title: Design pattern skill schema contract (strict derivative policy)
created_at: "2026-03-04T20:56:00+10:30"
updated_at: "2026-03-04T20:56:00+10:30"
status: completed
epic_id: dpat2601
phase_id: dpatp101
related_task_id: dpat1102
---

# Research: Design pattern skill schema contract (strict derivative policy)

## Research Questions
1. What canonical schema is required for pattern-skill authoring in this repo?
2. Which sections are mandatory vs optional?
3. How do we enforce strict source policy (no direct quotes, no images) while preserving attribution?
4. Does the schema hold for Strategy, Factory Method, and Observer?

## Summary
Defined a canonical schema contract for design-pattern skills with hard validation rules. The contract converts source boundaries into non-optional constraints: generated skills must contain original prose, must not include direct quotations from Refactoring.Guru, and must not include any Refactoring.Guru images. Attribution is still mandatory through source URL references and derivation notes.

## Findings

## Contract Scope
This contract governs all design-pattern skill artifacts to be authored in `dpatp102+` and applies to every pattern regardless of language or stack.

## Mandatory Frontmatter Schema
Every pattern skill MUST include:
- `name`: kebab-case skill identifier (`design-pattern-<pattern-name>`)
- `description`: one sentence describing when to use the pattern
- `pattern`: canonical pattern name
- `family`: one of `creational`, `structural`, `behavioral`
- `version`: schema version (start at `1.0.0`)
- `strict_source_policy`: literal `no-direct-quotes-no-images`
- `attribution_required`: literal `true`

## Mandatory Sections (and section intent)
1. `# Skill: <Pattern Name>`
2. `## Intent`
3. `## Applicability Signals`
4. `## Contraindications`
5. `## Decision Heuristics`
6. `## Implementation Checklist`
7. `## Misuse Checks`
8. `## Verification Rubric`
9. `## Attribution & Sources`

## Optional Sections
- `## Language-Specific Adaptations`
- `## Migration Guidance`
- `## Related Patterns`

Optional sections can be omitted only if not applicable.

## Hard Policy Rules (non-optional)

### Rule P1 — No Direct Quotes
- No quoted text copied from Refactoring.Guru in generated skills.
- Do not use blockquotes for source excerpts.
- If source provenance is needed, use rewritten summaries only.

### Rule P2 — No Images
- No image embeds, links, or copied diagrams from Refactoring.Guru.
- No markdown image syntax (`![](...)`) in pattern skill content.

### Rule P3 — Original Explanatory Prose
- Intent/problem/solution guidance must be freshly written for this repository context.
- Avoid sentence-level structural mimicry of source pages.

### Rule P4 — Mandatory Attribution Without Quotation
`## Attribution & Sources` MUST include:
- `Source Site: Refactoring.Guru`
- One or more source URLs
- Derivation note: concepts derived, wording rewritten for this repository

### Rule P5 — Premium Content Exclusion
- Do not use or reference premium ebook text/assets as source material.

## Validation Gates
Before marking a skill complete, all gates must pass:
- Gate G1: Required frontmatter keys present.
- Gate G2: Required sections present.
- Gate G3: No markdown image syntax.
- Gate G4: No direct-quote markers (`>` blockquotes, quotation excerpts attributed to source).
- Gate G5: Attribution section includes source site + URLs + derivation note.

## Pilot Pattern Validation

### Strategy
- Applicability signals map cleanly to runtime behavior-switch conditions.
- Contraindications and misuse checks support over-abstraction detection.
- Verification rubric can test strategy replacement without caller changes.

### Factory Method
- Applicability signals map to creation variability and type branching pressure.
- Contraindications detect unnecessary subclass expansion.
- Verification rubric can test creator extension without changing client flow.

### Observer
- Applicability signals map to one-to-many event notification requirements.
- Contraindications detect hidden coupling and uncontrolled notification storms.
- Verification rubric can test subscribe/unsubscribe correctness and update propagation.

Result: schema is complete and compatible across all three pilot patterns.

## References
- Refactoring.Guru — Design Patterns: https://refactoring.guru/design-patterns
- Refactoring.Guru — Strategy: https://refactoring.guru/design-patterns/strategy
- Refactoring.Guru — Factory Method: https://refactoring.guru/design-patterns/factory-method
- Refactoring.Guru — Observer: https://refactoring.guru/design-patterns/observer
- Refactoring.Guru — Content Usage Policy: https://refactoring.guru/content-usage-policy
- Project boundary source: `research-dpatr002-refactoring-guru-content-usage-boundaries.md`
