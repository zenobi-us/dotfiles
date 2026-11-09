---
blocked_by: 
  - collect-evidence-feedback-05-pins
id: collect-evidence-feedback-06-edits
parent: collect-evidence-feedback
schema: tracker-ticket/v1
sequence: 6
title: Edit and undo feedback without lost changes
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

# Edit and undo feedback without lost changes

## What to build

Edit, delete and undo saved feedback while rejecting stale updates from another editor.

Implement this complete slice. Follow the collect-evidence-feedback initiative and its common schema, command, storage, safety and testing rules.

## Acceptance criteria

- **Provide saved-note selection** and editing in the existing browser interface. Keep the same annotation ID and source binding through each edit.
- **Implement revision-checked PATCH** and DELETE operations with If-Match. Return HTTP 428 for missing preconditions and HTTP 412 for stale revisions. Do not use last-write-wins.
- **Use reversible tombstones** for deletion. Undo restores the same annotation identity without losing its comment, priority, geometry or source reference.
- **Check source hashes** and mutation permissions before edits, deletion and undo. Reject malformed requests and unsupported schemas without partial writes.
- **Preserve the client** draft after a conflict. Opening an unchanged saved note must not create an edit or a dirty draft.
- **Exercise two real** clients at the public HTTP boundary. Verify that a stale edit cannot overwrite a newer saved note. Check edit, delete, undo, reload, restart and export through the browser and API.

## Verification

Use the public workflow boundary approved in the initiative. Exercise the installed commands and the applicable HTTP, browser or native-driver surface. Use temporary resolved stores. Keep regression checks for consumer-visible failures. Do not prove behaviour from generated source text. Update affected documentation after verification.

## Specification coverage

This slice covers initiative user stories 35, 36, 37, 43. Keep the initiative as the complete specification.

## Comments

No discussion has been recorded.

