---
name: narrative-repo-setup
description: Set up a repository for fictional writing skills — choose the repository anchors, create the facet directories and domain documents, preserve existing project files, and report the files created.
disable-model-invocation: true
---

# Narrative Repository Setup

Set up the repository before the other fictional-writing skills use it. Create a small, composable Markdown model for stories, characters, places, factions, technology, history, terms, and timeline events.

Do not build a database. Do not copy copyrighted source text. Do not replace existing project instructions or story files.

## When to Use

Run this skill once when a repository does not contain the narrative anchors. Run it again only to repair missing anchors or add missing facet directories.

Do not use this skill to write a story, design a faction, or resolve a canon conflict.

## Repository Anchors

Use these files as the single sources of truth:

| Anchor | Purpose |
|---|---|
| `CONTEXT.md` | Project premise, scope, tone, core truths, canon boundary, and domain terms. |
| `docs/adr/` | Decisions that are hard to reverse or surprising without their reason. |
| `docs/agents/narrative-domain.md` | Facet types, metadata, IDs, links, and status values. |
| `docs/agents/narrative-workflow.md` | Storage paths, update rules, and the writing lifecycle. |
| `AGENTS.md` or `CLAUDE.md` | Pointer to the fictional-writing skills and their anchor documents. |

If the repository has an active `ALIGNMENT-ROOT.md` or shared-agent context, resolve `CONTEXT.md`, `docs/adr/`, and `docs/agents/` against that alignment root. Keep facet and story files in the repository root.

## Facet Model

Store one Markdown file per reusable facet. Use these directories:

```text
characters/
stories/
timeline/
world/
  places/
  factions/
  technology/
  history/
  terms/
```

Use the existing directory layout when it already contains equivalent paths. Do not move files during setup.

Every facet file starts with frontmatter like this:

```yaml
---
id: faction.example
type: faction
name: Example Faction
status: active
canon: original
era: red
---
```

Use stable IDs in the form `<type>.<slug>`. Link related facets with normal relative Markdown links. Use `status: draft`, `active`, `retired`, or `archived`.

Valid types are:

- `story`
- `character`
- `place`
- `faction`
- `technology`
- `history`
- `term`
- `event`

## Process

### 1. Resolve the roots

Find the Git repository root. Read the root `AGENTS.md`, `CLAUDE.md`, and `README.md` when they exist.

Read `ALIGNMENT-ROOT.md` when it exists. If shared-agent context defines an alignment root, use that root for alignment documents.

Read `CONTEXT.md` and relevant files in `docs/adr/` before you edit them. Preserve existing terms and decisions.

### 2. Inspect before writing

Check which anchors and directories already exist.

Treat an existing file as authoritative. Do not overwrite it. Do not merge content automatically.

If an existing file uses a different but clear location for an anchor, document that location in `docs/agents/narrative-workflow.md` instead of moving the file.

### 3. Create missing directories

Create only missing directories:

```text
characters/
stories/
timeline/
world/places/
world/factions/
world/technology/
world/history/
world/terms/
docs/adr/
docs/agents/
```

Do not create example stories, characters, factions, or other fictional facts.

### 4. Create `CONTEXT.md` when absent

When `CONTEXT.md` does not exist, create it with this content:

```markdown
# Narrative Context

This repository stores original fictional writing and its shared setting data.

## Premise

_Record the central situation in one or two sentences._

## Tone

- _Record the intended tone._

## Time and place

- **Era:** _Record the era._
- **Primary location:** _Record the location._
- **Scope:** _Record the scope._

## Core truths

- _Record facts that every story must respect._

## Canon boundary

- **Official canon:** _Record which licensed setting material applies._
- **Original canon:** _Record that this repository's additions are original work._
- **Conflict rule:** _Record which source takes priority when sources conflict._

## Open questions

- _Record unresolved choices._

## Domain terms

- _Add one approved project term per entry._
```

When `CONTEXT.md` exists, leave it unchanged. Report that it needs review if it lacks a canon boundary or domain terms.

### 5. Create the domain document when absent

Create `docs/agents/narrative-domain.md` with the facet model, metadata, IDs, links, valid types, and status values from this skill.

State that Markdown facet files are the source of truth. State that `CONTEXT.md` owns project language and `docs/adr/` owns hard-to-reverse decisions.

### 6. Create the workflow document when absent

Create `docs/agents/narrative-workflow.md` with these rules:

```markdown
# Narrative Workflow

## Source of truth

- `CONTEXT.md` stores project scope, core truths, canon boundaries, and domain terms.
- `docs/adr/` stores hard-to-reverse decisions.
- Facet files store reusable setting and story data.
- `timeline/` stores dated events and their sources.
- Story files store story-specific arc and continuity notes.

## Storage

- Store characters in `characters/`.
- Store stories in `stories/`.
- Store events in `timeline/`.
- Store places, factions, technology, history, and terms in their directories under `world/`.

## Update rule

Create or update a facet when a story introduces a fact that another story can reuse. Link the facet to the story that introduced it.

Record a dated consequence in `timeline/` when a story changes the shared world.

Record an open question instead of inventing an answer when the source material or project context does not decide the fact.

Run continuity review after a story changes a character, faction, place, technology, or timeline event.
```

### 7. Add the skill pointer

Add a short `## Fictional writing` section to the existing `AGENTS.md` or `CLAUDE.md`. Do not create the other file when one exists.

Use this text:

```markdown
## Fictional writing

This repository uses the fictional-writing skills. Read `docs/agents/narrative-domain.md` for facet types and `docs/agents/narrative-workflow.md` for storage and update rules. Read `CONTEXT.md` before changing shared setting facts.
```

If the file already contains a fictional-writing section, update only stale paths. Do not add a duplicate section.

### 8. Report the result

Report:

- The repository root.
- The alignment root, when one exists.
- Existing anchors that were preserved.
- New anchors and directories.
- Existing anchors that need human review.
- Any unresolved path or canon question.

## Common Mistakes

| Mistake | Correct action |
|---|---|
| Create a second `CONTEXT.md` | Use the active alignment root and report the path. |
| Overwrite an existing `CONTEXT.md` | Preserve it and report missing sections. |
| Put facet data in one large YAML file | Use one Markdown file per reusable facet. |
| Create sample fictional facts during setup | Create directories and templates only. |
| Move existing stories or world notes | Keep existing files in place. Record their paths. |
| Put process rules in `CONTEXT.md` | Put storage rules in `docs/agents/narrative-workflow.md`. |
| Create an ADR for the setup itself | Create an ADR only when the repository makes a hard-to-reverse decision. |
| Copy official setting text | Record a source and write a short summary. |
| Create duplicate skill pointers | Update the existing section. |

## Completion Criteria

The setup is complete only when:

- The active repository and alignment roots are identified.
- Existing instruction, context, and ADR files are preserved.
- The required facet directories exist.
- `CONTEXT.md` exists or its existing path is reported.
- `docs/agents/narrative-domain.md` exists.
- `docs/agents/narrative-workflow.md` exists.
- The active agent instruction file points to the two narrative documents.
- No fictional facts were invented.
- No existing project file was overwritten or moved.
- The report lists every file created, preserved, or requiring review.
