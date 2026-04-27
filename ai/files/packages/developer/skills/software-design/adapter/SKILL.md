---
name: adapter
description: Use when an existing class has useful behavior but an incompatible interface blocks integration with client code.
pattern: Adapter
family: structural
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Adapter

## Intent
Convert one interface into another interface expected by clients so existing functionality can be reused without rewriting either side immediately.

## Applicability Signals
- Signal 1: A third-party or legacy component provides needed behavior but exposes mismatched method names/signatures.
- Signal 2: Client code expects a stable contract and cannot absorb provider-specific differences.
- Signal 3: Multiple integrations repeat small translation shims, creating duplicated glue code.

## Contraindications
- Case 1: You own both sides and can safely change one interface directly.
- Case 2: Mismatch is temporary and can be removed faster by small targeted refactor.
- Case 3: Adapter would hide severe semantic differences, not just interface differences.

## Decision Heuristics
- If interface incompatibility is the core blocker while behavior is otherwise acceptable, prefer Adapter.
- If you need to simplify a whole subsystem API, Facade is often a better fit.
- Decision anti-bias note: avoid stacking adapters to postpone necessary domain model cleanup.

## Implementation Checklist
- [ ] Define/confirm the target interface clients already rely on.
- [ ] Wrap the adaptee in an adapter that implements the target interface.
- [ ] Translate method names, argument shapes, and return formats explicitly.
- [ ] Centralize validation/error mapping at adapter boundaries.
- [ ] Add tests for both normal and mismatch/error translation paths.

## Misuse Checks
- Misuse 1: Adapter adds business logic unrelated to translation → Remediation: move business rules back into domain/service layer.
- Misuse 2: Client leaks adaptee types through adapter API → Remediation: keep API strictly on target interface types.
- Misuse 3: Chain of adapters accumulates for one workflow → Remediation: consolidate into one explicit mapping boundary or refactor contract.

## Verification Rubric
- Correctness:
  - [ ] Client code can call target interface without direct adaptee knowledge.
  - [ ] Adapter correctly maps input/output and error semantics.
- Design quality:
  - [ ] Translation concerns are isolated in adapter, not scattered in clients.
  - [ ] Target contract remains stable and readable.
- Regression safety:
  - [ ] Tests cover baseline flow and at least one edge-case translation path.

## Language-Specific Adaptations (Optional)
- TypeScript: use interface-based adapter classes; add runtime guards when external payloads are untyped.
- Python: prefer composition over inheritance; use protocols for target contract clarity.
- Go: implement target interface on adapter struct wrapping adaptee.

## Related Patterns (Optional)
- Facade: simplifies complex subsystem usage; adapter focuses on interface compatibility.
- Bridge: separates abstraction and implementation when both should vary independently.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/adapter
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
