---
id: idea-capture-and-conversion
schema: tracker-initiative/v1
title: Idea capture and conversion
type: Initiative
---

## Problem Statement

The user manages several initiatives and tickets at different stages. New ideas need a place outside that planned work. The user wants to supply one sentence and continue the current session without an interview or research.

An initiative requires a complete specification. A ticket represents executable work. Neither record describes a short idea that needs later exploration. Ordinary notes also lack concept identities, exploration links, and confirmed conversion coverage.

The user needs compact ideas that remain easy to scan. Research and grilling must remain separate. Later conversion must preserve the original intent and show which destination records cover each concept.

## Solution

Add a first-class idea record for the repository context already resolved for the session. Add a dedicated capture skill. The skill uses only the supplied sentence and current conversation to save the idea immediately.

Each idea preserves the exact sentence. Its short expansion contains one or two paragraphs. A checklist identifies individual concepts from the user's stated intent. Separate exploration suggestions contain agent-proposed directions, not requirements.

Show open ideas as ordinary items before initiatives in the Herdr file tree. Use the existing filter footer to reveal done and archived ideas. Provide Research, Grill, and advice-only Ask Matt actions.

Keep research and grilling in separate linked records. Support the whole idea or selected concepts. Under each relevant concept, attach labeled links rather than findings summaries. Use CITATION for supporting material and NEEDS CLARIFICATION for unresolved questions.

Require grilling for every concept before conversion. After the user confirms a clarification resolution, replace NEEDS CLARIFICATION with CLARIFIED. Preserve the original research link and the grilling result link.

Use /to-spec and /to-tickets as the explicit conversion commands. These commands can create records, update existing records, or combine both actions. The user confirms which destination records cover each concept. The idea becomes done when confirmed destination records cover every concept. An initiative alone or tickets alone can complete conversion.

## User Stories

