---
type: Interaction Pattern
title: Detecting a player action by matching its interaction text is matching on something another mod owns
description: A mod that recognises "the player slept" by comparing the choice-hub LocKey stops recognising it the moment anything redefines that text or replaces the prompt - and the same detection misses quest-scripted sequences entirely, while a ticking interaction fires it more than once per use.
tags: [redscript, lockey, interactions, detection, cross-mod, silent-failure]
status: stable
generated: { by: "claude", at: "2026-08-24T21:15:00-04:00" }
---

# Detecting a player action by matching its interaction text is matching on something another mod owns

The game has no event that says "the player slept" or "the player showered". A
mod that wants to react to those has to infer them, and the available handle is
the **choice hub** - the prompt list the player picks from. So the mod listens
for a choice being taken and compares the hub's title string against a list of
known ones.

Wannabe Edgerunner does exactly this, and its source is the clearest statement
of the pattern:

```reds
let shower: String = "LocKey#46419";
this.sleep = [
  "LocKey#46047", // Interacting with lover while in bed, or ... the sleep action
  "LocKey#46418"  // Bed
];
```

The hub title is captured by wrapping `DialogHubLogicController.SetupTitle`, and
the check runs from a blackboard listener on
`UIInteractions.LastAttemptedChoice`. That is a reasonable design - it is
roughly the only one available - and everything below is a consequence of it
rather than a criticism of it.

**The general form: matching on display text is matching on something another
mod may own.** Three failure modes follow, and none of them produces an error.

## 1. Another mod redefining the text breaks the detection silently

A `LocKey` is a numeric handle into the localization table, and whichever loaded
resource last defines an entry supplies the text (see [Finding a piece of text
the player saw in game](/authoring/finding-in-game-text)). So:

- a mod that **overrides those keys** - retranslating, rewording, or restyling a
  prompt - changes what the matcher sees;
- a mod that **replaces the interaction with its own prompt** supplies a
  different key entirely.

Either way, the detection stops registering. There is no error, nothing in a
log, no "unknown interaction" complaint. The feature simply never fires again,
and the user reports that the mod "stopped working" after installing something
that appears completely unrelated to it.

It also cuts the other way: matching is not only under-inclusive but
**over-inclusive**, because a LocKey names a string rather than an occurrence of
one. The same mod's own comments record living with this:

```reds
"LocKey#48683",  // Rollercoaster, "raise hands" ... (This key is actually the
                 // one for "V" but is uncommon enough to not be a huge problem)
```

A key whose text happens to be a character's name will match every prompt that
uses that name.

And once a mod resorts to matching **raw display strings** for cross-mod support
- `"Judy"`, `"Nibbles"`, `"Elmo"` appear in the same lists - the detection is
keyed to literal English words that a translation, a rename or a different mod
version will change.

**If you are authoring detection: prefer a signal the player's action produces
that no other mod owns** - a status effect applied, a quest fact set, a workspot
entered, a device event - and treat text matching as the last resort it is. If
you must match text, say so where a user will find it, because "install a
prompt-retexturing mod and this feature goes quiet" is not something anyone will
guess.

## 2. A quest-scripted interaction fires no LocKey at all

The detection hangs off a **player-initiated choice hub**. A quest that scripts
the same action never opens one: no hub title is set, `LastAttemptedChoice`
never fires, and the matcher is never called with anything.

Worked example, measured in game: a **scripted sleep restored nothing**, while a
**player-initiated bed use restored the full amount** in the same session. Same
in-fiction action, same mod, opposite outcomes - because one went through the UI
and one did not.

This is worth stating plainly because the user-visible version of it is "the mod
works sometimes". Anything keyed to interaction detection **misses scripted
sequences entirely**, and scripted sequences are exactly where the story puts
the memorable instances of an action. A quest fact or a status effect would
catch both; the choice hub catches one.

## 3. One use can pay out more than once

An interaction that **ticks** - a hold, a repeated prompt, a choice hub that
re-attempts while the action runs - fires the listener more than once, so the
handler runs more than once per use.

Measured: **a single shower paid out twice.**

The consequence for anyone authoring or configuring such a mod is that a number
presented in a settings menu as a per-use amount is really a **per-tick rate**,
and the effective value is that number times however many ticks the interaction
happens to produce. Nobody reading the setting can tell. A user who sets
"restore 5" and observes 10 will reasonably conclude the setting is ignored.

If you are authoring: **debounce the handler** - a flag or a timestamp that
makes the payout once per interaction - or document the number as a rate rather
than an amount. If you are diagnosing: before concluding a value is wrong, count
how many times the handler ran.

*What is not verified here:* that the double payout is caused specifically by
the choice hub re-attempting, rather than by a second listener firing. The
doubling itself was measured; the mechanism behind it is inferred from where the
listener is attached.

## Related

- [Finding a piece of text the player saw in game](/authoring/finding-in-game-text) - how a LocKey resolves, and why anything can redefine one
- [The game ships its own API reference, and guessing a signature is slower than reading it](/authoring/reading-the-shipped-script-dump)
- [A shared core that announces its own add-ons turns "is this installed" into a lookup](/patterns/shared-core-announces-its-addons)
