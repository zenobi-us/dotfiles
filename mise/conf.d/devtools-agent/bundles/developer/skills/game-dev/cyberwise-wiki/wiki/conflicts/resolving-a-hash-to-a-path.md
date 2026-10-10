---
type: Diagnostic Method
title: A hash you cannot name is still a conflict, and a miss is information
description: Collision detection needs no path dictionary at all. When you do need a name, a hash the base-game table does not know is usually a mod's own resource rather than a lookup failure - and Codeware's dictionary resolved only about 20% of archive entries on one large list, with almost no texture paths in it.
tags: [archive, hashing, dictionary, codeware, wolvenkit, conflicts]
status: stable
generated: { by: "claude", at: "2026-08-24T21:00:00-04:00" }
---

# A hash you cannot name is still a conflict, and a miss is information

**Collision detection needs no dictionary at all.** The same hash appearing in
two archives is a conflict whether or not you can name the file. Prefer working
from collisions when identifying culprits, and reach for path resolution only
when you need to explain *what* is conflicting to a human.

That ordering matters because every dictionary available is incomplete, and
treating a miss as a failure sends the diagnosis somewhere it should not go.

## A miss is a finding, not a gap

A hash table built from the base game covers **the base game**. A hash it does
not know is therefore usually a **mod's own resource** - a depot path the game
never had - rather than a lookup that failed.

Say which of the two you mean. "Unknown hash" and "not a base-game file" lead
somewhere completely different: the first invites more lookup, the second
already answers the question.

A complete base-game table is achievable - one derived from a published
resource-path database covers **751,710 paths, about 99.97% of base-game and EP1
files** for patch 2.31, with no credentials, no other mod installed and no
network. At that coverage, a miss is very strong evidence of mod-authored
content.

## The older dictionaries, and where they stop

Both are incomplete in ways that are not obvious from using them.

- **Codeware's `KnownHashes.txt`** - *only if Codeware is present.* It ships at
  `red4ext\plugins\Codeware\Data\` under the game root, and Codeware is a **mod
  dependency, not part of the game**, so plenty of installs simply do not have
  it. Roughly 127k paths. **On one large mod list it resolved only about 20% of
  archive entries.** Its coverage is mesh, entity and rig heavy: it contains
  **almost no texture paths**, and no scene, questphase or audio paths. A
  *negative* result from it is only meaningful for a path already confirmed to
  be in the dictionary - which for textures is almost never.
- **WolvenKit** ships its own, broader dictionary. Where it is installed,
  extracting an archive and listing the output is the fastest way to see real
  paths.

**Assume neither is available until you have checked.** Neither is required for
collision work, ownership, or "what is in this archive" by hash.

## Answering "which mod owns file X?"

1. Hash the depot path -
   [FNV1a-64, with the traps](/conflicts/rdar-index-is-plain-data).
2. Scan every archive index for that hash.
3. Sort the owners by whatever governs order **on that install**: `modlist.txt`
   position where the file exists, alphabetical where it does not, the manager's
   own list where the manager owns ordering.
4. Earliest wins.

Step 3 is the one that gets skipped. See
[earlier wins, and nothing in the game writes that
list](/conflicts/earlier-wins-and-nothing-in-the-game-writes-the-list) before
assuming which model is in play.
