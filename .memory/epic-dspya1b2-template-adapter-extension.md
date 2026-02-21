---
id: dspya1b2
title: TemplateAdapter Pi Extension
created_at: 2026-02-21T21:02:05+10:30
updated_at: 2026-02-21T21:02:05+10:30
status: planning
---

# TemplateAdapter Pi Extension

## Vision/Goal

Deliver a Pi coding agent extension that lets users author, preview, and execute DSPy `TemplateAdapter` prompts from inside Pi. The extension provides a structured workflow for:

- Defining TemplateAdapter message templates (system/user/history directives, `{inputs()}`, `{outputs()}`, `{demos()}` helpers) with zero hidden prompt rewriting.
- Configuring parse modes (`full_text`, `json`, `xml`, callable parsers) and adapter helpers from a TUI overlay.
- Running adapters against local DSPy signatures through a managed Python runner (`uv run python -m ...`) and streaming the LM history back into the Pi overlay for inspection.
- Exporting validated templates as sharable artifacts (Pi snippets + Python modules) so they can be reused in other repos.

## Success Criteria

- [ ] Extension registers `/template-adapter` command and overlay with Pi, following pi-mono component patterns.
- [ ] Users can create/edit TemplateAdapter definitions (messages, parse mode, helper registrations, demos) with validation based on DSPy signature metadata.
- [ ] Extension can spawn a Python runner that imports `dspy_template_adapter`, loads the saved template, binds it to a DSPy Signature stub, and executes LM calls with configured provider credentials.
- [ ] Execution overlay shows rendered messages, LM responses, parse results, and surfaced errors (parse failures, missing outputs) in real time.
- [ ] Adapter definitions can be exported/imported (JSON/YAML) and synced to project files.
- [ ] Tests cover template serialization, runner IPC contract, and failure scenarios (JSON/XML parse mismatch, missing helper registration, invalid demos).

## Phases

1. `dspya101` — Research & Integration Spike
2. `dspya102` — Extension Architecture & Template Management
3. `dspya103` — Execution Pipeline & Observability
4. `dspya104` — Validation, Packaging & Release Prep

## Dependencies

- `dspy-template-adapter` capabilities (messages list, parse modes, helper registration, preview/format APIs)
- Local Python runtime with `dspy`, `uv`, and provider credentials (OpenAI/Anthropic) for live calls
- Existing Pi extension SDK (command registration, overlay rendering, storage helpers)
- Prior learnings: `learning-76e583ca-pi-extensions-guide.md`, `learning-d8d1c166-extension-command-patterns.md`, `learning-62c593ff-component-architecture-patterns.md`

## Notes

- Favor deterministic adapter previews using `TemplateAdapter.preview(...)` before hitting LMs; expose this as a "render only" action in the extension.
- Lean on TemplateAdapter's structured output support (JSON/XML) to keep parsing logic out of the extension—extension simply surfaces `parse()` failures.
- Provide guardrails that mirror README guidance (single output field required for `full_text`, enforced field coverage for JSON/XML, `{{` escaping, etc.).