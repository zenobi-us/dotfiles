---
name: cyberwise
description: Front door for diagnosing a modded Cyberpunk 2077 install - the method rules that apply to every CP2077 modding task, where each kind of mod lives on disk, and which cyberwise-* skill covers the problem at hand. Use at the start of any Cyberpunk 2077 modding question, and when unsure which part applies.
---

# Cyberwise

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> Every file under a `references/` directory carries its own verification stamp
> and a **Re-check after a patch** line naming what to re-test first. Trust those
> over this one; some areas drift much faster than others.

Field notes for diagnosing a modded Cyberpunk 2077 install, at any scale, under
any mod manager or none. This is not a modding tutorial - installing a mod and
finding a log are assumed to be covered elsewhere. What follows is the set of
things that are **counterintuitive, undocumented, or actively contradicted by
popular advice** - each one learned by getting it wrong first.

Findings here are empirical, and most of the measuring happened on one large
Vortex-managed install. Two consequences for how to use them. Where a claim is
manager-specific, it names the manager - treat the same claim on another manager
as untested rather than false. And where a worked example carries a big number,
the number is that install's, not a threshold: the mechanisms fire identically on
a twenty-mod list, they just fire less often.

## Method, before anything else

These cost the most time when skipped, and they apply to **every** task below -
they are why this front door exists rather than eight independent skills.

**Read the installed patch version before trusting anything stamped with one.**

```powershell
(Get-Item "$GameRoot\bin\x64\Cyberpunk2077.exe").VersionInfo.ProductVersion   # -> 2.31
```

Every reference here carries a **Verified:** stamp. If the install reports a
higher version, say so before answering - the reasoning holds, but offsets,
record IDs and paths may have moved. (`FileVersion` is a build string and is not
what anyone means by "the patch".)

**Snapshot before every in-place write, and get approval on the DIFF, not the
command.** Nothing in this family modifies an install - but you will, by hand,
and those edits have no undo. Someone who cannot read PowerShell can still read
"this line becomes that line", and that is the only consent worth having.
`tools/ModFileBackup.ps1` does preview / snapshot / write / restore.

**When a command produces nothing, prove it ran before interpreting the
nothing.** An empty result is the *absence* of evidence and looks identical
whether the thing did not happen or the command never executed. Twice here a
silent parse failure was read as a finding - `#` treated as a comment in
`modlist.txt` produced 61 fabricated faults, and a path containing a space made
`Start-Process` fail so quietly it was mistaken for a platform limit. Capture
stderr, check the exit code, confirm the process exists.

**A negative is only as wide as the layer you searched.** "It does nothing" is a
far stronger claim than "it does X", and one grep over one file cannot carry it.
Name the layers the thing could act through - the mod's own config, the game's
option registry, another control on the same subsystem, a native plugin - and
until they are open, report "nothing in `<layer>`", not "nothing".

**Find out how the install is assembled before you trust the filesystem** -
manual, Vortex, MO2 and Wabbajack lists show completely different pictures on
disk. Two that bite hardest:

- **An MO2 install may show an almost empty game directory** (USVFS + Root
  Builder). "The file isn't there" proves nothing.
- **On a Wabbajack list, updating the list DELETES every mod not in the new
  version**, including any fix you add. Survivors must be named `[NoDelete] ...`,
  and those re-sort alphabetically, so order lives in the name too. Establish
  this *before* building anyone a fix.

Detection recipes and per-manager consequences: `references/environment.md`.

**Answer the worry, not the mechanism.** Most people here are modders, not
developers. When someone asks "is this safe", "what does that do", "will this
break my save" - answer *that*, in a sentence, without a lecture on how it works.
Offer the detail second, for the ones who want it. And **do the work yourself**:
if something needs building, installing or running, run it for them rather than
handing over commands to paste.

**Confirm the mod is actually deployed before theorising about why it fails.**
Hours have gone into explaining a mod that was staged but never deployed - and
the manual-install equivalent, an archive unpacked one folder too deep, fails
just as silently. On a virtualising setup, check the manager's own view.

**Reproduce before bisecting.** One crash or hang is not a deterministic fault.
Confirm it repeats before halving anything, or you will bisect noise and "fix" it
by coincidence.

**Check your evidence actually discriminates.** When testing "does earlier win or
later win", make sure the two hypotheses predict *different* winners for the case
you are looking at. In CP2077 this bites constantly: mods prefixed `#`/`!` sort
early alphabetically and are usually placed early in load order too, so
"earlier-in-list wins" and "later-alphabetically wins" often predict the same
outcome. Three such cases prove nothing. Find a pair where the orders disagree.

