---
type: Engine Mechanic
title: What the CET console can and cannot do
description: The runtime is LuaJIT rather than modern Lua, several widely-posted console cheats are not CET globals at all, cyberware has been ripperdoc-gated since 2.0 so equip calls compile and do nothing, and a quest fact set from the console dies at the next load.
tags: [cet, lua, luajit, console, cheats, quest-facts, cyberware, authoring]
status: stable
generated: { by: "claude", at: "2026-08-24T21:15:00-04:00" }
---

# What the CET console can and cannot do

The Cyber Engine Tweaks console is the only way into a running game, and it is a
**sandbox**: an older Lua dialect, a restricted global table, and a game that
refuses several of the operations people most want from it. Every limit below
has produced a confusing failure, and almost all of them fail *silently* -
syntactically valid code, real identifiers, no error, no effect.

Reading live objects out of the game once you are in there - `pcall` discipline,
out-params, the columns that explain "why can't I see this" - is a separate
problem, covered in [Reading live game objects from CET
Lua](/engine/cet-lua-runtime).

## The dialect is LuaJIT (Lua 5.1)

- **No `load`** - use `loadstring`.
- **No `_G`.** You cannot pass helpers into a loaded chunk through globals. Pass
  them as **chunk varargs** instead: `local LOG, TRY = ...`
- **No bitwise operators.** `>>`, `<<`, `&`, `|` are Lua 5.3 syntax and produce
  a **compile** error that kills the entire file - not a runtime error on the
  offending line. One `&` and nothing in the file runs.
- **No integer subtype**, no `math.type`.
- **64-bit hashes arrive as FFI cdata.** `tostring()` renders them exactly. If
  `type(h) == "number"` you are looking at a value that has already been lossily
  converted to a double.
- **A bare `return` mid-chunk is a syntax error.** Wrap script bodies in
  `local function main() ... end main()`.

## The console strips newlines from multi-line pastes

Pasted multi-line code arrives concatenated onto one line, producing errors like:

```
sol: syntax error ... '=' expected near 'not'
```

Anything longer than a single statement must be **read from a file**, not
pasted. "Paste this into the console" is valid advice only for a true one-liner.

If an investigation will need more than a couple of probes, write a throwaway
CET mod that `loadstring`s a file from disk and run everything through it.
Nothing like that ships with CET - it is a dozen lines you write once - but it
converts every subsequent probe from a one-shot paste into an edit-and-rerun
loop.

Two related traps in the same area:

- **An error escaping before a flush leaves a 0-byte output file and no clue.**
  Flush per line.
- **CET's per-mod log** (`...\mods\<name>\<name>.log`) catches errors thrown
  outside your own `pcall`, which is where the explanation usually is.
- **`registerHotkey` only takes effect while the mod is loading.** Registering a
  hotkey later, or in response to UI, silently does nothing.

## Console commands that actually work

**Give an item.** `Game.AddToInventory` is a real CET global:

```lua
Game.AddToInventory("Items.NanoWires", 1)
```

**Modify a player stat** through the same call a stat-editing mod's own slider
uses, against the real stat type:

```lua
StrikeExecutor_ModifyStat.new():ModStatPuppet(
    Game.GetPlayer(), gamedataStatType.CarryCapacity, 1000.0, Game.GetPlayer())
```

Two things about that second one generalise past this call, and both have their
own articles rather than being restated here:

- The record id you pass carries no tier information -
  [a base record is not a base-tier item](/gameplay/a-base-record-is-not-a-base-tier-item).
- A widely posted alternative for the same job **is not a CET global at all**,
  and exists only as a helper method inside certain mods - which is exactly how
  it ends up in guides written by people for whom it worked. See
  [checking a gameplay claim against the shipped scripts](/gameplay/checking-a-gameplay-claim-against-the-shipped-scripts).
  **Verify a call exists before recommending it.**

## Cyberware cannot be equipped or unequipped from the console

Since 2.0 that is ripperdoc-gated, and the console has no route around it. Two
syntactically valid calls referencing real identifiers both do nothing at all -
see [cyberware is ripperdoc-gated](/gameplay/cyberware-is-ripperdoc-gated) for
the calls and why each fails silently.

The point that belongs *here*, because it is about writing console code rather
than about the gate: **an identifier existing is not the same as the operation
being permitted.** Verifying a name against the shipped scripts tells you the
symbol is real. It tells you nothing about whether the engine will honour the
request, and a rejected request in this API does not raise.

Note also that the **slot** is `AttachmentSlots.ArmsCyberwareGeneralSlot` while
`ArmsCW` is a `gamedataEquipmentArea` enum member. Different identifiers for
adjacent concepts, easy to confuse, and mixing them up fails without a word.

**If the goal is how the arms look rather than what they do, change the
appearance instead of the hardware.** Arm cyberware visuals are appearance
entries - `holstered_default_tpp`, `holstered_strong_tpp`,
`holstered_nanowire_tpp` - and they are independent of what is actually
installed. A look can be set from the console even though the cyberware itself
cannot.

## Quest facts live in the save

Setting a fact from the console and then loading a save discards it: the save
carries its own fact table, and loading replaces what you set. To set a fact
reliably, do it **from a script on game attach**, so it is applied after the
save's own state.

**Do not guess what a fact means from its name.** One fact ending `..._reset`
turned out to be a signal that actively *suppressed* the feature it appeared to
enable. A fact name is an author's shorthand, and the only way to know what it
gates is to find what reads it.

## Verifying a TweakDB value at runtime

Read-only, safe, and the fastest confirmation that a tweak applied at all:

```lua
print(#TweakDB:GetFlat("Vendors.<id>.itemStock"))
print(TweakDB:GetFlat("<YourRecord>.item"))
```

## Related

- [Reading live game objects from CET Lua without losing the row that mattered](/engine/cet-lua-runtime)
- [Never guess a TweakDB record ID - the game writes the real list](/authoring/finding-the-real-record-id)
- [The game ships its own API reference, and guessing a signature is slower than reading it](/authoring/reading-the-shipped-script-dump)
