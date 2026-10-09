---
type: File Format
title: modlist.txt has no comment syntax, and treating "#" as one fabricates faults
description: A leading # is a legal archive filename character that mods use deliberately to sort early. A parser that strips ^# as comments drops real entries and then reports every one of them as an unlisted archive - 60 fabricated faults on one 727-archive install, where the true count was zero.
tags: [modlist, parsing, load-order, false-positive, conflicts]
status: stable
generated: { by: "claude", at: "2026-08-24T21:00:00-04:00" }
---

# modlist.txt has no comment syntax, and treating "#" as one fabricates faults

**Every non-blank line in `modlist.txt` is an archive filename.** There is no
comment marker, and `#` is a perfectly legal *leading character* in a filename.
Mods use it precisely because it sorts early:

```
###-NovaScanner.archive
#PetTheCat.archive
!!!MyRetexture.archive
~SomeOverride.archive
```

Filtering `^#` as comments - the reflex in almost every config parser, and the
default in several - silently drops those entries from the "listed" set. Every
dropped archive then appears as **on disk but unlisted**, which is a
serious-sounding fault, because an unlisted archive really does sort last and
lose.

On one 727-archive install this fabricated **60 unlisted archives where the true
number was zero**. It also inflated the apparent list-length discrepancy by the
same amount, so the numbers looked internally consistent while being entirely
wrong. That is the dangerous part: the report does not look broken, it looks
alarming.

## Two cheap sanity checks before believing any unlisted count

- **Do the totals reconcile?** Listed entries plus genuinely-unlisted archives
  should be close to the file count on disk. If the parse says 668 entries for
  727 archives, 61 lines went somewhere and the destination is worth finding
  before the report is written.
- **Are the offenders suspiciously uniform?** If every "unlisted" archive shares
  a leading character, the finding is the filter, not the load order.

## The general form

An empty or surprising result is the *absence* of evidence, and it looks
identical whether the thing did not happen or the parse never saw it. Prove the
parse ran over what you think it ran over before interpreting what came out.