**Never quote a mod's shipped defaults as the user's configuration.** Read the
actual settings store (see `references/environment.md`). A mod's `.reds` or `.xml`
declares what the author shipped, not what the user set. Keybinds are the worst
case - there are **five** stores, not one, and a key you cannot find is not a key
that is free (`cyberwise-hotkeys`).

**A mod's own labels describe the mod, not the engine.** That rule is about
values; this one is about meaning. Comments, tooltips, INI section names and
debug captions are the author's shorthand, and routinely misstate what a setting
reaches or what gates it. Treat them as a lead; the game's own option registry
declares the option itself and outranks them (`references/environment.md`).

**Always dereference an internal name to something the user can find.** Folder
names, TweakXL namespaces, redscript modules and archive filenames are authored by
mod authors for themselves and routinely bear no resemblance to the name the user
sees - in a manager's list, or in their own notes on a manual install. Naming only
the internal string ("`ChipwareExpansion` is doing this") leaves them unable to act.
Give the display name, and the Nexus ID where one is recoverable. Where it is *not*
recoverable - a manual install has no mapping from a deployed file back to a mod -
say that instead of guessing. Recipe per manager: `references/environment.md`.

**Do not hand your own guesses back to the user as their statements.** Naming a
mod you inferred and then writing "the mod is X, not Y" - as though they had said
Y - wastes a turn and costs trust. If you worked something out, say you worked it
out.

**What the user saw in game outranks what a mod page says.** They are running the
build; documentation describes intent. When their observation contradicts your
source, the source is what is wrong, and arguing the point is a waste of a turn.

**And when the source that is wrong is one of these files, that is a report, not
an embarrassment.** A note that turns out to be false is worse than no note, so a
user who can disprove one is doing the most valuable thing anybody does here.
Offer to write it up - `cyberwise-feedback` gathers the facts and hands them a
finished message. That applies just as much when the thing that got it wrong was
you rather than the notes.

**When a mod's author contradicts your reading of their mod, re-derive.** Their
word is not proof either, but it is a strong signal that a label was trusted or
a layer was never opened. Check again at the authoritative source before either
defending the reading or folding to the claim.

**Check for drift at the start, and never edit a shipped tool quietly.** One
command, and it is the first thing to run on any Cyberwise task:

```powershell
tools\Test-Upstream.ps1        # ~0.1s. Exit 0 nothing unlogged, 1 findings, 2 cannot check.
```

Then the behavioural half, which is the part a check cannot do for you. **If you
are about to edit a file Cyberwise ships - any tool, any `SKILL.md`, a test, the
installer - say so to the user before you do it, say why, and record it in the
change register.** Not because changing it is wrong; because an unrecorded
change is invisible to the next session, to the other agent, and to the person
who has to decide a year from now whether they still want it.

**And check first that the change is necessary at all.** The commonest version
of this failure is an agent patching a tool to solve something the family
already has an affordance for:

| you were about to | do this instead |
|---|---|
| hard-code a path, a name or a threshold into a tool | put it in the user bundle, where it describes this install |
| edit another author's mod file | build an override mod, and `Register-ModPatch` it |
| change what a tool reports so a warning stops firing | fix the cause, or record why the warning is wrong here |
| add a fact a tool needs to know | write a wiki article; the tools read the bundle |

Editing a shipped tool is the last option, not the first. When it *is* the right
answer, one command records it:

```powershell
. tools\UpstreamGuard.ps1
Register-CwChange -File '<path>' -What '<what changed>' -Why '<why>' -ApprovedBy '<who said yes>'
```

Full rationale, the two file formats, and what the check prints in each state:
`references/environment.md`.

## Ask the running game - CETMonkey is a prerequisite

Everything else here reads an install **at rest**. Live state - what is actually
in the player's inventory, which status effects are applied, what a vendor really
stocks - is answerable only from inside the running game, and CETMonkey is how.

```
bind\plugins\cyber_engine_tweaks\mods\cetmonkey\scripts\*.lua
```

**List that folder before writing anything.** Each script's first two comment
lines are its title and description, so the Library reads as its own index. A
whole duplicate CET mod was once built to dump an inventory while CETMonkey sat
installed with a Library that runs scripts from a button - the same failure as
inventing a load-order rule without opening `modlist.txt`.

Three things that decide whether a live query works at all:

