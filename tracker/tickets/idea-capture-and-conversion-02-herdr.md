---
blocked_by: 
  - idea-capture-and-conversion-01-capture
id: idea-capture-and-conversion-02-herdr
parent: idea-capture-and-conversion
schema: tracker-ticket/v1
sequence: 2
title: Browse, ask about, and archive ideas in Herdr
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Connect real saved ideas to the existing Herdr shared-context tree, record preview, filter footer, and isolated action launcher. An idea remains a distinct explorer target, not a ticket with an unusual document type.

Show an Ideas section before initiatives. Open ideas appear by default as ordinary tree items. The user can reveal done or archived ideas through the existing footer, inspect concept coverage and links, ask for advice, and explicitly archive an idea.

## Acceptance criteria

- **Normal tree:** Saved open ideas appear before initiatives without a separate card view. Selection opens the canonical idea and its concept checklist.
- **Footer filtering:** The existing footer exposes done and archived ideas without changing existing ticket queue meanings. Reload preserves the current repository's normal view state.
- **Coverage meaning:** Display the number of covered concepts without describing it as implementation progress. Keep research, grilling, and destination links available when present.
- **Distinct identity:** An idea, ticket, and initiative with the same identifier remain distinct selections. Missing or filtered records cannot open another record accidentally.
- **Fresh data:** Refresh reflects idea writes and repository changes. Invalid idea records produce actionable errors rather than empty success or ticket fallback behavior.
- **Advice action:** Ask Matt uses the selected idea's canonical reference and the existing prompt interaction. It gives advice only, changes no records, and starts no additional workflow.
- **Explicit archive:** An explicit archive request changes the persisted idea to archived. It preserves original intent and exploration records and removes the idea from the default open view.
- **Action preparation:** Reuse command availability, current-record validation, repository identity checks, and the existing isolated session launcher. Stale or unavailable targets cannot launch against the wrong record.
- **Consumer compatibility:** Update affected shared explorer consumers for the distinct idea kind. Existing ticket actions, initiative navigation, and non-idea records retain their behavior.
- **No recovery:** Loading and acting on ideas do not claim tickets or enter worktree recovery. Keep the worktree skill unchanged.

## Verification

Use a real captured idea in the running Herdr application. Select it, inspect concepts, ask a question through Ask Matt, archive it explicitly, and reveal it with the footer. Observe the persisted status and current selected reference.

Add behavior cases for default visibility, status filters, matching identifiers across record kinds, stale selections, missing commands, and existing ticket queues. Run mod checks and the required layout refresh round-trip. Inspect the actual surface and capture visual evidence with no new application errors.

## Scope boundaries

Do not add Research or Grill actions in this ticket. Their later tickets must reuse this real idea target and launcher path. Do not add placeholder actions.

## Comments

The user approved this slice after capture. Its blocker provides real idea records and canonical resolution.

