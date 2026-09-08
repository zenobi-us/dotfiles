---
type: Game Canon
title: A weapon can exist only in a shard, and killing its owner drops something else
description: A shard names the Arasaka snipers' rifles the "JSH-X12 Nobunaga"; shoot the sniper carrying one and the corpse drops a different, real weapon. Lore-only naming is a real category, and it is not a bug.
tags: [canon, weapons, shards, arasaka, naming, lore]
status: stable
generated: { by: "claude", at: "2026-08-24T20:27:00-04:00" }
---

# A weapon can exist only in a shard, and killing its owner drops something else

**Some named equipment in this game exists as text and nothing else.** It is
described, named, attributed to a unit - and there is no item record behind it.
The game is not being inconsistent; it is writing flavour.

## The case

A readable shard names the rifles carried by Arasaka's snipers:

```
JSH-X12 Nobunaga
```

Kill one of those snipers and loot the body, and what drops is **a different
weapon** - a real, ordinary item with its own name that exists in the game's
records.

Both are true at once. The shard is in-game text and therefore a legitimate
source; the loot table is the game's item data and therefore also a legitimate
source. They simply are not describing the same layer.

Note in passing that the name fits the convention exactly - a warlord, applied to
Arasaka hardware, precisely as
[the naming heuristic predicts](/canon/arasaka-naming-and-the-american-branch).
A name passing the plausibility test is not evidence the object exists. This is
the counterexample that proves it.

## Why it matters practically

**Three different mistakes come out of not knowing this category exists:**

1. **Hunting an item that has no record.** Somebody reads the shard, wants the
   rifle, and searches the item database, mod lists and vendor stock for
   something that was never implemented. Hours, and no artefact at the end,
   because a search for a nonexistent record looks identical to a search done
   wrong.
2. **Reporting it as a mod conflict.** "The sniper is dropping the wrong weapon"
   is a perfectly reasonable-sounding bug report about a load order, and it will
   survive a full bisect, because there is no mod to find.
3. **Writing it into a character document as equipment.** V cannot carry one. A
   dossier that lists it as V's rifle is describing an item that does not exist.

## The general rule

**In-game text and the game's item data are separate sources, and either can
carry a name the other does not.** When a name comes from a readable, the
question "does this exist as an object" is a *separate* question with a separate
answer, and it is answered from TweakDB rather than from prose - see
[Never guess a TweakDB record ID](/authoring/finding-the-real-record-id) for
getting the real list rather than a plausible guess.

The reverse also happens, and is more common: an item record exists with a
display name that no readable ever mentions.

## For character work

Lore-only names are **excellent** material and should be used - as things a
character has *heard of*, been shot at by, or claims to have owned. That is what
they are for. They just cannot appear on an equipment list as though a player
could put one in a stash.

## Scope

Read off one shard and one loot outcome in game. No patch dependency for the
principle. The specific pairing is worth re-checking after a major content patch,
which is exactly the kind of thing that quietly adds an item record for a name
that previously had none.
