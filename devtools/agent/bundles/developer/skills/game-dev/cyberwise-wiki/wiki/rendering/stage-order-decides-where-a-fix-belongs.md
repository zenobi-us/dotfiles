---
type: Engine Mechanic
title: ReShade sees the frame after the game has finished with it, which decides where every fix belongs
description: The controllable stages between the scene render and the panel, why a ReShade shader can never see pre-tonemap values whatever its position in the technique list, and why the earliest controllable stage is the right place to fix exposure.
tags: [rendering, pipeline, reshade, tonemapping, gamma, exposure]
status: stable
generated: { by: "claude", at: "2026-08-24T22:10:00-04:00" }
---

# ReShade sees the frame after the game has finished with it, which decides where every fix belongs

Almost every argument about "should I fix this in game or in ReShade" is settled
by one fact about where the hook sits.

**ReShade hooks the swapchain.** By the time any shader runs, the game has
already done its own post-processing, applied its tonemap and applied gamma. A
shader therefore **can never see pre-tonemap linear HDR values**, no matter
where it sits in the technique list. Ordering inside ReShade controls order
*relative to other ReShade shaders* and nothing else.

## The stages, in order

| stage | controllable? |
|---|---|
| scene render | no |
| the game's own post: bloom, lens flare, chromatic aberration, DoF, vignette | yes - each toggleable |
| tonemapping | engine-internal in SDR |
| gamma | yes |
| ReShade | yes |
| the display's own processing | yes, and usually working against you |

Two consequences worth holding onto:

- **An in-engine fix beats correcting the same thing in ReShade**, because the
  earlier stage has richer data to work with. Disabling an effect the game is
  applying is not the same quality of result as adding a shader to cancel it out.
- **The last stage is not yours.** Whatever the panel does to the signal happens
  after everything above - see [the display is the last stage](/rendering/the-display-is-the-last-stage).

## Fix exposure at the earliest controllable stage

Gamma is the earliest brightness control a player actually has, so a dark image
gets fixed there. Lifting the same image in ReShade instead pushes
already-processed values around, and the cost is **banding and shadow noise** -
detail the earlier stage still had and the later stage does not.

The same reasoning is why an HDR retrofit layer is such a big lever: it inserts
itself *before* ReShade and changes the numbers every later shader reads. See
[an HDR retrofit layer changes what every later shader sees](/rendering/an-hdr-retrofit-layer-changes-what-shaders-see).

## Reading the gamma calibration screen correctly

The instruction on the calibration screen says the logo should be "barely
visible", and that phrase gets read as "invisible", which crushes the shadows.

- **barely visible** - perceptible if you look for it. Correct.
- **clearly visible** - gamma too high, blacks washed out.
- **invisible however hard you look** - shadows crushed, detail already gone
  before any later stage can recover it.

Calibrate **under the room lighting you will actually play in**. A calibration
done in a bright room is a different setting from one done at night, and neither
is wrong except in the other room.

## Related

- [Bloom has no toggle in the game's options](/rendering/bloom-has-no-toggle-in-the-options)
- [Ordering the effect chain: infrastructure first, meters last](/rendering/ordering-the-effect-chain)
- [The display is the last stage, and its "enhancements" fight the art direction](/rendering/the-display-is-the-last-stage)
