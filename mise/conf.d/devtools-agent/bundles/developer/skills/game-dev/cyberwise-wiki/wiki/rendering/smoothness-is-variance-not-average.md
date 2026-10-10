---
type: Diagnostic Method
title: A framerate average does not predict how the game feels, and the two worst failures never move it
description: "Slow" and "jerky" are different faults whose fixes point in opposite directions, generation artifacting and a streaming hitch are both invisible on any counter, and the expensive no-mods baseline answers a question nobody asked. Plus the variable-refresh configuration with a switch that is off by default.
tags: [performance, frame-time, frame-generation, vrr, gsync, vsync, path-tracing, triage]
status: draft
generated: { by: "claude", at: "2026-08-25T13:05:00-04:00" }
---

# A framerate average does not predict how the game feels, and the two worst failures never move it

Somebody says the game does not feel right. The reflex is to read them an average
and to reach for the biggest, most expensive experiment available. Both are
mistakes, and the second one costs an evening.

## First, get one word out of them: slow, or jerky?

They are different faults, they feel different, and **their fixes point in
opposite directions**.

| the word | what it is | where to look |
|---|---|---|
| **slow** - input lag, mushy aim, the camera lags the mouse | a **latency** problem | raise the *rendered* rate; frame generation makes this one worse |
| **jerky** - fine, then a lurch | a **frame-time** problem | streaming and CPU, not GPU load |

Asking which word fits costs one question and splits the search in half. Nothing
in a frame counter distinguishes them.

## Variance is the stat that predicts feel

**A 90 fps average with 30 ms spikes feels worse than a locked 60.** The eye
notices the discontinuity, not the mean, and an average is specifically the
statistic that hides one.

Two feel-failures that **never move the average at all**:

- **Generation artifacting when the base rate falls too low.** Below roughly 40
  rendered frames a second the interpolation has too little to work from: edges
  shimmer and the HUD smears. The counter goes *up* while the image gets worse.
- **Traversal hitches** - one or two frames of stall while a sector streams in.
  Over a minute of samples this is a rounding error in the mean and the only
  thing the player actually remembers.

So the instrument for "is it better now" is the person playing, and the number is
there to rule things in and out, not to settle it. That is doubly true once
generation is on, because
[the displayed number has been deliberately decoupled from the feel](/rendering/frame-generation-is-smoothness-not-latency).

## The no-mods baseline is the expensive experiment, and it answers the wrong question

A vanilla comparison costs a purge, a redeploy, a script-cache rebuild and tens
of gigabytes of links torn down and rebuilt - and it tests a configuration the
person never plays. It answers *"is it the mods"* when the useful question is
*"which layer"*.

Cheaper experiments, ascending, each a couple of minutes:

1. **The injected shader chain off** - one keypress. A full-screen shader pass at
   4K is the single biggest toggle available; see
   [measuring what a shader chain costs](/rendering/measuring-what-a-shader-chain-costs).
2. **Generation multiplier down a step, then off** - judged by feel, which also
   reveals whether the smoothness was real or synthetic.
3. **Screen-space reflections off**, with path tracing on.
4. **Only then** park the heaviest archive overriders.

Carry the asymmetry from bisection while doing it: a clean run proves the cause
is inside what you disabled; a still-bad run proves nothing at all -
[a failing round narrows nothing](/diagnosis/a-failing-round-narrows-nothing).

## Where the frames go once path tracing is on

- **Screen-space reflections at the top tier are largely redundant under path
  tracing and still cost**, because the path tracer is already computing
  reflections. Raster shadow settings matter far less for the same reason.
- **Crowd density is one of the few settings that lands on the CPU** rather than
  the GPU, which makes it the first suspect for traversal hitching on a heavily
  scripted install.

**The redundancy claim is worth testing rather than asserting.** It was stated
here as proven and challenged on good grounds: the game ships a separate *Off*
switch for screen-space reflections, which is not what you would expect if path
tracing subsumed them entirely. Set it off, look at puddles, glass and metal in
one scene, and decide from that.

## The variable-refresh configuration, including the switch that is off by default

For a variable-refresh panel with frame generation, the combination the hardware
vendors design for is **VRR + driver-level V-Sync + a latency-reduction mode**:

- **Driver control panel, per-program profile: vertical sync ON** - plain on, not
  fast, not adaptive.
- **In-game V-Sync OFF.**
- **Reflex/latency reduction ENABLED**, which caps the rate just under the
  panel's ceiling by itself.

Inside the variable-refresh window the panel is already matching its refresh to
the frame rate, so V-Sync never holds a frame back and adds effectively no
latency; what it stops is tearing at the edges of that window.

**Then check the one that is silently off.** The driver's VRR setup page has an
*enable for windowed and full screen mode* option, and on some displays it
defaults to full-screen only. A player in borderless windowed - which is most
people on a modded install - then has **no variable refresh at all**, and every
smoothness setting downstream is being tuned against a fixed-refresh panel.

Without frame generation, **cap slightly under the panel's refresh**. With no cap
you slam the ceiling and leave the variable-refresh window entirely.

## What was not verified

The thresholds here are one configuration's - one panel, one driver, one high-end
GPU at 4K - and the sub-40 artifacting figure is a rule of thumb from watching
it, not a measured boundary. The slow-versus-jerky split, the variance point and
the experiment ladder are the parts meant to travel.

## Related

- [Frame generation is display smoothness, never input latency](/rendering/frame-generation-is-smoothness-not-latency)
- [Measuring what an injected shader chain costs](/rendering/measuring-what-a-shader-chain-costs)
- [The display is the last stage](/rendering/the-display-is-the-last-stage) - the panel's own processing, which is downstream of all of this
- [Ordering the effect chain](/rendering/ordering-the-effect-chain) - what path tracing makes redundant in the shader chain, as opposed to in the game's own settings
