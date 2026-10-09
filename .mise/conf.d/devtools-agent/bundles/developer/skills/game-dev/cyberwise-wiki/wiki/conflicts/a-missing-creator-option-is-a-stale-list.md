---
type: Diagnostic Method
title: A missing character-creation option is usually a stale list, not a lost conflict
description: An appearance mod deployed, winning its files and absent from the creator sends people straight to load order. The option list is built once - starting a new character rebuilds it and the entries appear. The same session records why an existing save is the wrong test bed and why a creator screenshot cannot judge a skin.
tags: [character-creation, appearance, skins, textures, testing, conflicts, wrong-theory]
status: draft
generated: { by: "claude", at: "2026-08-25T11:20:00-04:00" }
---

# A missing character-creation option is usually a stale list, not a lost conflict

**Symptom.** A mod that adds character-creation options is deployed, its archive
is winning every file it contests, and its entries are not in the creator.

Everything about that says "lost conflict", and the reflex is to go and reorder
the load order. On one investigation it was not a conflict at all.

**The creator's option list is built once.** Toggling the mod off and on did not
bring the entries in. Going out to the main menu and **starting a new character**
rebuilt the list, and they appeared - after which toggling the mod that supplies
the underlying meshes brought its layer in too.

So: **rebuild the list before touching precedence.** It costs one trip to the
main menu, and precedence changes are not free -
[promoting one mod can silently kill a third](/conflicts/a-precedence-change-creates-casualties).

## The neighbouring cause: a build that is a layer, not a mod

Cosmetic mods frequently ship two builds, and one of them is a **textures-only**
variant that layers over another author's meshes. Installed without that other
mod - or with it disabled - it is inert, with no error and nothing in the
creator. Read what the two downloads on a page actually are before assuming they
are alternatives -
[two downloads from one mod page may not be alternatives](/install/two-builds-of-one-filename).

## Test appearance changes on a new character, never on an existing save

An existing save **records an appearance** that references specific resources.
Loading it after a mod swap does not exercise the character-creation path at all,
and the results are not comparable with what a fresh character produces.

This is not a style preference - it is the same asymmetry that makes a save load
a free control experiment:
[resource patching runs on the new-game path only](/engine/archivexl-resource-patching),
so an existing save is loading an already-resolved appearance while a new
character is having one assembled.

Several rounds of "the skin tones are wrong" were eventually traced to exactly
this: the tests had been run by editing an existing character out of a stock save.

## Judge a skin from the texture, not from a creator screenshot

The creator has its own lighting rig. A screenshot taken in it measures the lamp
as much as the pigment, and comparing two mods that way produced contradictory
conclusions across several rounds.

The durable method is to **extract the texture and compare the files**. It is
also faster, and it answers a question a screenshot cannot: whether the mod even
ships a texture for the body part in question - which is the
[coverage gap](/conflicts/visual-bugs-that-are-not-conflicts) that no reordering
can fix.

## What was not verified

One install, one mod family. The rebuild-on-new-character behaviour was observed
once and is stated as the first thing to try rather than as a rule about how the
creator caches its list. What causes the list to go stale in the first place was
never established.

## Related

- [Not every visual mismatch is a conflict](/conflicts/visual-bugs-that-are-not-conflicts)
- [Three conflicts look identical in a report and only one is fixable by order](/conflicts/what-reordering-can-and-cannot-fix)
- [An ACU preset's LocKey number is a hash of a group name](/formats/acu-preset) - a preset saved before a creator-option mod was installed carries no key for those groups at all
