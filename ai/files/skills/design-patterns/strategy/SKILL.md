---
name: design-pattern-strategy
description: Use when multiple interchangeable algorithms are needed and clients should switch behavior without branching on concrete implementations.
pattern: Strategy
family: behavioral
version: 1.0.0
strict_source_policy: no-direct-quotes-no-images
attribution_required: true
---

# Skill: Strategy

## Intent
Define a family of algorithms behind a common strategy contract and select among them at runtime or configuration time. This keeps client flow stable while algorithm choices evolve.

## Applicability Signals
- Signal 1: Conditional branches select algorithm variants in many call sites.
- Signal 2: New algorithm variants appear regularly and must be plugged in with low disruption.
- Signal 3: Runtime environment, tenant policy, or feature flags determine algorithm choice.

## Contraindications
- Case 1: Only one algorithm exists and no variation pressure is expected.
- Case 2: Variants differ by one parameter and can be handled by data/config only.
- Case 3: Strategy selection criteria are unstable and undocumented, causing hidden behavior drift.

## Decision Heuristics
- If algorithm variation is the main axis of change and caller workflow should stay fixed, prefer Strategy.
- If behavior evolves through lifecycle states with explicit transitions, State may be more appropriate.
- Decision anti-bias note: avoid creating many micro-strategies for negligible differences.

## Implementation Checklist
- [ ] Define strategy interface with minimal method surface.
- [ ] Implement concrete strategies for each meaningful algorithm variant.
- [ ] Inject strategy into context (constructor/setter/config factory).
- [ ] Keep selection policy separate from strategy implementation details.
- [ ] Add tests proving strategy replacement without client code changes.

## Misuse Checks
- Misuse 1: Context inspects concrete strategy types → Remediation: move variant behavior behind strategy interface.
- Misuse 2: Strategies rely on shared mutable hidden globals → Remediation: inject explicit dependencies/state.
- Misuse 3: Selection logic duplicated across multiple callers → Remediation: centralize strategy factory/resolver.

## Verification Rubric
- Correctness:
  - [ ] Baseline strategy yields expected output/behavior.
  - [ ] Alternate strategy can be swapped with no client workflow edits.
- Design quality:
  - [ ] Strategy contracts are cohesive and stable.
  - [ ] Selection policy is explicit and testable.
- Regression safety:
  - [ ] Tests cover at least two concrete strategies plus selection boundary case.

## Language-Specific Adaptations (Optional)
- TypeScript: use generic strategy interfaces for typed input/output contracts.
- Python: strategies can be classes or callables; keep contract explicit via protocols.
- Go: use interface-based strategies and constructor injection into services.

## Related Patterns (Optional)
- State: strategy chooses algorithm; state models lifecycle-dependent behavior transitions.
- Template Method: template fixes workflow skeleton; strategy swaps specific algorithm steps.

## Attribution & Sources
- Source Site: Refactoring.Guru
- Source URLs:
  - https://refactoring.guru/design-patterns/strategy
  - https://refactoring.guru/design-patterns
- Derivation Note: Concepts derived from referenced sources; explanatory wording rewritten for this repository.
- Policy Note: This artifact intentionally includes no direct quotes and no Refactoring.Guru images.