1. As a user, I want explicit idea capture, so that ordinary discussion does not create records.
2. As a user, I want to supply one sentence, so that capture does not interrupt my current work.
3. As a user, I want capture to use our conversation, so that I do not repeat known intent.
4. As a user, I want capture without project inspection, so that research remains a separate action.
5. As a user, I want immediate persistence, so that an approval interview does not block capture.
6. As a user, I want to see the saved checklist, so that I can correct its interpretation.
7. As a user, I want my exact sentence preserved, so that later expansion does not replace my original thought.
8. As a user, I want a short expansion, so that I can understand an idea without reading a specification.
9. As a user, I want individual concepts as checklist items, so that I can scan the idea quickly.
10. As an agent, I want stable concept identifiers, so that links survive changes in wording and display order.
11. As a user, I want the checklist to define conversion scope, so that the paragraph does not duplicate requirements.
12. As a user, I want separate agent suggestions, so that speculation does not become my stated intent.
13. As a user, I want suggestions outside conversion scope, so that unapproved directions do not block completion.
14. As a user, I want the existing repository context, so that capture does not ask me to select storage.
15. As a user, I want each idea to concern one repository, so that its ownership remains clear.
16. As a user, I want several related initiative or ticket links, so that an idea can concern existing work.
17. As a user, I want unresolved relationships by name, so that missing canonical references do not block capture.
18. As a user, I want relationship links separate from coverage, so that a related ticket does not finish an idea.
19. As a user, I want open ideas before initiatives, so that I can find unplanned thoughts in the normal tree.
20. As a user, I want the existing filter footer, so that I do not learn a separate navigation model.
21. As a user, I want done and archived ideas hidden by default, so that open ideas remain visible.
22. As a user, I want concept coverage counts, so that I can see planned scope without confusing it with implementation.
23. As a user, I want research for the whole idea, so that I can investigate its overall direction.
24. As a user, I want research for selected concepts, so that I can investigate one uncertainty.
25. As a user, I want separate research records, so that the idea remains compact.
26. As a user, I want CITATION links under concepts, so that later grilling can use supporting material.
27. As a user, I want NEEDS CLARIFICATION links, so that unresolved questions remain visible.
28. As a user, I want automatic supporting-link attachment, so that each research result does not need separate approval.
29. As a user, I want research without scope changes, so that evidence does not silently redefine my idea.
30. As a user, I want grilling for the whole idea or selected concepts, so that I can resolve decisions incrementally.
31. As a user, I want separate grilling records, so that later sessions retain the questions and confirmed conclusions.
32. As a user, I want every concept grilled before conversion, so that captured interpretations receive scrutiny.
33. As a user, I want clarification resolution through grilling, so that research alone cannot clear a decision block.
34. As a user, I want to confirm clarification resolutions, so that the agent does not silently accept uncertainty.
35. As a user, I want both evidence links preserved after clarification, so that I can inspect the source and conclusion.
36. As a user, I want approval before checklist changes, so that exploration cannot silently change conversion scope.
37. As a user, I want Ask Matt to give advice, so that I can choose the next workflow without starting it.
38. As a user, I want /to-spec as an explicit conversion command, so that readiness does not create an initiative automatically.
39. As a user, I want /to-tickets as an explicit conversion command, so that readiness does not create tickets automatically.
40. As a user, I want conversion to stop before writes when grilling is incomplete, so that premature destination records do not appear.
41. As a user, I want blocked conversion to name affected concepts, so that I know which grilling remains necessary.
42. As a user, I want conversion to update existing records, so that related planned work does not need duplicate records.
43. As a user, I want destination links per concept, so that partial coverage remains explicit.
44. As a user, I want to confirm coverage in one response, so that several concepts do not require separate approval rounds.
45. As a user, I want an idea done only after full coverage, so that one related ticket cannot imply complete conversion.
46. As a user, I want initiative-only conversion, so that a complete specification can finish an idea before ticket creation.
47. As a user, I want tickets-only conversion, so that small planned work does not require an unnecessary initiative.
48. As a user, I want done to mean planned, so that idea status does not misrepresent implementation progress.
49. As a user, I want explicit archive without conversion, so that discarded or deferred ideas do not remain open.
50. As a user, I want archived ideas available for review, so that archive does not delete the original thought.
51. As a user, I want a new idea for new intent, so that completed ideas do not absorb unrelated scope.
52. As a user, I want the agent to assess proposed corrections, so that more accurate information can improve the existing idea.
53. As a user, I want approval before concept corrections, so that the agent cannot change scope on its own.
54. As a user, I want unaffected concepts to retain confirmation, so that one changed concept does not repeat all prior work.
55. As a user, I want meaning-changing corrections to require new grilling, so that old approval cannot cover different intent.
56. As a user, I want harmless accuracy corrections to preserve done status, so that unchanged meaning does not cause unnecessary conversion.
57. As a user, I want saved records to work across sessions, so that research and conversion do not depend on one conversation.
58. As a user, I want no worktree involvement, so that capture and planning do not start implementation workflows.

## Implementation Decisions

### Record ownership and storage

- **Capture interaction:** Add a dedicated capturing-ideas skill. It owns the one-sentence interaction, not a second record implementation.
- **Record operations:** Extend reading-and-writing-tickets to own idea creation, reads, listing, updates, validation, relationships, archive, and conversion coverage.
- **Storage operations:** Extend shared-context with typed idea, idea-collection, and idea-exploration resolution. Return canonical references and publication rules through the existing resolver interface.
- **Repository identity:** An idea belongs to the repository context already resolved for the session. Capture does not ask for a repository or inspect unrelated projects.
- **Storage layout:** Give each idea a canonical compact record and separate exploration records. Keep their locations inside the resolved idea store. Callers never construct physical storage paths themselves.
- **Route defaults:** Default idea storage to the resolved initiative store for the same repository context. Keep explicit routing inside shared-context. Preserve valid existing route configurations and require explicit requests for initialization or migration.
- **Versioned schema:** Use schema tracker-idea/v1, consistent with existing tracker schemas. An idea is neither a tracker-ticket/v1 record nor a tracker-initiative/v1 record.
- **Independent lifecycle:** Use open, done, and archived for ideas. Do not use ticket work_status, dependency edges, claims, or worktree receipts to represent idea state.
- **Single validation owner:** Keep authoritative idea validation and coverage rules in the tracker record module. Skills, explorer actions, and Herdr reuse that interface.
- **Existing records:** Preserve unrelated tracker metadata, initiative discussion, child membership, and legacy records. This feature does not authorize content migrations.

