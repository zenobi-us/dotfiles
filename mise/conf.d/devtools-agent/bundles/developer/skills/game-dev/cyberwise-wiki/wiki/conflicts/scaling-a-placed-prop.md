---
type: Game Mechanic
title: Scaling a placed prop is four separate edits, and the anchors do not follow the mesh
description: visualScale moves the mesh and nothing else. The light needs five fields plus its localTransform offset, particle size lives in the .effect, and effect anchors move on a curve you cannot derive - on one prop reduced to a third, anchors needed dividing by 1.5, not 3.
tags: [authoring, mesh, lights, effects, appearance, scaling]
status: stable
generated: { by: "claude", at: "2026-08-24T21:00:00-04:00" }
---

# Scaling a placed prop is four separate edits, and the anchors do not follow the mesh

Resizing a placed object is not one number. Missing any of these leaves a prop
that **looks resized until you look properly** - which is the expensive failure,
because it passes a glance and fails in play.

## 1. Mesh

`visualScale` on `entPhysicalMeshComponent`, in the `.app`. **This is all it
scales.** Everything below is untouched by it.

## 2. Light

`entLightComponent`: `radius`, `sourceRadius`, `capsuleLength`,
`areaRectSideA` / `areaRectSideB`, **and its `localTransform` offset**.

The offset matters most and is the one usually forgotten: left alone, the light
stays where it was and hangs **outside a shrunken object entirely**.

Offsets are `FixedPoint`:

```
bits = metres × 131072
```

## 3. Particle size

A `CEvaluatorVectorConst` under `size`, in the `.effect`.

Effects are often referenced **by hash** rather than by path. Extract by hash,
edit a copy under your own depot prefix, then repoint the `.app`'s ResourcePath
from `$storage: uint64` to `$storage: string`.

## 4. Effect anchors

Slot `relativePosition` values, plus the effect descriptor's own
`relativePositions`.

**Anchors do not scale with the mesh, and not by the factor you expect.** On one
prop reduced to a third, the anchors needed dividing by **1.5, not 3**. The
model hangs below its origin, so shrinking pulls the body toward the origin
while the anchors move on a different curve. **There is no deriving this from
the file** - it has to be measured in game.

## So ship a bracket of variants and look at them

Five variants cost the same as one once the build is scripted, and it ends the
one-guess-per-round-trip ping-pong that otherwise eats an evening. Author them
as separate appearances and switch between them in game.

This is the general lesson: when a value cannot be derived, do not iterate on it
one round-trip at a time. Make the round-trip produce the whole search space at
once.

## Effects do not spawn from `entSlotComponent`

The effect descriptor's **`placementTags`** name the slots. `isAutoSpawn` is the
real on/off flag - renaming an `_autospawn` tag does nothing at all, and looks
like it should.

## Related

- [A serialized RED4 file survives a targeted regex, not a JSON round-trip](/conflicts/editing-serialized-red4-json)
