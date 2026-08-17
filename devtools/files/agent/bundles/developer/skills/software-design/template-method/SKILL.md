---
name: template-method
description: Use when an algorithm skeleton is stable but specific steps must vary across implementations without duplicating workflow structure.
pattern: Template Method
family: behavioral
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Template Method

## Intent
Define an algorithm skeleton in a base type and defer selected steps to subclasses. This preserves invariant workflow order while allowing controlled customization points.

## Applicability Signals
- Signal 1: Similar workflows duplicate step ordering but vary in a few operations.
- Signal 2: Shared pre/post steps must remain consistent across variants.
- Signal 3: Teams need guardrails to prevent reordering critical steps in variant implementations.

## Contraindications
- Case 1: Workflow sequence itself must vary frequently across variants.
- Case 2: Inheritance hierarchies are already deep and brittle.
- Case 3: Composition (strategy/delegates) provides cleaner customization than subclass overrides.

## Decision Heuristics
- If overall procedure is stable and step overrides are bounded, prefer Template Method.
- If runtime swapping of algorithms is required, Strategy is usually better.
- Decision anti-bias note: do not force inheritance when behavior variation can be injected more simply.

## Implementation Checklist
- [ ] Define base class template method enforcing invariant step order.
- [ ] Mark mandatory variable steps as abstract; optional hooks with safe defaults.
- [ ] Keep invariants/non-overridable steps protected from subclass bypass.
- [ ] Implement concrete subclasses for each required variant.
- [ ] Test both shared invariants and per-subclass step behavior.

## Misuse Checks
- Misuse 1: Subclasses override template method and break ordering → Remediation: make template method final/non-overridable where language allows.
- Misuse 2: Base class accumulates unrelated hooks → Remediation: split template by cohesive workflow boundaries.
- Misuse 3: Subclasses duplicate common logic despite base support → Remediation: extract shared logic back into base invariant steps.

## Verification Rubric
- Correctness:
  - [ ] Template executes required steps in correct order.
  - [ ] Concrete subclasses customize only intended variation points.
- Design quality:
  - [ ] Invariants are explicit and enforced by base type.
  - [ ] Subclass responsibilities are narrow and readable.
- Regression safety:
  - [ ] Tests cover base skeleton order plus at least one subclass override path.

## Language-Specific Adaptations (Optional)
- TypeScript: use abstract base classes with `protected` hooks and public final orchestration method.
- Python: use ABC base template and optional hook methods for extension points.
- Go: emulate template-method structure with embedded types plus explicit orchestration function.

## Related Patterns (Optional)
- Strategy: strategy composes interchangeable algorithms; template method uses inheritance-controlled variation.
- Factory Method: often embedded as one overridable step inside a template workflow.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/template-method
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
