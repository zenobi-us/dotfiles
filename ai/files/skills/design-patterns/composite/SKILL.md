---
name: design-pattern-composite
description: Use when clients must treat individual objects and nested object groups uniformly through one interface.
pattern: Composite
family: structural
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Composite

## Intent
Represent part-whole hierarchies as tree structures so clients can operate on individual elements and compositions using the same interface.

## Applicability Signals
- Signal 1: Domain naturally forms recursive tree structures (UI widgets, file systems, org charts, expression trees).
- Signal 2: Client logic branches repeatedly between leaf handling and collection handling.
- Signal 3: Operations should apply uniformly at any hierarchy depth.

## Contraindications
- Case 1: Structure is flat and unlikely to become hierarchical.
- Case 2: Leaves and containers require radically different APIs with little overlap.
- Case 3: Tree mutability/performance constraints make generic traversal too expensive.

## Decision Heuristics
- If recursive part-whole modeling is central and clients need uniform treatment, prefer Composite.
- If you only need traversal behavior over an existing structure, Iterator may be enough.
- Decision anti-bias note: avoid forcing uniform APIs when domain semantics differ sharply.

## Implementation Checklist
- [ ] Define component interface for shared operations.
- [ ] Implement leaf with direct behavior.
- [ ] Implement composite holding child components and delegating/aggregating operations.
- [ ] Define child-management operations with clear ownership rules.
- [ ] Add recursive tests for depth, ordering, and failure handling.

## Misuse Checks
- Misuse 1: Leaf receives irrelevant child-management methods → Remediation: keep child management only where needed or use safe no-op policy.
- Misuse 2: Composite violates invariants (cycles, duplicate ownership) → Remediation: enforce parent/child integrity checks.
- Misuse 3: Clients depend on concrete leaf/composite checks frequently → Remediation: move behavior into component interface.

## Verification Rubric
- Correctness:
  - [ ] Leaf operation works standalone.
  - [ ] Composite operation correctly aggregates/delegates across nested children.
- Design quality:
  - [ ] Component interface captures meaningful shared behavior.
  - [ ] Hierarchy manipulation rules are explicit and validated.
- Regression safety:
  - [ ] Tests cover single node, multi-level tree, and invalid hierarchy edge cases.

## Language-Specific Adaptations (Optional)
- TypeScript: model `Component` interface and recursive child arrays with readonly where possible.
- Python: dataclass-based leaves/composites can keep tree structure clear.
- Go: use interface + struct composition; guard against cycles in add-child operations.

## Related Patterns (Optional)
- Iterator: traverse composite trees without exposing internal representation.
- Visitor: add operations across composite structures without modifying component classes.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/composite
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
