---
name: cyberwise-conflicts
description: Cyberpunk 2077 load order and mod conflicts - why earlier in modlist.txt wins, detecting archives that are installed but contributing nothing, and visual bugs that are not conflicts at all. Use when a mod is installed and enabled but does nothing, when textures or body parts look wrong or mismatched, when two mods fight, or when reading .archive internals.
---

# Cyberwise: conflicts and load order

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> **Re-check after a patch:** Confirm override direction still favours earlier entries before trusting any precedence work.

Load `cyberwise` alongside this for the method rules - especially **confirm the
mod is actually deployed** and **check your evidence discriminates**, both of
which this topic violates constantly.

Two of those are worth repeating here because getting them wrong wastes the most
time in *this* area specifically:

- **Find out how the install is assembled first.** On a virtualising setup (MO2)
  the game directory may look empty with the game closed, so "the archive isn't
  there" proves nothing.
- **Dereference internal names.** Telling someone `###AAblud.archive` is losing
  leaves them unable to find it in their manager.

## The load-order rule is backwards from most guides

**Earlier in `archive\pc\mod\modlist.txt` WINS.** Popular advice says to prefix a
mod with `zzz_` so it "loads last and wins". That is wrong for an install that
uses `modlist.txt`.

Whether it does is a property of the install, not of the game version: nothing in
the game writes that file, so it exists only if a manager, a conflict tool or the
user put it there. **Look for the file before applying any of this** - with no
`modlist.txt` the game falls back to alphabetical, and a manager that sequences
mods in its own UI is a third case whose specifics were not tested here. The
reasoning transfers; the specifics should be checked.

Consequences that follow where the file is in play, and they matter more than the
rule itself:

- **A catch-all AIO retexture belongs LATE in the list**, so specific mods beat it.
- **New archives get appended to the end** by whatever writes `modlist.txt`, which
  is the bottom of the priority stack. Every mod the user installs starts out
  losing every file it contests. Re-check conflicts after *any* mod change -
  install, update, uninstall or variant swap - however the install is assembled.
- `modlist.txt` is a deliberate custom order, not a fossil and not alphabetical.
  Never delete it to "fall back to alphabetical".
- **`#` is a filename character, not a comment marker.** Mods use a leading `#`
  to sort early, so a parser that strips `^#` as comments silently drops real
  entries and then reports them as unlisted. Full detail and the sanity checks in
  `references/load-order.md`.

**Never rewrite `modlist.txt` without a snapshot first.** It is a deliberate
custom order that nothing else can reconstruct, and a bad rewrite silently
reorders every conflict on the install. Use the front door's helper - it prints
the diff, snapshots, and hands you the undo command:

```powershell
. <path-to>\cyberwise\tools\ModFileBackup.ps1
Set-ModFileContent -Path "$GameRoot\archive\pc\mod\modlist.txt" -NewText $updated -Note 'why'
```

Show the user the diff and get agreement on *that*, not on the command.

## "Installed and enabled" is not "doing anything"

An archive whose files are *all* owned by something earlier is **inert** - present,
enabled, and contributing nothing. This is the single most common silent failure.

**Compare loss count against total file count.** Losing 1 file of 60 is a cosmetic
overlap. Losing 1 of 1 is a dead mod.

**But the count is not the answer - the file names are.** `-Explain` resolves the
contested hashes to real paths from the vendored table, and *which* files a mod
loses routinely inverts what the count implies. One skin mod here kept 13 of its
16 files and the three it lost were `base\materials\skin.mt`, the face
microdetail normal, and a shader default: it wins the arithmetic and loses the
material. A percentage cannot tell you that.

**And the scan sees one of two precedence systems.** REDmod archives live in
`mods\<name>\archives` and are ordered by REDmod deploy, not by `modlist.txt`.
They are scanned, but files contested across both domains are reported
*unranked* - nothing here establishes which side wins, and naming one would be a
guess wearing a verdict. On one install that was 63 files, on a load order
previously reported clean. Which build to install in the first place:
`cyberwise/references/environment.md`.

**But an inert ARCHIVE does not mean an inert MOD.** Before advising an uninstall,
check the rest of the payload. A mod's real content may be a CET Lua file, an
entSpawner registration, a `.reds` script or an `.xl` - none of which appear in an
archive conflict scan. Uninstalling on archive evidence alone has destroyed
working functionality.

