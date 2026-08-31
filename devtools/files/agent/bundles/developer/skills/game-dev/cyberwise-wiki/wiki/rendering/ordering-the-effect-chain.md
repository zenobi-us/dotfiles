---
type: Interaction Pattern
title: Ordering the effect chain - infrastructure first, meters last, corrective before aesthetic
description: A prepass shader produces no visible output but feeds every effect that follows, a corrective sharpener must precede an aesthetic one, and path tracing makes whole categories of shader redundant rather than merely unnecessary.
tags: [reshade, ordering, prepass, sharpening, grain, path-tracing]
status: stable
generated: { by: "claude", at: "2026-08-24T22:10:00-04:00" }
---

# Ordering the effect chain - infrastructure first, meters last, corrective before aesthetic

Order inside ReShade decides what each shader is handed. It cannot change where
ReShade sits overall - that is fixed at the swapchain, see
[stage order decides where a fix belongs](/rendering/stage-order-decides-where-a-fix-belongs) -
but within the chain it is the difference between an effect working and an
effect quietly reading a buffer nothing filled.

## Infrastructure first

**A prepass shader produces no visible output.** It supplies frame data, motion
vectors and depth preprocessing that other effects in its family consume. If it
is not at the top of the list, those effects misbehave **with no error** - no log
line, nothing in the overlay, just wrong output.

> **When several effects from one pack fail together, the pack's prepass is the
> first suspect, before any individual effect's settings.**

Meters, overlays and anything that reads the finished frame go last, for the
mirror-image reason.

## Corrective before aesthetic

The two sharpeners in a typical stack are doing opposite jobs:

- a **contrast-adaptive sharpener** recovers detail *uniformly lost* to
  upscaling - corrective, global, undoing a known degradation
- an **anamorphic sharpen** imposes a centre-sharp / edge-soft optical
  character - aesthetic, deliberate, spatially varying

Run the aesthetic one first and the corrective one then tries to "fix" the edges
the other deliberately softened. **Corrective first, aesthetic second.**

When one sharpener has already consumed the available contrast, a second has to
be **pushed hard to register at all** - and tight clamping is what stops that
from turning into noise. See
[sharpening recovers detail, it never invents it](/rendering/sharpening-recovers-detail-it-never-invents-it).

## Grain: two orderings exist, and each buys something

The sharpener's own authors advise applying **grain after sharpening**, rather
than paying for the sharpener's more expensive denoise path to protect grain
that is already there.

Other stacks deliberately order **grain before sharpening**, so the sharpener
acts on the grain as part of the image. Both orderings are in use; neither is a
mistake. Decide which one you want:

| order | what it buys |
|---|---|
| sharpen → grain | clean sharpening, grain untouched, no denoise cost |
| grain → sharpen | grain treated as image texture and sharpened with it |

Whichever you pick, **only one grain pass should exist in the whole stack** -
see [one grain pass, and one grain model](/rendering/one-grain-pass-and-one-grain-model).

## Path tracing makes whole categories redundant

Not "less useful" - **redundant**, doing again what an earlier stage already did
better:

| shader category | made redundant by |
|---|---|
| global illumination | the path tracer |
| ambient occlusion | the path tracer |
| anti-aliasing | the upscaler's own AA |

Leaving them enabled costs frames and layers a screen-space approximation over a
correct result. Audit for these before tuning anything else in the list.

## Related

- [Sharpening recovers detail, it never invents it](/rendering/sharpening-recovers-detail-it-never-invents-it)
- [One grain pass, and one grain model](/rendering/one-grain-pass-and-one-grain-model)
- [Two shader packs by one author ship the same headers](/formats/stacked-shader-packs) - the ordering rule's companion problem
