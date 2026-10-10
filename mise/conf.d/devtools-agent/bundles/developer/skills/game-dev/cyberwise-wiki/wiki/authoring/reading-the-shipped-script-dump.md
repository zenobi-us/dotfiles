---
type: Engine Mechanic
title: The game ships its own API reference, and guessing a signature is slower than reading it
description: The vanilla script dump under tools\redmod\scripts is authoritative for signatures, access modifiers and the real method set - and reading it is also how you find out whether the class you want to hook belongs to the game or to another mod, because a mod-declared class cannot be hooked at all.
tags: [redscript, authoring, signatures, wrapmethod, compile, scc]
status: stable
generated: { by: "claude", at: "2026-08-24T21:15:00-04:00" }
---

# The game ships its own API reference, and guessing a signature is slower than reading it

```
<game>\tools\redmod\scripts\
```

The vanilla script dump is **authoritative**: real signatures, real access
modifiers, the actual set of methods on a native class. It is shipped with the
game, so it is correct for the version installed rather than for whatever
version the forum post was written against.

Guessing a signature and compiling until it sticks is slower than reading, and
it produces code that breaks on the next patch for reasons nobody wrote down.

**Read the file for the class you are touching before writing against it.** For
a door that is `cyberpunk\devices\door\doorController.script` - which is how you
learn there are **nine** `ActionQuestForce*` verbs rather than the two everybody
copies. The two that get copied are the two that appeared in the first example
anyone published; the other seven are the ones that do what you actually wanted.

**Copy a pattern from a mod that already does it.** If something in the load
order already manipulates the thing you are about to manipulate, its approach is
proven against this game version in this environment. That beats a tidier design
you invented and have never seen run.

## You cannot hook another mod's redscript class from a standalone mod

This decides how every "fix somebody else's mod" job gets done, so establish it
**before** designing anything.

`@wrapMethod` / `@replaceMethod` work against **game** classes. Against a class
that another *mod* declares, they fail to compile. This was tested three ways on
one install - wildcard import, fully-qualified target, explicit single import -
and all three failed.

The one apparent precedent in that load order, a mod wrapping another mod's
controller, turned out to be **inside a `/* */` block**. Its author had hit the
same wall and commented the attempt out rather than delete it. A working example
that is not compiled is not a working example, and this is a genuinely easy
thing to misread when skimming somebody's source for a pattern.

So the clean, polite option - a small mod that hooks their behaviour without
touching their files - **is not available for mod-declared classes**. That is
why patching their file, or overriding it wholesale, is on the table at all.

**Check the class's owner before promising anything.** If it is declared in
another mod's `.reds`, say so in the first reply and move to the real options,
rather than discovering it three compile failures later. The options themselves
are in [Fixing a bug in someone else's
mod](/install/overriding-another-authors-mod); note that TweakXL is the one
layer with a partial-override escape, so if the thing to change is a *record*
rather than *behaviour*, none of this applies.

## `scc` exit 0 means it compiles, not that it works

Compile-test against the **real load order** rather than in isolation - other
mods declare classes and annotations that change whether yours compiles at all.

Then be precise about what the green result establishes. A successful compile
says the code is well-formed against the current script set. It says nothing
about whether the hook fires, whether the identifiers address anything, or
whether the effect is the one intended. **Say which of the two you have actually
established when handing a mod over**, because "it compiles" and "it works" are
routinely reported with the same sentence and only one of them was tested.

And a `.reds` on disk is not code the game is running until the bundle is
rebuilt - see [A .reds file on disk is not code the game is
running](/engine/compiled-script-bundle).

## Related

- [Addressing one specific world object from redscript](/authoring/addressing-a-world-object-from-redscript)
- [Fixing a bug in someone else's mod](/install/overriding-another-authors-mod)
- [A .reds file on disk is not code the game is running](/engine/compiled-script-bundle)
- [An archived redscript log is named for the run that replaced it](/engine/redscript-log-names-the-wrong-run)
