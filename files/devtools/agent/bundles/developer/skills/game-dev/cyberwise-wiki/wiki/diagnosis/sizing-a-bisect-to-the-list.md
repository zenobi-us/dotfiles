---
type: Diagnosis
title: Sizing a bisect to the list, and the parking mechanics that decide whether a round tested what you think
description: Bisection is what you reach for when the suspect set is too large to inspect - under about twenty mods it is slower than just looking. How the method scales, why the layer pass beats halving on a mid-sized list, and the filesystem and mod-manager details that quietly void a round.
tags: [bisect, load-order, parking, vortex, mo2, hardlink, method, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T21:10:00-04:00" }
---

# Sizing a bisect to the list, and the parking mechanics that decide whether a round tested what you think

Cyberpunk's load times make bisection expensive - every wasted round is minutes
of somebody's evening. Everything here was learned during a bisect that produced
**six confidently wrong answers** before the real cause.

## Reproduce first, or every clean round is noise that looks like information

A single crash or hang is not a deterministic fault. One confirmation launch is
cheap; a bisect over N items is log2(N) launches, and if the fault is
intermittent then each clean round is noise, and the search quietly points at
whatever happened to be tested last.

The cost, measured: a crash at the intro triggered **four bisect rounds over six
items**. Every round came back clean, and restoring the exact original
configuration loaded fine too - **six clean launches against one crash**. Nothing
was ever found because there was nothing deterministic there.

**"We don't know what that was, watch for it" is a legitimate outcome.** Naming a
culprit by elimination when the underlying evidence is one unreproduced event is
not.

## Match the method to the size of the list

Bisection is not a ritual, and below a certain size it is *slower* than just
looking. The costs quoted here come from large installs; scale them down freely,
because the mechanisms fire identically on a twenty-mod list - they just fire
less often.

**At every size the first question is "what changed", not "which half".** A fault
that appeared right after one install has a suspect list of one, and no amount of
halving beats reading the log and reverting that.

| list size | method |
|---|---|
| under ~20 mods | **do not bisect.** Read the logs, then disable the two or three most recent additions. A binary search here is ~5 launches to find something nameable in zero |
| dozens to low hundreds | skip straight to the **layer pass**. Four launches classify the fault by *kind* of mod, which on a list this size often names the culprit outright |
| many hundreds | bisect properly and budget for it. Around 900 items is ~10 launches for a clean binary search |

The rules - reproduce first, one variable per test, validate against the full
load order - hold at every size. Only the search strategy scales.

## Order of operations

1. **Get to a clean game first.** Turn everything off and launch. This confirms
   the fault is mod-related at all before spending any launches narrowing it, and
   occasionally ends the investigation because it still happens.
2. **Disable whole layers**, not individual files: `r6\scripts`, CET `mods`, all
   `*.xl`, all `*.archive`. Four launches tells you which *kind* of mod is at
   fault and halves the search space cheaply. Skip any layer the install does not
   have - an archives-only list has three of these to test, not four.
3. **Then search within the guilty layer** - but read
   [a failing round narrows nothing](/diagnosis/a-failing-round-narrows-nothing)
   before assuming halving is the search.

**`.xl` files deserve early suspicion for anything that only manifests on a new
game.** Quest-graph rewrites (`intercept: true` entries) only execute when the
quests run from scratch, so an existing save loads fine and the new game
livelocks. The culprit in one such case declared **33 quest parents and 30
intercepts** - by far the heaviest in the load order. Both halves of that
asymmetry have their own articles:
[quest-graph interceptions](/conflicts/quest-graph-interceptions) and
[resource patching runs on the new-game path only](/engine/archivexl-resource-patching).

## Two layer interactions that manufacture failures

The layers are not independent, and a round that ignores this tests something
nobody asked about.

**Park the ENTIRE `.xl` layer for the duration of an archive bisect, as a fixed
variable.** Sidecars patch *into* archive content. With half the archives parked,
sidecars point at content that is not there, and the resulting failures have
nothing to do with the fault being hunted - two consecutive rounds hung
spuriously that way. The round that finally isolated the real culprit ran with
zero `.xl` live.

**Removing one code layer while the other stays live is inconclusive, not
signal.** Mods that ship both a script and a Lua half break in a new way when
only one half is taken out - the reported symptom was *"can't just disable all
the redscripts, makes the game hang in a different way but at same place"*, and a
full removal of the other layer produced a hard crash instead. A round whose
failure changed shape has not narrowed anything; treat both code layers as one
variable, or park neither.

**Check the timestamp on an error before chasing it.** Your own file moves are in
the logs too, and a bisect manufactures errors that look exactly like findings -
[an error can be an artefact of your own testing](/diagnosis/reading-a-noisy-tweak-log).

## Disabling versus parking

**If there is a mod manager, prefer its own enable/disable.** It is reversible,
it records what you did, and it will not desynchronise the manager's picture of
the install. Two manager-specific reasons this matters:

- **A hardlink-deploying manager (Vortex) leaves the staging copy in place.**
  Moving a deployed file out of the game directory leaves the deployment out of
  date, so a later deployment can quietly restore it in the middle of a test.
- **A virtualising manager (MO2) may have nothing there to move.** With the game
  closed the archives may not physically be in `archive\pc\mod` at all, so moving
  whatever *is* there tests nothing. Disable in the manager's own UI.

Park files by hand when there is no manager, when you need finer granularity than
the manager offers - half of one mod's archives, say - or **when the round has to
be armed in seconds rather than minutes.** On a long bisect that last one wins
most of the time: parking is scriptable and recordable, and a manager's UI is
neither.

**Under a hardlink-deploying manager, parking is cheaper than it looks.** Every
file in the game tree is a second name for the staging inode, so moving the
game-side name hides the mod and loses nothing - the staging copy is the same
data, still there, still the manager's. Restoring is a rename back.

**Move, never copy.** A copy makes a new inode, and the file the game then loads
is no longer linked to staging: the manager's next deployment sees a file it did
not place, and any later update to that mod silently stops reaching the game.
`Move-Item`, always.

The cost of choosing parking is that the manager's picture is now stale:

- **Treat a deployment during a bisect as voiding the round.** If the manager
  redeploys mid-run it can restore a parked file underneath you, and the
  configuration tested is not the one recorded. Re-arm rather than reasoning
  about what it might have put back.
- **Restore from the manifest, not from memory**, and report loudly if a file is
  not where the manifest says it was parked - something else moved it, and every
  round since is suspect.

## Where to park

**Inside the game folder** - `<game>\_bisect_parked\`, or similar.

- Same volume, so moves are instant rather than gigabyte copies.
- Nothing cleans it.

**Do not park in `%TEMP%`.** Temp sweepers run on their own schedule and will
delete parked mods mid-procedure. In one session this cost **208 staged archives
and a full redeploy**.

## Rules that are easy to break

**Never modify mod files while the game is running.** The results are
uninterpretable and you will not know which state was actually tested. Gate every
move on the process being closed. If a user says a result was odd "given you
change files while it's running", that trust is already gone and every prior
round is suspect.

**One variable per test, and write down which.** Crash investigations accumulate
variables fast - driver updates, settings changes, mod changes. In one session a
mod-setting test and a driver update were nearly run together, which would have
made both results uninterpretable. Prefer tests that are instant and reversible:
an in-game settings toggle beats a redeploy, a graphics setting beats a driver
rollback.

**Write every round down.** *Which configuration was that, exactly?* is the
question that ruins long bisects, and it always gets asked three rounds later. A
per-round manifest lets a different session - or the user alone - pick the bisect
up cold.

**A round that parks 37 of 38 is not the round in the manifest.** Refuse a
partial set outright. An unresolvable name silently parks nothing, which scores
as "the fault went away" and sends the whole search down the wrong branch.

**Do not theorise during a bisect.** When someone is launching the game
repeatedly on your instructions, they need the next instruction, not a
hypothesis. Narrate findings afterwards.

**Validate the answer against the FULL load order.** Restore everything, withhold
only the suspect, and confirm the fault disappears. Answers validated against a
stripped-down configuration are worthless - several of the six wrong answers in
that session were "confirmed" that way, and each fell over later.

## Two things that make a bisect find the wrong answer

**Dependency chains.** Disabling two mods together can produce a *new* failure
because one depended on the other. If a fault changes shape when a group is
disabled, split the group rather than concluding you have found the cause.

**A mod that was never running.** A mod may be inert for reasons unrelated to the
bisect - a `.reds` file that is not in the compiled bundle is installed, correct,
and doing nothing. Confirm the mod being tested is actually running before
drawing any conclusion from disabling it.
[A .reds file on disk is not code the game is running](/engine/compiled-script-bundle).

## Reporting

Say plainly which configuration was tested, what the outcome was, and what
remains untested. When an earlier answer is disproved, **say it is disproved** -
a list of superseded theories is genuinely useful, because the next person will
otherwise propose them again.

## Related

- [A failing round narrows nothing, and a clean round proves everything](/diagnosis/a-failing-round-narrows-nothing)
- [When halving stops paying, write a guard](/diagnosis/writing-a-guard-mod)
- [A hang and a crash are different faults](/diagnosis/a-hang-and-a-crash-are-different-faults) - why no watcher can return the verdict for you
- [What the game directory shows you depends on how the mods got there](/install/how-the-install-is-assembled)
