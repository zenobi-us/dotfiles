---
blocked_by: []
id: collect-evidence-feedback-01-web
parent: collect-evidence-feedback
schema: tracker-ticket/v1
sequence: 1
title: Preserve Surf and Playwright in collect-evidence
triage: ready-for-agent
type: enhancement
work_status: implemented
---

# Preserve Surf and Playwright in collect-evidence

## What to build

Collect, validate and report real web evidence through collect-evidence with both existing web drivers.

Implement this complete slice. Follow the collect-evidence-feedback initiative and its common schema, command, storage, safety and testing rules.

## Acceptance criteria

- **Preserve the existing** Surf and Playwright drivers, typed browser plans, preconditions, attended behaviour and resource cleanup. Keep existing verdict, report and generated-comment capabilities available through the new skill.
- **Run a real** controlled-page workflow with each driver before removing the old browser-only skill. Check the visible page, actual screenshot, assertion outcome and cleanup. A missing required driver blocks the cutover; it does not count as a pass.
- **Produce collect-evidence/v1 run,** plan, case, asset, event and error records. Version owned Markdown frontmatter. Use stable IDs, ordered steps, descriptive capture sequences, real capture times, SHA-256 hashes, dimensions and driver provenance.
- **Keep capture status** separate from assertion results. Keep retries as new captures. Reject invalid records, missing media and unsupported explicit schemas without a valid-looking partial run.
- **Expose the specified** evidence commands through executable mise Bun CrustJS entrypoints. Check command behaviour from an unrelated directory. Honour common output flags, exit codes and dry-run limits.
- **Resolve the evidence** store through shared-context. Capture outside the watched source tree and finalize into the selected store. Seal completed media. Preserve third-party outputs and existing historical evidence.
- **Block unapproved confirmations** and credential prompts. Perform no remote Git operation, commit, push, credential entry or automatic tool installation during capture. Close only owned resources.
- **Migrate active callers** and skill authoring rules in the same clean cutover. Remove the old active entrypoints and aliases only after both driver workflow checks pass. Update the relevant docs and public workflow checks.

## Verification

Use the public workflow boundary approved in the initiative. Exercise the installed commands and the applicable HTTP, browser or native-driver surface. Use temporary resolved stores. Keep regression checks for consumer-visible failures. Do not prove behaviour from generated source text. Update affected documentation after verification.

## Specification coverage

This slice covers initiative user stories 1, 2, 3, 4, 5, 6, 10, 14, 15, 16, 17, 18, 19, 20, 21, 22, 49, 50, 51, 53. Keep the initiative as the complete specification.

## Comments

No discussion has been recorded.

