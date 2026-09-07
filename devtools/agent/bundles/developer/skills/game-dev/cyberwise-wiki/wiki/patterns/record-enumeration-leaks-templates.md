---
type: Interaction Pattern
title: A mod that enumerates records will hand the player abstract templates
description: Template records are valid records with no display data, so any mod that builds a pool by walking TweakDB rather than a curated list will distribute them as items.
tags: [tweakdb, loot, clothing, templates, opt-out]
status: stable
generated: { by: "claude", at: "2026-08-23T15:40:00-04:00" }
---

# A mod that enumerates records will hand the player abstract templates

**The symptom the player reports.** An item that equips but has no name, no icon
and no appearance. It shows in the equip screen but not in inventory and not in
the wardrobe. It cannot be sold or listed. Its record resolves perfectly.

That last part is what makes it confusing: the obvious theory is a *dangling*
record left by an uninstalled mod, and the obvious theory is wrong.

## Why it happens

Clothing mods that support the 2.0 customisation system define an abstract base
record that real variants inherit from:

```yaml
Items.SomeHelmet_CustomBaseIconic:
  $base: Items.Helmet
  blueprint: Items.FaceClothingBlueprint_Intrinsic
  tags: [ "SomeHelmetCustomModIconic" ]
  slotPartList:
  - Items.GenericRootSlotItem
```

No `entityName`, no `appearanceName`, no `displayName`. The coloured variants
that players actually wear are generated separately with `quality`, `icon` and
`color`, and they carry the display data.

The template is nonetheless a **fully valid record of its parent's type**. It
inherits a real item type from `Items.Helmet`, so anything filtering by
equipment area accepts it.

## The mechanism

A mod that builds its pool by walking TweakDB rather than from a curated list
picks the template up:

```reds
for record in TweakDBInterface.GetRecords(n"Clothing_Record") { ... }
```

If that walk is **opt-out** - everything is included unless tagged for exclusion
- then the templates are in, because authors tag the things players see, not
their own internal scaffolding.

This is the crux, and it is nobody's bug in particular. The distributing mod is
doing what it says. The clothing author did exclude their items - they simply
excluded the layer that exists, not the layer that is enumerable.

## How to confirm it

1. Read the item's record path from the live game rather than a screenshot. A
   template usually betrays itself in the name: a doubled word from a generated
   prefix, or a `_CustomBase` / `_Base` suffix.
2. Grep the tweaks for that record. If it is defined with a `$base` and no
   `displayName`, it is a template.
3. Check whether its *variants* carry the distributing mod's exclusion tag while
   the template does not. That asymmetry is the signature.

## Why it is not the other thing

A **dangling** record - mod uninstalled, instance left in the save - produces
similar symptoms but fails differently: the record does not resolve at all. If a
live inventory dump shows the record resolving, dangling is ruled out, and the
distinction decides the fix. A template is removed and the source disabled; a
dangling item is removed and nothing else can be done about it.

## The general form

**Opt-out enumeration over a type system that has abstract members will
distribute the abstract members.** It is not specific to clothing, to loot, or
to any one mod. Any pool built by walking records inherits every scaffolding
record anybody ever declared, and scaffolding is invisible precisely because it
was never meant to be seen.

When auditing a mod that enumerates: ask what it excludes, then ask whether the
things it should exclude are the things authors would have thought to tag.
