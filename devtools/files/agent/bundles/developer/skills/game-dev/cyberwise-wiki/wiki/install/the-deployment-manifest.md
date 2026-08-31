---
type: Environment
title: The deployment manifest is the inventory, and it records where each file really went
description: A manager's mod list says what is staged; the manifest it writes at deploy says what is on disk right now, file by file, with each file's real target path - and comparing its filenames against one folder manufactures dozens of files that are not missing.
tags: [vortex, deployment, manifest, inventory, purge, staging]
status: stable
generated: { by: "claude", at: "2026-08-24T20:20:00-04:00" }
---

# The deployment manifest is the inventory, and it records where each file really went

A mod manager's own list answers "what have I installed", which is a question
about the manager. The **deployment manifest** answers "what is on disk right
now, and which mod put it there" - which is the question every diagnosis
actually has. Vortex writes it into the game root as
`vortex.deployment.json`, one entry per deployed file, each stamped with the
staging mod it came from.

That makes it two things nothing else on disk is:

- **the authoritative inventory of what is deployed**, better than the manager's
  list, because staged is not deployed and a manager lists both the same way
- **the only mapping from a deployed file back to its owning mod.** Nothing in
  the archive folder says which mod put a file there.

## Its paths are real target paths, not archive paths

Every entry carries the file's **actual destination**, and the destinations are
spread across the whole install - the archive folder, framework bundle folders,
plugin folders, script folders, REDmod folders. A mod is not one folder, and the
manifest does not pretend it is.

This produces a specific, very convincing wrong answer. Take the manifest's
filenames, compare them against **one** folder, and the files that deployed
somewhere else come back as missing. On one audit that method reported **dozens
of missing files**; checking each entry against its own recorded path returned
**zero**.

> Compare each entry against the path that entry names. Never against a folder
> you chose.

The same mistake in reverse explains "the manager says it deployed but the file
isn't in the mod folder": it deployed, to the place the mod actually installs
into.

## It desynchronises the moment you move something by hand

The manifest is a record of a deploy, and nothing updates it when files move
outside the manager.

- **Files placed by hand are untracked.** The manager does not own them, a purge
  does not remove them, and a later purge-and-redeploy leaves them behind as
  orphans that no list accounts for. Under hardlink deployment their link count
  of 1 is the tell - see
  [how the install is assembled](/install/how-the-install-is-assembled).
- **Files moved or renamed by hand** leave the manifest describing an install
  that no longer exists, and every check built on it inherits that.

The repair is not to edit the manifest. **A purge followed by a deploy discards
the stale manifest and rebuilds it from staging**, which is also why anything
worth keeping has to be in staging rather than only on disk.

## "Disabled" is not "removed" until a deploy has run

Toggling a mod off in a manager changes the manager's intent. The files stay on
disk until the next deployment reconciles them, and the game does not read
anybody's intent.

This costs whole test rounds: a mod is disabled, the game is launched, the
result is attributed to its absence, and it was loaded the entire time.
**Verify on disk - or in the manifest - before spending a launch on the test.**
The manifest is the fast version of that check, because it is a single file
listing exactly what a deploy put down.

## Other managers, and none

The manifest is a Vortex artefact. The equivalent question has a different
answer elsewhere:

| assembly | what plays this role |
|---|---|
| Vortex | `vortex.deployment.json` in the game root |
| MO2 | no single manifest; the truth is the virtual view, and it must be read through the manager |
| manual | **nothing.** There is no mapping from a deployed file to its owning mod at all - say so rather than guessing |

## Related

- [What the game directory shows you depends on how the mods got there](/install/how-the-install-is-assembled)
- [A purge is not a vanilla game](/install/what-survives-a-purge)
- [A staging folder name is a record of the download](/install/staging-folder-names)
