---
type: Game Mechanic
title: Cyberware capacity is the "Humanity" stat family internally, and HumanityTotal does not exist
description: The UI calls it Cyberware Capacity; the stats are HumanityTotalMaxValue, HumanityAllocated and HumanityAvailable - and a query for the plausible-looking HumanityTotal reports unavailable on every run without ever raising an error.
tags: [stats, cyberware, capacity, humanity, statty-pe, console]
status: stable
generated: { by: "claude", at: "2026-08-24T22:40:00-04:00" }
---

# Cyberware capacity is the "Humanity" stat family internally

The number the UI labels **Cyberware Capacity** is carried by three stats whose
names never appear anywhere the player can see:

```
HumanityTotalMaxValue    -- the capacity the character has
HumanityAllocated        -- how much installed cyberware is consuming
HumanityAvailable        -- what is left
```

The name is a survival from the tabletop game's Humanity mechanic, and it is why
searching the scripts for "cyberware capacity" finds the UI strings and none of
the arithmetic. Search for `Humanity` instead.

## `HumanityTotal` does not exist, and asking for it fails silently

The obvious fourth name - the one you would guess from `HumanityAllocated` and
`HumanityAvailable` - is not a stat type. A probe that reads it does not throw,
does not log, and does not warn. It simply reports the stat as unavailable, on
every run, exactly as it would if the value genuinely could not be read from the
player at that moment.

That is the shape worth learning, because it generalises past this one stat:

> **A stat read that comes back unavailable *identically on every run* is much
> more likely a name that does not exist than a game state you have not met.**

A real stat that is merely unset or not yet applied varies with what the
character is doing. A misspelled one is unavailable at the main menu, in a save,
in combat and standing still. If a probe never once returns a value, stop
re-running it under different conditions and check the name against the shipped
script dump first.

## What this changes about reading capacity

Read `HumanityTotalMaxValue` for the cap and `HumanityAvailable` for headroom,
and do not derive one from the other - `HumanityAllocated` is maintained by the
equip path, so a computed "total minus allocated" reproduces a number the game is
already publishing and will disagree with it the moment anything else modifies
the stat.

## What was not checked

Which record or progression source *sets* `HumanityTotalMaxValue` was not traced.
The three stat names and the absence of `HumanityTotal` are what was established
here.

## Related

- [Checking a gameplay claim against the game's own scripts](/gameplay/checking-a-gameplay-claim-against-the-shipped-scripts)
- [The game ships its own API reference, and guessing a signature is slower than reading it](/authoring/reading-the-shipped-script-dump)
- [Cyberware equip and unequip is ripperdoc-gated, and the console attempts fail silently](/gameplay/cyberware-is-ripperdoc-gated)
