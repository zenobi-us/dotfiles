---
name: cyberwise-saves
description: Read Cyberpunk 2077 save files and character appearance data - decompressing a save, locating the appearance section, and decoding AppearanceChangeUnlocker (ACU) presets. Use when asked what a character's appearance settings are, to recover appearance data without re-recording it in game, or to read anything out of a .dat save.
---

# Cyberwise: saves and appearance

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> **Re-check after a patch:** HIGHEST drift risk in the family. The save container is an internal format with no compatibility promise - re-verify the chunk layout and the appearance section before trusting any offset.

Load `cyberwise` alongside this for the method rules.

**Check the patch version first - this topic drifts fastest of any in the family.**

```powershell
(Get-Item "$GameRoot\bin\x64\Cyberpunk2077.exe").VersionInfo.ProductVersion
```

If that is not the version in the stamp above, say so before quoting an offset.
`Expand-Save.ps1` also prints the save's own `saveVersion` and `gameVersion` from
the header, which is the more precise check - a save written by an older patch
keeps that patch's layout regardless of what is installed now.

## A save is personal data

Read the minimum needed to answer the question. Do not write decoded saves,
appearance dumps or preset decodes anywhere shareable, and never into a repo.

## What is in here

`references/saves-and-appearance.md` is the order of work: read the metadata
first, use the tools rather than hand-decoding, and treat everything you find as
personal data.

**The formats themselves are in the base wiki** (`cyberwise-wiki`), because a
byte layout is knowledge rather than instruction:

| article | covers |
|---|---|
| `/formats/cyberpunk-save-container` | `CSAV`/`CLZF` header, the chunk table, LZ4 **blocks**, the node table read backwards from `ENOD`, the packed-VLQ node count, and the offset trap |
| `/formats/appearance-in-a-save` | the appearance node, its `0x80\|len` string grammar, the blocks that disagree, face morph IDs |
| `/formats/acu-preset` | the `LocKey#<hash>:<index>` line format and how the hash map is recovered |

Two things worth knowing before you start:

- **`CharacetrCustomization_Appearances` is spelled that way in the game.** It is
  CDPR's own typo, not one to correct while searching.
- **An ACU `LocKey#<n>` is not a localization key.** It is a hash of the
  customization group name, which is why looking it up as a LocKey finds nothing.

## Tools

Do not decode a save by hand. Both of these already work, and hand-walking the
chunk table is where the offset trap bites.

| tool | what it does |
|---|---|
| `tools/Expand-Save.ps1` | decompresses a `sav.dat` into one flat blob, ready to search |
| `tools/Decode-Preset.ps1` | turns ACU `.preset` files into readable appearance fields |

```powershell
.\tools\Expand-Save.ps1 -SavePath "<save>\sav.dat" -OutPath "$env:TEMP\save.bin"
.\tools\Decode-Preset.ps1 -Directory "<acu presets dir>" -Compare
```

`Expand-Save.ps1` carries a hand-rolled LZ4 **block** decoder - .NET has none, and
the chunks are blocks rather than frames, so a general LZ4 library will refuse
them. It prints `saveVersion` and `gameVersion` from the header; if those differ
from the **Verified** stamp above, re-check the layout before trusting offsets.

`Decode-Preset.ps1` needs `preset-groups.csv` beside it, which maps the FNV1a-64
group-name hashes to names. **Unknown hashes print as `?<hash>` rather than being
dropped**, so a preset is never silently reported as smaller than it is - if you
see those, the map needs extending, the preset is not corrupt.

Write output to a temp path, never into a repo - see above.

## Reference material

| file | covers |
|---|---|
| `references/saves-and-appearance.md` | the order of work, and pointers to the format articles |

The layouts live in the base wiki at `/formats/cyberpunk-save-container`,
`/formats/appearance-in-a-save` and `/formats/acu-preset`. Read those before
writing any parser.
