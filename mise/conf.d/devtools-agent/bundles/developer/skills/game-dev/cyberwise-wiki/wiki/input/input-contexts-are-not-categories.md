---
type: Diagnostic Method
title: An input context is not a category, and a shared key is usually not a fault
description: Mods append themselves to every context they can find, so a first-match-wins classifier files a dialogue tool under "Vehicle". And because bindings scope to a context, one key legitimately carries several meanings.
tags: [input, keybinds, contexts, reporting]
status: stable
generated: { by: "claude", at: "2026-08-24T21:40:00-04:00" }
---

# An input context is not a category, and a shared key is usually not a fault

Every binding carries the input contexts it is live in - `Locomotion`,
`VehicleDriveBase`, `UIMenu` and so on. They look exactly like the categories a
hotkey sheet wants. They are not, and using them that way is wrong twice over.

## Mods register everywhere

A mod that wants its key live at all times appends itself to **every context it
can find**. Dialogue History declares `VehicleDriveBase`, `Locomotion`,
`CameraMovement` and `UIMenu` - so a first-match-wins classifier files a dialogue
tool under "Vehicle".

There is no reliable ordering to exploit. The set of contexts describes when the
key is *available*, which is a different question from what the key is *for*.

## Substring matching on context names is case-insensitive and hits action names

In PowerShell, `-match` is case-insensitive by default. A pattern like `'UI|Menu'`
matches the `ui` inside `AlwaysFirstEq`**`ui`**`p`. Use `-cmatch`, or anchor the
pattern - or better, do not infer the category from the string at all.

## Categorise the mod, not the context

Which situation a binding belongs to is a judgement about the **mod**. Make it
one, explicitly, and keep the raw contexts as reference data beside it. A
hand-assigned category that says "dialogue" is worth more than a derived one that
says "vehicle" with a mechanism behind it.

## A shared key is information, not a fault

Bindings scope to an input context, so one key legitimately carries several
meanings. `R` can reload a weapon, renew a chip and pick a pocket, because you
are never doing all three at once.

Report shared keys, but **as information rather than as faults**. A report that
flags every one of them as a conflict trains the reader to ignore the flag, and
the flag is then useless for the case that matters.

The ones that matter are two claimants on the same key **in the same context**,
and you cannot tell those apart without reading the contexts - which is the one
job the context data is actually good for.