### Capture and concept identity

- **Explicit request:** Save an idea only after the user requests capture. The agent can suggest capture without performing it.
- **Bounded input:** Use only the supplied sentence and current conversation to expand intent. Do not inspect project records or source code to enrich capture or discover relationships.
- **Immediate persistence:** Save the record without a checklist-approval interview. Show the resulting reference and checklist. Saving does not authorize research, grilling, or conversion.
- **Compact content:** Preserve the exact sentence and a one- or two-paragraph expansion. Keep agent suggestions separate from stated intent.
- **Canonical scope:** The concept checklist defines conversion scope. The expansion provides context and must not introduce additional requirements.
- **Stable identifiers:** Give each concept a stable identity. Preserve that identity across reordering and approved wording corrections. Use it for evidence and destination links.
- **Checklist meaning:** A checked concept means confirmed destination coverage, not completed implementation. Manual checkbox changes must not bypass coverage validation.
- **Relationship meaning:** Related initiatives and tickets are associations, not parents, blockers, or proof of conversion. Preserve unresolved names separately from confirmed canonical references.

### Research, grilling, and advice

- **Action scope:** Research and Grill accept the whole idea or selected concept identifiers. Default Research to the whole idea.
- **Separate exploration:** Persist research and grilling outputs as separate idea-linked records. Do not treat these outputs as executable tickets or replace the compact idea with their content.
- **Labeled evidence:** Attach only labeled links beneath relevant concepts. Use CITATION and NEEDS CLARIFICATION. Do not add findings summaries to the checklist.
- **Supporting writes:** The agent can attach these links without separate approval. Supporting material does not change the concept checklist or mark concepts covered.
- **Required grilling:** Every concept requires completed grilling before conversion, even when it has no NEEDS CLARIFICATION link.
- **Clarification block:** A NEEDS CLARIFICATION link blocks conversion of its concept. Research alone and general advice cannot clear it.
- **Confirmed resolution:** After the user confirms a grilling resolution, change its label to CLARIFIED. Preserve the original research link and add the grilling result link.
- **Scope protection:** Exploration proposes concept changes. The user must approve those changes before the tracker updates conversion scope.
- **Advice only:** Ask Matt answers general questions about the idea and available workflows. It does not start another workflow, alter records, or satisfy grilling requirements.
- **Fresh action input:** Reuse existing action preparation and session-launch interfaces. Resolve current idea content, routes, and selected concepts before an action starts. Reject stale or missing selections.
- **No recovery participation:** Idea actions do not claim tickets, inspect execution liveness, or enter worktree recovery. Existing ticket actions remain unchanged.

### Conversion and confirmed coverage

- **Explicit entry points:** Extend /to-spec and /to-tickets to accept an idea reference. Do not add a separate conversion command or convert automatically after grilling.
- **Pre-write gate:** Before destination writes, require completed grilling for every current concept and confirmed resolution of every clarification block. Report affected concepts when this gate fails. Do not start grilling automatically.
- **Existing command behavior:** Preserve ordinary conversation, initiative, and ticket inputs. Apply idea-specific gates when the input selects an idea.
- **Destination choice:** Create initiatives or tickets, update existing destination records, or combine these actions. /to-tickets must support idea-to-ticket conversion without forcing a new initiative.
- **Coverage proposal:** The agent maps each concept to canonical destination references and explains the proposed coverage. An ordinary related link does not establish this mapping.
- **User confirmation:** Require the user's coverage confirmation before checking concept items. One response can confirm several concepts in the conversion conversation.
- **Read-back validation:** Confirm that destination records persist and cover the approved scope before the idea records coverage. Follow normal tracker validation and publication rules.
- **Complete conversion:** Set done only when every concept has confirmed coverage. A single initiative or a set of tickets can satisfy the complete checklist independently.
- **Partial coverage:** Retain open status when any concept lacks confirmed coverage. Agent suggestions do not count as required scope.
- **Failure handling:** Do not report successful conversion when destination writes, validation, or required publication fail. Report persisted changes and retain the idea's incomplete state. Never infer success from a session exit.
- **Planning status:** Do not reopen a done idea merely because its destination tickets remain unimplemented. Idea completion and implementation completion have different meanings.

