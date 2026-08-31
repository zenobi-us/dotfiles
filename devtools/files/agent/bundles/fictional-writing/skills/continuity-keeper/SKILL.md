---
name: continuity-keeper
description: Find and report continuity conflicts across stories, facets, timelines, canon sources, and consequences, with evidence, severity, corrections, and unresolved decisions.
---

# Continuity Keeper

Review the shared story world as one connected record. Find conflicts before they become new canon.

A continuity review does not make facts agree by force. It identifies the conflict, preserves evidence, and routes the decision to the correct source or owner.

## When to Use

Use this skill when a story, facet, timeline, canon note, or ending changes shared facts.

Use it before marking a story complete, adding a major death or injury, changing faction relationships, changing technology limits, or publishing a linked story.

Use it after `story-architect`, `character-designer`, `world-builder`, `faction-designer`, or a manual edit changes shared material.

Use `canon-steward` when the conflict depends on official RED, 2077, or other licensed setting facts.

Do not use this skill to rewrite prose, choose a canon answer without evidence, or hide a conflict to make a story work.

## Repository Anchors

Read these files before you review:

- `CONTEXT.md` for premise, tone, scope, core truths, canon boundary, and domain terms.
- `docs/agents/narrative-domain.md` for facet types, metadata, IDs, paths, and status rules, when it exists.
- `docs/agents/narrative-workflow.md` for source-of-truth and update rules, when it exists.
- Existing `AGENTS.md`, `README.md`, and folder README files when either narrative document is absent.
- The target story or facet and every linked character, faction, place, technology, and timeline record.
- Relevant source records in `docs/sources/` and canon notes in `docs/canon/`, when these paths exist.
- Relevant decisions in `docs/adr/`, when this path exists.

Use the active alignment root for `CONTEXT.md`, `docs/adr/`, and `docs/agents/` when the repository defines one. Keep source records in the repository's existing paths.

## Review Contract

Every finding must contain:

| Field | Required content |
|---|---|
| Severity | `critical`, `high`, `medium`, or `low`. |
| Conflict | The two or more claims that cannot all be true. |
| Evidence | File paths, headings, dates, IDs, or quoted short text. |
| Impact | The story, facet, timeline, or canon result. |
| Correction | One or more ways to resolve the conflict. |
| Uncertainty | Missing facts or assumptions that affect the finding. |
| Decision owner | The source, project decision, or user choice that can resolve it. |
| Status | `open`, `resolved`, `accepted-conflict`, or `blocked`. |

Use `critical` for impossible chronology, duplicate identity, dead characters acting later, or a conflict that breaks a core truth.

Use `high` for faction, technology, canon, or causal conflicts that break a major story action.

Use `medium` for scope, relationship, motivation, or consequence conflicts that weaken the story but do not make it impossible.

Use `low` for unclear metadata, weak links, missing references, or details that need a decision but do not conflict yet.

## Source Rules

Treat the repository's explicit core truths and accepted ADRs as project constraints.

Treat dated timeline events as the chronology source unless an ADR defines another source.

Treat a character facet and linked story appearances as claims that need one consistent status at each point in time.

Treat faction relationships as directed and time-bound when the relationship changes.

Treat technology limits as constraints. An exception needs an upgrade, cost, source, or project decision.

Treat canon claims as unresolved when the source, canon layer, or reconciliation decision is missing.

Do not infer a correction from file order, filename order, or the newest edit alone.

Do not silently overwrite an official claim, original fact, accepted decision, or dated event.

## Review Model

Review these dimensions:

### Identity

Check that each character, faction, place, technology, story, and event has one clear identity.

Find duplicate names, aliases, IDs, and roles. Distinguish a renamed entity, a duplicate entity, a disguise, a recording, a flashback, and a new entity.

### Chronology

Build a dated sequence from the relevant events and story appearances.

Check births, introductions, injuries, recoveries, deaths, faction changes, technology changes, and story endings.

Mark an exact date, date range, relative order, or unknown date. Do not invent precision.

### Character state

Track each important character's status at every story point:

- Alive, dead, missing, imprisoned, or unknown.
- Present, absent, or referenced.
- Injured, recovered, replaced, or changed.
- Current goal and relationship state.

Treat flashbacks, recordings, dreams, simulations, clones, and unreliable accounts as explicit state explanations, not automatic fixes.

### Faction relationships

Check the direction, reason, scope, and date of each relationship.

Distinguish alliance, client status, dependency, rivalry, enmity, temporary partnership, internal split, and public opposition.

A faction can have a public relationship and a private relationship. Record both and state the condition that separates them.

### Technology and resources

Check that every important technology or resource obeys its stated function, access rule, cost, failure mode, and limit.

If an action exceeds a limit, find an established upgrade, exception, cost, or source. Otherwise report the conflict.

### Causality

Trace important outcomes backward:

```text
cause → action → result → new state
```

Make sure that every major result has a cause that exists before it. Make sure that every promised consequence appears in the relevant story or timeline.

### Canon and scope

Check the canon label, source record, locator, and project additions for each official claim.

Check that a local story does not claim a district, city, regional, or global result without evidence of that reach.

Check that original material does not silently replace official material.

### Links and metadata

Check that links point to existing files or named missing dependencies.

Check that frontmatter follows the repository's local fields. Preserve local fields such as `kind` instead of imposing `type`.

Check that canon labels follow the repository's vocabulary. Preserve labels such as `original-fan-work` when the repository defines them.

## Process

### 1. Set the review boundary

Identify the target files, story scope, relevant era, canon layers, and requested decision.

Review only the connected material that can affect the target. List excluded material when the scope is large.

### 2. Read anchors and collect claims

Read the repository anchors and target material.

