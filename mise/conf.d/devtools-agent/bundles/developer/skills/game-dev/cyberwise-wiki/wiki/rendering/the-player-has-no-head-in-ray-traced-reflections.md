---
type: Engine Mechanic
title: A headless body in a ray-traced reflection is a vanilla engine limitation, not a broken mod
description: The game is first-person and disables the player's head mesh entirely, so a mod that re-enables the player in ray-traced reflections renders a body with nothing above the neck - and forcing the head back breaks the camera. CDPR removed the player from RT reflections for exactly this reason.
tags: [ray-tracing, reflections, first-person, player-mesh, mirrors, mods]
status: stable
generated: { by: "claude", at: "2026-08-24T23:52:00-04:00" }
---

# A headless body in a ray-traced reflection is the engine, not the mod

The symptom: with a mod that restores the player character to ray-traced
reflections, V appears in reflective surfaces **with no head**.

This is not the mod failing. It is the mod succeeding, and revealing what the base
game had been hiding.

## The chain

1. **Cyberpunk 2077 is first-person.** The camera lives where the head would be.
2. So the game **disables the player's head mesh entirely** - it is not hidden from
   the camera, it is not there. There is no geometry above the neck to render.
3. **Ray-traced reflections trace real geometry.** They reflect what exists.
4. A mod that re-enables the player in RT reflections therefore reflects the body
   that exists, which has no head.

Every step follows from the one before it, and none of them involves a mod being
wrong.

## Why forcing the head back is not the fix

The obvious repair - re-enable the head mesh so there is something to reflect - runs
straight into the reason it was disabled. The camera occupies that space. Restoring
the mesh puts geometry inside or in front of the camera, and the result is a broken
first-person view: clipping, occlusion, the inside of a skull.

That trade is why **the base game removed the player from ray-traced reflections in
the first place**. Faced with a headless reflection or a broken camera, CDPR chose
to reflect nothing. The mod trades back the other way, and the headlessness is the
price it is paying knowingly.

## What this means when someone reports it

- **Do not bisect for a conflicting mod.** There is no other mod involved; the
  behaviour reproduces with the reflection mod alone.
- **Do not treat it as an appearance or mesh bug.** It is not in the same family as
  the [visual mismatches that are not conflicts](/conflicts/visual-bugs-that-are-not-conflicts),
  because nothing is overriding anything - the geometry was never authored to be
  seen.
- **The honest answer is a choice, not a fix**: accept the headless reflection, or
  remove the mod and accept no reflection. Anything that promises both is promising
  to solve a problem the developers chose not to solve.

The general shape is worth carrying: **a mod that re-enables something the base game
disabled will surface whatever the base game was avoiding.** The disabled state is
usually load-bearing, and the artefact that appears when it is lifted is evidence
about *why*, not evidence of a bug.

## Related

- [Photo mode is a separate rendering context](/rendering/composing-in-the-gameplay-renderer) - reflections behave differently again once the rendering context changes
- [Telling bloom from what is not bloom](/rendering/telling-bloom-from-what-is-not-bloom) - reflections get misreported as other effects routinely

## Confidence and scope

The chain above is read off observed behaviour rather than from engine source. It is
structural to a first-person camera and has held across patches; a future third-person
mode, official or modded, would change the premise entirely.
