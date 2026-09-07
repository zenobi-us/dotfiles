---
type: Engine Mechanic
title: Compile-testing redscript without inventing the errors yourself
description: A hand-run compile answers the all-or-nothing question without a launch, but the two ways of getting the script-directory list wrong each manufacture thousands of errors that look exactly like a broken install - and a test that never ran looks like a test that passed.
tags: [redscript, scc, compile, diagnosis, frameworks, redmod]
status: stable
generated: { by: "claude", at: "2026-08-24T20:20:00-04:00" }
---

# Compile-testing redscript without inventing the errors yourself

redscript compilation is all-or-nothing: one bad `.reds` disables **every**
redscript mod on the install, with no symptom in game
([the compiled bundle](/engine/compiled-script-bundle)). That makes "does this
install compile?" worth asking without spending a launch on it, and the
compiler that ships with redscript can be run by hand to answer it.

The value of the answer depends entirely on invoking it the way the game does.
Both of the common mistakes produce **thousands of errors on an install that is
actually fine**, and a third produces a clean-looking result from a run that did
nothing.

## The two symmetric traps

The compiler takes the main scripts directory plus a file listing the *extra*
script directories. Get either side wrong and the error count explodes.

| mistake | what it manufactures |
|---|---|
| omitting the framework script directories | thousands of **unresolved type** errors - every mod that uses a framework fails, and the framework looks missing when it is installed |
| listing the main scripts directory **both** positionally and inside the paths file | everything compiles twice, so thousands of **redefinition** errors, every one of them phantom |

The second is the nastier of the two, because a redefinition error is exactly
what a genuinely duplicated mod produces. A wall of them after a hand-run
compile is far more likely to be the invocation than the install.

## Framework scripts do not live in the scripts folder

The reason the first trap is so easy to fall into: **framework `.reds` ships
under the plugin directories**, not in the main scripts folder. The redscript
compiler is told about those directories separately, so a hand-run compile that
only points at the scripts folder is compiling mods whose dependencies are not
in the compilation unit at all.

The obvious rule - "add every `<plugin>/Scripts` directory" - is wrong, and
wrong in a way that only shows up on installs carrying the framework that
breaks the convention. **At least one framework ships its scripts directly in
its plugin folder with no `Scripts` subdirectory.** Miss it and the symptom is
the first trap again, narrowed to one framework's consumers.

The correct rule is by content, not by name:

> **every plugin directory that contains a script**, at any depth

Enumerate them by searching the plugin root for `.reds` and collecting the
directories that turn up. Do not hardcode a list: which frameworks are present
varies per install, and a list that was right last month is a fresh source of
unresolved types after one uninstall.

## Verify by the size of the output blob, not by the exit

A compile test that never ran leaves the previous output in place, and a stale
blob reads as a pass. The cheap check is its **byte size**:

```powershell
(Get-Item "$out\final.redscripts.modded").Length
```

On one measured install the blob dropped from **36.0 MB to 17.1 MB** when every
script folder was parked - a difference no glance at a log is needed to see. The
useful form of this is the negative: **if the size is unchanged after a run that
should have changed it, the compiler did not re-run and the result is void.**

Record the size that corresponds to a known-good compile once, and any later
test becomes a one-command comparison.

## The success signature carries a number worth keeping

A successful run reports that it compiled successfully **and how many source
references it registered**. The exact wording belongs to the redscript version
in use and moves between releases, so match on the count rather than quoting a
string at somebody.

That count is a **stability marker**: it should move when mods are added or
removed and stay put when they are not. A count that changes across two launches
with no mod change means something in the compilation unit changed underneath -
a framework updated, a plugin that failed to load last time loaded this time, or
a conditional compilation block flipped because another mod appeared.

## A REDmod deploy and a redscript compile are different pipelines

They are frequently confused because both are "the step you run after changing
mods", and one of them is loudly successful.

- **The REDmod deploy** rebuilds the REDmod side of the load order. It reports
  its own success and knows nothing about `.reds` compilation.
- **The redscript compile** runs at launch over the scripts and plugin
  directories, and reports into its own log.

**A successful deploy says nothing about redscript.** An install can deploy
cleanly and have every script mod silently off, which is exactly the state this
whole page exists to detect. Check the redscript log, or the blob, or run the
test; do not accept the deploy as evidence.

## Two cautions on the test itself

- **It overwrites the record of the last real launch.** The compiler rotates its
  log, so a test displaces the log for the run the game is actually running -
  see [an archived redscript log is named for the run that replaced it](/engine/redscript-log-names-the-wrong-run).
- **On a virtualising install it must be run through the manager.** Started from
  a plain shell it compiles a game directory the mods are not in, and reports a
  clean build that means nothing -
  [how the install is assembled](/install/how-the-install-is-assembled).

## Related

- [A .reds file on disk is not code the game is running](/engine/compiled-script-bundle) - what the bundle is and how to read what is in it
- [Reading a redscript failure without trusting its own explanation](/engine/reading-a-redscript-failure) - what to do with the errors once they are real
