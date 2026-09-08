---
type: Process
title: A capacity read from the wrong API comes back plausible, and nothing about it looks wrong
description: An installed capacity - VRAM, RAM, disk, cores - read through an API that cannot represent the answer does not error or return null; it returns a believable number in the right units, and everything built on it inherits the error silently.
tags: [measurement, verification, hardware, wmi, method, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T17:45:00-04:00" }
---

# A capacity read from the wrong API comes back plausible, and nothing about it looks wrong

**A wrong capacity does not announce itself.** Read the size of something
installed - video memory, system memory, a disk, a core count, a quota - through
an interface that cannot express the true answer, and you do not get an error, a
null, or an out-of-range value. You get a number in the right units, of the right
order of magnitude, that a reasonable machine could genuinely have.

That is what makes it expensive. Every other bad input announces itself: a path
that does not exist throws, a parse that fails returns nothing, a log that was
never written is absent. A saturated integer looks exactly like a measurement.

## The worked example: `Win32_VideoController.AdapterRAM`

The canonical case, and the one that cost real time.

```powershell
(Get-CimInstance Win32_VideoController).AdapterRAM   # -> 4293918720
```

`AdapterRAM` is a **uint32**. It cannot represent more than 4 GB, so every card
above that reports something just under 4294967295. A 6 GB card, a 12 GB card and
a 32 GB card all answer the same, and the answer is "about 4 GB" - a completely
ordinary figure for a GPU, and wrong for all three.

The obvious fix has its own trap. The display class registry key carries the real
figure as a QWORD:

```
HKLM:\SYSTEM\CurrentControlSet\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}\<NNNN>
    HardwareInformation.qwMemorySize
```

but `<NNNN>` is an **enumeration, not a singular**. Index `0000` is whichever
adapter Windows enumerated first, which on a machine with integrated graphics is
routinely the integrated adapter - and it answers with its own small, entirely
plausible capacity. Reading index 0 and stopping produced "2 GB" on a machine
whose actual gaming card has 32.

Both wrong answers - the 4 GB from saturation and the 2 GB from the wrong index -
were produced on the same machine within an hour, and one of them was briefly
used in a crash diagnosis before anybody cross-checked.

There is a third variant of the same bug: **pairing a name from one source with a
size from another.** Take the adapter name from `Win32_VideoController` and the
memory from the registry, and the moment a machine has two adapters the pairing
is arbitrary. That reports a GPU that does not exist - the integrated adapter's
name against the discrete card's memory - and the report will be internally
consistent and confidently wrong.

## Two tells worth memorising

Neither is proof, and both are cheap to check.

- **A value sitting on a power-of-two ceiling is a saturation tell.**
  `4294967295`, `4293918720`, `2147483647`, `65535`, `255`. If a capacity comes
  back at or just under one of those, suspect the type before you suspect the
  hardware.
- **A value that matches a *different* device in the machine is an enumeration
  tell.** If the "GPU memory" happens to equal what the integrated adapter has,
  or the "disk size" equals a second drive, the index was wrong, not the value.

## What to do instead

1. **Cross-check any installed capacity against a second, independent source
   before building anything on it.** For an NVIDIA GPU the driver will answer
   directly:

   ```powershell
   nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv
   ```

   The vendor's own tool, the firmware setup screen, the OS's own hardware page -
   any of them is independent of the API that lied.
2. **Enumerate, never index.** Where an API exposes a collection, read all of it
   and pick deliberately, with the rule written down ("the adapter with the most
   memory"). Taking element 0 is a decision disguised as a default.
3. **Keep name and capacity from the same record.** If they come from two
   sources, they describe two devices until proven otherwise.
4. **Write the source next to the number.** "32 GB (`qwMemorySize`, index 2 of
   4)" survives review; "32 GB" does not, because a later reader cannot tell a
   measurement from a recollection.

## Why this belongs in process rather than engine

It is not a fact about any game. It is a fact about how a piece of work goes
wrong: a value that is wrong but plausible **propagates**. It is quoted into a
report, a report is quoted into a diagnosis, and the diagnosis produces advice
that is confidently unrelated to the machine it was given about. Nothing in that
chain has a place where the error becomes visible, because at no point does
anything look odd.

The same shape appears anywhere a silent wrong answer is indistinguishable from a
right one. A settings store that is simply the wrong file returns an answer that
reads exactly like "unset" -
[live-state-is-not-defaults](/patterns/live-state-is-not-defaults) is that case,
and the remedy is the same one: ask *which source can answer this* before asking
*what the value is*.

## Related

- [Documenting a large mod list without producing a report nobody can trust](/process/running-a-documentation-pass) - verifying a derived identifier before anything is built on it, and why a set is worth what its weakest claim is worth
- [A settings file the game rewrites answers "what is set", never "what is default"](/patterns/live-state-is-not-defaults) - the other shape of a silent wrong answer
