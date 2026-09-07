---
type: Engine Mechanic
title: Environmental light alone silhouettes a subject, because the scene is lit for legibility rather than for faces
description: Game environments are lit so a player can read space and threat at speed, which is not what lights a face. And the opposite error: a custom light dropped until it only just exceeds ambient produces motivated, integrated lighting instead of a subject pasted onto a dark plate.
tags: [lighting, relighting, ambient, portrait, motivated-lighting, level-lighting]
status: stable
generated: { by: "claude", at: "2026-08-24T23:48:00-04:00" }
---

# Environmental light alone silhouettes a subject

"Just find a well-lit spot" does not work, and the reason is structural rather than
a matter of finding a better spot.

**A game environment is lit for gameplay legibility.** The lighting artist's job is
to make space readable at speed, draw the eye toward objectives, separate walkable
from not, and keep threats visible. That work is done with large sources, strong
ambient, and heavy backlighting on architecture - all of which is excellent for
navigating a room and produces, on a character standing in it, a **silhouette**:
rim-lit edges, a dark face, no modelling.

It is not underexposure. Raising the exposure on a silhouette gives a brighter
silhouette.

So a portrait in this game needs a light **added**. That is not a failure of the
scene; it is the scene doing a different job.

## The opposite error, which is more interesting

Having established that a light must be added, the instinct is to make it clearly
visible - to see it working. That produces the other failure: a subject who looks
**pasted onto the environment**. Lit person, dark plate, no relationship between
them. It is the look of a green-screen composite done badly, and it happens because
the added light has no counterpart anywhere else in the frame.

The fix is a single, cheap move:

> **Drop the added light's intensity until it only just exceeds the ambient level
> of the scene.**

At that point the light reads as **motivated** - the eye accepts it as something
present in the world, a sign, a window, a passing car - and the subject sits inside
the environment instead of on top of it. The face is modelled, the scene is intact,
and nothing announces that a light was added.

That threshold is worth finding deliberately rather than by taste. Start too bright,
come down until the shot stops looking lit, and stop one step past that.

## Practical consequence for choosing a location

Because the environment cannot light the face, the thing to select a location for
is the **background and the ambient level**, not the light on the subject:

- a scene with **low, even ambient** gives the added light the most room
- a scene with **strong practical sources** already in frame gives an added light
  something to be motivated *by*, which makes it much easier to hide
- a scene lit brightly and evenly for gameplay is the hardest, because any added
  light must exceed a high floor to do anything, and exceeding it is what makes it
  look added

## Related

- [Range does more work than intensity](/rendering/light-range-does-more-than-intensity) - the tuning that makes a low-intensity light still model a face
- [A fill light belongs near the camera axis](/rendering/a-fill-light-belongs-near-the-camera-axis)
- [Photo mode is a separate rendering context](/rendering/composing-in-the-gameplay-renderer) - and the two classes of relighting shader, only one of which replaces the scene's own lighting
- [Judging a visual change](/rendering/judging-a-visual-change) - toggle the added light in place rather than comparing two saved frames

## Confidence and scope

Observed while composing portraits in game; the mechanism (level lighting optimised
for legibility) is a general property of game environments rather than of this
title. The "just above ambient" threshold is a working technique, not a measured
value, and it moves with every scene.
