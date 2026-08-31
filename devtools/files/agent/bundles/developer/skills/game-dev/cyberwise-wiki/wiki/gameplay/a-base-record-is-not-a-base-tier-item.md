---
type: Game Mechanic
title: A base cyberware record does not necessarily yield the lowest tier
description: Spawning the base monowire record produced a Tier 3 item - the record ID carries no tier information, so "the plain one without a suffix" is not the entry-level version of anything and cannot be assumed to be.
tags: [cyberware, items, tiers, quality, tweakdb, records, console]
status: stable
generated: { by: "claude", at: "2026-08-24T22:40:00-04:00" }
---

# A base cyberware record does not necessarily yield the lowest tier

Spawning the base monowire record gives you a **Tier 3** item. Not Tier 1, not a
common - Tier 3, checked on the item in the player's inventory in game.

```lua
Game.AddToInventory("Items.NanoWires", 1)   -- arrives at Tier 3
```

The intuition this breaks is a strong one: that a record family looks like
`Items.Thing`, `Items.Thing_Rare`, `Items.Thing_Epic`, `Items.Thing_Legendary`,
and that the unsuffixed one is therefore the bottom of the ladder. It is not a
ladder. The unsuffixed record is simply *a* record, and whatever tier the
designers attached to it is the tier you get.

## Why it bites

It bites in exactly the situation where nobody checks: handing somebody a console
line to get an item so they can test something else. They get the item, so the
command "worked", and the tier - which was never the point - quietly differs from
what everyone assumed. If a test depends on the tier at all, the whole test is
now measuring something else.

**The rule:** a record ID carries no tier information. If the tier matters,
verify it on the item after it arrives, rather than inferring it from the name
you typed.

## Ruled out

That the suffix convention is reliable in the other direction either. The
existence of `_Rare`/`_Epic`/`_Legendary` variants for one item family says
nothing about where the unsuffixed record sits relative to them, and there is no
naming rule that recovers it. The item's own quality, read after spawning, is the
only answer.

## Related

- [Never guess a TweakDB record ID - the game writes the real list](/authoring/finding-the-real-record-id)
- [Quality tier IS the scaling mechanism for clothing since 2.0](/gameplay/clothing-and-quality-after-2-0)
- [What the CET console can and cannot do](/authoring/the-cet-console-is-a-sandbox)
