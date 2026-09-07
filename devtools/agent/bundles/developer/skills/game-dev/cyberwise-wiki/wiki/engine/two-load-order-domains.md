---
type: Engine Mechanic
title: There are two load-order systems, and a conflict scan only sees one of them
description: Loose archives are ordered by modlist.txt; REDmod archives are ordered by the REDmod deploy. Nothing ranks one domain against the other, so a mod can win or lose a file without appearing in a load-order report at all.
tags: [load-order, redmod, archive, modlist, conflicts]
status: stable
generated: { by: "claude", at: "2026-08-24T18:30:00-04:00" }
---

# There are two load-order systems, and a conflict scan only sees one of them

Many mods ship both a "default" build and a "REDmod" build of identical content.
The choice is not cosmetic, and it is not about which is newer or more official.

| | default / loose | REDmod |
|---|---|---|
| lands in | `archive\pc\mod\` | `mods\<name>\archives\` |
| ordered by | `modlist.txt`, explicit and editable | the REDmod deploy order |
| deploy step | none | required after every change |
| visible to a `modlist.txt` conflict scan | yes | **no** |

## Default is the right answer unless the mod needs REDmod

The list of things that genuinely need it is short: **custom audio** - new `.wav`
sounds are only supported through REDmod - mods shipping REDmod-only scripts or
tweaks, and mods that offer no other build. Everything else gains nothing and
costs visibility.

## The cost is diagnostic, and it is the part people miss

Two mods contesting a file are only comparable when **one list orders both of
them**. `modlist.txt` orders the loose archives; the REDmod deploy orders the
others. Nothing ranks across the boundary.

So a REDmod can win or lose a file without appearing in a load-order report at
all, and "no conflicts" then means "no conflicts *among the ones I looked at*" -
which is a much weaker statement than it sounds, and indistinguishable from the
strong one in a report that does not say which it made.

Cross-domain contests should be reported **without ranking them**, because
nothing available establishes which domain wins. On one install that surfaced 63
files contested between a REDmod framework and loose retexture archives, on a
load order that had been reported clean for months. Test in game, or remove one
copy; do not guess a winner.

## The usual cause is one mod installed both ways

Somebody tries the REDmod build, then the default one, and both remain. Neither
manager nor game complains, because from each domain's point of view nothing is
wrong.

## Two mods can deploy into one REDmod folder, and the loser is silent

REDmod content lands in `mods\<name>\`, keyed by that folder name - so two
variants of one mod, or two mods an author shipped under the same name, deploy
**into the same folder**. The later deployment overwrites the earlier one file by
file, and the earlier mod contributes nothing while still appearing installed and
enabled.

Nothing warns, because from the manager's point of view two mods wrote two sets
of files. The tell is in the REDmod deploy's own list: **the same folder name
appearing twice**. Where the two builds ship a same-named script of different
sizes, the size on disk says which one survived.

## Ordering within each domain

An archive with no `modlist.txt` entry is outside the ordering rather than at the
end of it, and loses every file it contests - including the case that looks like
a bug, an archive generated at runtime by a native plugin. Both halves of that,
with what to prune and what to keep, are in
[a modlist entry with no archive is usually not a fault](/conflicts/an-entry-and-a-file-can-disagree).

## Related

- [A modlist entry with no archive is usually not a fault; an archive with no entry always is](/conflicts/an-entry-and-a-file-can-disagree)
- [An archive can be installed, enabled, and contributing nothing](/conflicts/an-archive-that-contributes-nothing) - the loose-archive version of the silent loser above
- [Earlier in modlist.txt wins, and nothing in the game writes that file](/conflicts/earlier-wins-and-nothing-in-the-game-writes-the-list)