### Corrections and archive

- **New intent:** Prefer a new idea for a new desired outcome. Link it to the earlier idea when relevant.
- **Agent analysis:** Compare a proposed adjustment with existing intent. Distinguish new intent from a correction that improves accuracy. Present the recommendation before any concept change.
- **Approved correction:** Require approval to change the concept checklist. Retain identities, evidence, and destination references where they remain valid.
- **Changed meaning:** If an approved change alters meaning or questions confirmed coverage, reopen the idea. Require new grilling and coverage confirmation only for affected concepts.
- **Unchanged meaning:** If an approved accuracy correction leaves meaning and confirmed coverage unchanged, retain grilling, coverage, and done status.
- **Explicit archive:** Archive only at the user's explicit request. Archive does not require conversion and does not delete the idea or exploration records.

### Herdr integration

- **Normal tree items:** Place an Ideas section before initiatives in the existing file tree. Show open ideas by default. Do not introduce a separate card view.
- **Existing footer:** Extend the existing filter footer to reveal done and archived ideas. Preserve existing ticket queues and their meanings.
- **Coverage display:** Show covered-concept counts without presenting them as implementation progress. Keep exploration and destination links available from the selected idea.
- **Actions:** Offer Research, Grill, and Ask Matt for idea targets. Research and Grill support concept selection. Ask Matt retains the existing prompt interaction and remains advice-only.
- **Typed selection:** Extend shared explorer targets, snapshots, requests, and action preparation with idea records. Keep ideas distinct from tickets and initiatives, even when identifiers match.
- **Existing launcher:** Reuse the current isolated session launcher and command-availability handling. Do not duplicate skill routing inside the interface.
- **State refresh:** Preserve the existing repository identity and selection checks. Refresh the displayed idea after record changes and handle missing or filtered selections without opening the wrong record.
- **Existing consumers:** Update affected shared-model consumers so the new idea kind does not fall through a ticket or initiative branch. Preserve unrelated consumer behavior.

## Testing Decisions

### Confirmed verification seams

The user confirmed three existing interfaces for verification. The primary behavioral seam is public tracker record operations. Shared-context resolution and the actual Herdr surface provide integration proof. Do not add a test-only interface.

- **Tracker operations:** Exercise idea capture persistence, stable concepts, relationship distinctions, clarification blocks, grilling requirements, coverage confirmation, conversion, archive, and correction through public record operations.
- **Context resolution:** Exercise repository and shared storage through the existing typed resolver. Include a mixed-route configuration and unchanged existing configurations. Confirm canonical references and reject paths outside the selected store.
- **Herdr surface:** Exercise discovery, open-by-default behavior, footer filters, selection, concept-scoped actions, and session launch in the actual application.

### Behavioral cases

