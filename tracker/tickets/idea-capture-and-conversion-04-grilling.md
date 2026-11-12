---
blocked_by: 
  - idea-capture-and-conversion-03-research
id: idea-capture-and-conversion-04-grilling
parent: idea-capture-and-conversion
schema: tracker-ticket/v1
sequence: 4
title: Grill concepts and resolve clarifications
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Provide the Grill action for the whole idea or selected concepts. Use the existing grilling and grill-with-docs workflows with the compact idea and its linked research as input. Persist questions, answers, and confirmed conclusions in a separate exploration record.

Track completed grilling per current concept. Every concept requires grilling, even when it has no NEEDS CLARIFICATION link. Preserve a clear distinction between a running interview, proposed conclusions, and user-confirmed resolution.

## Acceptance criteria

- **Scoped grilling:** Users can grill the whole idea or selected stable concept identifiers through the skill and Herdr action. Linked research is available to the interview.
- **Separate history:** Persist a separately resolved grilling record with the relevant idea and concept references. Do not replace the compact idea with the interview transcript.
- **Explicit confirmation:** Ask one question at a time during grilling. Record confirmed conclusions without treating session exit or agent confidence as user approval.
- **Universal requirement:** Each concept records completed grilling before conversion eligibility. A concept without research links still requires grilling.
- **Clarification gate:** NEEDS CLARIFICATION remains unresolved until grilling reaches a user-confirmed resolution. Research and Ask Matt cannot satisfy this requirement.
- **Resolved links:** After confirmation, replace NEEDS CLARIFICATION with CLARIFIED. Retain the original research link and add the grilling result link.
- **Scope protection:** Exploration can propose checklist changes, but it cannot apply them without user approval. Preserve the exact original sentence and separate agent suggestions.
- **Concept freshness:** Associate confirmed conclusions with the concept meaning that the user reviewed. A different concept or changed meaning cannot inherit stale confirmation. Unaffected concepts retain valid records.
- **Failure integrity:** An incomplete or interrupted interview cannot satisfy completed grilling. Failed writes or required publication do not produce false success.
- **No conversion:** Completed grilling does not create or update initiatives or tickets. It does not start another workflow automatically.

## Verification

Use the actual Grill action on an idea with two concepts and a research clarification link. Resolve one concept, preserve the original evidence, and confirm that the other concept remains incomplete. Complete the remaining grilling in a later session.

Add behavior cases for selected-concept scope, confirmed and unconfirmed resolutions, no-research concepts, interruption, approved scope changes, and stale concept meanings. Exercise the tracker exploration interface and existing action preparation interface.

Run mod checks and the required layout refresh. Inspect concept selection and linked results in the running application and capture visual evidence.

## Scope boundaries

This ticket establishes real grilling records and conversion eligibility. Conversion commands and done status remain outside this slice. Keep worktree unchanged.

## Comments

The user approved this slice after research because it reuses the separate exploration record interface and research evidence links.

