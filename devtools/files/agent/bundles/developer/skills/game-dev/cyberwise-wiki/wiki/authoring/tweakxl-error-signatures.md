---
type: Engine Mechanic
title: Two TweakXL errors that are not "unknown record", and what each one is telling you
description: "Ambiguous definition" means the record does not exist and nothing in the file says what kind it should be - usually a typo in the ID. "Cannot clone X" means X is an abstract engine class rather than a record, so there is nothing to clone. Both leave a feature silently switched off, and one of them cannot be resolved from files at all.
tags: [tweakxl, tweakdb, yaml, prereqs, errors, authoring, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-25T11:20:00-04:00" }
---

# Two TweakXL errors that are not "unknown record", and what each one is telling you

Most TweakXL failures are silent. The two below are not - they are in the log,
they name the reason the record could not be built, and the fix follows directly
from which one it is. Both leave the mod loaded and a feature quietly not
working.

## `Ambiguous definition` - the ID does not exist and nothing says what it should be

Declaring an ID that does not already exist is legal, **if** the file says what
kind of record to make: a `$type`, or a `$base` to inherit from. With neither,
TweakXL is being asked to create something of unknown type, and refuses.

In practice this is a **typo in the ID**, and the most common typo is a doubled
prefix:

```yaml
Vehicle.Vehicle.transport__<name>:      # doubled - no such record
Vehicle.v_utility4_<name>:              # correct
```

`Vehicle.Vehicle.x` is not an existing record, so there is nothing to modify and
nothing to infer a type from. Three consecutive lines carried the doubled form in
one real file.

**The visible effect was in the world, not in the log**: the vehicle those lines
were meant to modify never received its driving package, so buses drove with
default car behaviour. Nothing in game says anything.

When this error names an ID, compare it character by character against
[the real list the game writes](/authoring/finding-the-real-record-id) rather
than reading it for plausibility. A doubled namespace reads perfectly.

## `Cannot clone <X>, the record doesn't exist` - X is a class, not a record

```
[error]   Prereqs.NoNanoWires: Cannot clone IPrereq, the record doesn't exist.
[warning] ...nestedPrereqs refers to a non-existent record or flat <TDBID:...>
```

`IPrereq` is an **abstract RTTI type**. It is a real thing in the engine and it
is not a record, so `$base: IPrereq` can never work - there is nothing to copy.

The correct shape names the record type and carries the class as a *field*:

```yaml
Prereqs.YourPrereq:
  $type: gamedataIPrereq_Record
  prereqClassName: ItemInSlotPrereq
  waitForVisuals: False
```

The companion `warning` line is worth reading rather than skipping: it names the
record that *pointed at* the one that failed, which is where the effect will be
missing.

**The correct form is usually already on the install.** Another mod that
successfully declares a prereq has it in its own YAML - grep `r6\tweaks` for
`$type: gamedataIPrereq_Record` and copy the working shape rather than deriving
one.

## The part files cannot settle

A broken prerequisite has **two possible runtime outcomes**, and nothing on disk
distinguishes them:

- the condition is skipped, so the restriction is simply not in force, or
- the whole effector carrying it fails, so the feature does nothing at all

Both look identical in the log. Which one is happening decides whether the mod is
half-working or dead, and it can only be answered by testing in game. Say that
plainly rather than picking the more likely one -
[an empty result is not a finding](/process/an-empty-result-is-not-a-finding).

## Related

- [One indentation error disables every record in a TweakXL file](/authoring/a-yaml-error-disables-the-whole-file) - the failure with a whole-file blast radius
- [A TweakXL record is resolved last-wins](/authoring/tweakxl-records-are-last-wins) - including how to ship the corrected record without touching the broken one
- [A data-layer log is noisy by design](/diagnosis/reading-a-noisy-tweak-log) - how to find these two among hundreds of benign warnings
- [Never guess a TweakDB record ID](/authoring/finding-the-real-record-id)
