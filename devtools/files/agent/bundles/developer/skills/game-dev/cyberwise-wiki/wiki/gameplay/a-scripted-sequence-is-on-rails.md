---
type: Game Mechanic
title: A scripted sequence is on rails - teleporting during one crashes the game, and scene-tier features cannot fire
description: Vanilla behaviour with no mod involved: the quest system has no handling for the player leaving an on-rails sequence, so a teleport during one takes the game down - and the same sequence raises the scene tier, which correctly gates animations and clothing changes that then look broken.
tags: [quests, scenes, scripted-sequences, scene-tier, crashes, prologue, teleport]
status: stable
generated: { by: "claude", at: "2026-08-24T22:40:00-04:00" }
---

# A scripted sequence is on rails

An **on-rails scripted sequence** - the stretches where the quest system is
driving the player through a scene rather than letting them walk - has two
properties that between them explain a lot of apparently mod-caused misery.

## Teleporting during one crashes the game

This is **vanilla behaviour, with no mod involved**. The quest system has no
handling for the player leaving the rails mid-sequence, so a teleport during one
does not fail, does not snap you back, and does not log a complaint. It takes the
game down.

The reason it is worth knowing precisely is *where* it happens: on-rails
sequences are dense in the prologue, which is exactly the stretch of the game
people replay over and over while debugging a prologue mod, and exactly where
teleporting past a slow beat is most tempting. The resulting crash arrives in the
middle of a mod investigation, on an install full of suspects, and looks like
evidence about the mod. It is not.

**Before attributing a prologue crash to a mod, establish whether a teleport
happened during a scene.** If it did, that is the whole explanation and the
bisect is measuring nothing.

## The same sequence raises the scene tier

A scripted sequence raises the **scene tier**, and anything gated on scene tier
cannot fire while it is raised - animations, clothing changes, and other player
actions that the game restricts during story beats.

The general rule is worth more than the instance:

> **A feature that "does not work" during a story beat may be correctly gated
> rather than broken.**

The symptom is perfect: the mod is installed, it works everywhere else, and
during this one scene the key does nothing. Nothing errors, because nothing went
wrong - a gate the game owns declined the action. Test the same feature in free
roam before opening any investigation into why it "stopped working", because the
two states are indistinguishable from the player's side and only one of them has
a bug in it.

## Ruled out

For the crash: mods. It reproduces as vanilla behaviour, so removing suspects
does not change it, and a bisect run against it will exonerate and convict at
random depending on when the teleport happened.

For the gating: the mod being broken by a conflict. A scene-tier gate is not a
precedence problem, so reordering, purging and redeploying all leave it exactly
as it was.

## Related

- [A failing round narrows nothing, and a clean round proves everything](/diagnosis/a-failing-round-narrows-nothing)
- [Detecting a player action by matching its interaction text is matching on something another mod owns](/authoring/detecting-a-player-action-from-an-interaction)
- [Not every visual mismatch is a conflict](/conflicts/visual-bugs-that-are-not-conflicts)
