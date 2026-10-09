# The compiled script bundle - where the knowledge now lives

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026, redscript via
> `engine\tools\scc.exe` + `cybercmd`
> **Re-check after a patch:** The bundle's internal layout is redscript's, not
> the game's, so a game patch does not move it - but a **redscript** update can.
> Re-check the log's `Output successfully saved to` line and the `.ts` layout
> after updating redscript, RED4ext or cybercmd.

`.reds` mods do not run from `r6\scripts`. They run from a **compiled bundle**
built at launch, so "the file is there" and "the code is running" are different
claims, and on a real install they disagree regularly.

**The full account is in the base wiki** (`wiki/` in the Cyberwise repo):

| article | covers |
|---|---|
| `/engine/compiled-script-bundle` | finding the live bundle from the log rather than the config, the two persistent cache trees, the `final.redscripts.ts` nanosecond format, the `Module.Path.Symbol` pool, the **three ways to get a false absence**, what a real absence means, and the all-or-nothing compile gate |
| `/engine/redscript-log-names-the-wrong-run` | an archived log is named for the run that **replaced** it, and a compile test overwrites the record of the last real launch |

Two things from those are worth carrying in the instruction, because they change
what you do rather than what you know:

- **Read the first line of a redscript log, never its filename.** The wrong log
  is a full, plausible compile of the same install.
- **A mod deployed after the bundle was built is installed, enabled, correct and
  not running.** It compiles in on the next launch, and there is no sign of this
  in game. That is the common case, and it needs no action at all.

`tools/Test-ScriptsLive.ps1` implements all of it - run that rather than
reasoning about a 35 MB blob by hand:

```powershell
tools\Test-ScriptsLive.ps1 -GameRoot '<path>'            # what is stale
tools\Test-ScriptsLive.ps1 -GameRoot '<path>' -Mod 'X'   # one mod, symbol by symbol
```

The compile-test recipe that produces the log-overwrite problem is in
`references/environment.md`.
