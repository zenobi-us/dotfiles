---
type: Engine Mechanic
title: Deleting a world node with ArchiveXL - the type must come from the sector, and one bad entry voids the whole file
description: A node's debugName lies about its $type, and a single wrong type reverts every deletion in the file with the log saying "No patches have been applied" - but nodeDeletions works against a path another mod added, which makes removing props from someone else's mod an override rather than a repack.
tags: [archivexl, xl, node-deletions, sectors, authoring, override, silent-failure]
status: stable
generated: { by: "claude", at: "2026-08-24T21:40:00-04:00" }
---

# Deleting a world node with ArchiveXL - the type must come from the sector, and one bad entry voids the whole file

`nodeDeletions` in an `.xl` removes a placed object from a world sector without
touching any archive. Two rules, both learned by breaking a working file.

## 1. `type` must be the node's real `$type` from the sector

Not the type you would infer from what the thing is, and **not the type its
`debugName` suggests**. Mesh props are frequently `worldMeshNode` rather than
`worldStaticMeshNode`, while their `debugName` reads `[Static Mesh] ...` - which
is not a hint, it is a wrong answer sitting in the field a human is most likely
to read.

**Generate the type from the sector data. Never type it by hand.** There is no
convention to derive it from and no feedback when it is wrong.

## 2. One bad entry voids the entire sector patch

A single wrong type does not skip that one deletion. **Every deletion in the
file reverts**, and the log says:

```
No patches have been applied
```

So the symptom of one mistyped node is "the whole mod stopped working" - nothing
about it points at the one entry that broke, and the deletions that were correct
disappear alongside it.

This is the same blast-radius shape as [One indentation error disables every
record in a TweakXL file](/authoring/a-yaml-error-disables-the-whole-file): the
parser's unit is the file, so file size is a bet, and a log read is the cheapest
possible check.

**Re-read the ArchiveXL log after every sector-patch edit** - not only when
something looks wrong. Nothing else reports this.

## It works against another mod's sector, not just a vanilla one

`nodeDeletions` is documented against vanilla sector paths, but pointing it at a
path a **mod** added works too - confirmed in game by deleting props from a
modded interior.

That is worth knowing for what it saves. Removing objects from somebody else's
mod needs **no repacking of their archive at all**:

- Ship a companion `.xl` that sorts after theirs.
- Their files are never touched, so the edit **survives every update** of the
  mod it modifies.
- Removing your change is one toggle.

Editing their archive instead is undone by the next update, and has to be redone
by hand every time.

This is the same lever as the `zzz_` TweakXL override, in a different layer:
where a format lets you override a *part* rather than a *file*, take it, and
give the override a **retire condition** so it does not quietly keep winning
after the author fixes the thing themselves. See [A TweakXL record is resolved
last-wins](/authoring/tweakxl-records-are-last-wins) for that discipline and
[Fixing a bug in someone else's
mod](/install/overriding-another-authors-mod) for the general decision.

## Related

- [One indentation error disables every record in a TweakXL file](/authoring/a-yaml-error-disables-the-whole-file) - the same whole-file blast radius in the tweak layer
- [A TweakXL record is resolved last-wins, and that is the lever for everything else](/authoring/tweakxl-records-are-last-wins)
- [Fixing a bug in someone else's mod](/install/overriding-another-authors-mod)
- [Resource patching runs on the new-game path only](/engine/archivexl-resource-patching) - the sidecar's other in-place mechanism, with the same one-bad-target silence
