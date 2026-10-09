---
type: Diagnosis
title: The game writes its own crash report, and Windows Error Reporting never sees it
description: Cyberpunk 2077 catches its own fault, writes CrashInfo.json and exits cleanly - so there is no Application Error event and no crash dump, however correctly WER LocalDumps is configured. What the file contains, and why a folder of captures is usually far fewer crashes than it looks.
tags: [crashinfo, telemetry, wer, crash-dump, forensics, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T21:10:00-04:00" }
---

# The game writes its own crash report, and Windows Error Reporting never sees it

Cyberpunk 2077 **catches its own fault, writes telemetry, and exits cleanly**.
That single behaviour decides the whole shape of a crash investigation, and it is
not what anybody expects from a game that just disappeared off the screen.

```
%LOCALAPPDATA%\CD Projekt Red\Cyberpunk 2077\CrashInfo.json
```

Written seconds before the process exits, and **overwritten on every crash**.
Snapshot it immediately or the previous one is gone.

| field | use |
|---|---|
| `district` | where the player was |
| `location` X/Y/Z | exact world position |
| `sessionLength` | seconds - far more reliable than log timestamps |
| `crashPatch` | game version |
| `isOom` | whether the game considered it out of memory |
| `crashVisitId` | a per-crash identity, and the only safe dedupe key |

**Crash locations across sessions are the single best lead.** If they cluster, it
is a streaming-sector or archive problem in that district. If they scatter, it is
systemic. That inference only holds if the records are genuinely distinct - which
is the trap below.

**A cluster is still not a reproduction.** Four crashes in one district, on
different objectives, at session lengths of 83 seconds, 17 minutes and 24
minutes, is a *neighbourhood*, not a condition - and blind bisection only works
against a condition somebody can trigger on demand. The state worth reaching is
narrower and much rarer: **the same spot twice, at a known interval from a known
save.** Two crashes 5 m apart on the same job, the second one arriving 46 seconds
after a save load, turns every subsequent bisect round from an evening into a
minute.

Until then, a single crash gets a watcher and more captures - never a suspect
list.

## Windows Error Reporting will never help you

Because the fault is *handled*, nothing reaches WER:

- No Application Error or Hang event. Nothing in the System log.
- **No crash dump, even with WER LocalDumps correctly configured** - `DumpType=2`,
  a writable dump folder, the right executable name. This is not
  misconfiguration. WER only fires on *unhandled* exceptions, and there is not
  one.

Time spent verifying LocalDumps for this game is time spent proving a working
configuration produces nothing. Go to `CrashInfo.json` instead.

The corollary is worth stating too: **a "crash" here may not be a fault at all.**
The engine's own watchdog terminates the process the same way after a stall, and
it is indistinguishable in the crash report - see
[a hang and a crash are different faults](/diagnosis/a-hang-and-a-crash-are-different-faults).

## Dedupe the captures, or you will invent crashes

**The file is overwritten on each crash, but it is NOT deleted on a clean exit.**
It sits there holding the last crash indefinitely. So a watcher that copies it
whenever the process disappears re-saves the *same* record after every normal
quit, each time under a new timestamped filename.

This is not cosmetic. On one install, **21 captured files were 2 real crashes** -
one copied 9 times, one 12. A location analysis over that folder "finds" a 9-hit
cluster in one district that is a single event counted nine times, and the
conclusion - streaming-sector problem, go bisect archives in Little China - is
entirely manufactured. Every number in it is real. The dataset is not.

**Dedupe on `crashVisitId`**, which the game issues per crash:

```powershell
$pm  = (Get-Content $CrashInfo -Raw | ConvertFrom-Json).Data.postMortem
$ids = if (Test-Path $seen) { @(Get-Content $seen) } else { @() }
if ($ids -contains $pm.crashVisitId) { 'clean exit - already on file' }
else { Copy-Item ... ; Add-Content $seen $pm.crashVisitId }
```

Two things follow from the same mechanism:

- **Name the capture after `timeCrash`, not the copy time.** A watcher notices
  death whenever it next polls, which can be minutes late, and a filename built
  from that time makes the crash look like it happened then.
- **Record a verdict per session.** Otherwise "the process is gone" is all you
  have, and a normal quit is indistinguishable from a crash in your own records.

**When you inherit an existing capture folder, count the DISTINCT records before
reading anything into it.** Group by `crashVisitId` first. A folder of
near-identically-named JSON files looks like a rich dataset and may be two
events.

## What a watcher has to do, and the two ways one silently is not running

Sample every 15-30 s to CSV - working set, private bytes, per-process and adapter
GPU memory, free RAM, handle count, thread count - write a marker when the
process disappears, and copy `CrashInfo.json` on death before the next crash
overwrites it, deduped as above.

**In PowerShell, `Start-Job` does not work for this.** Background jobs are
children of the calling session and die when the call returns. Launch detached:

```powershell
Start-Process powershell.exe -WindowStyle Hidden -ArgumentList `
    '-NoProfile','-ExecutionPolicy','Bypass','-File',"<watcher.ps1>","-Out","<csv>"
```

**And an agent may not be able to start one at all.** In a sandboxed or
supervised tool session the whole process tree can be reaped when the call
returns, so `Start-Process` reports success and leaves nothing running. Verify it
survived by matching the process on its `-File <watcher>` command line - a bare
script-name substring also matches the query asking the question, which
cheerfully reports a watcher that is not there. If it did not survive, hand the
command to the user rather than retrying.

**A watcher you believe is armed and is not is worse than none**, because the
next crash then looks like a crash that produced no telemetry.

## Autostart: the scheduled task is the bonus, the logon entry is the plan

Registering a scheduled task is the better mechanism and **should be treated as
the case that fails**. Attempted registration came back
`scheduled task refused (Access is denied.)` - and not only inside a supervised
session: it failed the same way in an ordinary user shell.

So design for the **logon Run entry** and treat a task as an upgrade if it
happens to register. Say the cost of the fallback out loud, because it is real:
**a Run entry starts the watcher at logon and will not restart it if it dies.** A
watcher that died on Tuesday is silent for the rest of the week, and silence is
exactly what it looks like when nothing has crashed.

## Two things that can start a watcher is a race, and losing it is quiet

Once there is both an autostart entry and something the person can click, two
launchers can each run "check whether one is running, then start". That check is
not atomic, and losing the race gives **two watchers interleaving into the same
output folder**, both capturing the same crash - which silently reintroduces the
duplicate records the dedupe above exists to prevent.

**Fix it in the watcher, not in each launcher.** A mutex keyed on the *output
folder* makes a second instance exit immediately whatever started it, while a
second install with its own folder still gets its own watcher. Every launcher
added later inherits the guarantee instead of having to re-implement it.

The same reasoning applies to any autostart route: an entry in
`HKCU\Software\Microsoft\Windows\CurrentVersion\Run` stores an **absolute path**,
so moving or renaming the folder it points at makes Windows fail to launch it at
logon with no error, no log and no dialog. Weeks of "crashes" can pass with
nothing recorded. Anything installed by cloning a repo has this property.

## What the crash report cannot tell you

`CrashInfo.json` knows the **tracked** quest, which is frequently not what the
player was doing, and it knows nothing at all about the last thirty seconds - a
scene, a menu, a vehicle, a load. On one investigation the coordinates and quest
id were in hand and the search space was still enormous; the player's own
sentence - "corpo-rat intro, near Jenkins' office" - collapsed it immediately.

The cheapest instrument in a crash investigation is the person who was looking at
the screen.

## Related

- [Which log carries which symptom](/diagnosis/which-log-carries-which-symptom) - and why a log's last line is not the moment of death
- [Memory is usually a red herring](/diagnosis/memory-is-usually-a-red-herring) - what to do when `isOom` is true, and how not to fool yourself
- [A hang and a crash are different faults](/diagnosis/a-hang-and-a-crash-are-different-faults)
