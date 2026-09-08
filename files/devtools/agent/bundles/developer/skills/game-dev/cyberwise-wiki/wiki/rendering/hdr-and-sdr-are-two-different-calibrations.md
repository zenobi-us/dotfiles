---
type: Environment
title: HDR and SDR are two different calibrations, and switching invalidates every shader setting
description: Why a shader stack tuned in one output mode misbehaves in the other, the log2 whitepoint that makes a bloom shader look insane after an HDR to SDR switch, and which luminance number a game's HDR peak setting actually wants.
tags: [hdr, sdr, calibration, whitepoint, luminance, bloom]
status: draft
generated: { by: "claude", at: "2026-08-24T22:10:00-04:00" }
---

# HDR and SDR are two different calibrations, and switching invalidates every shader setting

Toggling HDR is not a display preference sitting beside the shader stack. It
changes the range of values every shader is fed, so **bloom whitepoint and
intensity, sharpener strength and grain amount are all invalidated by the
switch**. A stack that was right yesterday is not merely "a bit off"; several of
its effects are now operating outside the range they were tuned for.

Re-calibrate **one shader at a time on a fixed test scene**, and check the result
in both day and night lighting before moving to the next. Changing three at once
produces a result nobody can attribute.

## The log2 whitepoint is the first thing to check

A bloom shader's **"Log HDR Whitepoint" is in log2 space**. `7.0` means `2^7` =
**128x reference white** is the expected ceiling of the incoming data.

Left at 7 while being fed SDR data, the shader treats every moderately bright
pixel as though it were a 1000-nit sun, and blooms catastrophically.

> **A bloom shader that looks insane immediately after an HDR → SDR switch: check
> the log whitepoint before touching intensity or threshold.**

## A shader pack may not support HDR at all, by design

At least one major shader family states outright that HDR is unsupported.
Running SDR-designed shaders while the game outputs HDR10 feeds them values
outside their expected range, and the results are not merely wrong but
unpredictable - different effects fail in different ways.

Where that is the case the choice is **genuinely either/or**: the game's HDR
output, or that pack. Read the pack's own statement about HDR support rather
than inferring it from whether the shaders compile - they will.

## The luminance number Windows shows you once and never again

The Windows HDR calibration app **displays a maximum-luminance figure on its
slider that it does not expose anywhere afterwards**. Write it down while it is
on screen. That is the number a game's HDR peak-brightness setting wants.

Three numbers get confused here, and they are all different:

| number | what it is |
|---|---|
| calibrated maximum luminance | what the panel actually sustained during calibration - the one games want |
| marketing peak | small-window, local-dimmed best case; larger, and not a scene-wide capability |
| paper white / UI brightness | a separate setting again, typically 200-300 nits |

Entering marketing peak where the calibrated figure belongs is the same class of
error as entering peak where reference white belongs - see
[an HDR retrofit layer changes what every later shader sees](/rendering/an-hdr-retrofit-layer-changes-what-shaders-see).

## Capture bit depth is a separate question from HDR

HDR10 describes **10-bit output**. It says nothing about what a screenshot
should be stored at. Capture at higher depth for post-processing latitude and
compress at delivery - the compression is a delivery decision, not a capture
decision. See [capture formats and what they clip](/rendering/capture-formats-and-what-they-clip).

## What was not verified

Most of the above was established once, on one display and one shader stack. The
mechanisms - log2 whitepoint, the three luminance numbers - are properties of the
tools and generalise. The specific claim that a switch invalidates *every*
calibration is one person's repeated experience across one stack, not a
controlled test.

## Related

- [Judging a visual change without fooling yourself](/rendering/judging-a-visual-change)
- [Sharpening recovers detail, it never invents it](/rendering/sharpening-recovers-detail-it-never-invents-it) - SDR tolerates far more sharpening than HDR
