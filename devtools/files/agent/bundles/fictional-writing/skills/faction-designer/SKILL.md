---
name: faction-designer
description: Create story-ready factions with power, leaders, resources, territory, public identity, private goals, relationships, internal conflict, vulnerabilities, and consequences.
---

# Faction Designer

Design factions as active systems of people, resources, rules, and pressure. Give each faction a reason to act, a way to act, and a cost for failure.

A faction is not a list of names. It is a force that makes choices and changes the setting.

## When to Use

Use this skill when a place, story, or character needs a faction with independent goals, authority, resources, territory, public identity, secret goals, relationships, or internal conflict.

Use it after `world-builder` creates a faction placeholder or identifies an institution with independent agency.

Use `canon-steward` first when the faction uses official RED, 2077, or other licensed setting facts.

Use `character-designer` when a leader, contact, or member needs an independent character facet.

Do not use this skill to design a whole city, write a story arc, or create a faction with no story or setting connection.

## References

Read `references/social-status-and-agenda.md` when faction members need distinct agendas, status behavior, or negotiation pressure.

## Repository Anchors

Read these files before you write:

- `CONTEXT.md` for premise, tone, scope, core truths, canon boundary, and domain terms.
- `docs/agents/narrative-domain.md` for facet types, metadata, IDs, and paths, when it exists.
- `docs/agents/narrative-workflow.md` for source-of-truth and update rules, when it exists.
- Existing `AGENTS.md`, `README.md`, and folder README files when either narrative document is absent.
- Related facets in `world/`, `characters/`, `stories/`, and `timeline/`.
- Relevant source records in `docs/sources/` and canon notes in `docs/canon/`, when these paths exist.
- Relevant decisions in `docs/adr/`, when this path exists.

Use the active alignment root for `CONTEXT.md`, `docs/adr/`, and `docs/agents/` when the repository defines one. Keep faction facets in the repository's source tree, normally under `world/factions/`, not in the alignment root.

## Faction Contract

A usable faction answers these questions:

| Question | Required answer |
|---|---|
| What does it want? | A public goal and a private goal. |
| What does it control? | Territory, people, information, money, force, technology, or access. |
| Why does anyone obey it? | Legitimacy, dependence, fear, protection, belief, or advantage. |
| How does it act? | Methods that fit its resources and values. |
| What does it need? | A resource, relationship, condition, or secret. |
| What can hurt it? | A specific vulnerability or internal fracture. |
| Who opposes it? | Named enemies, rivals, or groups with conflicting interests. |
| Who supports it? | Named allies, clients, dependents, or temporary partners. |
| What divides it? | At least two internal interests with different desired outcomes. |
| What can characters change? | Concrete leverage points and consequences. |

Use asymmetry. A faction can be powerful in one area and weak in another.

## Facet Storage

Store the faction in `world/factions/` unless `docs/agents/narrative-domain.md` defines another path.

Use one Markdown file per faction. Use the repository's existing frontmatter fields. Do not replace a local field with an example field.

If the repository defines no faction metadata, use this minimum:

```yaml
---
id: faction.grayline-compact
kind: faction
name: Grayline Compact
status: draft
canon: original
era: red
---
```

Use a stable ID in the form `faction.<slug>` when the repository uses stable IDs. Search existing IDs, names, and aliases before creating a file. If existing facets use IDs inconsistently, preserve their fields and add an ID only when the repository contract requires it. Update the existing facet when the faction already exists.

Use the repository's canon labels. For example, keep `original-fan-work` when the repository defines that label instead of changing it to `original`.

Link related facets with relative Markdown links. Link the faction to every place, character, story, technology, and timeline event that uses it.

Create a separate character facet for a leader only when that leader has an independent story role. Otherwise keep the leader in the faction facet.

## Canon and Original Material

Mark each faction with the repository's canon label:

- Use the project's labels for official RED, 2077, and other licensed material.
- Use the project's label for secondary material.
- Use the project's label for original material.
- Use the project's label for weak or missing evidence.

If the repository has no canon labels, use `official-red`, `official-2077`, `official-other`, `secondary`, `original`, and `unverified`.

Add a source ID and locator beside each sourced fact. Use the source format defined by the repository. If no format exists, use `[source-id: locator]` after the fact and record the source in `docs/sources/` when that path exists. Keep official faction facts separate from project additions.

If sources conflict, preserve the conflict and link the reconciliation note. Do not silently change an official faction to fit an original plot.

## Faction Design Model

Use these layers:

### Identity

Give the faction a name, type, territory, era, canon label, and short description.

### Power

List what the faction controls and how it uses that control. State what the faction cannot control.

### Public face

State what outsiders see, what service or promise the faction offers, and who benefits from that image.

### Private agenda

State the faction's real goal. State the condition that makes the goal urgent.

### Structure

Name the leader or leadership group. List the major internal interests. State how the faction makes decisions and what happens when leaders disagree.

### Operations

List resources, methods, territory, dependencies, and limits. Connect each resource to a cost or vulnerability.

### Relationships

Give each important relationship a direction and a reason:

- Ally: what both sides gain.
- Client or dependent: what the weaker side needs.
- Rival: what both sides want.
- Enemy: what one side must stop.
- Temporary partner: what ends the cooperation.

### Story pressure

List what the faction wants from characters, what characters can gain, what the faction can threaten, and what changes if characters succeed or fail.

