---
type: Interaction Pattern
title: A programmable mouse is a layer over the binding stores, not another store
description: The device performs no game action - it emits a keystroke, and the game or a mod decides what that means. The only useful output is a three-way join, and its most valuable row is the button whose keystroke nothing binds.
tags: [input, keybinds, hardware, icue, peripherals]
status: stable
generated: { by: "claude", at: "2026-08-24T21:40:00-04:00" }
---

# A programmable mouse is a layer over the binding stores, not another store

The binding stores answer *what the game does when this key arrives*. A
programmable mouse, keyboard or macro pad answers something else entirely:
*which physical button sends that key*.

**The device performs no game action.** A Corsair Scimitar, a Logitech G600, a
Razer Naga - none of them tells the game that a device button was pressed. They
emit a **keystroke**, and the game or a mod then interprets it exactly as if it
had come from the keyboard. Nothing in any binding store knows a mouse exists,
and no amount of harvesting will find the hardware half of the mapping.

So a device profile can never be listed *beside* the harvested bindings as
another set of controls. Listing it beside them teaches nothing. It has to be
**joined** to them:

> physical button &rarr; keystroke sent &rarr; what that keystroke is bound to

Print only the first two and you have printed the label the user typed into their
vendor software months ago. That is a memory, not evidence: the label can be
stale, the mod can have been rebound since, or the keystroke can be bound to
**nothing at all**.

## The dead button is the finding

A button whose keystroke nothing binds is DEAD. It does nothing in game, and in
the vendor configurator it looks identical to a working one - same label, same
assignment, same green tick. Nothing but the join will ever say so.

On one install, one of twelve thumb buttons was dead: it sent `=` while the mod
it was meant to drive was listening on `'`.

The join also catches drift in the other direction. A hand-written device sheet
labelling a button "night vision", next to harvested data saying that key toggles
the minimap, has just told you the label is stale.

## The join fails silently unless key names are canonicalised first

The vendor's vocabulary is not the game's, and it is not the mod's either. A
comparison of raw strings across the two halves reports **every** button as dead.
This is the single most common way the join is got wrong; see
[one key has four spellings](/input/one-key-four-spellings).

## Where the device half lives

Vendor configurators generally keep profiles in an internal database rather than
a readable file, so for most vendors the device map has to be **asked for** and
carried as supplied notes.

Corsair iCUE 5 is the readable exception. Its profiles sit under
`%APPDATA%\Corsair\CUE5\profiles` as `.cueprofiledata` files - XML despite the
extension, serialised by the cereal C++ library, so the root element is
`<cereal>` and everything repeated is `<value0>`, `<value1>`, ... Each action
splits into:

- `<first>` - the label the user typed, plus the `keyName` it emits
- `<second>` - the physical button (e.g. `MouseG9`) plus the event

`<second><key>` is routinely **empty**. That is an action left assigned to
nothing, and it should be carried through as such rather than invented into a
button.

Profile filenames are opaque GUIDs, so **say which profile the rows came from**.
A user with several has no other way to tell which one was read. iCUE records the
executables that auto-activate a profile in `linkedProgramsPaths`; a profile the
user pointed at the game themselves is a much better choice than "the first one
found", and it is not a guess.

## Do not assume there is a device at all

Most people have no programmable peripheral, and for them the harvested bindings
are the whole answer. Anything that reads a vendor profile must **degrade to
nothing**: no vendor folder, no profiles, or unreadable XML should each produce a
warning and zero rows, never an error. A hotkey sheet that fails to build over
the brand of somebody's mouse is worse than one that never mentioned mice.

For the same reason the device reader belongs **outside** the binding harvest,
not inside it. A binding harvest returns bindings; a mouse action is not a
binding, and mixing them is what erases the distinction this article exists to
make.