- **Capture boundaries:** Confirm that capture uses only the sentence and conversation. Confirm that it does not inspect project content, start exploration, or request checklist approval.
- **Intent preservation:** Confirm the exact sentence, separate suggestions, and stable concept identity after an approved reorder or wording correction.
- **Relationship boundaries:** Confirm that unresolved names survive capture and that related links do not count as destination coverage.
- **Exploration scope:** Confirm whole-idea and selected-concept research and grilling. Confirm that evidence links attach only to the relevant concepts.
- **Scope protection:** Confirm that research can attach labeled links but cannot change checklist scope or silently mark coverage.
- **Clarification transitions:** Confirm that research cannot clear a clarification block. Confirm that an approved grilling resolution preserves both evidence links.
- **Grilling freshness:** Confirm that changed concepts cannot reuse approval for different meaning. Confirm that unaffected concepts keep valid confirmation.
- **Pre-write rejection:** Confirm that both conversion commands leave destination records unchanged when any required grilling remains incomplete.
- **Coverage authority:** Confirm that unapproved coverage and manual checkbox changes cannot mark an idea done.
- **Conversion alternatives:** Confirm initiative-only, tickets-only, existing-destination, and mixed create/update conversion. Confirm that tickets-only conversion does not force an initiative.
- **Incomplete conversion:** Confirm open status after partial coverage or a destination failure. Confirm that the result names any persisted changes accurately.
- **Lifecycle separation:** Confirm that done does not imply implementation. Confirm that explicit archive preserves the idea and its supporting records.
- **Correction analysis:** Confirm that new intent produces a new-idea recommendation. Confirm that a harmless approved accuracy correction can leave a done idea unchanged in status.
- **Action safety:** Confirm that Ask Matt gives advice without mutation. Confirm that stale record selections and unavailable commands cannot launch actions against the wrong target.
- **Consumer compatibility:** Confirm that existing initiative membership, ticket queues, and ordinary /to-spec and /to-tickets inputs retain their behavior.

### Prior art and runtime proof

Reuse the existing tracker schema and membership checks, shared-context route and layout cases, explorer action-preparation cases, and Herdr tree cases. Keep permanent tests deterministic and focused on consumer-visible behavior, boundaries, errors, and transitions. Do not test source text, copied prompts, forwarding, or internal wiring.

For smoke proof, capture an idea through the real skill, reopen it in Herdr, run concept-scoped research and grilling, and exercise both blocked and successful conversion. Use isolated records for destructive or failure cases. Observe persisted coverage and status, not just a successful command exit.

For Herdr proof, run the mod checks, refresh the active layout through the required round-trip, and inspect the real tree, filters, and action launcher. Capture a screenshot and confirm that the application reports no new errors. A passing unit suite alone does not prove the visible feature.

## Out of Scope

- **Implementation workflows:** No worktree skill changes, ticket claims, implementation sessions, review receipts, or automatic delivery.
- **Implicit capture:** No automatic conversion of ordinary conversation into saved ideas.
- **Capture research:** No project inspection, external research, or grilling during the one-sentence capture interaction.
- **Cross-repository ideas:** No idea ownership across multiple repository contexts.
- **Unapproved scope:** No automatic checklist changes, accepted uncertainty, or coverage confirmation by the agent.
- **Duplicate specifications:** No separate specification ticket or second specification document for an initiative.
- **Forced hierarchy:** No mandatory initiative for tickets-only idea conversion.
- **New interface surface:** No separate idea card dashboard or replacement for the existing tree footer.
- **Automatic storage changes:** No implicit context initialization, migration, or relocation.
- **Legacy migration:** No unrelated tracker schema migration, reparenting, or historical receipt rewrite.

## Further Notes

This specification records the confirmed interview. The concept checklist is conversion scope. Research findings and agent suggestions are not requirements unless the user approves a scope change.

The implementation must update the capture, record, resolver, exploration, conversion, and shared-interface contracts together. The current record validator and explorer targets support initiatives and tickets, not the complete idea behavior specified here.

The default storage decision keeps ideas inside the session's existing repository context. A shared physical store does not make an idea span repository identities.

No idea record exists for this feature because idea capture is not implemented yet. This initiative therefore comes from the confirmed conversation. Publication must not fabricate an idea record, checked concepts, or conversion history.

This operation creates the initiative only. Ticket decomposition remains a separate /to-tickets request. Implementation requires a later explicit request.

## Tickets

No child tickets exist yet.

## Comments

The user confirmed the feature model and the tracker, resolver, and actual Herdr verification seams before publication. The user selected /to-spec to publish this specification.

