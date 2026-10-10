---
type: Engine Mechanic
title: A mod adds journal entries, phone messages and quests by declaring resources in its .xl
description: Phone threads, quest objectives and journal entries are a gameJournalResource plus a localization file, both declared in the mod's ArchiveXL .xl - which makes "which mod added this message?" answerable from disk, because the class name survives uncompressed in the archive header.
tags: [archivexl, xl, journal, quests, phone, localization, attribution]
status: stable
generated: { by: "claude", at: "2026-08-24T19:38:47-04:00" }
---

# A mod adds journal entries, phone messages and quests by declaring resources in its .xl

A message thread appears on V's phone, a quest entry appears in the journal, and
nobody knows which of several hundred mods put it there. This is answerable
without launching the game, because the mod had to **declare** the resource in a
plain-text file sitting loose in the mod folder.

## What a story mod's `.xl` actually says

`.archive.xl` next to the `.archive` is YAML, uncompressed, greppable. Two real
ones, trimmed:

```yaml
journal:
  - base\journal\panam_continued.journal
localization:
  onscreens:
    en-us: base\localization\en-us\panam_continued.json
    de-de: base\localization\de-de\panam_continued.json
    # ...one line per locale
  lipmaps:
    en-us: base\localization\en-us\encore_lips.lipmap
streaming:
  blocks:
    - base\journal\panam_continued.streamingblock
```

```yaml
quest:
  phases:
    - path: mod\<name>\quest\<name>_root.questphase
      parent: cyberpunk2077.quest
```

Four things worth reading off that:

- **`journal:`** points at a `gameJournalResource`. Journal entries, quest
  objectives and phone message threads are all the same resource kind - a phone
  thread is journal content, not a separate system.
- **`localization: onscreens:`** supplies the words. The journal resource holds
  structure and keys; the text lives in the per-locale file, which is why
  changing what a message *says* and changing when it *fires* are edits to
  different files.
- **`streaming: blocks:`** is a companion `.streamingblock` beside the journal
  file, and story mods that ship one ship both.
- **`quest: phases:`** grafts a questphase under a parent quest. Its `parent`
  is a quest path, not a file the mod owns.

**Depot paths are the author's choice, not a convention.** One of those mods
puts its journal under `base\journal\`, another under `base\deceptious\`, and
`mod\<name>\...` is equally common. Do not filter a search on an expected prefix.

## Finding the owner without opening every archive

The archive is compressed, so the strings inside it cannot be grepped - see [A
player-visible string cannot be found by grepping the archives that contain
it](/authoring/localization-strings-live-inside-archives). But the **CR2W type
name is not compressed**, so a byte scan for the class name works on the packed
file:

```
grep -l "gameJournalResource" *.archive
```

On one install that matched **19 archives out of 694**. That is the whole search
space for "which mod added journal content", reduced by a single pass over files
nothing had to unpack.

From there:

1. Scan the archives for `gameJournalResource` - a shortlist, not a candidate
   list of hundreds.
2. Read each shortlisted mod's `.xl` for its `journal:` and `localization:`
   paths.
3. Extract the declared localization file and search its printable strings for
   the text the player quoted.

Step 2 is what turns a hit into an attribution: the depot path in the `.xl` and
the path of the extracted file are the same string, and only one mod declares it.

## What this does not tell you

Presence of a journal resource says a mod **can** add journal content. It does
not say the entry the player saw came from that mod rather than from vanilla
text a mod redefined, and it says nothing about the conditions that fired it -
those live in the quest graph, which is not readable this way.

The `quest: phases:` example above is quoted from the ArchiveXL declaration form
rather than from a shipped file read in this session; the `journal:`,
`localization:` and `streaming:` blocks are verbatim from mods on disk.

## Related

- [A player-visible string cannot be found by grepping the archives that contain it](/authoring/localization-strings-live-inside-archives)
- [Deleting a world node with ArchiveXL](/authoring/archivexl-node-deletions) - the other half of what an `.xl` can declare
- [Finding a piece of text the player saw in game](/authoring/finding-in-game-text)
