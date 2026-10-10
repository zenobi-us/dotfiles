---
type: Interaction Pattern
title: An HDR retrofit layer changes what every later shader sees
description: A tonemapping add-on that replaces the game's tonemapper runs before ReShade, compressing the frame's contrast ratio so threshold-based effects treat half the image as bright - and the diagnostic signature is bloom with no traceable light source.
tags: [hdr, tonemapping, reshade, bloom, thresholds, renodx]
status: draft
generated: { by: "claude", at: "2026-08-24T22:10:00-04:00" }
---

# An HDR retrofit layer changes what every later shader sees

An HDR retrofit add-on - the kind that replaces the game's own tonemapper rather
than post-processing its output, RenoDX being the common one for this game -
inserts itself **before** ReShade's chain. Every shader afterwards is reading
numbers that layer produced.

That is not a small change of degree. In one measured scene a neon sign roughly
**40x brighter than the wall behind it** arrived at the shaders at about
**1.35:1**. The whole frame is compressed into a narrow band.

## The diagnostic signature: bloom with no source

A threshold-based effect asks "which pixels are bright". Feed it a frame where
everything is within a third of everything else and the answer is *most of
them*. Instead of localised glow around emissive surfaces you get a **uniform
grey haze lifting the entire image**.

> **Bloom that lifts the whole picture with no traceable light source is a
> contrast-range problem, not a bloom-settings problem.** Turning the intensity
> down makes a paler haze; it does not make the haze localised.

Removing such a layer in one case restored black blacks and confined glow to
real emissive sources - which is the test worth running before spending an
evening on thresholds.

## It is only worth its complexity if the game's HDR is genuinely broken

The layer exists to fix a broken native HDR implementation. Where the game's own
HDR is sound, it is a large intervention that every downstream shader then has to
be re-tuned around. Establish that the native path is actually the problem
before adding one.

## Two controls that mean something other than what they look like

**A slider at 50 may be "vanilla passthrough", not "half".** These tools
frequently *scale* the game's own effect rather than substituting their own, with
the midpoint meaning "leave it as the game had it". The consequence catches
people out: if the underlying effect is disabled in game, the slider does nothing
at **any** value, and sweeping it end to end proves nothing.

**"Game brightness" means creative reference white, not display peak.** Entering
the display's measured peak luminance tells the tool to treat everything up to
that level as ordinary scene content, which crushes all HDR separation. The
result looks terrible, and the tool is behaving correctly on a wrong input. Peak
brightness is a different setting; see
[HDR and SDR are two different calibrations](/rendering/hdr-and-sdr-are-two-different-calibrations).

## What was not verified

- The 40:1 → 1.35:1 measurement is one scene, one session, one add-on version.
  The mechanism generalises; the exact ratio does not.
- The slider semantics above are one tool's. Read the add-on's own documentation
  before assuming a midpoint means passthrough elsewhere.

## Related

- [ReShade sees the frame after the game has finished with it](/rendering/stage-order-decides-where-a-fix-belongs)
- [Telling bloom from what is not bloom](/rendering/telling-bloom-from-what-is-not-bloom)
- [One grain pass, and one grain model](/rendering/one-grain-pass-and-one-grain-model) - the same layer can add grain of its own
