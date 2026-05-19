---
name: mediator
description: Use when many components communicate in tangled peer-to-peer paths and interactions should be coordinated through a central policy hub.
pattern: Mediator
family: behavioral
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Mediator

## Intent
Centralize collaboration logic between components in a mediator so components remain focused on local behavior instead of managing complex cross-component orchestration.

## Applicability Signals
- Signal 1: Components are tightly coupled through many direct references and event callbacks.
- Signal 2: Interaction rules change frequently and require synchronized edits across multiple classes.
- Signal 3: Team needs a single place to enforce workflow/policy constraints between participants.

## Contraindications
- Case 1: Only two components interact with stable, simple rules.
- Case 2: Mediator would become an oversized "god object" owning unrelated concerns.
- Case 3: Event bus/pub-sub with independent subscribers is a better fit than centralized flow control.

## Decision Heuristics
- If interaction complexity grows faster than component complexity, prefer Mediator.
- If communication is simple and stable, direct collaboration can remain clearer.
- Decision anti-bias note: avoid using mediator as a dumping ground for every business rule.

## Implementation Checklist
- [ ] Define mediator interface around use-case-level coordination methods.
- [ ] Keep colleague components dependent on mediator abstraction, not on each other.
- [ ] Move orchestration/branching logic from colleagues into mediator.
- [ ] Keep domain rules modular inside mediator (sub-services if needed).
- [ ] Test interaction scenarios and rule changes via mediator entry points.

## Misuse Checks
- Misuse 1: Colleagues still call each other directly alongside mediator → Remediation: enforce one interaction channel through mediator.
- Misuse 2: Mediator contains low-level component internals → Remediation: colleagues expose minimal intent-level operations.
- Misuse 3: One mediator handles unrelated bounded contexts → Remediation: split mediators by workflow/domain boundary.

## Verification Rubric
- Correctness:
  - [ ] Core workflow succeeds with colleagues coordinated only through mediator.
  - [ ] Rule variants are handled by mediator without colleague rewrites.
- Design quality:
  - [ ] Colleague coupling is reduced and explicit.
  - [ ] Mediator responsibilities are cohesive to one workflow domain.
- Regression safety:
  - [ ] Tests cover baseline workflow and one alternate rule path.

## Language-Specific Adaptations (Optional)
- TypeScript: define narrow mediator interfaces per feature area to avoid type bloat.
- Python: use mediator services with explicit dependency injection to keep colleagues testable.
- Go: mediator as service interface coordinating collaborators via small interfaces.

## Related Patterns (Optional)
- Observer: observer distributes notifications; mediator coordinates directed interactions.
- Facade: facade simplifies subsystem entry; mediator governs runtime collaboration among peers.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/mediator
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
