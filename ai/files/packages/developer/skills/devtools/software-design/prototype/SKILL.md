---
name: prototype
description: Use when object creation is expensive or dynamic and cloning existing configured instances is safer than rebuilding from scratch.
pattern: Prototype
family: creational
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Prototype

## Intent
Create new objects by cloning an existing prototype instance, reducing dependence on concrete constructors and enabling fast creation of preconfigured variants.

## Applicability Signals
- Signal 1: Object initialization is costly or involves many configuration defaults.
- Signal 2: Runtime needs produce many similar objects with minor differences.
- Signal 3: Concrete classes are hidden or unavailable to direct callers, but cloning is permitted.

## Contraindications
- Case 1: Objects are small/simple and constructor cost is negligible.
- Case 2: Deep graph cloning rules are unclear, making copy semantics risky.
- Case 3: Shared mutable references would cause clone side effects.

## Decision Heuristics
- If you need rapid creation of configured variants and can define safe clone semantics, prefer Prototype.
- If object creation differences are primarily behavioral family selection, Abstract Factory may be cleaner.
- Decision anti-bias note: do not use cloning to hide poor domain modeling or unclear ownership boundaries.

## Implementation Checklist
- [ ] Define clone contract (copy constructor, `clone()`, or equivalent API).
- [ ] Specify shallow vs deep copy behavior explicitly for each field category.
- [ ] Register/manage canonical prototype instances where needed.
- [ ] Ensure cloned objects can be post-tuned without mutating source prototype.
- [ ] Add tests for independence, deep-copy correctness, and reference-isolation rules.

## Misuse Checks
- Misuse 1: Clone shares mutable child objects unexpectedly → Remediation: implement deep copy for mutable ownership graph.
- Misuse 2: Prototype registry becomes global hidden dependency → Remediation: inject registry/context explicitly.
- Misuse 3: Cloning bypasses domain invariants enforced by constructors → Remediation: enforce invariants in clone finalization/validation.

## Verification Rubric
- Correctness:
  - [ ] Cloned instance preserves required baseline state.
  - [ ] Clone modifications do not mutate original prototype.
- Design quality:
  - [ ] Clone semantics are documented and test-backed.
  - [ ] Prototype lifecycle and ownership are explicit.
- Regression safety:
  - [ ] Tests cover shallow/deep copy boundaries and mutable-reference isolation.

## Language-Specific Adaptations (Optional)
- TypeScript: implement explicit copy functions; avoid JSON clone shortcuts for class-rich graphs.
- Python: choose between `copy.copy` and `copy.deepcopy` deliberately and document custom `__deepcopy__` behavior.
- Go: implement clone helpers with explicit field handling; copy pointer fields carefully.

## Related Patterns (Optional)
- Builder: use when controlled stepwise assembly is needed instead of clone-first creation.
- Singleton: avoid combining with global mutable singletons unless clone boundaries are strict.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/prototype
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
