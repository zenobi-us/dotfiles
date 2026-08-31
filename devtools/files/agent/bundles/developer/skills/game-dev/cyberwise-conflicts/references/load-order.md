# Load order - where the knowledge now lives

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> **Re-check after a patch:** Confirm override direction still favours earlier entries before trusting any precedence work. The append-on-install behaviour belongs to whatever writes modlist.txt, so it can change without a game patch.

`archive\pc\mod\modlist.txt` decides which archive wins a contested file, and
**earlier wins** - but only where the file exists, and nothing in the game writes
it.

**The full account is in the base wiki** (`wiki/` in the Cyberwise repo):

| article | covers |
|---|---|
| `/conflicts/earlier-wins-and-nothing-in-the-game-writes-the-list` | the two ordering models, why which one applies is a property of the install rather than the game version, and the worked example of a test that **cannot** discriminate |
| `/conflicts/every-new-archive-starts-last` | the append trap, why a variant swap breaks an exact-name rule silently, standing precedence rules and why they must be written down, and the checkbox that **deletes** `modlist.txt` |
| `/conflicts/modlist-has-no-comment-syntax` | `#` is a filename character; the 60 fabricated unlisted archives, and the two sanity checks that catch it |
| `/conflicts/an-entry-and-a-file-can-disagree` | listed-but-missing (usually keep) versus on-disk-but-unlisted (always fix) |
| `/conflicts/an-archive-that-contributes-nothing` | detecting inert archives from indexes alone, the cost, the allow-list, and why an inert archive is not an inert mod |
| `/conflicts/what-reordering-can-and-cannot-fix` | lost fight, coverage gap, and the mutually exclusive request - only the first is a load-order problem |
| `/conflicts/a-precedence-change-creates-casualties` | promoting one mod turned a fourth archive inert; diff the inert list afterwards |

## What to actually do

**Before applying any precedence reasoning, look for the file.**

```powershell
Test-Path "$GameRoot\archive\pc\mod\modlist.txt"
```

Present - explicit order, earliest line wins. Absent - alphabetical, and there is
no ordering control to edit. A manager that sequences mods in its own UI is a
third case: reason about its list, and treat the specifics here as untested
(`cyberwise/references/environment.md` tells the assembly modes apart).

**Re-run the scan after every change to the mod set** - install, update,
uninstall, variant swap, or a manager deployment. New archives are appended last,
which under earlier-wins is last place.

```powershell
tools\Repair-LoadOrder.ps1                          # report only
tools\Repair-LoadOrder.ps1 -Explain 'X.archive'     # which FILES it loses, and to whom
tools\Repair-LoadOrder.ps1 -Fix                     # reorder, and place unlisted archives
```

**Never rewrite `modlist.txt` without a snapshot**, and get agreement on the
diff rather than the command - `cyberwise/tools/ModFileBackup.ps1`.

**After applying a precedence rule, re-run and diff the inert list.** Anything
newly inert is your doing and needs surfacing.
