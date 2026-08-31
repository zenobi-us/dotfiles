---
type: Diagnosis
title: When halving stops paying, write a guard
description: Bisection answers which mod. It never answers what that mod is doing. A guard is a throwaway one-function mod that logs the single value separating two hypotheses - and in Cyberpunk it goes in CET rather than redscript, because a redscript guard that fails to compile disables every .reds mod on the install.
tags: [guard, cet, redscript, instrumentation, bisect, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T21:10:00-04:00" }
---

# When halving stops paying, write a guard

Bisection answers *which mod*. It does not answer *what that mod is doing*, and
sometimes the second question is the interesting one: the suspect is confirmed,
but the state that makes it fail happens inside a function nothing logs.

A **guard** is a throwaway mod whose only job is to watch one place and write
down what it sees. Not a fix. One function, one log line, deleted afterwards.

The worked example comes from another game's twenty-round bisect. A guard wrapped
the one call that was failing, skipped the operation when its precondition was
empty, and appended a line naming the value and its size. The log line

```
wanted states[0] but has 0 state(s)
```

settled a root cause that four rounds of halving had only circled - because the
number nobody could see was the whole answer.

## Design rules, in the order they matter

- **Log the value that separates your hypotheses**, not "reached here". If two
  explanations predict different numbers, print the number. A guard that only
  proves the code ran has told you what the crash already told you.
- **Say in the mod itself that it is containment, not a fix.** If it skips the
  failing operation to keep the game up, the README says so in as many words.
  Guards get forgotten and then get blamed for behaviour six months later.
- **Expect to ship it twice.** The first log line is usually not quite the right
  one. Version it, refine what it prints, redeploy. That is normal, not failure.
- **Register it** as a patch against the install, and delete it when the
  investigation ends. An unregistered guard is an invisible mod that survives
  every future update.
  [Fixing a bug in someone else's mod](/install/overriding-another-authors-mod)
  covers why an unregistered override is the dangerous kind.

## Two Cyberpunk-specific constraints decide how you build one

**Prefer CET over redscript.** redscript is an all-or-nothing gate: a guard that
fails to compile silently disables **every** `.reds` mod on the install, which is
a spectacular way to make a bisect worse. A broken CET mod fails alone, and CET
writes a per-mod log at

```
bin\x64\plugins\cyber_engine_tweaks\mods\<name>\<name>.log
```

with no extra plumbing.

**You cannot wrap another mod's own classes.** `@wrapMethod` and `@replaceMethod`
work on classes the *game* declares, not on ones another mod declares. So a guard
usually has to sit on the game-side function the suspect calls into, rather than
on the suspect itself. Establish which is which before promising anybody a guard.

## Related

- [A failing round narrows nothing](/diagnosis/a-failing-round-narrows-nothing) - the point at which halving has told you everything it can
- [Reading live game objects from CET Lua without losing the row that mattered](/engine/cet-lua-runtime)
- [A .reds file on disk is not code the game is running](/engine/compiled-script-bundle) - the compile gate a redscript guard sits behind
- [A workaround gets written down and outlives the fault it was written for](/process/a-workaround-outlives-the-fault) - why a guard has to say in its own text that it is containment
