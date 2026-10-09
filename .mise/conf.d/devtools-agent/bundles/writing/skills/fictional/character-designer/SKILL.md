---
name: character-designer
description: Create story-ready character facets with causal backstory, beliefs, goals, fears, relationships, secrets, voice, and personal arcs, producing reusable and continuity-safe character records.
---

# Character Designer

Design characters as causes in motion. A character's past must affect how the character understands the present, reacts under pressure, and makes choices.

A character record is not a biography. It is a usable model of identity, pressure, behavior, relationships, and change.

## When to Use

Use this skill when a character needs identity, a causal backstory, beliefs, a present goal, a personal arc, relationships, secrets, or a distinct voice.

Use it before `story-architect` when a protagonist or major character lacks a clear internal engine.

Use `world-builder` when the backstory needs a missing place, institution, technology, social condition, or historical event.

Use `faction-designer` when a faction relationship needs independent design.

Use `canon-steward` first when the character uses official setting facts, named canon history, or licensed background material.

Use `continuity-keeper` after a major character change affects existing stories, facets, or timeline events.

Do not use this skill to write finished prose, create a complete setting, or invent a detailed biography that does not affect story choices.

## References

Read `references/causal-backstory.md` for formative events, beliefs, coping behavior, and personal arcs.

Read `references/dialogue-as-action.md` for agenda, confrontation, voice, and speech behavior.

## Repository Anchors

Read these files before you write:

- `CONTEXT.md` for premise, tone, scope, core truths, canon boundary, and domain terms.
- `docs/agents/narrative-domain.md` for facet types, metadata, IDs, and paths, when it exists.
- `docs/agents/narrative-workflow.md` for source-of-truth and update rules, when it exists.
- Existing `AGENTS.md`, `README.md`, and folder README files when either narrative document is absent.
- Related facets in `characters/`, `stories/`, `world/`, and `timeline/`.
- Relevant source records in `docs/sources/` and canon notes in `docs/canon/`, when they exist.
- Relevant decisions in `docs/adr/`, when they exist.

Use the active alignment root for shared workflow and domain documents when the repository defines one. Keep character files in the repository source tree, normally under `characters/`.

## Character Contract

A usable character answers these questions:

| Question | Required answer |
|---|---|
| Who is this person? | Identity, role, aliases, and current situation. |
| What formed them? | A formative event with a date or bounded position. |
| What did they learn? | A belief or false belief linked to the event. |
| What do they want now? | A concrete present goal. |
| What do they need? | A truth, change, or acceptance required for a meaningful arc. |
| What do they fear? | A concrete loss or condition with behavioral effects. |
| What gives them agency? | Skills, relationships, resources, status, or secrets. |
| What limits them? | A weakness, cost, obligation, rule, or dependency. |
| Who pressures them? | People, factions, places, systems, or memories. |
| What do they hide? | Secrets, holders, risks, and disclosure conditions. |
| How do they sound? | Dialogue agenda, rhythm, vocabulary, and behavior. |
| What can change? | A personal arc that confirms, breaks, or complicates the belief. |

Do not fill a field with a vague trait. Replace `brave` with the action the character takes when afraid. Replace `loyal` with the person, promise, or cost that controls the character's choice.

## Causal Backstory

Use this chain:

```text
formative event
      ↓
meaning assigned to the event
      ↓
belief or false belief
      ↓
coping behavior
      ↓
present want
      ↓
inciting pressure
      ↓
choice under pressure
      ↓
change, failure, or confirmation
```

The formative event does not need to be dramatic. It needs to explain a present pattern.

State what happened, what the character concluded, and what the conclusion causes now.

Separate the event from the character's interpretation. The interpretation can be wrong, incomplete, or contested.

Give the character a reason to act now. A backstory that never affects a present choice is background, not a character engine.

## Character Knowledge

Separate knowledge levels:

- **Character truth:** What actually happened in the project canon.
- **Character belief:** What the character thinks happened.
- **Reader knowledge:** What the audience knows.
- **Other knowledge:** What each important person or faction knows.
- **Hidden author note:** Information not yet assigned to a viewpoint.

Do not reveal a secret only because the character record contains it. Route disclosure through a scene, action, discovery, confession, lie, or consequence.

## Personal Arc

Choose one arc type:

- **Change:** The character rejects or replaces a false belief.
- **Confirmation:** Pressure proves the belief correct, at a cost.
- **Complication:** The belief remains partly true but no longer gives a complete answer.
- **Collapse:** The coping behavior fails, and the character cannot replace it in time.
- **Revelation:** The character learns a hidden fact but must still choose what it means.

