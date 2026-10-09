---
type: Process
title: An empty result is the absence of evidence, and it looks exactly like a finding
description: Nothing found and nothing run produce identical output, and so do nothing there and nothing in the one layer you searched - three real diagnoses went wrong on that ambiguity, and each is closed by a check that costs one line.
tags: [evidence, verification, method, diagnosis, negatives, tooling]
status: stable
generated: { by: "claude", at: "2026-08-24T20:05:00-04:00" }
---

# An empty result is the absence of evidence, and it looks exactly like a finding

A search that returns nothing, a command that prints nothing, and a command that
never executed are the same thing on screen. So are "this setting is not there"
and "this setting is not in the one file I opened". Every case below is a real
diagnosis that went wrong on one of those collisions, and every one is closed by
a check cheap enough to run every time.

**The rule underneath all of it: before you interpret an absence, establish that
you were in a position to observe a presence.**

## Prove the command ran before you interpret the nothing

Three separate failures, all with the same shape - a step failed silently, the
downstream reader saw empty output, and empty output was read as a result.

| what actually happened | what it looked like | what was concluded |
|---|---|---|
| a line beginning `#` was treated as a comment by a parser whose format has no comment syntax | dozens of entries vanished from the parse | **61 fabricated faults**, none of them real |
| a path containing a space made a process launch fail without an error | the launched thing was simply never there | "the platform cannot do this" - a limitation that does not exist |
| a redirect matched nothing, so a supposed dry run had no output to divert | the dry run printed nothing unusual | the run was treated as a preview; **it had written straight into the real target** |

The third is the expensive one, because the silent failure did not merely produce
a wrong answer - it produced a wrong *action*, on a real file, while the operator
believed nothing was being written.

**What to check, in order:**

1. **Capture stderr, and read it.** Discarding it is what makes all three
   invisible. A step that fails loudly is not a problem; a step whose failure you
   threw away is.
2. **Check the exit code**, separately from the output. A tool that failed and a
   tool that found nothing both print nothing and differ here.
3. **Confirm the thing exists afterwards.** If you launched a process, ask
   whether the process is running. If you wrote a file, stat it.
4. **Assert a positive control.** Before believing "no matches", run the same
   command with a pattern you *know* must match - a line you can see with your
   own eyes. If the control also returns nothing, the search is broken, not the
   subject.

The positive control is the one people skip and the one that catches the most.
It converts "I found nothing" into "I found nothing, and the same search finds
the thing I planted", which is a different and much stronger sentence.

## A negative is only as wide as the layer you searched

**"It does X" and "it does nothing" are claims of completely different size.**
The first needs one piece of evidence. The second needs every place the thing
could have acted to be open and empty, and one search over one file cannot carry
it.

The worked case: a setting was declared absent because it was not in a mod's own
config, and the claim was stated as though it were absent everywhere. It was not.
The control existed in the game's own option registry, which no amount of reading
the mod's files would ever have shown.

Before writing a negative, **name the layers**. On a modded install a control can
reach the game through at least:

- the mod's own config or settings store
- the game's own option registry
- a second control in the same mod writing into the same subsystem
- a native plugin doing it in compiled code, where no text search reaches it

Until those are open, the honest report is **"nothing in `<layer>`"**. That
sentence is publishable, checkable, and still useful; "nothing" is a claim you
have not earned. The engine-side version of this, with the registry that settles
it, is [The game's own option registry outranks any mod's account of an engine
setting](/engine/option-registry-is-the-authority).

The same shape applies to absence in code. Establishing that a 4,000-line script
contains no reference to a subsystem means enumerating the spellings the
reference could take, not searching the one you thought of -
[Prove absence in a file too large to read](/process/proving-absence-in-a-huge-file).

## Say the scope FIRST, because the qualifier is what gets forgotten

A negative that is correctly scoped in your head can still be remembered
unscoped, and the sentence order decides which.

Worked case: the honest answer was *"it cannot be done as a **hook** mod - here
is why, and here is the override route instead"*. What was said opened with the
unqualified **"it can't be done as a mod"**, with the scope arriving later in the
paragraph. Weeks on, what came back was *"you said it couldn't be done that
way"*, and the option that had in fact been offered was gone from the record.

**Lead with the scope, not with the negative.** "Not through X, but Y works" is
the same claim as "you can't do X, though Y works" and it survives retelling,
because there is no point in the sentence at which it reads as a flat no.

## List the evidence behind a flag, or it cannot be checked

**"60 archives are unlisted" is unfalsifiable. A flag that names the 60 is
checkable at a glance.**

That is not a stylistic preference about report formatting. Naming the sixty is
precisely what exposed the bug: **every one of them began with the same
character**, which no genuine fault distribution ever does, and which pointed
straight at the tool's own filter rather than at the install. A count alone hides
that pattern perfectly. Sixty is a plausible number of faults; sixty names
sharing a prefix is obviously an artefact.

So for any aggregate finding:

- **Print the members, or a sample plus the total.** A finding with no
  enumeration cannot be spot-checked, and anything that cannot be spot-checked
  will eventually be believed while wrong.
- **Look at the list yourself before reporting it.** The tells are visible in
  seconds: a shared prefix, a shared directory, a shared extension, consecutive
  entries, exactly the count of some other set.
- **A suspiciously round or suspiciously total number is a tell.** "All of them"
  and "none of them" are far more often a broken filter than a broken install.

## Never assert presence you have not confirmed either

The mirror of the whole article: an *absence* needs the search to have run, and a
*presence* needs to have been checked against the live system rather than
recalled. A name taken from a bisect manifest, a backup folder, a load-order file
with disabled slots, a manager's staging list, or from earlier in the same
session is a claim about a past state, and the install changes underneath it.

That failure and its table of lying sources are covered in [Documenting a large
mod list without producing a report nobody can
trust](/process/running-a-documentation-pass); the cost is disproportionate,
because "that isn't even installed" makes a reader stop believing everything else
in the same report.

## What was not verified

The three silent-failure cases are recorded from real diagnoses as they were
written up at the time; the exact commands were not re-run to reproduce them for
this article. The mechanism in each - a discarded error stream - is not in doubt.

## Related

- [Evidence that cannot tell your two hypotheses apart](/process/evidence-that-does-not-discriminate) - the other way a check produces confident nothing
- [A capacity read from the wrong API comes back plausible](/process/a-capacity-read-from-the-wrong-api) - the same silence, in a value rather than an absence
- [modlist.txt has no comment syntax, and treating "#" as one fabricates faults](/conflicts/modlist-has-no-comment-syntax) - the install-side account of the parse failure
- [A modlist entry with no archive is usually not a fault; an archive with no entry always is](/conflicts/an-entry-and-a-file-can-disagree)
