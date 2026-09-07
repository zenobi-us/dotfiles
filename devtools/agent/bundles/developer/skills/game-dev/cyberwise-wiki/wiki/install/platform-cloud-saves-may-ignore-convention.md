---
type: Process
title: A storefront's cloud-save integration may not follow the storefront's own documented layout
description: The documented per-app remote folder may simply not exist for a given title, there may be no per-game sync toggle at all, and disabling sync globally then deleting the local saves can result in them being re-downloaded. Do not reason from the documented layout - go and look.
tags: [cloud-saves, storefront, saves, sync, verification]
status: draft
generated: { by: "claude", at: "2026-08-25T00:34:00-04:00" }
---

# A storefront's cloud-save integration may not follow its own documented layout

Digital storefronts document how cloud saves work: a remote directory per
application, identified by the app's id, holding the synchronised files, and a
per-game switch to turn synchronisation off.

**Any part of that may not be true for a given title**, and reasoning from the
documentation instead of from the filesystem produces confident, wrong advice
about somebody's saves - which is the worst category of thing to be confidently
wrong about.

## What was actually observed

On one machine, for this game:

- **The documented per-application remote folder did not exist.** Not empty - not
  present. Every instruction that begins "open the remote folder for this app id"
  had nowhere to go.
- **There was no per-game sync toggle**, only a global one covering everything.
  So "just turn cloud saves off for this title" was not an available action.
- **Disabling sync globally and deleting the local saves resulted in the saves
  coming back.** They were re-downloaded rather than staying deleted.

That last point is the dangerous one, because it inverts the intent of the action.
Somebody deleting saves to get a clean state, having taken the documented
precaution first, ends up with the old saves restored and no indication that
anything overrode them.

## Why the documented layout is believable

It is documented, it is consistent across most titles, and it is what the
storefront's own help pages describe. Integrations are per-title and can be
implemented in more than one way; a title can also change its integration between
releases without anything user-visible announcing it. The documentation describes
the intended mechanism, not this title's implementation - the same relationship as
[a mod's own labels describing the mod rather than the engine](/patterns/live-state-is-not-defaults).

## What to do

**Look before advising.** Check whether the remote folder exists for this app id,
and whether a per-game toggle is present in the client, before telling anybody how
to disable or clear anything.

**Do not delete saves as a diagnostic step.** Move them - the directory is
[outside the install and outside the manager's view](/install/where-the-game-keeps-its-saves),
so a rename or a copy elsewhere is a complete, reversible isolation. If a sync
restores something, the copy is still there.

**Treat "the saves came back" as evidence, not as a failure of the attempt.** It
tells you synchronisation is active on a path you thought was covered, which is a
finding worth having before anything else is tried.

## Confidence and scope

`draft`. This is **one person's machine, one storefront, one title, at one point in
time** - three of the four claims are negative observations, and a negative is only
as wide as what was looked at. It is recorded because the generalisation is what
matters: verify a platform integration against the filesystem rather than against
the platform's documentation. The specifics should be re-checked, not quoted.
