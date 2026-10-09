---
type: Environment
title: A hosting site's adult flag is per page, author-set, and answers a different question than the one you asked
description: One flagged optional file flags an entire page, so a photo-mode utility half a load order depends on comes back flagged while a keyword heuristic misses more than half of the real ones. Propagating the flag across a shared id is what catches the innocuously-named add-ons, and it must name what it hid.
tags: [nexus, metadata, adult-content, filtering, reports, sanitising]
status: stable
generated: { by: "claude", at: "2026-08-25T11:20:00-04:00" }
---

# A hosting site's adult flag is per page, author-set, and answers a different question than the one you asked

Any tool that produces a shareable inventory of somebody's mods eventually has to
decide what to hide. The hosting site publishes an adult-content flag, and it is
the only complete signal available - but it is **not** the answer to "does this
mod contain sexual content", and treating it as one produces a filter that hides
dependencies and cannot explain itself.

## What the flag actually is

It is set **by the author**, **on the page**, and **one flagged optional file
flags everything on it**. Observed on one 846-mod install, all of these came back
flagged:

- a photo-mode utility that a large share of the load order depends on
- a whole-game texture upscale
- gore mods, flagged for blood rather than for sex
- body-conforming clothing, and pose packs
- a companion appearance mod whose own page says it contains **one** nude
  appearance out of 41

So the flag reliably answers *"did an author tick the box on this page"*. If the
question was "sexual content", the raw flag over-reaches; if the question was
"safe to show my colleague", it under-reaches on anything nobody thought to tick.

## A keyword heuristic is not a fallback, it is a different (worse) answer

Name-based detection found **30** on the install where the site's own flag found
**72**. The gap is structural rather than a matter of a better word list:

- Adult mods are named for a **place, a character or a euphemism** - a club, a
  venue, a braindance, a room. Anatomy words are the wrong instinct.
- Their add-ons ship with entirely innocuous names, and the thing that marks them
  is the parent page.

Without an API key, name matching is what is left, and the honest report says so:
*detected by name only; expect this to be substantially incomplete.*

## Propagation catches the add-ons and must name its casualties

Propagating a page's flag to **every mod sharing that id** is what catches the
innocuously-named add-ons - on one install it accounted for **7 of 17**
detections on its own.

It also hides innocent siblings. A plain base skin texture was hidden purely
because an adult edition shares its page.

Hiding is the right default; **hiding silently is not**. Print the propagation
list, so a person can see that this file was hidden because of that page and
disagree. An overridable decision the reader can audit beats a correct decision
they cannot see.

## Both directions of override are a requirement

A manual override file - force-adult and force-safe, matching on ids or
wildcards, beating every other signal including the site's flag - is not a
refinement. Without it there is no way to unhide the utility mod half the install
depends on, and no way to hide the one the author never flagged.

## Say which question the output answered

Label the column with what it means: *flagged by the author on the hosting page*,
not *adult*. The two sets are different, and a reader who does not know which one
they are looking at will trust it for the other.

## Related

- [Whether a download is a main file, an add-on or a patch is only answerable from the hosting API](/process/a-file-category-comes-from-the-api) - the same lesson about metadata that only the API carries
- [An inventory of somebody's install is personal data](/process/generated-output-is-personal-data)
- [A staging folder name is a record of the download, not of what is installed](/install/staging-folder-names) - where the id being propagated comes from, and how it goes wrong
