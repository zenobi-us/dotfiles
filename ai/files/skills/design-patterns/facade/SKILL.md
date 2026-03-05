---
name: design-pattern-facade
description: Use when a subsystem is too complex for clients and you need a focused, stable entry point.
pattern: Facade
family: structural
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Facade

## Intent
Provide a simplified high-level interface to a complex subsystem so most clients can execute common workflows without understanding internal coordination details.

## Applicability Signals
- Signal 1: Client code repeatedly orchestrates multiple subsystem components in the same sequence.
- Signal 2: Subsystem APIs are noisy/volatile and leak implementation complexity.
- Signal 3: Onboarding and maintenance cost is high due to broad subsystem surface area exposure.

## Contraindications
- Case 1: Clients need fine-grained control over subsystem internals for most use cases.
- Case 2: A facade would become a massive god-object that mirrors every underlying method.
- Case 3: Subsystem is already cohesive and simple enough for direct use.

## Decision Heuristics
- If recurring use cases can be expressed as a smaller stable API over complex internals, prefer Facade.
- If the main issue is incompatible interfaces rather than complexity, Adapter is a better fit.
- Decision anti-bias note: do not treat facade as a permanent substitute for fixing poor subsystem boundaries.

## Implementation Checklist
- [ ] Identify top user workflows and collapse them into concise facade operations.
- [ ] Keep direct subsystem access available for advanced callers when necessary.
- [ ] Delegate orchestration logic to facade while preserving subsystem separation.
- [ ] Define clear error translation and transaction/boundary behavior.
- [ ] Test facade flows and compatibility with evolving subsystem internals.

## Misuse Checks
- Misuse 1: Facade mirrors every subsystem method 1:1 → Remediation: prune to high-value workflow methods.
- Misuse 2: Facade embeds business rules unrelated to orchestration → Remediation: push domain logic back into domain/service layer.
- Misuse 3: All clients forced through facade despite advanced needs → Remediation: expose explicit escape hatch for specialized cases.

## Verification Rubric
- Correctness:
  - [ ] Common workflow succeeds through facade without direct subsystem calls.
  - [ ] Facade handles subsystem error propagation consistently.
- Design quality:
  - [ ] Facade API is significantly smaller and clearer than raw subsystem API.
  - [ ] Subsystem components remain decoupled and testable independently.
- Regression safety:
  - [ ] Tests cover at least one standard workflow and one subsystem change with unchanged facade contract.

## Language-Specific Adaptations (Optional)
- TypeScript: model facade as service class with explicit dependency injection of subsystem collaborators.
- Python: module-level facade functions can work for lightweight orchestration cases.
- Go: small facade struct with narrow methods and explicit dependencies is preferred.

## Related Patterns (Optional)
- Adapter: converts one interface to another; facade simplifies many interfaces.
- Mediator: centralizes peer interactions; facade centralizes client-to-subsystem entry.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/facade
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
