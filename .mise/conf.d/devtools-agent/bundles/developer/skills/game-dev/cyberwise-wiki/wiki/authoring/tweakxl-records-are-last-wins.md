---
type: Engine Mechanic
title: A TweakXL record is resolved last-wins, and that is the lever for everything else
description: Resolution is per record, not per file and not per mod, so a folder named to sort last can redeclare another author's records and win without a conflict rule and without touching their files - and survive their updates, which a hand-edit does not.
tags: [tweakxl, tweakdb, yaml, override, load-order, authoring]
status: stable
generated: { by: "claude", at: "2026-08-24T21:15:00-04:00" }
---

# A TweakXL record is resolved last-wins, and that is the lever for everything else

TweakXL reads every `.yaml` / `.yml` under `r6\tweaks\`, recursively, and
applies them in order. **The unit of resolution is the record, and within a
record it is the field.** Two files that both declare `Items.SomeThing` do not
conflict and do not warn: each sets the fields it lists, and where they list the
**same** field the one applied later wins. Everything else each file declares
stays live.

That granularity is finer than "last file wins" and the difference matters in
both directions - it is what makes a one-field override possible, and it is why
two mods writing the same record are frequently not fighting at all.

That single fact decides how every "fix somebody else's tweak" job gets done,
because it is the only mod layer in this game with **partial** override
granularity. An `.archive` overrides per file inside it. A `.reds` and a CET
`.lua` can only be replaced whole. TweakXL is per record, which is the good
case, and it should be reached for first whenever the thing to change is a
record.

## What that buys you: the `zzz_` override

Because ordering is by path and the winner is the last one applied, a tweak
folder named to sort last redeclares another author's records and wins:

```
r6\tweaks\zzz_<yourname>_<what>\override.yaml
```

Three properties, and each of them is the reason to prefer this over the
alternatives:

- **No conflict rule.** Nothing has to be told about it - not a mod manager, not
  a load-order file, not the other author. There is no conflict to arbitrate,
  because both files load and only the record collides.
- **Their files are never touched.** No snapshot to keep, no in-place edit to
  remember, nothing for the user to un-remember later.
- **It survives their update.** This is the part a hand-edit cannot do. An edit
  to their `.yaml` is reverted the moment the mod updates, silently, and the
  behaviour the user was relying on comes back with no announcement. The
  override does not care that the file underneath it changed.

Declare **only the records you are changing.** The temptation is to copy their
whole file and edit two lines; that turns a per-record override into a per-file
one and hands you every disadvantage of replacing a `.reds`.

## A shared record is not a conflict - compare fields, not IDs

The same granularity produces a false positive that is easy to publish. A scan
that groups mods by the record IDs they write will report several mods
"duplicating" each other whenever they touch a popular record.

Worked case: four handling mods all wrote the same five vehicle records and were
flagged as duplicates. Reading what each one actually **set** settled it in
minutes - one wrote the slope-traction fields, one the steering-smoothing fields,
one the differential fields, one the handbrake and uphill helpers. **Disjoint
field sets on a shared record is a modular suite, not a fight**, and removing any
of them would have removed a feature rather than a redundancy.

So the diagnostic form of this article's first line: two mods writing one record
are in conflict **only over the fields they both declare**. Diff the fields
before telling anybody to uninstall something.

## The retire condition is not optional

The override's whole advantage - that it keeps winning through their updates -
is also its whole danger. If the author later ships the same fix, or a better
one, **your file quietly beats it forever** and nobody finds out. Two mods then
fight over one value and the loser is invisible.

So an override must say, in the file, what would make it obsolete:

```yaml
# RETIRE WHEN: <upstream mod> ships a non-zero <field> on <record> itself.
# Check by reading their <file>; if it is fixed there, delete this folder.
```

A retire condition that names a **checkable state** is worth having. One that
says "remove when no longer needed" is not - it defers the judgement to a reader
who has less context than you did.

Pair it with a registered hash of the upstream file, so a sweep reports
`CHANGED` when they ship a new version rather than leaving you to notice. The
full argument for that, and the override-versus-patch decision for the layers
that have no per-record option, is in
[Fixing a bug in someone else's mod](/install/overriding-another-authors-mod).

## Inherit with `$base`, do not name a type you cannot verify

When authoring a new record, inherit from **a real record of the kind you want**
rather than hardcoding an RTTI type name:

```yaml
Vendors.<your_new_slot>:
  $base: Vendors.<an existing inline stock slot>
```

`$base` copies a record the game already accepts, so the record type, the field
set and every field you did not think about are correct by construction. A
`$type` written from memory is a claim you cannot check, and when it is wrong
the record is rejected or - worse - accepted and inert.

## Failure is silent at every step

A record that does not exist, an ID with a typo, a field of the wrong shape: all
of these produce a mod that loads, logs nothing interesting, and does nothing.
Two checks cover almost all of it:

1. `red4ext\plugins\TweakXL\TweakXL-<date>.log` - your file should appear as
   read, with no error beneath it. An error there kills the **whole file**, not
   one record; see
   [One indentation error disables every record in a TweakXL file](/authoring/a-yaml-error-disables-the-whole-file).
2. Read the flat back at runtime from the CET console - the fastest positive
   confirmation there is:

```lua
print(TweakDB:GetFlat("<YourRecord>.<field>"))
```

## Related

- [One indentation error disables every record in a TweakXL file](/authoring/a-yaml-error-disables-the-whole-file)
- [Never guess a TweakDB record ID - the game writes the real list](/authoring/finding-the-real-record-id)
- [Fixing a bug in someone else's mod](/install/overriding-another-authors-mod)
- [There are two load-order systems, and a conflict scan only sees one of them](/engine/two-load-order-domains)
