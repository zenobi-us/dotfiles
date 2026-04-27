---
name: memento
description: Use when object state must be snapshotted and restored later without exposing internal representation details.
pattern: Memento
family: behavioral
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Memento

## Intent
Capture and externalize an object's state in a restorable snapshot while preserving encapsulation. This enables rollback, undo, and checkpoint workflows without exposing internal fields to external actors.

## Applicability Signals
- Signal 1: Undo/rollback requirements exist for complex stateful objects.
- Signal 2: External code currently manipulates internals directly to save/restore state.
- Signal 3: Multiple checkpoints are needed across a workflow with safe restoration semantics.

## Contraindications
- Case 1: State is trivial and can be rebuilt deterministically from source events.
- Case 2: Full snapshots are too large/frequent for memory or performance budgets.
- Case 3: Cross-object distributed transactions require event sourcing/saga patterns instead.

## Decision Heuristics
- If encapsulation must be preserved while enabling safe restore points, prefer Memento.
- If immutable event history already exists, consider reconstructing from events instead of snapshots.
- Decision anti-bias note: avoid snapshotting broad graphs when only narrow state deltas are required.

## Implementation Checklist
- [ ] Define originator API for `createMemento` and `restore(memento)` operations.
- [ ] Keep memento contents opaque to caretakers where possible.
- [ ] Define caretaker policy for retention, ordering, and pruning snapshots.
- [ ] Protect snapshot immutability after capture.
- [ ] Add tests for save/restore correctness and history navigation.

## Misuse Checks
- Misuse 1: Caretaker reads or mutates memento internals → Remediation: enforce opaque memento type boundaries.
- Misuse 2: Snapshot created after side effects commit externally → Remediation: checkpoint before non-reversible operations.
- Misuse 3: Unlimited history growth causes memory pressure → Remediation: apply bounded history and compaction policy.

## Verification Rubric
- Correctness:
  - [ ] Restoring a memento reproduces expected prior originator state.
  - [ ] Multiple checkpoints can be traversed in defined order.
- Design quality:
  - [ ] Originator internals remain encapsulated from caretaker logic.
  - [ ] Snapshot lifecycle policy is explicit and testable.
- Regression safety:
  - [ ] Tests cover baseline restore and boundary conditions (first/last snapshot).

## Language-Specific Adaptations (Optional)
- TypeScript: prefer immutable snapshot objects and branded types for opaque mementos.
- Python: use frozen dataclasses or tuples for snapshot payload immutability.
- Go: keep mementos as unexported structs behind interfaces where encapsulation matters.

## Related Patterns (Optional)
- Command: pair mementos with undoable commands.
- State: memento restores historical state transitions without exposing internal state machine details.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/memento
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
