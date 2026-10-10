---
type: Reference
title: Saves live under Saved Games, by publisher and title - not under the game install
description: The path is derived from scratch in session after session, so it goes here as a first-class fact. It also explains why a purge, a verify or a full reinstall never touches a save, and why the mod manager has no view of them at all.
tags: [saves, paths, user-data, purge, reinstall]
status: stable
generated: { by: "claude", at: "2026-08-25T00:28:00-04:00" }
---

# Saves live under Saved Games, by publisher and title

```
%USERPROFILE%\Saved Games\CD Projekt Red\Cyberpunk 2077\
```

One folder per save inside it. This has been asked and re-derived across many
sessions, which is the only justification a bare path needs for an article of its
own.

The shape is the Windows **Saved Games** known folder plus a
publisher-then-title pair - a convention rather than anything specific to this
game, and the reason a guess at `Documents\My Games\...` (the other common
convention) comes up empty.

## Three consequences that are not obvious from the path

**It is outside the game install.** So nothing done to the install touches it: a
mod manager's [purge](/install/what-survives-a-purge), a storefront file
verification, an uninstall and a clean reinstall all leave every save intact.
That is usually a relief and occasionally a surprise - "I reinstalled and the
problem is still there" is frequently a save-borne problem, and this is why.

**The mod manager cannot see it.** A manager deploys into the game directory and
has no view of user data, so nothing in a deployment manifest, staging folder or
mod list will ever mention a save. A mod that writes its state into the save is
therefore invisible to every install-side check
([the deployment manifest](/install/the-deployment-manifest) included).

**It is per-Windows-user, not per-install.** Two accounts on one machine share the
game and not the saves.

## What else is in there

Mods and tooling that need to persist something across sessions land beside the
saves rather than in the game folder, for exactly the reasons above - it survives
a purge and it is not the manager's territory. That includes the records directory
this family of skills keeps, whose location and rationale are in the
`cyberwise` skill.

Consequence worth stating plainly: **backing up "the mods" does not back up the
state.** A complete backup is the install-side deployment plus this directory.

## Reading one

A `.dat` save is not a flat file - it is a compressed block container with an
uncompressed index appended, and a naive seek into it looks exactly like a
decompression bug. The layout is in
[the Cyberpunk save container](/formats/cyberpunk-save-container), and appearance
data specifically is in [appearance in a save](/formats/appearance-in-a-save).

## Scope

Windows. The path has been stable across the game's life and is a platform
convention rather than a patch-dependent detail. Cloud synchronisation adds a
second copy elsewhere, and
[does not necessarily follow its own platform's conventions](/install/platform-cloud-saves-may-ignore-convention).
