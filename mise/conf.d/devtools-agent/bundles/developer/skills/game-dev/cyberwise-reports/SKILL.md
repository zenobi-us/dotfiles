---
name: cyberwise-reports
description: Generate deliverables about a modded Cyberpunk 2077 install - a system profile that says what is likely wrong, a full mod-list inventory with descriptions, and the house style plus headless verification for any HTML or Discord-markdown report. Use when someone reports a problem with no detail, when asked what mods are installed, or when generating any page or report for a user to read.
---

# Cyberwise: reports and deliverables

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> **Re-check after a patch:** The profiler reads framework versions and log states; re-check those paths. Nothing in the report design depends on a game patch.

Load `cyberwise` alongside this for the method rules.

## Start here when the report is "it's broken"

```powershell
tools\New-SystemProfile.ps1 -GameRoot '<path>'
```

Writes Discord-pasteable markdown and an HTML report, led by a **flags** section
naming what is likely to be the problem. Only fields that change a diagnosis are
collected - VRAM against total texture volume, pagefile, drive type, framework
versions, load-order health, whether redscript last compiled. Motherboard model
explains nothing about a mod, so it is not there.

Every flag names the symptom **and** the reason, and carries the items it
counted: a flag saying "60 archives are unlisted" is unactionable until you know
which 60, and **seeing the list is also how a wrong flag gets caught.**

### Every user should have a machine profile in their wiki

```powershell
tools\New-SystemProfile.ps1 -GameRoot '<path>' -Wiki
```

Same measurement, third output: an OKF article at
`<records>\Cyberwise\wiki\machine.md` (`-WikiPath` moves it). **Run it once per
user, early** - a fresh session that has never measured this machine either asks
the user to read numbers off a screen, or reasons about hardware it invented.

It is **user-only and the tool refuses to write it into the base wiki**, because
it describes one person's hardware and nothing about the game. And it is
**regenerated whole on every run** - the no-clobber rule that protects a
hand-deepened mod article does not apply to a file whose every line is measured,
and the article says so in its own header so nobody preserves a stale one out of
the wrong instinct.

Two things in it are not in the markdown report:

- **What this rules in and out, derived from the actual numbers.** 32 GB of VRAM
  makes exhaustion an unlikely suspect; 6 GB makes it the first one. The point is
  that a later session knows which suspicions are worth having *on this machine*,
  and does not carry a conclusion over from a different one.
- **The VRAM measurement warning**, because both wrong answers are easy to reach
  and neither looks wrong. `Win32_VideoController.AdapterRAM` is a uint32 and
  saturates at 4 GB; the display-class registry `HardwareInformation.qwMemorySize`
  is correct only if you enumerate **every** index, since index 0 may be an
  integrated adapter. Cross-check with
  `nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv`. The
  general lesson is in the base wiki at
  `/process/a-capacity-read-from-the-wrong-api`.

## Inventory the mod list

```powershell
tools\New-ModManifest.ps1 -StagingRoot '<manager staging root>' -NexusApiKey <key>
```

