# ADR-0006: Limit the first workflow to read-only effects

- **Status:** Accepted
- **Date:** 2026-08-03
- **Scope:** `giuseppecrj/pi-herdr-agents`
- **Filename note:** The historical filename still says `isolated-worktrees`; the decision is the read-only first-flow effect boundary.

## Context

The first production workflow exists to prove approved JavaScript orchestration, fresh review, evidence, and lifecycle behavior. Writer worktrees, commits, candidate handoffs, and external-system actions add separate ownership and recovery questions that are not needed to validate that runtime.

## Decision

The first workflow permits only fresh read-only Pi nodes against one runner-owned detached checkout pinned to the approved committed source. It cannot write files, create commits, mutate the parent checkout, integrate work, or mutate external systems.

## Consequences

The bundled skill must not author writer nodes for this flow. Ticket mutation, deployment, messaging, publishing, PR actions, merges, commits, and cleanup remain explicit parent or upstream operations. A later writer workflow requires separate prototype evidence, acceptance criteria, and approval before this boundary changes.
