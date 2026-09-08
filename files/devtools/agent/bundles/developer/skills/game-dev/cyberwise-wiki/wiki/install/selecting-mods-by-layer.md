---
type: Environment
title: Parking a directory selects an axis the mod list does not have
description: A manager selects mods - by name, category or profile - and it can select many at once. What it cannot express is "every mod that ships a script", because that is a property of files rather than of mods, and each layer boundary happens to be exactly one directory.
tags: [bisect, layers, deployment, diagnosis, manager, method]
status: stable
generated: { by: "claude", at: "2026-08-24T20:20:00-04:00" }
---

# Parking a directory selects an axis the mod list does not have

Renaming a directory out of the way - "parking" it - turns an entire mod layer
off in one reversible step. That is often described as being faster than using
the manager, which is not the real argument and is not always true.

**The real advantage is the axis.**

## What a manager can and cannot express

A manager selects **mods**. It groups them by name, by category, by profile, and
it can absolutely select many at once - claiming otherwise is wrong, and has
been corrected once already.

What it cannot express is a selection whose criterion is a property of *files*:

- every mod that ships a script, whoever wrote it
- every extension file of a given kind, regardless of which mod owns it
- the tweak layer, including the parts that arrived bundled inside mods that are
  mostly something else

Those are not categories in anybody's list, because a mod that is 40 archives
and one script is filed under whatever it is *for*. Reconstructing the set by
hand means inspecting every mod's contents first - which is the work the test
was meant to avoid.

## Each layer boundary is exactly one directory

The game reads each kind of mod from one place - archives, REDmod, script
extender plugins, framework plugins, scripts, tweaks, input bindings. That
mapping is what makes the axis available at all: **the set "every script mod" has
no name in the manager and one path on disk.**

So a layer test is one rename and one launch, and it answers a question a
mod-by-mod bisect needs many launches to approach: *which layer is this fault
in?* That is usually the right first question -
[sizing a bisect to the list](/diagnosis/sizing-a-bisect-to-the-list).

## What it costs

Parking is a manual file move, with everything that implies:

- **It desynchronises the deployment manifest**, which then describes an install
  that does not exist. Restore the directory before deploying, or purge and
  deploy to rebuild - see
  [the deployment manifest](/install/the-deployment-manifest).
- **It is invisible to the manager**, so nothing will remind anybody it is still
  parked. Record what was moved and where, in a file, not in a conversation.
- **On a virtualising install it does not work at all**, because the directory
  being inspected is not the directory the game reads. Establish how the install
  is assembled first - [how the install is assembled](/install/how-the-install-is-assembled).
- **The script layer needs its result verified**, because a parked scripts
  folder only takes effect once the compiler re-runs. The output blob's size is
  the check - [compile-testing redscript](/engine/compile-testing-redscript).

## When to use the manager instead

When the selection *is* a set of mods - a suspect list, a category, everything
added since a date. The manager tracks its own state, survives a redeploy, and
leaves no directory sitting renamed. Park a directory when the criterion is the
layer; use the manager when the criterion is the mods.

## Related

- [The deployment manifest is the inventory](/install/the-deployment-manifest)
- [A purge is not a vanilla game](/install/what-survives-a-purge)
