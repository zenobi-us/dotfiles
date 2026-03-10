---
name: design-pattern-command
description: Use when operations must be represented as objects so execution, scheduling, undo, and logging can vary independently from invokers.
pattern: Command
family: behavioral
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Command

## Intent
Encapsulate a request as a command object that carries execution behavior and required context. This decouples request invocation from request implementation and enables queuing, retries, undo, and audit flows.

## Applicability Signals
- Signal 1: UI/actions trigger business operations but should not know receiver internals.
- Signal 2: Operations need queueing, delayed execution, retries, or centralized instrumentation.
- Signal 3: Undo/redo or action history is required across heterogeneous operations.

## Contraindications
- Case 1: Single immediate operation with no planned extension points.
- Case 2: Commands would just proxy one method call with zero lifecycle needs.
- Case 3: State needed for command execution is too large or unstable to serialize safely.

## Decision Heuristics
- If invocation and execution must evolve separately, prefer Command.
- If simple callback function references are sufficient and lifecycle concerns do not exist, use function-based handlers.
- Decision anti-bias note: do not create command classes per trivial one-off action.

## Implementation Checklist
- [ ] Define command contract (`execute`; optional `undo`).
- [ ] Implement concrete commands with explicit receiver dependencies.
- [ ] Keep invokers dependent on command abstractions only.
- [ ] Add optional history/queue layer outside command implementations.
- [ ] Test execution ordering, retry behavior, and undo semantics where required.

## Misuse Checks
- Misuse 1: Commands contain UI logic and domain logic together → Remediation: keep command focused on domain operation invocation.
- Misuse 2: Invoker inspects concrete command types → Remediation: expose behavior via command interface, not type checks.
- Misuse 3: Command payloads become mutable after enqueue → Remediation: snapshot immutable command data at creation.

## Verification Rubric
- Correctness:
  - [ ] Invoker can execute commands without receiver-specific knowledge.
  - [ ] Optional undo or replay behavior works for supported commands.
- Design quality:
  - [ ] Command, invoker, and receiver boundaries are explicit.
  - [ ] Cross-cutting concerns (logging, queueing) are orthogonal to receivers.
- Regression safety:
  - [ ] Tests cover baseline execution and at least one deferred/replayed path.

## Language-Specific Adaptations (Optional)
- TypeScript: use command interfaces with strongly typed payloads and optional result generics.
- Python: commands can be dataclasses with `execute()`; keep receivers injected, not global.
- Go: model command as interface with `Execute(context.Context) error`; wrap retries in invoker/service layer.

## Related Patterns (Optional)
- Memento: pair with command history for reversible state transitions.
- Chain of Responsibility: dispatch commands through validation/auth chains before execution.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/command
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
