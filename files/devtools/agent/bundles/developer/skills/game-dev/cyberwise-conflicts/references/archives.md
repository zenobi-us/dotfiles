# Archives, hashes, and finding out who owns a file - where the knowledge now lives

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> **Re-check after a patch:** The RDAR index layout and FNV1a-64 hashing are stable across patches; dictionary coverage is not. Re-measure how much KnownHashes.txt resolves before relying on a negative result.

An `.archive` index is plain structured data - only the bodies are compressed -
so collision detection, ownership and "what is in this archive" need no
WolvenKit and no dictionary.

**The full account is in the base wiki** (`wiki/` in the Cyberwise repo):

| article | covers |
|---|---|
| `/conflicts/rdar-index-is-plain-data` | the RDAR header and 56-byte file entries, FNV1a-64 over the raw depot path, and the two numeric traps that make a naive PowerShell hash return a **constant** for every input |
| `/conflicts/resolving-a-hash-to-a-path` | a miss is a finding, not a gap; dictionary coverage including Codeware's ~20% and its missing texture paths; the four steps of "which mod owns file X" |
| `/conflicts/visual-bugs-that-are-not-conflicts` | appearance overrides, coverage gaps, and how a `base\4k\` or `base\v_textures\` prefix identifies a patch layer that is inert without its base |
| `/conflicts/editing-serialized-red4-json` | why a JSON round-trip mangles typed structures, why values appear twice, handle arrays, `HandleId` uniqueness, and the CLI round-trip gotchas |
| `/conflicts/scaling-a-placed-prop` | the four separate edits, `FixedPoint` bits = metres x 131072, and anchors that scaled by 1.5 when the mesh scaled by 3 |

## What to actually do

**Resolve a hash, or hash a path** - the vendored table
(`data/resource-paths-2.31.cwpx`, 751,710 paths, ~99.97% of base game and EP1 for
2.31, from VanStorm's resource-path database under CC BY 4.0; see
`data/ATTRIBUTION.md`) needs no credentials, no other mod and no network:

```powershell
. tools\Resolve-ResourcePath.ps1
Resolve-ResourceHash -Hash ([Convert]::ToUInt64('800008F5BA040F7E', 16))
Get-ResourceHash 'base\materials\skin.mt'
tools\Repair-LoadOrder.ps1 -Explain 'Preem Skin.archive'   # names the lost files
```

Use `[Convert]::ToUInt64(...)`, never a bare `[uint64]0x...` literal.

**"Why do two body parts not match?"** Do not start with load order. Extract the
suspect archives and read their actual file lists.

**WolvenKit CLI round-trip** - needed only to see real paths or to *edit*
content, so never make it a prerequisite for a user who has never installed it.
The CLI is a **separate download** from the GUI.

```
WolvenKit.CLI extract <archive> -o <dir> [-w "*pattern*"] [--hash <hash>]
WolvenKit.CLI convert serialize <file> -o <dir>      # output dir must exist
   ... edit the .json by targeted regex ...
WolvenKit.CLI convert deserialize <file>.json        # writes the binary beside it
WolvenKit.CLI pack <rootdir> -o <dir>                # rootdir mirrors depot paths
WolvenKit.CLI hash "<depot\path>"
```

Copy the source archive to a short, apostrophe-free path first, enable Windows
long-path support before packing, and delete the `.json` files before you pack.

Building on top of someone else's assets without editing their files is covered
in the `cyberwise` skill's `environment.md` - use your own depot prefix.
