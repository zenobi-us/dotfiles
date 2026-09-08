---
type: Engine Mechanic
title: A fill light pushed off-axis stops being a fill and becomes a second key
description: At 60 degrees off the camera-subject axis a fill casts its own shadows in a competing direction, and the shot reads as two keys fighting. Correct is 20-30 degrees off-axis, at or slightly below key height, at 40-50% of key intensity.
tags: [lighting, relighting, fill, key-light, shadows, portrait]
status: stable
generated: { by: "claude", at: "2026-08-24T23:44:00-04:00" }
---

# A fill light pushed off-axis stops being a fill

A fill light exists to **open up the shadows the key made**. It does that by
sitting close to the line between the camera and the subject, so that whatever it
illuminates is already facing the camera, and it casts almost nothing the camera
can see.

Move it far off that line and it stops doing that job and starts doing the key's
job badly.

## The failure

A fill pushed to roughly **60 degrees** off the camera-subject axis produced:

- **competing shadow directions** - the key's shadows going one way, the fill's
  going another
- **cross-shadows** where the two overlap, which is a shape that occurs in no
  natural lighting and reads immediately as wrong even to someone who cannot say
  why

The shot did not look under-lit or over-lit. It looked *staged*, and the usual
response is to adjust intensity, which cannot fix a geometry problem.

## The working numbers

| property | value |
|---|---|
| angle | **20-30 degrees** off the camera-subject axis |
| height | at key height, or **slightly below** |
| intensity | **40-50% of the key** |

Slightly below key height matters more than it sounds: a fill placed under the key
lifts the underside of the jaw and eye sockets, which is precisely where a single
key leaves a face looking hollow.

Above 50% of key intensity the ratio collapses and the face flattens, because the
whole point of a key/fill relationship is that one of them is dominant.

## Overhead is a rim light, not a key

The related placement error: putting the dominant light **directly overhead**.

- **As a key it is bad.** Top-down light drops the eyes into shadow, throws the
  nose down the face, and hollows the cheeks. It is the horror-film position for a
  reason.
- **As a rim it is good.** Behind and above the subject, it separates hair and
  shoulders from the background and does not need to be bright to work.

So an overhead light is not a light to remove; it is a light in the wrong **role**.
Move the key down and forward and let the overhead source become the rim.

## Why the wrong version is believable

A shader that lets you place lights anywhere makes distance and angle feel like
free parameters, and "more angle means more modelling" is a reasonable-sounding
generalisation - it is even true for the *key*. It is exactly wrong for the fill,
whose value comes from being nearly shadowless. The rule that resolves it: a light
is defined by its **job**, and the job is expressed as an angle relative to the
camera, not as a position in the room.

## Related

- [Range does more work than intensity](/rendering/light-range-does-more-than-intensity) - the other half of a portrait that will not come right
- [A tool's axis labels may not be the conventional ones](/rendering/an-axis-label-is-not-a-3d-convention) - "20-30 degrees off-axis" is worthless until you know which coordinate moves the light sideways
- [Environmental light alone silhouettes a subject](/rendering/environmental-light-silhouettes-a-subject)

## Confidence and scope

Photographic practice, confirmed against one worked shot in game. The angle and
ratio figures are conventional starting points rather than measurements, and a
stylised look may deliberately break every one of them - the value here is knowing
that it is being broken.
