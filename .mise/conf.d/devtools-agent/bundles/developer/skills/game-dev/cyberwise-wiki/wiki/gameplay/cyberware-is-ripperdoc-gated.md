---
type: Game Mechanic
title: Cyberware equip and unequip is ripperdoc-gated, and both console routes fail silently
description: Since 2.0 installing and removing cyberware happens only at a ripperdoc - an unequip request against the equipment area and a direct remove-from-slot are both rejected by design, with no error - and the two identifiers involved live in different namespaces, so mixing them up is a third silent no-op.
tags: [cyberware, equipment, slots, ripperdoc, console, namespaces, 2.0]
status: stable
generated: { by: "claude", at: "2026-08-24T22:40:00-04:00" }
---

# Cyberware equip and unequip is ripperdoc-gated

Since patch 2.0, installing and removing cyberware is something the **ripperdoc**
does. It is not a player-inventory operation with a convenience UI in front of
it, so there is no back door behind the UI to reach for. Both of the obvious
programmatic routes are rejected:

```lua
-- an unequip request against the equipment area: rejected
UnequipRequest with areaType = gamedataEquipmentArea.ArmsCW

-- a direct remove-from-slot: rejected
Game.GetTransactionSystem():RemoveItemFromSlot(player,
    TweakDBID.new("AttachmentSlots.ArmsCyberwareGeneralSlot"), true)
```

Both are syntactically valid. Both name identifiers that genuinely exist. Neither
raises an error, logs anything, or changes the character. The gate is a design
decision expressed in the equip path, and it does not announce itself.

## The lesson that outlives this one case

> **Verifying that an identifier *exists* in the scripts is not the same as
> verifying that the operation is *permitted*.**

Finding `ArmsCW` in the enum and `RemoveItemFromSlot` in the transaction system
proves the vocabulary is real. It says nothing about whether the systems behind
them will honour the call for this item class on this patch. The script dump
answers "does this name exist"; only running it answers "does this do anything",
and a silent rejection makes those two look identical from the outside.

## Two similar-looking identifiers, two different namespaces

The pair above is a standing trap, because both halves look like the right thing:

| identifier | what it is |
|---|---|
| `AttachmentSlots.ArmsCyberwareGeneralSlot` | an **attachment-slot** TweakDB ID |
| `gamedataEquipmentArea.ArmsCW` | an **equipment-area** enum member |

They describe adjacent concepts, they both exist, and passing one where the other
is expected produces **no error at all** - the call resolves, does nothing, and
returns as if it had worked. When an operation on cyberware slots comes back
clean and nothing changed, check which namespace each argument came from before
concluding anything about the gate.

## What to tell a player

Send them to a ripperdoc. There is no console route, and time spent hunting for
one is time spent looking for something the 2.0 design deliberately removed. If
the actual goal is how the arms *look* rather than what is installed, that is a
separate, unblocked path - arm appearances are independent of the hardware.

## Related

- [What the CET console can and cannot do](/authoring/the-cet-console-is-a-sandbox)
- [Cyberware capacity is the "Humanity" stat family internally](/gameplay/cyberware-capacity-is-the-humanity-stat)
- [The monowire quickhack slot is a Relic-tree milestone, and Phantom Liberty only](/gameplay/the-monowire-quickhack-slot-is-a-relic-milestone)
