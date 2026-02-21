---
id: dspya103
title: Execution Pipeline & Observability
epic_id: dspya1b2
created_at: 2026-02-21T21:07:00+10:30
updated_at: 2026-02-21T21:07:00+10:30
status: proposed
start_criteria: Template management overlay functional and runner contract implemented.
end_criteria: Extension can run TemplateAdapter predictions, stream LM transcripts, and capture telemetry/errors for later review.
---

# Execution Pipeline & Observability

## Overview
Wire the Pi extension to the Python runner, stream execution output, and provide debugging facilities mirroring TemplateAdapter's `preview()` and `parse()` flows. Add instrumentation hooks to capture LM history, parse failures, and adapter metrics.

## Deliverables
- IPC contract implemented between Pi (Node) and Python runner (uv). Includes payload schema (`signature`, `messages`, `parse_mode`, demos, helper code) and response schema (rendered messages, completion text, parsed outputs, errors).
- Execution console overlay with tabs: Preview (messages), Live Run (streamed completion + parse), History (recent runs, errors, metrics such as completion tokens/time).
- Telemetry/logging pipeline persisting last N runs per adapter under `.pi/cache/template-adapter-history.json`.
- Error surfacing for TemplateAdapter invariants (missing output field, parse mismatch, helper failure) with actionable guidance referencing README best practices.

## Tasks
- T301: Implement Node↔Python runner transport (stdin/stdout JSON envelopes + heartbeats). *(to be created after phase review)*
- T302: Build execution console overlay components with streaming UI + diff viewer. *(to be created after phase review)*
- T303: Add telemetry persistence + error classification utilities. *(to be created after phase review)*

## Dependencies
- Runner prototype + schemas from dspya101
- Extension scaffolding from dspya102
- Access to LM providers for integration testing (OpenAI/Anthropic)

## Next Steps
1. Await phase plan approval.
2. Create detailed tasks once earlier phases are greenlit.
