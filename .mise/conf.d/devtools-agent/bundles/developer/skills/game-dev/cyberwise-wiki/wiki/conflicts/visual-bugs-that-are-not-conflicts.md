---
type: Diagnostic Method
title: Not every visual mismatch is a conflict, and the scanner agreeing with you is not evidence
description: A conflict checker reporting zero conflicts does not mean two mods agree. Appearance overrides repoint a body part at a different texture set with no hash collision; a coverage gap leaves content nothing ships; and an archive full of another mod's namespace is a patch layer that is inert without its base.
tags: [textures, appearance, coverage-gap, patch-layer, conflicts, diagnosis]
status: stable
generated: { by: "claude", at: "2026-08-24T21:00:00-04:00" }
---

# Not every visual mismatch is a conflict, and the scanner agreeing with you is not evidence

**A conflict checker showing zero conflicts does not mean two mods agree.** It
means no two archives claim the same hash - which is a much narrower statement,
and three common classes of visual bug sit entirely outside it.

When a body part looks wrong, resolve **which file actually supplies it** before
touching load order.

## Appearance overrides change the answer without contesting a file

A mod can override an appearance resource such as
`player_base_bodies\appearances\*.app` and point a body part at an entirely
different texture set. No hash collision on the textures themselves, completely
different look. The contested file is the appearance definition, not the thing
that visibly changed.

## A coverage gap has no contested file at all

A "skin tone" patch may only ship torso and arm textures. The legs then keep
whatever the underlying body mod supplies, and the two will never match. **No
load order change can fix missing content** - see
[what reordering can and cannot fix](/conflicts/what-reordering-can-and-cannot-fix).

The method here is not a scan, it is a listing: **extract the suspect archives
and read their actual file lists.** A skin patch that ships torso and arm
textures but no leg textures cannot ever match the legs, and reading the file
list settles it in seconds where a conflict report never will.

## An archive full of somebody else's namespace is a patch layer

Extract it and look at the **path prefixes**. Vanilla content lives under
`base\characters\...`, `base\quest\...` and similar. Prefixes like:

```
base\4k\...
base\v_textures\...
base\characters\player\femme\...        (a body mod's own namespace)
```

are not vanilla. An archive full of them is a **recolour or patch layer over
another mod**, not a standalone texture - and it is **inert without that mod
installed**. Installing it alone produces no change and no error, which reads
exactly like a losing conflict and is not one.

The same reading answers "what is this archive actually for?" faster than any
mod page will.

## Related

- [An archive that contributes nothing](/conflicts/an-archive-that-contributes-nothing)
- [Reading an .archive index without any tooling](/conflicts/rdar-index-is-plain-data)
