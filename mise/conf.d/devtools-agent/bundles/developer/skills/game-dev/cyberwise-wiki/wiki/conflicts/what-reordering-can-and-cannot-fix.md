---
type: Diagnostic Method
title: Three conflicts look identical in a report and only one is fixable by order
description: A lost fight is fixable by reordering. A coverage gap - only one mod ships the file at all - is not, because no ordering conjures content that is not in the archive. Two mods claiming the same single resource when the user wants both is not satisfiable at all. Work out which you have before promising anything.
tags: [load-order, coverage-gap, conflicts, diagnosis, satisfiability]
status: stable
generated: { by: "claude", at: "2026-08-24T21:00:00-04:00" }
---

# Three conflicts look identical in a report and only one is fixable by order

Three situations produce an identical-looking conflict report, and **only one of
them is a load-order problem.** Work out which you have before promising a
reorder, because two of the three cannot be delivered.

## 1. A lost fight - fixable by order

Both mods ship the same resource; the later one loses. Reorder and it wins.

**This is the only case where load order is the answer.**

## 2. A coverage gap - NOT fixable by order

Only one mod ships that resource. The other never contested it, so there is
nothing to win. No amount of reordering conjures content that is not in the
archive.

This is the case most often misdiagnosed, because the *symptom* looks exactly
like a conflict. A skin-tone patch covering torso and arms but shipping no leg
textures leaves the legs mismatched forever - and a conflict checker shows
**zero conflicts**, because there is no contested file.

**The tell: the user reports a visual mismatch, and the scanner reports nothing
wrong.** Extract the archive and read its actual file list. If the path is not
there, stop looking at load order.

## 3. Mutually exclusive claims - not fixable at all

Two mods ship the same single resource and the user wants both to apply. That is
arithmetically impossible, and shuffling the order just moves which one is dead.

**Say so plainly rather than reordering and hoping.** Two billboard mods each
carrying one texture for the same surface is an either/or, and the useful
response is "these replace the same file, pick one" - not three rounds of
load-order changes that each silently kill the other mod while the user watches.

## Check that a request is satisfiable before you start satisfying it

The reordering-and-hoping loop is expensive in exactly the way that is hardest
to notice: each round produces a visible change, so it feels like progress right
up until the list has been through five orders and the user has two mods where
they wanted two working mods.

Afterwards, re-scan: [a precedence change can create
casualties](/conflicts/a-precedence-change-creates-casualties).

## Related

- [Not every visual mismatch is a conflict](/conflicts/visual-bugs-that-are-not-conflicts)
