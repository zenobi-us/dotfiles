---
type: Diagnostic Method
title: Checking a gameplay claim against the game's own scripts, not a forum
description: A circulating console snippet may name a function the game does not have - the widely-posted carry-capacity cheat is not a global at all - and because the scripting console is case-sensitive and silent on success, a typo and a working command look identical until you print something.
tags: [scripts, console, verification, cheats, case-sensitivity, method]
status: stable
generated: { by: "claude", at: "2026-08-24T22:40:00-04:00" }
---

# Checking a gameplay claim against the game's own scripts

Almost every finding in this area exists because a plausible answer was believed
first. The shipped script dump settles them, and mod pages, guides and forum
posts routinely do not - not through bad faith, but because a snippet that worked
in somebody's specific setup gets copied forward long after the thing it named
stopped being true, or was never a game function to begin with.

> **The shipped scripts are the authority for real signatures, enum values and
> gating. A snippet circulating on a forum may name a function the game does not
> have.**

## The worked example: a carry-capacity "cheat" that does not exist

The console line everybody posts for carry capacity names a global that **is not
a global**. It is not deprecated, not renamed, not gated - there is no such
function on the game side. It survives in guides because it exists as a helper
*inside certain mods*, so for the people who wrote those guides it genuinely
worked, and nothing in their experience distinguished a mod's helper from the
game's own API.

The working route is the one a popular capacity mod's own slider calls: the stat
modification path, against the real stat type. That is also the general shape of
the fix - **when a snippet fails, find a mod that demonstrably does the thing and
read what its own control calls.** A shipping feature's implementation is proof
against this game version; a forum line is proof of nothing.

## Two properties of the console that make this hard to notice

**It is case-sensitive.** A wrong-case call errors to the log rather than
correcting itself.

**It is silent on success.** A call that works prints nothing.

Put those together and the two outcomes you most need to tell apart look
identical from the console: a typo produces no visible output, and so does a
perfect command. The habit that fixes it costs one line:

> **Append a print statement.** Print the value you set, the count you changed,
> or literally `print("ok")` - anything that turns "no output" into a positive
> signal.

Without it, "I ran it and nothing happened" is unresolvable between *it did not
run*, *it ran and did nothing*, and *it worked exactly as intended*. That is the
same class of failure as a stat query that never returns a value: an absence of
evidence, indistinguishable from several very different causes.

## Where this method earns its keep

Questions of the form "does this feature exist" - does the game have a bind for
this, is there a resistance stat for that, what grants this slot - are precisely
the ones that mod pages and forums answer wrongly and confidently, because
everyone answering has a different modded install and no way to tell their
additions from the base game. Every article in this area was settled by reading
the dump instead, and several of them contradict the popular answer.

## Related

- [The game ships its own API reference, and guessing a signature is slower than reading it](/authoring/reading-the-shipped-script-dump)
- [What the CET console can and cannot do](/authoring/the-cet-console-is-a-sandbox)
- [Cyberware capacity is the "Humanity" stat family internally](/gameplay/cyberware-capacity-is-the-humanity-stat)
- [Bleed has no resistance axis at all - only binary immunity](/gameplay/bleed-has-no-resistance-only-immunity)
- [A third-party program's menus cannot be recalled](/process/a-third-party-ui-cannot-be-recalled) - the same rule applied to somebody else's software rather than to the game
