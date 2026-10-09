# Saves and appearance data

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> **Re-check after a patch:** HIGHEST DRIFT IN THIS SKILL. The save format carries its own version number (269 when this was written) and CDPR revises it. Re-verify the chunk table layout and the node-offset arithmetic against a fresh save before trusting any parse.

**The formats themselves are documented in the base wiki, not here.** This file
keeps what changes what you *do*; the layouts, magic numbers, hex dumps and byte
grammars live in `cyberwise-wiki`'s bundle:

| what you need | where |
|---|---|
| `sav.dat` container: header, chunk table, LZ4 blocks, node table, the offset trap | `/formats/cyberpunk-save-container` |
| the appearance node, its blocks, resource/option pairs, face morphs | `/formats/appearance-in-a-save` |
| the AppearanceChangeUnlocker `.preset` line format and its hashes | `/formats/acu-preset` |

## Order of work

**1. Read `metadata.9.json` first, and stop there if it answers the question.**
It sits beside `sav.dat` in each save folder and needs **no decoding** - level,
street cred, attributes, skills, lifepath, playtime, difficulty, build/patch
version, active quests and some quest facts. Most questions about a playthrough
never need the container opened at all.

**2. If you must open the save, use `tools/Expand-Save.ps1`.** Do not hand-walk
the chunk table; the offset trap in `/formats/cyberpunk-save-container` is where
that goes wrong, and it fails quietly at the very end of the parse.

**3. For appearance, search the decompressed blob for `Characetr`, not
`Character`.** The node is `CharacetrCustomization_Appearances` - CDPR's own
typo, and the commonest reason a correct search comes back empty.

**4. For an ACU preset, use `tools/Decode-Preset.ps1`.** Do not try to resolve a
`LocKey#<n>` against the game's localization: it is a group-name hash, not a
localization key, and looking it up finds nothing.

## A save is personal data

Read what the question needs, quote back the minimum, and **do not write a
decoded save, an appearance dump or a preset decode anywhere it could be
shared** - not into a repo, not into a report, not into a chat log. Temp paths
only.

This is also why the base wiki's format articles redact the resource names that
encode a chosen look: the grammar is knowledge, the face is not.

## Three things that will waste your time if nobody warns you

Each is explained in full in the article named beside it.

- **A `LocKey#` means three different things** depending on where you found it: a
  real localization primaryKey in `metadata.9.json`, a group-name hash in an ACU
  preset, and a printed string type in the game. `/formats/acu-preset`
- **Two ACU presets legitimately have different key sets and line counts**,
  because colour keys embed the style index. That is not corruption.
  `/formats/acu-preset`
- **The appearance blocks in a save can disagree with each other**, which is how
  a body part renders in the creator preview and not in the world.
  `/formats/appearance-in-a-save`
