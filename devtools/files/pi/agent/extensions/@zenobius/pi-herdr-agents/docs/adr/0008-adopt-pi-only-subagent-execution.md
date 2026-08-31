# ADR-0008: Adopt Pi-only subagent execution

- **Status:** Accepted (implemented)
- **Date:** 2026-08-10
- **Scope:** `giuseppecrj/pi-herdr-agents`
- **Supersedes:** The external CLI runtime-adapter provisions of ADR-0002

## Decision

Make every public subagent run Pi-backed. Remove the Claude terminal adapter and its `cli`, `cli-model`, and `resumeSessionId` interface fields. Existing role files that request an external CLI must fail with a clear error instead of silently running through Pi.

A single deep launch module will own the complete launch transaction behind one small interface. Pi and Herdr remain implementation details of that module; do not add a runtime adapter seam without a second real execution path.

Completion delivery will use one custom message whose content contains the bounded result and triggers the parent turn. Completion detection will keep the Pi sidecar as primary evidence and the terminal exit marker as its best-effort fallback.

## Why

The Claude terminal path duplicates launch, completion, transcript, cleanup, status, resume, and interruption behavior. It also requires `--dangerously-skip-permissions`, has no bundled role, and reduces locality and test leverage. Pi already provides Claude models through normal provider/model routing.

## Consequences

This is an immediate pre-1.0 breaking change; no deprecation adapter remains. The agent/workflow/skill/runtime taxonomy in ADR-0002 remains accepted, but its external CLI adapter rules no longer apply. Shipped-behavior documentation and `CONTEXT.md` now describe the Pi-only contract.
