---
type: Authoring Recipe
title: Giving a mod its own LocKeys, without authoring a CR2W from a guess
description: A caption on a TweakDB record is a LocKey, not text, so a raw string renders as a placeholder. Shipping your own keys means packing an onscreens resource - and the way to get its structure right is to copy a mod already working on the install, not to infer the schema.
tags: [localization, onscreens, archivexl, tweakxl, wolvenkit, cr2w, lockey, authoring]
status: stable
generated: { by: "claude", at: "2026-08-29T00:30:00-04:00" }
---

# Giving a mod its own LocKeys, without authoring a CR2W from a guess

A TweakDB record's `caption`, `description` and `displayName` are **LocKeys**, not
display text. Writing words there does not produce untranslated words - it
produces a key that resolves to nothing, and the UI falls back to a placeholder.
One mod shipped `caption: "NETWORK ACCESS"` for nine versions and the breach
screen read **"Program"** with the description **"Program Name"** the whole time.

The game resolves it in one line - `hackingMinigameUtils.script:854`:

```
program.name = StringToName( LocKeyToString( miniGameActionRecord.ObjectActionUI().Caption() ) );
```

`LocKeyToString` takes a key. Hand it prose and nothing comes back.

## Two ways out, and the cheap one is often right

**Borrow a vanilla key.** Extract the game's own strings and find one that already
says what you mean:

```
WolvenKit.CLI.exe unbundle "<game>\archive\pc\content\lang_en_text.archive" -o <out> -w "*onscreens*.json"
WolvenKit.CLI.exe convert serialize <out>\base\localization\en-us\onscreens\onscreens_final.json -o <out>
```

60,303 entries, each with a `primaryKey` (the number in `LocKey#78403`), a
`secondaryKey`, and the text. The naming convention is regular enough to search
directly: `Gameplay-Devices-Interactions-<RecordName>` is the caption of
`Interactions.<RecordName>`, and `...-<RecordName>Desc` its description.

This needs **no archive at all** and comes pre-translated into every language the
game ships. Prefer it whenever the game already has a phrase for what you are
doing.

**Ship your own.** Needed when the vanilla phrasing belongs to a different
feature and would misdescribe yours.

## Copy a working mod's structure; do not infer it

This is the part that costs an evening. An onscreens resource is a **CR2W**
binary despite its `.json` extension, and a malformed one can crash the game
during ArchiveXL's merge - the log stops mid-merge and the process dies.

**Round-tripping your own file through WolvenKit proves nothing.** It shows only
that WolvenKit can read back what WolvenKit wrote. A file that survives that can
still be structurally wrong in a way the runtime rejects.

So find a mod on the install that already ships named keys and copy *its*
structure. They are easy to spot - grep the deployed `.xl` files:

```
grep -l "onscreens:" <game>\archive\pc\mod\*.xl
```

Extract its resource, serialize it, and use that as the template:

```
WolvenKit.CLI.exe unbundle <their>.archive -o <out>
WolvenKit.CLI.exe convert serialize <out>\...\their_strings.json -o <out>
```

The shape, from a mod verified working on patch 2.31:

```json
{
  "Header": { "WolvenKitVersion": "8.20.0", "WKitJsonVersion": "0.0.9",
              "GameVersion": 2310, "DataType": "CR2W" },
  "Data": { "Version": 195, "BuildVersion": 0,
    "RootChunk": {
      "$type": "JsonResource", "cookingPlatform": "PLATFORM_PC",
      "root": { "HandleId": "0", "Data": {
        "$type": "localizationPersistenceOnScreenEntries",
        "entries": [
          { "$type": "localizationPersistenceOnScreenEntry",
            "femaleVariant": "Breach Network", "maleVariant": "",
            "primaryKey": "0", "secondaryKey": "netsec_breach_network" }
        ] } } },
    "EmbeddedFiles": [] } }
```

`primaryKey: "0"` and a named `secondaryKey` is the mod convention - you then
reference it as **`LocKey#netsec_breach_network`**, unquoted, in the TweakXL
yaml. `femaleVariant` carries the text; `maleVariant` stays empty unless you need
a variant.

Then deserialize, pack, and declare it:

```
WolvenKit.CLI.exe convert deserialize netsec.json.json -o <dir>
WolvenKit.CLI.exe pack <depot-root-folder> -o <out>
```

```yaml
# netsec_loc.archive.xl
localization:
  onscreens:
    en-us: netsec\localization\en-us\onscreens\netsec.json
```

## The check that actually discriminates

Compare the **CR2W string table** of your file against a known-working one. Type
and field names live uncompressed in the header, so a printable-run scan reads
them straight out:

| name | vanilla | working mod | the file that crashed |
|---|---|---|---|
| `localizationPersistenceOnScreenEntries` | yes | yes | **yes** |
| `localizationPersistenceOnScreenEntry` | yes | yes | **no** |
| `secondaryKey` / `femaleVariant` / `maleVariant` | yes | yes | no |
| `JsonResource` | yes | yes | yes |

The crashing file declared the **container** type and never the **per-entry**
type. Its entries had no type to be. That single missing name is the whole
difference between a resource that merges and one that kills the process, and no
amount of round-tripping surfaces it - only the comparison does.

`primaryKey` legitimately absent from the table when every entry uses `0`; the
working mod omits it too. Compare against a real file rather than against a list
of fields you expect.

## Verify from the packed archive, not the loose file

Unbundle your own `.archive` and serialize what comes out. That at least proves
the packing step preserved the resource. It is still not proof the runtime
accepts it - **only a launch is**. The line to look for is ArchiveXL logging the
merge of your entries *and continuing past it*; a log that ends mid-merge is the
crash.

## Related

- [A player-visible string cannot be found by grepping the archives that contain it](/authoring/localization-strings-live-inside-archives)
- [Finding a piece of text the player saw in game](/authoring/finding-in-game-text)
- [Reading the shipped script dump](/authoring/reading-the-shipped-script-dump)
