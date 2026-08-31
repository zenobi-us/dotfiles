---
type: Diagnosis
title: Which log carries which symptom, and why a missing log is not a silent log
description: Seven logs, each written by a different framework, and none of them ship with the game - so an absent log usually means that framework was never installed rather than that it reported nothing. Plus the one log everybody forgets, and why a log's last line is not the moment of death.
tags: [logs, redscript, red4ext, archivexl, tweakxl, cet, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T21:10:00-04:00" }
---

# Which log carries which symptom, and why a missing log is not a silent log

A modded Cyberpunk 2077 install writes its diagnostics into **seven different
files owned by five different frameworks**, and the first cost of not knowing
which is which is reading the wrong one and concluding nothing is wrong.

| log | tells you |
|---|---|
| `red4ext\logs\red4ext.log` | plugin load order and versions - the reliable place to check what version a plugin actually is |
| `red4ext\plugins\ArchiveXL\ArchiveXL-*.log` | whether `.xl` patches applied. Read this after **every** `.xl` change |
| `red4ext\plugins\TweakXL\TweakXL-*.log` | whether a `.yaml` was read and whether it errored |
| `r6\logs\redscript_*.log` | redscript compilation. Rotates at 5 files |
| `r6\logs\scripting.log` | runtime script errors |
| `bin\x64\plugins\cyber_engine_tweaks\cyber_engine_tweaks.log` | CET framework |
| `...\cyber_engine_tweaks\mods\<name>\<name>.log` | per-CET-mod errors, including ones thrown outside your own `pcall` |

**Every path above is relative to the game root** - the folder containing
`bin\x64\Cyberpunk2077.exe`, wherever this particular Steam, GOG or Epic install
happens to live. Establish that root once and join everything to it. Never assume
a drive letter or a library path.

## A missing log is not a silent log

**None of these frameworks ship with the game.** REDscript, RED4ext, CET,
ArchiveXL and TweakXL are separate downloads, usually pulled in as dependencies
by whichever mods need them, and no install has all of them by default. A list of
twenty archive-only retextures legitimately has none of them, and `r6\logs\` may
not exist at all.

So an absent log has two completely different readings:

| reading | what it means |
|---|---|
| "that framework is not installed" | almost always this one |
| "that framework ran and reported nothing" | only if you have confirmed it is present |

Work out which frameworks are actually present *before* reading meaning into an
absent log, and before proposing a fix that assumes one is there. The same
mistake in reverse - a log that moved between versions rather than one that was
never written - is why the framework versions are worth checking first.

## ArchiveXL's log is the one people forget

A sector patch that fails logs **"No patches have been applied"** and reverts
*everything* in that file. One malformed entry therefore presents as total mod
failure, with the mod installed, enabled, and doing nothing anywhere.

Read it after every `.xl` edit, not just when something looks wrong.

## A log's last line is not the moment of death

A truncated log tail is **not** the crash time. In one measured case
`scripting.log` stopped at 05:07:28 while the process lived until 05:20:19 - a
**13-minute error**. Deriving "the crash happened at X" from a log tail sends you
looking at the wrong part of the session, and the number looks precise enough
that nobody questions it.

Use `sessionLength` from the game's own crash report instead
([the game writes its own crash report](/diagnosis/the-games-own-crash-report)).

The truncation is still evidence of something, just not of *when*: both
`gamelog.log` and CET's `scripting.log` ending mid-write means it was a **hard
process death**, not a clean exit.

## Failure shapes, and which log to open for each

- **Game hangs at new game or loading** - a quest or scene mod. `.xl` files
  deserve early suspicion for anything that only manifests on a *new* game, since
  quest-graph rewrites only execute when the quests run from scratch. Reproduce
  before halving anything; a single hang is not proof. See
  [a hang and a crash are different faults](/diagnosis/a-hang-and-a-crash-are-different-faults)
  for what to do while it is still hung.
- **Gameplay reached, then death after ~30-60 seconds with nothing in any log** -
  if ReShade is installed, suspect an incompatible add-on there before suspecting
  game mods. ReShade is an injector installed outside any mod manager, so it will
  not appear in a mod list at all - ask, rather than looking.
- **Mod installed, no error anywhere, no effect** - almost always load order (an
  inert archive) or a `.xl` that failed silently. Check ArchiveXL's log, then
  check whether the archive owns any of its own files.
- **A setting does nothing** - verify you are reading the user's real settings
  store, not a mod's shipped defaults.
  [A settings file the game rewrites answers "what is set", never "what is default"](/patterns/live-state-is-not-defaults).
- **Visual mismatch between body parts** - not a conflict at all.

## Locate a visual symptom before theorising about it

**Establish where the camera is.** "All the NPCs are grey" and "NPCs are grey in
a mirror" are different bugs with completely disjoint suspect lists. In one case
the report was scene-wide, the reality was a single NPC seen in one bathroom
mirror, and several rounds were lost proposing scene-wide causes. The culprit was
a **mirror mod**, and the symptom only ever existed in reflections.

Three surfaces worth separating, because each has its own suspects:

| where it looks wrong | look at |
|---|---|
| world rendering | skin/body texture mods, load order |
| mirrors and reflections | mirror and reflection mods |
| character creator / paperdoll | UV frameworks, appearance-mod facial archives, paperdoll overrides |

Character-creator faults in particular - black skin, missing body parts, missing
teeth - are usually **not** caused by the skin textures the world view would
suggest. Known causes have included a UV framework build (fixed by switching to
its REDmod version) and an appearance mod's facial and paperdoll archives.

## Things that look like mod bugs and are not

- **Quest facts live in the save.** Setting a fact from the console and then
  loading a save discards the change. Fact edits must happen on game attach, from
  a script.
- **Vendor inventories are rolled once and persisted.** A TweakDB change to stock
  will not appear until the vendor restocks - skip roughly 24 in-game hours.
- **Input mappings load at startup.** Editing `r6\input\*.xml` requires a full
  game restart, not a save reload.
- **Cyberware cannot be changed outside a ripperdoc** since 2.0, including from
  the console.

## Related

- [A .reds file on disk is not code the game is running](/engine/compiled-script-bundle) - why a script mod can be installed, correct, and inert
- [An archived redscript log is named for the run that replaced it](/engine/redscript-log-names-the-wrong-run) - the rotation trap on `r6\logs\redscript_*.log`
- [The game writes its own crash report, and Windows Error Reporting never sees it](/diagnosis/the-games-own-crash-report)
