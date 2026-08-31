---
type: File Format
title: Appearance lives in a save node CDPR misspelled, and its blocks can disagree with each other
description: Finding CharacetrCustomization_Appearances, the length-prefixed resource/option grammar inside it, and why a body part can render in the creator preview and not in the world.
tags: [appearance, saves, ccxl, binary-format, character-creator]
status: stable
sources:
  - id: autosave
    resource: "the CharacetrCustomization_Appearances node of a patch-2.31 AutoSave - node 220 of 246, 9675 bytes, 192 printable string runs"
generated: { by: "claude", at: "2026-08-24T21:40:00-04:00" }
---

# Appearance lives in a save node CDPR misspelled, and its blocks can disagree with each other

The node is **`CharacetrCustomization_Appearances`**.

**Search for `Characetr`, not `Character`.** That is CDPR's own typo, it is in
the shipped data, and it is the single most common reason a search of a
decompressed save comes back empty when the data is right there.

Locate it through the node table rather than by string search - see
[the save container](/formats/cyberpunk-save-container) for the node table and
the offset arithmetic. In the sample it is node 220 of 246, 9675 bytes long,
holding 192 printable string runs.

## The grammar inside the node

Everything is **length-prefixed with the same `0x80 | length` byte the node table
uses**. A block is a name, a u32 entry count, then that many entries:

```
<lenByte><blockName><u32 entryCount>
    entryCount x  <u64 hash><lenByte><resourceName><lenByte><optionName>
```

The first entry of the sample's first block, byte for byte:

```
    16  00 00 00 83 54 50 50 0b 00 00 00 96 1f df 29 45  ....TPP.......)E
    32  69 c5 c2 9e 68 30 5f 30 30 30 5f 70 77 61 5f 5f  i...h0_000_pwa__
    48  62 61 73 65 68 65 61 64 5f 5f 66 61 63 65 5f 72  basehead__face_r
```

and continuing from offset 56, where that resource name ends:

```
    56  5f 5f 66 61 63 65 5f 72 69 67 91 74 70 70 5f 68  __face_rig.tpp_h
    72  65 61 64 5f 66 61 63 65 5f 72 69 67 00 00 00 00  ead_face_rig....
```

Reading it:

| bytes | meaning |
|---|---|
| `83` | `0x80 \| 3` - a 3-character name follows |
| `54 50 50` | `TPP` - the block name |
| `0b 00 00 00` | u32 **11** - this block has 11 entries |
| `96 1f df 29 45 69 c5 c2` | 8-byte hash of the entry (not decoded here) |
| `9e` | `0x80 \| 30` |
| `h0_000_pwa__basehead__face_rig` | the **resource**: a CDPR asset name |
| `91` | `0x80 \| 17` |
| `tpp_head_face_rig` | the **option** it fills |

So each entry is a `<resource>` / `<optionName>` pair: a CDPR asset on one side
and the customization slot it occupies on the other. Option names read like
`hair_color29`, `piercings_11`, `makeupEyes_03`, `makeupLips_28`,
`makeupPimples_02`, `eyebrows_color8`, `teeth`, `neck`.

**The numeric padding is inconsistent between groups** - `piercings_11` beside
`makeupEyes_03` beside `eyebrows_color8`. A lookup by constructed name has to
try every spelling. (The same inconsistency bites when brute-forcing
[ACU preset hashes](/formats/acu-preset).)

The block-count field was confirmed on three separate blocks in the sample
(`TPP` = 11, `FPP_Body` = 3, `character_creation` = 5), each time landing exactly
on the following entry.

## There is more than one appearance block, and they can disagree

The sample carries separate blocks including `TPP`, `character_customization`,
`TPP_Body`, `FPP_Body` and `character_creation`.

> **A body part referenced by `character_creation` but not by `TPP_Body` will
> render in the creator preview and not in the world.**

That is a real and confusing symptom - "it looks right in the mirror but not in
game" - and it is not a mod conflict. Read every block before concluding that a
feature is absent; an option missing from one block may be present in another.

Some options are duplicated across the first-person and third-person split with
their own key: the sample carries both `hair_color29` and `hair_color_fpp_29`,
and `FPP_Body` holds `fpp_body_color` alongside a separate
`fpp_body_color_censored`. **A single search hit is not the whole answer for
anything with an FPP variant.**

## Face morphs are global IDs, not slider numbers

Morph entries use a different, shorter grammar - two length-prefixed strings with
**no hash**, followed by eight bytes (zero throughout the sample):

```
<lenByte><groupName><lenByte>h<NNN>   then 8 bytes
```

They read as a group name plus an `h`-prefixed three-digit number - `eyes h011`
is the canonical example, and the groups observed are `eyes`, `nose`, `mouth`,
`jaw` and `ear`.

**These are not the character-creator slider numbers, and there is no simple
offset between them.** Do not present a morph ID as a slider value, and do not
try to reconcile the two.

## A save is personal data

An appearance dump is a description of one person's character. Read the minimum
the question needs, quote back less, and never write a decoded save or an
appearance dump anywhere shareable or into a repository.

## What this does not cover

- **The 8-byte per-entry hash is not decoded.** It is presumably an asset or
  path hash; nothing here needs it, and nothing here confirms what it hashes.
- **The eight bytes after each morph pair were zero in every entry examined**, so
  their meaning is a guess. A weight field is the obvious candidate and is
  unverified.
- **The node header before the first block name was not fully decoded** - only
  enough to reach the first block.
- **The trailing string table** in the node lists appearance variant names such
  as `holstered_default` / `_fpp` / `_tpp` and equivalents for the arm-cyberware
  variants. Its structure was not parsed.
- **One save, one patch (2.31).** This is an internal format with no
  compatibility promise.

## Related

- [A sav.dat is an LZ4 block container](/formats/cyberpunk-save-container)
- [An ACU preset's LocKey number is a hash of a group name](/formats/acu-preset)
