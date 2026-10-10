# resource-paths-2.31.cwpx

A lookup table of **751,710 resource paths** for Cyberpunk 2077 2.31 including
Phantom Liberty, keyed by the FNV-1a 64-bit hashes that `.archive` files index by.

## Attribution

Derived from the **Cyberpunk 2077 resource-path database** by **VanStorm**:

- Source: <https://github.com/VanStorm/Cyberpunk-Modding>
- Author: VanStorm — <https://github.com/VanStorm>
- Licence: **Creative Commons Attribution 4.0 International (CC BY 4.0)**
  — <https://creativecommons.org/licenses/by/4.0/>

CC BY 4.0 asks that changes be stated. **What was changed:** the data is
unmodified in content — same hashes, same paths, nothing added, removed or
corrected. Only the *container* differs. The upstream 79 MB SQLite database was
converted to an 11 MB seek-and-read binary format, because reading SQLite
requires shipping a database engine and this repository's position is that
PowerShell is already on the machine and nothing else should need installing.

The conversion is reproducible: `tools/Build-ResourcePathIndex.py` at the repo
root takes the upstream `.db` and emits this file. It is a maintainer tool and
needs Python; nobody using these skills ever runs it.

**Credit VanStorm, not Ultrapunk.** The upstream repository's own README credits
"Ultrapunk", which is the name of his Cyberpunk 2077 *collection*. He asked
(2026-08-18) to be credited as **VanStorm** here, because the database is work he
did independently of that collection. Do not "correct" this back by copying the
upstream README - the attribution a CC BY licensor asks for is the one to use.

Upstream also credits [WolvenKit](https://github.com/WolvenTeam/WolvenKit) and
[MlsetupBuilder](https://github.com/Neurolinked/MlsetupBuilder), whose exports
contributed paths to the original dataset.

All path strings are derived from Cyberpunk 2077 game files. CD Projekt RED owns
all rights to the original game content. This table contains **file path strings
and their hashes only** — no game assets.

## What it is for

An `.archive` indexes its contents by hash and carries no path strings, so every
conflict report this family produced could say *how many* files a mod lost and
never *which*. That is a direct violation of the family's own rule — always
dereference an internal name into something the user can act on.

With the table:

```
Preem Skin.archive (line 66) - carries 16 file(s)
  LOSES 3 file(s):
    to !!_SMX_MaterialGirl_094_2k.archive (line 65):
      base\characters\common\skin\face\microdetail_n.xbm
      base\materials\skin.mt
      engine\materials\defaults\default.sp
```

Three files out of sixteen sounds like a rounding error until you can see that
they are the skin material template and the face microdetail map.

## Coverage, and what a miss means

99.97% of base-game and EP1 files. A hash that does not resolve is usually a
**mod's own resource**, not a missing entry — mods add paths the base game never
had. Tools here report that distinction rather than printing a bare hash, because
"unknown" and "not a base-game file" lead to different next steps.

## Game version

This table is 2.31. Paths are stable across patches far more than offsets are,
but a new patch can add resources, and those will not resolve until the table is
rebuilt. The version is in the filename deliberately: a table silently describing
the wrong build is worse than no table.
