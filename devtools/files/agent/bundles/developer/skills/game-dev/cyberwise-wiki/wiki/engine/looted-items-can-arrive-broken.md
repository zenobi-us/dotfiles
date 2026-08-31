---
type: Engine Mechanic
title: Looted gear arriving broken is two TweakDB flats, and the words on screen may belong to a different mod
description: brokenChance and brokenOverrideChance decide how often looted equipment drops in the broken state; a second mod can rename that state by redefining vanilla LocKeys, so the text the player quotes and the number that causes it are owned by different authors.
tags: [loot, tweakdb, tweakxl, lockey, economy, attribution]
status: stable
generated: { by: "claude", at: "2026-08-24T19:38:47-04:00" }
---

# Looted gear arriving broken is two TweakDB flats, and the words on screen may belong to a different mod

A player picks up a weapon and it is unusable - "broken", or "LOCKED", or
whatever their install calls it. Two facts settle nearly every question that
follows.

## The mechanic is two flats

```yaml
LootInjection.DefaultLootInjectionSettings.brokenChance: 0.5
LootInjection.DefaultLootInjectionSettings.brokenOverrideChance: 0.5
```

`0.5` is the vanilla value for both. They are ordinary TweakDB flats, so they are
**last-wins per record**: an economy overhaul lowers them (one sets both to
`0.35`), and a `zzz_`-prefixed folder setting the same two flats sorts last and
wins over it without touching the other author's file.

Both flats matter. Setting only `brokenChance` leaves the override path at its
old value, and the symptom barely changes.

## The words are not the mechanic

The state has display text, and **display text is a LocKey any loaded resource
may redefine**. A weapon mod can relabel the broken state - supplying "LOCKED"
and its own flavour wording - by overriding the vanilla keys, without touching
the chance at all.

So the sentence the player quotes points at the mod that owns the *wording*,
which is routinely not the mod that owns the *number*. Searching a mod list for
the word they saw finds the wrong author, confidently.

**Diagnose the two halves separately.** For "why does this happen so often",
read the flats. For "why does it say that", find the LocKey - see [Finding a
piece of text the player saw in game](/authoring/finding-in-game-text).

## When a mod's own toggle for this appears to do nothing

A mod exposing a "broken chance override" setting that visibly does nothing is
worth checking before assuming a conflict, because there is a shape of bug that
produces exactly this and leaves no log line. From one such mod's source:

```swift
let borkenChanceID = t"LootInjection.DefaultLootInjectionSettings.brokenChance";
TweakDBManager.SetFlat(borkenChanceID, brokenChance);   // correct
TweakDBManager.UpdateRecord(borkenChanceID);            // wrong: that is the flat id
```

**`UpdateRecord` takes the RECORD id, not the flat id.** Here it should be
`t"LootInjection.DefaultLootInjectionSettings"`. The flat is written and the
record is never rebuilt, so the game keeps serving the value cached at load. The
working idiom elsewhere in the same codebase is `SetFlat(recordID + t".field", v)`
followed by `UpdateRecord(recordID)`.

Two consequences worth carrying beyond this one mod:

- **A settings toggle can be inert because of its own code**, not because
  something is overriding it. A TweakXL file that appears to be "fighting" a
  mod's setting may be fighting nothing.
- **Where a mod writes flats at runtime, a static TweakXL value and the mod's
  setting are two hands on the same record.** If the mod is ever fixed, both
  become live at once and they will disagree. Anything set to work around such a
  bug needs a stated retire condition.

## What was not verified

The flat names, their vanilla `0.5`, and the last-wins stacking were read from
files on disk on patch 2.31. The `UpdateRecord` diagnosis is derived from reading
the mod's source and comparing it with a working sibling; the caching behaviour
it implies was not instrumented directly. The relabelling case is described from
a mod that documents doing it, not from an extraction of its LocKey overrides.

## Related

- [A TweakXL record is resolved last-wins, and that is the lever for everything else](/authoring/tweakxl-records-are-last-wins)
- [Finding a piece of text the player saw in game](/authoring/finding-in-game-text)
- [Fixing a bug in someone else's mod](/install/overriding-another-authors-mod)
