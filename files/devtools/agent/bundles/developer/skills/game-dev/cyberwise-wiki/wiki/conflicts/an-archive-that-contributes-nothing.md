---
type: Diagnostic Method
title: An archive can be installed, enabled, and contributing nothing
description: An archive is inert when every hash it carries is also carried by something earlier in the list. Detecting it needs only the archive indexes - no decompression, no dictionary - and runs over 700 archives in under ten seconds. Not every inert archive is a bug, and an inert archive never means an inert mod.
tags: [inert, load-order, archive, hashes, conflicts, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T21:00:00-04:00" }
---

# An archive can be installed, enabled, and contributing nothing

**An archive is inert when *every* hash it carries is also carried by something
earlier in the load order.** It is present, enabled, deployed, and contributing
nothing at all. There is no error and no in-game sign - which is what makes this
the most common silent failure on a large list.

This is the distinction that matters: an archive *losing conflicts* still
supplies the files nobody contested. An *inert* archive supplies none.

## The detection is three steps and needs nothing installed

1. Parse each archive's index into a hash set - see
   [an .archive index is plain structured data](/conflicts/rdar-index-is-plain-data).
2. Walk the ordering in order, assigning each hash to the **first** archive that
   claims it.
3. Any archive that ends up owning zero of its own hashes is inert.

No decompression, no path dictionary, no WolvenKit. **The same hash appearing in
two archives is a conflict regardless of whether you can name the file**, so
collision work does not need path resolution at all - that is only needed to
*explain* what is conflicting.

It is cheap at any size: on one large install ~700 archives parsed in under ten
seconds, index-only. Twenty archives are instant, so there is no list too small
for this to be worth running.

## The mod manager was never going to warn you

A manager flags a conflict when two mods deploy the **same path** into the game
folder. Every collision described here happens **inside** the archives, in their
file tables, which no manager reads.

So forty-seven differently-named `.archive` files all carrying the same internal
resource hash produce **zero** manager warnings, correctly, while only one of
them can be live. *"The manager didn't warn me"* is not evidence of no conflict;
it is a statement about deployment paths.

That specific case is worth carrying, because the consequence is not cosmetic.
The winning copy was one of four mods writing one animation resource, and the
companion index file that addresses those animations **by number** ships with the
largest of them. If a small pack wins instead, every index past its range
resolves to the wrong entry or to nothing - a fault that looks like a broken mod
and is a load-order outcome. When several archives claim one resource, prefer the
merged superset and remove the component packs rather than reordering them.

## Not every inert archive is a bug

Two mods can ship an identical resource, in which case the loser is merely
redundant and nothing is wrong.

On a short list you can simply remember which those are. Once the scan is
something you re-run regularly, record them as an explicit allow-list, with the
reason - otherwise the genuine problems drown in a standing list of known-fine
noise, and a report nobody reads is the same as no report.

## An inert ARCHIVE is not an inert MOD

Before concluding anything about the mod, check the rest of its payload. A mod's
real content may be a CET Lua file, a spawner registration, a `.reds` script or
an `.xl` - **none of which appear in an archive conflict scan at all.** An
archive carrying only a shared localisation string is inert by design while the
feature the player uses lives in the scripts beside it.

So an entry recording "this inert archive is fine" should record *why being
inert is fine* and nothing more. It must never conclude the mod can be removed:
that conclusion requires listing the mod's whole payload, not its archive.

## Related

- [Every newly installed archive starts at the bottom of the stack](/conflicts/every-new-archive-starts-last) - the usual reason something became inert
- [Making one mod win can kill a third mod nobody mentioned](/conflicts/a-precedence-change-creates-casualties)
- [Two load-order systems, and a scan only sees one](/engine/two-load-order-domains) - REDmod archives are outside this scan
