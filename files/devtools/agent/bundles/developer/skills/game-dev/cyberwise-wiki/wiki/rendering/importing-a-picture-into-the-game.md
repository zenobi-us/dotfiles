---
type: Engine Mechanic
title: The game's own picture importer decodes wrongly rather than refusing, so a bad file looks like a bad image
description: An HDR-pipeline PNG dropped into the in-game photo gallery renders as magenta corruption; converting it to 8-bit sRGB replaces that with rainbow banding. Both are the same fault - a decoder that predates HDR and assumes one format - and the fix is a different container, not a different picture.
tags: [smartframes, gallery, png, jpeg, srgb, hdr, capture, wrong-theory]
status: draft
generated: { by: "claude", at: "2026-08-25T11:20:00-04:00" }
---

# The game's own picture importer decodes wrongly rather than refusing, so a bad file looks like a bad image

The game reads player-supplied images out of a fixed folder under the user's
Pictures directory and displays them in the frames in V's apartments. It is the
one place a virtual photographer's own output comes back into the game, and it
is where a finished shot most often falls apart.

## The two failures are the same fault

**A file straight out of an HDR capture pipeline** - PQ or scRGB, 10- or 16-bit,
an embedded colour profile - imports as **magenta and cyan corruption**. Not an
error, not a refusal: a picture, decoded wrongly.

**The same file converted to 8-bit sRGB with metadata stripped** imports as
**vertical rainbow banding**. Also not an error. A different wrong decode.

That second result is what makes this expensive, because it looks like progress
and it looks like a *content* problem - resolution, aspect, interlacing - rather
than a decoding one. It is not. The importer's PNG path predates HDR and assumes
plain 8-bit sRGB, and it does not check.

## The fix is the container

Export **JPEG**, with an sRGB conversion applied, and change nothing else. The
same picture that came in as banding comes in correctly.

The recipe that works end to end, from an HDR capture:

1. Convert to profile sRGB **while still 16-bit** - a real conversion, which does
   the colour maths, not an assignment, which only relabels.
2. Grade, if grading.
3. Drop to 8 bits per channel.
4. Export JPEG with the sRGB conversion checked.

A bonus finding from getting there: the grade that had looked right in-game was
visibly over-pushed once the container was fixed. Aggressive settings had been
compensating for a decoding bug, not for the image.

## Wrong theories worth keeping

Each of these was tried, and each is where somebody else will also go:

- a resolution ceiling
- portrait versus landscape aspect
- interlacing, and the export dialog's own 8-bit option
- **a rendering-path split**, on the strength of the gallery thumbnail looking
  fine while the full-size frame did not

That last one had a whole theory built on it and was killed by one sentence from
the person looking at the screen: the thumbnail carries the same banding, and at
thumbnail scale it is nearly invisible. **Judge the import at full size, in the
frame.** A picker preview is not a render.

## Two practical points about the frames themselves

- The frames come in **several fixed aspect ratios**, and a vertical frame wants
  a vertical image. Different apartments use different ones.
- **Import uncropped.** The frame pans and zooms, so pre-cropping to a guessed
  ratio throws away canvas the game wanted, and cannot be undone from inside the
  frame.

## The general form

An importer that fails by *decoding* rather than by refusing produces artefacts
that read as content problems. The diagnostic move is not to keep adjusting the
image: **if two different colour conversions produce two different corruptions,
the variable to change is the container.**

## What was not verified

One game version. The failing and working paths were both confirmed by the person
importing; the list of accepted aspect ratios came from community documentation
rather than from the game's own files, and is the part to re-check.

## Related

- [The capture path can silently ruin a finished shot](/rendering/capture-formats-and-what-they-clip) - the same class of fault on the way out
- [HDR screenshot metadata is a negotiated compromise, and SDR is the honest delivery format](/rendering/hdr-delivery-is-a-negotiation)
- [Judging a visual change](/rendering/judging-a-visual-change)
