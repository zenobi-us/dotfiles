---
type: Environment
title: A purge is not a vanilla game
description: A purge removes what the manifest tracks, which is much less than "the mods" - injector DLLs, framework plugin folders, the compiled script cache and the REDmod folder all survive it. And the first launch afterwards is genuinely very long, which looks exactly like a hang.
tags: [vortex, purge, deployment, baseline, bisect, shader-cache, hang]
status: stable
generated: { by: "claude", at: "2026-08-24T20:20:00-04:00" }
---

# A purge is not a vanilla game

"Purge and see if it still happens" is offered as a way to get a clean baseline.
It is not one. A purge removes **the files in the deployment manifest**, and a
modded install contains a great deal that was never in it.

## What is still there afterwards

| survives | why |
|---|---|
| the injector / loader DLLs in the game's binary folder | commonly installed by hand or by their own installer, so no manager owns them |
| leftover script-extender mod folders | the mod's own subfolder persists once anything in it was written at runtime |
| framework plugin folders | logs, caches and generated files inside them are runtime writes, untracked by definition |
| the compiled script cache | built at launch, never deployed |
| the REDmod folder | put there by the REDmod deploy, a different pipeline from the manager's |

So the state after a purge is: no archives, no tweaks, most loose script mods
gone - and the whole framework layer still loading, still logging, still
executing whatever of its own it wrote. That is a useful state. It is not
vanilla, and calling it vanilla makes the next conclusion wrong.

**If the fault could live in a framework's own plugin folder or in the compiled
cache, a purge does not clear it**, and a fault that survives a purge is not
thereby exonerated of being mod-related.

For a genuine vanilla comparison, verify the binary folder and the framework
directories directly, or test against a separate untouched copy of the game.

## The first launch afterwards looks exactly like a hang

Removing the mod layer invalidates the shader cache, and the game rebuilds it on
the next launch. That launch is **genuinely, unusually long** - minutes of
apparently nothing, no window, no error.

It is indistinguishable by observation from the failure-to-launch it is often
mistaken for, and the mistake is expensive in both directions: somebody kills a
working rebuild and repeats it, or somebody waits out a real hang.
[A hang and a crash are different faults](/diagnosis/a-hang-and-a-crash-are-different-faults)
covers telling them apart; the specific thing to know here is that a long first
launch after a purge is **expected**, and that disk and GPU activity during it
is the evidence that it is working.

Warn about it *before* the purge. Afterwards it reads as a new symptom.

## Restoring is a deploy, not an undo

The way back is to deploy again, which rebuilds the manifest from staging - so
anything that existed only as a deployed file, and never in staging, does not
come back. Runtime-created presets and configurations are the usual casualties,
and they were never the manager's to restore.

## Related

- [The deployment manifest is the inventory](/install/the-deployment-manifest) - what a purge actually operates on
- [Parking a directory selects an axis the mod list does not have](/install/selecting-mods-by-layer) - the cheaper way to remove one layer rather than all of them
- [What the game directory shows you depends on how the mods got there](/install/how-the-install-is-assembled)
- [A .reds file on disk is not code the game is running](/engine/compiled-script-bundle) - what the surviving compiled script cache actually is, and why a stale one is invisible
