---
type: Interaction Pattern
title: An "allow nothing" flag short-circuits every other option, and shows no symptom
description: A single boolean that bypasses a mod's whole filter chain produces an empty list with no error, no log line and no explanation - and the settings that would seem to fix it are the ones it ignores.
tags: [settings, vendors, filters, diagnosis, empty-list]
status: stable
generated: { by: "claude", at: "2026-08-24T12:40:00-04:00" }
---

# An "allow nothing" flag short-circuits every other option, and shows no symptom

**The symptom.** A list that should have contents is empty. A vendor buys
nothing, a filter matches nothing, a menu shows nothing. No error, no log line,
no message in game explaining the absence.

**The trap.** The player goes hunting through the per-item settings that
*should* control the list - and every one of them is ignored, because the flag
that emptied it sits above them in the chain and returns before they are read.

## The shape in code

A guard wrapping the entire configuration pass, rather than one filter among
many:

```lua
if Settings.current.configuration[section_name.."_Nothing"] then
    for vendor, _ in pairs(...) do
        Tweaker.this_vendor_does_not_buy_anything(vendor)
    end
else
    -- the whole per-tag filter chain lives in here, and is never reached
end
```

Read the branch, not the setting list. One `if` at the top of an `apply`
function outranks every option below it, and a settings UI usually renders it as
just another switch in the same list as the things it overrides.

## Why the blast radius is bigger than it looks

Such a flag is usually applied per *category*, and a category can be backed by a
single shared record. One vendor type in Cyberpunk 2077 covers every drop point
in Night City through one record - so one switch silences the entire fencing
network, while a switch on a category with no records behind it does nothing at
all. **Both look identical in the UI.** A toggle with 58 vendors behind it and a
toggle with zero are rendered the same way.

## How to confirm it, in order

1. **Find the override before auditing the options.** Grep the apply/refresh
   path for an early return or a whole-chain `if`.
2. **Read defaults separately from state.** If the flag is absent from the
   shipped defaults, it was set by someone - see
   [live state is not defaults](/patterns/live-state-is-not-defaults).
3. **Count what the category actually covers.** An inert toggle and a
   catastrophic one are indistinguishable until you count the records behind it.
4. **Clear the innocent explicitly.** Several mods may hook the same path while
   being purely additive - a hook that calls `wrappedMethod()` and then appends
   cannot empty a list. Naming what you ruled out is half the value of the
   diagnosis, because the next reader will suspect them too.

## The general form

**A boolean that disables a subsystem is not the same kind of thing as a boolean
that configures it, but a settings menu renders them identically.** When a list
is unexpectedly empty, look first for the setting that stops the list being
built, not for the setting that decides what goes in it.
