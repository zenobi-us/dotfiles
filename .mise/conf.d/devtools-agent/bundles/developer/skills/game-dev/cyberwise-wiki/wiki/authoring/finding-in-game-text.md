---
type: Engine Mechanic
title: Finding a piece of text the player saw in game
description: UI strings, shards, emails and computer text live in one per-locale JSON that has to be extracted from that language's text archive - it does not contain spoken dialogue, some entries have no secondary key, and a LocKey is a numeric handle whose text any mod may redefine.
tags: [localization, lockey, onscreens, text, authoring, search]
status: stable
generated: { by: "claude", at: "2026-08-24T21:15:00-04:00" }
---

# Finding a piece of text the player saw in game

Someone quotes a line - from a shard, an email, a menu, a terminal - and the
question is where it comes from, or what would have to change to alter it.

Extract this, from the text archive of the locale they were playing in, and
serialize it:

```
base\localization\<locale>\onscreens\onscreens_final.json
```

For English that is `en-us` inside `lang_en_text.archive`, and there is one such
pair per installed language. It contains **UI strings, shards, emails, journal
entries and computer text** - tens of thousands of entries.

**If the user quoted text in another language, search that language's archive,
not the English one.** The English file will not contain their string, and the
absence proves nothing.

## Two traps that produce a confident wrong answer

- **It does not contain spoken dialogue or news broadcasts.** Those live in
  subtitle resources. Concluding "that text is not in the game" after searching
  only `onscreens` is wrong, and easy to do, because `onscreens` is large enough
  to feel exhaustive.
- **Some entries have an empty `secondaryKey`.** Computer inbox mail in
  particular is keyed by `primaryKey` only, so **any search that filters on key
  names misses it entirely**. Search the `femaleVariant` values, not just the
  keys.

## Entry structure and reading it

Each entry is `femaleVariant`, `maleVariant`, `primaryKey`, `secondaryKey`.

The file is large enough that a **streaming line-by-line read beats loading the
whole thing into a JSON parser** - in PowerShell it beats `ConvertFrom-Json` by
a wide margin, and on a constrained machine the parser may simply fail where the
stream does not.

## A LocKey is a handle, not text

A string of the form `LocKey#46418` is a **numeric reference into the
localization table**, resolved to display text at runtime. Nothing about it is
the text itself, and two consequences follow:

- The same LocKey can appear in unrelated places, because it names a *string*,
  not an occurrence of one. A key whose text is a character's name will resolve
  for every prompt using that name.
- Whichever loaded resource last defines an entry supplies the text, so a mod
  can change what any LocKey displays without touching the thing that displays
  it.

That second point is why matching on a LocKey to detect *behaviour* is fragile
in a way that is invisible until another mod is installed - see [Detecting a
player action by matching its interaction text is matching on something another
mod owns](/authoring/detecting-a-player-action-from-an-interaction).

## Related

- [Detecting a player action by matching its interaction text is matching on something another mod owns](/authoring/detecting-a-player-action-from-an-interaction)
- [Never guess a TweakDB record ID - the game writes the real list](/authoring/finding-the-real-record-id)
