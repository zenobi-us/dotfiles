---
type: Engine Mechanic
title: Five separate stores hold key bindings, and no single one answers what a key is bound to
description: On a modded install five files own bindings, they disagree on format, only one of them holds what the player actually pressed last, and a sixth file holds the game's own claims. A binding you cannot find is not evidence the key is free.
tags: [input, keybinds, cet, mod-settings, input-loader]
status: stable
generated: { by: "claude", at: "2026-08-24T21:40:00-04:00" }
---

# Five separate stores hold key bindings, and no single one answers what a key is bound to

Never hand-transcribe a keybind. Five systems own bindings on a modded install,
they disagree on format, and **only one of them holds what the player actually
pressed last**.

All paths are relative to the game install root. Which of them exist depends on
what is installed - the first four are each created by a framework, not by the
base game - and **a store that is absent tells you nothing except that its
framework or its overrides are absent.** On a virtualising install several may
not be on disk at all while the game is closed; harvest through the manager
instead.

| Source | Holds | Format |
|---|---|---|
| `r6\input\*.xml` | one file per mod: its actions, the input contexts they are live in, and a **default** key | `IK_` names |
| `r6\cache\inputUserMappings.xml` | Input Loader's **merged** output, every mod plus vanilla, regenerated at launch | `IK_` names, `buttonGroup` resolved |
| `red4ext\plugins\mod_settings\user.ini` | the user's **actual** rebinds, for mods using Mod Settings | `IK_` names, keyed by `overridableUI` id |
| `bin\x64\plugins\cyber_engine_tweaks\bindings.json` | CET hotkeys | packed VK codes |
| `...\cyber_engine_tweaks\mods\<mod>\**\*.json` | CET mods that keep their **own** config | `IK_` names |

The last one is the trap. Nothing obliges a CET mod to use CET's binding
registry, so a key can be live in game and absent from all four other stores. On
one install this was three CET mods out of roughly 150 - but one of them was a
night-vision toggle, a key pressed constantly, sitting on top of two other
bindings without appearing on any generated sheet. Three out of 150 is not a rate
to rely on; the point is that the count is never zero by construction.

> **A binding you cannot find is not evidence the key is free.**

## A sixth file holds the game's own claims, and it is not optional

`r6\config\inputUserMappings.xml` is the base game's own mapping file. It is not
a mod store, so it is routinely excluded from a report *about mods* - roughly 99
vanilla rows that are identical on every install and swamp everything else.

Excluding it from a **report** is a presentation choice. Excluding it from the
question "is this key free?" is a correctness bug: a harvest that knows only
about mods will answer *yes* for `F9`, which is quickload. Bind a diagnostic
hotkey there and pressing it reloads the save, and the test result becomes
unreadable - you cannot tell "the tool responded" from "the game did its own
thing".

Read the claims from that file rather than from a table of vanilla defaults typed
out by hand. A hardcoded table is right until the next patch and silently wrong
after it; the game ships its own answer and it is 74 KB of XML.

There is a second reason the base-game file has to stay reachable, and it is
sharper: [a mod can change what a vanilla mapping does without registering a key
of its own](/input/a-mod-can-repurpose-a-vanilla-mapping).

## Precedence: `user.ini` wins, and the cache does not know it

Where a mod uses Mod Settings, `user.ini` wins. It is applied at runtime, so it
is **not** reflected in the cache - reading the cache alone gives you the mod
author's defaults and tells you nothing about what the user changed.

The link between the two is the `overridableUI` attribute:

```xml
<mapping name="AlwaysFirstEquip_Button" type="Button">
    <button id="IK_F2" overridableUI="afeMainHotkey" />
</mapping>
```

```ini
[AlwaysFirstEquip.FirstEquipConfig]
afeMainHotkey = IK_F2
```

The section name in the ini is the mod's own module and class, so it will **not**
match the xml filename. Match on the `overridableUI` id, which is the only value
guaranteed to appear in both.

A `<button>` with no `overridableUI` is not rebindable in Mod Settings, so its
xml value is final.

## `buttonGroup` indirection: an id that is not a key

A `<button id="...">` does not have to name a key. It can name a `buttonGroup`,
which is only defined in the **merged cache**:

```xml
<buttonGroup id="DH_Keyboard_Binding"><button id="IK_L" /></buttonGroup>
```

Parse that mod's xml alone and its key reads as the literal string
`DH_Keyboard_Binding` (the example is Dialogue History; the pattern is not
specific to it). Build the group table from the cache first, then expand ids
through it.

The cache is regenerated at launch, so a mod installed since the last session is
absent from it, and so are its groups. That is a staleness window, not a parse
failure: if the ids do not resolve, ask when the game was last started before
rewriting the parser.

## Not every id is a key, either

Mods invent their own ids and nothing validates them. One (Enhanced Vehicle
System) uses composite ids - `IK_F1_1`, `IK_F2_2` - for its chorded bindings.
They mean "F1 then 1" and no such virtual key exists. Treat anything matching
`IK_<key>_<key>` as a mod-internal chord rather than a key to look up, and expect
other private conventions from other authors: **an id that resolves to nothing is
a prompt to read that mod's own docs, not a parse error.**

## Reading a CET mod's own config

Two conventions cover most of them:

```json
{"keyboard":{"mkbBinding_1":"IK_F3","mkbBinding_2":"IK_F4","mkbBinding_keys":1}}
{"ToggleKey":"IK_Y","QuickToggleKey_1":"IK_None"}
```

- **`mkbBinding_keys` says how many slots are live.** The example above is bound
  to F3 alone; `mkbBinding_2` is a leftover from a previous binding. Report the
  chord without checking the count and you invent an F3+F4 combo that does not
  exist.
- **`IK_None` means unbound**, not a key named None.
- `padBinding_*` mirrors the same shape for the controller.
- The json key names the *slot*, not the function - `mkbBinding_1` tells you
  nothing about what the mod does. The mod folder is the only clue, so the action
  name has to be supplied from outside the file.

**Depth-limit the search.** `mods\` also holds mods shipping megabytes of json
data, and a blind recurse reads all of it to find a handful of keys;
`mods\*\*.json` plus `mods\*\config\*.json` caught every case on the install this
was written from. That is a sensible starting depth, not a guarantee - if a key
the user demonstrably presses turns up in none of the five stores, widen the
search before concluding it does not exist.

The CET central store is its own format problem entirely:
[a binding can be stored as a packed integer instead of a key
name](/input/packed-key-codes), and
[a binding store can lose its contents without anything
saying so](/input/a-binding-store-can-empty-itself).

## Reconcile spellings before comparing anything

Each store writes the same physical key differently, and a raw string comparison
across two of them finds nothing at all. That is a silent wrong answer rather
than an error, so it has to be handled before any join or any "is this free"
check: [one key has four spellings](/input/one-key-four-spellings).
