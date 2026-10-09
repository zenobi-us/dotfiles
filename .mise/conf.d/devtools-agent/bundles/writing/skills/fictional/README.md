# Fictional Writing Skills

This directory contains reusable skills for planning, building, reviewing, and maintaining fictional worlds and stories.

The skills work through slash commands. They store project facts in local Markdown files.

Use the skills in any order. Start with the current creative need, not a fixed workflow.

## Quick start

If you do not know which skill to use, run:

```text
/skill:ask-narrative
```

Give the command the current seed and the current problem:

```text
I have a rough event idea for a Cyberpunk RED offshoot story.
I do not know whether to develop the event, the setting, or a character first.
Route me to the smallest useful skill.
```

The router selects one primary skill. It adds supporting skills only when the current change needs them.

## Skill commands

| Command | Use it for |
|---|---|
| `/skill:narrative-repo-setup` | Create or repair the local narrative structure. |
| `/skill:ask-narrative` | Select the smallest useful skill for the current need. |
| `/skill:canon-steward` | Record official facts, sources, canon layers, and conflicts. |
| `/skill:character-designer` | Create or update a character and the character's causal backstory. |
| `/skill:world-builder` | Create or update places, history, technology, institutions, and social pressure. |
| `/skill:faction-designer` | Create or update factions, power structures, relationships, and internal conflict. |
| `/skill:story-architect` | Build story premises, arcs, episodes, scenes, choices, and consequences. |
| `/skill:continuity-keeper` | Find conflicts across characters, stories, facets, timelines, and canon. |
| `/skill:plot-doctor` | Find weak premises, stakes, escalation, causality, and endings. |
| `/skill:narrative-style-editor` | Revise tone, voice, pacing, dialogue, sensory detail, and clarity. |
| `/skill:arc-cartographer` | Create maps of arcs, timelines, factions, characters, and dependencies. |
| `/skill:narrative-session-recorder` | Convert a planning or writing session into structured updates. |
| `/skill:narrative-publishing-manager` | Prepare stories for review or publication. |

Some installations provide shorter aliases. Use `/skill:name` when no alias exists.

---

# Tutorials

Tutorials teach a complete task from start to finish.

## Run repository setup

Run this command when the repository lacks the required narrative files:

```text
/skill:narrative-repo-setup
```

The skill creates or repairs the local structure. It does not create story content.

The structure normally includes:

```text
CONTEXT.md
docs/agents/narrative-domain.md
docs/agents/narrative-workflow.md
docs/sources/
docs/canon/
docs/adr/
characters/
stories/
timeline/
world/
```

Read the result before you create content:

```text
/skill:ask-narrative
```

Ask the router for the smallest next step:

```text
The repository is ready. I have no story yet.
I want to start with a rough world and event idea.
What is the smallest useful next skill?
```

### Expected result

- The repository has its local context files.
- The storage paths are known.
- The domain terms and metadata rules are known.
- The next narrative skill is selected.

## Brainstorm a world and event

Start with the router when the first idea is incomplete:

```text
/skill:ask-narrative
```

Use this prompt:

```text
I have a rough world idea and one event.
I want to explore them without locking the order of development.
Identify the current gap and select one primary skill.
```

The router can select one of these commands.

### Develop the setting

```text
/skill:world-builder
```

Use it when the idea needs a place, historical condition, technology, institution, or social pressure.

Give it a narrow request:

```text
Build one bounded district around this event.
Give it a controlling power, dependent people, active pressure,
and two choices that characters can make there.
Do not build the whole city.
```

### Develop the event into a story problem

```text
/skill:story-architect
```

Use it when the event needs a protagonist, opposition, stakes, choices, or consequences.

```text
Turn this event into a short-story problem.
Keep the setting provisional.
Show what changes, who acts, what blocks them, and what failure costs.
```

### Add a character

```text
/skill:character-designer
```

Use it when the event affects a person who needs a deeper motive or history.

```text
Create a character who is directly affected by this event.
Give them a formative event, a false belief, a present want,
a fear, a faction debt, and a difficult choice.
```

### Grill the character

Use the repository-aware grilling flow:

```text
/grill-with-docs
```

Ask it to challenge the character's assumptions:

```text
Grill this character.
Focus on formative events, false beliefs, fears, debts, secrets,
relationships, voice, and the choices they avoid.
Record decisions and open questions.
```

### Incorporate the character into the world

Return to the setting skill:

```text
/skill:world-builder
```

Use the character's answers as setting pressure:

```text
Update the world using the character's backstory.
Add only places, history, institutions, technology, or social conditions
that affect the character's present choices.
Link the changes to the character facet.
```

