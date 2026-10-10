---
type: Process
title: The deployment manifest says who ships what - filenames and dates do not
description: Four similarly named archives looked like three generations of one asset pack; the mod manager's own manifest showed three belonged to a single mod and the fourth to something else entirely, and the collision scan showed the "superseded" one carried 145 unique files.
tags: [method, vortex, load-order, ownership, false-lead]
status: stable
generated: { by: "claude", at: "2026-08-26T13:40:00-04:00" }
---

# The deployment manifest says who ships what - filenames and dates do not

An install carried four archives with obviously related names, dated 2021, 2024,
2024 and 2025. The reading almost writes itself: three generations of one asset
pack, and the 2021 file is a superseded duplicate whose presence should be
questioned.

Every part of that was wrong, and both correcting facts were one command away.

## Who ships it: ask the manager, not the filename

Vortex writes `vortex.deployment.json` into the game root, mapping every
deployed file to the mod that produced it:

```python
d = json.load(open(r"<game>\vortex.deployment.json"))
for f in d["files"]:
    if "proximas" in f["relPath"].lower():
        print(f["source"], f["relPath"])
```

The answer was that **three of the four archives belong to one mod** - a
dependency shipping three archives together - and the fourth belongs to an
unrelated venue mod. Not generations. Siblings.

That also corrected an existing wiki article, which had listed one of the three
under the venue mod because they deploy together and the association looked
obvious.

**Why this matters beyond tidiness:** file ownership decides who gets blamed for
a conflict. Two of these archives share 881 resources. Attributing one to the
wrong mod sends the entire investigation at an innocent party.

## What it supersedes: ask the collision scan

The second assumption was that a `v4` filename supersedes a plainer one. The
conflict scan settles it by resource, not by name:

| archive | files | contested | uniquely its own |
|---|---|---|---|
| the 2021 one | 149 | loses **4** to v4 | **145** |
| `..._v4` | 463 | loses nothing | 463 |

The "superseded duplicate" carries **145 files nothing else provides**. Removing
it as redundant would have deleted content, on the strength of a version number
in a filename.

## A class list is not searchable by appearance

The same failure in a different register, from the same day.

A rooftop satellite dish offered no way to jack in. The game's compiled bundle
declares 136 device controller classes, so the list was pulled and searched for
`dish`, `antenna`, `satellite`, `relay`. Nothing matched, and the conclusion
drawn was **"the dish is scenery, not a device"** - which was wrong, and which
would have closed off the entire feature.

Asking the running game produced:

```
class        BasicDistractionDevice
displayName  Gameplay-Devices-DisplayNames-PlateAntenna
ps class     BasicDistractionDeviceControllerPS
```

**`BasicDistractionDeviceControllerPS` was in the list the whole time.** The
class is named for what the device DOES - create a distraction - not for what it
looks like. No amount of searching by appearance would ever have found it.

An absent keyword is not an absent thing. When a list search comes back empty and
the conclusion would be "this does not exist", ask the running game instead:
CET's `GetLookAtObject` plus `GetDevicePS()` names the class of whatever is under
the crosshair in one line, and it cannot be fooled by vocabulary.

## The rule

Filenames and timestamps are **labels applied by humans**, often years apart,
often by different people, and they are not statements about ownership or
precedence. Two commands answer both questions properly:

- **Who ships this file?** The mod manager's deployment manifest.
- **What does it actually win or lose?** The collision scan, by resource hash.

Both were available and neither was consulted before the first write-up. The
tell that you are guessing is reasoning that leans on a filename - `v4`, `_old`,
`final`, a date stamp - to conclude something about behaviour.