**So a `BenignInert` note must never say a mod can be uninstalled.** Its job is to
record *why being inert is fine* - nothing more. Three notes on one install said
some version of "redundant, could be uninstalled"; every one was wrong, because
each mod's real payload was scripts or a `.xl` the scan never looked at. One of
them cost an afternoon: a companion mod whose archive carries a single shared
localisation string, while the feature the user actually plays with lives in two
`.reds` files beside it. Write the note as "inert because X, keep it", and if you
genuinely believe a mod is removable, prove it by listing its whole staging
folder first.

**The same trap exists outside archives.** If redscript fails to compile, *every*
`.reds` mod on the install is silently off, with no in-game sign at all - no
error, no warning, no missing-feature message. Nothing reports it, so the state
persists until somebody thinks to look at the log. And a RED4ext plugin whose DLL fails to
load never compiles its scripts either. Verify the thing is actually running before
concluding anything from its behaviour - the compile-test recipe is in the
`cyberwise` skill's `environment.md`, not this one.

## Many visual bugs are not conflicts at all

A conflict checker showing zero conflicts does not mean two mods agree. Cases seen:

- **Appearance (`.app`) overrides.** A mod can override
  `player_base_bodies\appearances\*.app` and point a body part at a different
  texture set entirely. No hash collision, completely different look.
- **Coverage gaps.** A "skin tone" patch may only ship torso and arm textures. The
  legs then keep whatever the underlying body mod supplies, and the two will never
  match. No load order change can fix missing content.
- **Patch mods layered on other mods' namespaces.** Paths like `base\4k\...`,
  `base\v_textures\...`, `base\characters\player\femme\...` are not vanilla. An
  archive full of them is a recolour layer over another mod, not a standalone
  texture, and it is useless without its base.

When a body part looks wrong, resolve *which file actually supplies it* before
touching load order. See `references/archives.md`.

**And before you promise a reorder, check the problem is one reordering can solve.**
Three situations look identical in a conflict report: a lost fight (fixable), a
coverage gap where only one mod ships the file at all (not fixable - no ordering
conjures content), and two mods claiming the same single resource where the user
wants both (impossible; say so instead of shuffling). Afterwards, **re-scan for
newly inert archives** - promoting one mod can silently kill a third party nobody
mentioned. `references/load-order.md`.

## Tools

| tool | what it does |
|---|---|
| `tools/Repair-LoadOrder.ps1` | audits `modlist.txt` and the archives against each other, and can repair the order |
| `tools/Resolve-ResourcePath.ps1` | turns an archive hash into a real file path, and back |
| `tools/Find-QuestConflicts.ps1` | which mods rewrote a quest's files, and which of them is actually live |

```powershell
.\tools\Repair-LoadOrder.ps1              # report only
.\tools\Repair-LoadOrder.ps1 -Fix         # reorder, and place unlisted archives
.\tools\Repair-LoadOrder.ps1 -SkipScan    # inventory and rules only, no index reads
.\tools\Repair-LoadOrder.ps1 -Explain 'X.archive'   # which FILES it loses, and to whom
```

Three independent checks: **inventory** (entries with no file, archives with no
entry), **precedence** against standing rules, and a **collision scan** that reads
every archive index and flags **inert** archives - every file they carry owned by
something earlier, so the mod is installed, enabled and contributing nothing. It
locates the game from the storefront registry; `-ModDir` overrides. Exit 0 clean,
1 issues.

**Run it after any mod change.** Whatever rewrites `modlist.txt` appends new
archives at the *end*, which under earlier-wins is the bottom of the stack - so
every newly installed mod starts out losing every file it contests.

**It ships with no precedence rules, deliberately.** Rules are one install's
settled conflicts; applying somebody else's would reorder mods a user does not
have. Theirs live in a data file beside their game:

```
<game>\_loadorder\loadorder-rules.psd1
```

```powershell
@{
    Rules = @(
        @{ Before = 'specific_retex.archive'
           After  = 'catch_all_aio.archive'
           Why    = 'an AIO should lose to anything specific' }

        # Either side may be a WILDCARD (* or ?), matched against the archives
        # present and expanded to one rule per match. Use it for any mod whose
        # archive is RENAMED when you switch variant - a skin tone, a hair
        # colour - so the rule survives the swap:
        @{ Before = 'SkinTone_BODY_*.archive'
           After  = 'catch_all_aio.archive'
           Why    = 'whichever tone is installed still beats the AIO' }
    )
    BenignInert      = @{ 'some.archive' = 'why being inert is fine here' }
    RuntimeGenerated = @{ 'other.archive' = 'why it appears and vanishes' }
}
```

