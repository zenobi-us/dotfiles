---
name: singleton
description: Use when exactly one coordinated instance is required and its lifecycle, access, and state boundaries can be strictly controlled.
pattern: Singleton
family: creational
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Singleton

## Intent
Guarantee a single instance of a class/service and provide a controlled global access point when shared coordination is required and local instantiation would violate system invariants.

## Applicability Signals
- Signal 1: Domain requires strict single authority (for example, one in-process coordination object).
- Signal 2: Multiple instances would create conflicting state or duplicate side effects.
- Signal 3: Access to instance must be consistent across modules without manual instance threading everywhere.

## Contraindications
- Case 1: Requirement is convenience-based global access, not true single-instance invariants.
- Case 2: Hidden global state harms testing, determinism, or parallel execution.
- Case 3: Distributed/runtime scale means process-local singleton does not satisfy true uniqueness requirements.

## Decision Heuristics
- If uniqueness is a hard invariant and lifecycle ownership is explicit, Singleton can be justified.
- If dependency injection can pass shared instances cleanly, prefer DI-managed service lifetime over singleton accessors.
- Decision anti-bias note: treat Singleton as a constrained tool, not a default for shared utilities.

## Implementation Checklist
- [ ] Define and document the exact uniqueness invariant and scope (process, thread, request, etc.).
- [ ] Restrict direct construction and expose controlled accessor/factory.
- [ ] Ensure initialization is thread-safe where concurrency exists.
- [ ] Provide test hooks or dependency seams to avoid hidden global coupling.
- [ ] Add tests for uniqueness, initialization safety, and state isolation/reset strategy.

## Misuse Checks
- Misuse 1: Singleton accumulates unrelated responsibilities → Remediation: split into focused services and inject dependencies.
- Misuse 2: Tests fail due to leaked singleton state between cases → Remediation: add explicit reset/test fixture lifecycle control.
- Misuse 3: Codebase uses singleton as service locator → Remediation: migrate to dependency injection boundaries.

## Verification Rubric
- Correctness:
  - [ ] Repeated access returns the same instance within declared scope.
  - [ ] Concurrent initialization does not create duplicate instances.
- Design quality:
  - [ ] Uniqueness requirement is documented and justified.
  - [ ] API surface avoids acting as unbounded global service registry.
- Regression safety:
  - [ ] Tests cover race conditions, lifecycle reset, and side-effect boundaries.

## Language-Specific Adaptations (Optional)
- TypeScript: prefer module-level singleton with explicit reset seams for tests.
- Python: module singleton is common; ensure mutable state is intentional and bounded.
- Go: use `sync.Once` for initialization and keep singleton payload minimal.

## Related Patterns (Optional)
- Abstract Factory: can provide singleton-managed factories when family selection must remain centralized.
- Builder: avoid routing broad construction logic through singleton unless invariants require central control.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/singleton
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
