---
type: Engine Mechanic
title: Addressing one specific world object from redscript
description: EntityID.GetHash returns a Uint32 and will eventually match the wrong object, so addressing goes through a PersistentID built from the full 64-bit hash - and once you can address a thing, the discipline that stops a state-changing mod corrupting unrelated content is to undo only what you yourself did.
tags: [redscript, persistentid, entityid, world-state, quest-facts, authoring]
status: stable
generated: { by: "claude", at: "2026-08-24T21:15:00-04:00" }
---

# Addressing one specific world object from redscript

A mod that changes world state - sealing a door, disabling a device, moving a
thing - has to name the object it means. Two ways to get that wrong, both
silent.

## `EntityID.GetHash()` is a Uint32 and cannot identify an object uniquely

Comparing 32-bit hashes will **eventually match the wrong thing**, and when it
does the symptom appears somewhere unrelated to the mod. Address through a
**PersistentID built from the full 64-bit hash**, plus the component name:

```reds
let pid = CreatePersistentID(EntityID.FromHash(<64-bit hash>), n"controller");
let obj = persistency.GetConstAccessToPSObject(pid, n"DoorControllerPS") as DoorControllerPS;
persistency.QueuePSEvent(pid, n"DoorControllerPS", obj.ActionQuestForceCloseImmediate());
persistency.QueuePSEvent(pid, n"DoorControllerPS", obj.ActionQuestForceSeal());
```

**Measure the identifiers, do not guess them.** Class, entity ID,
persistent-state class and component name are all readable in the running game
with a CET probe. An entity ID invented from a plausible name addresses nothing,
and the failure is silent - no exception, no log line, no visible difference
from a mod that never ran.

## Order matters, and the failure looks like success

In the snippet above, sealing without closing first leaves the door **standing
open and merely un-interactable**. No error, no log line, and a screenshot that
looks broken rather than locked - so the report that comes back is "your mod
broke the door", and the actual defect is two statements in the wrong order.

Any sequence of state-change verbs is worth checking for this shape: an
operation that assumes a precondition the previous call was supposed to
establish, and that no-ops or half-applies instead of complaining.

## Only ever undo your own change

A state-changing mod must be able to tell **its** change from the game's. Track
it in a mod-owned fact, and revert only while that fact is set:

```reds
// set your own fact when you act, and only revert while it is set
```

Without that, a revert eventually unseals a door the game deliberately closed,
or re-enables something a quest disabled. The resulting bug appears **long
after**, in content that has nothing to do with the mod, which makes it one of
the most expensive classes of defect to trace back.

Two more rules from the same principle:

- **Gate on quest facts** so the change applies only in the window it belongs
  to, and add a listener on the fact that ends that window, so the mod stands
  down by itself rather than waiting to be noticed.
- **In a game where the gate conditions are false, no-op entirely.** Do not
  assume your own prior state. A fresh save, a rolled-back save, or a user who
  uninstalled and reinstalled all present a world your mod has never touched,
  and a mod that acts on assumed state changes something it did not set.

## Related

- [The game ships its own API reference, and guessing a signature is slower than reading it](/authoring/reading-the-shipped-script-dump)
- [Reading live game objects from CET Lua without losing the row that mattered](/engine/cet-lua-runtime) - the probe that measures the identifiers
- [What the CET console can and cannot do](/authoring/the-cet-console-is-a-sandbox) - why a quest fact set from the console does not survive a load
- [A .reds file on disk is not code the game is running](/engine/compiled-script-bundle)
