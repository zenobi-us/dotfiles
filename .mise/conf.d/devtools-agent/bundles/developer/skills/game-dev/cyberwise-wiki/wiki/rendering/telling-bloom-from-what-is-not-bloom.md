---
type: Diagnostic Method
title: Telling bloom from what is not bloom, and why bloom is a per-shot decision
description: Path-traced reflections and lens flare both get reported as bloom; the distinction is whether the light is around a source or an image of it - and unlike a corrective effect, bloom interacts with composition and cannot be set once globally.
tags: [bloom, path-tracing, reflections, lens-flare, diagnosis, composition]
status: stable
generated: { by: "claude", at: "2026-08-24T22:10:00-04:00" }
---

# Telling bloom from what is not bloom, and why bloom is a per-shot decision

"There is too much bloom" is one of the least reliable reports in this whole
area, because three different effects produce bright soft areas around lights and
only one of them is bloom.

| what you see | what it actually is |
|---|---|
| a soft glow **around** a light source | bloom |
| an **image of** the source on another surface | a path-traced reflection |
| halos, or streaks, at point sources | lens flare |

**Path-traced reflections get mistaken for bloom constantly.** The test is
whether the bright area is *around* the emitter or is a *picture* of the emitter
appearing somewhere else - on wet asphalt, on a car panel, on glass. A
reflection has structure; it resolves into a recognisable shape when you look at
it, and it moves with the viewing angle rather than with the source.

**Lens flare is not only streaks.** It also produces halos around point sources,
which is precisely the appearance people attribute to bloom. Before hunting for
a bloom setting, toggle the game's lens flare option - it is in the graphics menu,
which bloom is not
([bloom has no toggle in the game's options](/rendering/bloom-has-no-toggle-in-the-options)).

Getting this wrong costs more than a wrong guess: it sends someone to disable
bloom, which changes nothing, and then to conclude the bloom toggle is broken.

## Bloom is a per-shot decision, not a global setting

Corrective effects - a sharpener recovering upscaler softness, a debander - work
**globally**, because the thing they are correcting happens to every frame
equally. Bloom does not.

A convolution bloom at **very low intensity with the threshold already
corrected** still polluted a night sky with spill from the building lights below
it. Nothing was misconfigured. The effect interacts with **composition**: where
the bright sources sit in the frame, and what surrounds them.

> **A bloom setting that is right for a neon street is wrong for a skyline, and
> no single value exists that is right for both.** Expect to toggle it per shot
> rather than solve it once.

That is also why bloom is a poor thing to judge a whole preset by. See
[judging a visual change without fooling yourself](/rendering/judging-a-visual-change).

## What was not verified

The night-sky spill was one scene with one convolution bloom shader. The general
point - that bloom is composition-dependent where corrective effects are not -
follows from what the effect does, but the specific threshold behaviour is a
single observation.

## Related

- [An HDR retrofit layer changes what every later shader sees](/rendering/an-hdr-retrofit-layer-changes-what-shaders-see) - the other cause of "bloom" nobody configured
- [Bloom has no toggle in the game's options](/rendering/bloom-has-no-toggle-in-the-options)
