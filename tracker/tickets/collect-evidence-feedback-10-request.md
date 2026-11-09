---
blocked_by: 
  - collect-evidence-feedback-02-tui
  - collect-evidence-feedback-03-gui
  - collect-evidence-feedback-05-pins
  - collect-evidence-feedback-09-history
id: collect-evidence-feedback-10-request
parent: collect-evidence-feedback
schema: tracker-ticket/v1
sequence: 10
title: Collect feedback from one workflow request
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

# Collect feedback from one workflow request

## What to build

Invoke collect-feedback for web, TUI or GUI work, collect the requested evidence and open a feedback session with the correct notes and provenance.

Implement this complete slice. Follow the collect-evidence-feedback initiative and its common schema, command, storage, safety and testing rules.

## Acceptance criteria

- **Publish the user-invocable** collect-feedback skill with versioned frontmatter. Select the appropriate collect-evidence driver playbook from the requested surface and approved scope.
- **Use the installed** collector for fresh evidence. Validate and seal its results before session creation. Carry each case purpose, procedure, expected result, observed result, limits and source references into the feedback session.
- **Support explicit historical** reuse through the historical import path. Never label reused evidence as a current capture.
- **Create and serve** the feedback session through the existing CLI and API implementation. Return its actual loopback URL and saved-record references. Do not add a second capture pipeline or server implementation.
- **Stop affected cases** at missing required prerequisites, credential dialogs or unapproved confirmations. Keep optional video limits explicit. Perform no remote Git operation or automatic publication.
- **Document only available** capabilities and preserve resources owned by the user. Keep publication a separate explicit action.
- **Exercise a real** fresh workflow for each available surface through the installed skill commands. Create and export a saved pin from the resulting session. Verify the explicit historical branch and blocked-prerequisite branch through the same public workflow.

## Verification

Use the public workflow boundary approved in the initiative. Exercise the installed commands and the applicable HTTP, browser or native-driver surface. Use temporary resolved stores. Keep regression checks for consumer-visible failures. Do not prove behaviour from generated source text. Update affected documentation after verification.

## Specification coverage

This slice covers initiative user stories 23. Keep the initiative as the complete specification.

## Comments

No discussion has been recorded.

