---
type: Game Mechanic
title: Clothing after 2.0 - it can never be junk, it carries no meaningful stats, and quality tier IS the scaling
description: Armour moved to cyberware and the wardrobe decoupled appearance from what is equipped, so post-2.0 clothing has no stat role - which leaves exactly two reasons an author marks a garment Legendary, and one clean test for whether a clothing mod's tiers mean anything at all.
tags: [clothing, quality, tiers, loot, iconic, wardrobe, 2.0, balance]
status: stable
generated: { by: "claude", at: "2026-08-24T22:40:00-04:00" }
---

# Clothing after 2.0

Two facts about the current game that a pre-2.0 mental model gets exactly
backwards, and both of them changed an answer that had already been given
confidently:

**Clothing can never be junk.** The junk quality is not reachable for a clothing
item. Advice built on "mark it above junk so it doesn't get scrapped" is
answering a problem the game does not have.

**Clothing does not carry meaningful stats.** Armour moved to **cyberware** in
2.0, and the **wardrobe** decoupled what a character looks like from what is
equipped. What remains on a garment is not a build input. Reasoning about a
clothing mod as though the numbers on the item feed into survivability is
reasoning about the pre-2.0 system.

## So why would an author still mark a garment Legendary?

Two reasons survive, and neither is about stats:

1. **The loot system rolls and scales low-quality items.** A garment left at a
   low quality is subject to that machinery; pinning the quality high takes it
   out of the roll.
2. **Iconic status pins the appearance** against the game's variant machinery,
   so the item keeps looking like the thing the author made rather than being
   substituted or re-rolled into a variant.

If a mod's tiering is not doing one of those two, it is decoration.

## Quality tier IS the scaling mechanism, which gives you a test

Since 2.0, the quality tier is *how* an item scales. That turns a vague question
about a clothing mod into a mechanical one:

> **Does the item family attach a different stat block per tier, or one stat
> block to every tier?**

If one block is shared across all tiers, **the item does not participate in
progression at all** - a Common piece and a Legendary piece of that family have
identical values, and the tier is a colour on the tooltip. That is the whole
test, and it is checkable from the records without playing anything.

Note the two findings compose: clothing stats do not matter much *and* a
one-block-per-family mod flattens what little scaling there is. Either alone is
survivable; together they mean a wardrobe mod's tiers are usually cosmetic and
should be described that way rather than sold as progression.

## What was corrected

Both facts above were first answered from the pre-2.0 system - clothing as an
armour slot with per-piece stats worth optimising - and had to be corrected
against the current game. That is the failure mode to watch for in this whole
area: the 2.0 overhaul moved a mechanic to a different subsystem rather than
tuning it, so old advice stays coherent, stays confident, and is wrong about
which system to look at.

## Related

- [A base cyberware record does not necessarily yield the lowest tier](/gameplay/a-base-record-is-not-a-base-tier-item)
- [A mod that enumerates records will hand the player abstract templates](/patterns/record-enumeration-leaks-templates)
- [Never guess a TweakDB record ID - the game writes the real list](/authoring/finding-the-real-record-id)
