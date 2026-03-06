---
name: design-pattern-flyweight
description: Use when huge numbers of similar objects cause memory pressure and shared intrinsic state can be externalized.
pattern: Flyweight
family: structural
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Flyweight

## Intent
Reduce memory usage by sharing common intrinsic state across many fine-grained objects while keeping varying extrinsic state outside the shared instances.

## Applicability Signals
- Signal 1: Profiling shows excessive memory from many nearly identical objects.
- Signal 2: Object state can be clearly split into shared (intrinsic) and context-specific (extrinsic) parts.
- Signal 3: Object creation/destruction churn is high and cacheable shared instances are practical.

## Contraindications
- Case 1: Object count is low and memory pressure is not material.
- Case 2: State is mostly unique per object and cannot be cleanly externalized.
- Case 3: Concurrency/lifecycle complexity of sharing would outweigh memory savings.

## Decision Heuristics
- If high cardinality objects share large immutable state, prefer Flyweight.
- If you need identity/lifecycle control rather than memory sharing, Proxy or object pools may fit better.
- Decision anti-bias note: do not apply flyweight without measurements showing a real memory bottleneck.

## Implementation Checklist
- [ ] Separate intrinsic state from extrinsic runtime context.
- [ ] Make intrinsic state immutable or safely shared.
- [ ] Introduce flyweight factory/cache keyed by intrinsic state.
- [ ] Refactor clients to pass extrinsic state at call time.
- [ ] Benchmark memory/performance before and after.

## Misuse Checks
- Misuse 1: Extrinsic state accidentally stored in shared flyweight → Remediation: enforce immutable intrinsic-only flyweights.
- Misuse 2: Factory cache grows unbounded → Remediation: add eviction/lifecycle strategy.
- Misuse 3: No measurable gain after complexity increase → Remediation: remove flyweight and simplify model.

## Verification Rubric
- Correctness:
  - [ ] Shared flyweight behavior remains correct across diverse extrinsic contexts.
  - [ ] Factory returns shared instance for equivalent intrinsic keys.
- Design quality:
  - [ ] Intrinsic/extrinsic boundary is explicit and documented.
  - [ ] Sharing does not introduce hidden mutable-state coupling.
- Regression safety:
  - [ ] Tests cover key reuse, context variation, and cache behavior edge cases.

## Language-Specific Adaptations (Optional)
- TypeScript: use map-based factories with readonly intrinsic payloads.
- Python: consider `functools.lru_cache` or explicit registries for immutable flyweights.
- Go: use map+sync strategy appropriate for concurrent access patterns.

## Related Patterns (Optional)
- Singleton: one shared instance globally; flyweight shares many keyed instances.
- Proxy: controls access/lifecycle, while flyweight primarily optimizes memory footprint.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/flyweight
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
