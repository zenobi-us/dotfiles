---
type: Interaction Pattern
title: A settings file the game rewrites answers "what is set", never "what is default"
description: Mod settings live in two disjoint stores depending on how the mod was written, and neither of them is the mod's shipped defaults - reading the wrong file produces a confident, wrong answer.
tags: [settings, modsettings, cet, redscript, defaults, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T12:40:00-04:00" }
---

# A settings file the game rewrites answers "what is set", never "what is default"

Two questions get asked constantly, and they are answered by different files:

| question | read |
|---|---|
| what did the author ship? | `Config.reds` / `@runtimeProperty("ModSettings.*")` (redscript), `Defaults.lua` (CET) |
| what is it set to right now? | `red4ext\plugins\mod_settings\user.ini` (redscript), or the mod's own JSON under `bin\x64\plugins\cyber_engine_tweaks\mods\<name>\` (CET) |

Confusing the two runs in both directions, and both are damaging. Quote a
shipped default as the user's configuration and you describe an install that
does not exist. Quote live state as the default and you blame a mod for a
choice its user made.

## The half nobody remembers: there are TWO live stores

`user.ini` is the well-known one, and it is **only half the picture**. It holds
mods that opt into the shared Mod Settings system by annotating fields with
`@runtimeProperty("ModSettings.*")`. A CET Lua mod does not appear in it at all
- it persists to its own JSON inside its CET mod folder, under a filename the
author chose (`Settings.json`, `settings.json`, `mod_user_settings.json` have
all been seen).

**The cheap test, before concluding anything is at its default:**

```
grep -c "@runtimeProperty" <mod>/*.reds
```

Zero matches means `user.ini` will tell you nothing about this mod, and its
silence is a false negative, not evidence.

Some mods are both: a redscript half in `user.ini` and a CET half in its own
JSON. Checking one and stopping is how a setting that is plainly ON in the
game's own menu reads as absent on disk.

## Live state is written by the running game

A settings file the game rewrites is a snapshot, not a constant. Two
consequences that cost real time:

- **Date every value you record.** A settings table with no date is a claim
  about a moment that has already passed.
- **Editing it while the game runs is pointless** - the next save overwrites
  the edit. Changes go through the mod's own menu.

## Why this is worth a pattern rather than a footnote

An empty result reads exactly like a negative result. "It is not in `user.ini`"
and "it is at its default" produce the same silence, and only one of them is
true. The failure has no symptom: nothing errors, nothing logs, and the
resulting note is confident and wrong.

The same shape appears whenever configuration has more than one possible home.
Ask *which store this mod writes to* before asking *what the value is*.

## And once you have the right store, ask who wrote the value

Reading the correct file settles what the value **is**. It does not settle who
chose it. Mods populate their own settings at runtime - a first-run discovery
pass, a version migration, a framework persisting a control with no declared
default - so a value in a live store may never have been chosen by a person, and
a key missing from the defaults file is not evidence that one was. See
[A mod's shipped defaults are not proof a human chose anything](/patterns/defaults-can-be-written-by-code).
