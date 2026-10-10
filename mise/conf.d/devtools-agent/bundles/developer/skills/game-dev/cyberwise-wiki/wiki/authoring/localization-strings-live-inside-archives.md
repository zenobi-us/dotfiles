---
type: Engine Mechanic
title: A player-visible string cannot be found by grepping the archives that contain it
description: Localized text is stored compressed inside .archive files, so a raw binary search finds nothing even when the string is there - it has to be extracted first, and what comes out is a CR2W resource rather than the JSON its extension claims.
tags: [localization, onscreens, archivexl, wolvenkit, cr2w, search, attribution]
status: stable
generated: { by: "claude", at: "2026-08-24T19:38:47-04:00" }
---

# A player-visible string cannot be found by grepping the archives that contain it

Someone quotes a line they saw in game and the question is which mod owns it. The
obvious move - search every `.archive` for the text - returns nothing, and the
nothing means nothing at all.

**Localized strings live in `onscreens` JSON resources packed inside `.archive`
files, and archive contents are compressed.** The bytes of the string are not in
the file in any form a text search can match.

Demonstrated on a small story mod whose journal and phone text is entirely about
one character:

```
$ grep -c "Panam" Encore.archive
0
```

That archive contains nineteen entries of her dialogue. The search is correct;
the premise is wrong.

## Extract first, then search

The WolvenKit CLI unpacks an archive, or a folder of them, filtered to just the
resources worth reading:

```
WolvenKit.CLI.exe unbundle <archive-or-folder> -o <out> -w "*onscreens*.json"
```

`-w` is a filename glob, `-r` takes a regex instead. `-p/--path` for the input is
deprecated in current builds in favour of the positional argument - it still
works, but do not write new tooling against it.

**`*onscreens*` is the vanilla layout, and mods frequently do not follow it.**
The mod above ships its strings as
`base\localization\en-us\panam_continued.json`, with no `onscreens` component
anywhere in the path - a pattern keyed to that word would have extracted nothing
from it and looked like proof the string was absent. `-w "*.json"` on the same
archive extracted 18 files, one per locale. **Widen the pattern before believing
an empty extraction.**

## What comes out is not JSON

The extension lies. The first four bytes are the giveaway:

```
00000000: 4352 3257 c300 0000 ...        CR2W
```

It is a **CR2W resource**, the engine's own binary serialization format. Handing
it to a JSON parser fails, and a parser failure at this point reads like a bad
extraction rather than a wrong expectation.

**Pull printable runs out of the bytes instead of parsing.** A match of
`[\x20-\x7E]{8,}` over the file is enough to answer "is this string here, and
what are its neighbours":

```
localizationPersistenceOnScreenEntries
array:localizationPersistenceOnScreenEntry
primaryKey
secondaryKey
femaleVariant
?nq_panam_sex_msg_1
?Do you want to finish what we started in the tank? ;)
```

The leading `?` on each value is a CR2W length prefix landing in printable
range, not part of the text. Match on the text, not on the whole run.

## The extraction is also the attribution

The extracted tree reproduces the **depot path** the resource was authored under:

```
base\localization\en-us\panam_continued.json
```

That path is what the owning mod declares in its `.xl`, so finding the string in
an extracted file and then grepping the `.xl` files for that path names the mod
without any guessing. See [A mod adds journal entries, phone messages and quests
by declaring resources in its `.xl`](/authoring/mod-declared-journal-and-quest-resources).

## The reverse lesson: the declarations ARE greppable

Compression hides the *contents*, not the loose files beside them and not the
type names in a resource header.

- **`.xl` files are plain YAML on disk.** `localization:`, `onscreens:`,
  `journal:` and their paths grep instantly.
- **CR2W type names survive as plain strings inside the archive.** A byte scan
  for `gameJournalResource` matched 19 of 694 mod archives on one large install -
  the string is uncompressed in the header even though every string it describes
  is not.

So the rule is not "you cannot search archives". It is that **structure is
searchable and content is not**, and the way to reach content is to extract it.

## What this does not cover

The vanilla game's own text is a different job with a known destination -
`base\localization\<locale>\onscreens\onscreens_final.json` inside that
language's text archive - and its traps (spoken dialogue is elsewhere, some
entries have no `secondaryKey`) are in [Finding a piece of text the player saw in
game](/authoring/finding-in-game-text). This article is about the case where the
string is *not* vanilla and the owning mod is unknown.

## Related

- [Finding a piece of text the player saw in game](/authoring/finding-in-game-text)
- [A mod adds journal entries, phone messages and quests by declaring resources in its `.xl`](/authoring/mod-declared-journal-and-quest-resources)
- [Turning an archive hash back into a file path](/conflicts/resolving-a-hash-to-a-path)
