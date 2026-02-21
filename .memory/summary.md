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

## Next Milestones
1. **Human review of TemplateAdapter epic/phase plan** (`task-dspyrvw-review-template-adapter-plan.md`).
2. After approval, create detailed tasks for Phase `dspya101` (repo audit, runner prototype, UX/storage spec).
3. Decide whether to resume Epic `9c7e21ab` immediately or after TemplateAdapter foundation is delivered.

## Readiness Snapshot
- TemplateAdapter plan artifacts: ✅ epic + 4 phases + architecture codemap created.
- Task breakdown: ⏸️ waiting on human approval before generating task files per phase.
- Questionnaire epic backlog: ✅ remains execution-ready but currently paused.
