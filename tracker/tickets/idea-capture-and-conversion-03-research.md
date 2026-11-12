---
blocked_by: 
  - idea-capture-and-conversion-02-herdr
id: idea-capture-and-conversion-03-research
parent: idea-capture-and-conversion
schema: tracker-ticket/v1
sequence: 3
title: Research ideas and attach concept evidence
triage: ready-for-agent
type: enhancement
work_status: unclaimed
---

## What to build

Provide the Research action for real ideas through the research skill and Herdr launcher. Support the whole idea by default or selected concept identifiers. Research runs against primary sources and leaves a separate, cited research record.

Add the shared, versioned exploration-record operations and typed storage resolution needed by research and later grilling. Keep exploration records idea-owned and separate from executable tickets. Link findings beneath relevant concepts without expanding the compact checklist with summaries.

## Acceptance criteria

- **Selectable scope:** Research can target the whole idea or selected concepts. The action passes stable concept identities, not only display text or row positions.
- **Current selection:** Action preparation reloads the idea and selected concepts. Missing, changed, or cross-repository selections cannot silently redirect research.
- **Separate record:** Research persists its findings and primary-source citations in a separately resolved exploration record. It records the originating idea and relevant concepts.
- **Labeled links:** Attach CITATION links for supporting evidence and NEEDS CLARIFICATION links for unresolved questions beneath the appropriate concepts.
- **Compact checklist:** The idea receives labeled links only. Research summaries remain in the separate record.
- **Supporting approval:** The agent can attach supporting links without separate approval. It cannot change the user's concept text, required scope, checked state, or coverage.
- **No resolution:** Research alone cannot clear a clarification block, establish completed grilling, or finish conversion. Suggestions for scope changes remain proposals.
- **Storage consistency:** Resolve exploration targets through shared-context and use the tracker-owned contract for their links. Apply the resolved store's publication rules.
- **Failure integrity:** Do not attach a success link to a missing or failed research result. Report a persisted research record accurately if a later link or publication step fails.
- **Existing behavior:** Standalone research remains usable. Idea-specific behavior does not turn ordinary research into executable tickets or alter unrelated records.

## Verification

Start research from the real Herdr idea action, first for a selected concept and then for the whole idea. Open the separate result and its primary-source citations. Reopen the idea and confirm the relevant labeled links and unchanged scope.

Add deterministic behavior cases for concept targeting, record identity, attachment boundaries, invalid selections, and partial persistence failures. Use the public exploration interface and existing action preparation cases. Do not test mocked prompt echoes.

Run the mod checks, refresh the layout, and observe the Research action and concept selection in the actual application. Capture visual evidence and remove temporary smoke records after verification.

## Scope boundaries

This ticket supplies real research and the reusable exploration record interface. It does not resolve decisions through grilling, accept scope changes, or perform conversion.

## Comments

The user approved this slice after Herdr idea integration. The grilling slice reuses its exploration storage and evidence links.

