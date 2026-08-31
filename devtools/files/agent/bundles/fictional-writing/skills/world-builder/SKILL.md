---
name: world-builder
description: Create story-ready places, history, technology, institutions, social conditions, conflicts, and setting constraints, using existing facets and canon sources without creating disconnected lore.
---

# World Builder

Build setting material that creates pressure for characters and gives stories usable choices. Connect every new fact to a place, a person, a faction, a technology, a historical event, or a story need.

Do not create a catalogue of disconnected details. Do not use world-building to avoid the story problem.

## When to Use

Use this skill when a story needs a new district, location, region, institution, technology, historical layer, social condition, or local conflict.

Use `canon-steward` first when the request needs official setting facts, source research, or a RED and 2077 reconciliation.

Use `faction-designer` when an institution or group needs its own leadership, resources, agenda, relationships, or internal conflict.

Use `character-designer` when a place, history, institution, or social condition forms a character's backstory or behavior.

Do not use this skill to design a complete faction, outline a story arc, or settle an unsupported canon conflict.

## References

Read `references/showing-lore-through-pressure.md` when setting details need to enter through action, choice, or consequence.

## Repository Anchors

Read these files before you write:

- `CONTEXT.md` for premise, tone, scope, core truths, canon boundary, and domain terms.
- `docs/agents/narrative-domain.md` for facet types, metadata, IDs, and storage paths.
- `docs/agents/narrative-workflow.md` for source-of-truth and update rules.
- Relevant facets in `characters/`, `stories/`, `timeline/`, and `world/`.
- Relevant source records in `docs/sources/`, when that path exists.
- Relevant canon notes in `docs/canon/`, when that path exists.
- Relevant decisions in `docs/adr/`, when that path exists.

Use the active alignment root for `CONTEXT.md`, `docs/adr/`, and `docs/agents/` when the repository defines one. Keep world facets in the repository root.

## World-Building Contract

A usable setting package answers these questions:

| Question | Required answer |
|---|---|
| Where is it? | A named place with boundaries and neighboring places. |
| Why does it matter? | A direct connection to the story or a reusable world pressure. |
| Who controls it? | A named institution, faction, community, or disputed authority. |
| Who depends on it? | People or groups that need its services, resources, or protection. |
| What can go wrong? | At least one active conflict with a visible cost. |
| What changed it? | A history or recent event with a source or `original` label. |
| What limits it? | Costs, scarcity, law, damage, distance, risk, or technology limits. |
| What can characters do there? | Concrete actions, choices, leverage points, and consequences. |

Prefer a small setting package with connected facts over many shallow facts.

## Facet Storage

Store one Markdown file per reusable facet:

- Places in `world/places/`.
- Factions in `world/factions/`.
- Technology in `world/technology/`.
- History in `world/history/`.
- Terms in `world/terms/`.
- Stories in `stories/`.
- Dated events in `timeline/`.

Use the existing paths in `docs/agents/narrative-domain.md` when they differ.

Use frontmatter like this:

```yaml
---
id: place.grayline-district
type: place
name: Grayline District
status: draft
canon: original
era: red
---
```

Use stable IDs in the form `<type>.<slug>`. Search existing IDs before creating a facet. Link related facets with relative Markdown links.

Institutions with independent goals are `faction` facets. Infrastructure, customs, or public services belong in the relevant place facet unless they need independent agency.

## Canon and Original Material

Mark each facet with its canon label:

- Use `official-red`, `official-2077`, or `official-other` for sourced official material.
- Use `secondary` for non-primary sources.
- Use `original` for new project material.
- Use `unverified` when evidence is weak or missing.

Add a source ID and locator beside every sourced fact. Keep project additions separate from source claims.

If sources conflict, preserve the conflict and link the reconciliation note. Do not silently choose a fact. If no project rule resolves it, mark the relevant material `unresolved`.

## Process

### 1. Read the request and anchors

Identify the story need, setting scope, era, location, required canon, and intended reuse.

Read the repository anchors and related facets before you design new material.

If the request does not name a story need, infer one from the existing story files. State the inferred need in the report.

### 2. Set the design boundary

Choose one primary setting unit:

- District or neighborhood.
- Building or site.
- Region or route.
- Institution or service.
- Technology system.
- Historical period or event.

Define its physical, social, temporal, and story boundaries. Do not expand the scope without a clear dependency.

### 3. Map existing relationships

