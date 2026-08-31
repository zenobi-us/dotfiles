# ADR-0005: Keep workflow-script authority with the parent

- **Status:** Accepted
- **Date:** 2026-08-03
- **Scope:** `giuseppecrj/pi-herdr-agents`

## Context

Children can discover facts and recommend work, but allowing them to author or revise the workflow script after planning makes it unclear which strategy the user approved and permits unbounded dynamic fan-out.

## Decision

For v1, only the parent may author or revise `workflow.js`. Children return findings, evidence, help requests, or non-executable draft artifacts; they cannot change the strategy or its policy envelope.

## Consequences

The runner accepts only a parent-authored workflow script. Any material child recommendation must be evaluated by the parent and, when it changes the approved strategy or policy envelope, requires a revised script and renewed user approval.
