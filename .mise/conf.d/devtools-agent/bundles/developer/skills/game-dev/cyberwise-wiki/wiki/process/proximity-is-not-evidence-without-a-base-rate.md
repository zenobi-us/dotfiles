---
type: Process
title: Proximity is not evidence until you know how dense the thing is
description: A crash near a mod's placed object looks like a lead until you count the placements; one mod put 313 markers on the map, which made "within 40 m of one" the ordinary case rather than a finding.
tags: [method, crashes, correlation, statistics, false-lead]
status: stable
generated: { by: "claude", at: "2026-08-26T13:35:00-04:00" }
---

# Proximity is not evidence until you know how dense the thing is

A crash happened. A mod places an object two metres from where it happened.
Nothing else on the install places anything within forty metres. That reads as a
strong lead, and it was written up as one.

Then somebody counted the objects. **The mod places 313 of them.**

## The number that turns a lead into noise

Measured against sixteen crashes on one install, distance from each crash to the
nearest of that mod's markers:

| nearest marker | crashes |
|---|---|
| 2.5 m | 1 |
| 11.3 m | 1 |
| 32-34 m | 2 |
| 54-90 m | 5 |
| 129-175 m | 7 |

**Median: about 71 m.** So "within 40 m of a marker" describes a quarter of all
crashes, and a crash 32 m from one is entirely ordinary. A later crash at 32.4 m
was briefly written up as a second supporting location; it supported nothing.

What survives the correction is much narrower: **2.5 m and 11.3 m are genuine
outliers** against a 71 m median, and those two were also three minutes apart at
one spot. That is still worth testing. The rest was density.

## The question that was asked, and the question that mattered

The original analysis asked:

> What else is near this crash?

and found nothing within 40 m, which felt conclusive. It never asked:

> **How near is one of these markers to ANY point a player stands?**

Those are different questions and only the second one can distinguish a finding
from an artefact of how many objects a mod scatters.

## The general form

Before treating "X is near Y" as evidence:

1. **Count the X's.** One is a coincidence worth chasing. Three hundred is a
   background field.
2. **Compute the distance for every case you have**, not just the interesting
   one. A median is enough; the outlier is only an outlier against a
   distribution.
3. **Ask whether X and Y cluster for an unrelated shared reason.** Markers go
   where players go, and so do crashes. Both being common in walkable, dense,
   interesting places produces correlation with no causal link at all.

The same trap applies to any density: quest markers, spawn points, AMM
locations, street-name registries. One registry on a measured install placed
thousands of coordinates blanketing the entire map - being within 15 m of one of
those means nothing whatsoever.

## Why this is worth a whole article

The failure is not that a wrong answer was reached. It is that the wrong answer
**looked rigorous**: real coordinates, a real distance, a real exhaustive search
of other mods. Everything about it was checkable except the assumption nobody
stated, which was that the mod placed a handful of things.
