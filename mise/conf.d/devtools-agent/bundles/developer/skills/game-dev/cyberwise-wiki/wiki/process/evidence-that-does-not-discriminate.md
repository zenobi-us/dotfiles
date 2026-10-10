---
type: Process
title: Evidence that cannot tell your two hypotheses apart
description: Three cases agreeing with a rule prove nothing if the competing rule predicts the same winner for all three - the load-order version of this trap is built into how mods are named, and it manufactures confident agreement out of nothing.
tags: [evidence, hypothesis, verification, method, load-order, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T20:10:00-04:00" }
---

# Evidence that cannot tell your two hypotheses apart

Before collecting evidence for a rule, ask the only question that makes evidence
worth collecting: **for the case in front of me, do the competing explanations
predict different outcomes?** If they predict the same outcome, observing it
supports neither, however many times you observe it.

This is not a philosophy-of-science aside. On a modded install the two most
common competing rules are *correlated by construction*, so the trap is the
default state rather than an edge case.

## The worked case: two ordering rules that almost never disagree

The question was which of two rules decides a conflict: **earlier in the load
order wins**, or **later alphabetically wins**.

The evidence gathered was three real conflicts, and all three matched. That
looked like a result. It was not, because of a naming convention:

- Mods prefixed with punctuation - `#`, `!`, `_` - **sort early
  alphabetically**, and
- those same mods are, by convention and on purpose, **placed early in the load
  order**, because a prefix is what people use to mean "this one goes first".

So for the great majority of pairs, "earliest in the list" and "last
alphabetically" name **the same winner**. Three agreeing cases discriminated
nothing at all. The rule was confirmed by evidence that would have looked
identical had the rule been exactly backwards.

The actual answer is in [Earlier in modlist.txt wins, and nothing in the game
writes that
file](/conflicts/earlier-wins-and-nothing-in-the-game-writes-the-list) - and it
was settled by deliberately finding a pair where the two orders disagreed, not by
collecting a fourth agreeing case.

## How to find a discriminating case

1. **State both hypotheses as predictions**, in the same sentence shape. "A wins"
   / "B wins", not "ordering matters" / "names matter".
2. **Write down what each predicts for the case you already have.** If the two
   cells match, that case is not evidence and adding more like it does not help.
3. **Construct the disagreement deliberately.** Look for - or arrange - the pair
   where the predictions split: a mod placed late in the order whose name sorts
   early, a file whose timestamp and version disagree, a setting present in one
   store and absent in another.
4. **One discriminating case beats twenty agreeing ones**, and it is usually
   quicker to build than the twenty are to collect.

Where you cannot arrange a disagreement, say so and hold the question open.
"Untested, because every available case is consistent with both" is a real
finding and it stops the next reader from re-collecting the same useless
evidence.

## The other shape: two hypotheses predicting an identical filesystem

The same failure occurs without any confirming cases at all, when the *only*
evidence available is blind to the distinction.

An install holding three add-on folders from one mod page and no base folder is
equally consistent with "the main file was never installed" and "the page has no
main file". No amount of looking at the disk separates them, because the disk
does not record file categories at all - only the hosting platform does. That
case is [Whether a download is a main file, an add-on or a patch is only
answerable from the hosting API](/process/a-file-category-comes-from-the-api).

**When two hypotheses predict the same observation, the answer is not in that
observation.** The productive move is to change instrument - a different layer, a
different API, a live query - rather than to look harder at the same evidence.

## Where this bites on a modded install

Correlations that quietly destroy discrimination, all of them common:

| the two things that move together | what you cannot tell apart with them |
|---|---|
| name prefix and load-order position | alphabetical precedence vs list precedence |
| install date and list position | "newest mod broke it" vs "last-loaded mod wins" |
| a mod being large and a mod being a framework | "heavy mods crash" vs "the framework is the fault" |
| a mod being disabled and its files being absent | "not deployed" vs "deployed and inert" |
| a script mod added recently and the bundle being stale | "the mod is broken" vs [the code was never compiled in](/engine/compiled-script-bundle) |

Each pair is separable, but only by an observation chosen for that purpose.

## Related

- [An empty result is the absence of evidence, and it looks exactly like a finding](/process/an-empty-result-is-not-a-finding)
- [A failing round narrows nothing, and a clean round proves everything](/diagnosis/a-failing-round-narrows-nothing) - the bisect version, where an inconclusive round is mistaken for a negative one
- [Whether a download is a main file, an add-on or a patch is only answerable from the hosting API](/process/a-file-category-comes-from-the-api)
