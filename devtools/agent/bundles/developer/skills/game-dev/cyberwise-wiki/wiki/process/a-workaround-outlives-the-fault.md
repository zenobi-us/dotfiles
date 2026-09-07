---
type: Process
title: A workaround gets written down and outlives the fault it was written for
description: If something works for thousands of other people and not here, something is wrong and the job is to find it - a dead scripting overlay chased for five hours turned out to be a second keyboard, and the tempting write-up would have taught every future reader a false fact about the tool.
tags: [method, workarounds, documentation, hardware, root-cause, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T20:15:00-04:00" }
---

# A workaround gets written down and outlives the fault it was written for

**If a feature is supposed to work, and works for thousands of other people, and
does not work here - something is wrong. Find it.** Do not design a way to live
without it.

The reason this is a rule rather than a preference is what happens *after* the
session ends. A workaround gets written into a note, a note becomes guidance, and
guidance is read by people whose machines never had the fault. The fault is
transient. The rule is permanent. That asymmetry is the entire cost.

## The worked case

A scripting overlay would not open. Five hours went into it: binding stores, the
tool's own config and state files, the render hook, overlay software, chat
clients, accessibility filters, keyboard filter drivers, and a large mod list
parked in bisect rounds.

The cause was **a second keyboard emitting a phantom key-down with no key-up**.
Every program running at that moment believed a modifier was held for the rest of
its life, so a hotkey chord could never match again - and each program tracked its
own copy of that state, which is why one application was unusable while others
were fine.

The tempting conclusion, at hour four, was: *"never rebind this overlay through
its own UI; write the value into the file instead."* That would have been a
usable workaround and a completely false statement. The UI is not broken. It
works everywhere. Recorded as guidance, it would have taught every future reader
a wrong fact about the tool, and it would still be being read long after the
faulty keyboard went in a drawer.

The correct write-up is a fact about hardware, not about the tool: a keyboard
that is switched **off** but still cabled still enumerates and still reports, and
a power transition is when a faulty one emits the stuck key. That write-up - the
fingerprint that names the layer, and the software theories eliminated first - is
[a bind dialog reading "unknown+key" is a device on the machine](/input/a-phantom-input-device-poisons-the-bind-dialog).

## When a workaround is legitimate

Exactly one case: **as a stated temporary measure while the hunt continues.**

That means it is written with its own expiry attached - what is still being
looked for, and what evidence would end it. It is never the answer, and it never
goes into a reference, a skill, or a durable note as guidance.

If the cause turns out to be hardware, an environment, or another program, **fix
or remove that**. Do not adapt the practice around it. The practice will be read
by someone whose environment is fine.

## The tell: a rule that only makes sense here

Before writing any instruction down, ask whether it would be true on a clean
install belonging to somebody else. Rules that fail that test read like this:

- "This control does not work - set the value in the file directly."
- "Do not use feature X; it is unreliable."
- "Always do Y first or Z fails."

Each of them is a description of one broken environment wearing an instruction's
clothes. The general version - "a stuck modifier from a second input device makes
every chord unmatchable" - is true everywhere and *also* solves the original
problem, which is how you can tell it is the right write-up.

## History and guidance are different documents

Related, and constantly confused: **what was done on the night is history; what
to do next time is guidance.** Only the second should read as instruction, and
only when it is true in general.

A narrative of a diagnosis is worth keeping - the wrong roads are half the value
of a hard investigation. But it must be written as narrative. The moment it is
written in the imperative, every dead end in it becomes a rule, including the
ones that were dead ends precisely because the environment was broken.

## Related

- [An empty result is the absence of evidence, and it looks exactly like a finding](/process/an-empty-result-is-not-a-finding) - the other way a session produces a confident false conclusion
- [A binding can be stored as a packed integer instead of a key name](/input/packed-key-codes) - the chord-matching mechanism the phantom key defeated
- [Five separate stores hold key bindings, and no single one answers what a key is bound to](/input/five-binding-stores) - four of the five layers searched during those five hours
