---
type: Engine Mechanic
title: Bloom has no toggle in the game's options, and is disabled by a developer feature toggle
description: Bloom is baked into the pipeline with no UI switch; it is turned off with a user.ini in the engine config folder declaring [Developer/FeatureToggles] Bloom = false, and the checklist for when such a toggle appears to do nothing.
tags: [rendering, bloom, user-ini, feature-toggles, engine-config]
status: stable
generated: { by: "claude", at: "2026-08-24T22:10:00-04:00" }
---

# Bloom has no toggle in the game's options, and is disabled by a developer feature toggle

Every other element of the game's own post-processing - lens flare, chromatic
aberration, depth of field, vignette, motion blur - has a control in the
graphics menu. **Bloom does not.** Searching the options for it is not a
misreading of the menu; the switch is not there.

It is disabled one level down, at config:

```ini
; <GameRoot>\engine\config\platform\pc\user.ini
[Developer/FeatureToggles]
Bloom = false
```

Two things follow from the section name. It is a **developer feature-toggle**
namespace, so other engine flags live in the same place under the same header -
this is a general lever, not a bloom-specific hack. And it is developer-facing,
so nothing in the game's UI will ever reflect what is set there.

## The config folder is shared, and read whole

`engine\config\platform\pc\` is not a single-file location. On a modded install
it commonly holds several `.ini` files side by side - mods ship engine config
this way as well - and the engine reads what is there rather than one privileged
filename. Verified on a patch 2.31 install carrying nine such files.

**What is not verified here** is the precedence rule when two files in that
folder declare the same key under the same section. If a toggle behaves as
though something else is setting it, list the folder before assuming the file
you edited is the only one that mentions it.

## When a user.ini toggle appears to do nothing

This fails silently and the causes are dull, so check them in this order before
concluding the toggle does not exist or does not work:

1. **The path is exactly right.** `engine\config\platform\pc\`, under the game
   root - which is wherever this install put it, not a default location.
2. **The file is not `user.ini.txt`.** With extensions hidden this is invisible
   in Explorer, and it is the single most common cause.
3. **The section header is exact**, `[Developer/FeatureToggles]`, with no stray
   whitespace and no typo in the slash.
4. **The game was fully closed and relaunched**, not resumed from a save. Engine
   config is read at startup.
5. **No mod manager deploy step is cleaning or overwriting the config folder.**
   A file written into a deployed tree can be reverted by the next deploy or
   purge; on a manager-based install, write it where the manager expects it.

Only after all five is "the toggle did nothing" a finding rather than a mistake.

## Related

- [ReShade sees the frame after the game has finished with it](/rendering/stage-order-decides-where-a-fix-belongs) - why turning bloom off in engine beats cancelling it in a shader
- [Telling bloom from what is not bloom](/rendering/telling-bloom-from-what-is-not-bloom) - the glow you are trying to remove is frequently not bloom at all
