---
type: Engine Mechanic
title: A light-placement tool's X, Y and Z may not mean what 3D convention says - verify before giving any coordinate advice
description: In one widely used character-lighting shader the light is created pointing at the camera, so Y is side-to-side, X is near-to-far and Z is up-down. An entire session of placement advice was built on the conventional mapping and was wrong in every instruction.
tags: [lighting, relighting, shaders, coordinates, axes, photography, method]
status: stable
generated: { by: "claude", at: "2026-08-24T23:36:00-04:00" }
---

# A light-placement tool's axes may not be the conventional ones

This is the single most expensive assumption in this area, so it goes first and
plainly:

> **Before giving anybody a coordinate, move a light one axis at a time and watch
> what happens. Do not derive the mapping from 3D convention, from the parameter
> order, or from the axis letters.**

## The finding

In one widely used character-lighting shader for this game - the kind that adds
unoccluded fill lights for portrait work - a new light is created **pointing at the
camera**. The coordinate frame is built around that, and the result is:

| axis | what it moves |
|---|---|
| **Y** | side to side |
| **X** | near to far (toward and away from the camera) |
| **Z** | up and down |

Two of the three are swapped relative to what almost every 3D application, every
tutorial and every piece of engine documentation would lead you to expect.

## What it cost

An entire prior session of placement advice was built on standard-axis
assumptions - key light "up and to the left", fill "pushed back", rim "raised" -
and **every instruction in it was wrong**, because each one named an axis that did
something else. The advice was internally consistent, confidently phrased, and
produced results that made no sense to the person following it. Nothing about the
output looked like a coordinate-system error; it looked like bad lighting advice,
which is much harder to diagnose.

That is the reason this is stated as a warning about **assuming conventions** and
not as a fact about one tool. The specific mapping above will drift as tools
change. The failure mode will not.

## The verification, which takes under a minute

1. Place one light where you can see its effect on the subject.
2. Change **one** coordinate by a large, unmistakable amount.
3. Watch which way the light moved.
4. Repeat for the other two.

Write the mapping down before you write anything else, and if you cannot run the
test yourself, **ask the person at the machine to run it** rather than assuming.
"Which way does the light go when you increase X" is a cheap question; a session of
inverted advice is not.

## While you are doing that: the light meshes are in the shot

These shaders draw a visible marker or mesh at each light's position, and **that
mesh renders into the captured frame**. It is not a viewport-only gizmo.

Which is fine, and in fact necessary - you want them visible for exactly the
placement-and-watch loop above. The rule is just that **hiding them is a step in
the capture, not a preference**: place and tune with the meshes on, turn them off,
then take the real shot. A finished portrait with a glowing sphere floating beside
the subject's ear is this step being forgotten.

## Related

- [Photo mode is a separate rendering context](/rendering/composing-in-the-gameplay-renderer) - which class of relighting shader replaces the game's lighting and which only adds to it
- [Light range does more work than intensity](/rendering/light-range-does-more-than-intensity) - the control that actually fixes a blown-out face
- [A fill light belongs near the camera axis](/rendering/a-fill-light-belongs-near-the-camera-axis)

## Confidence and scope

The axis mapping was confirmed by a player working in the tool, against the
symptom - it is not read out of the shader's source. It applies to one shader on
the version in use at the time, and it is the *habit* of verifying, not the table,
that should be carried to the next tool.