- **The CET console strips newlines from multi-line pastes**, concatenating
  statements into a syntax error. Anything past one line must be read from a
  file. "Paste this into the console" is valid advice only for a true one-liner.
- **Wrap every field read in its own `pcall`.** The record worth finding is
  usually the one that does not resolve, so `MISSING` or `<THREW>` in a column
  *is* the finding - and a dump that dies on it, or skips it silently, destroys
  the only row that mattered.
- **New scripts go in Vortex STAGING, then hardlink back.** A file written into
  the deployed folder has link count 1 and dies at the next purge.

Read `output.txt` and `log.txt` yourself. Never ask for a screenshot of something
that was written to a file.

Full contract - helpers, LuaJIT limits, the out-param return-slot trap, and the
`uiData` / `resolves` columns: `references/cetmonkey.md`.

## Do the work rather than proposing it

**When the research converges on one path, build it.** Strike the options that
are impossible and merge the ones that are steps of the same plan; if one
remains, that is not a choice to offer - it is the job. Ship it, then say in two
lines what it does and what you were unsure about.

A proposal is the right output only for genuinely different paths with different
consequences, for outward-facing or hard-to-reverse actions (publishing, filing,
deleting, spending), and for design questions that are the user's by right.
Everything else gets built.

Wrong work costs one message to redirect. Stopping to ask costs a round trip
every single time, and reads as withholding something already asked for.
`wiki/process/do-the-work-do-not-propose-it.md`.

## To find out whether a mod took effect, READ THE LOGS

