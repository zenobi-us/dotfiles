---
type: Document Format
title: Describing a device's physical geometry so a tool can draw it
description: A flat list of buttons throws away the one property that makes a device usable without looking - where the button IS under your hand. This is the block a user bundle carries so a renderer can draw the real arrangement, and why it lives in the bundle rather than in a tool.
tags: [input, hardware, peripherals, icue, streamdeck, format]
status: stable
generated: { by: "claude", at: "2026-08-25T09:10:00-04:00" }
---

# Describing a device's physical geometry so a tool can draw it

A programmable peripheral is a **layer** that emits keystrokes rather than
performing actions ([a peripheral profile is a
layer](/input/a-peripheral-profile-is-a-layer)). That article settles *what* a
device row means. This one settles *where the button is*.

The distinction earns its keep the moment anything renders those rows. A thumb
pad, a macro pad and a Stream Deck are all **arrangements**, and printing them as
a list of twelve rows destroys the single property that lets somebody use one
without looking down. "G7 sends `]`" is a fact you have to read. "the middle
button of the third column sends `]`" is a fact you can feel.

Vendor software does not export the arrangement. iCUE names a button `MouseG7`
and stops; nothing in the profile says which corner it sits in. So the geometry
has to come from somewhere else, and there are only two candidates.

## Why this is bundle data and not a table inside a tool

A registry of every peripheral, shipped with the tool, is a database that rots.
It needs an edit every time anybody buys a mouse, it is always behind, and the
one device it is guaranteed not to know is the one the person asking actually
owns.

The geometry of a device is a fact about **one person's desk**, exactly like the
machine profile beside it. So it goes in the user bundle, where a new device is a
wiki edit rather than a release, and the reader who owns the device is the person
who can check it.

What ships is this page: the concept and the schema. What never ships is which
devices somebody owns.

## The block

Anywhere in a user bundle's root-level articles - by convention `devices.md` -
one fenced block per **surface**:

````markdown
```device
match: SCIMITAR RGB ELITE
name: Corsair Scimitar RGB Elite Wireless
surface: side keypad
columns: 4
rows: 3
origin: bottom-left
flow: column
first: 1
prefix: G
count: 12
```
````

| field | meaning |
|---|---|
| `match` | **required.** Case-insensitive regex tried against the device name the profile reader reports. `SCIMITAR RGB ELITE` matches iCUE's `SCIMITAR RGB ELITE WIRELESS`. |
| `name` | what to call it on a page. Falls back to the reported device name. |
| `surface` | which part of the device this block describes. A device with two grids gets two blocks. |
| `columns`, `rows` | the grid, in keys |
| `origin` | which corner holds the **first** key: `bottom-left`, `bottom-right`, `top-left`, `top-right` |
| `flow` | which way the numbering runs from there: `column` (up or down a column, then to the next column) or `row` (along a row, then to the next row) |
| `first` | the number the first key carries. Default `1`. |
| `prefix` | put in front of the number to form the label the profile reader will report. `G` yields `G1`. Default empty. |
| `count` | how many keys the surface actually has, when it is fewer than `columns * rows`. Default `columns * rows`. |

`origin` plus `flow` is the whole of "which direction the numbering runs" -
nothing else is needed, because a corner already fixes both axes. Bottom-left
plus `column` means *up* the column and *rightwards* to the next one; top-right
plus `row` means *leftwards* along the row and *downwards* to the next.

## Say it in the units the device is built in

A Stream Deck, a macro pad and a mouse thumb pad are the same abstraction: a
grid of physical keys, each mapped to something. Nothing above says "mouse",
and nothing above should. A 5x3 Stream Deck numbered from the top left is:

```device
match: Stream Deck MK\.2
name: Elgato Stream Deck MK.2
surface: keys
columns: 5
rows: 3
origin: top-left
flow: row
first: 1
```

A schema that only describes thumb pads gets rewritten the first time somebody
plugs in something else.

## Irregular shapes: draw the thing

Some surfaces are not a filled rectangle - a numbering that skips, a bottom row
of two keys under a top row of three, a pad with a gap where a scroll wheel
intrudes. Rather than growing the schema a hole-punching field, give the block a
`map` and let the article show the arrangement literally:

```device
match: FICTIONAL PAD
name: A pad with a hole in it
columns: 3
rows: 3
prefix: G
map: |
  7 8 9
  4 . 6
  1 2 3
```

Top row first, whitespace between keys, `.` where there is no key. A bare number
takes `prefix`; any other token is the label as written, so a device whose keys
are named rather than numbered fits too.

**Prefer `map` whenever the derived form would need explaining.** The reason it
exists is not expressiveness, it is checkability: a reader with the device in
their hand can hold the page up next to it and see in one glance whether it is
right. `columns: 4 / origin: bottom-left / flow: column` is correct or incorrect
in a way nobody can see. Where both forms are present, `map` wins.

## What a renderer must do with a device it does not find

**Degrade to the flat list.** Most people own no programmable peripheral at all,
and of those who do, most have no geometry written down. A page that fails, or
that renders an empty grid, over the absence of an optional article is worse than
one that never drew a grid.

The same rule as the reader itself ([a peripheral profile is a
layer](/input/a-peripheral-profile-is-a-layer)): no bundle, no article, no
matching block, or a block that does not parse must each produce *no geometry*
and a page that still lists every button - never an error.

And whatever is drawn in a cell has to carry the **join**, not just the button
number. A grid whose cells show only labels is the vendor's configurator redrawn.
The cell earns its place by showing the keystroke and what that keystroke is
bound to - which is also the only way a grid can show a **dead** button, and a
physical layout is the best possible place to show one: the thing you want to
know is not that `G8` is dead, it is that *the one your thumb rests on* is.
