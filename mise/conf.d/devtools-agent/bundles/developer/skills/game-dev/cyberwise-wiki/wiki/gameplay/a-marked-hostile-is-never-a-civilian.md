---
type: Game Mechanic
title: A yellow-marked hostile is always a ganger or a corpo, never a civilian
description: The game never marks a bystander as a target. So a mod that penalises harming civilians does not restrict who you may shoot at - it makes the crossfire expensive, which is the opposite of how people describe it.
tags: [combat, civilians, targeting, hud, mods, encounters]
status: stable
generated: { by: "claude", at: "2026-08-24T23:28:00-04:00" }
---

# A yellow-marked hostile is always a ganger or a corpo, never a civilian

The yellow diamond the HUD puts over a hostile NPC is applied to **gang members and
corporate security only**. The game does not mark a civilian as a target. There is
no encounter where the marked enemies turn out to be bystanders.

That is a one-line fact with a consequence that reverses a common piece of advice.

## The consequence people get backwards

Mods exist that penalise killing civilians - reputation loss, a stat hit, a
narrative or humanity cost. The way that is usually described is *"be careful who
you shoot at."*

**That is not what it does.** You are never shooting at civilians, because the game
never offers one as a target. What the penalty actually taxes is **collateral
damage**:

- explosives and grenades in a street fight
- automatic fire that overpenetrates or misses
- a ricochet, a car that detonates, a hacked device
- anything with an area of effect used in an inhabited space

So the behavioural change such a mod produces is not caution about **aim**. It is
caution about **weapon class and position**. Fighting a gang encounter with a
launcher on a busy street becomes expensive; fighting the same encounter with a
rifle from a rooftop does not. A player told "watch your targets" will change
nothing, because their targets were never the problem.

## Why the wrong reading is believable

Every open-world game with a wanted system trains the expectation that hostiles and
bystanders are visually adjacent and easy to confuse. Here they are not: the
faction and the marking do the disambiguation for you, permanently and reliably.
The assumption survives because it is almost never tested - a player who never
attacks an unmarked NPC never discovers that the game was doing that work.

## Where the penalty comes from

Nothing in the base game charges you anything for a civilian death beyond police
attention - see
[Violence against civilians is economically inert in the vanilla sandbox](/gameplay/violence-against-civilians-is-economically-inert).
Any reputation, humanity or stat consequence is contributed by the mod layer, so
when a player reports one, that is the layer to look in.

## Scope

Read off encounter behaviour in game. Structural rather than patch-dependent - the
marking is tied to hostile faction assignment. A mod that adds hostile civilian
factions, or reworks the HUD marker, breaks it; ask before assuming a player's
observation is wrong.
