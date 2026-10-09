---
type: Engine Mechanic
title: A CET mod folder without init.lua is not a mod, and a new one is not loaded until the game restarts
description: The script extender loads a folder only if it contains an entry point, so a leftover folder full of logs, databases and settings is a husk whose configuration does nothing - and a folder added while the game is running is not picked up at all, which has cost days.
tags: [cet, lua, mods, loading, husk, settings, overlay, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-25T11:20:00-04:00" }
---

# A CET mod folder without init.lua is not a mod, and a new one is not loaded until the game restarts

Cyber Engine Tweaks enumerates the folders under
`bin\x64\plugins\cyber_engine_tweaks\mods\` and loads one **only if it contains
`init.lua`**. That single condition produces two failures that look nothing like
each other and are both expensive.

## A folder that survives an uninstall is a husk

Removing a CET mod frequently leaves the folder behind, because the files the
*game* wrote there were never the manager's to remove: the mod's log, its
`db.sqlite3`, a `settings.json` or `mod_user_settings.json`, a `TextureSets\` or
`ui\` directory, plus the manager's own marker files.

**None of that is a mod.** With no `init.lua` there is no entry point, CET never
loads it, and it does not appear in CET's own mod list. On one install **174
folders existed and 154 were loadable** - twenty leftovers from mods that had
been removed.

Two things follow:

- **A husk's settings are inert.** A settings audit that reads
  `"removePlayerUnderwear": true` out of one of those folders is reporting live
  configuration for code that is not running. So is any conclusion drawn from
  it, including a proposed test - toggling that value would have proved nothing.
- **A folder is not evidence a mod is installed.** This was misread twice in one
  night, on two different mods, and corrected both times by the person who had
  just run the deployment. The check is one path test, not an impression of the
  folder's contents.

The same reasoning inverts usefully: a folder that *does* contain `init.lua` but
holds a zero-byte log and a zero-byte database has been loaded and has never
successfully run.

## A newly added mod does nothing until the next launch

Dropping a folder into the mods directory mid-session does not load it. CET's
*reload all mods* re-runs the mods it already knows about and does not reliably
pick up a **new** directory.

That is a one-line fact that has cost two days of somebody's time, because every
symptom of "your mod is not loaded" is indistinguishable from "your mod is
broken": no error, no entry in the list, nothing in the log, and a console call
into it fails exactly the way a typo would.

**Say the restart requirement before the user starts testing**, not after they
have written three versions of a script that was never loaded. The same applies
to anything that registers at load time - a hotkey registration that runs later
silently does nothing, which is covered in
[what the CET console can and cannot do](/authoring/the-cet-console-is-a-sandbox).

## If the overlay never drew, the key was never the question

One line settles whether the overlay's render layer started at all, in
`cyber_engine_tweaks.log`:

```
D3D12::Initialize() - initialization successful!
```

No line means nothing was ever going to appear, whatever key is bound. It is
written roughly a minute *after* the hook messages, so reading the log too early
produces a confident wrong answer about a session that was fine.

Its presence is equally useful: if the render layer did start and the overlay
still will not open, the question moves to the binding, and from there to
[what is actually stored in the binding](/input/packed-key-codes) and to
[the input device stack](/input/a-phantom-input-device-poisons-the-bind-dialog).

## Related

- [Reading live game objects from CET Lua](/engine/cet-lua-runtime)
- [What the CET console can and cannot do](/authoring/the-cet-console-is-a-sandbox)
- [A settings file the game rewrites answers "what is set", never "what is default"](/patterns/live-state-is-not-defaults) - the other way a settings file describes nothing
- [A .reds file on disk is not code the game is running](/engine/compiled-script-bundle) - the same gap in the other script layer
