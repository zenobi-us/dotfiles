---
type: File Format
title: One key has four spellings, and comparing any two of them directly finds nothing
description: The engine, a base-game row, a mod row and a vendor profile each write the same physical key differently. A raw string comparison returns "no match", which reads as "unbound" - so a key-availability gate reports taken keys as free.
tags: [input, keybinds, normalisation, icue]
status: stable
generated: { by: "claude", at: "2026-08-24T21:40:00-04:00" }
---

# One key has four spellings, and comparing any two of them directly finds nothing

Four vocabularies name the same physical key, and every one of them is
somebody's authoritative format:

| spelling | who writes it |
|---|---|
| `IK_Period` | the engine's own id, in `r6\input` and `r6\config` |
| `Period` | that id minus its prefix - what base-game rows carry |
| `.` | prettified for a human - what mod rows carry |
| `PeriodAndBiggerThan` | a vendor profile (iCUE), which names a key after **every glyph printed on it** |

A comparison of raw strings across any two of those finds **nothing**. And
finding nothing is the dangerous answer here rather than the harmless one,
because in every consumer of this data "no match" means "free" or "dead".

## The defect this actually produced

A "is this key free?" gate is the highest-stakes consumer: it answers *is it safe
to bind here*, and a gate that misses half the claimants reports a taken key as
free, after which somebody binds over quickload.

Asked with `.` it missed every base-game claim. Asked with `Period` it missed
every mod claim. **The two spellings of one question disagreed with each other,
and both were wrong** - each internally consistent, each silently blind to one
half of the data.

The same miss in a device join prints a working button as
[DEAD](/input/a-peripheral-profile-is-a-layer).

## Canonicalise once, in one place

Key identity must be folded to a single opaque token before any comparison, and
that folding belongs in **one** place that every store's reader passes through.
The second copy of the table is the bug: it is correct the day it is written and
drifts silently afterwards, and the two callers then disagree about the same key
while each looks internally consistent.

Four rules make such a table safe:

- **The token is opaque - for equality only, never printed.** Display names stay
  exactly as each store rendered them, because the pretty names are what makes a
  sheet readable.
- **Fold case, spaces and underscores**, so `Caps Lock` and `CapsLock` are one
  key.
- **An unknown name passes through as itself**, folded but never dropped and
  never guessed at from its spelling. A table that swallows what it does not
  recognise reintroduces exactly the bug it was built to fix: the unrecognised
  key claims nothing and reads as free.
- **Two genuinely different keys must never collide.** Every entry is an explicit
  synonym of a key that really exists; nothing is inferred from the string.

**Extend the table from names actually seen in a store**, not from what a vendor
might plausibly call something. A speculative synonym is a collision risk with no
evidence behind it.

## Adding a store means adding a fold, not adding a comparison

Any new source of bindings arrives with its own vocabulary. The mistake is to
compare its strings to the existing ones and patch up the misses that show;
the misses that do not show are the ones that matter.
