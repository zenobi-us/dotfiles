# CET, Lua, and console commands - where the knowledge now lives

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> **Re-check after a patch:** The LuaJIT 5.1 limits are stable. The console calls and the ripperdoc gate on cyberware are game-version behaviour - re-test those before recommending them.

The CET console is a **sandbox**: an older Lua dialect, a restricted global
table, and a game that refuses several of the operations people most want from
it. Almost every limit fails silently - valid syntax, real identifiers, no
error, no effect.

**The full account is in the base wiki** (`wiki/` in the Cyberwise repo):

| article | covers |
|---|---|
| `/authoring/the-cet-console-is-a-sandbox` | the LuaJIT (Lua 5.1) dialect limits, the newline-stripping paste failure, `registerHotkey` only firing at load, the console cheats that work and the widely-posted ones that are not CET globals at all, the ripperdoc gate that makes cyberware equip calls no-ops, appearance entries as the way round it, quest facts living in the save, and reading a TweakDB flat back at runtime |
| `/engine/cet-lua-runtime` | the other half of the job - reading live objects out without losing the row that mattered: per-field `pcall`, out-params in a moving return slot, and the `uiData` / `resolves` columns |

Read the first of those before writing any console instruction. What stays here
is only what changes what you **do**.

## Deliver a probe as a file, never as a paste

The console strips newlines from a multi-line paste, so anything past one
statement has to be read from a file. That is a constraint on delivery, not a
matter of style:

1. **A true one-liner** may be given to the user to paste.
2. **Anything longer** goes in a file. Write a throwaway CET mod that
   `loadstring`s a script from disk and run every subsequent probe through it - a
   dozen lines you write once, and it turns each probe into an edit-and-rerun
   loop instead of a one-shot.
3. **Flush per line**, or an error escaping before the flush leaves a 0-byte
   output file and no clue what happened. CET's per-mod log
   (`...\mods\<name>\<name>.log`) catches what your own `pcall` did not.
4. **Read `output.txt` and the log yourself.** Never ask the user for a
   screenshot of something that was written to a file.

## Prefer CETMonkey to writing a new mod

Before building anything, list the CETMonkey script library - see the `cyberwise`
front door. A whole duplicate CET mod was once written to dump an inventory while
a script that does exactly that sat installed behind a button.

## Verify a call exists before recommending it

The article lists the console calls known to work and the known-bad ones. If a
call is not on that list, confirm it against the running game before handing it
over - a cheat that fails on sight is embarrassing, and one that silently does
nothing costs an evening.
