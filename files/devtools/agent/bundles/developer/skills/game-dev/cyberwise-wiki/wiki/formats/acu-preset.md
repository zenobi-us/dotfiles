---
type: File Format
title: An ACU preset's LocKey number is a hash of a group name, not a localization key
description: The AppearanceChangeUnlocker .preset line format - why the key resolves to nothing in the game's localization, why two presets legitimately have different line counts, and why the indices must never be reconciled against notes.
tags: [appearance, presets, acu, hashing, ccxl]
status: stable
sources:
  - id: groupmap
    resource: "cyberwise-saves/tools/preset-groups.csv - 48 FNV1a-64 group-name hashes recovered by brute-force sweep"
generated: { by: "claude", at: "2026-08-24T21:40:00-04:00" }
---

# An ACU preset's LocKey number is a hash of a group name, not a localization key

AppearanceChangeUnlocker (ACU) writes appearance presets as plain-text files,
one field per line, shaped `LocKey#<n>:<index>`:

```
LocKey#9502141975964618858:<index>
LocKey#6273287742996814372:<index>
LocKey#2482157010324784664:<index>
```

**The number after `LocKey#` is not a localization key.** Resolving it against
the game's localization tables finds nothing, and that dead end is where most
people give up on the format. It is the **FNV1a-64 hash of the customization
group name**. The value after the colon is the character-creator slider index.

Those three hashes are real, and they decode to:

```
9502141975964618858  ->  hairstyle
6273287742996814372  ->  hair_color29
2482157010324784664  ->  makeupEyes
```

(The indices are elided because a preset is one person's face; the hashes are
game data and are not.)

The `LocKey#` prefix is presumably borrowed because the game's own string type
prints that way. It is misdirection either way: an ACU `LocKey#` and a
`LocKey#<small number>` in a save's `metadata.9.json` (which *is* a real
localization primaryKey) are unrelated things that share a spelling.

## Recovering the hash map

There is no table to look this up in. The hashes are recovered by generating
candidate group names, hashing each with FNV1a-64, and matching. That means the
map is only ever as complete as the sweep that built it:

- **Padding is inconsistent in CDPR's naming.** `piercings_11`, `makeupEyes_03`,
  `hair_color29`, `makeupCheeks_05`, `eyebrows_color8` - two-digit here,
  one-digit there, none at all elsewhere. A sweep that assumes one convention
  misses whole groups.
- **Colour keys embed the style index**, so they are not a fixed vocabulary but
  a family. Hairstyle *n*'s colour lives under `hair_color<n>`, eyebrow colour
  under `eyebrows_color<n>`. The map has to enumerate the range, not the name.

**An unknown hash must print rather than be dropped.** A decoder that silently
skips what it cannot name reports a preset as smaller than it is, and the
missing line is exactly the interesting one. Printing `?<hash>` keeps the count
honest and tells you the map needs extending - not that the preset is corrupt.

## Two presets with different line counts are both fine

This is the consequence of colour keys embedding the style index, and it looks
alarming the first time:

> Two presets using different hairstyles have **different key sets and different
> line counts**.

One preset carries `hair_color29`, another carries `hair_color5`, and neither
carries the other's key. That is not corruption, and it is not evidence that the
two were saved under different mod loadouts.

## A preset only stores the groups that existed when it was saved

If a CCXL mod adds new customization options after a preset was written, the
preset carries no keys for them. The look is not "missing" those features - the
file predates them.

**Date a preset against the mod set of its day before concluding anything is
wrong with it.** An old preset loaded onto a newer, larger option set is the
normal case, not a fault.

## Never reconcile preset indices against a number recorded anywhere else

Notes, a screenshot of the character creator, a build write-up - none of them are
a check on the preset. There is no single rule relating the two:

- some fields read one lower than the creator shows (0-based)
- some match exactly
- some disagree outright

**The preset is authoritative. A mismatch is not evidence that anything is
wrong**, and treating it as evidence sends you looking for a corruption that
does not exist.

## What this does not cover

- **The relationship between a preset index and the string the save stores.**
  A save records appearance as resource/option *name* pairs
  ([appearance in a save](/formats/appearance-in-a-save)); a preset records
  *indices*. Nothing here maps one onto the other, and the index-vs-creator
  disagreement above suggests it is not a simple offset.
- **Which groups exist at all.** The recovered map is 48 hashes. There is no
  reason to believe that is the complete set.
- ACU is popular but far from universal. Confirm it is installed before
  explaining any file in its terms.

## Related

- [Where appearance lives inside a save](/formats/appearance-in-a-save)
- [A sav.dat is an LZ4 block container](/formats/cyberpunk-save-container)
