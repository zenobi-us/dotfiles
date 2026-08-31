---
type: Environment
title: A staging folder name is a record of the download, not of what is installed
description: Managers update a mod in place and keep the original folder name, so the version in the name is the version first downloaded - and deriving a site id from the same string has two real parse bugs, both of which fail silently onto another author's mod page.
tags: [vortex, staging, versions, nexus, identifiers, verification]
status: stable
generated: { by: "claude", at: "2026-08-24T20:20:00-04:00" }
---

# A staging folder name is a record of the download, not of what is installed

A staging folder name looks like structured data - display name, site id,
version, timestamp - and it is treated as such constantly. It is a record of
**one download**, written once, and two different things are read out of it that
it does not reliably support.

## The version in the name is the version it was first installed as

**Managers update a mod in place and keep the original folder name.** The files
are replaced; the string is not. A folder reading `...-1-2-3-...` can contain
1.4.0 and nothing about it looks wrong.

The sources of truth, in order of preference:

1. **the framework's or mod's own log line reporting its version** - it is the
   running code stating what it is
2. **a hash of the file**, compared against a known release
3. **the file contents** - a version constant in a script, a manifest inside the
   archive

Never the folder name. And never a filename either: a cancelled or duplicated
download can leave a zero-byte file whose name says everything and whose content
says nothing.

## Deriving a site id from the name is a claim, not a fact

The convention encodes the id, so the id is parsed out of it. The parse has two
failure modes, both found on real load orders, and **both fail silently because
the wrong id is a real page** - the link resolves, the page loads, and it is
somebody else's work.

**Right-anchoring greedily walks past the id onto the version.** A greedy prefix
match on `ArchiveXL-4198-1-26-1-<stamp>` yields **26**. Measured on one load
order, this pattern broke **24 of 810** names.

**Leftmost matching picks a number out of the mod's own name.** The first
`-<digits>-` in the string is tried before the real id, and mod names contain
model numbers and version fragments:

```
Oranje3 Militech Legatus SPD-10-23289-1-0-2-<stamp>      -> 10,  not 23289
AMM Facial Expressions Overhaul 3-7-25-20108-1-1-<stamp> -> 25,  not 20108
```

A minimum-digit floor on the id fixes both of these cheaply, at the cost of no
longer matching a genuine short id - which is the right trade, because a
weakened match can be *labelled* as weak and a confident wrong answer cannot.

**The floor is a heuristic, not a guarantee.** A derived id stays a claim until
it is checked against the authoritative name. Several derived ids have been
confirmed wrong this way, each of them pointing at another author's software.
The verification rule and what to do on disagreement:
[documenting a large mod list](/process/running-a-documentation-pass).

Two more things the name does not support:

- **A mod installed from a local archive, or built by hand, has no id at all.**
  A name that does not match the convention is *unknown provenance*, not a parse
  failure - report the id as absent rather than reaching for a looser pattern.
- **A numeric prefix is usually a modular mod's part number** (`01 - ...`),
  which is information worth keeping: other parts exist, and a missing texture
  may be in one of them.

## An apparent id mismatch is usually one page with several archives

When a derived id resolves to a page whose name does not match the folder, the
first hypothesis should not be "the id is wrong". **One page frequently offers
several separately-downloadable archives**, each installing under its own name -
variants, optional add-ons, patches for other mods - and every one of them
carries the same id.

**Read the page's own description before ruling an id wrong.** Discarding a
correct id because the names differ costs the only reliable link the mod has,
and replacing it with a "corrected" one is how a wrong id gets published in the
first place.

## Related

- [What the game directory shows you depends on how the mods got there](/install/how-the-install-is-assembled) - where the convention comes from, per manager
- [The deployment manifest is the inventory](/install/the-deployment-manifest) - what is deployed, as opposed to what was downloaded
- [A missing-requirement report is wrong in both directions](/install/auditing-dependencies)
