---
type: Diagnostic Method
title: An overlay that stops opening on its key is a half-enumerated HID device, not a mod
description: Twice now, on two different keyboards. An overlay stops opening on the key it has always used and the bind dialog shows a phantom modifier before every extended key. Both times the cause was a HID composite that was half-enumerated - healthy as a keyboard, broken on its other interfaces - and both times the software suspects were wrong.
tags: [cet, hotkeys, hid, input, overlay, hardware, wrong-theory, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-25T11:20:00-04:00" }
---

# A bind dialog reading "unknown+key" is a device on the machine, not a mod

**Symptom.** An in-game overlay stopped opening on the key it had opened on for
months. Its own bind dialog, which had always displayed that key by name, began
displaying `unknown+<key>` - a modifier it could not name, in front of the key
being pressed.

**Cause.** A wireless keyboard, **switched off**, still plugged into a
Thunderbolt dock, presenting a phantom HID device that contributed a modifier
nothing else on the machine reported.

Between those two sentences sat a multi-day investigation, and the reason it
took that long is that every plausible suspect is in the game.

## It has now happened twice, on different hardware

**2026-08-22** - an Apple Magic Keyboard, switched off, cabled to a Thunderbolt
dock. Five hours. The bind dialog captured `Unknown + Delete` and CET *stored*
the chord, so the binding was dead until rewritten by hand.

**2026-08-26** - a **Corsair K100**, plugged directly into the machine, not on a
dock. Fixed in minutes once the right query was run, and **fixed by physically
unplugging and replugging the keyboard**.

The second occurrence is what makes the rule usable, because it kills the
specific theory the first one suggested. It was not the Apple keyboard, not the
dock, and not "off but still cabled". Both devices had one thing in common:

> **A HID composite device can be healthy on one interface and broken on the
> others.** The keyboard interface works - you type normally, everywhere - while
> its sibling interfaces fail to start and contribute garbage to whatever reads
> raw HID.

## The query that names it in one line

This is the first thing to run, before any of the elimination list below:

```powershell
Get-PnpDevice | Where-Object Status -eq 'Error' | ForEach-Object {
  $p = (Get-PnpDeviceProperty -InstanceId $_.InstanceId -KeyName DEVPKEY_Device_ProblemCode).Data
  '{0,-8} {1,-30} problem {2}  {3}' -f $_.Status, $_.FriendlyName, $p, $_.InstanceId
}
```

On the 2026-08-26 occurrence:

```
Error  USB Input Device  problem 10  USB\VID_1B1C&PID_1BC5&MI_01\...
Error  USB Input Device  problem 10  USB\VID_1B1C&PID_1BC5&MI_02\...
Error  USB Input Device  problem 10  USB\VID_1B1C&PID_1BC5&MI_03\...
```

**Problem code 10 is "this device cannot start."** Three of the keyboard's four
interfaces were dead while `MI_00` - the one that types - was `OK`. Compare a
healthy composite: every interface reports `OK`.

`Status` alone is not enough. A device can sit at `Unknown` for benign reasons;
`Error` plus a problem code is the discriminator, and the interface breakdown of
one composite is what makes it obvious.

## The fix is physical, and it is cheap

**Unplug the device and plug it back in.** Not "disable in Device Manager", not
"remove the node" - the failing interfaces have to re-enumerate. On 2026-08-26
that alone restored the overlay, with no restart of the game and no rebinding.

Removing the phantom node from the device tree is a *different* action and does
not fix this: it was done first on 2026-08-26, correctly cleared a stale ghost,
and changed nothing.

## The fingerprint that names the layer

**Some keys bound cleanly and some did not.** A numeric-keypad key bound
normally; the arrow keys, Insert and Delete all came back with the phantom
modifier attached.

That split - **extended-scancode keys affected, main-block keys not** - is the
signature of a second device contributing scancodes, rather than of any
software. Software that intercepted input would not draw the line there.

The second half of the fingerprint is that **everything else on the machine
typed perfectly**: the desktop, a text editor, the Start menu, and the game's own
text fields. Only the consumer that reads raw HID scancodes saw the extra device.
"But my keyboard works fine" is therefore not evidence, and a user offering it is
describing a different layer.

## What was eliminated first, and why none of it was cheap

Recorded because each of these is where the next person will also start:

- **A mod changed the binding.** Disproved by the strongest test available: the
  same key failed on a vanilla install with only the script extender present,
  after a full purge of the mod list.
- **The shader injector was intercepting input.** Disproved by renaming its DLL.
  The user's own objection - *why would that be the culprit?* - was correct, and
  the test was run anyway because it was cheap.
- **A monitoring overlay** that had been installed on the machine for years
  without incident.
- **Exclusive fullscreen versus borderless.**
- **Extra builds of a chat application** installed for multiple accounts.

Every one of those is a software theory, and the fault was not in software at
all.

## What was chased AGAIN on the second occurrence, and should not be a third time

Every one of these is written in this article and in the project memory, and
every one was proposed anyway before the right query was run:

- **RTSS / MSI Afterburner.** Named as the likely culprit despite having run on
  this machine with this game for over a year, and despite being on the
  2026-08-22 elimination list. A component that has been present for a year
  without causing a fault is not a discriminator - see [proximity is not
  evidence](/process/proximity-is-not-evidence-without-a-base-rate) for the same
  error in a different costume.
- **Rebinding to another key.** Proposed as a "fix", which this article's own
  *Do not settle for another key* section forbids, for the reason given there.
- **A CET renderer failure.** `D3D12::Initialize()` was missing from the current
  session's log, which looked decisive and was not: the log is written during
  startup and reading it mid-launch shows a session that has not got there yet.
  **Check whether a log is still being written before concluding something is
  missing from it.**
- **A stuck-modifier sweep**, reinvented from scratch in a worse form than the
  one already recorded in memory (which correctly scopes to VK 16-165 and, more
  importantly, *releases* what it finds). It came back clean, which proves
  nothing: a virtual HID endpoint injects below that layer.

## Look at the topology before advising about it

The 2026-08-26 advice included "re-seat it on a different port, ideally not
through the dock" - on a machine where the keyboard was **not connected to the
dock at all**. Enumerating the USB tree would have shown that in one query.

**Do not give physical-layout advice you have not enumerated.** It is cheap to
check and it costs credibility every time it is wrong, which is exactly the
currency an investigation like this runs on.

## The rule this produces

**Inventory the physical input devices before touching the game.** Docks and
hubs, KVMs, a laptop lid, a powered-off wireless keyboard or controller still
enumerated by the OS, a device left in pairing mode. A device that is off is not
a device that is absent - it is enumerated, and it can still contribute.

Unplug rather than reason: the test is seconds, and the machine is a layer that
almost never appears in a mod-list investigation.

## What it looks like in the stored binding

A binding captured while the phantom was present is not merely displayed wrongly
- it is **stored** wrongly. A chord recorded as filler-plus-key can never match a
plain keypress afterwards, so the binding is dead until it is re-recorded with
the device gone. See
[a binding can be stored as a packed integer](/input/packed-key-codes) for the
slots and the filler value.

## What was not verified

Two occurrences on one machine, with two different keyboards - one on a dock,
one direct. The mechanism (a half-enumerated HID composite contributing to what
the game reads) now has two data points and a problem code to grep for, which is
what promoted this from draft.

Still unverified: **why** the interfaces fail to start. Both devices were fine
for months beforehand and fine again afterwards, so this is a transient
enumeration fault rather than a broken device. Whether it correlates with sleep,
a hub power event, or a driver update is unknown - if it recurs, note what the
machine did in the hour before.

## Do not settle for another key

The tempting resolution is to bind the overlay somewhere else. It resolves
nothing, and the note it leaves behind ("this overlay cannot use that key")
outlives the broken hardware and teaches the next reader something false about
the software -
[a workaround outlives the fault it was written for](/process/a-workaround-outlives-the-fault).

## Related

- [Five separate stores hold key bindings](/input/five-binding-stores)
- [A binding store can lose its contents, and an empty store looks exactly like the wrong store](/input/a-binding-store-can-empty-itself) - the other way a binding goes bad without a mod
- [A CET mod folder without init.lua is not a mod](/engine/cet-mod-loading) - the log line that says whether the overlay's render layer started at all

## Correction: the "phantom device" is usually Windows' own injected shift

This article was written around a half-enumerated HID composite, and that was
one real occurrence. The recurring fault is simpler and is documented behaviour.

Windows injects **synthetic Shift events** around the extended editing block -
Delete, Insert, Home, End, PgUp, PgDn, arrows - because Shift acts as a
temporary NumLock inverter and has to be suppressed for those keys. The injected
event carries **scan code 0x2A with the E0 extended bit and VKey 0x00FF**, which
a real left shift can never produce.

`0x00FF` is **255**. A bind recorded as `255, 46, 0, 0` is therefore not a
corrupt device entry - it is *injected-shift + Delete*, and it is why a bind
dialog reads `unknown + Delete`. An application that does not filter these sees a
two-key chord where the user pressed one key, so a stored single-key bind never
matches.

The tells, in order of cost:

1. **Does the same bind work on a letter or a numpad key?** If yes, the key
   itself is fine and the extended block is the variable. This one test settles
   it and costs seconds.
2. **Is NumLock on?** That is what makes the suppression necessary.
3. Only then look at devices.

**Filter, for anyone fixing this in code:** drop shift events where
`scanCode == 0x2A && (flags & LLKHF_EXTENDED)`, or `VKey == 0xFF` on makecode
0x2A under `WM_INPUT`.

## Confirmed by controlled test

**NumLock OFF: the Delete bind works. NumLock ON: it breaks.** Toggled both
ways, reproduces both ways, on a machine where the overlay had been "randomly"
dead across weeks.

So the diagnostic order is:

1. **Is NumLock on?** Toggle it and press the bind. Five seconds, and it
   reproduces in both directions.
2. **Does the same bind work on a letter or numpad key?** Confirms the extended
   block is the variable.
3. Only then enumerate devices.

Device enumeration, vendor software restarts, overlay-injector theories and
reading the host application's source are all *below* those two steps, and on
one occurrence they consumed about four hours that step 1 would have closed.