Run a review when the changes affect existing material:

```text
/skill:continuity-keeper
```

### Expected result

You have a connected set of rough facets:

```text
event ↔ character ↔ place ↔ faction
```

The facets can remain drafts. You do not need to create a complete story at this stage.

## Design a team and adjacent factions

Create each important character separately:

```text
/skill:character-designer
```

Use one command per character when the characters have different histories or pressures.

```text
Create the team's medic.
Create the team's fixer.
Create the team's former corporate security specialist.
```

Ask each character skill run to define:

- Present want.
- Deeper need.
- Fear.
- Limit.
- Leverage.
- Formative event.
- Belief or false belief.
- Relationship pressure.
- Secrets and knowledge holders.
- Personal arc.

Create factions that sit beside the team:

```text
/skill:faction-designer
```

Use this prompt:

```text
Create two adjacent factions for this team.
Each faction must want something from the team.
Give each faction a public agenda, private agenda, resource,
limitation, internal conflict, and consequence if the team refuses.
Do not make either faction a generic villain.
```

Create character contacts only when they have an independent role:

```text
/skill:character-designer
```

Use it for a faction leader, contact, rival, or member who needs a separate goal and relationship network.

Connect the team and factions into a story:

```text
/skill:story-architect
```

```text
Build a short arc for this team and these factions.
Give each team member a competing goal.
Make the faction pressure force a choice that the team cannot satisfy fully.
Record the immediate and lasting consequences.
```

Review the connected material:

```text
/skill:continuity-keeper
```

Record the completed planning session when it changed several files:

```text
/skill:narrative-session-recorder
```

### Expected result

- Each reusable character has one source file.
- Each independent faction has one source file.
- The story links to the team and factions.
- Relationships have direction, reason, and pressure.
- Continuity records the effects of the team's choices.

---

# How-to guides

Use these guides to solve one specific problem.

## Route a rough idea

Run:

```text
/skill:ask-narrative
```

State the seed and the current gap.

Examples:

```text
The seed is a mass memory theft.
The current gap is the affected neighborhood.
```

```text
The seed is a former trauma surgeon.
The current gap is her false belief and present goal.
```

```text
The seed is a workers' mutual-aid network.
The current gap is its internal conflict.
```

The router must select one primary skill. It must not force every skill to run.

## Create a character facet

Run:

```text
/skill:character-designer
```

Ask for a reusable character only when the character has an independent role or appears in more than one story.

The character's backstory must connect to present behavior:

```text
formative event
→ interpretation
→ belief
→ coping behavior
→ present want
→ pressure
→ choice
→ change or failure
```

Use the character references when needed:

```text
character-designer/references/causal-backstory.md
character-designer/references/dialogue-as-action.md
```

Use `world-builder` when the character needs a missing place, institution, technology, or historical event.

Use `faction-designer` when the character has a faction debt or relationship with an independent group.

Use `story-architect` when the character is ready to drive a story arc.

Use `continuity-keeper` when the character changes an existing fact.

## Add a formative event

Run:

```text
/skill:character-designer
```

State whether the event is:

- Official source material.
- A project interpretation.
- Original project material.
- Unverified.

Record the date or sequence only when the project knows it. Use a bounded range or an unknown date when precision is not known.

Add the event to `timeline/` when it affects other characters, factions, stories, or history.

## Build a world around a character

Run:

```text
/skill:world-builder
```

Give the character facet as an input. Ask the skill to add only material that affects the character's choices.

Use the reference:

```text
world-builder/references/showing-lore-through-pressure.md
```

Show setting information through:

- A rule.
- A transaction.
- An obstacle.
- A social cost.
- A relationship.
- A choice.
- A consequence.

Do not add lore only because it sounds interesting.

## Create adjacent factions

Run:

```text
/skill:faction-designer
```

Use a character, place, event, or story as the faction's connection point.

Define:

- Public goal.
- Private goal.
- Controlled resource.
- Dependency.
- Method.
- Limitation.
- Vulnerability.
- Internal interests.
- Relationship with the character or team.
- Consequence of cooperation or refusal.

Use the reference:

```text
faction-designer/references/social-status-and-agenda.md
```

Create a character facet for a faction member only when that member has independent story agency.

## Use official Cyberpunk material

Run:

```text
/skill:canon-steward
```

Use it before you add official facts to a character, faction, place, event, or story.

Record:

- Source title.
- Publisher.
- URL or filename.
- Access date.
- Page, section, or URL locator.
- Short paraphrased claim.
- Canon layer.
- Affected facet.
- Uncertainty.

Use the reference:

```text
canon-steward/references/source-use-for-character-and-lore.md
```

