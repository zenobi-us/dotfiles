---
blocked_by: 
  - collect-evidence-feedback-06-edits
id: collect-evidence-feedback-07-drafts
parent: collect-evidence-feedback
schema: tracker-ticket/v1
sequence: 7
title: Recover drafts and prevent incomplete feedback exports
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

# Recover drafts and prevent incomplete feedback exports

## What to build

Keep unfinished feedback through navigation and reload, retain it after save failures and resolve it before UI export.

Implement this complete slice. Follow the collect-evidence-feedback initiative and its common schema, command, storage, safety and testing rules.

## Acceptance criteria

- **Persist browser drafts** as collect-feedback/v1 records. Bind them to the session, case, asset ID, source hash and starting revision. Keep saved server records authoritative.
- **Recover drafts across** case and asset changes and page reloads. Do not move a recovered draft to a changed image or overwrite a newer saved annotation.
- **Keep the draft** after a real server write failure. Show the failure and offer retry. Never show Saved for a failed or unacknowledged write.
- **When browser storage** fails, show a memory-only warning and retain the in-memory draft. Do not claim that the draft will survive reload.
- **Before a complete** UI export, require the user to save or explicitly discard unfinished drafts. Opening an unchanged saved note must not block navigation or export.
- **Exercise navigation, reload,** concurrent revisions, failed disk writes and failed browser storage through the real public workflow. Verify that saved exports retain the correct hashes and that failed operations do not lose comments.

## Verification

Use the public workflow boundary approved in the initiative. Exercise the installed commands and the applicable HTTP, browser or native-driver surface. Use temporary resolved stores. Keep regression checks for consumer-visible failures. Do not prove behaviour from generated source text. Update affected documentation after verification.

## Specification coverage

This slice covers initiative user stories 32, 34, 37, 42. Keep the initiative as the complete specification.

## Comments

No discussion has been recorded.

