---
type: Diagnostic Method
title: A binding store can lose its contents, and an empty store looks exactly like the wrong store
description: Every one of a mod's registered hotkeys read as unbound in the central store, with the user unaware until the keys stopped working. The bound-to-total ratio is the cheap health signal - and "almost everything is zero, so this must not be where bindings live" is the wrong inference.
tags: [input, keybinds, cet, corruption, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T21:40:00-04:00" }
---

# A binding store can lose its contents, and an empty store looks exactly like the wrong store

A binding store is not a permanent record. Observed: **every one of a mod's
registered bindings reading `0` - unbound - in the central store**, with the user
unaware anything had happened until the keys stopped working in game. Rebinding
them in the mod's own UI wrote them back and restored the lot.

Nothing announced the loss. No log line, no error, no missing file. The store was
present, parseable and well-formed; it simply no longer held any keys.

## The cheap health signal is the bound-to-total ratio

The whole store, not one mod's slice:

> **bound entries / total entries, across every entry in the file**

A store that ships one row per registrable hotkey is mostly zeroes by design -
most people bind a handful. But there is a floor, and the floor is the entries
the user demonstrably uses. While broken, the ratio read **2 of 169**. Healthy on
the same install, with one mod's six hotkeys restored, it read 9 of 169.

The absolute count is not the signal - a small load order legitimately sits in
single digits. The signal is the ratio moving, or sitting at near-zero on an
install where the user is pressing keys every session.

## Record the wrong inference, because it is the natural one

Seeing almost everything at zero, the obvious reading is:

> "This file is not where bindings live. Look elsewhere."

**That was wrong.** It was exactly where those bindings lived, and it was empty.

This is worth holding onto because the two states are **indistinguishable from
the inside**. An empty store and a wrong store both present as: file exists,
parses cleanly, contains none of the keys you are looking for. Every instinct
then says "wrong file", and the search widens away from the answer.

What tells them apart is not the file. It is:

- **The zeroes are named.** A store holding one zeroed entry per hotkey a mod
  registered is not silent about that mod - it lists it. A genuinely wrong file
  does not know those hotkey names at all. `Advanced Control.lean_left = 0` is a
  claim about where that binding belongs.
- **The user's own testimony.** "These keys used to work" plus "the store that
  names them holds zeroes" is a loss, not a misdirection.
- **The rebind test.** Rebinding one key in the mod's UI and re-reading the store
  settles it in a minute: if the value lands there, that is the store.

## Do not treat "mostly zeroes" as noise to be filtered without counting it first

Filtering unbound entries out of a report is right - a store shipping its whole
hotkey table would otherwise render as mostly blank rows. But the filter destroys
the only measurement that would have caught this, so **count before you filter**,
and carry the ratio into the output. A sheet that says "9 of 169 bound" costs one
line and makes a silent emptying visible the next time somebody looks.
