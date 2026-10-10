# CETMonkey - asking the running game a question

> **Verified:** CETMonkey 2.8, CET 1.36 - Cyberpunk 2077 patch 2.31, August 2026
> **Re-check after a patch:** The Library contract and the staging/hardlink rule are CETMonkey and Vortex behaviour, not game behaviour, so they drift with those releases rather than with a game patch. The runtime facts that used to live here moved to the base wiki, which carries its own stamp.

Most of this family reads an install at rest: archives, tweaks, scripts, logs.
CETMonkey is the other half - it runs Lua **inside the running game** and writes
the answer to a file this family can read. Anything about live state (what is in
the player's inventory, which status effects are applied, what a vendor actually
stocks, where an entity is standing) is answerable only here.

Treat it as a prerequisite, not an accessory. `Test-Capabilities.ps1 -For
livequery` is the gate.

**The runtime knowledge is in the base wiki, not here.** LuaJIT's limits, why the
console cannot take a multi-line paste, the per-field `pcall` rule, the redscript
out-param return slot that moves between builds and the `firstArray` idiom that
survives the move, the `ipairs`-on-a-table-literal trap, and what `uiData` and
`resolves` mean:

> `/engine/cet-lua-runtime` in the Cyberwise base wiki (`wiki/` in the Cyberwise
> repo). Read it before writing a script that inspects live objects - every trap
> in it fails as a clean empty result rather than an error.

What stays here is CETMonkey's own interface and the rules for adding to it.

## Look in the Library FIRST

```
bin\x64\plugins\cyber_engine_tweaks\mods\cetmonkey\scripts\*.lua
```

**Before writing a script, list that folder.** On 2026-08-23 a whole second CET
mod was built - hotkeys, its own output files, a duplicated defensive-read helper
- to dump an inventory, while CETMonkey sat installed with a Library that runs
scripts from a button. The user had even said "make a cetmonkey script" and it
was read as a generic noun.

The first two comment lines of every script are its title and description, so
listing the folder and reading two lines per file tells you what already exists.

## The script contract

```lua
-- Title line, shown in the Library
-- One-line description, shown under it
--
-- Longer explanation for whoever opens the file.

local LOG, TRY, APPEND = ...
```

| helper | goes to | lifetime |
|---|---|---|
| `LOG(...)` | `output.txt` + CET console | truncated at the start of each run |
| `APPEND(line)` | `log.txt` | never truncated - use for repeated sampling |
| `TRY(label, fn)` | `output.txt` | calls a method that may not exist; logs only on success |

`LOG` flushes per line on purpose: a script that errors halfway must not lose
what it had already learned.

`APPEND` is the right choice for anything transient. Status effects expire;
sampling before and after an event and diffing the two runs is the only way to
attribute one to a cause.

Every script also gets a real hotkey registered at load, listed in CET's
Bindings tab. Nothing needs binding to be usable - the Library runs it with a
click - but a hotkey lets a sample be taken mid-combat without opening an
overlay that changes the thing being measured.

Scripts get their helpers as chunk varargs because the runtime is LuaJIT and has
no `_G` to hang them on.

## Writing a new script: put it in STAGING

Scripts written straight into the deployed folder are **deployment-only and are
destroyed by the next Vortex purge**. The install is hardlinked from staging, so
the test is the link count:

```bash
stat -c '%h  %n' <script>      # 2 = staged and safe, 1 = will be lost
```

Write the file into staging, then hardlink it back:

```
%APPDATA%\Vortex\cyberpunk2077\mods\CETMonkey-<ver>\bin\x64\plugins\cyber_engine_tweaks\mods\cetmonkey\scripts\
```

Editing an **existing** deployed script is safe for the opposite reason - the
hardlink means the staging copy changes with it - but only if the edit rewrites
the same inode. A tool that replaces the file breaks the link and silently
converts a staged file into a doomed one.

Add the filename to `scripts\manifest.lua` too. The Library prefers CET's
`dir()`, but falls back to that manifest on builds that do not expose it, and a
script missing from it is invisible on those installs.

## Reading the result

`output.txt` and `log.txt` sit in the cetmonkey mod folder. Read them directly -
never ask for a screenshot of something that was written to a file, and never
ask the user to transcribe a record ID.

Related: `references/environment.md`, `cyberwise-recommends`, and
`/engine/cet-lua-runtime` in the base wiki.
