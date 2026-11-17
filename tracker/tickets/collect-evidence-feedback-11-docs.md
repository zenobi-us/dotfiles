---
schema: tracker-ticket/v1
id: collect-evidence-feedback-11-docs
title: Document the evidence and feedback workflow
type: enhancement
triage: ready-for-agent
work_status: unclaimed
parent: collect-evidence-feedback
sequence: 11
blocked_by:
  - collect-evidence-feedback-01-web
  - collect-evidence-feedback-02-tui
  - collect-evidence-feedback-03-gui
  - collect-evidence-feedback-04-viewer
  - collect-evidence-feedback-05-pins
  - collect-evidence-feedback-06-edits
  - collect-evidence-feedback-07-drafts
  - collect-evidence-feedback-08-video
  - collect-evidence-feedback-09-history
  - collect-evidence-feedback-10-request
---

# Document the evidence and feedback workflow

## What to build

Complete the documentation for operators, reviewers, and agents who use collect-evidence and collect-feedback.
Users must be able to collect evidence, save feedback, and locate the records through the skill documentation and the existing website.

Use the completed initiative as the source for the documented behavior. Keep essential instructions in each feature's documentation.
Use this final ticket to make the documentation complete and consistent across the initiative.

## Acceptance criteria

- **Audience and workflows:** Cover evidence collection, historical evidence, feedback sessions, annotations, validation, and export for operators, reviewers, and agents.
- **Diátaxis structure:** Add howto.md to the new collect-feedback skill. Use task-focused procedures with prerequisites and expected results. Keep CLI reference and system explanations separate, with links between them. Add links to the collect-evidence driver procedures.
- **CLI documentation:** Explain the supported commands, inputs, outputs, output formats, exit codes, prerequisites, and driver limits. Include complete examples that use the installed entrypoints and do not depend on the caller's current directory.
- **Data storage:** Explain how shared-context resolves the evidence store for the repository in scope. Cover evidence runs, feedback sessions, record layout, stable references, immutable assets, saved annotations, browser drafts, and exports. Explain capture staging, finalization, historical provenance, and separate publication approval. Do not assume that all stores use the repository root.
- **System relationships:** Explain the responsibilities of collect-evidence, collect-feedback, shared-context, reading-and-writing-tickets, worktree, and writing-reports. Show how ticket references, workflow IDs, evidence runs, feedback sessions, and reports connect. Distinguish authoritative ticket records, phase receipts, evidence records, saved feedback, and browser drafts. Evidence and feedback do not change ticket status or prove phase completion.
- **Website and navigation:** Update the existing website with the how-to guide and links to the CLI reference and system explanations. Update relevant README links, guides, and examples. Create missing documentation that users need. Do not create another website.
- **Delivered behavior:** Make all documentation match the completed implementation. State supported capabilities and known limits. Do not describe an unavailable driver or an unexercised platform as verified.
- **Documentation checks:** Run the documented commands and examples through their public interfaces with temporary resolved stores. Inspect the website pages and navigation. Check all changed links and record unavailable prerequisite coverage. Correct inaccurate instructions before completion.

## Verification

Use the installed CLIs and the existing website as the public interfaces.
Exercise a complete documented path from evidence collection to saved feedback and export.
Compare the documented store locations and record references with the shared-context results and saved records.
Use historical evidence only where the guide explicitly requires it. Preserve source assets and existing user feedback.

## Comments

