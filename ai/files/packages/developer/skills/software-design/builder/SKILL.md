---
name: builder
description: Use when object construction requires many ordered or optional steps and constructor signatures are becoming brittle.
pattern: Builder
family: creational
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Builder

## Intent
Separate complex object assembly from final representation so construction can proceed in controlled steps, with reusable assembly flows and optional variation in produced forms.

## Applicability Signals
- Signal 1: Constructors have long parameter lists with optional/conditional fields.
- Signal 2: The same conceptual object is assembled through recurring multi-step logic.
- Signal 3: Different output forms share assembly stages but differ in representation.

## Contraindications
- Case 1: Object creation is simple and stable; direct construction is clearer.
- Case 2: There are few optional parameters and no meaningful assembly workflow.
- Case 3: Builder state lifecycle risks misuse in concurrent/shared contexts.

## Decision Heuristics
- If construction requires explicit sequencing, validation gates, or reusable recipes, prefer Builder.
- If variation is only in subtype choice (not assembly process), Factory Method or Abstract Factory may fit better.
- Decision anti-bias note: avoid builders that just mirror constructor arguments one-to-one with no added control.

## Implementation Checklist
- [ ] Define builder interface with explicit build-step methods.
- [ ] Define product type(s) and required invariants.
- [ ] Implement concrete builder storing assembly state safely.
- [ ] Optional: define director/recipe for reusable build sequences.
- [ ] Add tests for required-step enforcement, optional-step behavior, and invalid build prevention.

## Misuse Checks
- Misuse 1: Builder allows `build()` before required fields are set → Remediation: enforce step validation or staged builder types.
- Misuse 2: Builder instance is reused unintentionally between builds → Remediation: reset state or require one-shot builder instances.
- Misuse 3: Director hardcodes too many scenario-specific branches → Remediation: split recipe definitions by context.

## Verification Rubric
- Correctness:
  - [ ] Valid sequence produces correct product with required invariants.
  - [ ] Optional sequence variants produce expected outputs without side effects.
- Design quality:
  - [ ] Construction logic is isolated from product usage logic.
  - [ ] Step semantics are explicit and discoverable.
- Regression safety:
  - [ ] Tests cover happy path, missing-required-step, and reused-builder scenarios.

## Language-Specific Adaptations (Optional)
- TypeScript: staged/fluent builders can use generic state markers to enforce order at compile time.
- Python: prefer explicit validation in `build()` and immutable produced objects where practical.
- Go: use explicit setter methods plus `Build() (T, error)` to enforce runtime validation.

## Related Patterns (Optional)
- Prototype: use when cloning baseline instances is cheaper than reconstructing via steps.
- Abstract Factory: use when selecting compatible product families, not stepwise assembly.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/builder
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
