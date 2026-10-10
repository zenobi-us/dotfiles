---
type: Engine Mechanic
title: Range is the control that fixes both a blown-out face and a lit backdrop, and it is the one nobody touches
description: A washed-out portrait was intensity 214 into a 2.2 m range - the falloff was so sharp the near field was being blasted. The same shot's backdrop was lit despite a 5-degree cone, because the range reached 25 m past the subject. Both symptoms are range, in opposite directions.
tags: [lighting, relighting, falloff, intensity, range, spot-angle, portrait]
status: stable
generated: { by: "claude", at: "2026-08-24T23:40:00-04:00" }
---

# Range does more work than intensity, in both directions

Two portrait problems that look unrelated are the same control set wrongly:

| symptom | reached for | actually |
|---|---|---|
| subject's face blown out, detail gone | turn the intensity down, change the colour | **range too short** - falloff too sharp, near field blasted |
| backdrop lit when it should be dark | narrow the cone further | **range too long** - the light carries far past the subject |

## The blown-out face

The measured case: intensity around **214** into a light range of about **2.2 m**.
The reading that fails is "214 is a big number, so the light is too bright."

The number is not the problem on its own. A point or spot light falls off with
distance, and a 2.2 m range packs the entire falloff curve into the space between
the light and the subject's face. Everything inside that radius is in the steepest
part of the curve, so the near side of the face receives an enormous value while
the far side receives almost nothing. That is not a bright light; that is a light
with **no gradual region at all**.

**The fix is counter-intuitive and it is the whole finding:**

> Lower the intensity **and increase the range**. A larger range spreads the same
> falloff over more distance, so the gradient across the subject becomes gradual
> instead of a cliff.

And the corollary, which is standard practice in real photography and gets
forgotten because a shader makes adding intensity free:

> **Several dim lights beat one bright one.** Three sources at modest intensity
> from different positions wrap a face. One source cranked up flattens and clips
> it, and no amount of tuning that one source fixes it.

Colour is not where this lives. A blown-out face is a **luminance** failure, and
adjusting hue or tint while the falloff is wrong changes the colour of the clipping
without removing it.

## The lit backdrop

Same shot, different symptom. Spot angles were already at **5-7 degrees** - very
tight - and the background was still lit. The instinct is to tighten further, and
it does nothing, because the beam was never the problem: the light's **range
extended roughly 25 m**, which is well past the subject and into the set.

A cone controls *where the light goes*. Range controls *how far*. A pencil-thin
beam that reaches 25 m still lands on whatever is 25 m away.

Three fixes, in order of how often they are the right one:

1. **Cut the range** so the light dies just past the subject. This is usually it.
2. **Barn-door with the cone** - rather than an extreme 5-degree beam, use an
   **inner angle of about 20-25 degrees with an outer of 35-40**. The soft edge
   between inner and outer is what shapes light in practice; a hard pencil beam
   gives a hotspot with a sharp rim, which reads as artificial.
3. **Move the subject forward**, away from the backdrop. Distance does for free
   what the other two do by adjustment, and it also lets the background fall off
   naturally.

## Why both wrong answers are believable

Intensity and cone angle are the two controls that are labelled in terms of the
symptom - "brightness" and "spread". Range is labelled in metres and reads as a
technical limit rather than a creative control, so it gets set once and never
revisited. It is, in fact, the control with the most authority over how a light
looks, because it determines the shape of the falloff curve the subject is standing
in.

## Related

- [A tool's axis labels may not be the conventional ones](/rendering/an-axis-label-is-not-a-3d-convention) - verify the mapping before acting on any of this
- [A fill light belongs near the camera axis](/rendering/a-fill-light-belongs-near-the-camera-axis)
- [Environmental light alone silhouettes a subject](/rendering/environmental-light-silhouettes-a-subject)

## Confidence and scope

Derived from one worked portrait - the intensity, range and angle figures are that
shot's, not thresholds. The mechanism (falloff distributed over range; cone controls
direction, range controls reach) is general to any point or spot light in any
renderer. Re-derive the numbers for your own scene rather than copying them.
