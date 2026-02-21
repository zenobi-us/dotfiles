---
id: dspya104
title: Validation, Packaging & Release Prep
epic_id: dspya1b2
created_at: 2026-02-21T21:08:00+10:30
updated_at: 2026-02-21T21:08:00+10:30
status: proposed
start_criteria: Execution pipeline delivering stable runs with telemetry captured.
end_criteria: Extension tested, documented, versioned, and ready for user validation.
---

# Validation, Packaging & Release Prep

## Overview
Harden the extension with automated tests, documentation, and release artifacts. Ensure TemplateAdapter integrations behave predictably across parse modes (full_text/json/xml) and helper scenarios, and that users have clear onboarding instructions.

## Deliverables
- Test suite covering storage serialization, validation rules, runner contract, and execution flows (including failure injection for parse errors and helper exceptions).
- Documentation set: README update, usage guide (editing templates, running previews, interpreting telemetry), troubleshooting matrix referencing TemplateAdapter checklist.
- Release packaging: version bump, changelog entry, optional pi package manifest, and sample adapter templates seeded into repo.
- Final review report summarizing coverage, open risks, and recommended follow-up epics (e.g., optimizers, auto few-shot generation).

## Tasks
- T401: Build automated tests + CLI harness for runner contract. *(to be created after phase review)*
- T402: Write documentation + onboarding walkthrough. *(to be created after phase review)*
- T403: Prep release artifacts, example adapters, and QA checklist. *(to be created after phase review)*

## Dependencies
- Completed functionality from dspya102/dspya103
- Access to TemplateAdapter test utilities + sample signatures
- Existing documentation patterns from `learning-76e583ca-pi-extensions-guide.md`

## Next Steps
1. Requires approval of earlier phases + QA scope.
2. Create detailed tasks once upstream work is stable.
