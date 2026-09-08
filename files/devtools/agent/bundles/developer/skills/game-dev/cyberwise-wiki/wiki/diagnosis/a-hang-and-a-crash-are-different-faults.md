---
type: Diagnosis
title: A hang and a crash are different faults, and only one of them lets you interrogate the process
description: A hung game is still alive, so it can be sampled - responding state, thread state counts, CPU delta, and which log is still growing. None of that is available after a crash, all of it is destroyed by killing the game, and a watchdog kill afterwards looks identical to a fault crash in the crash reporter.
tags: [hang, livelock, watchdog, red4ext, sampling, threads, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T21:10:00-04:00" }
---

# A hang and a crash are different faults, and only one of them lets you interrogate the process

Both end the same way - a game that is not playable and, eventually, a process
that is gone - and they get filed under the same word. They are not the same
fault, and they do not leave the same evidence.

**A crash leaves a post-mortem and nothing else.** The process is gone before
anybody can look at it.

**A hang leaves a live process.** It is still running, still holding its threads,
still writing (or conspicuously not writing) its logs, and it can be **sampled**.
That evidence exists only during the hang, it takes about a minute to collect,
and the instinctive first move - kill the game - destroys all of it.

**Sample the hung process before killing it.** Nobody thinks to, and there is no
second chance.

## What to sample, and what each answer rules out

Four cheap readings, none of which requires a debugger.

**1. Is the process responding at all?**

```powershell
$p = Get-Process Cyberpunk2077
$p.Responding        # True = the message pump is alive
```

`Responding: True` on a game that has not drawn a frame in ten minutes is a
finding, not a contradiction. The window is still pumping messages; something
else is not finishing.

**2. Thread state counts.**

```powershell
$p.Threads | Group-Object ThreadState | Sort-Object Count -Descending
```

The shape is the point. A handful Running against a large majority Waiting says
the work is concentrated in a few threads rather than distributed - which is what
a spin looks like, and is not what a heavy load looks like.

**3. CPU over a short interval, not total CPU.**

```powershell
$a = (Get-Process Cyberpunk2077).CPU
# ...wait a measured interval...
$b = (Get-Process Cyberpunk2077).CPU
($b - $a)   # seconds of CPU per second of wall clock; divide by core count for %
```

Total CPU since launch is meaningless on a long session. The *delta* over ten or
twenty seconds says whether it is spinning or idle, and how many cores' worth.

**4. Which log is still growing.**

Take file sizes across the same interval rather than reading contents. A log that
is still being appended names the layer that is still alive; a log that stopped
names the layer that stopped. That distinction is the whole diagnosis below.

## Separating a livelock from a slow load, in about a minute

A long load and a hung load look identical on screen, and the argument about
which one it is usually costs more time than the measurement. Three readings
settle it, and two of them are already above:

| | still loading | livelocked |
|---|---|---|
| working set | **climbing** | **flat** |
| logs | growing | silent |
| bytes written **anywhere under the game folder** | non-zero | **zero** |

The third row is the one nobody takes, and it is the most decisive: a game that
is loading is reading and writing - caches, logs, shader compilation - and a
livelocked one writes nothing at all while burning cores.

One measured trace, taken ten seconds apart through a failing start: memory 1.65
GB climbing to 5.98 GB with logs growing to t=90 s, then **flat at 5.98 GB, zero
bytes written, 4.2 to 4.6 cores** from t=100 s onward with no forward progress.
The thread shape was one thread near 100%, one near 60%, and about ten workers at
roughly 18% each - a main thread and a job pool, spinning.

Sixty seconds of measurement replaced fifteen minutes of waiting to see whether
it would finish.

## The worked case: 200% CPU, twelve minutes, and not one log line

Observed on a hung session:

| reading | value |
|---|---|
| `Responding` | **True** |
| audio | still playing |
| threads | **2 Running, 150 Waiting** |
| CPU | **~200%** - two cores pegged |
| logs | **nothing written for 12 minutes** |

The silent logs are the load-bearing observation, and they carry a *negative*
that nothing else could establish:

**A looping script logs.** Script-layer runaways - redscript, CET Lua - produce
output: errors, warnings, the mod's own prints, at minimum something from the
framework. Twelve minutes of a pegged process writing not one line **rules out a
script loop**.

Two cores at 100% with the script layers completely silent is **native code
spinning**. That is a different suspect list entirely - engine, a native plugin,
a driver - and reaching it took four readings and no launches. Two of those
readings (thread states, CPU delta) are impossible after the process is gone.

## It ended with the engine killing itself

```
[error] [RED4ext] File: engineWatchdog.cpp   Line: 198
[error] [RED4ext] Message: Watchdog timeout! (120 seconds)
```

**That line is the diagnosis.** The main thread failed to service a frame for 120
seconds, and the engine terminated itself.

The consequence is the part worth memorising:

**A watchdog kill and a fault crash are indistinguishable in the crash reporter.**
The game exits, `CrashInfo.json` is written, and it reads like any other crash -
same fields, same shape, no flag saying "this one was a stall, not a fault"
([the game writes its own crash report](/diagnosis/the-games-own-crash-report)).

**The difference is only visible in the RED4ext log.** Check for the watchdog
line before treating a crash report as evidence of a fault. If it is there, the
question is not "what threw" - it is "what stopped the main thread for two
minutes", and the crash report's location, district and coordinates describe
where the game *was* when it stalled, not where anything went wrong.

The 120-second figure also sets the clock on live sampling: from the moment the
picture freezes there are roughly two minutes to take the readings above before
the engine ends the process for you.

## No watcher can return the verdict

An automated stall detector - pinned CPU, flat memory, no log writes - **cannot
distinguish a livelock from a loaded game sitting idle at a menu**. Those look
identical from outside. This produced confident nonsense for three consecutive
bisect rounds before it was caught.

**The person looking at the screen is the only reliable oracle for "did it
hang".** Do not engineer them out of that loop, and do not treat watcher output
as ground truth for the verdict.

Watchers remain valuable for exactly the thing this article is about -
*measurement*: memory, handles, thread counts, CPU, and recording the moment the
process disappears. Measurement, not judgement.

## Related

- [The game writes its own crash report, and Windows Error Reporting never sees it](/diagnosis/the-games-own-crash-report) - why a watchdog kill is invisible there
- [Which log carries which symptom](/diagnosis/which-log-carries-which-symptom) - where the RED4ext log lives, and why an absent log is usually an absent framework
- [Sizing a bisect to the list](/diagnosis/sizing-a-bisect-to-the-list) - what to do once the fault is reproduced
