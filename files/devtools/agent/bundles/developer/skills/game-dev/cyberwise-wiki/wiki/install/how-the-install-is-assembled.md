---
type: Environment
title: What the game directory shows you depends entirely on how the mods got there
description: Manual, Vortex, MO2 and Wabbajack installs present four different pictures on disk - one of them can show an almost empty game folder, and one of them deletes every mod you add. How to tell which you are looking at, and what each one makes untrue.
tags: [vortex, mo2, wabbajack, manual, deployment, hardlink, usvfs]
status: stable
generated: { by: "claude", at: "2026-08-24T18:30:00-04:00" }
---

# What the game directory shows you depends entirely on how the mods got there

Almost every diagnostic technique reads the game directory. Whether that
directory tells you the truth depends on how mods arrived in it, and there are
four very different answers. **Establish which one you are looking at before
trusting anything on disk.**

Every path is relative to the game install root. Steam, GOG and Epic put that
root in different places, users move it, and it is not always on C:. Get the real
root once and never assume a drive letter.

## Detecting the mode

| look for | means |
|---|---|
| Vortex marker files; a staging root full of `<Display Name>-<NexusID>-<version>-<timestamp>` folders; deployed files with **link count 2** | Vortex |
| `ModOrganizer.ini`; mods under MO2's own `mods\` tree; a game directory that looks suspiciously bare while the game is closed | MO2 |
| MO2 mods whose names start with `[NoDelete]`; a `.wabbajack` file; an MO2 install inside the list's own folder | a Wabbajack list (which builds an MO2 install) |
| files simply present, no markers, no staging root, no deployment step | manual |

Staging roots are **relocatable and frequently relocated** - Vortex's hardlink
deployment requires staging to sit on the same volume as the game. Ask for the
path; do not assume one.

**The modes are not exclusive.** A managed install routinely carries
hand-dropped files alongside managed ones, plus files mods write at runtime. So
"the manager doesn't list it" is never evidence a file is not loaded.

## Manual

Files are physically in the game directory and what you see is what the game
loads. This is not a beginners-only setup; large hand-built load orders exist.

Two consequences:

- **There is no staging copy, so any hand-edit is the only copy.** Back it up
  before editing.
- **There is no manifest**, so nothing can say which mod a given file came from.
  A mod's files merge into the game's own tree, and grouping-by-folder only
  works where the mod happened to ship a folder of its own.

Because there is no manifest, an uninstall is a file-by-file removal, and
leftovers from a half-removed mod are a routine cause of "I already uninstalled
that". The downloaded archives' file lists are the only record of what each mod
put where - keeping them is the whole backup strategy.

## Vortex

- **Deployment is by hardlink** *on the default method*. Editing a deployed file
  also edits the staging copy. Vortex can be set to symlink or move deployment
  instead, under which the next two points do not hold - check the deployment
  method before relying on either.
- **Write through the link.** A tool that replaces a file by delete-and-recreate
  breaks the hardlink and desynchronises staging. Prefer in-place writes.
- **Link count tells you the origin.** Under hardlink deployment, a deployed
  file with link count 2 is manager-managed. Link count 1 means it was created
  in-game or installed by hand - which is why a purge does not remove it, since
  it is not in the deployment manifest. This is the fastest way to explain a file
  the manager denies owning.
- **Staging folder names lie about versions.** Updates happen *in place*,
  keeping the original folder name while replacing the files. Never infer a
  version from the folder name.
- **Never diff the mod directory mid-deploy.** It reports transient states as
  additions and removals. Confirm no operation is running first.

## MO2 - the important one, because the filesystem lies

MO2 and Cyberpunk are **not natively compatible**; MO2 without extra setup
produces script-extender and framework errors. Working installs rely on the
**Root Builder** plugin, and that changes what is visible:

- **Root Builder copies its folders into the game directory at launch and
  removes them again when the game closes.** Inspecting the game directory with
  the game shut down can show almost nothing, and what it does show may be stale.
- **USVFS virtualisation means mod files may never be physically present** in the
  game directory at all. The merged view exists only for processes inside MO2's
  virtual filesystem; a script run from outside sees the bare game.
- **CET 1.27+** is required for USVFS compatibility; 1.26 and earlier do not
  work. A confusing CET failure on an MO2 install is worth checking against this
  first.
- REDmod deploys automatically before launch, so REDmod state is a launch-time
  artifact rather than something sitting on disk.

Practical consequences on MO2:

- "The file isn't there" is not evidence the mod isn't installed.
- Conflict and load-order scanning must run against **MO2's own mod list and its
  virtual ordering**, not against the deployed archive folder.
- Inspection must be run **through MO2** so it inherits the VFS, not from a
  plain shell.
- Hand-editing a deployed file is pointless - Root Builder discards it on exit.
  Edit the file in MO2's mod folder instead.

Quick test for whether an install virtualises: with the game closed, does the
deployed archive folder contain the archives the user says are enabled? If not,
you are outside the VFS and must change approach.

## Wabbajack lists - the mode that deletes your work

A Wabbajack list is not a fourth mod manager. It is an automated installer that
builds a curated **MO2** install, so everything above applies, plus one rule
that overrides most of this page:

> **Updating the list DELETES every mod that is not part of the new version.**

That includes every fix, override and patch mod added by hand. It is not a bug
and there is no undo; it is how the list guarantees a reproducible install.

### `[NoDelete]`

Mods whose **name begins with `[NoDelete]`** survive the update. Anything added
to a Wabbajack list must be named that way, or the next update removes it
silently and the problem it fixed comes back with no explanation.

