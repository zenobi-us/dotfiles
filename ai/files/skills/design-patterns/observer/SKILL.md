---
name: design-pattern-observer
description: Use when state changes in one object must notify many dependents while keeping publishers decoupled from subscriber implementations.
pattern: Observer
family: behavioral
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Observer

## Intent
Define a subscription mechanism where subjects publish change notifications to registered observers. This supports one-to-many event propagation with low coupling between producers and consumers.

## Applicability Signals
- Signal 1: Multiple downstream reactions must occur when a source state changes.
- Signal 2: Producer code should not hard-code knowledge of all consumers.
- Signal 3: Consumers should be attachable/detachable at runtime.

## Contraindications
- Case 1: Notification targets are fixed and small, with no anticipated variation.
- Case 2: Delivery guarantees/ordering requirements demand a formal messaging platform.
- Case 3: Event storms are likely and backpressure/throttling architecture is absent.

## Decision Heuristics
- If producer/consumer coupling is the main pain and dynamic subscriptions matter, prefer Observer.
- If interactions require central orchestration and rules, Mediator may fit better.
- Decision anti-bias note: avoid emitting broad ambiguous events that force observers to guess context.

## Implementation Checklist
- [ ] Define subject and observer contracts with clear event payload shape.
- [ ] Implement subscribe/unsubscribe lifecycle controls.
- [ ] Keep subject focused on event emission, not consumer policy.
- [ ] Handle observer failures (isolation, retry, or dead-letter policy as needed).
- [ ] Test registration lifecycle and multi-observer notification behavior.

## Misuse Checks
- Misuse 1: Observers mutate subject recursively causing loops → Remediation: guard re-entrant updates and separate command paths.
- Misuse 2: Subject event payloads are under-specified → Remediation: version and document explicit event contracts.
- Misuse 3: Unsubscribed observers continue receiving events due to leaks → Remediation: verify unsubscribe semantics and lifecycle ownership.

## Verification Rubric
- Correctness:
  - [ ] All subscribed observers receive expected notifications for baseline change.
  - [ ] Unsubscribed observers stop receiving notifications.
- Design quality:
  - [ ] Subject has no hard dependency on concrete observers.
  - [ ] Event contracts are explicit and stable.
- Regression safety:
  - [ ] Tests cover multi-observer fanout and failure isolation path.

## Language-Specific Adaptations (Optional)
- TypeScript: use typed event maps to ensure payload correctness per event key.
- Python: combine observer lists with weak references where lifecycle leaks are a risk.
- Go: use channels/callback registries with explicit cancellation context handling.

## Related Patterns (Optional)
- Mediator: mediator centralizes decision-making; observer broadcasts state changes.
- Command: observers can enqueue commands rather than executing side effects inline.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/observer
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
