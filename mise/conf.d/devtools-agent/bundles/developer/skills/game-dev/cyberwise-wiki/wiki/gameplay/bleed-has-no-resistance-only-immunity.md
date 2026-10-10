---
type: Game Mechanic
title: Bleed has no resistance axis at all - only binary immunity
description: The game defines graded resistance stats for exactly three damage types (chemical, electric, thermal); there is no physical and no bleeding resistance, so bleed lands at full value against anything that is not outright immune while elemental damage is scaled down by resistances that climb on tougher enemies.
tags: [stats, damage, status-effects, bleeding, resistance, immunity, balance]
status: draft
generated: { by: "claude", at: "2026-08-24T22:40:00-04:00" }
---

# Bleed has no resistance axis at all - only binary immunity

Reading the stat definitions rather than a balance guide turns up an asymmetry
that changes how a bleed build should be judged: **graded resistance exists for
exactly three damage types, and bleeding is not one of them.**

The resistance stats the game defines are chemical (which additionally has a
separate *reduction* stat), electric, and thermal. There is **no physical
resistance stat and no bleeding resistance stat**. Bleeding appears in the data
only as **immunity flags** - a binary, on or off.

## Why that matters in play

The two axes behave completely differently as the enemy gets tougher:

| effect | how a tough enemy resists it |
|---|---|
| chemical / electric / thermal | a resistance value that **scales up**, shaving a growing percentage off every application |
| bleeding | either immune, or takes it **at full value** |

So a bleed effect that reads as modest on paper does not decay against harder
targets the way an elemental one does. Against anything not flagged immune, the
number in the tooltip is the number that lands. The practical read: elemental
damage is a curve that flattens, bleed is a step function.

## The immunity/resistance split is deliberate, not an oversight

The engine also models immunity-**piercing** as a designable property - something
that exists only if binary immunity is the intended mechanic for these effects
rather than a placeholder for a resistance value nobody got round to adding. Two
mechanisms, each with its own counterplay, is the design.

## What was ruled out

That bleeding "just uses physical resistance" - there is no physical resistance
stat to use. Every damage type without an entry in the resistance list is
unresisted, not resisted by a general-purpose stat.

## Status: what is confirmed and what is not

**Confirmed:** the stat definitions - which resistances exist, that bleeding
resistance is absent, and that bleeding immunity is a flag.

**Not confirmed:** *which enemy records actually set the immunity flags*, and at
what frequency. The conclusion "bleed is strong against most things" follows only
if bleed immunity is rare, and that was never enumerated. Treat the mechanism as
established and the balance implication as untested until somebody counts the
records that carry the flag.

## Related

- [Checking a gameplay claim against the game's own scripts](/gameplay/checking-a-gameplay-claim-against-the-shipped-scripts)
- [Cyberware capacity is the "Humanity" stat family internally](/gameplay/cyberware-capacity-is-the-humanity-stat)