```
[NoDelete] My Compatibility Fix
[NoDelete] Config Files
```

Two consequences that are easy to miss:

- **`[NoDelete]` mods re-sort alphabetically after an update**, so a carefully
  chosen priority is lost even though the mods survived. The convention is to
  number them - `[NoDelete] [0000]`, `[NoDelete] [0001]` - so the order lives in
  the name. Tagger plugins automate the numbering.
- **Load order changing silently is a load-order bug.** Re-check conflicts after
  any list update, exactly as after installing a mod.

`[NoDelete]` is **Wabbajack itself, not one list's convention** - it works on any
Wabbajack list for any game. The numbering habit and the tagger plugins are
community practice layered on top.

### Say the support boundary out loud

These lists are curated wholes, and their authors generally state that problems
caused by added mods are the user's own responsibility. Someone who adds mods on
your advice has stepped outside the list's support, and should know that before
they do it rather than when they go asking its maintainers for help.

Lists also commonly require **a clean install with no leftover mod files** -
relevant when somebody moves to a list from a hand-built load order, because
leftovers in the game directory are exactly the kind of thing no manager owns.

*Wabbajack behaviour is general and applies to any list for any game. The
clean-install requirement and support boundary above were read from the guide of
the prominent Cyberpunk 2077 list (Project Ultrapunk) in August 2026; other
lists state their own.*

## A manager only owns what it deployed

Files written **directly into the game directory** are invisible to the manager
that is supposed to be running the install. A purge, a redeploy, or an update of
the mod they belong to silently reverts or orphans them, and deployed state
drifts from staging with nothing reporting it.

This bites hardest when it appears to work. On one install a working version of a
hand-built mod existed **only** as loose files in the tweaks folder, while
staging still held the superseded version - so the next deploy quietly restored
the old one and the "fixed" mod stopped being fixed, for reasons nothing
explained.

**Package a mod as a zip and install it through the manager** rather than
writing into the game folder. Then the manager owns it, an uninstall is clean,
and the version present is the version it believes is present.

## Files created in-game are not backed up by any manager

Presets, saved configurations and script libraries written by mods at runtime are
created *after* deployment, so no manager has a copy.

- **Vortex:** they exist only in the deployed game folder. They survive a purge
  (not being in the deployment manifest) but are lost on a mod reinstall or a
  manual clean.
- **MO2:** writes from inside the VFS are normally redirected into the
  **Overwrite** folder rather than into the mod that prompted them, so they exist
  but belong to no mod. Look there before concluding a preset was lost.
- **Manual:** they sit alongside the mod's own files and are indistinguishable
  from them, so a "delete the mod folder" uninstall takes them too.

Back these up outside the game directory if they represent real work.

## Resolving an internal name back to a findable mod

Never leave somebody holding an identifier they cannot search for. Internal names
are chosen by authors for their own convenience and frequently share nothing with
the mod's public name.

| manager | method |
|---|---|
| Vortex | the staging folder name encodes it: `<Display Name>-<NexusID>-<version>-<timestamp>` |
| MO2 | the `mods\` subfolder name is the name shown in the UI (set at install, so user-edited) |
| manual | **no mapping exists.** The folder name is all there is - say so rather than guessing |

The Vortex pattern holds for mods installed from Nexus. Anything added from a
local archive or dragged in by hand can carry any folder name at all, so treat a
name that does not match the pattern as *unknown provenance*, not as a parse
failure. And a derived id is a claim until it is checked against the
authoritative name - see
[Documenting a large mod list](/process/running-a-documentation-pass).

For a file rather than a folder, find which staging or mod folder **contains that
filename**. That single step answers "which mod is this from" far more reliably
than reasoning about the name.

### Why it is worth doing even when you think you know

**A file's name may have nothing to do with the mod shipping it.** An archive
whose name described removing an underwear mesh turned out to be bundled inside a
**dress mod** - shipped as a dependency so the dress would sit correctly.
Searching the manager for the obvious keyword found nothing, and it could not be
located until the containing mod was identified by tracing the file back to
staging.

**The folder name carries more than the name.** A staging folder reading
`01 - BODY - PALE-<id>-<version>-<timestamp>` gives the display name, the site
id, and - from the `01` prefix - that this is one numbered part of a **modular**
mod. When a problem turned out to be a missing leg texture, that `01` was the
clue that other parts existed and one of them might supply it.

### File timestamps do not tell you when a mod was installed

Managers preserve the timestamps inside the mod archive, so a deployed file's
mtime is the **author's build date**, not the install date. "Find everything
newer than last Tuesday" therefore misses most of a fresh deploy and is not a
reliable way to answer "what changed".

What is reliable: diff the archive list against a known-good load order file, or
read the manager's own install dates (a Vortex staging folder name carries an
install timestamp as its trailing number; MO2 shows an install date per mod).
With no manager the list diff is the only option - a good reason to keep a copy
of the last known-good list.

The exception that misleads further: logs and caches under a framework's plugin
folder **do** update on every run, so a timestamp sweep surfaces those and makes
it look like frameworks were updated when only their logs moved. Check the DLL's
own date before concluding a framework changed.

### What to give the user

Display name, site id, and where it deployed. That is enough to find it in a
manager, find it on its mod page, and check its file list for parts they may not
have.

## Related

- [Two downloads from one mod page may not be alternatives](/install/two-builds-of-one-filename)
- [Fixing a bug in someone else's mod](/install/overriding-another-authors-mod)
- [There are two load-order systems](/engine/two-load-order-domains)
