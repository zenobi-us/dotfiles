---
type: Engine Mechanic
title: Resource patching runs on the new-game path only, and a framework rollback can switch it off in silence
description: Thousands of resource-patch operations run when a character is created and exactly zero run when a save loads, which makes a save load a free control experiment. The same subsystem got stricter between two framework releases, and rolling that release back stopped it patching anything at all, with no error anywhere.
tags: [archivexl, resource-patch, new-game, appearance, frameworks, versions, diagnosis]
status: draft
generated: { by: "claude", at: "2026-08-25T11:20:00-04:00" }
---

# Resource patching runs on the new-game path only, and a framework rollback can switch it off in silence

An `.xl` sidecar can declare `resource: patch:` entries, which merge a mod's
content **into a resource somebody else owns** - a vanilla mesh, an entity, a
material set, or another mod's file - addressed by depot path. It is how body,
hair and clothing mods wire themselves into the player's own resources without
overriding them.

Two things about it decide whole investigations, and neither is written on any
mod page.

## It runs when a character is created, not when a save loads

Measured across sessions on one install: a **new game** logs between 2,700 and
9,921 `[ResourcePatch]` operations, of which 3,342 were distinct in one run. A
**save load** logs **zero**.

That asymmetry shows up in the process before it shows up in the log - the same
install sat at ~1.2 cores and 5.2 GB loading a save, against 4.5-4.8 cores and
8.9 GB starting a new game.

Two consequences worth having:

- **A fault in resource patching can only appear on the character-creation
  path.** If a symptom is new-game-only and a save loads clean, this subsystem
  is in the suspect list and most of the install is not.
- **A save load is a free control experiment.** It is instant, it is
  non-destructive, and it exercises a materially different path. Run it before
  spending a launch on anything else.

## A patch target that does not exist fails quietly, per target

When a declared target is not on disk, the framework logs

```
[error] [ResourcePatch] ... doesn't exist
```

for that target and carries on with the rest. So a mod whose seven patch targets
include three owned by a mod that was never installed **works four-sevenths of
the way** and reports nothing in game.

This is also how a dependency that exists nowhere else becomes visible. The
mod's own page declared nothing; the requirement lived only inside the `.xl`, as
three depot paths belonging to another author's mod. A requirements audit built
from mod-page prose cannot see it. Grepping the sidecars and reading the
framework's log can.

## The same declaration can be accepted by one release and refused by the next

A material referenced but never defined logged *"has been successfully
instantiated"* on one framework release and, on the next:

```
[DynamicMesh] Material "skin11" of "...t0_000_pwa_base__full.mesh" is not defined
```

Same mod, same data, different outcome - and on screen the torso and legs stopped
rendering while head, arms and hands were fine. **Nothing about that reads as a
framework strictness change**; it reads as "a mod broke", and the search goes to
the mod.

Before blaming a mod for a sudden appearance fault, check whether the framework
under it moved. The mesh names in such a line are worth decoding rather than
skipping: they name a body region, and the region they name is usually exactly
the part that disappeared.

## Rolling a framework back is not a null change

Rolling that release back to test the theory **disabled resource patching
entirely**: the operation count went from 9,921 to **0**, with zero errors
logged, while other subsystems in the same framework kept working normally. Forty-one
sidecars declaring `resource: patch:` blocks had not one of them applied, and
nobody noticed for the rest of the session because nothing said so.

The rollback did not disprove the theory either - the original fault reproduced
on the older version too.

**A downgrade is a change with its own blast radius.** It can convert a loud
symptom into a quiet one, and a quiet one is worse. If a version rollback is
part of a test, measure something the rolled-back component is supposed to be
doing, and confirm it is still doing it.

## The wrong theory that cost two mods being disabled

The patch declarations form a graph - files that are patched, files that are
read as patch sources - and it is tempting to look for a cycle in it. A test
that flags "this node is both a target and a source" **does not detect cycles**;
it detects chains, which are ordinary and harmless (A patched from B, B patched
from C). A proper depth-first search over all 595 edges found **zero circular
paths and a maximum chain depth of 2**, after two helmet mods had been disabled
for nothing on the strength of the bad test.

A second bug in the same parser missed every edge written in the scalar form
`source: target` rather than as a list, so the graph it did build was not even
the whole graph.

Two rules out of that: a graph property needs the algorithm for that property,
and a parser that reads one of two legal spellings of the same declaration is
reporting on a subset it never told you about.

## What was not verified

The operation counts, the zero-on-save-load reading, the strictness change and
the rollback's effect are all from one install across a handful of sessions on
two framework releases. The mechanism generalises; the numbers are one order's,
and the strictness behaviour is specific to those two releases.

## Related

- [Two mods can rewrite the same quest node, and no conflict scan sees it](/conflicts/quest-graph-interceptions) - the other new-game-only sidecar mechanism
- [A missing-requirement report is wrong in both directions](/install/auditing-dependencies) - the audit this defeats
- [Not every visual mismatch is a conflict](/conflicts/visual-bugs-that-are-not-conflicts) - where an appearance fault goes once patching is ruled in or out
- [A missing character-creation option is usually a stale list](/conflicts/a-missing-creator-option-is-a-stale-list) - why an appearance mod has to be tested on a new character
- [Deleting a world node with ArchiveXL](/authoring/archivexl-node-deletions) - the sibling sidecar mechanism, where one wrong entry voids the whole file