**It reads a manager's staging root, not the game directory.** A Vortex-style
staging root is auto-detected; anything else needs `-StagingRoot` pointed at it
(for MO2, its `mods\` folder). A fully manual install has no staging tree, so the
tool has nothing to walk.

Most of it works offline because a manager that installed from Nexus encodes
`<Display Name>-<NexusID>-<version>-<timestamp>` into the folder name, which
yields the name, a working URL and the install date with no credentials. That
naming is Vortex's; MO2 folder names are user-editable, so expect name-only for
renamed folders. `-NexusApiKey` adds summaries, author, category and the real
adult-content flag, cached so re-runs are free. `-HideNSFW` omits adult mods.

**`-NoNexus` guarantees no network call.** A key stored in Credential Manager is
picked up automatically, so without this switch "I did not pass a key" is not the
same as "it stayed offline". Use it for a quick inventory, on a metered or
offline connection, or any time reaching a third-party API is not something the
user asked for.

Two things before trusting the NSFW filter, both measured on one 846-mod install:

- **Without an API key it is a name heuristic and it under-detects.** It caught
  17 there. Adult mods with innocuous names sail past.
- **Flags propagate across a shared Nexus ID**, because one page carries one flag
  but ships many differently-named files. That alone caught 7 of those 17.

**The output is the user's actual mod list. Treat it as personal:** write it
outside any repo and never commit it.

## One mod: "I installed this - is it working?"

```powershell
tools\New-ModDossier.ps1 -Mod '<name>' -GameRoot '<path>'
```

The most common question on any modded install, and nothing answers it, because
**a mod is not one thing.** It is up to nine payloads deployed to nine places,
each failing in its own silent way - an archive that loses every file it
contests, a `.reds` that is on disk but not in the compiled bundle, a CET folder
with no `init.lua`, a `.yaml` that never loaded. A single verdict would be a lie;
this reports **per layer**, and says `unknown` where disk genuinely cannot tell.

It walks the mod's own staging folder to learn what it *should* deploy, so the
footprint is exact rather than inferred from its category or its page. It also
pulls in the user's real settings for that mod (matched on its redscript
**module**, which is how `user.ini` sections are keyed - not on its display name)
and any override you have registered against it.

Paths are redacted by default: a dossier is what somebody pastes into a thread
when asking why a mod does nothing.

## Any generated page: measure it, do not eyeball it

**Get the viewport from the user, not from the screen — and LAUNCH the probe
yourself.** Do not print the command and wait. Run it, so a browser window opens
on their machine; then ask them to size it the way they will actually read the
page and read the two numbers back.

```powershell
tools\Show-ViewportProbe.ps1        # RUN THIS FOR THEM - it opens the page itself
tools\Measure-PageFit.ps1 -Path page.html -Width <w> -Height <h> -Screenshot -ShotPath shot.png
```

"Run this and tell me the output" is a request for the user to do your job. The
only time to hand over a command is when they have said they want to run it
themselves.

Detecting the display assumes maximised on the primary at 100% zoom, and cannot
express "the little side panel" or "half-width on monitor 2" at all. Ask - but do
the opening.

Then **say what that viewport implies** rather than silently designing to it: on
a small one, agree what earns the top of the page and accept scrolling for the
rest; on a TV, scale the type up hard. An unreadable page that fits is not a win.

And **look at the output, not just the number** - pass `-Screenshot` and read the
image. Two failure modes a screenshot cannot show you, and one a number cannot:

- **An element pushed clean off the page.** A long inline label with
  `white-space:nowrap` forced its row wider than its container and shoved a
  keycap past the right edge - not clipped, not squeezed, *absent*.
- **A layout that "fits" because the flag was ignored.** In PowerShell,
  `--window-size=$W,$H` unquoted parses as an **array**, so the browser silently
  renders at its 800x600 default. Quote it.
- **`DocHeight == ViewHeight` does not mean the page fills the window.**
  `scrollHeight` has the viewport as its floor. Re-measure against a short window
  for the true content height.

## Anything meant for a chat paste has a hard size limit

**Discord refuses a message over 2000 characters - it does not truncate it.** A
report that quietly runs long is one the user cannot send at all, and they find
that out while already stuck.

Every paste-facing output here says its own size and what to do instead: the
profile warns with the character count, the manifest names the file and the HTML
as the alternatives, and the tray trims a crash summary to fit before it reaches
the clipboard. **Hand somebody a short form or an attachment - never a wall of
text and a "paste this".**

House style - palette, one type base, flex over CSS multi-column, Discord's lack
of table rendering and the 2000-character cap: `references/report-design.md`.

## Two reports that are not diagnostics

Everything above answers "what is broken". These two answer "what is this
install", which is a different job and worth keeping distinct - neither one
should ever be offered as an answer to a problem.

### The credits roll

```powershell
tools\New-ModCredits.ps1 -StagingRoot '<staging>' -Md credits.md
```

Every author whose work is in the game, and what each of them made. It is the
one page here you could show somebody who does not mod.

Two things it must keep getting right:

- **Distinct mods, not staging folders.** A FOMOD with options installs as
  several folders under one Nexus id. Counting folders inflated a real install
  from 715 to 798 and printed one mod's title four times in its author's line.
- **Adult mods are omitted by default, and the count is printed.** The page is
  built to be shown, so the safe default is the one that does not surprise
  somebody on a stream - but silently dropping people from a credits list is its
  own unkindness. `-ShowAdult` includes everything.

Authors come from the Nexus metadata cache the manifest tool builds. A mod that
has never been enriched appears with no author on record, said plainly rather
than guessed at.

### The archive anatomy

```powershell
tools\New-ArchiveAnatomy.ps1 -GameRoot '<path>' -Md anatomy.md
```

What the archive layer *is*: how much of the base game it replaces, what it is
made of, and which parts of Night City it concentrates on.

The distinction that makes it possible is **replace versus add**. An archive
hash the vendored base-game path table knows is an override - the game shipped
that file and this mod stands on top of it. A hash it does not know is an asset
the mod invented. Every tool that reads archives without the path table sees
those as the same thing, and they mean opposite things: 4,000 new meshes is a
content pack, 40 overridden ones is a mod that can break on the next patch.

**Unresolved is not unknown.** The table covers 99.97% of base game + EP1, which
is the only reason the "new" column can be trusted at all. That caveat is
printed on the page, not left to the reader.

It reads the index of every `.archive` in the load order - about 45 seconds on
an 800-mod install - and writes nothing to the game. REDmod archives are counted
but never ranked against loose ones, because `modlist.txt` does not order them.

## Tools

| tool | does |
|---|---|
| `tools/New-SystemProfile.ps1` | machine + install facts that change a diagnosis, flags first; `-Wiki` also writes the user's machine-profile article |
| `tools/New-ModManifest.ps1` | inventory of an installed load order, with descriptions |
| `tools/New-ModDossier.ps1` | one mod, every layer: what it ships and which parts are actually doing anything |
| `tools/New-ModCredits.ps1` | the people whose work is in the game, grouped by author; adult omitted by default |
| `tools/New-ArchiveAnatomy.ps1` | what the archive layer replaces versus what it adds, by area and by type |
| `tools/ModManifestHtml.ps1` | HTML renderer for the manifest (dot-sourced) |
| `tools/NexusCredential.ps1` | Nexus API key in Windows Credential Manager |
| `tools/Show-ViewportProbe.ps1` | asks the user's own browser window how big it is |
| `tools/Measure-PageFit.ps1` | does a generated page fit a given viewport |

**Every HTML report here takes `-Md` and writes the same facts as markdown**,
for a forum post, a wiki, or a Discord message where a local HTML file is
useless to whoever you are talking to. Where the markdown is the variant that
gets pasted, it carries the redaction too - and anything over 2000 characters
says so, because Discord refuses an over-long message rather than clipping it.

**Pass the paths explicitly.** These carry defaults for a game root, a staging
root and a viewport. A default that happens to exist on the wrong machine is
worse than an error, because the output looks plausible.

## Reference material

| file | covers |
|---|---|
| `references/report-design.md` | palette, layout, Discord constraints, verifying headless |
