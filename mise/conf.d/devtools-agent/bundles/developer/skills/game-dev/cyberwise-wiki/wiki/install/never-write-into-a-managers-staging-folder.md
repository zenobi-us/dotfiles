---
type: Environment
title: Never write into a mod manager's staging folder
description: Staging is the manager's record of what it installed, so a file added there belongs to no mod, is invisible in the manager, survives no purge, and silently modifies a mod the user never changed - deliver a zip through the manager instead.
tags: [vortex, mo2, staging, delivery, packaging, maintenance]
status: stable
generated: { by: "claude", at: "2026-08-24T19:38:47-04:00" }
---

# Never write into a mod manager's staging folder

Staging is not a convenient scratch directory that happens to be laid out like
the game. It is **the manager's own record of what it installed**, and every
folder in it is the manager's account of one mod as delivered by its author.

Writing there - adding a file, editing a file, it makes no difference - breaks
four things at once:

- **The manager's database desyncs from the disk.** It believes that folder holds
  a known mod at a known version. It now does not, and nothing reports it.
- **The new file belongs to no mod.** There is no entry to enable, disable,
  order, or uninstall, and nothing to remind anybody it exists.
- **It survives nothing.** A reinstall or an update of the host mod replaces the
  folder contents and the addition is gone, with no error and no record that it
  was ever there.
- **A mod the user did not change now behaves differently.** From their side, an
  author's mod started doing something new. That is the worst property on the
  list: the change has no visible owner.

The last two combine into the failure that actually bites - an edit that works
today, disappears at the next mod update, and takes the fix with it while every
note still says the fix is in place.

## What to do instead

**Ship a zip, and let the manager install it.**

1. Build the archive with the **real in-game folder structure** inside it -
   `archive\pc\mod\...`, `r6\tweaks\...`, `r6\scripts\<yours>\...` - exactly what
   the file would need if unpacked into the game root.
2. Put the zip where the manager looks for downloads.
3. Install it through the manager.

It then arrives as its own mod: visible in the list, orderable, disableable,
removable in one click, and still present after a purge and redeploy. If it turns
out to be wrong, the undo is a toggle rather than an archaeology exercise.

That path costs a minute more than a file copy and is the difference between a
change somebody can find and a change nobody can.

## The corollary: do not edit another mod's manifest either

The same reasoning runs one level down. To add a file that another mod's manifest
would normally list, **rely on that mod's own auto-discovery** - a folder it
scans, an extension point it publishes, a naming convention it honours - rather
than adding your entry to its manifest.

Editing the manifest means editing a file that belongs to someone else, and it
carries the whole cost of doing that: it is reverted by their next update, or it
survives as a stale override that silently outranks the fix they ship. See
[Fixing a bug in someone else's mod](/install/overriding-another-authors-mod)
for the case where there is genuinely no alternative, and for the hash-registry
discipline that makes it survivable.

## The same rule, at the other end

Writing directly into the **game directory** on a managed install is the mirror
image of this and fails for mirrored reasons - the manager cannot see it, and a
deploy or purge silently reverts or orphans it. Both are covered in [What the
game directory shows you depends on how the mods got
there](/install/how-the-install-is-assembled).

The pattern behind both: **on a managed install, the only supported way to add a
file is as a mod.** Anywhere else, the file exists but nothing owns it.

## Related

- [What the game directory shows you depends on how the mods got there](/install/how-the-install-is-assembled)
- [Fixing a bug in someone else's mod](/install/overriding-another-authors-mod)
- [Two downloads from one mod page may not be alternatives](/install/two-builds-of-one-filename)
