---
type: Environment
title: The display is the last stage, and its "enhancement" features fight the game's art direction
description: Black-equalizer controls lift shadows by gamma and destroy the neon-against-inky-black contrast the game is built on, contrast enhancers are dynamic range compression, dynamic tone mapping re-decides the curve per scene - and the OSD's own wording is frequently wrong about which way a slider goes.
tags: [display, monitor, tone-mapping, gamma, osd, calibration]
status: draft
generated: { by: "claude", at: "2026-08-24T22:10:00-04:00" }
---

# The display is the last stage, and its "enhancement" features fight the game's art direction

Everything tuned in engine and in ReShade is then handed to a panel that has its
own opinions. That panel is the **last** stage in the chain
([stage order decides where a fix belongs](/rendering/stage-order-decides-where-a-fix-belongs)),
and nothing downstream can undo what it does.

Three families of monitor feature are actively harmful to this game specifically.

## Black equalizers lift shadows with gamma

Black-equalizer-style controls - sold for spotting opponents in dark corners -
**lift shadows by raising gamma**. In a game whose entire look is neon against
inky shadow, that destroys the contrast the art direction is built on. The image
does not get "clearer"; it gets flat, and every shadow the lighting artists put
in becomes grey.

## Contrast "enhancers" are dynamic range compression

Whatever the marketing name, a contrast enhancer is **compressing dynamic range**
- pulling the extremes toward the middle so more of the signal survives on a
limited panel. That is the opposite of what an HDR grade is trying to achieve,
and it is applied after every decision you made.

## Prefer static HDR tone mapping over active or dynamic

Active or dynamic tone mapping **re-decides the curve per scene**. The practical
consequence is that **identical lighting renders differently depending on what
else is in frame** - pan the camera, and the wall you were judging changes.

That makes every comparison unreliable, which makes calibration impossible: you
cannot tune against a target that moves in response to your own framing. Static
tone mapping is the one that lets a test scene mean something.

## Trust the screen, not the menu text

**OSD wording is frequently wrong about which direction a slider goes.** Labels
are inconsistent between firmware revisions, translated loosely, and sometimes
simply inverted relative to what the control does.

> Change the setting, look at the screen, and believe the screen. A menu label is
> a lead, never evidence - the same rule that applies to a mod's own labels
> applies to a monitor's.

## What was not verified

This is one display's behaviour over one calibration effort. The mechanisms -
gamma lift, range compression, per-scene curve selection - are what those feature
categories do generally; the observation that a particular OSD's wording was
wrong is a single case, and the reason it is written down as a *habit* rather
than as a fact about any product.

## Related

- [ReShade sees the frame after the game has finished with it](/rendering/stage-order-decides-where-a-fix-belongs)
- [HDR and SDR are two different calibrations](/rendering/hdr-and-sdr-are-two-different-calibrations) - including which luminance number the game actually wants
- [A third-party program's menus cannot be recalled](/process/a-third-party-ui-cannot-be-recalled) - the same lesson one layer out: a panel's own menu text is not a source either
