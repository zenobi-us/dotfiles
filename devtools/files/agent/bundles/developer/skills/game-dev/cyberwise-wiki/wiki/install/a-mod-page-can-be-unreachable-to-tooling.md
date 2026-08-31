---
type: Process
title: A mod page's own text may be unreachable to automated fetching, so plan the research around asking for a paste
description: Hosting sites commonly block programmatic requests, while search engines still surface mirrored copies of the same text - which makes the page look retrievable right up to the moment it is not. This failed identically in sessions a year apart.
tags: [mod-hosting, research, fetching, method, verification]
status: stable
generated: { by: "claude", at: "2026-08-25T00:22:00-04:00" }
---

# A mod page's own text may be unreachable to automated fetching

Mod hosting sites frequently refuse automated requests - bot protection,
rate limiting, a login wall, a challenge page. The request does not return the
description; it returns a block page, an error, or nothing useful.

This is ordinary and expected behaviour for a site carrying downloads at scale. It
is not hostility, it is not a fault to route around, and it is not worth naming a
particular site over - the same measure appears across hosts and changes without
notice.

## What makes it waste time anyway

**Search engines still surface the content.** Mirrors, aggregators, translated
copies and scraped listings all carry recognisable chunks of a mod's description,
so a search result set looks exactly like a page that can be read - right up to the
point where fetching the canonical URL fails.

That gap between "the text is findable" and "the page is fetchable" is what burns
the turns. The failure repeated **identically in sessions roughly a year apart**,
which is the reason it is written down: it is not a transient outage, it is the
steady state.

And the mirrored copy is not a safe substitute. It is undated, frequently a
scrape of an older revision, and it is the same problem as
[reading a staging folder name instead of the file](/install/staging-folder-names) -
a plausible artefact standing in for the authoritative one.

## What to do instead

**Plan the research so it does not depend on a fetch.**

1. **Ask for a paste.** The person at the machine has the page open, or can open
   it in one click. "Paste me the description" is a five-second request and
   returns the authoritative current text.
2. **Use the hosting API for what the API covers.** File lists, categories,
   versions and dependencies are available programmatically even when the page
   body is not - see
   [whether a download is a main file or an add-on](/process/a-file-category-comes-from-the-api).
   The API answers structural questions; the prose is what needs the paste.
3. **Read what is on disk.** For most questions the mod's own files answer better
   than its description does, and the description
   [describes intent rather than the installed build](/install/the-deployment-manifest)
   in any case.

## The wider point

**Do not build a plan whose first step is a fetch that may not be permitted.** A
research approach that assumes arbitrary pages are readable will fail at the least
convenient moment and, worse, will fail *partially* - returning enough scraped
fragments to look like it worked. Decide up front where each fact is coming from,
and where the answer is "the mod page", make asking the human the plan rather than
the fallback.

## Scope

Behaviour of mod hosting in general, observed twice about a year apart. Specific
sites' policies change, and a fetch that fails today may succeed next month; the
planning rule holds either way.
