---
name: story-architect
description: Create story-ready premises, arcs, episodes, scenes, choices, stakes, endings, and continuity effects, using shared world facets and timeline records.
---

# Story Architect

Design stories as pressure systems. Give the protagonist a goal, an opposing force, rising costs, meaningful choices, and consequences that change the shared world.

A story plan is not a list of events. It is a chain of choices and consequences.

## When to Use

Use this skill when a story needs a premise, logline, protagonist goal, arc, episode plan, scene plan, turning point, crisis, ending, or follow-up consequences.

Use `character-designer` when a protagonist or major character lacks a causal backstory, belief, voice, relationship pressure, or personal arc.

Use `world-builder` when the story lacks a required place, technology, institution, or social condition.

Use `faction-designer` when an opposing or supporting group needs its own goals, resources, leadership, relationships, or internal conflict.

Use `canon-steward` first when the story depends on official RED, 2077, or other licensed setting facts.

Do not use this skill to draft finished prose, build a whole setting, or resolve unsupported canon conflicts.

## References

Read `references/dramatic-tension.md` when the arc feels flat, predictable, or low-stakes.

## Repository Anchors

Read these files before you write:

- `CONTEXT.md` for premise, tone, scope, core truths, canon boundary, and domain terms.
- `docs/agents/narrative-domain.md` for story metadata, facet types, IDs, and paths, when it exists.
- `docs/agents/narrative-workflow.md` for source-of-truth and update rules, when it exists.
- Existing `AGENTS.md`, `README.md`, `templates/story.md`, and folder README files when either narrative document is absent.
- Related facets in `characters/`, `world/`, `stories/`, and `timeline/`.
- Relevant source records in `docs/sources/` and canon notes in `docs/canon/`, when these paths exist.
- Relevant decisions in `docs/adr/`, when this path exists.

Use the active alignment root for `CONTEXT.md`, `docs/adr/`, and `docs/agents/` when the repository defines one. Keep story files in the repository's source tree, normally under `stories/`.

## Story Contract

A usable story plan answers these questions:

| Question | Required answer |
|---|---|
| What changes? | A concrete situation that becomes unstable. |
| Who acts? | A protagonist with a specific want, need, and risk. |
| What blocks them? | An opposing force with a goal and useful methods. |
| Why now? | An urgent trigger that removes safe delay. |
| What does failure cost? | Personal, social, material, or moral loss. |
| How does pressure rise? | Escalating obstacles that remove options or increase cost. |
| What choice matters? | A decision that cannot satisfy every important goal. |
| What changes at the turn? | New knowledge, loss, commitment, or reversal. |
| What happens at the crisis? | The protagonist acts under the highest pressure. |
| What remains afterward? | Concrete consequences for people, factions, places, and timeline. |

Use a causal chain:

```text
trigger → response → cost → new pressure → choice → consequence
```

Do not add events that do not change a goal, a relationship, available options, or the cost of failure.

## Story Storage

Store one Markdown file per story in `stories/` unless `docs/agents/narrative-domain.md` defines another path.

Use the repository's existing frontmatter fields. Do not replace local fields with example fields.

If the repository defines no story metadata, use this minimum:

```yaml
---
title: The Dry Run
status: idea
pov: Mara Vale
time: 2045
location: Arroyo
---
```

Use the story template when it exists. Preserve its headings and add the sections required by this skill.

Use stable story IDs only when the repository defines them. Search titles, filenames, aliases, and links before creating a new story file. Update an existing story when the story already exists.

Use the repository's canon labels. Keep original material separate from sourced material. Record the canon label for the story and for any sourced fact that affects the plan.

Link the story to every character, faction, place, technology, and timeline event that it uses.

## Design Model

### Premise and logline

State the unstable situation, the protagonist, the opposing force, and the stakes in one or two sentences.

Write the logline in one sentence. Name the protagonist, goal, opposition, and consequence.

### Character engine

Give the protagonist:

- Want: the visible goal.
- Need: the change or truth required to reach a meaningful ending.
- Risk: what the protagonist can lose.
- Leverage: the skill, relationship, resource, or secret that gives the protagonist agency.
- Limit: the weakness, cost, or boundary that prevents an easy solution.

Give important opposing and supporting characters a goal and a reason to act. Do not make them only obstacles or helpers.

### Opposition

Define the main opposing force. State its goal, resources, methods, limits, and reason for acting now.

Use `faction-designer` for a faction that needs independent design. Use a character facet for an antagonist only when that character has an independent role beyond the story plan.

### Arc and escalation

Build three to seven pressure stages. Each stage must:

1. Change the situation.
2. Remove an option, increase a cost, or reveal a risk.
3. Force a new response.

Mark the irreversible turning point. State what the protagonist learns, loses, commits to, or causes.

Keep the crisis different from the turning point. The turn changes the meaning of the problem. The crisis tests the protagonist's final choice.

### Choices and endings

Give the protagonist at least two viable responses at the crisis. Make each response solve one problem and create another cost.

Choose one intended ending for a fixed story. Keep alternate endings only when the story is interactive, episodic, or still in design.

State the ending action, immediate result, lasting consequence, and unresolved threat.

Do not promise that a broadcast, public proof, or heroic victory changes the world without naming the people or systems that respond.

### Scope control

Design the smallest arc that answers the request.

Do not invent exact dates, quantities, prices, technical procedures, RED mechanics, named canon characters, or political outcomes without a source or a project decision.

Record useful but unsupported details as open questions. Record omitted mechanics or production details when they are outside the current scope.

