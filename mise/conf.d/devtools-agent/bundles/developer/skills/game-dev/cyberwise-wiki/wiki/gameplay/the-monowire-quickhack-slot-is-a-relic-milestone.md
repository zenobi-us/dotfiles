---
type: Game Mechanic
title: The monowire quickhack slot is a Relic-tree milestone, and Phantom Liberty only
description: The extra quickhack slot on the monowire is granted by a Relic skill-tree milestone, Relic points come only from Dogtown data terminals, so a player without the expansion has never seen it - and the way it was found is worth stealing: to learn what grants something, read the code that takes it away.
tags: [cyberware, monowire, quickhacks, relic, phantom-liberty, progression, perks]
status: draft
generated: { by: "claude", at: "2026-08-24T22:40:00-04:00" }
---

# The monowire quickhack slot is a Relic-tree milestone, Phantom Liberty only

The additional quickhack slot associated with the monowire is not a property of
the cyberware and not an ordinary perk. It is a **Relic skill-tree milestone**,
and the Relic tree is expansion content:

- the Relic tree has **one milestone per arm cyberware**, each unlocking that
  arm's own upgrade;
- **Relic points come only from Dogtown data terminals**, which exist only in
  Phantom Liberty.

The consequence is the part that matters when somebody reports it missing: a
player who never bought or never entered the expansion has **no route to it at
all**, and nothing in the base game's UI explains the absence. "It should be
there and it isn't" is, for that player, correct behaviour.

## How it was found: read the refund path

The grant itself was hard to locate. The **refund** was not.

> **To find out what grants something, read the code that removes it.**

When points are refunded or a tree is reset, something has to walk back every
effect that was applied - and that teardown code enumerates exactly what the
progression granted, in one place, with the conditions attached. A grant is
usually scattered across records and unlock conditions; the undo is centralised
because it has to be exhaustive or the reset would leave the player with free
upgrades.

This generalises well past this feature. Any time "what turns X on?" is a
haystack, search for the removal, the reset, the respec, the teardown, the
uninstall - and read what it takes away.

## Status: what is confirmed and what is not

Read out of the scripts: that a Relic milestone grants the slot, and that the
milestone is one of a per-arm-cyberware set on that tree. The requirement chain
to Dogtown terminals for Relic points is the expansion's documented progression
rather than something re-derived here, and **no in-game check was made** that a
base-game character reaches the slot by no other path. Marked draft for that gap:
the mechanism is established, the "impossible without the expansion" claim is a
strong negative that was not exhaustively searched.

## Related

- [Cyberware equip and unequip is ripperdoc-gated](/gameplay/cyberware-is-ripperdoc-gated)
- [Checking a gameplay claim against the game's own scripts](/gameplay/checking-a-gameplay-claim-against-the-shipped-scripts)
