---
type: Interaction Pattern
title: Two shader packs by one author ship the same headers, and the copies differ
description: Why flattening ReShade shader packs into one folder produces compile errors that move around between launches, and the folder layout that makes include resolution deterministic.
tags: [reshade, shaders, includes, collisions, effectsearchpaths]
status: stable
tracks: ReShade and shader-pack releases, not Cyberpunk 2077 patches
generated: { by: "claude", at: "2026-08-24T21:40:00-04:00" }
---

# Two shader packs by one author ship the same headers, and the copies differ

The symptom is shader compile errors that look random and **move around between
launches**. The cause is not a corrupt install and not a ReShade version
problem.

Two packs by the same author frequently ship their own copies of the same shared
headers, and **the copies are not identical - including when the file dates
match**. One observed case: iMMERSE and METEOR each carry roughly fifteen
`mmx_*.fxh` files under a `MartysMods\` folder, and all of them differ between
the two packs.

## Why flattening them breaks

`EffectSearchPaths` is **recursive**. Flatten both packs into one shader folder
and an include like

```c
#include "MartysMods/mmx_global.fxh"
```

has two candidates, and which one wins is not something the preset controls. A
`.fx` from one pack compiles against the other pack's header, and the resulting
errors are about symbols and types rather than about files - which is why nobody
connects them to the folder layout.

The instability across launches is the tell. **A genuine shader bug is
deterministic; a collision is not.**

## The fix: each pack keeps its headers adjacent to its own .fx

ReShade resolves an include **relative to the including file first**. So any
layout where each pack's headers sit beside that pack's effects is correct, and
the search path never gets consulted for the shared names at all:

```
reshade-shaders\Shaders\iMMERSE\  + iMMERSE\MartysMods\
reshade-shaders\Shaders\METEOR\   + METEOR\MartysMods\
reshade-shaders\Shaders\<every other pack, one folder each>\
```

One folder per pack, headers inside it. That is the whole rule, and it costs
nothing on a single-pack install - which is the argument for doing it before
there is a second pack.

The same reasoning is why a paid "ultimate" edition and the free edition of one
pack must not both be installed: the ultimate edition is generally a *superset*,
so installing both is this collision with two copies of everything.

## Effect order is not free: find the pack's prepass

**A pack's shared prepass must sort first in the preset.** In iMMERSE-based
presets that is Launchpad, which MXAO, RTGI and SOLARIS all read from - so it has
to run before any of them.

Before assuming a preset's effect order can be rearranged freely, check whether
the installed pack has an equivalent shared-prepass effect. Getting it wrong
gives you effects that render from a buffer nothing has filled, which looks like
a broken effect rather than an ordering mistake.

## Not every DOF effect is depth-dependent

Depth-buffer troubleshooting is the standard first move for a broken effect, and
it does not apply to all of them - an accumulation-based depth of field is driven
by camera movement rather than by the depth buffer, so depth settings cannot
affect it either way. Point depth troubleshooting at the depth-dependent effects
instead:
[photo mode is a separate rendering context](/rendering/composing-in-the-gameplay-renderer)
carries which is which, and why "enabled" does not mean "applying".

## What was not verified

- The `mmx_*.fxh` divergence was observed between two specific packs at one point
  in time. Whether the packs still diverge, and by how much, moves with their
  release cycles.
- Nothing here is bound to a Cyberpunk 2077 patch.

## Related

- [The ReShade add-on build is identified by being UNSIGNED](/formats/reshade-addon-build)
