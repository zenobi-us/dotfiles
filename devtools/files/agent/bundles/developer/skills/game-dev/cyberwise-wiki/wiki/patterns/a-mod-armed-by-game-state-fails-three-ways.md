---
type: Interaction Pattern
title: A mod armed by game state fails three ways, and all three read as "the mod is broken"
description: Big systems mods arm themselves off a quest fact or a world event rather than off being installed. So a mod that is correctly waiting is indistinguishable from one that is switched off, flipping a fact to start one system can start an unrelated one, and any mod that removes the world event disarms every mod watching for it.
tags: [quest-facts, gating, activation, needs-mods, cross-mod, prologue, patterns]
status: stable
generated: { by: "claude", at: "2026-08-25T11:20:00-04:00" }
---

# A mod armed by game state fails three ways, and all three read as "the mod is broken"

Large gameplay mods - survival needs, rent, reputation, humanity - do not start
because they are installed. They **arm themselves off game state**: a quest fact
being set, a story beat completing, or a vanilla world event such as the player
first entering their apartment.

That is good design, and it produces three distinct failures that all arrive
worded as *"I installed it and nothing happens"*.

## 1. Waiting and switched off are identical on disk

A master switch reading `false`, and a system that is correctly dormant because
the story has not reached its trigger, **produce exactly the same files**. There
is no field anywhere that distinguishes them.

So a documentation or audit pass that reads settings off disk will report "the
entire system is inert" with total confidence, for a mod that is working
perfectly. Only the player knows where they are in the story.

**Write the finding as a question, not a fault**: *this system reads as off - is
that expected at your point in the story, or did it never start?* One sentence,
and it is the difference between a useful report and a wrong one.

The related trap is a **master kill-switch**, which several large mods have and
which is checked in every subsystem. When one of those is off, every setting
beneath it is inert, so it is the lead finding rather than a footnote - a
two-hundred-setting diff below a switch that is off describes nothing.

## 2. Quest facts are shared state, so arming one system arms others

Facts are a global table, and more than one mod reads any interesting one.

Worked case: a needs system was made to start early by setting the fact it waits
on. That also started a **rent system**, which promptly evicted the player from
the apartment they were living in mid-prologue. The player had already
established that the vanilla path never did that - they had waited 96 in-game
hours specifically to check.

Before flipping a fact to arm feature A, find what else reads it. And do not
guess what a fact means from its name -
[a fact name is an author's shorthand](/authoring/the-cet-console-is-a-sandbox),
and one that reads like an enable can be a suppression signal.

## 3. Any mod that removes the world event disarms every mod watching for it

The most invisible of the three. Several needs mods arm when V first enters their
apartment. A prologue-extension mod removes apartment access for that entire
stretch. Result: **no error, no log line, no warning** - just an absent needs
system during exactly the period when it would have bitten hardest.

The general form: **a mod gated on a vanilla world-state event is vulnerable to
any other mod that removes, defers or replaces that event.** Neither mod is
broken and neither declares an incompatibility, because from each mod's point of
view nothing went wrong.

Whenever a story-content mod is installed alongside a systems mod, ask which
world events the systems mod is waiting for, and whether the content mod still
delivers them.

## The corollary: an unlocked interaction is not an enabled feature

The same shape one level down. Unlocking "use a computer anywhere" or "watch TV
anywhere" during a stretch of the game where the backing quests are not running
puts the prompts in the interaction wheel and **nothing happens when they are
chosen** - each is driven by a quest that has to be live.

The attempted fix made it worse: resetting the quests removed them from the
running list and broke the one interaction that had been working. An interaction
is a front end for quest machinery, and adding the front end does not add the
machinery.

## Related

- [A scripted sequence is on rails](/gameplay/a-scripted-sequence-is-on-rails) - the vanilla version of a feature that is correctly gated off and looks broken
- [A settings file the game rewrites answers "what is set", never "what is default"](/patterns/live-state-is-not-defaults)
- [What the CET console can and cannot do](/authoring/the-cet-console-is-a-sandbox) - quest facts live in the save, and a fact set from the console is discarded at the next load
- [Two mods can rewrite the same quest node, and no conflict scan sees it](/conflicts/quest-graph-interceptions) - how a content mod changes which events fire at all
