---
type: Game Mechanic
title: A cyberware name is flavour, not a specification - the three leg implants are the proof
description: Fortified Ankles is a charge jump, Reinforced Tendons is the double jump, and Lynx Paws is a stealth implant that does not touch jumping at all. Every one of those is guessable wrongly from the name, and an answer derived from the name is an answer derived from nothing.
tags: [cyberware, legs, jumping, stealth, naming, method]
status: stable
generated: { by: "claude", at: "2026-08-24T23:20:00-04:00" }
---

# A cyberware name is flavour, not a specification

The three legs-slot implants are the cleanest demonstration in the game that an
implant's name is **marketing copy from inside the fiction**, not a description of
what it does.

| implant | what the name suggests | what it actually does |
|---|---|---|
| **Fortified Ankles** | ankle reinforcement - a defensive or fall-damage implant | **charge jump**: hold to charge, release for distance |
| **Reinforced Tendons** | more spring, so higher jumps | **double jump** |
| **Lynx Paws** | claws, climbing, something about grip | **stealth**: ~50% quieter movement, ~20% less fall damage, +6-12% crouched movement speed |

Read the middle column and every one of them is plausible. That is the whole
problem: the names are not random, they are *thematically adjacent* to a real
effect, so a guess feels like a deduction.

## What actually went wrong

Asked which leg cyberware did what, an assistant assigned effects from the names -
"Reinforced Tendons" got the jump-height buff because tendons are springs, and
"Fortified Ankles" got something defensive because fortification is defensive. Both
were wrong, and both were wrong in the *specific* way that reads as knowledge
rather than as a guess. The user, who plays the game, corrected it and said to go
and read.

Note where the fall-damage reduction really sits: on **Lynx Paws**, the stealth
implant, and not on the one named after ankles. If any single fact here were going
to be guessable, it was that one, and the guess is still wrong.

## The generalisation

> **A cyberware name in this game is in-world branding. It carries no reliable
> information about the implant's effect, its slot, or its stat.**

The setting is one where implants are consumer products sold by corporations, and
the naming reflects that - it is written to sound good on a ripperdoc's screen.
Treating it as a specification is the same category error as reading a mod's
folder name as a description of what the mod does.

The same trap runs the other way inside the engine: the stat behind the UI's
"Cyberware Capacity" is called
[`HumanityTotalMaxValue`](/gameplay/cyberware-capacity-is-the-humanity-stat), which
is a name no player will ever see and which describes a tabletop mechanic rather
than the thing it now measures. Names in this game - player-facing and internal -
are historical and commercial artefacts, in both directions.

## What to do instead

- **Read the implant's own in-game description**, on the ripperdoc screen or in the
  cyberware menu. It is the authoritative statement of the effect and it takes
  seconds.
- **Or read the record**, when the question is precise enough to need numbers -
  see [Checking a gameplay claim against the game's own scripts](/gameplay/checking-a-gameplay-claim-against-the-shipped-scripts).
- **Never answer "what does X do" from X's name**, and if that is all you have,
  say so. "I would be guessing from the name" is a complete answer and costs one
  line.

## Confidence and scope

The three effects above were confirmed by a player reading them in game. The
percentages on Lynx Paws are the ranges the implant's own description gives across
its quality tiers, so treat the exact figures as tier-dependent rather than fixed;
the *identities* - which implant is the charge jump, which is the double jump,
which is the stealth one - are the durable part.

Cyberware effects and tier scaling are re-tuned between patches. The naming
lesson is not.
