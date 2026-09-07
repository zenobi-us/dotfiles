---
type: Engine Mechanic
title: A .reds file on disk is not code the game is running
description: redscript mods run from a bundle compiled at launch, so "the file is there" and "the code is running" are different claims - how to find the live bundle, read what is inside it, and tell a real absence from the three that are false.
tags: [redscript, scripts, cache, bundle, scc, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T18:30:00-04:00" }
---

# A .reds file on disk is not code the game is running

`.reds` mods do not run from the scripts directory. They run from a **bundle
compiled at launch**, and everything here is about the gap between those two
statements. On a real install they disagree regularly, and the disagreement has
no symptom in game: no error, no warning, no missing-feature message.

## Compilation is all-or-nothing

**If redscript fails to compile, every single `.reds` mod is silently off.** Not
degraded - off. A whole category of mods appears installed and enabled while
doing nothing.

Because only the log reports it, an install can sit in that state indefinitely.
It is discovered when somebody looks, not when it happens. Check the redscript
log for `Compilation complete` and a plausible source reference count; this
belongs among the first things verified whenever "a script mod isn't working".

The log is written by the game at runtime, so on a virtualising install it lands
wherever that manager redirects runtime writes rather than where it is expected.
Not finding it is not evidence it was never produced.

Causes seen, none of them obvious:

- **Duplicate class definitions** - the same mod installed twice under different
  names, typically two downloads from one mod page containing byte-identical
  sources.
- **A missing module dependency** - one mod importing a module that ships in a
  separate "core" download, producing dozens of errors from one absent mod.
- **A stale hand-patch** - an edit made to work around an old incompatibility,
  still in place after the author shipped a real fix that did more.

**A plugin's script directory only compiles if the plugin's DLL loads.** A
plugin shipped accidentally as a *Debug* build imports the debug CRT
(`MSVCP140D.dll`, `ucrtbased.dll`, `VCRUNTIME140D.dll`), which is not present on
a normal machine. The extender logs error 126, the plugin never loads, its
scripts never compile, and the mod is completely inert with no other symptom.
Check the extender's log for load failures before believing a plugin is active.

That error's own wording - **"the specified module could not be found"** - is
what sends people hunting for a dependency mod they already have. It names the
*imported* module rather than the plugin, and a debug-suffixed CRT is a more
common answer than a missing framework. **Read the failing DLL's import table
before believing the message**: a hit on the `D`-suffixed runtime names
(`VCRUNTIME140D.dll`, `ucrtbased.dll`, `MSVCP140D.dll`) means the author shipped
a Debug build, and the fix is a corrected release rather than anything on this
install. No hit means the missing import is worth resolving on its own terms.

What that failure does to a compile error list - a mod named in the popup whose
scripts the compiler never saw - is in
[reading a redscript failure](/engine/reading-a-redscript-failure).

## Find the live bundle from the log, not from the config

One line is authoritative:

```
[INFO - ...] Output successfully saved to <path>
```

That is where the bundle went. The compiler's TOML config states *intent*
(`custom_cache_dir`, `scriptsBlobPath`) and is worth reading, but a run can and
does write elsewhere - a compile test being the usual reason.

**Two cache trees exist and both persist**: `r6\cache\` and `r6\cache\modded\`.
On one install `r6\cache\final.redscripts.modded` was **eight months stale**
while `r6\cache\modded\final.redscripts.modded` was live. Advice of the form
"delete `final.redscripts.modded` to fix your scripts" hits whichever one the
user finds first, which is a coin flip.

## `final.redscripts.ts` is nanoseconds since the Unix epoch

16 bytes: a little-endian `u64` of **nanoseconds since 1970-01-01**, then eight
reserved zero bytes. Verified against two independent bundles, each matching its
own file mtime to the second.

```powershell
$ns = [BitConverter]::ToUInt64([IO.File]::ReadAllBytes($ts), 0)
[DateTimeOffset]::FromUnixTimeMilliseconds([int64]($ns / 1000000)).LocalDateTime
```

Worth reading rather than trusting the mtime, because a manager's redeploy can
rewrite file times without anything being compiled. **A `.ts` newer than the
bundle beside it means something stamped a build that did not produce that
bundle** - almost always a compile test that wrote its output elsewhere.

## What is inside: `Module.Path.Symbol`, null-terminated

Symbols sit in a plain null-terminated ASCII pool. A source declaring
`module BetterNetrunning.Breach` contributes `BetterNetrunning.Breach.<symbol>`;
a source with no module declaration contributes the bare name. So membership
answers "is this mod's code in the bundle" - but only if both forms are matched.

## Three ways to get a false absence

Each was found by getting it wrong first, and together they turned 11 flagged
mods into 1 real one on an install of 233.

- **A bare module name is never in the pool.** Probing for
  `BetterNetrunning.RemoteBreach.Core` finds nothing while
  `BetterNetrunning.RemoteBreach.Core.<symbol>` is present. Match the symbol,
  not the module.
- **Declarations inside comments.** Mods document their own API in `/** */`
  headers - one mod lists five `public func` signatures that way. Strip comments
  before parsing sources, or a mod gets reported as broken for having documented
  itself.
- **`@if(ModuleExists("Other"))`.** redscript compiles conditionally. A
  compatibility class for a mod the user does not have is *correctly* absent.
  That is information ("the bridge to X is inactive"), never damage.

Symbols under three characters cannot be looked up in a 35 MB blob without
matching noise. Say "cannot tell", not "absent".

## What a real absence means

Once the false positives are gone, an absent symbol has two readings, and the
mod's file times separate them:

- **Deployed after the bundle was built** - the mod is installed, enabled,
  correct, and *not running yet*. It compiles in on the next launch. This is the
  common case, and it is invisible in game.
- **Older than the bundle and still absent** - it was there when the compiler
  ran and did not make it in. Read the log for that run.

The whole-install version of the same question is the all-or-nothing gate above:
if the last real compile did not print `Compilation complete`, **every** `.reds`
mod is off, not just the one being investigated.

## Related

- [An archived redscript log is named for the run that replaced it](/engine/redscript-log-names-the-wrong-run) - how to find the log for the run you mean
