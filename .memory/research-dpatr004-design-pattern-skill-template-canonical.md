---
id: dpatr004
title: Canonical template for design pattern skills
created_at: 2026-03-04T20:56:30+10:30
updated_at: 2026-03-04T20:56:30+10:30
status: completed
epic_id: dpat2601
phase_id: dpatp101
related_task_id: dpat1102
---

# Research: Canonical template for design pattern skills

## Research Questions
1. What concrete authoring template should pattern skill writers fill in?
2. How do we encode strict source policy directly in the template?

## Summary
This artifact provides the canonical, fill-in template contract for pattern-skill authoring. It encodes mandatory metadata/sections and includes explicit quality gates to enforce: no direct quotes and no Refactoring.Guru images.

## Findings

## Template Specification

```markdown
---
name: design-pattern-<pattern-name>
description: Use when <decision signal>. Helps <outcome> while avoiding <common failure mode>.
pattern: <Pattern Name>
family: <creational|structural|behavioral>
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: <Pattern Name>

## Intent
- Explain the core intent in original repository wording.
- Include expected benefit and boundary of applicability.

## Applicability Signals
- Signal 1: <observable code/design condition>
- Signal 2: <observable change-frequency condition>
- Signal 3: <observable runtime/configuration condition>

## Contraindications
- Case 1 where the pattern adds unnecessary complexity.
- Case 2 where a simpler construct is sufficient.
- Case 3 where this pattern harms clarity/performance.

## Decision Heuristics
- If <condition A> and <condition B>, prefer this pattern.
- If <condition C>, consider <alternative pattern> instead.
- Decision anti-bias note: identify overengineering trigger.

## Implementation Checklist
- [ ] Define participating roles/interfaces.
- [ ] Isolate variation point(s).
- [ ] Implement minimal structure first.
- [ ] Add extension seam(s) with tests.
- [ ] Document tradeoffs.

## Misuse Checks
- Misuse 1: <symptom> → Remediation: <action>
- Misuse 2: <symptom> → Remediation: <action>
- Misuse 3: <symptom> → Remediation: <action>

## Verification Rubric
- Correctness:
  - [ ] Core behavior works for primary path.
  - [ ] Extension path works without modifying stable client code.
- Design quality:
  - [ ] Pattern roles are explicit and coherent.
  - [ ] Coupling and complexity are justified.
- Regression safety:
  - [ ] Tests cover baseline + extension scenario.

## Language-Specific Adaptations (Optional)
- TypeScript:
- Python:
- Go:

## Migration Guidance (Optional)
- Current anti-pattern signal:
- Incremental migration sequence:
- Rollback strategy:

## Related Patterns (Optional)
- Closest alternatives and when to choose them.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/<pattern-slug>
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
```

## Authoring Compliance Checklist
- [ ] All mandatory frontmatter keys present.
- [ ] All mandatory sections present.
- [ ] No markdown images (`![](...)`).
- [ ] No source quotations or blockquote excerpts.
- [ ] Attribution section complete.

## References
- Contract baseline: `research-dpatr003-design-pattern-skill-schema-contract.md`
- Boundary policy: `research-dpatr002-refactoring-guru-content-usage-boundaries.md`
