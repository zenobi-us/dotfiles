---
id: dpatr002
title: Refactoring.Guru content usage boundaries for derivative skill authoring
created_at: 2026-03-04T20:27:00+10:30
updated_at: 2026-03-04T20:27:00+10:30
status: completed
epic_id: dpat2601
phase_id: dpatp101
related_task_id: dpat1101
---

# Research: Refactoring.Guru content usage boundaries for derivative skill authoring

## Research Questions
1. What does Refactoring.Guru explicitly permit for reuse from public pages?
2. What practical boundary should govern skill generation in this repo?
3. What attribution standard is required for every derivative skill artifact?

## Summary
Refactoring.Guru’s **Content Usage Policy** explicitly allows quoting website text only when it is **not a substantial part** of an article and allows reuse of up to **10 illustrations total** across publications/presentations, with required hyperlink attribution to source pages. Footer language still asserts “All rights reserved,” and Terms are generic; therefore this project should adopt a conservative boundary: extract concepts and pattern taxonomy, rewrite all prose originally, and avoid copying artwork.

## Findings
### Source inventory audited
- `https://refactoring.guru/design-patterns` (catalog + taxonomy signal)
- `https://refactoring.guru/design-patterns/strategy`
- `https://refactoring.guru/design-patterns/factory-method`
- `https://refactoring.guru/design-patterns/observer`
- `https://refactoring.guru/content-usage-policy`
- `https://refactoring.guru/terms`
- `https://refactoring.guru/ebook-license`

### Explicit policy signals captured
- Content Usage Policy states:
  - “While most of this website is protected by copyright…”
  - free usage allowed with hyperlink attribution
  - text citation allowed if not a substantial part
  - up to 10 illustrations total unless additional permission is granted via email
- Site footer states “2014-2026 Refactoring.Guru. All rights reserved.”
- eBook license is personal-use-focused and disallows sharing/redistribution patterns; treat premium book content as out of scope for derivative authoring.

### Derivative-content boundary matrix (for dpat2601)
| Content type | Allowed | Not allowed |
|---|---|---|
| Pattern names / catalog grouping (Creational, Structural, Behavioral) | Reuse as factual taxonomy with source attribution | Claim taxonomy as original without citation |
| High-level factual relationships between patterns | Re-express in original wording | Copying “Relations with other patterns” prose blocks verbatim or near-verbatim |
| Explanatory text (Intent, Problem, Solution, Applicability, Pros/Cons) | Fresh rewrite from first principles; optionally one short attributed quote if non-substantial | Bulk paraphrase of one source article, stitched sentence-level rewrites, or long excerpts |
| Code examples / pseudocode from source pages | Recreate independently from pattern knowledge, with different naming/structure | Copying source pseudocode or language examples directly |
| Illustrations/diagrams from site | Prefer zero reuse; if reused, keep strict count <=10 and include required source hyperlink | Unattributed image reuse, or reuse beyond policy limits without permission |

### Required attribution contract (to embed in dpat1102 template)
Every generated pattern skill must include a references section with:
1. Source site: `Refactoring.Guru`
2. Source page URL(s)
3. Derivation note: “Concepts derived from referenced source(s); explanatory wording rewritten for this repository.”
4. If any short quote is used: quote marker + exact URL.

### Operational guardrails for authoring workflow
- Guardrail 1: No copy-paste from source pages into skill bodies.
- Guardrail 2: Enforce originality check by scanning for long shared n-grams before finalizing.
- Guardrail 3: Keep direct quotes exceptional and short.
- Guardrail 4: Keep all premium eBook content out of source material unless explicit licensed review path is added later.

## References
- Refactoring.Guru — Design Patterns: https://refactoring.guru/design-patterns
- Refactoring.Guru — Strategy: https://refactoring.guru/design-patterns/strategy
- Refactoring.Guru — Factory Method: https://refactoring.guru/design-patterns/factory-method
- Refactoring.Guru — Observer: https://refactoring.guru/design-patterns/observer
- Refactoring.Guru — Content Usage Policy: https://refactoring.guru/content-usage-policy
- Refactoring.Guru — Terms & Conditions: https://refactoring.guru/terms
- Refactoring.Guru — eBook License: https://refactoring.guru/ebook-license
- Verification evidence: terminal `lynx -dump -nolist` captures stored under `/tmp/dpat1101-*.txt` during task execution.
