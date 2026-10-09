---
type: Diagnosis
title: A data-layer log is noisy by design, and the count is not a health metric
description: A large load order logs hundreds of record warnings that are normal, the failing set changes between launches without any mod change, and the only question worth asking is whether a feature silently stopped working.
tags: [tweakxl, logs, triage, errors, load-order, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T23:05:00-04:00" }
---

# A data-layer log is noisy by design, and the count is not a health metric

Open the record-patching framework's log on a large install and it looks like a
disaster: on one measured install, **1,301 warnings and 359 errors across 3,917
lines**. Almost none of it means anything is wrong.

**Do not drive the count to zero, and do not report it as a health figure.** The
number is dominated by a single benign pattern, and a reader who is told "359
errors" will act on a number that does not measure what they think.

## The dominant pattern, and why it is normal

Overwhelmingly, the lines read as some variation of:

```
<record>.<field> refers to a non-existent record or flat <TDBID:...>
```

That is the ordinary consequence of **one mod referencing content from another
mod that is not installed**. Authors cross-reference each other's records, ship
optional compatibility blocks, and leave references to things a given player may
not own. The reference fails, the line is logged, and nothing is broken.

A second benign shape is a record that already exists:

```
Failed to create record '<...>'. reason: Record already exists
```

On one install that had been logged at every launch for years. It is steady
state — the record was already cached — not a fault anybody needs to act on.

## The size of the list inverts the meaning

**On a large load order**, a page of errors is background. There are hundreds of
mods and dozens of them reference something absent.

**On a small load order**, the same page of errors is worth reading line by
line. With five mods installed there is nothing else to blame, so a wall of
output is a signal rather than ambient noise.

The instinct to triage by count therefore fails in both directions at once. Size
the suspicion to the list, not to the number.

## Which records fail can change between launches with no mod change

This is the genuinely confusing one, and it gets misread as instability in the
game.

On one install the error count moved from **47 to 40** between two launches with
nothing installed, removed or edited in between — a specific vehicle's records
errored on one run and not the next. Nothing was nondeterministic. Handling
tweaks target nested inline sub-records, another mod reshapes those same
records, and **whether a given reference resolves depends on what was applied
first**.

So:

- **A varying error list is load-order interaction, not randomness.**
- **Do not treat the failing set as fixed.** A list captured on Tuesday is not
  the list you will get on Wednesday, and "the error went away" is not evidence
  that anything was fixed.

## The only question worth asking of any line

**Does this error mean a FEATURE silently stopped working?**

That question separates the noise from the findings, and the answer is rarely
visible in the error's severity. From one install's log:

| line | what it actually meant |
|---|---|
| ~21 `Ambiguous definition` errors on one mod's vendor-stock overrides | its remove-vanilla-vendor-stock feature **was silently not working** |
| 6 "bad format" errors from *empty* pose-list keys | a female-only pack with unused male keys — **pure noise** |
| a reference to a prerequisite record that does not exist | a gate that may be **skipped entirely**, which files alone cannot distinguish from the feature failing closed |
| references to optional venue files nobody owns | a compatibility block for content the player does not have — **noise** |

The first row and the second row look equally alarming in a log. One is a broken
feature and the other is nothing.

## Two error shapes that ARE worth chasing

- **`Ambiguous definition`** on a record means the framework could not infer a
  type — commonly a malformed or doubled record path with no `$type`/`$base` to
  clone from. The feature that record was supposed to provide is not present.
  What that message and its neighbour are each telling you, and the fix for
  both, is in [two TweakXL errors that are not "unknown
  record"](/authoring/tweakxl-error-signatures).
- **A whole file rejected** for a syntax error takes every record in it with it,
  and the symptom is a mod that appears installed and does nothing. See [a YAML
  error disables the whole file](/authoring/a-yaml-error-disables-the-whole-file).

## An error can be an artefact of your own testing

Before chasing anything, check the timestamp against what you were doing.

One install logged a mod disabling itself because its archive could not be
found — which read as a live fault, and was not. Every instance dated from the
window in which archives had been parked for a bisect, and the mod had loaded
cleanly in the three sessions since. See [an empty result is not a
finding](/process/an-empty-result-is-not-a-finding) for the general form.

## What this does not cover

The figures above come from a handful of installs at one game version, and the
benign/serious split was judged per line rather than by any rule the framework
itself publishes. Treat the *shapes* as reusable and the counts as illustrative.
