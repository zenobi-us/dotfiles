---
type: Engine Mechanic
title: Reading a redscript failure without trusting its own explanation
description: The failure popup lists every mod that failed and appends a guess at the cause - a guess that is frequently a red herring. Census the errors instead, and remember that a mod named in the list may be one the compiler never saw.
tags: [redscript, compile, errors, diagnosis, dependencies, plugins]
status: stable
generated: { by: "claude", at: "2026-08-24T20:20:00-04:00" }
---

# Reading a redscript failure without trusting its own explanation

When redscript fails, the game shows a popup naming every mod whose scripts did
not compile, and **appends a sentence guessing why**. The list is evidence. The
guess is a heuristic, and it is wrong often enough that acting on it first is a
reliable way to lose an evening.

The appended guess has been seen to blame the redscript backup ("the redscript
backup is bad, most likely") on a failure that had nothing to do with it. That
run logged **2087 errors** containing **exactly one** redefinition; the other
2086 were unresolved types. The cause was a single absent module, and the
backup was fine.

## Census the errors before reading the summary

The error kinds are not equally informative, and the distribution names the
cause faster than any individual message.

| dominant kind | what it usually means |
|---|---|
| **unresolved type / unresolved module**, in bulk | one thing is missing from the compilation unit - a framework not installed, a dependency not installed, or a hand-run compile that omitted a script directory |
| **redefinition**, in bulk | the same source is present twice, or the compiler was told to compile it twice |
| a handful of errors in one module | that mod, genuinely - read them |

Two thousand errors is not two thousand problems. Count by kind, then read one
representative message of the dominant kind. A single missing framework produces
an error for every reference to it across every mod that uses it, which is why
the count is a measure of how popular the missing thing was rather than how bad
the failure is.

## A mod named in the error list is not necessarily a mod the compiler saw

This is the structural fact that makes the popup's list narrower than it looks:
**the compiler only compiles the script directories of plugins that successfully
LOADED.** A plugin DLL that fails to load makes its scripts inert rather than
harmful - they are never fed to the compiler at all.

So a mod appearing in an error list, and a mod whose code was actually in the
compilation unit, are two different sets.

**The proof method is the last successful compile log.** It enumerates every
file it compiled. A mod absent from that enumeration was never seen by the
compiler, and no amount of editing its scripts will change any error. Look at
the plugin loader's log instead: its DLL is failing to load, and that is the
finding.

One specific cause of that, because it presents as a missing dependency and
sends people hunting for a mod they already have: a plugin shipped accidentally
as a **Debug build** imports the debug CRT, which exists only on a machine with
the compiler toolchain installed. See
[the compiled bundle](/engine/compiled-script-bundle) for the import-table
check.

## A missing dependency appears as an unresolved module

There is no friendly message. The install does not say "you need X". It says a
module namespace could not be resolved, in bulk, across every mod that imported
it.

**Grep the whole install for the module namespace before blaming the mod that
failed.** Three outcomes, all useful:

- the namespace is nowhere - the dependency is genuinely absent, and the mod
  that failed is a victim rather than a cause
- the namespace exists in a plugin directory - it is installed, and the question
  is why the compiler did not see it (a plugin that did not load, or a script
  directory left out of a hand-run compile)
- the namespace exists under a *different* owner - a fork, a repack, or a copy
  bundled inside another mod. The capability is present under a name the
  requirement does not recognise; see
  [a missing-requirement report is wrong in both directions](/install/auditing-dependencies)

## Two causes that look like the mod's own bug and are not

### The same class defined twice from one mod page

Two alternate downloads from a single mod page can each define the same class,
and installing both puts **byte-identical files into differently-named
folders**. Nothing on disk looks duplicated - the folder names differ, the
manager lists two mods - and the compiler reports a redefinition that reads like
a corrupt install.

This is a recurring cause rather than a curiosity, because the two downloads are
frequently presented as though they were alternatives when they are not. See
[two downloads from one mod page may not be alternatives](/install/two-builds-of-one-filename).

### A dependency renamed its settings

An addon that compiled last month can fail after its framework updates, because
the framework **deleted old setting names outright while keeping the same UI
labels**. The labels a user sees are unchanged; the identifiers the addon
references are gone.

The tell is an unresolved-symbol error naming something that reads like a
setting, in a mod whose framework has just been updated. Nothing in the game's
own interface shows the change, so "the settings look the same" is not evidence.
The fix belongs to the addon author; the useful output of the diagnosis is
knowing which side broke, so the report goes to the right person.

*Observed once, on one framework-and-addon pair. The mechanism generalises to
any dependency that renames identifiers behind stable labels, but the frequency
is not established.*

## Related

- [Compile-testing redscript without inventing the errors yourself](/engine/compile-testing-redscript) - how to get errors that are real before diagnosing them
- [A .reds file on disk is not code the game is running](/engine/compiled-script-bundle) - the all-or-nothing gate, and what a real absence means
