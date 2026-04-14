---
name: visitor
description: Use when stable object structures need new operations added frequently without modifying each element class.
pattern: Visitor
family: behavioral
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Visitor

## Intent
Separate operations from object structures by moving operation logic into visitor implementations that can be applied across element types. This enables adding new operations without editing existing element classes.

## Applicability Signals
- Signal 1: Element hierarchy is stable, but new cross-cutting operations are added often.
- Signal 2: Operation logic is currently scattered via repeated type checks across codebase.
- Signal 3: Teams need explicit operation grouping independent of element ownership.

## Contraindications
- Case 1: Element hierarchy changes frequently, causing high visitor maintenance churn.
- Case 2: Only one or two operations exist and are unlikely to expand.
- Case 3: Dynamic polymorphism or simple methods on elements provide clearer ownership.

## Decision Heuristics
- If new operations outpace element-type changes, prefer Visitor.
- If element types evolve rapidly, keep behavior closer to elements or use other extension mechanisms.
- Decision anti-bias note: avoid visitor when double-dispatch complexity exceeds operational benefits.

## Implementation Checklist
- [ ] Define element interface with `accept(visitor)` contract.
- [ ] Define visitor interface with one visit method per concrete element type.
- [ ] Implement concrete visitors for each operation family.
- [ ] Ensure element classes call correct visitor method (double dispatch).
- [ ] Add tests for all element-visitor pairings used in production paths.

## Misuse Checks
- Misuse 1: New element type added without visitor updates → Remediation: enforce compile-time/interface checks and failing tests for missing visit methods.
- Misuse 2: Visitor gains mutable shared state causing order-dependent bugs → Remediation: scope visitor state per traversal or make it immutable.
- Misuse 3: Visitor methods include element-specific business mutations unrelated to operation intent → Remediation: keep domain mutations in element/services, visitor for operation projection/processing.

## Verification Rubric
- Correctness:
  - [ ] Each element dispatches to the correct visitor method.
  - [ ] New visitor can add operation behavior without modifying existing elements.
- Design quality:
  - [ ] Operation logic is centralized by visitor concern.
  - [ ] Element classes stay focused on structural/domain responsibilities.
- Regression safety:
  - [ ] Tests cover at least one full traversal invoking visitor across multiple element types.

## Language-Specific Adaptations (Optional)
- TypeScript: use discriminated unions and exhaustive visitor typings to prevent missing visit branches.
- Python: prefer explicit `accept` methods; `functools.singledispatch` can emulate variant dispatch with care.
- Go: model visitor interfaces clearly; enforce coverage by compile-time interface assertions.

## Related Patterns (Optional)
- Iterator: iterator controls traversal; visitor defines operation applied during traversal.
- Composite: visitors are commonly applied across composite element trees.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/visitor
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
