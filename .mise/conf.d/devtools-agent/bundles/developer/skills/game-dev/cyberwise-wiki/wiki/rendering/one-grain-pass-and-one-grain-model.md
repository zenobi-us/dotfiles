---
type: Interaction Pattern
title: One grain pass, and one grain model - three layers can each add grain
description: The game, an HDR add-on and a ReShade shader can all apply grain independently; stacked passes are noisier and untunable, and the choice between a halide-crystal simulation and a sensor-noise model changes what every control below it means.
tags: [grain, film-grain, sensor-noise, banding, dither, reshade]
status: stable
generated: { by: "claude", at: "2026-08-24T22:10:00-04:00" }
---

# One grain pass, and one grain model - three layers can each add grain

Grain can be applied in at least three places independently: **by the game**, **by
an HDR retrofit add-on**, and **by a ReShade shader**. Nothing coordinates them.

Two passes are not "a bit more grain". They are noisier than either alone, and -
the part that actually wastes an evening - **the ReShade pass cannot be tuned
against a moving baseline**. Every adjustment is being judged on top of an
unknown amount of somebody else's grain.

> **Decide which layer owns grain, turn it off in the other two, and tune once.**

## Pick the model before touching any control

Grain shaders simulate two different physical things, and the controls read the
same while meaning different things:

| model | simulates | characteristic controls |
|---|---|---|
| analogue film grain | silver-halide crystals in an emulsion | characteristic-curve **toe and shoulder**, **crystal size** |
| sensor noise | a digital sensor's read noise | a **Bayer matrix**, per-channel behaviour |

Choosing the model is the first decision, not a detail: it changes what every
control underneath it means. A "size" control on a crystal simulation and a
"size" control on a sensor-noise model are not the same parameter.

## Three things that follow from the physics

- **Real grain is strongest in the midtones**, not uniform across the frame. A
  shader that lays even noise over black shadows and blown highlights is not
  modelling film, whatever it is called.
- **Scale crystal size to output resolution.** Crystal size is in image-plane
  terms; the same value at 1080p and 4K gives visibly different grain.
- **Grain is also a dither.** It partly disguises banding, which is why it is
  worth keeping in an 8-bit delivery workflow even when the aesthetic argument
  is thin - see
  [HDR delivery is a negotiation](/rendering/hdr-delivery-is-a-negotiation).

## Related

- [Ordering the effect chain](/rendering/ordering-the-effect-chain) - grain before or after sharpening, and what each ordering buys
- [An HDR retrofit layer changes what every later shader sees](/rendering/an-hdr-retrofit-layer-changes-what-shaders-see) - one of the three layers that can add grain without being asked
