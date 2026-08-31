# ADR-0004: Require active user approval for workflow-script execution

- **Status:** Accepted
- **Date:** 2026-08-03
- **Scope:** `giuseppecrj/pi-herdr-agents`

## Context

An approved workflow script launches child agents with bounded capabilities. A persisted `approved` field could become stale, be copied to changed bytes or another repository, or be executed by a later parent session without the user seeing the exact strategy.

## Decision

For v1, execution requires the user to reply `APPROVE <8-character SHA-256 prefix>` after preparation in the same active parent session for one exact workflow-script revision. Preparation binds the session and branch position, complete script hash, canonical repository root and Git common directory, exact committed base, materialized source evidence, resolved role behavior, runtimes, and effective tools. Start revalidates that complete policy before consuming approval once. The run journal is created only at start, and its first event records the full approval binding and approving user-entry ID. Persisted and cross-session approval are deferred.

## Consequences

The runner must fail closed when approval predates preparation, comes from another session, or any bound byte, repository identity, source evidence, or policy changed. Read-only discovery remains a separate pre-approval activity. Preparation creates no run effect, and no workflow child can start before approval is recorded as the journal's first event.
