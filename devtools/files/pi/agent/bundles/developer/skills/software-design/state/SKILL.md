---
name: state
description: Use when an object's behavior changes by internal mode and conditional branches are growing around state transitions.
pattern: State
family: behavioral
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: State

## Intent
Represent state-specific behavior in separate state objects so context behavior changes through composable state transitions instead of sprawling conditionals.

## Applicability Signals
- Signal 1: Context methods contain large `if/else` or `switch` branches keyed by current status/mode.
- Signal 2: Transition rules are complex and must be explicit, validated, and testable.
- Signal 3: Adding a new state currently requires editing many existing methods.

## Contraindications
- Case 1: Only two trivial states exist with unlikely future expansion.
- Case 2: State is purely data labeling with no behavior differences.
- Case 3: Team lacks clarity on transition model and would encode implicit hidden transitions.

## Decision Heuristics
- If behavior and transitions co-vary and should be isolated by mode, prefer State.
- If behavior variation is driven by interchangeable algorithm families independent of lifecycle transitions, Strategy may fit better.
- Decision anti-bias note: avoid introducing state classes when a compact transition table is sufficient.

## Implementation Checklist
- [ ] Define context interface and state contract for behavior methods.
- [ ] Implement concrete states with clear allowed transitions.
- [ ] Keep transition logic explicit (state-owned or context-governed by policy).
- [ ] Prevent invalid transitions with guard clauses/errors.
- [ ] Test transition graph and behavior per state.

## Misuse Checks
- Misuse 1: Context still branches on state type after adopting pattern → Remediation: move behavior dispatch fully into state objects.
- Misuse 2: States mutate unrelated context concerns → Remediation: narrow state responsibilities to mode-specific behavior.
- Misuse 3: Transition rules duplicated across states and context → Remediation: centralize transition authority.

## Verification Rubric
- Correctness:
  - [ ] Context behavior changes correctly after each valid transition.
  - [ ] Invalid transitions are blocked predictably.
- Design quality:
  - [ ] State responsibilities are cohesive and explicit.
  - [ ] Transition model is understandable from code and tests.
- Regression safety:
  - [ ] Tests cover baseline state flow and at least one invalid transition case.

## Language-Specific Adaptations (Optional)
- TypeScript: use exhaustive unions/enums to model transition intent with compile-time checks.
- Python: model states as classes with clear context handoff methods.
- Go: use interfaces for state behavior and explicit transition methods on context.

## Related Patterns (Optional)
- Strategy: both encapsulate behavior; state adds explicit lifecycle-driven transitions.
- Memento: capture/restore context progression across state transitions.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/state
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