State the starting belief, pressure that tests it, choice that reveals the result, and ending state.

Do not force redemption. A character can become worse, remain unchanged, or choose a costly form of stability.

## Pressure Design

Give every major character at least one active pressure from each relevant layer:

- Internal: fear, shame, desire, grief, pride, or denial.
- Interpersonal: trust, love, rivalry, betrayal, or obligation.
- Material: money, housing, health, safety, work, or access.
- Factional: debt, loyalty, leverage, orders, protection, or exposure.
- Social: class, reputation, law, community, or exclusion.

Connect each pressure to a choice and a cost. Do not add pressure as a decorative list.

For faction debt, record:

- Creditor.
- Original obligation.
- Current balance or condition.
- Leverage held by each side.
- What counts as repayment.
- Consequence of refusal.
- Condition that can end or transfer the debt.

## Relationships

Design relationships as changing systems, not static labels.

For each important relationship, record:

- What each person wants.
- What each person believes about the other.
- What they share.
- What one owes the other.
- What can break the relationship.
- What can repair it.
- The current public and private state.

Create a separate character facet only when the other person has an independent goal, relationship network, or story role. Otherwise use a named relationship entry.

## Voice and Dialogue

Define how the character tries to affect other people. Dialogue is action, not information transfer.

Record:

- Usual dialogue agenda.
- Directness and confidence.
- Sentence rhythm.
- Vocabulary or language tic.
- Topics avoided.
- Behavior during speech.
- How speech changes under fear, anger, shame, or authority.
- How the character speaks to allies, strangers, family, and enemies.

Give one short example only when it clarifies the rule. Do not imitate a living or copyrighted author.

Make dialogue behavior conflict with indirect thought when that reveals character pressure. Do not give every character the same rhythm or vocabulary.

## Facet Storage

Store one Markdown file per reusable character in `characters/`, unless `docs/agents/narrative-domain.md` defines another path.

Use the repository's existing frontmatter fields. Do not replace local fields with example fields.

If the repository defines no character metadata, use this minimum:

```yaml
---
id: character.mara-vale
kind: character
name: Mara Vale
status: draft
canon: original
---
```

Search names, aliases, IDs, and links before creating a file. Update an existing character instead of creating a duplicate.

Link the character to every related story, faction, place, technology, and timeline event.

## Character Record

Use this structure when the repository has no local template:

```markdown
## Identity

- Role:
- Aliases:
- Current situation:
- Public reputation:

## Character engine

- Want:
- Need:
- Fear:
- Risk:
- Leverage:
- Limit:
- Red line:
- Coping behavior:

## Backstory

### Formative event

- Date or position:
- Event:
- Character's interpretation:
- Actual or contested truth:
- Present effect:

### Belief

- Starting belief:
- Evidence that supports it:
- Evidence that challenges it:

## Pressures

- Internal:
- Interpersonal:
- Material:
- Factional:
- Social:

## Relationships

- Person or faction:
- Shared history:
- Current public state:
- Current private state:
- Pressure point:

## Secrets

- Secret:
- Who knows:
- Risk if exposed:
- Disclosure condition:

## Voice and behavior

- Dialogue agenda:
- Rhythm:
- Vocabulary:
- Avoided topics:
- Stress behavior:

## Personal arc

- Arc type:
- Starting state:
- Pressure test:
- Decisive choice:
- Ending state:

## Story links

- First appearance:
- Related stories:
- Related factions:
- Related places:
- Related events:

## Open questions

-
```

## Process

### 1. Set the character boundary

Identify the character's story role, intended reuse, era, canon layer, and current story need.

Choose whether the request needs a full character facet, a short story-specific character note, or an update to an existing facet.

Do not create a reusable facet for a background extra with no independent role.

### 2. Read anchors and related facets

Read the repository anchors and search existing names, aliases, roles, factions, places, stories, and timeline events.

Reuse existing facets. List missing dependencies before creating them.

### 3. Build the causal spine

Write the formative event, interpretation, belief, coping behavior, present want, deeper need, fear, and limit.

Test the spine:

```text
If the formative event changes, does the present reaction change?
If the belief changes, does the present choice change?
If the fear is removed, does the character lose pressure?
```

If all answers are no, the backstory is not connected to the character engine.

### 4. Build pressures and relationships

Add the smallest set of internal, interpersonal, material, factional, and social pressures that create choices.

Add relationship entries with shared history, competing wants, knowledge, and pressure points.