Not the deployed file list. Not `archive\pc\mod\`. Not what is on disk when you
happen to look. **The framework that loaded it writes down what it did**, and
that record covers the moment the user actually ran the game:

| framework | log | says |
|---|---|---|
| ArchiveXL | `red4ext\plugins\ArchiveXL\ArchiveXL-*.log` | every `.xl` loaded, `[WorldStreaming]` sector patches, and load failures |
| TweakXL | `red4ext\plugins\TweakXL\TweakXL-*.log` | every YAML read, and records it refused |
| RED4ext | `red4ext\logs
ed4ext-*.log` | every plugin loaded, with version |
| redscript | `r6\logs
edscript_rCURRENT.log` | compile result, and which mod failed |
| CET | `bind\plugins\cyber_engine_tweaks\scripting.log` | per-mod Lua output and errors |

**A file listing describes this instant; a log describes the run.** A mod that
was installed, tested, found wanting and uninstalled leaves an empty folder and
a full log. Reading the folder and concluding "it was never installed" is a
statement about the USER, made from evidence that cannot support it - and it
lands as calling them careless. On 2026-08-28 that is exactly what happened, to
a modder of thirty years, over a mod they had installed, tested and removed
before the folder was ever looked at.

The logs were sitting there the whole time, with an explicit
`[WorldStreaming] Patching sector` line naming what ArchiveXL did and did not
apply.

**So: never infer from absence on disk. Open the log for the run in question,
find the entry for the mod by name, and quote it.** If there is no entry, say
the log has no entry for it - which is a fact about the log, not about the
person.

## NEVER claim what the base game does or does not contain

The base game is a **file on disk**. Read it before saying what is in it.

```powershell
# what shipped with the game        vs        what is live with mods loaded
r6\cacheinal.redscripts                     r6\cacheinal.redscripts.modded
```

Check the mtimes and sizes first. `r6\cache\moddedinal.redscripts` is a
DIFFERENT and often **stale** file - on one install it was four days old and
16 MB while the live modded bundle beside it was 40 MB and rewritten at every
launch. Claims sourced from it were claims about a snapshot nobody was running.

**A symbol in a bundle is not a feature in the game.** `RemoteBreach` greps
clean out of the vanilla bundle; remote breach on devices is nevertheless
supplied by CustomHackingSystem plus a mod that configures it. The class was
compiled. That says nothing about whether a player can ever reach it. Symbol
presence rules things OUT, never in.

**To establish that a feature exists in play**, one of these - not a grep:

| question | what answers it |
|---|---|
| does this device offer the action? | log the action list the running game hands you |
| why is it greyed out? | the action's own `IsInactive()` and `GetInactiveReason()` |
| which mod supplies it? | `vortex.deployment.json`, then that mod's own source |
| is it vanilla behaviour? | the vanilla bundle **and** an install with the mod disabled |

**Why this earns its own rule.** On 2026-08-26 a satellite dish that could not
be breached was investigated for two days across four releases on the strength
of guesses about backdoors, access points and cyberware prerequisites. The user
had *already stated* that remote breach is not vanilla, and was contradicted
from a stale bundle. One log line listing the device's offered actions settled
in a second what the guessing had not: the action was present, the mod
permitted it, and the mod that supplies its minigame had crashed during setup
that morning. Every hour of that was avoidable by reading a file first.

Related: `wiki/process/the-deployment-manifest-says-who-ships-what.md`,
`wiki/process/proximity-is-not-evidence-without-a-base-rate.md`.

## NEVER name a mod you have not confirmed is installed

```powershell
tools\Test-ModPresent.ps1 -GameRoot '<path>' -Name 'Immersive Gigs','Dark Future'
```

Exit 1 if any of them is absent. Run it before a report, a suspect list, or a
sentence that names mods.

**Why it matters more than it looks.** On 2026-08-23 a crash suspect list named
`AnywherePrologueUnlock`. It had been uninstalled, and the user had to say so.
The cost was not the wasted line - it was that every other name in the list
became worth less, because a diagnosis is only worth what its weakest claim is
worth. "That mod isn't even installed" is the fastest way to make somebody stop
believing the rest.

**It happens by taking a name from memory instead of from disk**, and the stale
sources all look authoritative:

| source | why it lies |
|---|---|
| a bisect park manifest | a snapshot of a PAST state, by design |
| a backup folder | things that WERE installed |
| `modlist.txt` | holds slots for disabled mods on purpose |
| the mod manager's list | staged is not deployed |
| earlier in this conversation | the install changes under you - purges, deploys, uninstalls |

That last one is the one that catches an agent. A list assembled twenty minutes
ago is not evidence about now, and on an install being actively worked on it is
frequently wrong.

## A feature that works for everyone else is not the thing to route around

**If something is supposed to work, and works for thousands of other people, and
does not work on this install - something is WRONG. Find it.** Do not design a
way to live without it.

A workaround written down becomes a rule, and the rule outlives the fault. On
2026-08-22 a CET overlay was dead for five hours. Once the cause was known - a
second keyboard emitting phantom key events - the tempting conclusion was "never
rebind CET's overlay through its UI, write the value to the file instead." CET's
UI is not broken. It works for everyone. Recording that would have taught every
future reader a false fact about CET that outlasted the broken keyboard.

A workaround is legitimate only as a **stated temporary measure while the hunt
continues**. It is never the answer, and it never goes into a skill, a reference
or a memory as guidance. When the cause turns out to be hardware or environment,
fix or remove THAT - do not adapt the practice around it.

The same rule applies to describing what happened: **what was done on the night
is history; what to do next time is guidance.** Only the second kind should read
as instruction, and only when it is actually true in general.

## For an input problem, inventory the physical inputs FIRST

One WMI query, before any software:

```powershell
cyberwise-hotkeys	ools\Get-Hotkeys.ps1 -Devices
```

It names every keyboard the machine has, flags virtual endpoints, and says what
more than one physical keyboard means. The failure that produced this rule went
through five binding stores, CET's config and state files, the D3D12 render hook,
ReShade, RTSS, Discord, DisplayFusion, Game Bar, accessibility filters, keyboard
filter drivers and 425 mods parked in a bisect round - while `Win32_Keyboard`
had been reporting **four keyboards** the entire time and nobody asked.

**A keyboard switched OFF but still cabled still enumerates and still reports.**
Its switch is the radio, not the USB interface. On plug-in or power transition a
faulty one emits a key-down with no key-up; every program running at that instant
believes the key is held for the rest of its life. That is how a hotkey binding
becomes a chord nothing can match, and how one app is unusable while others are
fine - each tracks its own copy of the key state.

**A virtual HID endpoint injects at driver level**, so its events carry no
INJECTED flag. A low-level capture showing "nothing is being injected" does not
clear them.

## Where records live - one place, agent-neutral

Anything this family must **remember about an install** goes on disk beside the
game's own data, never in the repo and never only in conversation:

```
%USERPROFILE%\Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\
```

**It is agent-neutral**, which is the point: Claude Code and Codex read the same
path, so work begun under one is picked up by the other. A fact held in one
agent's memory is invisible to the next and lost the moment the user switches -
and an unrecorded override is an invisible one. Rationale and the full layout:
`references/environment.md`.

**The change register lives there too, and that is why.** It records approved
local modifications to files Cyberwise itself ships, so it has to survive a fresh
clone, a hard reset, and an update that overwrites the working tree. A record of
local changes kept in the repo is destroyed by exactly the event it exists for.

## A generated page can ask for work - carefully

The reports here are dead HTML, so a sheet that has drifted from reality stays
wrong: fixing it means leaving the page, finding a terminal and remembering a
tool name. `tools/Start-CwEndpoint.ps1` is a loopback service that lets a button
on the page ask for the work instead.

**"A local listener that runs prompts when poked" is a genuinely bad object to
leave on a machine**, and the obvious implementation is an exploit. Five
properties make it safe, and none is optional:

| property | what it stops |
|---|---|
| binds `127.0.0.1` only, never `+` | anything off this machine. Needs no admin, no URL reservation |
| the request names an **id** and nothing else | injection - there is no request field that reaches a shell, which is a stronger claim than sanitising one |
| `Origin` must be absent or `null` | **a website making your browser POST to 127.0.0.1.** A browser sets Origin and a page cannot forge it, so any `http(s)` origin is refused |
| a token from a file, in a custom header | a page that defeated the origin check. It also forces a CORS preflight, which is a second origin check before anything runs |
| a mode the user chooses, defaulting to `prompt` | everything, by default. `prompt` executes **nothing** - it hands the text back to copy |

Commands, script paths and arguments live in `endpoint.actions.json`, which
ships. Adding a capability is an edit to that file and a review, never a runtime
decision. Placeholders in an action's arguments are filled from the endpoint's
own startup parameters - never from the caller.

`GET /actions` returns each action's real prompt text, which is what the page's
`?` lightbox must display. **A page that shipped its own copy of the prompt
could show one thing and send another**, which would make inspecting it theatre.

Every request is appended to `<records>\Cyberwise\endpoint.log`, refusals
included. The page must degrade on its own: if `/health` does not answer it
falls back to a copy button, because the endpoint is an accelerator and must
never become a dependency.

## Know where each kind of mod lives

Not everything deploys to `archive\pc\mod`. A mod "missing" from there may simply
not belong there:

| kind | location |
|---|---|
| archives | `archive\pc\mod\` |
| REDmod | `mods\<name>\archives\` |
| ASI plugins | `bin\x64\plugins\` |
| CET mods | `bin\x64\plugins\cyber_engine_tweaks\mods\<name>\` |
| RED4ext plugins | `red4ext\plugins\<name>\` |
| redscript | `r6\scripts\<name>\` |
| TweakXL | `r6\tweaks\` |
| input binds | `r6\input\*.xml` |

All of those are relative to the game root, wherever this install put it - Steam,
GOG and Epic all differ, and the drive is whatever the user chose. Establish the
root once and build paths from it; never assume a default install location.

**Some archives are written at runtime.** At least one known mod (Dynamic Moon
Phases) generates its `.archive` from an ASI at game start, so the file appears and
vanishes between sessions. Because the mod ships no archive of its own, any check
that compares deployed archives against installed copies - a manager's staging
folders, or a manual installer's own record - reports it as an orphan. Never prune
its entry as stale, and note it still needs a permanent slot in `modlist.txt`,
because an unlisted archive sorts last and loses.

## Tools here

| tool | what it does |
|---|---|
| `tools/ModFileBackup.ps1` | snapshot / diff / restore for any file you are about to edit in place |
| `tools/ModPatchWatch.ps1` | register every patch and override, then sweep for the ones whose upstream file has changed |
| `tools/Test-ScriptsLive.ps1` | is a `.reds` mod's code actually in the compiled bundle the game loads |
| `tools/Test-InstallReady.ps1` | before you press Play: what is wrong, and which half launching will fix |
| `tools/Test-Upstream.ps1` | does this copy of Cyberwise still match what shipped, and is every difference written down |
| `tools/UpstreamGuard.ps1` | the shared helper behind that: `Register-CwChange`, and the advisory every tool runs at startup |
| `tools/New-UpstreamManifest.ps1` | declare what upstream looks like now. Deliberately separate from checking |
| `tools/Start-CwEndpoint.ps1` | a loopback endpoint so a generated page can ask for work, gated by a mode the user picks |

**Cyberwise watches itself, and it is advisory on purpose.**
`skills\cyberwise\upstream.manifest` carries a sha256 of every behaviour-bearing
file the family ships - tools, `SKILL.md`s, tests, the installer. Wiki articles
are deliberately excluded: they are meant to grow, and guarding them would fill
the register with noise inside a day.

Every tool checks on startup, so a change gets noticed by the act of using the
thing rather than by somebody remembering to look. It is silent when clean and
one short line when not. **It never blocks anything, and it is deliberately not
a `PreToolUse` hook** - one of those fails closed and blocks every `Edit` in
every session on the machine, including the edit that would fix it.

Two words about tone, because they decide whether it survives: it reports
**"differs from upstream"**, never "corrupted" or "tampered". Plenty of people
legitimately want their copy changed. **The finding is the unlogged change, not
the change.**

```powershell
tools\Test-Upstream.ps1              # the report; -All to include the files that match
tools\New-UpstreamManifest.ps1       # dry run: what WOULD become the new upstream
tools\New-UpstreamManifest.ps1 -Write
```

Rerun the generator after any deliberate change to a shipped file, the same way
you rerun `Get-ToolIndex.ps1 -Write` after adding a tool - that is what keeps the
manifest current rather than a fossil. If the change belongs to *this install*
rather than to Cyberwise, register it instead; regenerating would erase the only
evidence it exists, and the next update would take it away with nothing noticing.

**Before a launch, ask what state the install is in.**

```powershell
tools\Test-InstallReady.ps1 -GameRoot '<path>'      # ~0.5s; -Deep reads the bundle
```

It sorts findings into **fixed by launching** and **launching will not fix
this**, which is the distinction that makes any of it actionable. Script mods
newer than the compiled bundle are the first kind and need no action at all;
archives with no `modlist.txt` entry are the second, and they sort last and lose
every file they contest until somebody notices. Reported together they are a wall
of warnings; reported apart, one of them is the answer.

**"The file is in `r6\scripts`" is not "the code is running."** `.reds` mods run
from a bundle compiled at launch, so a mod installed since the last launch is
enabled, correct, and doing nothing - with no sign in game. Ask the bundle:

```powershell
tools\Test-ScriptsLive.ps1 -GameRoot '<path>'            # what is stale
tools\Test-ScriptsLive.ps1 -GameRoot '<path>' -Mod 'X'   # one mod, symbol by symbol
```

It also catches the log traps that make this hard to check by hand - an archived
redscript log is named for the run that *replaced* it, and a compile test
overwrites the current one. Both in `references/script-cache.md`.

**Fixing another author's mod? Register it.** `Register-ModPatch` records the hash
of their file as it was when you patched it; `Test-ModPatches` re-checks after any
mod update and reports `CHANGED`, `GONE` or `NOOVER`. Without that, an override
silently keeps winning over every fix the author ships afterwards - which is the
one failure mode that makes overriding a whole file risky at all. See
`references/environment.md`.

Dot-source it (`. tools\ModFileBackup.ps1`) and use `Set-ModFileContent` instead
of `Set-Content` for anything inside a user's install. It prints the diff, takes
a timestamped snapshot, then writes - and tells you the exact `Restore-ModFile`
command to undo it. `-WhatIf` shows the diff and stops, which is the right first
call.

It refuses files over 50 MB without `-Force`, because `.archive` files run to
gigabytes and are never hand-edited - a backup tool that fills the disk is its
own kind of damage.

## Every tool in the family

**Before you write a tool, read this table.** It is the whole point of it. On
2026-08-22 a preset decoder was proposed and half-designed before anyone noticed
that `Decode-Preset.ps1` had shipped months earlier with the exact `-Compare`
mode being asked for. A second copy of a tool is worse than no tool: it splits
the tests, and whoever comes next finds whichever one they find first.

The table is **generated from the tools on disk** by
`cyberwise/tools/Get-ToolIndex.ps1`, and the test suite fails when it drifts - a
hand-kept index would be right the day it was written and quietly wrong after,
which is worse than none, because an index gets trusted.

```powershell
tools\Get-ToolIndex.ps1            # print it
tools\Get-ToolIndex.ps1 -Write     # after adding or renaming a tool
```

<!-- TOOL-INDEX:START -->
| tool | skill | what it does |
|---|---|---|
| `Get-ToolIndex.ps1` | `cyberwise` | every tool in the family, in one table. |
| `ModFileBackup.ps1` | `cyberwise` | take back the ability to undo. |
| `ModPatchWatch.ps1` | `cyberwise` | notice when a mod you patched or overrode has changed. |
| `New-UpstreamManifest.ps1` | `cyberwise` | declare what upstream looks like, right now. |
| `Start-CwEndpoint.ps1` | `cyberwise` | a loopback endpoint so a generated page can ask for work. |
| `Test-InstallReady.ps1` | `cyberwise` | if you launched right now, what would be wrong? |
| `Test-ModPresent.ps1` | `cyberwise` | is this mod actually installed right now? |
| `Test-ScriptsLive.ps1` | `cyberwise` | is a script mod's code actually in the compiled bundle? |
| `Test-Upstream.ps1` | `cyberwise` | does this copy still match what shipped, and is every difference written down? |
| `UpstreamGuard.ps1` | `cyberwise` | the upstream check every tool runs at startup, and the change register behind it. |
| `Find-QuestConflicts.ps1` | `cyberwise-conflicts` | which mods touch a quest, and which of them win. |
| `Repair-LoadOrder.ps1` | `cyberwise-conflicts` | Check (and optionally repair) the Cyberpunk 2077 archive load order. |
| `Resolve-ResourcePath.ps1` | `cyberwise-conflicts` | turn archive hashes into file paths, and back. |
| `Compare-InputSnapshot.ps1` | `cyberwise-crashes` | diff two input snapshots |
| `Compare-InstallSnapshot.ps1` | `cyberwise-crashes` | answer "what changed?" |
| `Invoke-BisectRound.ps1` | `cyberwise-crashes` | park a set of mods, record the round, launch the game. |
| `New-InputSnapshot.ps1` | `cyberwise-crashes` | record the input stack, so "is that normal?" has an answer |
| `New-InstallSnapshot.ps1` | `cyberwise-crashes` | record what the install looks like right now. |
| `Register-CrashWatch.ps1` | `cyberwise-crashes` | keep the crash watcher alive without a terminal. |
| `Save-CrashSnapshot.ps1` | `cyberwise-crashes` | preserve what a relaunch destroys, then state the facts. |
| `Watch-CrashDump.ps1` | `cyberwise-crashes` | catch the exception the game swallows, and name the module. |
| `Watch-Crashes.ps1` | `cyberwise-crashes` | sample the game while it runs, and capture its own post-mortem when it dies. |
| `New-ProblemReport.ps1` | `cyberwise-feedback` | assemble a report the author can act on. |
| `DeviceGeometry.ps1` | `cyberwise-hotkeys` | where a device's buttons physically ARE, read from the user's own wiki bundle rather than from a table shipped inside the tool. |
| `Get-Hotkeys.ps1` | `cyberwise-hotkeys` | harvest the ACTUAL key bindings from a Cyberpunk install. |
| `Get-MouseProfile.ps1` | `cyberwise-hotkeys` | read the key remaps a Corsair iCUE profile puts on a programmable mouse, so they can be joined to what the game does with them. |
| `KeyIdentity.ps1` | `cyberwise-hotkeys` | one key, one identity, whatever vocabulary named it. |
| `New-HotkeySheet.ps1` | `cyberwise-hotkeys` | build a self-contained hotkey cheatsheet from the bindings actually present in a Cyberpunk install. |
| `Get-ModInventory.ps1` | `cyberwise-modbase` | every mod actually deployed, what layers it touches, and its Nexus id where one can be derived. |
| `New-ModStubs.ps1` | `cyberwise-modbase` | one OKF article per deployed mod, built from the install. |
| `New-GapWaypoints.ps1` | `cyberwise-netsec` | turn NetSec's GAP diagnostic into CETMonkey teleport waypoints, so the holes in the world can be visited instead of hunted for. |
| `ModPreference.ps1` | `cyberwise-recommends` | what this user has already said about being recommended things. |
| `Test-Capabilities.ps1` | `cyberwise-recommends` | what this install cannot do, and what is missing to do it. |
| `Compare-Collection.ps1` | `cyberwise-reports` | what a curated Nexus collection has that you do not. |
| `Measure-PageFit.ps1` | `cyberwise-reports` | does a page fit a given viewport without scrolling? |
| `ModManifestHtml.ps1` | `cyberwise-reports` | render a mod manifest as a self-contained HTML report. |
| `New-ArchiveAnatomy.ps1` | `cyberwise-reports` | what the archive layer actually contains. |
| `New-ModCredits.ps1` | `cyberwise-reports` | the people whose work is in your game, as end credits. |
| `New-ModDossier.ps1` | `cyberwise-reports` | everything this install knows about ONE mod. |
| `New-ModManifest.ps1` | `cyberwise-reports` | Generate a readable manifest of an installed Cyberpunk 2077 mod list. |
| `New-SystemProfile.ps1` | `cyberwise-reports` | a deterministic profile of a modded Cyberpunk 2077 install, as Discord-pasteable markdown, an HTML report, and an OKF wiki article. |
| `NexusCredential.ps1` | `cyberwise-reports` | keep a Nexus API key in Windows Credential Manager instead of in a script, a config file, or a chat log. |
| `Show-ViewportProbe.ps1` | `cyberwise-reports` | ask the user's actual browser window how big it is. |
| `Decode-Preset.ps1` | `cyberwise-saves` | turn AppearanceChangeUnlocker .preset files into readable appearance fields. |
| `Expand-Save.ps1` | `cyberwise-saves` | decompress a Cyberpunk 2077 sav.dat into a flat blob. |
| `ConvertFrom-Markdown.ps1` | `cyberwise-sitebuilder` | the small Markdown subset these documents use. |
| `New-CharacterSite.ps1` | `cyberwise-sitebuilder` | a website from a folder of character documents. |
| `Initialize-UserWiki.ps1` | `cyberwise-wiki` | create this user's knowledge bundle, from nothing. |
| `Test-Wiki.ps1` | `cyberwise-wiki` | does this bundle conform to OKF 0.2, and does it respect the distribution boundary? |
<!-- TOOL-INDEX:END -->

## Which skill covers it

Load the one that matches. They are separate so that reading about keybinds does
not cost you anything when the question is about textures.

| skill | use it when |
|---|---|
| `cyberwise-conflicts` | a mod is installed but does nothing; textures or body parts look wrong; load order, override direction, inert archives, `.archive` internals |
| `cyberwise-crashes` | the game crashes, hangs or fails to launch; reading logs; finding which mod is responsible |
| `cyberwise-saves` | reading a save, character appearance data, ACU appearance presets |
| `cyberwise-recommends` | a task needs a tool this install lacks; before mentioning any mod nobody asked about |
| `cyberwise-hotkeys` | what a key is bound to, rebinding, generating a hotkey cheatsheet |
| `cyberwise-reports` | inventory the mod list, profile the machine, or generate any HTML/markdown deliverable |
| `cyberwise-tweaks` | TweakXL/TweakDB edits, CET Lua and console commands, finding game text |
| `cyberwise-netsec` | NetSec logged coverage gaps; turning its diagnostic into places you can teleport to; planning where access points belong |
| `cyberwise-reshade` | ReShade add-on builds, shader pack collisions |
| `cyberwise-backstory` | building a character - V's history, voice, roleplay decisions, a dossier |
| `cyberwise-sitebuilder` | publish character documents, or anything else here, as a shareable website |
| `cyberwise-feedback` | Cyberwise itself is wrong, a tool errors, or the user wants to reach the author |
| `cyberwise-wiki` | writing down anything a later session would look up; a skill file has grown a section that is really reference material |
| `cyberwise-modbase` | what does this mod do; auditing a large load order; running a documentation pass over the install |

Two references stay here rather than in one of those, because they bear on all of
them: `references/environment.md` (manager behaviour, the settings store,
compile-testing) and `references/script-cache.md` (what is actually in the
compiled script bundle, and the log traps around it).

**Both are now mostly pointers.** The knowledge they used to carry lives in the
**base wiki** - `wiki/` INSIDE the `cyberwise-wiki` skill, so it installs with
the skills and is readable from an installed copy, not only a checkout -
because a skill file is instructions and a wiki article is knowledge, and those
rot at different rates. The reference files keep the parts that change what you
*do*, and name the article for the rest. Its `/process` area is worth reading
before running a documentation pass over a whole load order; `/patterns` before
attributing any setting to a user.

### Read the wiki before re-deriving anything

Two bundles, and both are worth a look before starting work:

- the **base wiki** ships with these skills and holds game, engine and format
  knowledge plus cross-mod patterns. `/process` before running any documentation
  pass; `/patterns` before attributing a setting to a user.
- the **user bundle**, beside the game's own records, holds this install: its
  machine profile and one article per deployed mod. **If it does not exist yet,
  create it** - `cyberwise-wiki/tools/Initialize-UserWiki.ps1 -GameRoot '<path>'`
  - because until it does, every session pays again for facts somebody already
  established here.

A question like "what does this mod do", "why is this key bound to that", or
"what is this machine capable of" should start with a grep of those bundles. The
whole point is that the second time costs a lookup instead of an afternoon.

**These are additive.** A hotkey sheet is also an HTML deliverable, so that job
wants `cyberwise-hotkeys` *and* `cyberwise-reports`. Load both.

`cyberwise-backstory` is the odd one out: it is about **playing** the game rather
than fixing it, and none of the method rules above apply to it. It is here
because this is where the Cyberpunk knowledge lives. If the question is about a
character rather than an install, go straight there - the diagnostic rules will
only get in the way.
