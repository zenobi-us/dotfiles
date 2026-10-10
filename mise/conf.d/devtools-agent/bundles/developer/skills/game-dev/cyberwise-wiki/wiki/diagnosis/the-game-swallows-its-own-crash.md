---
type: Diagnosis
title: The game swallows its own crash, so Windows never sees one
description: Cyberpunk 2077 installs its own unhandled-exception filter and exits cleanly, which is why Windows Error Reporting never fires, why LocalDumps produces nothing, and why a debugger is the only thing that can name the faulting module.
tags: [crashes, debugging, wer, minidump, cdb, access-violation]
status: stable
generated: { by: "claude", at: "2026-08-26T13:30:00-04:00" }
---

# The game swallows its own crash, so Windows never sees one

`%LOCALAPPDATA%\CrashDumps` on a machine that crashes daily will hold dumps for
every other application and **none for this game**. That is not a
misconfiguration and it is not something to fix by enabling more of Windows.

The game installs its own unhandled-exception filter. On a fault it catches the
exception, writes `CrashInfo.json`, and exits **cleanly**. From Windows' point
of view nothing crashed, so Windows Error Reporting has nothing to report.

**Turning on WER LocalDumps does not help.** The game's handler runs first and
there is nothing left by the time WER would look. On one measured machine the
`LocalDumps` key was already present and populated for three other applications,
and had never produced a single dump for this game.

## What the game's own report does and does not contain

`CrashInfo.json` carries the *circumstances*:

| field | example |
|---|---|
| `timeCrash` | `2026-08-26T12:11:51Z` |
| `district` | `Kabuki` |
| `location` | X / Y / Z |
| `sessionLength` | seconds |
| `isOom` | `False` |
| `crashPatch` | `2.31` |

It does **not** contain an exception code, a faulting module, or a stack. Seventeen
of these files will tell you where and when, and never once what.

## A debugger sees the exception first

That is the whole trick, and it is the only reliable route to a module name.
Attached, a debugger receives the first-chance exception **before** the game's
filter, so the fault can be recorded and then handed straight back.

```
cdb -p <pid> -g -G -cf <commands>
```

with a command file that arms a handler for access violations:

```
sxe -c ".echo ==AV==; lmv a @rip; k 60; !analyze -v; .dump /m <file>; gn" av
g
```

`!analyze -v` reports `MODULE_NAME`, `IMAGE_NAME` and `FAILURE_BUCKET_ID`, which
is the answer the crash report cannot give.

`cdb.exe` ships inside the WinDbg package: `winget install --id Microsoft.WinDbg`.

## Three things that are easy to get wrong

- **`gn`, never `gh`.** "Go, exception **not** handled" passes the fault back to
  the game, which then behaves exactly as it does without a debugger - same
  `CrashInfo.json`, same exit. `gh` swallows the fault and changes the behaviour
  of the thing you are trying to measure.
- **Never take a full dump.** `.dump /ma` writes the process's entire private
  working set, measured at 27-30 GB on a heavily modded install. A minidump is
  around 170 KB and `!analyze` gives the same verdict.
- **Paths inside a quoted `-c` command need FORWARD SLASHES.** Backslash is an
  escape there, so a Windows path arrives mangled - one attempt produced
  `C:Users<TAB>ohuw...` and failed with Win32 error 123.

## What it cannot tell you

It catches **access violations**. A fail-fast, a stack overflow or a pure abort
will not trip an `av` handler, and a log that records no access violation before
the process ended is itself a finding: this crash is something else.

Attaching a debugger also changes timing. A crash that depends on a race can
move or disappear while attached. **That is not the same as fixed**, and it is
evidence about the crash's shape rather than a cure.