Hand off missing places, institutions, or history to `world-builder`. Hand off independent faction design to `faction-designer`.

### 5. Design knowledge and secrets

List what the character knows, believes, hides, and misunderstands.

For each secret, state who knows it, what exposure costs, and what event can reveal it.

Keep reader knowledge separate from character knowledge.

### 6. Design voice and behavior

Write dialogue rules and stress behavior that distinguish the character from other characters.

Define how the character speaks to different people. Connect speech changes to status, confidence, fear, and agenda.

### 7. Design the personal arc

Choose an arc type. State the starting belief, pressure test, decisive choice, and ending state.

Give the character a choice that creates a cost. Do not make the arc a result of explanation alone.

### 8. Create or update the facet

Write the character file with stable metadata and links.

Add timeline events for formative events only when their date or sequence matters to shared continuity.

Keep sourced facts, project interpretation, and original additions separate.

### 9. Check the character

Make sure that:

- Identity is clear and not duplicated.
- The formative event causes a present belief or behavior.
- The belief affects the present want and choices.
- Fear has visible behavioral effects.
- The character has agency and a limit.
- Faction debts have terms, leverage, and consequences.
- Secrets have knowledge holders, risks, and disclosure conditions.
- Relationships contain competing wants or pressure.
- Voice rules distinguish the character without using stereotypes.
- The personal arc has a pressure test and decisive choice.
- Canon labels and source records are present when needed.
- Links point to existing facets or named dependencies.
- The character does not contradict `CONTEXT.md` or relevant ADRs.

### 10. Report the result

Report:

- Character boundary and story need.
- Character facet created or updated.
- Causal spine.
- Active pressures.
- Relationships and faction debts.
- Secrets and knowledge levels.
- Voice rules.
- Personal arc.
- Timeline and continuity effects.
- Sources used.
- Missing dependencies and open questions.

## Common Mistakes

| Mistake | Correct action |
|---|---|
| Write a biography with no story use | Connect each backstory fact to a present reaction, choice, or cost. |
| Give the character a tragic past only for sympathy | Show the belief and behavior that the event creates. |
| Treat the character's interpretation as fact | Separate event, belief, and actual or contested truth. |
| Give the character only a want | Add a need, fear, limit, and choice under pressure. |
| Use fear as a label | Show what the character avoids, controls, attacks, or sacrifices. |
| Add a faction debt without terms | State the creditor, leverage, repayment, and consequence. |
| List secrets without disclosure rules | Record who knows, what exposure costs, and what reveals it. |
| Make every character speak alike | Give each character distinct agenda, rhythm, vocabulary, and stress behavior. |
| Explain voice instead of showing pressure | Tie speech changes to the person in the room and the character's goal. |
| Force a redemptive arc | Permit change, confirmation, complication, collapse, or no change. |
| Reveal all backstory at once | Reveal it through action, reaction, discovery, confession, or consequence. |
| Create a facet for every extra | Use a short story note until the character has an independent role. |
| Copy source background text | Run `canon-steward` and store a paraphrased, cited claim. |
| Change a character's fate silently | Run `continuity-keeper` and route the decision to the story owner. |

## Completion Criteria

The character design is complete only when:

- The character boundary and story need are stated.
- Repository anchors and related facets were read.
- Identity and role are clear.
- A formative event connects to a belief, behavior, or present reaction.
- The character has a want, need, fear, risk, leverage, and limit.
- Active pressures create meaningful choices.
- Important relationships have shared history and pressure points.
- Secrets have holders, risks, and disclosure conditions.
- Voice and stress behavior are distinct and usable.
- The personal arc has a starting state, pressure test, decisive choice, and ending state.
- Metadata, canon labels, sources, and links follow repository rules.
- Timeline and continuity effects are recorded.
- Dependencies, assumptions, and open questions are visible.
- The report lists all files created or updated.

## State Machine

```text
[Character request]
        |
        v
[Set character boundary]
        |
        v
[Read anchors and related facets]
        |
        v
[Formative event]
        |
        v
[Interpretation and belief]
        |
        v
[Coping behavior and present want]
        |
        v
[Need, fear, leverage, and limit]
        |
        v
[Pressures and relationships]
        |
        v
[Secrets and knowledge levels]
        |
        v
[Voice and stress behavior]
        |
        v
[Personal arc and decisive choice]
        |
        v
[Create or update character facet]
        |
        v
[Check canon, links, and continuity]
        |
        v
[Report character and dependencies]
```
