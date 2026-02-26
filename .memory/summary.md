# Project Summary

## Overview
Dotfiles repository with Pi local extensions. Current focus is planning a TemplateAdapter-driven Pi extension that gives precise control over DSPy prompts directly inside Pi while keeping the previous pi-interview questionnaire epic on hold until TemplateAdapter planning is approved.

## Active Epic

### `dspya1b2` — TemplateAdapter Pi Extension
- **Status:** Planning (awaiting human review)
- **Goal:** Provide a `/template-adapter` extension that lets users author TemplateAdapter message templates (system/user/history directives, `{inputs()}/{outputs()}` helpers, parse modes) and run them via a managed Python runner that imports `dspy_template_adapter`.
- **Key Decisions:**
  1. Persist adapter definitions as JSON with versioned schema + checksum in repo.
  2. Use `uv run python scripts/template_adapter_runner.py` as the execution boundary so the extension can call TemplateAdapter's `preview()`/`parse()`/`Predict` flows.
  3. Surface TemplateAdapter invariants (single output field for `full_text`, parse mode/schema alignment, helper registration) inside the Pi overlay before hitting LMs.

#### Phase Status
- **Phase `dspya101` Research & Integration Spike:** 🟡 Proposed — needs human approval before tasks are created.
- **Phase `dspya102` Extension Architecture & Template Management:** 🟡 Proposed — blocked on dspya101.
- **Phase `dspya103` Execution Pipeline & Observability:** 🟡 Proposed — blocked on dspya101/102.
- **Phase `dspya104` Validation, Packaging & Release Prep:** 🟡 Proposed — blocked on earlier phases.

## Secondary Epic (Paused)

### `9c7e21ab` — pi-interview pi-tui questionnaire UI
- **Status:** Execution-ready but paused while TemplateAdapter plan is under review.
- **Goal:** Local Dotfiles extension replaces `interview` with a pi-tui-native questionnaire flow.

#### Ready Backlog (still valid once work resumes)
- Story/task set already defined for questionnaire renderer, navigation validation, image support, and compatibility parity.

## Proposed Epic (New Idea Intake)

### `e9b2c7d4` — Neovim ↔ Pi ZeroMQ Event Bus Extension
- **Status:** Proposed (research in progress/completed for feasibility)
- **Goal:** Star-topology event bus connecting Neovim and Pi clients, with first Pi instance bootstrapping broker lifecycle and participating as a normal client.
- **Current artifacts:**
  - Epic: `epic-e9b2c7d4-nvim-pi-zeromq-event-bus-extension.md`
  - Phase: `phase-e9b2p101-research-consolidation-and-protocol-draft.md`
  - Research: `research-a7f8b2c4-neovim-pi-zeromq-event-bus.md`

## Next Milestones
1. **Human review of TemplateAdapter epic/phase plan** (`task-dspyrvw-review-template-adapter-plan.md`).
2. **Human triage for new epic `e9b2c7d4`** (prioritize now vs keep in backlog).
3. If prioritized, convert ZeroMQ research into story/task breakdown for phase `e9b2p101`.
4. Decide whether to resume Epic `9c7e21ab` immediately or after current planning queues are cleared.

## Readiness Snapshot
- TemplateAdapter plan artifacts: ✅ epic + 4 phases + architecture codemap created.
- ZeroMQ event-bus idea: ✅ epic drafted + research brief captured; ⏸️ pending prioritization.
- Questionnaire epic backlog: ✅ remains execution-ready but currently paused.
