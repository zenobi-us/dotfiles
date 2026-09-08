---
type: Environment
title: Fixing a bug in someone else's mod
description: Whether to override their file or patch it in place is decided by how much of it you are replacing - and the override's danger is not that it breaks, but that it silently keeps winning over every fix the author ships afterwards.
tags: [override, patching, tweakxl, redscript, vortex, mo2, maintenance]
status: stable
generated: { by: "claude", at: "2026-08-24T18:30:00-04:00" }
---

# Fixing a bug in someone else's mod

Authors ship broken YAML, wrong signatures and typos, and sometimes the fix
genuinely is an edit to their file. **Prefer an override to an edit** - and
where you cannot, know exactly which copy you are editing, because it is
different on every manager and the wrong answer fails silently.

## First: can you avoid touching their file at all?

For a **game** class, write a normal mod that hooks it and none of this applies.
For a class another **mod** declares, you cannot. Establish which you are dealing
with before designing anything, or you will spend an evening on a hook that was
never going to compile.

**Proven the expensive way.** Three variants of a method wrapper against another
mod's own class all failed to compile, and the one apparent precedent elsewhere
in the load order turned out to be **commented out by its own author**, for the
same reason. The instinct - write a small polite hook mod that touches nobody
else's files - is the right instinct, and here it is simply unavailable.

So the ownership question comes **before** anything is promised. "I can fix that
with a separate mod" is a claim about who declares the class; it costs one grep
to check and a lot of credibility to retract.

## Then choose by how much of their file you are replacing

**Check whether the format lets you override PART of their file**, because that
changes the answer completely:

| format | granularity | consequence |
|---|---|---|
| **TweakXL YAML** | per **record**, last loaded wins | Ship a file setting only the broken record. Everything else of theirs stays live, including changes they make later. Staleness barely applies - **this is the good case.** |
| **`.archive`** | per **file inside it** | Override one texture without touching the rest. Also fine. |
| **redscript `.reds`** | whole file only | Replacing it means every future fix its author ships loses to your copy. |
| **CET Lua** | whole file only | Same. |

Where you can override a *record* rather than a *file*, take it: a `zzz_`-named
tweak folder loads last and wins without a manager conflict rule and without
touching the original at all.

## The real danger is silence, so remove the silence

The objection to overriding a whole file is that the author's next update loses
to your copy **without anything saying so**. That danger comes entirely from not
noticing.

So record the hash of the author's file **as it was when you patched it**, and
re-check it after any mod update. A sweep that reports `CHANGED` when they ship a
new version, `GONE` when the mod is uninstalled or restructured, and a missing
override file, turns the one genuinely risky failure mode into a line of output.

**Do this for every patch and every override, without exception.** An
unregistered override is exactly the thing that quietly reimposes old behaviour
for months. With the sweep in place, an override is the better choice almost
everywhere: it survives the update *and* you find out that it did.

That failure is not theoretical. On one install a hand-edit kept winning long
after the author released a proper fix that did strictly more, and nothing
reported it.

## Override or re-appliable patch

| | override mod | re-appliable patch |
|---|---|---|
| their update | your copy keeps winning, **silently** | wipes your fix, **visibly** |
| stale risk | high, and grows with file size | none - you always re-patch the new file |
| effort per update | none, until it is wrong | one command, if you scripted it |
| good for | small, self-contained files - a YAML typo, one record | whole system files, anything replaced wholesale |

**A small data file: override.** One record or one obviously-wrong value, in a
file you could re-read in seconds. Low stale risk, and the manager owns it.

**A whole system file: patch it and script the re-apply.** Replacing five
hundred lines to change three means every future fix the author ships loses to
your copy, and nothing tells you. Being wiped by an update is *better* than
that, because being wiped is obvious - the bug comes back and you know why.
Write a re-apply script that brace-matches rather than string-matches fixed
lines, so it still works after the author shuffles surrounding code; make it
idempotent; give it a revert.

The asymmetry in one sentence: **a reverted patch shows the original bug, which
is visible. A stale override silently reimposes old behaviour on new code, which
is not.**

## The override, if you take it

Give the corrected file the **same relative path** and let load order decide.
The original is never touched, the fix is visible in the manager instead of
hidden inside somebody else's mod, and removing it is one toggle.

- **MO2** - a new mod folder containing only the patched file, ordered to win.
- **Vortex** - package it as a small mod and add a conflict rule so yours wins.
- **Manual** - there is no manager to arbitrate, so this is not available. You
  are editing in place, and the copy you keep is the only undo.
- **On a Wabbajack list** - name it `[NoDelete] ...`, or the next list update
  deletes it. An untagged override is a fix with a lifespan of one update.

**Same path, replacing their file - not an additional one.** A new `.reds` under
a different name does not override anything; it *adds* a second definition, and
redscript fails the whole compilation on the duplicate. The point is to win the
same file, not to add a file.

## If you must edit their file, edit the right copy

| manager | where the file you edit lives |
|---|---|
| **MO2** | `mods\<mod name>\...` - the one and only copy. The game directory is a projection that does not exist with the game closed, and anything Root Builder copied in is discarded at exit. |
| **Vortex** | staging **and** deployment are the same file under hardlink deployment - but editing can break the link and leave two independent copies, so write to both and verify. |
| **Manual** | the game directory, because there is nowhere else. Nothing will revert it and nothing records it. |

**On MO2 the "edit both copies" advice is not merely unnecessary, it is a trap.**
Following it means editing inside the game folder, where the change is discarded
at exit. The user sees no effect and no error.

Snapshot before any in-place write, whichever manager it is.

## Adding to another author's mod without touching it

Put your files under **your own depot prefix**, referencing their meshes and
materials by path or hash, and register new entries through the appropriate
extension point rather than editing their files.

Their mod then updates freely and yours only depends on it staying installed.
Overriding their paths directly also works, but goes stale on every update and is
invisible to the user until something looks wrong.

## Related

- [What the game directory shows you depends on how the mods got there](/install/how-the-install-is-assembled)
- [A .reds file on disk is not code the game is running](/engine/compiled-script-bundle) - a patched script does nothing until the next compile
