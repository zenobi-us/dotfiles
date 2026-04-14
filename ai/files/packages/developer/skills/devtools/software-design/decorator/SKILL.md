---
name: decorator
description: Use when responsibilities must be added dynamically to objects without subclass proliferation.
pattern: Decorator
family: structural
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Decorator

## Intent
Attach additional behavior to objects at runtime by wrapping them with decorator objects that preserve the same interface.

## Applicability Signals
- Signal 1: Feature combinations are expanding and subclass permutations are becoming unmanageable.
- Signal 2: Optional responsibilities should be enabled/disabled per instance or per context.
- Signal 3: You need to extend behavior while keeping original component code closed to modification.

## Contraindications
- Case 1: Only one static behavior variant exists; wrappers add unnecessary complexity.
- Case 2: Object identity and strict type checks must remain concrete across boundaries.
- Case 3: Deep wrapper chains would hurt latency/debuggability and cannot be controlled.

## Decision Heuristics
- If behavior should be layered dynamically and combinatorially, prefer Decorator.
- If you need one global simplification entry point, Facade is often a better fit.
- Decision anti-bias note: do not use decorators to hide missing cohesive domain abstraction.

## Implementation Checklist
- [ ] Define stable component interface used by both core and decorators.
- [ ] Implement concrete core component.
- [ ] Implement base decorator that delegates to wrapped component.
- [ ] Add focused decorators, each responsible for one behavior increment.
- [ ] Test ordering effects for stacked decorators and baseline passthrough.

## Misuse Checks
- Misuse 1: Decorator changes core contract semantics unexpectedly → Remediation: preserve interface guarantees and document any contract shifts.
- Misuse 2: Too many decorators in unknown order → Remediation: define composition policy and builder/factory for valid stacks.
- Misuse 3: Decorators become stateful mini-services → Remediation: extract long-lived state/services outside decorator chain.

## Verification Rubric
- Correctness:
  - [ ] Undecorated component behaves as baseline.
  - [ ] Each decorator adds behavior without breaking wrapped interface contract.
- Design quality:
  - [ ] Decorator responsibilities are single-purpose and composable.
  - [ ] Wrapper order sensitivity is explicit and tested.
- Regression safety:
  - [ ] Tests cover baseline, single decorator, and multi-decorator stacks.

## Language-Specific Adaptations (Optional)
- TypeScript: enforce component interface conformance on all decorators.
- Python: explicit delegation methods keep wrapping behavior readable.
- Go: interface-wrapping structs with embedded component references are straightforward.

## Related Patterns (Optional)
- Proxy: similar structure but intent is access control/lifecycle indirection, not feature layering.
- Composite: builds tree structures; decorator builds wrapper chains.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/decorator
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
