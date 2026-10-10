---
type: Process
title: A generator needs three guards, and all of them are cheap
description: A tool that writes files can destroy the hand-written material it was generating alongside, quietly hardcode one machine into its defaults, and be trusted before anyone has read its output - each closed by a specific check, verified by proving it refuses.
tags: [tooling, generators, safety, portability, testing, method]
status: stable
generated: { by: "claude", at: "2026-08-24T20:26:00-04:00" }
---

# A generator needs three guards, and all of them are cheap

A tool that reads an install and writes files out of it has three failure modes
that do not announce themselves. Each has a guard costing a few lines, and each
guard needs its own test, because an untested guard is a comment.

## 1. Refuse to write into the material you ship

A generator that populates a per-user directory must never be pointed at the
shipping one. Someone will point it there - by passing the wrong argument, by
running it from the wrong working directory, or by having a copy of the shipping
tree somewhere unexpected.

**Two independent checks, because either alone has a hole:**

```
1. path check    - refuse any target under the shipped directory
2. marker check  - read the target's own index; refuse if it declares
                   itself the shipping bundle
```

The path check catches the canonical location. The **marker check catches a copy
sitting anywhere else** - a checkout in a temp folder, a backup, a second clone -
which the path check cannot see at all. A tool with only the first guard is
protected exactly where nobody was going to make the mistake.

**Verify both actually throw, and verify that they wrote nothing.** A guard that
raises after the first file is written is not a guard. The test is: point it at
each kind of forbidden target, assert the failure, then assert the target is
byte-for-byte unchanged.

## 2. Say, in the file, whether it may be overwritten

Generated files split into two kinds with **opposite** rules, and a reader who
applies one rule to the other kind either loses work or preserves staleness
forever.

| kind | example | rule |
|---|---|---|
| **measured, regenerated whole** | a machine or install profile | overwriting is *correct*; a merge would be half measurement and half memory with nothing marking which |
| **seeded, then deepened by hand** | an article that started as a stub | overwriting destroys research; regeneration must skip it and require an explicit force |

**State which one it is in the generated file's own header**, not in a README.
The header travels with the file; the README does not, and the person about to
run the generator a second time is reading the file, not the documentation.

**The corollary that catches people out:** a generator can only write what it
measured *today*. Anything hand-observed - a symptom, a conclusion, a thing
somebody was told - has no measurement behind it and will be gone at the next
run. Hand-observed facts need their own home, in a file the generator does not
own. Putting them into a regenerated file is a slow leak that nobody notices
until the note that mattered is missing.

## 3. Never let one machine become the default

**Hardcoded defaults are the largest code-level leak in this kind of tool**, and
they leak more than privacy. A tool defaulting to a specific install path, one
person's downloads folder, or one display's resolution is unusable elsewhere -
and, far worse, on a *different* machine it silently produces plausible output
about a machine that is not the one in front of it.

The discipline:

- **Auto-detect, then fail with a clear error.** "Could not locate the game
  install; pass `-GameRoot`" is a good outcome. A silent fallback to a guessed
  path is how a report ends up describing nothing.
- **Never let detection override an explicit argument.** If the caller said
  where, that is where. A detector that "corrects" an argument turns a typo into
  a wrong answer instead of an error.
- **Treat a resolution, a screen size or a window size the same way** - measured
  or asked, never assumed. See [Ask for the viewport rather than detecting the
  display](/process/asking-for-the-viewport).

## Validate the output before trusting the generator

Run it against a temporary target and read what came out. Three inputs, and the
third is the one people skip:

1. **the real case** - does it match what is actually on disk
2. **a minimal fixture** - one item, hand-built, where you know the right answer
3. **a zero-content fixture** - nothing installed, nothing to measure

The empty case is what forces honest wording. A tool that has measured nothing
should say "no archives found", not `0.0 GB` - a number that reads as a
measurement and is really the absence of one. Every "0" in a generated report
should be traceable to a count that was actually taken, and the empty fixture is
what proves it.

Then validate the output with whatever checks the format: a passing structural
check is not correctness, but a *failing* one on freshly generated output means
the generator is broken, and that is worth knowing before it runs anywhere real
([A passing validator has checked structure, not
truth](/process/a-passing-check-is-not-a-true-claim)).

## Related

- [An inventory of somebody's install is personal data](/process/generated-output-is-personal-data) - where the output is allowed to land, and what has to change before it is published
- [Documenting a large mod list without producing a report nobody can trust](/process/running-a-documentation-pass) - the hand-written half of what a generator must not flatten
- [A capacity read from the wrong API comes back plausible](/process/a-capacity-read-from-the-wrong-api) - the measurement a generator will happily write down
