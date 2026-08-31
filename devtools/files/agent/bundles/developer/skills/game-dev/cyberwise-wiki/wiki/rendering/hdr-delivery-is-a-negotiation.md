---
type: File Format
title: HDR screenshot metadata is a negotiated compromise, and SDR is the honest delivery format
description: MaxCLL computed strictly to spec lets one hot pixel dim an entire image, tools substitute a percentile instead, and every consumer re-tone-maps anyway - so an HDR workflow still owes a tonemap at delivery.
tags: [hdr, metadata, maxcll, tonemapping, delivery, sdr]
status: stable
generated: { by: "claude", at: "2026-08-24T22:10:00-04:00" }
---

# HDR screenshot metadata is a negotiated compromise, and SDR is the honest delivery format

The metadata attached to an HDR capture looks like a measurement. It is not.

**MaxCLL computed strictly to spec takes the single brightest pixel in the
frame.** One hot specular highlight - a headlight, a reflection off chrome - can
therefore declare a 4000-nit peak for an otherwise ordinary image, and every
downstream tone mapper reading that number dims the *whole picture* to make room
for a peak that occupies four pixels.

Because that is a bad outcome, **tools commonly use the 99.99th percentile
instead**. That is a sensible choice and it is also a departure from the spec, so
two tools can compute different MaxCLL for the same frame and both be defensible.

> **The number in an HDR file is a negotiated compromise, not a fact about the
> image.** Treat a mismatch between two tools as a difference of policy before
> treating it as a bug.

## Every consumer applies its own tone mapping anyway

Different viewers, browsers, phones and social platforms each apply their own
tone mapping to that metadata. So a "perfect" HDR capture **still renders
differently everywhere**, and there is no version of the file that fixes this,
because the decision is being made downstream on hardware you cannot see.

## Which is why SDR is the honest format

Every downstream context - a chat client, a forum, someone's phone, a browser on
an uncalibrated panel - is SDR. An HDR workflow does not avoid the tonemap; it
just **hands the editorial decision to unknown software** instead of making it
deliberately.

Capturing the post-tonemap SDR frame makes that decision yourself. The cost is
real and specific: **8-bit headroom**.

| work | 8-bit SDR capture |
|---|---|
| gentle grading, small exposure nudges, colour balance | fine |
| aggressive shadow lift or highlight recovery | risky - banding shows |

That is the whole trade. Not "SDR is worse", but "you have one stop of latitude
instead of several, and you know exactly what everyone will see".

Windows Game Bar hands you both files at once, so the choice does not have to be
made at capture time - see
[capture formats and what they clip](/rendering/capture-formats-and-what-they-clip).

## Related

- [Capture formats and what they clip](/rendering/capture-formats-and-what-they-clip)
- [One grain pass, and one grain model](/rendering/one-grain-pass-and-one-grain-model) - grain is also a dither, which partly disguises 8-bit banding