**An exact-name rule stops applying the moment the mod renames its archive, and
it fails SILENTLY** - nothing errors, the new archive is merely unlisted, and
unlisted sorts LAST. A skin texture that has to beat a catch-all ends up losing
to it, and the only symptom is that the character looks wrong. That is what
wildcards are for. Two guards come with them: a pattern matching nothing says so
rather than passing quietly, and a pattern that would pair more than 200
archives is refused as a typo.

**Add a rule whenever a conflict is settled by hand**, or the next redeploy
undoes the decision silently. The two suppression maps stop known-harmless cases
counting as problems - the script ships only the entries that are facts about
public mods, not preferences.

## A quest that stopped advancing

```powershell
tools\Find-QuestConflicts.ps1 -Quest sq026 -GameRoot '<path>'
```

**This is not softlock detection and must not be offered as one.** A stuck quest
and a quest legitimately waiting look identical from outside - most of the
journal is waiting on an in-game day, a phone call, or a fact set somewhere else.
Same reason automated hang detection fails (`cyberwise-crashes`), with more force.

What it answers is the question you have *once you are stuck*: which mods rewrote
this quest, and which of them is winning. The finding to look for is a
**contested** resource - two mods replacing the same `.questphase`. Quest edits
are not additive: under earlier-wins one version is in the game and the other is
absent, so a mod's fix for the exact bug being hit can be the half that lost.

A real example from one install, on the Judy questline:

```
base\quest\side_quests\sq026\phases\sq026.questphase
  WINS   LiveALittleTimers.archive (line 4)
  loses  ##TaB_Quest.archive (line 563)
```

Owning a quest file is not guilt - plenty of mods rewrite quests correctly. It
narrows twenty suspects to two, and the test is to park the winner and reload an
earlier save.

Quests break from two other directions this tool cannot see: **`.xl` quest
intercepts**, which change the graph without owning a file (`intercept: true`
entries only execute on a fresh run of that quest, which is why they surface on a
new game and not on an old save), and **redscript hooks** on quest classes. Rule
them in or out before concluding an archive is responsible.

## Reference material

| file | covers |
|---|---|
| `references/load-order.md` | what to run and in what order: checking which ordering model applies, the scan, the snapshot rule |
| `references/archives.md` | the hash-resolution and WolvenKit CLI invocations |

**Both are now mostly pointers.** The knowledge they used to carry lives in the
**base wiki** - `wiki/` in the Cyberwise repo, described by `cyberwise-wiki` -
under `/conflicts`, because a skill file is instructions and a wiki article is
knowledge, and those rot at different rates.

| article | covers |
|---|---|
| `/conflicts/earlier-wins-and-nothing-in-the-game-writes-the-list` | the two ordering models, and a test that can actually discriminate between them |
| `/conflicts/every-new-archive-starts-last` | the append trap, variant swaps breaking exact-name rules silently, and the checkbox that deletes `modlist.txt` |
| `/conflicts/modlist-has-no-comment-syntax` | the `#` parsing trap, its 60 fabricated faults, and the sanity checks |
| `/conflicts/an-entry-and-a-file-can-disagree` | stale entries versus unlisted archives, and which of the two to fix |
| `/conflicts/an-archive-that-contributes-nothing` | detecting inert archives, the benign cases, and why an inert archive is not an inert mod |
| `/conflicts/what-reordering-can-and-cannot-fix` | lost fight, coverage gap, mutually exclusive claims |
| `/conflicts/a-precedence-change-creates-casualties` | why to diff the inert list after any reorder |
| `/conflicts/visual-bugs-that-are-not-conflicts` | appearance overrides, coverage gaps, patch layers over another mod's namespace |
| `/conflicts/rdar-index-is-plain-data` | RDAR index format, FNV1a-64 hashing, and the two numeric traps |
| `/conflicts/resolving-a-hash-to-a-path` | dictionary coverage, and why a miss is a finding rather than a gap |
| `/conflicts/editing-serialized-red4-json` | what survives a WolvenKit JSON round-trip and what does not |
| `/conflicts/scaling-a-placed-prop` | the four edits resizing a prop actually takes |
| `/conflicts/index` | all of the above, grouped |

To inventory what is actually installed before diagnosing, `cyberwise-reports`
carries the manifest tool.
