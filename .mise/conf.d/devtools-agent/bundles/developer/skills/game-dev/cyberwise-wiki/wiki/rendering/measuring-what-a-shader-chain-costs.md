---
type: Diagnostic Method
title: Measuring what an injected shader chain costs, without measuring something else
description: The honest measurement is three readings at one fixed spot - chain live, effects toggled off, injector not loaded - because uninstalling to measure removes the hook as well as the shaders. On a path-traced configuration the chain can cost more than half the frame rate, and a single effect can own most of that.
tags: [reshade, performance, framerate, measurement, path-tracing, dlss, method]
status: draft
generated: { by: "claude", at: "2026-08-25T11:20:00-04:00" }
---

# Measuring what an injected shader chain costs, without measuring something else

"Is my shader stack costing me anything?" gets answered by feel far more often
than by measurement, and the measurements people do take are usually of
something adjacent.

## Three readings, one spot

- **Chain live.** The configuration actually played.
- **Effects toggled off** with the injector's own toggle key. The shaders stop
  executing; the injector, its hook and any add-on stay loaded.
- **Injector not loaded at all** - its DLL renamed, the game restarted.

The gap between the first two is **the shaders**. The gap between the last two
is **the injector's fixed overhead**, which is not zero and is not something a
shader setting can recover.

Uninstalling in order to measure collapses those two gaps into one number and
attributes all of it to the shaders. Toggle first; uninstall only to measure the
hook.

Then repeat the toggle per effect. That is the reading that actually changes what
anybody does, because the distribution is not even.

## What one measured install looked like

At 4K with path tracing on a current high-end card, standing in one place:

| configuration | frame rate |
|---|---|
| full chain live | mid 20s to low 30s |
| effects toggled off, injector still loaded | ~mid 40s |
| one screen-space ambient-occlusion effect disabled, rest live | mid 30s |
| injector not loaded | mid to high 50s |

So the chain was costing **roughly half the frame rate**, one effect accounted
for about ten frames a second of it, and the injector alone - drawing nothing -
was worth another ten. None of that is guessable from the shader list.

The numbers are one machine, one scene, one shader set, and they do not transfer.
The shape does: measure per effect, expect one or two effects to dominate, and
expect the hook itself to cost something.

## Hold the rest still, and know which number you are reading

- **Stand still, at a fixed spot, at a fixed time of day and weather.** Walking
  changes what is on screen more than any shader does. A dense street corner and
  an empty interior are two different tests, and a chain that is affordable in
  one is not in the other.
- **A frame-generation multiplier changes the displayed rate without changing
  the rendered one.** Compare base render rate, or turn generation off for the
  measurement -
  [frame generation is display smoothness, never input latency](/rendering/frame-generation-is-smoothness-not-latency).
- **An upscaler's quality mode changes the internal resolution**, which changes
  what every screen-space effect is sampling. Fix the mode across all three
  readings or the comparison means nothing.
- **A counter reporting presented frames is not reporting the renderer's cost.**
  Know which one the overlay in use is showing before quoting it.

## Why per-effect matters more than the total

A total tells you whether to keep the stack. A per-effect breakdown tells you
which one to drop, and the answer is regularly an effect that
[the renderer already makes redundant](/rendering/ordering-the-effect-chain) -
screen-space ambient occlusion and screen-space global illumination on a
path-traced configuration being the standing example. Dropping those is free in
image terms and expensive in frame terms, which is the best trade available.

## What was not verified

Single install, single scene, one set of shaders, on one game version. Measured
by reading a frame counter across configurations rather than by frame-time
capture, so the figures are approximate ranges rather than percentiles - which is
enough to rank effects and not enough to publish.

## Related

- [Ordering the effect chain](/rendering/ordering-the-effect-chain) - what a path-traced render makes redundant
- [Judging a visual change](/rendering/judging-a-visual-change) - the same fixed-scene discipline, for the picture rather than the cost
- [ReShade sees the frame after the game has finished with it](/rendering/stage-order-decides-where-a-fix-belongs)
