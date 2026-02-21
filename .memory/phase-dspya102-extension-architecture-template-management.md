---
id: dspya102
title: Extension Architecture & Template Management
epic_id: dspya1b2
created_at: 2026-02-21T21:06:00+10:30
updated_at: 2026-02-21T21:06:00+10:30
status: proposed
start_criteria: Phase dspya101 deliverables approved and runner/storage specs baselined.
end_criteria: Extension skeleton with storage adapters, schema validation, and overlay navigation merged into Dotfiles repo.
---

# Extension Architecture & Template Management

## Overview
Implement the Pi extension foundation: command registration, overlay modules, state machines, and persistence for TemplateAdapter definitions. Ensure message templates, parse modes, and helper configuration can be authored and validated inside Pi.

## Deliverables
- `/template-adapter` command + overlay registration using pi extension SDK.
- State machine + reducers for template editing (system/user/history nodes, helper registry, parse mode toggles).
- Schema validation module enforcing TemplateAdapter rules (single output for `full_text`, `json` outputs must match fields, `{{` escaping, etc.).
- Storage layer persisting adapter definitions under `pi/extensions/template-adapter/*.json` with version + checksum metadata.

## Tasks
- T201: Scaffold extension entrypoint, command definition, and overlay mount. *(to be created after phase review)*
- T202: Build template editing state machine + forms for message blocks, demos, helper registration. *(to be created after phase review)*
- T203: Implement schema validation + persistence service with unit tests. *(to be created after phase review)*

## Dependencies
- Output of dspya101 runner/storage decisions
- Pi extension component libraries + state machine patterns (see `learning-62c593ff` and `learning-96aa4357`)
- JSON schema tooling or Zod for validation

## Next Steps
1. Blocked on dspya101 approval.
2. After approval, detail tasks T201–T203 and begin implementation.
