---
name: design-pattern-proxy
description: Use when access to an object must be controlled, deferred, secured, or monitored through a surrogate.
pattern: Proxy
family: structural
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Proxy

## Intent
Provide a stand-in object with the same interface as a real subject, adding controlled access concerns such as lazy initialization, authorization, remote access, caching, or instrumentation.

## Applicability Signals
- Signal 1: Object creation or remote access is expensive and should be deferred or cached.
- Signal 2: Access checks, rate limits, or audit logging must wrap object interactions consistently.
- Signal 3: Clients should remain unaware of lifecycle/network/security mechanics.

## Contraindications
- Case 1: Additional indirection would add latency/complexity without meaningful control benefit.
- Case 2: Proxy behavior diverges from subject contract and surprises clients.
- Case 3: Cross-cutting concern is better handled by middleware/interceptors outside object model.

## Decision Heuristics
- If you need transparent control over access/lifecycle while preserving subject interface, prefer Proxy.
- If you need behavior extension composition rather than access control, Decorator is usually better.
- Decision anti-bias note: avoid proxy layers that hide unacceptable network or performance costs.

## Implementation Checklist
- [ ] Define subject interface shared by real subject and proxy.
- [ ] Implement real subject with core behavior only.
- [ ] Implement proxy delegating calls and adding one clear control concern.
- [ ] Ensure error, timeout, and retry semantics are explicit and testable.
- [ ] Add tests proving proxy transparency for functional behavior.

## Misuse Checks
- Misuse 1: Proxy introduces unrelated business logic → Remediation: keep proxy focused on access/control concerns.
- Misuse 2: Client must know whether it holds proxy vs real subject → Remediation: enforce strict interface parity.
- Misuse 3: Multiple nested proxies obscure behavior flow → Remediation: consolidate concerns or move to dedicated middleware.

## Verification Rubric
- Correctness:
  - [ ] Core operations produce same functional result via proxy and real subject.
  - [ ] Proxy-specific concern (lazy load/security/cache/etc.) behaves as specified.
- Design quality:
  - [ ] Subject contract remains stable and implementation-agnostic.
  - [ ] Control concern is isolated and observable.
- Regression safety:
  - [ ] Tests cover subject parity and proxy-only concern edge cases.

## Language-Specific Adaptations (Optional)
- TypeScript: interface parity plus wrapper classes for auth/caching/remote clients.
- Python: descriptor/proxy objects can wrap attribute and method access consistently.
- Go: interface-based proxies are straightforward; keep context/timeout handling explicit.

## Related Patterns (Optional)
- Decorator: similar wrapping shape but different intent (feature layering vs access control).
- Facade: provides simplified entry; proxy preserves same interface while adding control.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/proxy
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
