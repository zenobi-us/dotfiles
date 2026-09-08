---
type: Game Mechanic
title: The vanilla consumable quick slot takes only health items
description: There is exactly one consumable-to-quick-slot mapping in the base game and it is the health item - there is no vanilla hotkey path for using an arbitrary consumable, which is why mods that add consumable animations fire from the inventory rather than from a bind.
tags: [consumables, quick-slots, hotkeys, inventory, ui, gaps]
status: draft
generated: { by: "claude", at: "2026-08-24T22:40:00-04:00" }
---

# The vanilla consumable quick slot takes only health items

The quick slot that consumables appear to use is not general-purpose. Reading the
mapping rather than the UI turns up **exactly one** consumable-to-quick-slot
association, and it is the health item. Everything else in the consumable
category - the food, the drinks, the boosters - has no bind path in the base
game. You open the inventory and use it there, or you do not use it.

## Why this is worth writing down

It explains two things that otherwise look like sloppiness:

- **Mods that add consumable-use animations fire from the inventory rather than
  from a key.** That is not the author taking a shortcut. There is no vanilla
  hook on a bind to hang the animation off, because there is no bind.
- **"A hotkey that uses any consumable" is a genuine gap, not an oversight in
  somebody's mod.** A request for one is a request to build the missing
  mechanism - register an input action, decide what "the current consumable"
  means, and drive the use from there - not to wire up something the game already
  has.

Knowing which of those two a request is decides whether the answer is twenty
minutes or a small mod, so it is worth settling first.

## What was ruled out

That the slot is generic and merely filtered by a category flag somewhere - the
mapping is specific, not a category with one member on the whitelist. Also that
the UI is the constraint: the restriction is in the mapping, so an unlocked or
re-skinned UI would not produce a working general consumable bind on its own.

## Status: the shape of the negative

The positive finding - the single health-item mapping - was read directly. The
negative - *no* vanilla hotkey path for any other consumable - is only as wide as
the layers searched, and the search covered the quick-slot mappings and the input
actions around them. A separate subsystem granting a use-by-bind path to some
specific consumable elsewhere would not have shown up. Draft until somebody
either finds one or sweeps the remaining layers.

## Related

- [Five separate stores hold key bindings, and no single one answers what a key is bound to](/input/five-binding-stores)
- [An input context is not a category, and a shared key is usually not a fault](/input/input-contexts-are-not-categories)
- [Checking a gameplay claim against the game's own scripts](/gameplay/checking-a-gameplay-claim-against-the-shipped-scripts)
- [An empty result is the absence of evidence](/process/an-empty-result-is-not-a-finding) - the shape of the negative this article states, and how wide it is
