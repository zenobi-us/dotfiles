---
type: Process
title: An inventory of somebody's install is personal data, and sanitising it means reframing rather than deleting
description: A mod list, a decoded save and an appearance dump all describe a person, so where the output lands is a decision the tool has to make - and preparing any of it for publication means keeping the numbers and the failure story while generalising the instruction.
tags: [privacy, personal-data, publication, reports, redaction, method]
status: stable
generated: { by: "claude", at: "2026-08-24T20:32:00-04:00" }
---

# An inventory of somebody's install is personal data, and sanitising it means reframing rather than deleting

Three artefacts this kind of work produces routinely, all of which describe a
person rather than a game:

- **an inventory of an install** - the mod list, the hardware, the paths, the
  usernames those paths contain
- **a decoded save** - a play history, choices made, where somebody is in a story
- **an appearance dump** - and this one surprises people. A list of appearance
  values is not a table of integers; together they describe a real person's
  character, in enough detail to reconstruct it.

None of that is secret in the dramatic sense. It is simply not yours to
distribute, and the tool that produces it should make the safe placement the
default rather than a thing the operator remembers.

## Where the output lands is the tool's decision

- **Default the output path outside any repository.** A generated report that
  lands in a working tree is one accidental commit from being published forever,
  and the person who runs the generator is rarely the person thinking about the
  repository.
- **Keep the per-user material in a per-user location**, separate from anything
  that ships. Location is a boundary that survives; a "do not publish" field in a
  header is a boundary that gets forgotten the first time someone copies a file.
- **Redact paths in anything meant to be pasted into a support thread.** A
  Windows user path carries a real name far more often than not. Replace the home
  directory with a placeholder in the paste-facing output specifically - the
  local copy can keep the real thing.

## Sanitising for publication is reframing, not deletion

When a lesson from a real case is going into something that ships, the instinct
is to strip it back to a general principle. **That instinct destroys exactly what
made it worth writing.**

Keep:

- **numbers** - sizes, counts, durations, how many hours it took
- **formats, offsets and magic values** - the parts a reader needs to act
- **error strings**, verbatim, because that is what somebody will search for
- **the specific failure story** - a worked example from a real case is what
  makes a warning credible, and a warning nobody believes changes no behaviour

Generalise:

- **the instruction**. "Check the option registry before declaring a setting
  absent" ships. "Check it because their config file did not have it" does not
  need to.
- **the identity**. The machine, the person, the specific mod list, the paths.

Delete only what is genuinely an internal note with no general value - a
reminder to re-run something, a message to a specific person, a decision about
one install's configuration.

The test: **would a stranger with the same problem be able to act on this, and
would they believe it?** The first requires the specifics. The second requires
the story.

## The private-tooling tell

Guidance that references a script which does not exist in the shipped tools is a
private note wearing instruction's clothes. It reads as actionable and is not,
and the reader's only conclusion is that something is missing from their install.

**The fix is not to ship the script. It is to state what the check actually
is**, so it needs no tooling at all:

> ~~Run `Check-Thing.ps1` before publishing.~~
> Before publishing, confirm no output path contains a home directory, and that
> no article names a specific machine.

Written that way it is true for every reader, it survives the script being
renamed or deleted, and it can be done by hand in a minute. If a tool genuinely
helps, name it as an *example* of doing the check - never as the check itself.

## Related

- [A generator needs three guards, and all of them are cheap](/process/writing-a-generator-that-cannot-eat-its-own-source) - the machine-specific default that leaks in the other direction
- [Appearance lives in a save node CDPR misspelled, and its blocks can disagree](/formats/appearance-in-a-save) - the format whose dump is personal data
- [An ACU preset's LocKey number is a hash of a group name, not a localization key](/formats/acu-preset)
