---
type: Interaction Pattern
title: Making one mod win can kill a third mod nobody mentioned
description: Precedence is zero-sum over contested files. Promoting one archive above two others turned a fourth archive completely inert - all 17 of its files were now owned by the promotion. Re-run the scan and diff the inert list after any ordering change.
tags: [load-order, precedence, inert, collateral, conflicts]
status: stable
generated: { by: "claude", at: "2026-08-24T21:00:00-04:00" }
---

# Making one mod win can kill a third mod nobody mentioned

Making X win means something else stops winning, and that something may be a
party the user never mentioned and does not expect to be affected.

A real sequence, from one large install. A skin mod was promoted to beat two
others. That was correct, and exactly what the user asked for. The next
collision scan showed a **fourth** archive had become completely inert - all
**17** of its files were now owned by the newly promoted mod. Nobody asked for
that mod to die; it was collateral, and nothing in the change request hinted it
existed.

## So: re-run the collision scan and diff the inert list

Do it after applying any precedence rule, not before the next problem is
reported. Anything **newly** inert is a consequence of your change and needs
surfacing, because the user may want to uninstall it, may want the rule
reversed, or may not have realised the two mods overlapped that heavily. Any of
those is their decision, and they can only make it if they are told.

The diff, not the absolute list. An install that has been running a while
already has inert archives that are fine; the finding is what changed.

## The same check catches the opposite case

Sometimes a mod you *expected* to die turns out to still own files the winner
does not ship. That is a
[coverage gap](/conflicts/what-reordering-can-and-cannot-fix) wearing a
conflict's clothing, and it means both mods should stay installed - the loser is
still the only source of those files.

## Related

- [An archive that contributes nothing](/conflicts/an-archive-that-contributes-nothing)
- [What reordering can and cannot fix](/conflicts/what-reordering-can-and-cannot-fix)
