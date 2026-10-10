---
type: Engine Mechanic
title: The game's own option registry outranks any mod's account of an engine setting
description: UserSettings.json declares every option the engine exposes - its group, type, permitted values, default and current index - which settles questions no mod file can, including whether an option exists on this patch at all.
tags: [settings, usersettings, options, graphics, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T18:30:00-04:00" }
---

# The game's own option registry outranks any mod's account of an engine setting

```
%LOCALAPPDATA%\CD Projekt Red\Cyberpunk 2077\UserSettings.json
```

Every option the engine exposes is declared here - graphics, gameplay, and
hidden entries with no menu control - each with its group, its type, its
permitted `values`, its `default_index`, and the user's current one.

That declaration is **the game speaking about its own option**, which settles
three questions nothing else can:

- whether an option exists on this patch at all
- what it is permitted to be set to
- whether a mod that writes it is writing something real

## A mod's labels describe the mod, not the engine

Mods that drive engine settings ship their own names, comments and tooltips for
them. Those are the author's shorthand, and they routinely misstate what a
setting reaches or what gates it.

The specific failure: **a label naming a feature does not mean the option only
acts while that feature is on.** Gating is a property of the engine. Only this
file and the game's own behaviour can tell you about it - a section heading in a
mod's config cannot.

Treat a mod's label as a lead. Read the registry before accepting it.

## "That setting does nothing" is a claim about layers

A control can reach the game through at least four separate layers:

1. the mod's own config files
2. the option registry above
3. a second control in the same mod writing into the same subsystem
4. a native plugin doing it in compiled code, where no text search will find it

Finding nothing in the first says nothing whatever about the other three. **A
negative is only as wide as the layer that was searched**, so report "nothing in
`<layer>`", never "nothing".

This is also why an author contradicting a reading is worth taking seriously
without taking as proof. Authors describe old versions and misremember their own
controls - but a contradiction is the strongest available signal that a label
was trusted or a layer was never opened. Re-derive at the authoritative source.
Defending a reading you cannot support and folding to a claim you have not
checked cost the same turn, and neither establishes who was right.

## Related

- [A settings file the game rewrites answers "what is set", never "what is default"](/patterns/live-state-is-not-defaults)
- [A mod's shipped defaults are not proof a human chose anything](/patterns/defaults-can-be-written-by-code)