Search for existing places, factions, characters, technologies, terms, stories, and events that connect to the design boundary.

Reuse existing facets. Update them only when the new setting fact changes their shared meaning.

List missing dependencies. Create only the facets required to make the setting coherent.

### 4. Build the causal chain

Write the setting in this order:

1. A resource, service, hazard, or opportunity.
2. The people or groups that depend on it.
3. The authority or system that controls it.
4. The pressure that threatens it.
5. The choices available to characters.
6. The cost of each choice.

Make the conflict come from the setting's material conditions. Do not add a random villain only to create action.

### 5. Create the facet package

Create or update the primary facet. Add supporting facets only when they are reusable or necessary for links.

A place facet normally includes:

- Identity and boundaries.
- Current condition.
- Important sublocations.
- Controlling and dependent groups.
- Resources and services.
- Social conditions.
- Active conflicts.
- Technology and infrastructure.
- Recent history.
- Story uses and consequences.
- Source and continuity notes.

A technology facet normally includes:

- Function.
- Users and owners.
- Access limits.
- Failure modes.
- Cost.
- Social effect.
- Related places, factions, and stories.

A history facet normally includes:

- Date or date range.
- Event.
- Causes.
- Immediate result.
- Current consequence.
- Source or `original` label.

### 6. Hand off faction depth

When an institution or group needs leaders, resources, territory, public identity, secret goals, allies, enemies, or internal conflict, create a linked placeholder only.

Report the faction as a dependency for `faction-designer`. Do not duplicate faction design in the place facet.

### 7. Check internal consistency

Make sure that:

- Every linked ID exists or is listed as a missing dependency.
- Every sourced claim has a source record and locator when available.
- Every original fact has `canon: original`.
- Every dated event has a date or an explicit unknown date.
- Technology has users, limits, and costs.
- Conflicts have causes and consequences.
- The setting gives characters choices, not only descriptions.
- The new material does not contradict `CONTEXT.md` or an ADR.

### 8. Report the result

Report:

- The design boundary.
- The story need.
- Facets created or updated.
- Relationships added.
- Faction dependencies for `faction-designer`.
- Character dependencies for `character-designer`.
- Canon sources used.
- Unresolved questions.
- Continuity effects.
- Story actions and consequences enabled by the setting.

## Common Mistakes

| Mistake | Correct action |
|---|---|
| Build a complete encyclopedia entry | Build one bounded setting package around a story need. |
| Add details with no story use | Connect each detail to pressure, choice, cost, or consequence. |
| Create a new faction inside every place file | Link an existing faction or hand off faction design. |
| Use official facts without source records | Run `canon-steward` and record each sourced claim. |
| Resolve RED and 2077 conflicts silently | Preserve both claims and link a reconciliation note. |
| Make technology solve every problem | Give technology access limits, failure modes, and costs. |
| Add history without present effects | Record the current consequence of each important event. |
| Invent an exact date when none exists | Mark the date unknown or use a bounded date range. |
| Create duplicate places or technologies | Search stable IDs before creating a facet. |
| Change shared facts without checking stories | Read related stories and report continuity effects. |

## Completion Criteria

The world-building task is complete only when:

- The story need and design boundary are stated.
- The relevant repository anchors and facets were read.
- The setting has a clear place, authority, dependency, pressure, choice, and cost.
- New facets use the repository metadata and paths.
- Relationships use stable IDs and valid links.
- Source claims and original additions are separate.
- Faction depth is linked to `faction-designer` instead of duplicated.
- Conflicts and unknowns are visible.
- The material does not contradict `CONTEXT.md` or relevant ADRs.
- The report lists all files created or updated and all follow-up dependencies.

## State Machine

```text
[Setting need]
      |
      v
[Read anchors and related facets]
      |
      v
[Set design boundary]
      |
      v
[Map existing relationships]
      |
      v
[Build causal chain]
      |
      v
[Resource, hazard, or opportunity]
      |
      v
[Dependents and authority]
      |
      v
[Active pressure]
      |
      v
[Character choices and costs]
      |
      v
[Create or update facet package]
      |
      v
{Needs independent faction agency?}
      | yes                         | no
      v                             v
[Create placeholder]          [Continue]
      |                             |
      v                             |
[Hand off to faction-designer]-----+
                                    |
                                    v
[Check links, sources, limits, conflicts]
                                    |
                                    v
[Report facets, dependencies, and story uses]
```
