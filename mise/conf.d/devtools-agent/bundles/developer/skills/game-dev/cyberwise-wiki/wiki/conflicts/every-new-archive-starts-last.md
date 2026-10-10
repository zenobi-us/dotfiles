---
type: Interaction Pattern
title: Every newly installed archive starts at the bottom of the priority stack
description: Whatever writes modlist.txt appends new entries at the end, and under earlier-wins the end is last place - so every install, update or variant swap begins by losing every file it contests, and any hand-settled order quietly undoes itself.
tags: [load-order, modlist, append, precedence, variant-swap, conflicts]
status: stable
generated: { by: "claude", at: "2026-08-24T21:00:00-04:00" }
---

# Every newly installed archive starts at the bottom of the priority stack

Every tool observed writing `modlist.txt` **appends new archives at the end**,
and a hand-added line naturally lands there too. Under
[earlier-wins](/conflicts/earlier-wins-and-nothing-in-the-game-writes-the-list)
the end is the bottom of the priority stack, so:

> Every newly installed or variant-swapped mod starts out losing every file it
> contests.

There is no error, no warning and no in-game sign. The only symptom is that the
mod appears to do nothing.

On one install this silently killed the same retexture **twice in a single
session** - once under its original filename, and then again after a variant
swap produced a *new* filename that was appended fresh.

## So the check belongs after every change to the mod set

Install, update, uninstall, variant swap, or a manager deployment. The check
needs no particular tooling and no particular manager, because it reduces to one
question:

> for each archive, does it own any of its own files?

See [detecting an inert archive](/conflicts/an-archive-that-contributes-nothing)
for how that is answered, and how cheap it is.

## A variant swap produces two faults at once

Swapping a mod variant - a skin tone, a hair colour - usually renames the
archive. That leaves **a stale entry** for the old filename and **an unlisted
archive** for the new one, simultaneously. See
[an entry and a file can disagree](/conflicts/an-entry-and-a-file-can-disagree).

It also breaks any precedence rule written against the exact old name, and it
breaks it **silently**: nothing errors, the new archive is merely unlisted, and
unlisted sorts last. A skin texture that has to beat a catch-all ends up losing
to it, and the only symptom is that the character looks wrong. Rules that must
survive a variant swap need to match on a pattern, not a name.

## The order does not hold itself in place

When a conflict is settled by hand, **write the decision down somewhere
durable** in the mechanical form `X must precede Y`, plus *why*. A few lines in
a notes file is enough.

This matters because the fix is not self-sustaining: a reinstall or the next
deployment re-appends the archive at the end and quietly undoes it, and six
weeks later nobody remembers why the order was that way. Keeping the decisions
in that form is what makes them re-checkable at all - by eye on a short list, by
script on a long one - and re-checking them is the difference between a load
order that stays fixed and one that gets re-diagnosed from scratch every few
months.

A catch-all AIO retexture belongs **late** in the list, so that specific mods
beat it. That is the most common standing rule anyone writes.

## A tool can delete the file rather than stop managing it

At least one conflict-checker's "enable load order re-ordering" checkbox
**deletes `modlist.txt` when unchecked**. Unchecking it does not merely stop the
tool reordering - it removes the file, dropping the install back to alphabetical
order with no explicit control at all.

If a load order suddenly reverts, check the file still exists before re-deriving
anything from the archives.
