---
type: Interaction Pattern
title: Sharpening recovers detail, it never invents it - and SDR tolerates far more of it than HDR
description: Why a contrast-adaptive sharpener does not halo, how its strength should scale with the upscaler and any AI denoise stage ahead of it, and the measured finding that HDR degrades at a sharpening level SDR is happy at.
tags: [sharpening, cas, upscaling, hdr, sdr, artifacts]
status: stable
generated: { by: "claude", at: "2026-08-24T22:10:00-04:00" }
---

# Sharpening recovers detail, it never invents it - and SDR tolerates far more of it than HDR

Sharpening carries a bad reputation earned by unsharp masks. A **contrast-adaptive
sharpener** is a different algorithm and the reputation does not transfer.

## Why it does not halo

It samples a **small cross** around each pixel, measures **local minimum and
maximum luma**, and then does the opposite of an unsharp mask:

- **low-contrast edges are sharpened more**
- **high-contrast edges are backed off**

A halo is what you get from applying the same boost to an edge that already has
plenty of contrast. Backing off exactly there is the mechanism. It also runs a
**noise detector**, so it does not crunch grain into a mess of hard speckle.

> **It recovers edges that were softened. It cannot add detail that was never
> rendered.** Any expectation of "more detail" from a sharpener is an
> expectation of invention, and the answer is more pixels, not more sharpening.

## Scale the strength to how much softening happened upstream

The amount of sharpening that is *correct* is a function of what degraded the
image before it:

- **the more aggressive the upscaler**, the more detail was lost, the more
  sharpening is recovering something real
- **an AI denoise stage before upscaling adds a second softening pass**, and
  warrants more again

That is a principle you can reason from, rather than a number to copy: two
installs with different upscaler settings should not have the same sharpener
strength.

## SDR tolerates far more sharpening than HDR

Tested in **0.1 increments across both day and night scenes**: maximum strength
was best in **SDR**, while **HDR degraded badly above a modest value**.

The reason is the sharpener's own mechanism. It works on **edge contrast**, and
HDR's wider contrast range simply gives it far more to overdrive - the same
setting is a much larger intervention.

**This is one person's measurement on one stack**, and the specific numbers are
not portable. The direction is the useful part: after switching output modes,
re-sweep the sharpener rather than carrying the value across. See
[HDR and SDR are two different calibrations](/rendering/hdr-and-sdr-are-two-different-calibrations).

## A second sharpener has to be pushed, and then clamped

If a corrective sharpener has already consumed the available contrast, a second,
aesthetic one has to run at a much higher value to register at all - and at that
value it will manufacture noise unless **clamping is kept tight**. Push and clamp
together, never push alone.

## Related

- [Ordering the effect chain](/rendering/ordering-the-effect-chain) - corrective sharpener before aesthetic, and where grain goes
- [One grain pass, and one grain model](/rendering/one-grain-pass-and-one-grain-model)
