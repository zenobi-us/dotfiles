---
type: Game Mechanic
title: A player who crawls with no status icon has a stuck stat modifier, not a status effect
description: Movement speed and carry capacity are stat modifiers, and a modifier that failed to apply cleanly on load shows nothing in the UI, because only a status effect with UI data gets an icon. Clearing and re-applying the player's modifiers fixes it, and that fix is also the diagnosis.
tags: [stats, modifiers, status-effects, save-load, hud, diagnosis]
status: draft
generated: { by: "claude", at: "2026-08-25T13:05:00-04:00" }
---

# A player who crawls with no status icon has a stuck stat modifier, not a status effect

**Symptom.** After a save load, V moves at a crawl. Not overweight, not in
combat, no status effect icon anywhere on the HUD, nothing under the character
screen. Every mod that could plausibly slow the player is either not installed or
switched off.

**What it is.** A **stat modifier** on movement speed or carry capacity that did
not apply cleanly when the save loaded.

## Why nothing showed in the UI

The two things are not the same kind of object:

- A **status effect** can carry UI data, and that is what puts an icon on the HUD
  and a row on the character screen. An effect with no UI data has neither, and
  correctly so.
- A **stat modifier** is not an effect at all. It is an entry in the player's
  stat system. There was never going to be an icon for it, however long anybody
  stares at the HUD.

So "no icon" is not evidence that nothing is applied. It rules out one of the two
mechanisms and says nothing about the other.

## The fix is also the diagnosis

Toggling a debug **god mode** on and off cleared it. That is worth more than the
convenience, because of *why* it works: god mode **clears and re-applies the
player's stat modifiers**, so a fault that disappears by that route was living in
the modifier layer.

If the same toggle had made no difference, the modifier layer would have been
ruled out and the search would have moved to status effects, encumbrance, or the
animation/locomotion layer instead. Either outcome is information -
[a clean result proves more than a failing one](/diagnosis/a-failing-round-narrows-nothing).

## The red herring in the same session

A movement key that appeared to "make it worse" was not a movement key at all -
on that install it was bound by a mod to a teleport action, and the mod owning it
had nothing to do with movement speed. Before treating a key's behaviour as
evidence about a fault, find out what that key is actually bound to across all
the stores that hold bindings -
[a binding you cannot find is not a key that is free](/input/five-binding-stores).

## What was not verified

One occurrence on one install. What left the modifier in that state was never
established, so this is a recognisable symptom with a working clear rather than a
root cause. If it recurs, the thing worth capturing is a live dump of the
player's stat modifiers *before* clearing them - which is the only route to
naming what applied it.

## Related

- [Reading live game objects from CET Lua](/engine/cet-lua-runtime) - how to dump the applied effects and their UI-data column, which is what tells you an effect is present but iconless
- [Cyberware capacity is the "Humanity" stat family internally](/gameplay/cyberware-capacity-is-the-humanity-stat) - the other place a stat name and a UI label disagree