Do not store a copied plain-text version of an official book, webpage, adventure, or background story.

## Repair a weak story arc

Run:

```text
/skill:plot-doctor
```

Use it when the story has material but lacks pressure, causality, or a useful ending.

If the problem is dramatic tension, also read:

```text
story-architect/references/dramatic-tension.md
```

Return to:

```text
/skill:story-architect
```

Use it to rebuild the smallest broken part of the arc.

## Track secrets and reveals

Run:

```text
/skill:continuity-keeper
```

Read:

```text
continuity-keeper/references/promise-and-reveal-tracking.md
```

Track:

- What the character knows.
- What the character believes.
- What the reader knows.
- What other people know.
- What each person suspects.
- What event can reveal the secret.
- What changes after the reveal.

## Record a planning session

Run:

```text
/skill:narrative-session-recorder
```

Use it after a session changes several shared facts.

Ask it to record:

- Story changes.
- Character changes.
- Faction changes.
- Place changes.
- Timeline events.
- New links.
- Open questions.
- Canon decisions.

Then run:

```text
/skill:continuity-keeper
```

Use this review when the session changed shared continuity.

## Revise prose after planning

Run:

```text
/skill:narrative-style-editor
```

Use it after the story structure and character choices work.

Read:

```text
narrative-style-editor/references/rhythm-and-revision.md
```

Do not use prose editing to hide a weak premise, weak character engine, or broken continuity.

## Map connected material

Run:

```text
/skill:arc-cartographer
```

Use it when the repository has enough linked facets to show relationships.

Ask for one map type:

```text
Create a Mermaid map of the team, adjacent factions, shared locations,
and the timeline events that connect them.
```

Return to the owning skill when the map shows a missing or weak relationship.

---

# Reference

This section defines the command contract and the local storage contract.

## Command contract

Every narrative command receives:

- The user's current request.
- The current seed.
- The current gap.
- The intended canon layer.
- The intended scope.
- The relevant repository files.

Each command reports:

- The work boundary.
- Files read.
- Files created or updated.
- New links.
- Canon sources used.
- Open questions.
- Missing dependencies.
- The likely next skill.

The command must not expand the scope without naming the dependency that requires expansion.

## Iterative routing contract

Use this loop:

```text
seed
  ↓
current gap
  ↓
one primary skill
  ↓
linked facet update
  ↓
conditional review or recording
  ↺
next gap
```

A seed can be:

- Event.
- Character.
- Place.
- Faction.
- Technology.
- Story.
- Source.
- Continuity conflict.

Choose the primary skill from the current gap:

| Current gap | Primary command |
|---|---|
| Repository structure | `/skill:narrative-repo-setup` |
| Skill choice is unclear | `/skill:ask-narrative` |
| Licensed fact or source conflict | `/skill:canon-steward` |
| Character identity or causal backstory | `/skill:character-designer` |
| Place, history, technology, or social condition | `/skill:world-builder` |
| Independent group goals and resources | `/skill:faction-designer` |
| Premise, arc, choices, or consequences | `/skill:story-architect` |
| Existing facts conflict | `/skill:continuity-keeper` |
| Story structure is weak | `/skill:plot-doctor` |
| Prose or dialogue is weak | `/skill:narrative-style-editor` |
| Relationships need a visual map | `/skill:arc-cartographer` |
| Several session changes need recording | `/skill:narrative-session-recorder` |
| Story is ready for release review | `/skill:narrative-publishing-manager` |

Do not run the complete table for every request.

## Common next skills

| After this command | Use this command when |
|---|---|
| `/skill:narrative-repo-setup` | The repository needs routing and storage anchors. |
| `/skill:canon-steward` | The next creation step uses the sourced claims. |
| `/skill:character-designer` | A setting or faction creates a character need. |
| `/skill:world-builder` | A character or story needs setting support. |
| `/skill:faction-designer` | A place or character needs an independent group. |
| `/skill:story-architect` | Enough facets exist to create choices and consequences. |
| `/skill:continuity-keeper` | Shared facts changed or a major decision is complete. |
| `/skill:plot-doctor` | The story plan exists but does not create enough pressure. |
| `/skill:narrative-style-editor` | Structure works and prose needs revision. |
| `/skill:arc-cartographer` | Linked facets need a relationship map. |
| `/skill:narrative-session-recorder` | One session changed several facets. |
| `/skill:narrative-publishing-manager` | The user requests review or publication preparation. |

These are routing suggestions. The current gap takes priority.

## Reference routing

Use focused references when a skill needs a narrow method:

