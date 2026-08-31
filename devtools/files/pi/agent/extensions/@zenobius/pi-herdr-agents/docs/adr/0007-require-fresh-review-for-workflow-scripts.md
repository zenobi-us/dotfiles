# ADR-0007: Require fresh review in skill-authored review workflows

- **Status:** Accepted
- **Date:** 2026-08-03
- **Scope:** `giuseppecrj/pi-herdr-agents`

## Context

The first workflow reviews an exact source or candidate. The parent author and any prior workers can share assumptions, so its useful result needs independent examination without inherited implementation context.

## Decision

The bundled `orchestrate` skill authors every v1 review workflow with independent fresh read-only review nodes followed by one fresh review synthesizer. Each reviewer and the synthesizer receive the exact source or candidate evidence rather than inherited implementation context. The synthesizer receives every explicit reviewer success or failure and returns the task-specific result.

The runtime remains task-agnostic: it enforces the approved capability envelope and operational evidence but does not infer prompts, impose a fixed review receipt, or prove JavaScript data flow. Exact-script human approval is the task-semantics boundary.

## Consequences

The skill must not present a script for approval when it omits independent review or synthesis. Worker self-review, inherited-context review, filtered failures, and parent-side synthesis do not satisfy the policy. The trade-off is that the runner does not independently certify review completeness; adding such certification would require the fixed task state machine rejected for v1.
