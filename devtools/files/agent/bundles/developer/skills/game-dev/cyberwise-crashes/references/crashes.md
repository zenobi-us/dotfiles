# Crash forensics

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> **Re-check after a patch:** HIGH DRIFT. CrashInfo.json is CDPR telemetry and its fields can change or vanish between patches. Confirm the file still appears and still carries isOom, district and sessionLength before building an investigation on it.

**The knowledge that used to live here is now in the base wiki**, which ships
with the skill. This file keeps only what changes what you *do*.

| what you need | article |
|---|---|
| what `CrashInfo.json` contains, why WER never fires, and how a capture folder becomes a fabricated cluster | `/diagnosis/the-games-own-crash-report` |
| whether it was a fault at all, or the engine's watchdog killing a stalled process - and what to sample while it is still hung | `/diagnosis/a-hang-and-a-crash-are-different-faults` |
| measuring memory without manufacturing a leak, and why the obvious counters lie | `/diagnosis/memory-is-usually-a-red-herring` |
| why a log's last line is not the moment of death | `/diagnosis/which-log-carries-which-symptom` |

## Do this, in this order

**1. Preserve first, before thinking.** `tools/Save-CrashSnapshot.ps1` copies the
files a relaunch destroys - `redscript_rCURRENT.log`, CET's truncated logs, and
`CrashInfo.json` before the next crash overwrites it.

**2. Say they can launch again**, the moment the snapshot is written. One
sentence, before any analysis.

**3. If the game is still hung, do not kill it yet.** Sample it first - responding
state, thread state counts, CPU delta, and which log is still growing. That
evidence exists only during the hang, and the engine's watchdog will end the
process in about two minutes.
`/diagnosis/a-hang-and-a-crash-are-different-faults` has the readings and what
each one rules out.

**4. Check the RED4ext log for a watchdog line** before treating the crash report
as evidence of a fault. A watchdog kill is indistinguishable from a fault crash
in `CrashInfo.json`.

**5. Take the bare facts, then ask the user what they were doing.** The crash
report knows the *tracked* quest and nothing about the last thirty seconds. Ask
before analysing, every time.

**6. Count DISTINCT records before reading anything into a capture folder.** Group
by `crashVisitId`. Near-identically-named files look like a dataset and may be two
events.

## Running a watcher

**This skill ships one** - `tools/Watch-Crashes.ps1`, with
`tools/Register-CrashWatch.ps1` to run it as a logon task. Prefer those over
writing your own.

Two operational rules that are easy to get wrong, whether you use the shipped
watcher or read someone else's:

- **Verify it is actually running**, matching the process on its `-File
  <watcher>` command line rather than a script-name substring - a substring also
  matches the query asking the question. A watcher you believe is armed and is
  not is worse than none.
- **If an agent cannot start it, hand the command to the user** rather than
  retrying. A sandboxed tool session can reap the whole process tree when the
  call returns, so `Start-Process` reports success and nothing runs.

Mechanics - detached launch, `Start-Job` not working, the absolute path in the
`Run` key - are in `/diagnosis/the-games-own-crash-report`.

## Single-variable testing

Change one thing at a time and record which. Prefer tests that are instant and
reversible: an in-game mod-settings toggle beats a redeploy, a graphics setting
beats a driver rollback. Full rationale, and the case where a real defect found by
reading source turned out not to be the crash:
`/diagnosis/memory-is-usually-a-red-herring`.