| Problem | Reference |
|---|---|
| Flat character or weak backstory | `character-designer/references/causal-backstory.md` |
| Characters sound alike | `character-designer/references/dialogue-as-action.md` |
| Flat or predictable arc | `story-architect/references/dramatic-tension.md` |
| Lore dump or unused setting detail | `world-builder/references/showing-lore-through-pressure.md` |
| Weak faction agenda or social pressure | `faction-designer/references/social-status-and-agenda.md` |
| Unearned reveal or unclear secret | `continuity-keeper/references/promise-and-reveal-tracking.md` |
| Licensed character or setting fact | `canon-steward/references/source-use-for-character-and-lore.md` |
| Flat prose or dialogue rhythm | `narrative-style-editor/references/rhythm-and-revision.md` |

## Local context storage contract

The repository is the source of truth for shared narrative material.

### `CONTEXT.md`

Store project-wide context:

- Premise.
- Tone.
- Time and place.
- Scope.
- Core truths.
- Open questions.
- Canon boundary.
- Approved domain terms.

Do not store one character's private backstory in `CONTEXT.md`.

### `docs/agents/narrative-domain.md`

Store the domain contract:

- Facet types.
- Metadata fields.
- Stable ID format.
- Storage paths.
- Link format.
- Canon labels.
- Status values.

When this file exists, all narrative skills must follow it.

### `docs/agents/narrative-workflow.md`

Store the workflow contract:

- Source-of-truth rules.
- Update order.
- Handoff rules.
- Review points.
- Recording rules.
- Publication rules.

### `characters/`

Store one Markdown file per reusable character.

A character file owns:

- Identity.
- Causal backstory.
- Beliefs.
- Present want and need.
- Fears, risks, leverage, and limits.
- Relationships.
- Secrets and knowledge levels.
- Voice and behavior.
- Personal arc.

### `stories/`

Store story plans, drafts, scenes, and finished stories.

A story file owns story-specific:

- Premise.
- Characters in this story.
- Scene events.
- Choices.
- Stakes.
- Ending.
- Immediate consequences.

A story file does not silently replace a character, faction, or world facet.

### `world/`

Store reusable setting facets:

```text
world/places/
world/factions/
world/technology/
world/history/
world/terms/
```

Use the paths defined by `narrative-domain.md` when they differ.

### `timeline/`

Store dated or ordered events that affect shared continuity.

Use an exact date only when the project knows it. Use a bounded range or explicit unknown date when needed.

### `docs/sources/`

Store source records for external material:

- Source identity.
- Publisher.
- URL or filename.
- Access date.
- Locator.
- Paraphrased claims.
- Affected facets.

Do not store substantial copied source text.

### `docs/canon/`

Store reconciliation notes when canon layers or sources conflict.

Keep both claims and their evidence visible until the project makes a decision.

### `docs/adr/`

Store hard-to-reverse project decisions.

Do not create an ADR for every small creative choice.

## Ownership rules

- `CONTEXT.md` owns project-wide truths and scope.
- A character facet owns reusable character facts.
- A faction facet owns reusable faction facts.
- A place or world facet owns reusable setting facts.
- A story file owns story-specific events and choices.
- A timeline file owns dated shared events.
- A source record owns source evidence.
- An ADR owns hard-to-reverse project decisions.

Update the owner first. Then update dependent files.

## Status rules

Use the repository's existing status values. If no local rule exists, use:

```text
idea
draft
revision
complete
archive
```

Use `idea` for exploratory material. Use `draft` when other work can depend on it. Use `complete` only when the facet has passed the required review.

## Canon rules

Use the repository's canon labels. If no local labels exist, use:

- `official-red`
- `official-2077`
- `official-other`
- `secondary`
- `original`
- `unverified`

Keep official claims, project interpretations, and original additions separate.

## Link rules

Link every story to the characters, factions, places, technologies, and timeline events that it uses.

Link every reusable facet to the stories and facets that depend on it.

Use stable IDs when the domain contract defines them. Search IDs, names, aliases, and links before creating a new facet.

## Review rules

Run `/skill:continuity-keeper` when:

- A character dies, returns, or changes identity.
- A formative event changes chronology.
- A faction changes its relationships or control.
- A technology gains or loses a limit.
- A story changes a shared place or event.
- A canon conflict affects a story decision.
- A major ending changes future stories.

Do not use continuity review to force every idea into agreement. Report conflicts and route decisions to the owning source or the user.

---

# Explanation

This section explains why the skills work as a system.

## Why the workflow is iterative

Fictional work does not always begin with a story arc.

A useful project can begin with:

- One event.
- One character.
- One place.
- One faction.
- One technology.
- One unresolved question.

