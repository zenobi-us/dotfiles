---
type: Engine Mechanic
title: Never guess a TweakDB record ID - the game writes the real list
description: TweakXL emits a string table containing every record and flat name, so the ID can be looked up rather than invented; and it has to be, because CDPR's naming is inconsistent enough that a plausible guess is usually wrong and always silent.
tags: [tweakxl, tweakdb, record-id, string-table, authoring, silent-failure]
status: stable
generated: { by: "claude", at: "2026-08-24T21:15:00-04:00" }
---

# Never guess a TweakDB record ID - the game writes the real list

The single biggest time sink in tweak authoring is inventing a plausible-looking
TweakDB ID. A guessed ID produces a mod that **loads clean, logs no error, and
silently does nothing** - which is indistinguishable from a dozen other
failures, so the wrong ID is usually the last thing anybody suspects.

The real list exists on disk. Read it.

## Where the list is

TweakXL writes a string table under:

```
r6\cache\modded\
```

It is a `.str` file, and **its exact name carries an expansion suffix on a
Phantom Liberty install** (`tweakdb_ep1.str`), so a check that hardcodes the
base-game name reports the file as missing on a machine that has it.

It is a plain string table: every TweakDB record name and every flat name,
hundreds of thousands of entries. Extract the printable ASCII runs out of it and
you have a searchable ID list with no tooling beyond a text search.

**It only exists once TweakXL has run.** If it is not there, that is not a
finding about record IDs - it means TweakXL is not installed, or the game has
not been launched since it was.

## Why looking it up is not optional

CDPR's naming is genuinely inconsistent, in ways no convention predicts:

```
Items.ContagionLvl2Program      # noun, then Lvl
Items.OverheatProgramLvl2       # Lvl, then noun
```

Those are two records of the same kind, from the same system, shipped in the
same game. There is no rule that generates both. Anyone deriving the second from
the first gets it wrong, and gets no feedback - it is a valid string, it just
names nothing.

Verify **every** ID against the dump before shipping a `.yaml`. This is cheap
and it is the difference between a tweak that works and an evening spent
debugging load order.

## And re-verify after a patch

Record IDs move between game versions. An ID noted under one patch is a lead on
another, not a fact. Read the installed version before reusing anything written
down:

```powershell
(Get-Item "$GameRoot\bin\x64\Cyberpunk2077.exe").VersionInfo.ProductVersion
```

If it differs from the stamp on whatever note you are reading, re-extract. This
is the highest-drift area in the whole modding surface - record IDs, vendor
stock structure and price component names have all moved.

## Confirming the ID resolved

Two checks, in order of cost:

1. `red4ext\plugins\TweakXL\TweakXL-<date>.log` - your file read, no error
   beneath it. (An error there kills the whole file: [One indentation error
   disables every record in a TweakXL
   file](/authoring/a-yaml-error-disables-the-whole-file).)
2. Read the flat back at runtime from the CET console. Read-only, safe, and the
   fastest positive confirmation that a tweak actually applied:

```lua
print(TweakDB:GetFlat("<YourRecord>.<field>"))
print(#TweakDB:GetFlat("Vendors.<id>.itemStock"))
```

A `nil` there is a real answer: the record or flat does not exist under the name
you used.

## Related

- [A TweakXL record is resolved last-wins, and that is the lever for everything else](/authoring/tweakxl-records-are-last-wins)
- [Vendor stock and item pricing are both arrays of records, not values](/authoring/vendor-stock-and-pricing)
- [What the CET console can and cannot do](/authoring/the-cet-console-is-a-sandbox)
