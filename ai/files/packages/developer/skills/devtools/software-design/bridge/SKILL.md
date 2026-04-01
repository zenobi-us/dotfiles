---
name: design-pattern-bridge
description: Use when abstractions and implementations need to evolve independently without creating subclass explosion.
pattern: Bridge
family: structural
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Bridge

## Intent
Decouple an abstraction from its implementation so both can vary independently through composition instead of multiplying inheritance combinations.

## Applicability Signals
- Signal 1: Inheritance trees are growing by combining two independent dimensions (for example, shape × renderer).
- Signal 2: New variants in one dimension force code changes and retesting across the other dimension.
- Signal 3: Runtime swapping of implementations is valuable for environment, performance, or platform concerns.

## Contraindications
- Case 1: Only one stable implementation exists and no second dimension of change is expected.
- Case 2: Composition boundary would add indirection with no measurable flexibility gain.
- Case 3: Team lacks discipline to keep abstraction and implementation contracts small and coherent.

## Decision Heuristics
- If two axes of variation are independent and actively changing, prefer Bridge.
- If you only need one simple compatibility layer, Adapter is usually sufficient.
- Decision anti-bias note: do not split abstraction/implementation unless variation pressure is real.

## Implementation Checklist
- [ ] Identify abstraction-facing operations and implementation-facing operations.
- [ ] Define implementation interface with minimal required primitives.
- [ ] Refactor abstraction to delegate implementation work through composition.
- [ ] Add refined abstractions only where behavior differs at abstraction layer.
- [ ] Test independent extension on both abstraction and implementation sides.

## Misuse Checks
- Misuse 1: Abstraction exposes implementation-specific details → Remediation: tighten abstraction API and hide impl contracts.
- Misuse 2: Implementation interface becomes bloated catch-all → Remediation: split interfaces by capability.
- Misuse 3: Bridge used when only one side varies → Remediation: simplify to strategy/adapter/plain composition.

## Verification Rubric
- Correctness:
  - [ ] Baseline abstraction delegates correctly to implementation.
  - [ ] Swapping implementation changes behavior without abstraction rewrite.
- Design quality:
  - [ ] Abstraction and implementation interfaces are independently understandable.
  - [ ] Cross-product subclass explosion is removed or prevented.
- Regression safety:
  - [ ] Tests cover one abstraction with multiple implementations and one implementation with multiple abstractions.

## Language-Specific Adaptations (Optional)
- TypeScript: use interface contracts for implementor; inject implementation in constructor.
- Python: use composition and protocols/ABCs; avoid deep multiple inheritance.
- Go: define implementor interface; wire concrete implementors in constructors.

## Related Patterns (Optional)
- Strategy: interchangeable algorithms behind one interface, usually without distinct abstraction hierarchy.
- Adapter: converts incompatible interfaces rather than separating two variation axes.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/bridge
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