## Scope Control

Design the smallest faction that can create the requested story pressure.

Include a detail only when it supports a goal, resource, limit, relationship, conflict, choice, or consequence.

Record useful but unsupported details as open questions. Do not invent exact dates, prices, quantities, statistics, or canon facts to make the facet look complete.

Name a faction contact only when characters need to negotiate with, oppose, follow, or protect that person. Keep unnamed members as groups until an independent character role exists.

## Process

### 1. Read the request and anchors

Identify the faction's story need, setting connection, era, canon layer, and intended reuse.

Read the repository anchors and related facets before you design the faction.

If the request does not name a story need, infer one from the linked place or story. State the inferred need in the report.

### 2. Set the faction boundary

Choose one primary faction type:

- Corporation or company.
- Government or authority.
- Gang or criminal network.
- Community or mutual-aid group.
- Religious or ideological group.
- Media or information network.
- Military or security force.
- Technology or infrastructure operator.
- Informal network.

Define what belongs to this faction. Do not absorb every related person or group into it.

### 3. Inspect existing facets

Search for the faction ID, aliases, leaders, territory, rivals, and source claims.

Reuse existing facets. Update related places or stories only when the faction changes their shared facts.

List missing relationships and dependencies before you create them.

### 4. Build the power structure

Write the public goal, private goal, controlled resources, dependencies, methods, legitimacy, and vulnerability.

Then write at least two internal interests. Give each interest a leader or constituency, a desired outcome, and a reason for disagreement.

Do not make every member secretly loyal to one mastermind. Internal conflict must come from real interests, incentives, or beliefs.

### 5. Create the faction facet

Create or update the faction file with these sections:

- Identity.
- Public face.
- Goals.
- Territory and control.
- Resources and limits.
- Leadership and structure.
- Internal conflicts.
- Allies, clients, rivals, and enemies.
- Methods and red lines.
- Vulnerabilities.
- Story hooks.
- Consequences.
- Source and continuity notes.

Use concrete details. Replace vague traits such as `powerful`, `dangerous`, or `influential` with the resource, method, or consequence that proves the trait.

### 6. Connect the faction

Link the faction to related places, characters, technology, stories, and events.

Update a place facet when the faction controls, serves, exploits, or threatens that place.

Update a timeline facet when the faction's history creates a dated consequence.

Create a character facet only for a leader or member with independent goals, relationships, or story appearances.

### 7. Check the faction

Make sure that:

- The faction has a clear want and an urgent reason.
- Every power has a source and a limit.
- Every relationship has a reason and direction.
- Internal interests can produce different decisions.
- The public face differs from the private agenda when secrecy matters.
- The faction can lose something.
- Characters have more than one way to respond.
- Sourced claims have source records and locators when available.
- Original additions have `canon: original`.
- Links point to existing facets or named missing dependencies.
- The faction does not contradict `CONTEXT.md` or relevant ADRs.

### 8. Report the result

Report:

- The faction boundary and story need.
- The faction facet created or updated.
- Related facets changed.
- Resources, limits, and vulnerabilities.
- Internal interests and conflicts.
- Relationships added.
- Canon sources used.
- Unresolved questions.
- Story choices and consequences enabled by the faction.

## Common Mistakes

| Mistake | Correct action |
|---|---|
| Make the faction powerful in every area | Give it a clear strength and a clear limit. |
| Give it only a secret goal | Add a public goal and the reason people accept it. |
| Create a villain instead of a faction | Design members with different interests and incentives. |
| List allies and enemies without reasons | State what each relationship provides and what can end it. |
| Add leaders with no independent role | Keep them in the faction file until they need a character facet. |
| Put every related person in the faction | Define membership and distinguish clients, allies, and enemies. |
| Use official faction details without evidence | Run `canon-steward` and record source claims. |
| Change a place file without checking its stories | Read linked stories and report continuity effects. |
| Add hooks with no consequence | State what changes after each character action. |
| Use `dangerous` or `powerful` as evidence | Name the method, resource, target, and cost. |
| Resolve internal conflict with one perfect leader | Keep competing interests active. |
| Duplicate an existing faction | Search stable IDs, names, and aliases first. |

## Completion Criteria

The faction design is complete only when:

- The faction boundary and story need are stated.
- Repository anchors and related facets were read.
- The faction has goals, power, legitimacy, resources, limits, methods, and vulnerability.
- At least two internal interests can produce different decisions.
- Important relationships have direction and reasons.
- The faction has concrete story pressure, choices, and consequences.
- New and updated facets use repository metadata and paths.
- Source claims and original additions are separate.
- Links and continuity effects are recorded.
- The report lists files created or updated, character dependencies, sources, and open questions.

## State Machine

```text
[Faction need]
      |
      v
[Read anchors and related facets]
      |
      v
[Set faction boundary]
      |
      v
[Inspect IDs, aliases, leaders, rivals]
      |
      v
[Build power structure]
      |
      v
[Public goal and private goal]
      |
      v
[Resources, methods, legitimacy, limits]
      |
      v
[Internal interest A + desired outcome]
      |
      v
[Internal interest B + desired outcome]
      |
      v
[Create or update faction facet]
      |
      v
[Add relationships and story pressure]
      |
      v
[Link places, characters, technology, events]
      |
      v
[Check goals, vulnerabilities, links, sources]
      |
      v
[Report faction, conflicts, hooks, consequences]
```
