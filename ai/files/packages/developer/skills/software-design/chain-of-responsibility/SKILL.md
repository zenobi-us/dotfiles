---
name: chain-of-responsibility
description: Use when multiple handlers may process a request and you need flexible routing without hard-coding sender-to-receiver coupling.
pattern: Chain of Responsibility
family: behavioral
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Chain of Responsibility

## Intent
Pass a request through an ordered set of handlers where each handler can process, partially process, or delegate to the next. This keeps request orchestration extensible while reducing sender coupling.

## Applicability Signals
- Signal 1: Request processing logic is spread across condition-heavy branches that pick one of many handlers.
- Signal 2: Handler order or eligibility rules change frequently by environment, feature flags, or policy.
- Signal 3: New processing steps should be addable without editing existing sender code.

## Contraindications
- Case 1: Exactly one handler is always responsible with no fallback path.
- Case 2: Full processing order is fixed and every step must always run (pipeline/composite flow is clearer).
- Case 3: Request must be processed atomically by one transaction boundary with no delegation.

## Decision Heuristics
- If handler selection should be decoupled from request senders and evolve independently, prefer Chain of Responsibility.
- If all handlers must execute every time, prefer explicit pipeline composition.
- Decision anti-bias note: do not use a chain to hide unclear ownership of business rules.

## Implementation Checklist
- [ ] Define request contract and handler interface (`handle` + `setNext` or equivalent).
- [ ] Implement concrete handlers with clear single responsibilities.
- [ ] Define chain assembly in one composition root, not in senders.
- [ ] Ensure each handler explicitly documents stop/continue behavior.
- [ ] Add tests for early-handle, pass-through, and no-handler cases.

## Misuse Checks
- Misuse 1: Handlers mutate shared global state unpredictably → Remediation: pass explicit context and isolate side effects.
- Misuse 2: Chain order scattered across call sites → Remediation: centralize chain construction and ordering policy.
- Misuse 3: Handler always delegates regardless of processing outcome → Remediation: enforce explicit handled/not-handled contract.

## Verification Rubric
- Correctness:
  - [ ] Request reaches expected handler under baseline conditions.
  - [ ] Delegation path behaves correctly when a handler declines.
- Design quality:
  - [ ] Sender depends only on the first handler abstraction.
  - [ ] Handler responsibilities are independent and composable.
- Regression safety:
  - [ ] Tests cover order changes and fallback/no-match behavior.

## Language-Specific Adaptations (Optional)
- TypeScript: model `Handler` as an interface and encode handled results with discriminated unions.
- Python: prefer composition with lightweight handler classes or callables to keep chain assembly explicit.
- Go: use interface-based handlers and return `(handled bool, err error)` for flow clarity.

## Related Patterns (Optional)
- Command: encapsulates requests; often used as payloads flowing through a chain.
- Mediator: centralizes interactions; chain distributes responsibility across handlers.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/chain-of-responsibility
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
