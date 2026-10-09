---
type: Process
title: Documenting a large mod list without producing a report nobody can trust
description: A documentation pass over a hundred mods is a coordination problem before it is a research problem - how to partition the work, what to do when two writers collide, and the four ways a confident article turns out to be wrong.
tags: [documentation, wiki, agents, coordination, verification, method]
status: stable
generated: { by: "claude", at: "2026-08-24T18:30:00-04:00" }
---

# Documenting a large mod list without producing a report nobody can trust

Writing one article per mod across a load order of eighty or more is not eighty
small tasks. It is a coordination problem wearing a research problem's clothes,
and every failure below was paid for once already.

The whole thing turns on one property: **a documentation set is worth what its
weakest claim is worth.** A reader who finds one article describing a mod they
do not have, or one identifier pointing at somebody else's work, stops trusting
the other seventy-nine - and they are right to. Everything here is in service of
not spending that credibility.

## Partition by filename ownership, never by theme

Give each writer an **explicit list of the files or articles it owns**, and let
no two lists overlap. Do not partition by subject: "you take the quest mods, you
take the economy mods" sounds tidy and is the single most expensive mistake
available.

**It fails because mods do not have one theme.** A mod that adds gigs *and*
changes what they pay is a quest mod and an economy mod. It lands in two briefs;
two writers research it independently; both write to the same path; and the one
that finishes second silently overwrites the first. Nothing errors. The file
looks finished. The research that went into the first version is simply gone,
and there is no record that it ever existed.

That happened on a live pass. The cost was not the duplicated effort - it was
that the loss was invisible, so it was found by accident rather than by anything
reporting it.

A filename partition has none of that ambiguity. It is checkable before any work
starts (intersect the lists), and a writer who discovers its mod belongs
somewhere else reports that instead of writing there.

## When two writers have collided, merge onto whatever landed second

The repair is **additive, and it runs in one direction**. Take the version
currently on disk, and fold the missing findings from the earlier one into it.

Restoring the first version over the second repeats the original bug with the
roles swapped, and now nobody knows which parts were lost. If the earlier
version is recoverable, treat it as a source to merge from, not as the truth to
restore.

## A stub is honest; a padded article is not

Record only what is establishable from disk. **Let a short answer be a complete
answer.**

- "This mod exposes no settings mechanism" is a finding. It took work to
  establish - the defaults file, the settings framework, the mod's own config -
  and it saves the next reader all of it.
- "One archive of retextures, no scripts, no tweaks" is a complete description
  of a mod that is one archive of retextures.

The alternative is padding: a paragraph of plausible narrative about what a mod
"presumably" does, indistinguishable in tone from the articles that were
actually researched. That is worse than a stub, because a stub advertises what
it does not know and padding does not.

## Verify every derived identifier before building on it

An id derived from a folder name, a filename, or a URL fragment is a **claim,
not a fact.** Before it goes in an article, compare it against the authoritative
source - the mod page's own name, or whatever the platform actually returns for
that id.

**On disagreement, drop the link and mark the article `status: draft`.** Say in
the article that the identifier could not be confirmed. Do not ship a link that
resolves to something else.

Four bad derivations were caught this way in a single pass. The reason this
warrants a rule rather than a habit: an unverified id **fails silently and
points every future lookup at another author's work.** The link resolves. The
page loads. It is simply not the mod being described, and nothing in the article
says so.

Derivations that look authoritative and are not:

| source | why it lies |
|---|---|
| a staging folder name | encodes what the *installer* recorded, and hand-added mods carry any name at all |
| a filename inside an archive | authors name files for themselves; a dependency can ship inside an unrelated mod |
| an earlier article in the same set | inherits the error and launders it into a second citation |
| a name recalled from earlier in the session | the install changes underneath; a list from twenty minutes ago is not evidence about now |

## Say what you did not verify, in the article

One plain sentence, in the article itself, not in a covering note that gets
separated from it: *"The settings mechanism was not opened; this describes the
shipped defaults only."*

`status: draft` carries the same signal to a machine, and both are cheap. A note
that turns out to be false is worse than no note, and the difference between the
two is almost always a sentence somebody chose not to write.

## Never name an uninstalled mod as if it were installed

Check presence against the live install, not against a list, immediately before
writing a name into anything a person will read.

The sources that get this wrong all look authoritative: a bisect manifest is a
snapshot of a past state *by design*; a backup folder holds things that **were**
installed; a load order file keeps slots for disabled mods on purpose; a
manager's list shows staged mods that were never deployed.

The consequence is out of all proportion to the error. "That mod isn't even
installed" is the fastest way for a reader to stop believing everything else,
and it costs one line to avoid.

## Do not let several writers edit a shared index or log concurrently

Index files and logs are the natural collision point, because *every* writer has
a reason to append to them. Concurrent appends to one file produce interleaved
writes, lost entries, or a last-writer-wins truncation - the same invisible loss
as the theme-partition failure, in the one file whose job is to tell you what
happened.

**Have each writer report its counts and its list of finished articles, and let
a single reconciling writer produce the index and the log entry.** Reconciliation
is fast; it is reading a handful of numbers. Recovering a clobbered index is not.

## Coverage claims must match reality

An index that says "all 84 mods documented" when 71 have articles is not an
optimistic rounding. It is the specific failure that makes a documentation
effort quietly stop being trusted, because it is discovered by a reader looking
for the thirteen, and after that every count in the set is suspect.

Count the files. State the number that is true, and state what is missing:
*"71 of 84 documented; the remaining 13 are listed in the index and have not
been opened."* An honest gap is a to-do list. An overstated coverage claim is a
retraction waiting to happen.

## Related

- [A settings file the game rewrites answers "what is set", never "what is default"](/patterns/live-state-is-not-defaults)
- [A mod's shipped defaults are not proof a human chose anything](/patterns/defaults-can-be-written-by-code)
