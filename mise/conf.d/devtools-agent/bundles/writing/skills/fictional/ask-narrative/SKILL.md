---
name: ask-narrative
description: Ask which fictional-writing skill or workflow fits the current narrative task.
disable-model-invocation: true
---

# Ask Narrative

Route fictional-writing work to the smallest useful skill.

Select one primary skill. Add supporting skills only when the task needs them.
Treat the workflow as an iteration loop, not a fixed sequence.
Read the repository anchors before you route work that changes shared material.

## Available Skills

### Repository setup

- `narrative-repo-setup` — create or repair narrative repository anchors.

### Planning and creation

- `story-architect` — create premises, arcs, episodes, scenes, choices, stakes, endings, and consequences.
- `character-designer` — create character identity, causal backstory, beliefs, goals, relationships, voice, secrets, and personal arcs.
- `world-builder` — create places, history, technology, institutions, social conditions, and setting pressure.
- `faction-designer` — create factions, power structures, relationships, vulnerabilities, and internal conflict.

### Review and control

- `continuity-keeper` — find conflicts in identity, chronology, character state, factions, technology, causality, canon, links, and metadata.
- `canon-steward` — record source claims, canon layers, citations, uncertainty, and copyright-safe summaries.
- `plot-doctor` — find weak premises, unclear stakes, flat escalation, broken causality, and weak endings.
- `narrative-style-editor` — revise tone, voice, pacing, dialogue, sensory detail, and clarity.
- `arc-cartographer` — create Mermaid diagrams and readable maps of arcs, timelines, factions, characters, and dependencies.
- `narrative-session-recorder` — convert planning or writing sessions into structured story, character, faction, and timeline updates.
- `narrative-publishing-manager` — prepare stories for review or publication.

## Iterative Flow

Use this loop for narrative work:

```text
seed
  ↓
identify the current gap
  ↓
select one primary skill
  ↓
update linked facets
  ↓
run conditional review or recording
  ↺
select the next gap
```

A seed can be an event, character, place, faction, technology, story, source, or continuity conflict.

Do not run the full writing workflow for a single facet. Treat `continuity-keeper`, `narrative-session-recorder`, `narrative-style-editor`, and `narrative-publishing-manager` as conditional skills.

Use `arc-cartographer` when the linked material has enough structure to map.

## Reference Routing

Route to the smallest reference when the task needs focused guidance:

- Causal backstory or flat character → `character-designer/references/causal-backstory.md`.
- Dialogue, voice, or character agenda → `character-designer/references/dialogue-as-action.md`.
- Flat or predictable arc → `story-architect/references/dramatic-tension.md`.
- Lore dump or unused setting detail → `world-builder/references/showing-lore-through-pressure.md`.
- Faction status, agenda, or negotiation problem → `faction-designer/references/social-status-and-agenda.md`.
- Unearned reveal or unclear secret → `continuity-keeper/references/promise-and-reveal-tracking.md`.
- Licensed character or setting fact → `canon-steward/references/source-use-for-character-and-lore.md`.
- Flat prose or dialogue rhythm → `narrative-style-editor/references/rhythm-and-revision.md`.

## Decision Rules

- If the repository lacks narrative anchors, use `narrative-repo-setup` first.
- If the request asks what happens in a story, use `story-architect`.
- If a character needs identity, causal backstory, beliefs, voice, or a personal arc, use `character-designer`.
- If the request asks what exists in the setting, use `world-builder`.
- If a group has independent goals and resources, use `faction-designer`.
- If official setting facts matter, use `canon-steward` before creation.
- If existing material can conflict, use `continuity-keeper`.
- If the story structure feels weak, use `plot-doctor`.
- If the events are fixed but the prose is weak, use `narrative-style-editor`.
- If the user needs a visual relationship map, use `arc-cartographer`.
- If a session produced several shared changes, use `narrative-session-recorder`.
- If the user wants release preparation, use `narrative-publishing-manager`.
- If the request creates one facet, route to that facet skill instead of `story-architect`.
- Add `continuity-keeper` only when the change affects existing shared facts or a major story decision.
- Add `narrative-session-recorder` after a session changes several facets, not after every single edit.
- Add `narrative-style-editor` only when prose, dialogue, rhythm, or sensory detail needs revision.
- Add `narrative-publishing-manager` only when the user requests review or publication preparation.

## Licensed-Setting Routing

When the request names a licensed setting or depends on external canon:

1. Use `canon-steward` when the request needs source facts.
2. Mark each fact as official, secondary, original, or unverified.
3. Keep source claims separate from project additions.
4. Store summaries and citations, not copied source text.
5. Preserve conflicts between canon layers until the project makes a decision.

## Scope Questions

Ask one focused question when the task lacks a required choice:

- What is the current seed: event, character, place, faction, story, source, or conflict?
- What is the current gap: creation, expansion, connection, review, or rewrite?
- Which canon layer applies?
- What is the intended story scope?
- Which repository files are the source of truth?
- Does the change affect shared continuity?

Do not ask the user to choose the whole workflow when the current gap identifies the primary skill.

Do not ask a question when the existing files provide the answer.

## Repository Anchors

Read these files before routing work that changes repository material:

- `CONTEXT.md`
- `AGENTS.md` or `CLAUDE.md`
- `README.md`
- `docs/agents/narrative-domain.md`, when it exists
- `docs/agents/narrative-workflow.md`, when it exists
- Relevant files in `characters/`, `stories/`, `timeline/`, and `world/`
- Relevant files in `docs/sources/`, `docs/canon/`, and `docs/adr/`, when they exist

Use the active alignment root for shared workflow and domain documents when the repository defines one.

## Output

Report the route before work starts:

```markdown
## Route

- **Current seed:** A character with an unresolved past.
- **Current gap:** The character needs a causal backstory.
- **Primary skill:** `character-designer`
- **Supporting skills:** `canon-steward`, when source facts matter.
- **Reason:** The request needs one character facet, not a complete story workflow.
- **Read first:** `CONTEXT.md`, related facets, and source records.
- **Change:** Create or update the character facet.
- **Next iteration:** Route the next missing dependency after the facet exists.
- **Open questions:** The character's canon layer is not fixed.
```

State the selected skill, the reason, supporting skills, repository anchors, possible file changes, and blocking questions.

## Routing Criteria

The route is complete only when:

- One primary skill is selected for the current gap.
- The seed and current gap are stated.
- Supporting skills are limited to direct dependencies.
- Iteration remains possible after the current change.
- Conditional review, recording, style, and publication work is not implied as mandatory.
- Canon handling is explicit when licensed material is involved.
- The repository source of truth is named.
- Required repository anchors are named.
- Blocking questions are listed.
- No specialist work is duplicated.
