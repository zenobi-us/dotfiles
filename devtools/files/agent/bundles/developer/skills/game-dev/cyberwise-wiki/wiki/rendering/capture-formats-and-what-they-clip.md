---
type: File Format
title: The capture path can silently ruin a finished shot, and ReShade's HDR screenshots were the culprit
description: 16-bit PNGs from ReShade blew out highlights and looked nothing like the screen; Game Bar and OBS capture HDR faithfully as JPEG XR; and the tooling around .jxr has gaps that reproduce the same overexposure.
tags: [capture, screenshots, hdr, jxr, png, colour-management]
status: draft
generated: { by: "claude", at: "2026-08-24T22:10:00-04:00" }
---

# The capture path can silently ruin a finished shot, and ReShade's HDR screenshots were the culprit

The worst property of a bad capture path is that **it does not fail**. It writes
a file, the file opens, and the image is wrong in a way that reads as a mistake
by whoever composed the shot. A portrait blamed on skill turned out to be the
capture pipeline clipping.

> **ReShade's own HDR screenshots could not be trusted.** Its 16-bit PNGs blew
> out highlights and looked nothing like what was on screen - noticeably worse in
> daylight scenes than at night, which is exactly the pattern a clipping problem
> makes and exactly the pattern that reads as "I overexposed it".

Test the capture path against the screen before trusting any judgement made from
its output.

## What captured HDR faithfully

**Windows Game Bar and OBS**, both writing **JPEG XR (`.jxr`)**. Those files look
right in the first-party Windows viewer because Windows owns the whole pipeline
around them - the display calibration profile, the compositor and the tone
mapper are all the same vendor's.

Game Bar also writes an **8-bit PNG alongside** the `.jxr`. That sidecar is the
post-tonemap SDR frame actually sent to the display: flatter than the HDR file,
and **faithful**. For a lot of work it is the file you actually want - see
[HDR delivery is a negotiation, and SDR is the honest format](/rendering/hdr-delivery-is-a-negotiation).

## The .jxr tooling gaps

`.jxr` is a Microsoft format with thin support outside Microsoft, and the gaps
reproduce the original problem rather than announcing themselves:

- **Photoshop has no native JXR support.** A vendor plugin exists and produced
  **the same overexposure signature** as the ReShade captures - so a workflow
  that routes through it has not escaped the fault, it has re-entered it.
- **ImageMagick has no native JXR codec either.** It shells out to an external
  decoder, and needs the **HDRI build** to carry the values once decoded. A
  non-HDRI ImageMagick will quantise on the way through and tell you nothing.
- **The reference library does not retain above-8-bit information when converting
  *to* JXR.** Decoding *from* JXR is fine. Treat `.jxr` as a source format that
  arrives from the capture tool, never as an intermediate you write into.

## A magenta mess on import is a colour-space mismatch

Importing an HDR capture and getting a magenta image is a **profile** problem,
not a corrupt file.

The fix is a real **conversion** - Photoshop's *Convert to Profile*, which
performs the colour math - and not *Assign Profile*, which only relabels the
numbers and leaves them being interpreted by the wrong primaries.

## What was not verified

- The ReShade clipping and the Photoshop plugin behaviour were each observed on
  one machine, one version, one session. Both are single observations; the
  pattern (worse in daylight than at night) is what makes them credible rather
  than a repeated test.
- Whether newer ReShade builds still clip HDR PNGs was not re-checked.

## Related

- [HDR delivery is a negotiation, and SDR is the honest format](/rendering/hdr-delivery-is-a-negotiation)
- [HDR and SDR are two different calibrations](/rendering/hdr-and-sdr-are-two-different-calibrations)