Do not let one district resolve a regional or global problem unless the story states why its action has that reach.

## Process

### 1. Read the request and anchors

Identify the story type, intended length, era, location, tone, canon layer, protagonist, and desired outcome.

Read the repository anchors and all related facets before you design the arc.

If the request omits a required choice, state the assumption and list the choice as an open question.

### 2. Set the story boundary

Choose one primary scope:

- Single scene.
- Short story.
- Linked short stories.
- Episode.
- Multi-episode arc.
- Campaign or long-form arc.

Define the beginning state, ending state, and time span. Do not expand the scope without a dependency.

### 3. Map existing material

Search for existing story titles, characters, factions, places, technology, terms, and timeline events.

Reuse existing facets. Update them only when the new story changes a shared fact.

List missing dependencies before creating them. Hand off missing world or faction depth to the relevant skill.

### 4. Build the story engine

Write the premise, logline, protagonist engine, opposition, trigger, stakes, and failure cost.

Test the engine with this question: if the protagonist does nothing, what gets worse, and why can the protagonist not safely wait?

### 5. Build the arc

Write the opening state and trigger.

Write three to seven escalation stages. Connect each stage to the previous consequence.

Write the irreversible turning point.

Write the crisis choice and at least two viable responses.

Write one intended ending and its immediate and lasting consequences.

### 6. Connect the story

Link the story to related facets with the repository's link format.

Record every new or changed fact that affects a character, faction, place, technology, or timeline event.

Add dated events to `timeline/` only when the story has a fixed date or a bounded sequence. Use explicit unknown dates when needed.

Create a new character, faction, place, or technology facet only when it is reusable or has an independent story role.

### 7. Check the plan

Make sure that:

- The protagonist has agency and a specific goal.
- The opposing force has a goal, method, limit, and reason to act now.
- The trigger creates urgent pressure.
- Each escalation changes the situation or cost.
- The turning point differs from the crisis.
- The crisis contains a real choice with competing costs.
- The ending states what changes and what remains unresolved.
- Character, faction, place, and timeline effects are recorded.
- Sourced claims have source records and locators when available.
- Original additions use the repository's original canon label.
- Links point to existing facets or named missing dependencies.
- The plan does not contradict `CONTEXT.md` or relevant ADRs.

### 8. Report the result

Report:

- Story boundary and story need.
- Story file created or updated.
- Premise and logline.
- Protagonist want, need, leverage, limit, and risk.
- Opposing force and escalation.
- Turning point, crisis, ending, and consequences.
- Related facets created or changed.
- Timeline effects.
- Canon sources used.
- Assumptions, omissions, and unresolved questions.
- Follow-up work for `character-designer`, `world-builder`, `faction-designer`, or `continuity-keeper`.

## Common Mistakes

| Mistake | Correct action |
|---|---|
| Write events without causality | Connect every event to a response, cost, choice, or consequence. |
| Give the protagonist a task but no need | Add the internal change required for a meaningful ending. |
| Make the antagonist a wall | Give the opposing force goals, methods, resources, limits, and reasons. |
| Escalate only through bigger violence | Remove options, increase costs, reveal risks, or change relationships. |
| Treat the turning point as the climax | Use the turn to change the problem and the crisis to test the final choice. |
| Offer choices with one obvious answer | Give each viable choice a real benefit and a lasting cost. |
| List several endings without purpose | Choose one ending unless the story is interactive or still in design. |
| Let public evidence solve everything | Name the systems and people that receive, resist, or exploit the evidence. |
| Resolve a regional problem in one district | State the limited result and the wider problem that remains. |
| Invent exact facts to fill gaps | Record the gap as an assumption or open question. |
| Create duplicate facets | Search titles, IDs, aliases, and links before creating files. |
| Draft finished prose during planning | Keep the output as a story plan and facet updates. |
| Change shared facts without checking other stories | Read linked stories and report continuity effects. |

## Completion Criteria

The story plan is complete only when:

- The story boundary and story need are stated.
- Repository anchors and related facets were read.
- The premise and logline identify the protagonist, goal, opposition, and stakes.
- The protagonist has want, need, leverage, limit, and risk.
- The opposing force has a goal, method, resource, limit, and urgent reason.
- The arc contains a trigger, three to seven escalation stages, an irreversible turn, a crisis, and an intended ending.
- The crisis offers viable choices with competing costs.
- Immediate, lasting, and unresolved consequences are recorded.
- Related facet and timeline effects are recorded.
- Metadata, paths, canon labels, and links follow repository rules.
- Sources, assumptions, omissions, dependencies, and open questions are visible.
- The report lists all files created or updated.

## State Machine

```text
[Story request]
      |
      v
[Read anchors and related facets]
      |
      v
[Set story boundary]
      |
      v
[Map existing material]
      |
      v
{Missing canon fact?}
   | yes                         | no
   v                             v
[Use canon-steward]         [Build story engine]
   |                             ^
   +-----------------------------+
                                 |
                                 v
[Premise, logline, protagonist, opposition]
                                 |
                                 v
[Trigger, stakes, failure cost]
                                 |
                                 v
[Three to seven escalation stages]
                                 |
                                 v
[Irreversible turning point]
                                 |
                                 v
[Crisis with competing choices]
                                 |
                                 v
[Intended ending and consequences]
                                 |
                                 v
[Link facets and timeline]
                                 |
                                 v
[Check causality, continuity, canon, scope]
                                 |
                                 v
[Report plan, changes, dependencies, questions]
```
