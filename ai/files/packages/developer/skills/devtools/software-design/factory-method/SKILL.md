---
name: design-pattern-factory-method
description: Use when object creation varies by context and you need to extend product types without rewriting client orchestration code.
pattern: Factory Method
family: creational
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Factory Method

## Intent
Define a creation hook in a base creator and let concrete creators decide which concrete product to instantiate. This separates product-selection volatility from stable client workflows.

## Applicability Signals
- Signal 1: Constructors are selected through repeated `if/else` or `switch` branches across multiple call sites.
- Signal 2: New product variants appear regularly and force edits in existing orchestrator code.
- Signal 3: Different deployment/runtime contexts require different product implementations behind one shared interface.

## Contraindications
- Case 1: There is only one product implementation and no expected variant growth.
- Case 2: Product differences are trivial configuration values, not distinct behavior.
- Case 3: Team cannot sustain extra creator subclasses and resulting class-count overhead.

## Decision Heuristics
- If product families are likely to expand while usage flow should remain stable, prefer Factory Method.
- If creation rules are static and centralized, a plain constructor or simple factory function is usually enough.
- Decision anti-bias note: do not introduce subclass hierarchies just to look “pattern-complete.”

## Implementation Checklist
- [ ] Define product interface/contract and concrete products.
- [ ] Define creator abstraction with factory method signature.
- [ ] Implement concrete creators that override the factory method.
- [ ] Keep client logic dependent on creator/product abstractions only.
- [ ] Add tests proving new creator/product pairs require no client changes.

## Misuse Checks
- Misuse 1: Creator subclasses only differ by one literal value → Remediation: collapse to parameterized constructor/factory function.
- Misuse 2: Client still checks concrete product types after creation → Remediation: move behavior to product interface methods.
- Misuse 3: Factory method starts returning unrelated product contracts → Remediation: tighten product interface and split creators by responsibility.

## Verification Rubric
- Correctness:
  - [ ] Primary creator returns expected product variant for baseline context.
  - [ ] New creator/product extension works without changes to client orchestration.
- Design quality:
  - [ ] Creator and product roles are explicit, minimal, and cohesive.
  - [ ] Concrete types are isolated from client dependency boundaries.
- Regression safety:
  - [ ] Tests cover baseline creation path and one extension path.

## Language-Specific Adaptations (Optional)
- TypeScript: use abstract classes or interface-driven creators with discriminated return typing where needed.
- Python: prefer ABC protocols for product contracts; factory method can be instance or class-level based on context.
- Go: model creator/product through interfaces; keep constructor functions private to packages when possible.

## Related Patterns (Optional)
- Abstract Factory: choose when you need coordinated creation of multiple related product types.
- Template Method: combine when creator workflow is fixed but one creation step varies.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/factory-method
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
