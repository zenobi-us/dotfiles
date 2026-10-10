---
type: Engine Mechanic
title: Earlier in modlist.txt wins, and nothing in the game writes that file
description: Which archive wins a contested file is decided by list position, earliest first - but only on installs that have a modlist.txt at all, and the file is created by whatever the user orders mods with, not by the game.
tags: [load-order, modlist, archive, precedence, conflicts]
status: stable
generated: { by: "claude", at: "2026-08-24T21:00:00-04:00" }
---

# Earlier in modlist.txt wins, and nothing in the game writes that file

**Earlier in `archive\pc\mod\modlist.txt` wins.** This is backwards from the
advice most guides give - prefix a mod `zzz_` so it "loads last and wins" - and
that advice is simply wrong wherever `modlist.txt` is in play. Tools that manage
the file usually say so in their own UI ("higher overrides").

Two models are in play and they are frequently confused:

| | `modlist.txt` present | `modlist.txt` absent |
|---|---|---|
| ordering | explicit, by line position | alphabetical |
| winner | **earliest line** | first alphabetically |
| who controls it | whatever wrote the file | filenames |

**Nothing in the game writes `modlist.txt`.** It is created and maintained by
whatever the user orders mods with - a mod manager's load-order page, a conflict
tool, or a text editor. So which model applies is a property of *this install*,
not of the game version, and it can change without a game patch. **Look for the
file before applying any precedence reasoning.**

A manager may instead sequence mods in its own UI and never write the file at
all. Where that is the case its list is what to reason about; the mechanics here
were established on `modlist.txt`-based installs and are untested there. The
reasoning transfers - do not quote the specifics as fact for a manager nobody
checked.

## Never delete `modlist.txt` to "fall back to alphabetical"

It is a deliberate custom order that nothing else can reconstruct. Deleting it
silently re-decides every conflict on the install.

## The test that proves which model applies must be able to fail

To establish override direction empirically you need a conflicting pair where
**list order and alphabetical order predict different winners**. If they agree,
both hypotheses name the same archive and the observation carries no
information.

This is not a theoretical caution - the correlation is the norm here. Mods
prefixed `#`, `!` or `~` sort early alphabetically *and* tend to be placed early
in the list, precisely because authors chose the prefix to sort early.

A worked example of a **useless** test, from one real list (numbers are line
positions in `modlist.txt`):

| pair | list order | alphabetical | earlier-wins predicts | later-alpha-wins predicts |
|---|---|---|---|---|
| `Skin Textures` (65) vs `###Better Skin` (66) | Skin Textures first | ###Better Skin first | Skin Textures | Skin Textures |

Both models name the same winner. Three such pairs still prove nothing. Find a
pair where the two orders disagree, or report the direction as assumed rather
than measured.

## What this does not cover

REDmod archives live in `mods\<name>\archives\` and are ordered by the REDmod
deploy, not by `modlist.txt` - see
[two load-order systems](/engine/two-load-order-domains). Nothing ranks a file
contested across the two domains, and naming a winner there is a guess wearing a
verdict.

## Related

- [Every newly installed archive starts at the bottom of the stack](/conflicts/every-new-archive-starts-last)
- [`#` is a filename character, not a comment marker](/conflicts/modlist-has-no-comment-syntax)
- [A TweakXL record is resolved last-wins](/authoring/tweakxl-records-are-last-wins) - where a `zzz_` prefix genuinely does win, because the tweak layer resolves in read order rather than by this file
