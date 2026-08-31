---
type: Process
title: Check what the base game contains before making claims about it
description: A feature was declared vanilla, then declared non-existent, then declared cyberware-gated, all from greps of a stale compiled bundle - while the user who had stated the correct answer at the start was contradicted three times.
tags: [method, redscript, bundles, vanilla, false-lead, evidence]
status: stable
generated: { by: "claude", at: "2026-08-26T22:00:00-04:00" }
---

# Check what the base game contains before making claims about it

The base game is a file. Read it.

## The two bundles, and the third one that is a trap

| path | what it is |
|---|---|
| `r6\cache\final.redscripts` | vanilla baseline, as shipped |
| `r6\cache\final.redscripts.modded` | **live**, rewritten every launch with all mods |
| `r6\cache\modded\final.redscripts` | a different file that may be **stale** |

On one install the third was four days old and 16 MB while the live bundle was
40 MB. Every "the bundle says" claim made from it described a snapshot nobody
was running. **Check mtime and size before quoting any of them.**

## Symbol presence rules things out, never in

`RemoteBreach` greps clean out of the *vanilla* bundle. Remote breach on devices
is nevertheless supplied by CustomHackingSystem plus a mod that configures it -
and on the install in question that mod's Lua setup had thrown
`attempt to concatenate global 'vehicleMinigameEasy' (a nil value)` and
registered nothing at all.

Both facts are true simultaneously. A class can be compiled into the bundle and
be unreachable in play. So:

- **Symbol absent** → the feature is not there. Reliable.
- **Symbol present** → nothing follows. Not evidence.

## What actually establishes availability

| question | what answers it |
|---|---|
| does this thing offer the action? | log the action list the running game hands you, before judging it |
| why is it unavailable? | the action's `IsInactive()` and `GetInactiveReason()` |
| who supplies it? | `vortex.deployment.json`, then that mod's own source |
| is it vanilla? | the vanilla bundle **and** a run with the mod disabled |

All four are cheap. None of them is a grep.

## The failure this is written from

A satellite dish carrying a breach mappin could not be breached. Across two days
and four releases it was attributed to backdoor status, to missing access
points, to Nanowire cyberware, and to the mod's own permission gate - none
measured, each stated as a finding.

The user had said at the outset that remote breach is not a vanilla feature.
That was correct, and it was contradicted three times from the stale bundle.

One diagnostic line listing the device's offered actions ended it immediately:
the action was present, the mod permitted it, no jack-in point existed on the
device at all, and the mod supplying the minigame had crashed at startup that
morning. Nothing in that required a theory.

## The tell

You are guessing whenever a sentence about the base game's behaviour traces back
to a grep, a memory, or an inference from a class name - rather than to a log
line from the running game or a file you opened this session. **When the user
tells you what the base game does, they are running it. You are not.**
