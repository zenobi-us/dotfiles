---
type: Authoring
title: A mod can delete vanilla behaviour by wrapping and not calling through
description: A netrunning overhaul wrapped the failed-breach path specifically to skip the base game's NPC alert, so a feature players thought was missing was in fact being suppressed - and the fix was to stop removing it, not to build it.
tags: [redscript, wrapmethod, vanilla, compatibility, method]
status: stable
generated: { by: "claude", at: "2026-08-26T13:45:00-04:00" }
---

# A mod can delete vanilla behaviour by wrapping and not calling through

`@wrapMethod` looks additive. It is not required to be. A wrapper that never
calls `wrappedMethod()` - or calls a grandparent's logic instead - **removes**
whatever the base game did there, and nothing in the game, the logs or the mod
list says so.

## The case that produced this article

A player wanted failed breaches to raise an alarm, and assumed it had to be
built. The base game already did it: the failure path calls
`SendMinigameFailedToAllNPCs()`, and every NPC on that network is told.

An installed netrunning overhaul wrapped that same method specifically to skip
the call. Its own source says why:

> *replaces instant alert with delayed traceback system (30-60s upload,
> interruptible). Vanilla alert behavior breaks stealth gameplay and removes
> tactical choices.*

That is a defensible design opinion. It is also a **feature removal that looks
like the game not having the feature**, and the player had been running it for
months believing failed breaches were consequence-free.

The fix was not to implement an alarm. It was to call `wrappedMethod()` and stop
deleting one.

## Why this is hard to notice

- **Nothing reports it.** No conflict scanner flags a wrapper for what it
  chooses not to call; the method is hooked exactly once and resolves cleanly.
- **The absence looks like the base game.** A player who has never played
  unmodded cannot tell "the game does not do this" from "something stopped it".
- **The log is silent** - suppressing a call produces no line anywhere.

## What to do about it

**When a feature seems missing, check whether something is suppressing it before
building a replacement.** Grep the installed scripts for wrappers on the method
that would produce it, and read whether they call through:

```
grep -rn "@wrapMethod(<Class>)" -A12 <scripts> | grep -L "wrappedMethod"
```

**When writing a wrapper, call through unless you mean to delete.** If you do
mean to delete, say so in a comment at the wrap site naming the vanilla call you
are removing and why - the next person reading it is trying to work out whether
the behaviour ever existed.

**And when forking a mod, audit its wrappers for suppressed calls.** They are
the parts of a fork you inherit without noticing, because they are invisible in
the diff between "the mod" and "the game" - there is no line to see.
