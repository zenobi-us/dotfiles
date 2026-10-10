---
type: Diagnosis
title: Memory is usually a red herring, and measuring it badly manufactures the leak you went looking for
description: Startup ramps GPU memory hard for minutes, so two samples across that ramp produce a confident "sustained growth" figure that is pure measurement error. What a leak claim actually requires, and the counters that lie about capacity.
tags: [memory, vram, leak, measurement, oom, telemetry, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T21:10:00-04:00" }
---

# Memory is usually a red herring, and measuring it badly manufactures the leak you went looking for

"It ran out of memory" is the first theory almost everybody forms about a game
that vanished, and it is usually wrong. It is also the theory most likely to
survive contact with the evidence, because the obvious way to measure memory
produces a number that supports it.

**Only open a memory investigation when memory is genuinely a suspect** -
`isOom: true` in the game's own crash report, or a crash that appears only deep
into long sessions. Otherwise it costs an evening and ends where it started.

## Startup ramps hard, and two samples across the ramp invent a leak

**The game legitimately climbs GPU memory for minutes after launch.** On one
heavily modded install it went from 0 to roughly 14 GB in about two minutes. The
figure and the duration change with the card, the settings and the mod list; the
*shape* does not.

Sample once during that ramp and once after it, subtract, and you have a
confident growth rate. In one investigation that produced a reported **"≈1.5
GB/min sustained growth"** which was entirely measurement error - the second
sample was simply past the ramp.

**A leak claim needs a trend across a long session, not two points.** A
40-minute capture on the same install showed memory plateauing after the load
ramp and then oscillating with no trend for 27 minutes - healthy fifteen seconds
before death, with `isOom: false` agreeing.

## The obvious reading is often the wrong counter

- **`Win32_VideoController.AdapterRAM` reports about 4 GB for any large GPU.** It
  is a uint32 artifact, not a measurement. Read per-process and adapter memory
  from performance counters instead. The general shape of this failure - an
  installed capacity read through an API that cannot represent it, coming back
  plausible - is
  [a capacity read from the wrong API](/process/a-capacity-read-from-the-wrong-api).
- **A GPU memory figure below the card's capacity does not refute exhaustion.**
  Allocation can fail below the ceiling. Equally, do not declare exhaustion
  refuted from a single early sample.

## Handle and thread counts can kill the theory outright

The counters that are *not* memory frequently settle the question faster than the
ones that are. On one install, crashed sessions peaked at **3,090-3,548 handles**
while healthy sessions reached **7,731**. The crashing runs were nowhere near the
healthy ceiling, which killed the resource-leak theory in a single comparison -
and no amount of staring at memory graphs would have produced that.

The lesson generalises: **compare a crashed session against a healthy one on the
same install**, rather than comparing a crashed session against your intuition
about what a big number looks like.

## Reading mod source is inference, not measurement

You can find a genuine defect by reading a mod's code - a leak, an asymmetric
guard clause, an unbounded array - and still not have found *your* crash. Label
it accordingly.

In one case a real resource leak was identified in a mod's redscript, and the
crash continued after that mod was fully undeployed. The defect was real. The
diagnosis was not.

A found defect is a hypothesis with good provenance. It becomes a cause the same
way anything else does: by removing it and watching the fault go away, then
adding it back and watching the fault return.

## Related

- [The game writes its own crash report](/diagnosis/the-games-own-crash-report) - where `isOom` comes from, and why a folder of captures may be two crashes
- [A capacity read from the wrong API comes back plausible](/process/a-capacity-read-from-the-wrong-api)
- [A failing round narrows nothing](/diagnosis/a-failing-round-narrows-nothing) - the standard of proof a cause has to meet