Each skill develops the current gap. The result becomes a new seed for the next iteration.

The workflow therefore supports these paths:

```text
event → character → faction → place → story
```

```text
character → formative event → world pressure → faction → story
```

```text
place → social problem → factions → characters → story
```

No path is mandatory.

## Why each skill has one owner

One owner prevents conflicting edits.

For example:

- `character-designer` owns the character's reusable backstory.
- `story-architect` owns the character's choices in one story.
- `continuity-keeper` reports conflicts between those records.

This separation lets the project grow without turning every file into a copy of every other file.

## Why backstory uses causal links

A backstory matters when it changes the present.

The useful question is not:

```text
What happened to this character?
```

The useful questions are:

```text
What did the character believe after it happened?
How does that belief affect the present goal?
What choice tests that belief?
```

This method turns history into story pressure.

## Why the router selects one primary skill

Running every skill for every idea creates noise.

One primary skill keeps the next action clear. Supporting skills enter only when the current change needs them.

For example:

```text
rough character
→ character-designer
→ world-builder, if the past needs a setting facet
→ continuity-keeper, if existing facts change
```

The router does not prevent iteration. It identifies the next useful move.

## Why continuity review is conditional

Exploration needs freedom. A continuity check after every sentence slows exploration.

Continuity review matters when a change becomes shared, dated, irreversible, or connected to existing stories.

Use draft status and open questions while exploring. Use continuity review before you mark important material complete.

## Why lore enters through pressure

Readers understand setting details more easily when the details affect action.

A rule becomes clear when a character must obey it.

A faction becomes clear when a character needs its protection or fears its response.

A technology becomes clear when access, cost, failure, or misuse changes a choice.

This keeps world-building connected to story behavior.

## Why official material stays separate

Official Cyberpunk material and original project material have different authority.

Separate source claims from project additions so that:

- Canon conflicts remain visible.
- Sources remain traceable.
- Original work remains identifiable.
- The repository does not become a copied source archive.

Use `canon-steward` when the distinction matters.

---

# FAQ

## Do I need to use `/skill:ask-narrative` every time?

No. Use it when the next skill is unclear. Run a known skill directly when the current gap is clear.

## Must I follow the skill order in this README?

No. The examples show common paths. Start with the seed that interests you.

## Can I start with an event instead of a character?

Yes. Use `ask-narrative`, `world-builder`, or `story-architect` based on the current gap.

## Can I start with a character instead of a world?

Yes. Run `/skill:character-designer`. Build the world around the character when the backstory needs setting pressure.

## Do I need a full character file for every person?

No. Create a facet when the character is reusable or has an independent story role. Keep minor characters in the story file.

## Should backstory be a long biography?

No. Store the events, beliefs, behavior, pressure, and choices that affect the story.

## Can a character's belief be wrong?

Yes. Record the actual or contested truth separately from the character's belief.

## Who knows a character's secret?

Record knowledge levels in the character facet or the story's reveal tracking. Separate character knowledge, reader knowledge, and other knowledge.

## When do I create a faction?

Create a faction when a group has independent goals, resources, relationships, power, or internal conflict.

## When does a faction member need a character file?

Create a character file when the member has an independent goal, relationship network, or story role.

## Can I build the world in any order?

Yes. Use draft facets, open questions, and links. Refine the connected facets as new ideas appear.

## When should I run `continuity-keeper`?

Run it after major shared changes, before important material becomes complete, or when a contradiction appears.

## Does `continuity-keeper` change files automatically?

It reports conflicts first. Update a source of truth only when the project workflow or user authorizes the correction.

## When should I use `narrative-session-recorder`?

Use it after a planning or writing session changes several shared facets. Do not use it for every small edit.

## When should I use `narrative-style-editor`?

Use it after the story structure, character engine, and continuity work. It cannot repair a missing story problem.

## Can RED and 2077 canon coexist?

Yes. Mark each fact with its canon layer. Preserve conflicts until the project records a decision.

## Can I store official Cyberpunk background stories as plain text?

No. Store short paraphrases, citations, and source locators. Do not store substantial copied text.

## What if an official fact conflicts with the project?

Run `/skill:canon-steward`. Preserve the source claim. Record the project interpretation or decision separately.

## What if two skills both seem correct?

Use the skill that owns the current gap. Add the other skill only when it has a direct dependency.

## What if I do not know the next skill after a change?

Run:

```text
/skill:ask-narrative
```

Tell it what changed and what you want to do next.

## Can these skills write finished fiction?

Some skills plan, review, and revise fiction. They do not replace the user's creative decisions. Use the planning skills for structure and the style skill for prose revision.
