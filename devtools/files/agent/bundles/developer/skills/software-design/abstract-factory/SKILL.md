---
name: abstract-factory
description: Use when you must create compatible sets of related objects without binding client code to concrete classes.
pattern: Abstract Factory
family: creational
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Abstract Factory

## Intent
Provide a single factory interface for creating a family of related products so clients can switch whole families atomically while preserving compatibility between produced objects.

## Applicability Signals
- Signal 1: The system constructs multiple related object types that must remain compatible.
- Signal 2: Environment/brand/platform modes require swapping an entire object family together.
- Signal 3: Client code currently mixes concrete class names across product categories, causing drift and mismatch bugs.

## Contraindications
- Case 1: Only one product type exists; factory families add unnecessary indirection.
- Case 2: Product compatibility constraints are weak and combinations are freely mixed.
- Case 3: The object graph is small and unlikely to vary by family.

## Decision Heuristics
- If you need a coherent suite of products selected as one unit, prefer Abstract Factory.
- If only a single product creation point varies, Factory Method may be simpler.
- Decision anti-bias note: avoid creating family abstractions before concrete compatibility constraints are real.

## Implementation Checklist
- [ ] Define abstract product interfaces for each product role.
- [ ] Define abstract factory interface with one method per product role.
- [ ] Implement concrete factories that produce internally compatible products.
- [ ] Inject factory into client composition root rather than hardcoding concrete families.
- [ ] Add tests validating intra-family compatibility and safe family swap.

## Misuse Checks
- Misuse 1: Client downcasts products to concrete types → Remediation: expose required behavior via abstract product interfaces.
- Misuse 2: Concrete factories mix products from different families → Remediation: enforce family invariants in factory tests.
- Misuse 3: Too many unused product methods on abstract factory → Remediation: split factories by bounded context.

## Verification Rubric
- Correctness:
  - [ ] Baseline factory produces all required product roles.
  - [ ] Switching to another factory swaps full family without client rewrites.
- Design quality:
  - [ ] Product and factory contracts are cohesive and minimal.
  - [ ] Family boundaries are explicit and enforced.
- Regression safety:
  - [ ] Tests cover one family baseline and one alternate family with compatibility assertions.

## Language-Specific Adaptations (Optional)
- TypeScript: encode product-family contracts with interfaces and constructor injection.
- Python: use ABCs/protocols; dependency injection container can select concrete factory by runtime profile.
- Go: keep abstract factory as interface; wire concrete implementation at composition root.

## Related Patterns (Optional)
- Factory Method: can be used inside concrete abstract factories for finer-grained creation hooks.
- Builder: use when construction is stepwise/ordered instead of family-based.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/abstract-factory
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
