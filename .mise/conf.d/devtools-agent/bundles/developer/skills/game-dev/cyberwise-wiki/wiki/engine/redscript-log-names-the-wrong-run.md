---
type: Engine Mechanic
title: An archived redscript log is named for the run that replaced it
description: redscript rotates by renaming the current log with the timestamp of the run displacing it, so every archived log contains the previous run - and a compile test destroys the record of the last real launch.
tags: [redscript, logs, rotation, scc, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T18:30:00-04:00" }
---

# An archived redscript log is named for the run that replaced it

This costs an afternoon if you do not know it, because the wrong log is not
obviously wrong. It is a full, plausible compile of the same install.

redscript rotates its log by renaming the current file with the timestamp of the
run that is **displacing** it. So `redscript_r2026-08-14_21-49-16.log` contains
the run from 2026-08-12 23:35, not from the 14th.

Verified across five consecutive rotations on one install. Every file's first
line matched the *previous* file's name, never its own:

| filename says | first line says |
|---|---|
| `redscript_r2026-08-12_23-35-25.log` | 12 Aug 23:24 |
| `redscript_r2026-08-14_21-49-16.log` | 12 Aug 23:35 |
| `redscript_r2026-08-15_03-09-22.log` | 14 Aug 21:49 |
| `redscript_r2026-08-16_09-05-07.log` | 15 Aug 03:09 |
| `redscript_rCURRENT.log` | 16 Aug 09:05 |

**Read the first line. Never the filename.**

## A compile test destroys the record of the last launch

Compile-testing runs the same compiler the game does, so it **overwrites
`redscript_rCURRENT.log`** and pushes the real launch's log into a rotation
named after the test. Two consequences:

- The newest run on disk is frequently not the one that produced what the game
  is currently running.
- Tell them apart by the **output path**: a test writes under `%TEMP%`
  (`scc_test_<guid>\`, `scc_cache\`), a launch writes to the install's cache.

To find the last real launch, walk the rotations for the newest run whose output
is **not** a temp path.

The compiler also rotates at five files, so a run of compile tests destroys
older history outright. Copy the log directory before testing if that history
matters.

## Related

- [A .reds file on disk is not code the game is running](/engine/compiled-script-bundle) - what the log is evidence about
