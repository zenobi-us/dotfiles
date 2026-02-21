---
id: dspya101
title: Research & Integration Spike
epic_id: dspya1b2
created_at: 2026-02-21T21:05:00+10:30
updated_at: 2026-02-21T21:05:00+10:30
status: proposed
start_criteria: Epic dspya1b2 approved and TemplateAdapter repo review scheduled with Q.
end_criteria: Integration brief describing runner contract, storage format, and UX journeys signed off by Q.
---

# Research & Integration Spike

## Overview
Establish a deep understanding of `dspy-template-adapter` APIs and define how a Pi extension will interact with them. Produce artifacts that specify message/template storage, Python runner invocation, and overlay information architecture.

## Deliverables
- Annotated audit of TemplateAdapter capabilities (messages list, directives, parse modes, helper registration, preview tooling).
- Decision log on how to serialize adapter definitions inside the Dotfiles repo (YAML vs JSON, field validation rules, versioning tags).
- Runner contract doc describing how the extension shells out to `uv run python scripts/template_adapter_runner.py` with adapter payloads, results, and error envelopes.
- UX flow outline for `/template-adapter` command, including entry states (create vs edit), preview modal, and execution console views.

## Tasks
- T101: Read DSPy TemplateAdapter README + examples and capture integration notes. *(to be created after phase review)*
- T102: Prototype `adapter.preview()` + `adapter.parse()` from a Python stub invoked via `uv run` to validate IPC boundaries. *(to be created after phase review)*
- T103: Draft UX flow diagrams + storage format spec. *(to be created after phase review)*

## Dependencies
- Access to TemplateAdapter repository/documentation
- Local Python environment with `dspy` and `dspy-template-adapter`
- Pi extension SDK reference + existing overlay patterns

## Next Steps
1. Secure human review of this phase plan.
2. Upon approval, create task files T101–T103 and schedule execution.
