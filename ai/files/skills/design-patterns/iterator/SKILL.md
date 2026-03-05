---
name: design-pattern-iterator
description: Use when clients must traverse aggregate data uniformly without exposing internal collection representation.
pattern: Iterator
family: behavioral
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Iterator

## Intent
Provide a traversal interface that lets clients move through elements without depending on concrete container internals. This preserves encapsulation while supporting multiple traversal strategies.

## Applicability Signals
- Signal 1: Clients currently depend on collection internals (indexes, node pointers, custom storage details).
- Signal 2: Multiple traversal orders are needed (forward, reverse, filtered, paged).
- Signal 3: Aggregate representation may change, but traversal consumers should remain stable.

## Contraindications
- Case 1: Language-native iteration already fully solves traversal and abstraction needs.
- Case 2: Collection size is tiny and direct access is simpler and clearer.
- Case 3: Traversal must be purely set-based at database/query layer, not in-memory object navigation.

## Decision Heuristics
- If traversal behavior varies while container abstraction should stay hidden, prefer Iterator.
- If only one simple pass exists and representation is already stable API, keep direct iteration.
- Decision anti-bias note: avoid custom iterators that duplicate built-in iterable protocols without added value.

## Implementation Checklist
- [ ] Define iterator contract (`hasNext/next` or language-native protocol equivalent).
- [ ] Define aggregate contract returning iterator instances.
- [ ] Implement concrete iterators for required traversal modes.
- [ ] Ensure iterator state is isolated per traversal instance.
- [ ] Add tests for full traversal, boundaries, and empty collections.

## Misuse Checks
- Misuse 1: Iterator leaks underlying node/index details → Remediation: return domain elements only.
- Misuse 2: Shared mutable cursor across consumers causes race bugs → Remediation: per-consumer iterator instances.
- Misuse 3: Complex filtering pushed into iterator when query layer should handle it → Remediation: split query concerns from iteration concerns.

## Verification Rubric
- Correctness:
  - [ ] Iterator yields expected element sequence for baseline traversal.
  - [ ] Boundary behavior is correct (empty, last element, exhaustion).
- Design quality:
  - [ ] Aggregate internals are not exposed to consumers.
  - [ ] Alternate traversal strategies are addable without changing clients.
- Regression safety:
  - [ ] Tests cover at least one additional traversal mode (e.g., reverse/filter).

## Language-Specific Adaptations (Optional)
- TypeScript: implement `Iterable<T>` / generator-based iterators for idiomatic `for...of` usage.
- Python: leverage `__iter__` and generators while preserving domain-level abstraction boundaries.
- Go: emulate iterators with channel/function cursor patterns where standard loops are insufficient.

## Related Patterns (Optional)
- Composite: iterators often traverse recursive composite structures.
- Visitor: visitor operations can run over iterator-provided traversal order.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/iterator
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
