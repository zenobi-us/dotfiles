---
type: Engine Mechanic
title: Reading live game objects from CET Lua without losing the row that mattered
description: The console strips newlines, the runtime is LuaJIT rather than Lua 5.4, redscript out-params arrive as extra return values in a slot that moves between builds, and the obvious way to collect those returns fails as a clean empty result.
tags: [cet, lua, luajit, redscript, live-state, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T18:30:00-04:00" }
---

# Reading live game objects from CET Lua without losing the row that mattered

Almost everything about a modded install can be read at rest - archives, tweaks,
scripts, logs. **Live state cannot.** What is actually in the player's
inventory, which status effects are applied, what a vendor really stocks, where
an entity is standing: those are answerable only from inside the running game,
and Cyber Engine Tweaks' Lua console is the way in.

The traps below are all in the same family. **The object worth finding is
usually the one that does not resolve**, so every one of them destroys
specifically the row you were looking for, and does it without an error.

## The console strips newlines from multi-line pastes

Pasted multi-line code arrives with the newlines removed, silently concatenating
statements into a syntax error. Anything longer than one line has to be read
from a file.

This is not a style preference, it is a hard constraint on how live queries get
written and delivered. **"Just paste this into the console" is valid advice only
for a true one-liner** - and a one-liner cannot afford the per-field `pcall`
that live inspection requires.

## It is LuaJIT (Lua 5.1), not Lua 5.4

No `load`, no `_G`, no bitwise operators, no integer subtype. Code written
against modern Lua fails in ways that read like the API being wrong rather than
the dialect being older.

## Wrap every field read separately

A dump that lets one bad field throw loses the whole run. A dump that skips the
offending item silently hides the only row that mattered. **`MISSING`,
`<THREW>` or `NONE` in a column *is* the finding.**

```lua
local function str(fn, d)
    local ok, v = pcall(fn)
    if not ok then return "<THREW>" end
    if v == nil then return d or "<nil>" end
    return tostring(v)
end
```

## Redscript out-params arrive as extra return values, and the slot moves

A redscript function with an `out` parameter surfaces in Lua as **additional
return values**, appended after the declared return. Which slot holds the array
is not stable - it has already changed once between builds. Three wrong
signatures were tried for one call before this was understood.

**Do not hardcode a slot. Take whichever return is indexable.**

```lua
-- Call as firstArray(obj:Method(args)) so every return slot is forwarded.
local function firstArray(...)
    for i = select("#", ...), 1, -1 do      -- out-params are appended, so prefer LAST
        local c = select(i, ...)
        if c ~= nil and type(c) ~= "boolean" then
            local ok, n = pcall(function() return #c end)
            if ok and n ~= nil then return c end
        end
    end
    return nil
end
```

Two details in that helper are load-bearing. It is called as
`firstArray(obj:Method(args))` - **not** with the returns captured into
variables first, because capturing into a fixed number of locals discards the
slots you did not name. And it walks **backwards**, because out-params are
appended and the array is more often last than first.

### Never collect the returns into a table literal

The obvious version is wrong:

```lua
for _, c in ipairs({ b, a })   -- WRONG
```

When the call has a single return, `b` is `nil`, so that table has a hole at
index 1 and `ipairs` **stops dead on it**, never reaching the array sitting in
slot 2.

The reason this is worth a heading of its own is that it does not error. It
fails as a clean "no array found", which reads like an API problem and sends you
hunting for a different method. It cost a run that reported "could not read
status effects" while a seven-element table sat in slot 1.

### Probe before guessing again

When a call comes back empty, **log the shape** rather than trying a fourth
signature: `type()`, `#`, a `pairs` count and `[1]` for every return slot of
each candidate call. One probe run settles it; another guess does not.

Native signatures are also stricter about handle types than redscript is - a
call taking an entity ID will reject the game object itself. **Read the error
text**; it names the type it wanted.

## Two columns that answer "why can't I see this?"

Worth dumping alongside anything else, because both explain a thing the player
can observe and the UI cannot:

- **`uiData` on a status effect.** An effect appears under Character > Stats
  only if its record carries UI data. Many modded effects are pure stat carriers
  and declare none, so they apply and cannot be identified from the UI. `NONE`
  means the stats screen is behaving correctly, not that the effect is absent.
- **`resolves` on an inventory item.** An item whose record is gone - its mod
  uninstalled, renamed or updated - persists in the save as a live instance. It
  equips and carries stats, but renders no name, icon or appearance, and is
  absent from every list that filters on display data.

A record that *does* resolve but shows a blank slot and an oddly doubled name is
a third case - an abstract template, described in
[A mod that enumerates records will hand the player abstract templates](/patterns/record-enumeration-leaks-templates).

## Related

- [A mod that enumerates records will hand the player abstract templates](/patterns/record-enumeration-leaks-templates)
- [A settings file the game rewrites answers "what is set", never "what is default"](/patterns/live-state-is-not-defaults)
