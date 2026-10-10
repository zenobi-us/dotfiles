---
type: Engine Mechanic
title: Photo mode is a separate rendering context, so a path-traced shot composed there does not match the game
description: Ray reconstruction is broken inside photo mode and the dedicated path-tracing-in-photo-mode setting does not fix it; the alternative is freezing time and flying a detached camera in the gameplay renderer, where every effect behaves as it did while playing.
tags: [photo-mode, path-tracing, ray-reconstruction, free-camera, dof, relighting]
status: draft
generated: { by: "claude", at: "2026-08-24T22:10:00-04:00" }
---

# Photo mode is a separate rendering context, so a path-traced shot composed there does not match the game

Photo mode is not the gameplay renderer with a camera attached. It is **its own
rendering context**, and **ray reconstruction is broken inside it**. A
path-traced shot composed there does not match what the gameplay renderer
produces - the denoising is different, so the lighting is different.

The separate "path tracing in photo mode" setting does not close this. It keeps
path tracing **active**; it does not repair ray reconstruction.

## The alternative: stay in the renderer that was already correct

Compose in the gameplay renderer instead:

1. **Freeze time** with an external tool.
2. **Position a detached third-party camera** - an IGCS-style free camera.
3. **Capture.**
4. **Unfreeze.**

Every effect then behaves exactly as it did while playing, because nothing
switched contexts. That is the entire argument for the more awkward workflow.

## "Enabled" does not mean "being applied" for a render-on-demand DoF

One class of depth-of-field shader - IgcsDOF is the example - **composites its
result from a frozen frame when you press render**. For those, *enabled* means
"available", not "active". A preset can carry it, the checkbox can be ticked,
and no depth of field is being applied to anything you are looking at.

Two further consequences, both of which send people down dead ends:

- It achieves blur from **real camera parallax**, not from a depth map. So it
  handles **hair, foliage and transparency correctly**, where a depth-based DoF
  smears them.
- **Depth-buffer settings have no bearing on it.** A depth-buffer investigation
  into this effect is guaranteed to find nothing. Point that troubleshooting at
  the depth-dependent effects instead.

## Two kinds of relighting shader, and only one replaces the game's lighting

| shader | what it does |
|---|---|
| unoccluded character light | adds fill lights that **shine through walls** - supplements the game's lighting |
| path-traced relighting | adds sources with **raytraced visibility**: real umbra and penumbra, area lights, subsurface scattering |

The second effectively **removes the game's own lighting from a shot** and lets
you light it yourself. The first only adds to what is already there. Choosing
the wrong one is why "I added a light and it looks like a torch taped to the
lens" happens.

## What was not verified

The ray-reconstruction fault in photo mode is a single observation on one patch
and one driver. It has not been re-tested since, and it is the kind of thing a
patch or a driver release can silently fix.

## Related

- [Frame generation is display smoothness, never input latency](/rendering/frame-generation-is-smoothness-not-latency) - and it contributes nothing at all in frozen time
- [Ordering the effect chain](/rendering/ordering-the-effect-chain) - path tracing makes several shaders redundant
