---
type: File Format
title: A binding can be stored as a packed integer instead of a key name
description: CET stores a hotkey as a 64-bit integer holding up to four virtual-key codes in 16-bit slots. A reader expecting IK_ names sees a meaningless number and drops the row - and a chord that includes VK 255 never matches a keypress again.
tags: [input, keybinds, cet, file-format, virtual-key]
status: stable
generated: { by: "claude", at: "2026-08-24T21:40:00-04:00" }
---

# A binding can be stored as a packed integer instead of a key name

Most binding stores hold a key by name. At least one does not.

```
62487444829765632
```

That is a binding. It decodes to virtual-key code 222 - `VK_OEM_7`, the
apostrophe. **A reader that expects a key name reads it as meaningless and drops
the entry**, so the key looks unbound, the mod looks keyless, and a
key-availability check hands the key out to somebody else.

## The packing

CET's `bin\x64\plugins\cyber_engine_tweaks\bindings.json` stores a binding as a
64-bit integer holding up to four VK codes in 16-bit slots, **first key
highest**. The primary key is `value >> 48`.

```
62205969853054976 >> 48 = 221 = VK_OEM_6   = ']'
62487444829765632 >> 48 = 222 = VK_OEM_7   = '''
27021597764222976 >> 48 =  96 = VK_NUMPAD0 = 'Num 0'
```

All four slots, most significant first:

```powershell
0..3 | ForEach-Object { [math]::Floor($v / [math]::Pow(2, 48 - 16*$_)) % 65536 }
```

`46, 0, 0, 0` is Delete alone.

**`0` means unbound**, and most entries are - a CET mod ships its whole hotkey
table whether or not the user bound any of it. Filter zeroes or the output is
mostly noise, but [count them before you
filter](/input/a-binding-store-can-empty-itself): the bound-to-total ratio is the
only cheap signal that a store has silently lost its contents.

## `255, 46, 0, 0` is a fault, not a chord

VK 255 is HID filler - it is not a key anyone can press. A stored chord beginning
with it can never match a plain keypress again, so the binding is permanently
dead while looking perfectly normal in the mod's UI.

It gets written when something injects a key-down with no matching key-up while
CET is capturing a binding: CET believes a key is held, and records the capture
as *that key plus the one you pressed*. The usual source is a second physical
keyboard - see the front-door rule about inventorying physical inputs before
software.

## Two reader traps

- **`ConvertFrom-Json` needs `-AsHashtable` here.** The file aggregates key names
  from every CET mod, so it can contain keys differing only in case
  (`HideMeshes` and `hideMeshes` were the observed pair), and the default
  case-insensitive object conversion **throws** on the collision. Use
  `-AsHashtable` unconditionally rather than waiting for the install that happens
  to collide.
- **The bit layout is an internal format with no compatibility promise.** Check
  the installed patch version before trusting a hand-decode.

## The general rule

The specific format above is CET's. The generalisation is what to carry into any
new store: **a binding is not necessarily a string.** A parser that only
recognises `IK_` names does not fail loudly on an integer - it drops the row, and
a dropped row is indistinguishable from an unbound key everywhere downstream.
When a store's entries do not look like keys, decode before concluding they are
not bindings.
