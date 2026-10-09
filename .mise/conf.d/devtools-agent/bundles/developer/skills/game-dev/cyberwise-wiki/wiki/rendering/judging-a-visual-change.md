---
type: Process
title: Judging a visual change - toggle in place, and verify the grade against a palette that will punish it
description: Change detection in the same retinal position is far more sensitive than side-by-side comparison and leaves a reusable file behind; and a grade built in one palette does not survive another, so verification needs night neon, daylight, a bright interior and rain on asphalt.
tags: [comparison, calibration, grading, method, screenshots]
status: stable
generated: { by: "claude", at: "2026-08-24T22:10:00-04:00" }
---

# Judging a visual change - toggle in place, and verify the grade against a palette that will punish it

Two habits decide whether an evening of shader tuning produces a decision or an
opinion.

## Toggle layers in place; do not compare side by side

Capture the same frame with each setting, stack them as layers, and **toggle
between them in the same position on screen**.

Human change detection **in the same retinal position** is far more sensitive
than spatial comparison. Two images side by side are being compared by memory
across a saccade, which is exactly the comparison people are bad at - and it is
why side-by-side screenshots so often "look the same" when a toggle makes the
difference obvious.

The second benefit is procedural: the layered file is **a reusable artefact that
documents the decision**. Six months later it still answers "why is this set to
this", which no amount of remembering does.

Practical requirement: the two captures must be the **same frame**, which means
frozen time and a fixed camera - see
[composing in the gameplay renderer](/rendering/composing-in-the-gameplay-renderer).

## A grade built in one palette does not survive another

Night City hands you scenes with wildly different colour content, and a grade
tuned in one of them will be wrong in the others. Verify against all of:

| scene | what it tests |
|---|---|
| **mixed-neon night** | saturation handling and colour crosstalk between sources |
| **daylight** | highlight rolloff and skin tones |
| **bright interior** | white balance with no coloured key light to hide behind |
| **forced rain on wet asphalt** | the most punishing case - specular highlights everywhere, on a surface that is mostly reflection |

Rain on asphalt is worth calling out because it is the one people skip and the
one that breaks a grade: every light in the scene is duplicated as a highlight on
a moving reflective surface, so any bloom, sharpening or contrast decision that
was marginal elsewhere becomes obvious.

**Check both day and night for any shader you calibrate**, not just the grade -
the same rule applies to bloom thresholds and sharpener strength.

## Related

- [Telling bloom from what is not bloom](/rendering/telling-bloom-from-what-is-not-bloom) - a per-shot effect that no single value settles
- [HDR and SDR are two different calibrations](/rendering/hdr-and-sdr-are-two-different-calibrations) - re-calibrate one shader at a time on a fixed test scene
- [Capture formats and what they clip](/rendering/capture-formats-and-what-they-clip) - verify the capture path before judging anything from its output
