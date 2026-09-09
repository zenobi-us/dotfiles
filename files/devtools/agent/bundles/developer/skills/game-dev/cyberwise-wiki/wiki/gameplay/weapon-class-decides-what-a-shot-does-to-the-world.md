---
type: Game Mechanic
title: Tech rounds go through cover, power rounds bounce off it, and there is no throw or whistle verb
description: The same three-way weapon class that decides whether a weapon can be suppressed also decides what a shot does to geometry - which makes some fights winnable from a position the enemy cannot answer from, and quietly breaks any mod that assumes enemy difficulty gates the loot.
tags: [weapons, combat, stealth, tech, power, smart, encounters, loot-mods]
status: draft
generated: { by: "claude", at: "2026-08-25T11:20:00-04:00" }
---

# Tech rounds go through cover, power rounds bounce off it, and there is no throw or whistle verb

Weapons fall into three classes, and the class is not cosmetic:

- **Power** - rounds **ricochet** off hard surfaces.
- **Tech** - rounds **penetrate** surfaces, including ones the player is standing
  behind.
- **Smart** - rounds home on a target.

It is the same split that decides suppression, where only power weapons take a
muzzle at all -
[only power weapons take a muzzle](/canon/muzzle-slots-and-suppression).

## The consequence in a fight

Demonstrated concretely: standing under a metal grating and firing a **tech**
pistol upward kills the enemy standing on it. He cannot answer, because he is
carrying a **power** weapon and his rounds ricochet off the same grating.

Generalised, the geometry is a real tactical axis:

- Any enemy carrying tech **can** shoot back through that cover, so knowing what
  they carry decides whether a position is safe or merely feels safe.
- Staircase corners funnel enemies above the player into a single line of fire
  the same way.

## Why this matters to a modded install

**A loot mod that keys drop quality to enemy archetype assumes enemy difficulty
gates access to that loot.** A player who kills far-above-level enemies through
positioning - through a floor, through a grate, from an angle nothing can reply
to - bypasses the gate completely, and ends up carrying high-tier gear at level
one.

Such a mod is not misconfigured. Its central assumption is being violated, and no
amount of tightening the variance rolls changes that; the lever that works is the
per-archetype tier assignment, which is what actually sets the baseline. This is
a common and confusing support case: everything is set correctly and the outcome
is still wrong.

## What the verb set does not contain

Advice imported from other stealth games names verbs this game does not have:

- **No generic pick-up-and-throw.** There is no bottle to throw at a wall.
- **No whistle, no lure.**

What actually distracts: a suppressed shot into a nearby surface, triggering an
explosive or a vehicle alarm, an environmental interactable, a quickhack on a
device, waiting out a patrol, or taking a different way in. Non-lethal takedowns
from behind and the detection meter's grace window do the rest.

Stating this plainly is worth more than it looks, because the missing verbs are
the ones people spend the longest hunting through the controls menu for.

## What was not verified

The ricochet and penetration behaviour was demonstrated in play. The absence of a
throw and lure verb was established from play and the controls, not by searching
the shipped scripts, so it is a negative only as wide as those layers -
[an empty result is not a finding](/process/an-empty-result-is-not-a-finding).
A mod can add either verb.

## Related

- [Only power weapons take a muzzle](/canon/muzzle-slots-and-suppression) - the same class split, for suppression
- [A yellow-marked hostile is always a ganger or a corpo](/gameplay/a-marked-hostile-is-never-a-civilian) - what the crossfire from any of this actually costs
- [Checking a gameplay claim against the game's own scripts](/gameplay/checking-a-gameplay-claim-against-the-shipped-scripts)
