---
type: Diagnostic Method
title: A modlist entry with no archive is usually not a fault; an archive with no entry always is
description: The two halves of an inventory mismatch have opposite meanings. A listed-but-missing entry is normally a disabled mod, a runtime-generated archive, or a mod kept installed-but-off, and pruning it destroys a slot. An unlisted archive sorts last and loses every file it contests.
tags: [modlist, inventory, load-order, stale-entries, conflicts]
status: stable
generated: { by: "claude", at: "2026-08-24T21:00:00-04:00" }
---

# A modlist entry with no archive is usually not a fault; an archive with no entry always is

An inventory check over `modlist.txt` and `archive\pc\mod\` produces two kinds
of mismatch, and they look equally like faults in a report. They are not.

| finding | what it usually means | action |
|---|---|---|
| **listed but missing** - an entry with no file on disk | a disabled mod, a runtime-generated archive, or a mod deliberately kept installed-but-off | keep the line by default |
| **on disk but unlisted** - a file with no entry | it cannot be positioned, so it sorts last | always fix |

## Keep a listed-but-missing entry

The line holds the slot, so the mod returns to its old position if it is
re-enabled. Prune only on a genuine uninstall. Report these as **information,
not damage**.

Three normal causes, none of them a fault:

- **A disabled mod.** The manager removed the file and left the ordering intact,
  which is the behaviour you want.
- **A mod deliberately kept installed but off.**
- **An archive written at runtime.** At least one known mod (Dynamic Moon
  Phases) generates its `.archive` from a native plugin at game start, so the
  file simply is not on disk while the game is closed. Any check that compares
  deployed archives against installed copies - a manager's staging folders, or a
  manual installer's own record - reports it as an orphan. **Never prune it as
  stale.** It still needs a permanent slot in the list, because an unlisted
  archive sorts last.

## Always fix an unlisted archive

Order is by list position, and an unlisted archive is not at the end of the list
by intent - it is outside it. It loses every file it contests, quietly, until
somebody notices.

## A variant swap produces one of each

Swapping a mod variant renames the archive, which leaves a stale entry for the
old filename **and** an unlisted archive for the new one at the same time. Two
findings, one cause. See
[every new archive starts last](/conflicts/every-new-archive-starts-last).

## Before believing an unlisted count at all

A parser that strips `^#` as comments manufactures this exact finding in bulk -
see [modlist.txt has no comment
syntax](/conflicts/modlist-has-no-comment-syntax).
