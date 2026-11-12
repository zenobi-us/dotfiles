---
blocked_by: []
id: idea-capture-and-conversion-01-capture
parent: idea-capture-and-conversion
schema: tracker-ticket/v1
sequence: 1
title: Capture and reopen an idea
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Add the dedicated capturing-ideas interaction and its complete public record operations. An explicit request turns one sentence and the current conversation into a persisted idea. The user can reopen that idea in a later session.

Extend the canonical tracker validator and shared-context resolver together. Use tracker-idea/v1 and the session's resolved repository identity. Default idea storage to the resolved initiative store. Keep idea storage independent from the configured executable-ticket adapter.

Preserve the exact sentence. Save a one- or two-paragraph expansion, a concept checklist, and separate exploration suggestions. Concepts have stable identifiers. The checklist defines conversion scope. Suggestions do not become scope without user approval.

## Acceptance criteria

- **Explicit capture:** Ordinary discussion does not create an idea. A capture request saves immediately and returns its canonical reference and concept checklist.
- **Bounded input:** Expansion uses only the supplied sentence and conversation. Capture does not inspect project records or source code, perform research, or start grilling.
- **Original intent:** The exact sentence survives save and reopen. The expansion adds no requirements beyond stated intent. Agent suggestions remain separate.
- **Stable concepts:** Each checklist item has a stable identity. Approved wording changes and display-order changes do not change that identity.
- **Single repository:** The idea belongs to the already resolved repository context. Capture asks no repository or storage-selection question.
- **Typed resolution:** Public idea and collection resolution return validated paths, stable references, and publication rules. Existing valid route configurations remain usable.
- **Record validation:** Invalid schemas, duplicate concept identities, unsafe paths, and ticket execution fields fail validation. New ideas start open and do not create claims or workflow receipts.
- **Relationship distinction:** Multiple related initiatives or tickets are supported. Unknown relationships survive by name without invented canonical references. Associations do not count as conversion coverage.
- **Cross-session reads:** Public read and list operations discover the saved idea after the capture session ends. Preserve unknown authored metadata during approved updates.
- **No extra workflow:** Saving needs no checklist-approval interview and authorizes no research, grilling, conversion, or implementation.

## Verification

Exercise the real capture skill with a sentence and conversation context. Reopen its saved record through public tracker operations in a separate session. Confirm original text, stable concepts, separate suggestions, and unresolved relationships.

Add deterministic behavioral cases through the tracker and resolver interfaces. Cover repository, shared, and mixed routes, an external ticket adapter, existing route configurations, and path-escape rejection. Do not assert copied skill wording or internal forwarding.

## Scope boundaries

This ticket delivers complete capture and record discovery, not Herdr browsing or exploration. Keep worktree unchanged. Do not initialize or migrate context implicitly.

## Comments

The user approved this as the first vertical slice. It has no blocking tickets.