Collect claims about identity, dates, states, relationships, capabilities, causes, outcomes, canon, and metadata.

Record each claim with its file path and heading before comparing claims.

### 3. Build the state map

Create a compact map of:

- Entities and aliases.
- Story appearances.
- Dated events and relative order.
- Character states.
- Faction relationships.
- Technology limits and exceptions.
- Promised and delivered consequences.
- Canon sources and project decisions.

### 4. Compare claims

Compare claims across files and across time.

Test whether two claims can both be true because of date, scope, identity, viewpoint, public versus private knowledge, or an explicit exception.

If they cannot both be true, create a finding. Do not select a correction during detection.

### 5. Classify findings

Assign severity, evidence, impact, uncertainty, decision owner, and status to every finding.

Separate a direct contradiction from a missing fact. A missing fact is a `low` or `blocked` finding until it causes a contradiction.

Group duplicate findings that have one root cause. Keep separate findings when they need different decisions.

### 6. Propose corrections

Give the smallest correction that restores continuity.

Offer alternatives when each alternative changes story meaning. State the consequence of each alternative.

Route decisions to the correct owner:

- `CONTEXT.md` for project truths and scope.
- `docs/adr/` for hard-to-reverse project decisions.
- `canon-steward` for source and canon conflicts.
- `character-designer` for character identity, belief, backstory, voice, or personal-arc conflicts.
- The owning facet for a local fact.
- The user when the correction changes plot, character fate, or intended ending.

Do not edit a source of truth unless the user requests the correction or the repository workflow grants permission.

### 7. Record approved changes

If the correction is approved, update the owning source of truth first.

Update linked stories, facets, and timeline records that repeat the changed fact.

Preserve the old claim in an ADR, reconciliation note, or continuity record when its history matters.

If the correction is not approved, keep the finding open. Do not mark it resolved because a possible fix exists.

### 8. Report the review

Report:

- Review boundary.
- Files and facets read.
- Findings grouped by severity.
- Evidence for each finding.
- Corrections and their consequences.
- Accepted conflicts.
- Missing facts and blocked decisions.
- Files changed, if any.
- Follow-up work for other skills.

## Review Output

Use this format for each finding:

```markdown
### [high] Character acts after death

- **Conflict:** `characters/ava.md` records death before `stories/return.md` shows Ava acting.
- **Evidence:** `characters/ava.md#status`; `stories/return.md#scene-4`.
- **Impact:** The story has impossible chronology.
- **Correction:** Remove the later appearance, move the death, or label the appearance as a recording or flashback.
- **Uncertainty:** The scene type and death date are not fixed.
- **Decision owner:** Story owner; timeline is authoritative for dated events.
- **Status:** `open`
```

End with one of these review results:

- `PASS` — no open critical or high findings, and all checked claims have evidence or explicit uncertainty.
- `PASS WITH OPEN QUESTIONS` — no continuity conflict remains, but low findings or decisions remain.
- `FAIL` — one or more critical or high findings remain open.
- `BLOCKED` — the review cannot continue because required source material or repository anchors are missing.

## Common Mistakes

| Mistake | Correct action |
|---|---|
| Fix a contradiction silently | Report it and preserve the source claims. |
| Trust the newest file automatically | Use the repository's source-of-truth rule. |
| Treat file order as chronology | Use dated events and explicit relative order. |
| Call every missing fact a contradiction | Separate missing facts from incompatible claims. |
| Ignore flashbacks or recordings | Test whether the story explicitly identifies the appearance type. |
| Treat faction relationships as permanent | Record direction, date, reason, and condition. |
| Allow technology to solve a problem without cost | Check its stated limit, access, failure mode, and exception. |
| Accept a local victory as a regional result | Require evidence for the wider consequence. |
| Choose a canon answer from memory | Route the claim to `canon-steward`. |
| Use vague evidence | Name the file, heading, date, ID, or short quote. |
| Mark a possible correction as resolved | Keep it `open` until the owner approves it. |
| Edit every linked file during review | Update the owning source first, then list propagation work. |
| Report only errors | Report passes, accepted conflicts, assumptions, and open questions. |

## Completion Criteria

The continuity review is complete only when:

- The review boundary and relevant canon layers are stated.
- Repository anchors and connected source material were read.
- Claims were collected with file paths and headings.
- Identity, chronology, character state, faction relationships, technology, causality, canon, scope, links, and metadata were checked.
- Every finding has severity, conflict, evidence, impact, correction, uncertainty, decision owner, and status.
- Critical and high findings are resolved, accepted explicitly, or reported as `FAIL`.
- Missing information is separate from direct contradiction.
- No source of truth was changed without permission.
- Approved changes update the owner before dependent files.
- The final result uses `PASS`, `PASS WITH OPEN QUESTIONS`, `FAIL`, or `BLOCKED`.
- The report lists files read, files changed, open decisions, and follow-up work.

## State Machine

```text
[Changed story, facet, timeline, or canon]
                 |
                 v
[Set review boundary]
                 |
                 v
[Read anchors and connected material]
                 |
                 v
[Collect claims with evidence]
                 |
                 v
[Build state map]
                 |
                 v
[Compare identity, chronology, states,
 factions, technology, causality, canon]
                 |
          +------+------+
          |             |
          v             v
 [Claims agree]   [Conflict found]
          |             |
          |             v
          |      [Classify severity]
          |             |
          |             v
          |      [Propose smallest correction]
          |             |
          |       +-----+------+
          |       |            |
          |       v            v
          | [Owner approves] [Owner does not approve]
          |       |            |
          |       v            v
          | [Update source] [Keep finding open]
          |       |            |
          +-------+------------+
                  |
                  v
[Report PASS, PASS WITH OPEN QUESTIONS,
 FAIL, or BLOCKED]
```
