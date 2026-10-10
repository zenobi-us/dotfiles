# Environment, mod managers, and tooling traps

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> **Re-check after a patch:** Mod manager behaviour rather than game behaviour, so it drifts with Vortex/MO2 releases. The redscript compile-test invocation is the part most likely to change with a scc update.

Every path here is **relative to the game install root**. Steam, GOG and Epic put
that root in different places, users move it, and it is not always on C:. Get the
real root once - from the manager, from the launcher, or by asking - and never
assume a drive letter.

## Where the knowledge went

Most of what used to be on this page was reference rather than instruction, and
it now lives in the **base wiki** (`wiki/` in the Cyberwise repo; see
`cyberwise-wiki`). This file keeps what changes what you *do*.

| you need | read |
|---|---|
| what Vortex / MO2 / Wabbajack / manual each make untrue on disk, link counts, staging names, in-game-written files, resolving an internal name to a findable mod, timestamps | `/install/how-the-install-is-assembled` |
| override vs in-place patch, the granularity table, which copy to edit per manager, adding to a mod without touching it | `/install/overriding-another-authors-mod` |
| two downloads that are not alternatives, byte size as the identity tell, why shared records are not duplication | `/install/two-builds-of-one-filename` |
| loose archives vs REDmod, why a conflict scan only sees one domain | `/engine/two-load-order-domains` |
| the compiled script bundle, false absences, the all-or-nothing compile gate | `/engine/compiled-script-bundle` |
| `UserSettings.json` as the authority on any engine option | `/engine/option-registry-is-the-authority` |
| which settings store a mod writes to | `/patterns/live-state-is-not-defaults` |
| whether a value in that store was chosen by a human at all | `/patterns/defaults-can-be-written-by-code` |

## Read the user's real settings, not a mod's defaults

**Check the live store first for any "what is X set to" or "which key does Y"
question.** Quoting a shipped default has caused real errors - one mod's XML
declared a hotkey of `IK_O` while the user's actual binding in `user.ini` was
`IK_Pause`.

```
red4ext\plugins\mod_settings\user.ini      # mods that opt into the shared framework
bin\x64\plugins\cyber_engine_tweaks\mods\<name>\*.json   # CET mods, filename chosen by the author
```

`user.ini` holds `[Module.Class]` sections with `key = value`, and on a heavily
modded install runs to thousands of entries. **A missing key means "never
overridden", not "not configurable"** - the shipped default then applies.

Three follow-on rules, each with its full case in the wiki:

- **A mod with no `@runtimeProperty` annotations will never appear in
  `user.ini`**, and its silence there is a false negative, not evidence.
- **A value being present does not mean a person chose it.** Mods seed their own
  settings during init and persist them. Before writing "the user set X", read
  the init, discovery, apply and migrate paths - `/patterns/defaults-can-be-written-by-code`.
- **The game's own option registry outranks any mod's label** for anything the
  engine exposes - `/engine/option-registry-is-the-authority`.

And the layer rule that governs all of it: **a negative is only as wide as the
layer you searched.** A control can act through the mod's own config, the option
registry, a second control in the same mod, or a native plugin in compiled code.
Report "nothing in `<layer>`", never "nothing".

## Establish how the install is assembled FIRST

| look for | means |
|---|---|
| `__folder_managed_by_vortex` markers; staging folders named `<Display Name>-<NexusID>-<version>-<timestamp>`; deployed files with **link count 2** | Vortex |
| `ModOrganizer.ini`; mods under MO2's own `mods\` tree; a game directory that looks bare while the game is closed | MO2 |
| MO2 mods named `[NoDelete] ...`; a `.wabbajack` file | a Wabbajack list (an MO2 install underneath) |
| files simply present, no markers, no staging root, no deployment step | manual |

Staging roots are relocatable and frequently relocated. **Ask for the path; do
not assume one.** The modes are not exclusive, so "the manager doesn't list it"
is never evidence a file is not loaded.

Three consequences that change what you do, before reading the full article:

- **On MO2, "the file isn't there" proves nothing** - USVFS means mod files may
  never be physically present, and Root Builder discards anything copied into the
  game directory when the game closes. Run inspections **through MO2**.
- **On a Wabbajack list, anything you add must be named `[NoDelete] ...`**, or
  the next list update deletes it silently. Number them
  (`[NoDelete] [0000]`) because they re-sort alphabetically.
- **On Vortex, write through the hardlink.** A tool that deletes and recreates a
  file desynchronises staging from deployment.

Full account: `/install/how-the-install-is-assembled`.

## Where this family keeps its records

```
%USERPROFILE%\Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\
    patches.json              every patch and override, with the upstream hash it was made against
    upstream\<name>.upstream  a copy of the author's file as it was when you patched it
    preferences.json          what the user has said about being recommended things
    changes.md                the CHANGE REGISTER: approved local edits to files Cyberwise ships
    changes\<id>.mine         a copy of each modified file, to re-derive the change from after an update
    wiki\                     the per-user knowledge bundle, which NEVER ships
    reports\                  every generated HTML or Markdown report
    endpoint.token            the loopback endpoint's shared secret
    endpoint.log              every endpoint request, refusals included
```

**Generated reports go in `reports\`, and nowhere else.** They used to default
to `%USERPROFILE%\Downloads` or, worse, to `Get-Location` - which is whatever
directory the caller happened to be standing in, so an agent run from a clone
wrote reports into the repo. Neither is a place anybody goes looking a week
later, and Downloads is a folder people empty. A report is a record of this
install and belongs with the other records; `-Out`, `-Html` and `-Md` still
override it for a one-off.

Beside the game's own data, in a namespace folder of ours - the same shape mod
authors use for their data there. Three reasons, and the third is why it is not
in `%LOCALAPPDATA%`:

1. **It describes the install, not the tooling**, so it belongs with the game.
2. **It outlives the tooling.** Reinstalling, moving or deleting these skills
   does not lose the knowledge of what was patched.
3. **It is agent-neutral.** Claude Code and Codex read the same path, so work
   begun under one is picked up by the other.

**Never keep install records in the skill repo** - it is shared, and they
describe one person's machine. **Never keep them only in conversation memory** -
the next session may be a different agent, or the same one after a reset.

Write JSON, keep it small, and make each record say *why* as well as *what*: a
future reader has to judge whether a patch is still wanted, not merely that it
exists.

## Ship a fix as a mod, not as files in the game folder

Files written directly into the game directory are invisible to the manager, and
a purge, redeploy or mod update silently reverts or orphans them. **Package a mod
as a zip and let the user install it through their manager.**

Two deliberate exceptions, both worth naming out loud when you take them:

- **Fixing a bug in another mod's own file** - see below.
- **Diagnostic tooling and backups the user has agreed to.** Keep them in clearly
  named folders that cannot be mistaken for mod content, and say they are there.

## Fixing a bug in someone else's mod

The decision - override their file or patch it in place - is in
`/install/overriding-another-authors-mod`, along with the granularity table and
which copy to edit on each manager. The short form: **prefer an override**,
prefer overriding a *record* over a *file* where the format allows it, and give
the override the **same relative path** so load order decides.

What has to happen here, every time, is the registration. The one real danger of
an override is that the author's next update loses to your copy with nothing
saying so, and that danger is entirely a not-noticing problem:

```powershell
. tools\ModPatchWatch.ps1
Register-ModPatch -Name '<what>' -UpstreamPath '<their file>' -OverridePath '<yours>' -Note '<why>'
Test-ModPatches      # the sweep - run after ANY mod update
```

`Register-ModPatch` records the hash of the author's file **as it was when you
patched it**. The sweep re-hashes and reports `CHANGED` when they ship a new
version, `GONE` when the mod is uninstalled or restructured, and `NOOVER` when
your override file is not actually there.

**Do this for every patch and every override, without exception.** An
unregistered override is exactly the thing that quietly reimposes old behaviour
for months. A registered one is a line of output after an update.

Whatever you edit, snapshot it first with the front door's `ModFileBackup.ps1`.

## Changing Cyberwise itself: the upstream guard and the change register

Everything above is about other people's mods. This is about *this family's own
files*, and the failure is the same one in a mirror: a fresh agent, halfway
through a problem, edits a Cyberwise tool to solve something the family already
solves another way, and nothing reports it. The next session inherits a tool that
no longer behaves the way its own documentation says, and cannot tell. The same
absence of a record is also how deliberately hostile behaviour would hide - a
modified tool is invisible precisely because nobody ever compares.

**Deviation is not a fault.** The check reports "differs from upstream", never
"corrupted" and never "tampered". Plenty of people want their copy changed and
they are right to. **The finding is the UNLOGGED change, not the change** - a
check that scolds people for legitimate customization gets switched off, and then
it protects nobody at all.

### Two halves, in two places, on purpose

| half | what it is | where | why there |
|---|---|---|---|
| **truth** | `upstream.manifest` - sha256 of every behaviour-bearing file | `skills\cyberwise\` **in the repo** | ships with the family, so a fresh clone carries its own idea of what it should look like. It is inside a skill because `install.ps1` links `skills\*` and nothing above them - anything at the repo root is unreachable from an installed copy |
| **intent** | `changes.md` - the change register | `<records>\Cyberwise\` **never in the repo** | it has to survive a fresh clone, a hard reset, and an update that overwrites the working tree. A record of local changes kept in the repo is destroyed by the exact event it exists for |

**Guarded:** `skills\**\tools\*.ps1`, every `SKILL.md`, `tests\*.ps1`,
`install.ps1`. **Not guarded: wiki articles.** They are *meant* to grow -
`Initialize-UserWiki` writes one stub per deployed mod and every documentation
pass deepens more of them. Guarding them would put the register into double
figures within a day, and a noisy register is an ignored register.

Hashes are taken over content with CRLF collapsed to LF and any UTF-8 BOM
dropped. This repo has no `.gitattributes`, so without that normalisation a
manifest generated on one machine disagrees with a fresh clone on another for
every single file - and a check that fires on everything is a check nobody reads.

### Where it fires

- **Every tool, at startup.** A check nobody runs is worth nothing, and the agent
  most likely to hack a tool is the least likely to run the test suite - so the
  provocation is the tool itself. Silent when clean; one short line when not. It
  costs about 80 ms on a run that already takes ~350 ms.
- **`tests\Test-Family.ps1`,** as a ship gate.
- **By hand,** `tools\Test-Upstream.ps1`, at the start of any Cyberwise task.

**It never blocks anything, and it is deliberately NOT a `PreToolUse` hook.** A
failing `PreToolUse` hook fails *closed* and blocks every `Edit` in every session
on the machine - including the edit that would fix the hook. That has already
bitten this setup once. The guard is advisory by design, and every entry point is
wrapped so a fault in it costs a line of output and nothing else.

`CYBERWISE_NO_GUARD=1` silences the startup advisory (the test suites set it for
deterministic output). `CYBERWISE_RECORDS` overrides the records root.

### What it prints

| state | means | what to do |
|---|---|---|
| `OK` | matches the manifest | nothing |
| `REGISTERED` | differs, and the register describes the bytes on disk | nothing - a known local customization |
| `UNREGISTERED` | differs with nothing recorded, **or** a register entry that no longer matches because the file changed again | register it, or regenerate the manifest, or restore the file |
| `MISSING` | in the manifest, not on disk | find out what removed it |
| `NEW` | on disk in a guarded location, absent from the manifest | a new tool needs the manifest regenerating |

An **absent manifest** is reported in its own right rather than skipped - deleting
one file is the cheapest way to make every other difference invisible.

An installed copy has no `tests\` and no `install.ps1`; those entries are counted
as out of scope, not as `MISSING`.

### The register format

Markdown, because two audiences have to read it and neither can be sacrificed: a
**person**, a year later, deciding whether they still want a customization; and
the **update flow**, which pulls upstream, re-applies what is registered, and
lists it at the bottom of a changelog. Prose for the first, fields for the second.
It is parsed by hand, for the reason `Test-Wiki.ps1` hand-rolls its own parsing -
there is no YAML parser in Windows PowerShell and adding one would break the rule
that this family needs nothing installed.

```markdown
## 2026-08-25-cyberwise-tools-test-installready

- file: skills/cyberwise/tools/Test-InstallReady.ps1
- status: active
- sha256: 9F3C...        <- the file as registered; if it no longer matches, the entry is out of date
- upstream: 41AB...      <- what the manifest said at the time
- copy: changes/2026-08-25-cyberwise-tools-test-installready.mine
- reapply: re-derive
- approved-by: tohuw
- recorded: 2026-08-25T09:14:00-04:00

**What changed.** Raised the archive-count warning threshold from 200 to 600.

**Why.** This install runs 425 archives, so the warning fired on every run and
stopped being read.
```

Hand-editing is expected and safe: an entry missing a field parses with that
field empty rather than being rejected, because a register that refuses to load
after somebody fixes a typo is a register that gets deleted. Re-registering the
same file marks the older entry `superseded` and appends a new one, so nobody's
prose is destroyed by a tool.

**`copy` is for re-deriving, never for replaying.** Re-applying an old edit
mechanically to a file that has since moved either fails - which is fine - or
succeeds in the wrong place, which is silent and worse. Same rule, and the same
reason, as `Show-ModPatchDrift`.

### Adding an entry, and the question to ask first

```powershell
. tools\UpstreamGuard.ps1
Register-CwChange -File '<path>' -What '<what changed>' -Why '<why>' -ApprovedBy '<who said yes>'
```

`-ApprovedBy` is mandatory and has no default. A change nobody approved is the
thing this guards against, so it cannot be omitted.

**Before registering anything, check the change was necessary.** The commonest
version of this failure is patching a tool to do something the family already has
an affordance for:

| about to | do this instead |
|---|---|
| hard-code a path, name or threshold into a tool | put it in the user bundle, where it describes this install |
| edit another author's mod file | ship an override mod, and `Register-ModPatch` it |
| change what a tool reports so a warning stops firing | fix the cause, or record why the warning is wrong here |
| teach a tool a fact | write a wiki article - the tools read the bundle |

### Regenerating the manifest

```powershell
tools\New-UpstreamManifest.ps1           # dry run - what WOULD become upstream
tools\New-UpstreamManifest.ps1 -Write
```

**Deliberately a separate script from the check, and it must stay one.** If
checking could also regenerate, the first thing anybody would do on seeing a
finding is run the fix, and the guard would silently bless whatever it found -
including the edit nobody meant to keep.

Run it after any deliberate change to a shipped file, exactly as you rerun
`Get-ToolIndex.ps1 -Write` after adding a tool. That is what keeps the manifest
current instead of a fossil. **If the change belongs to this install rather than
to Cyberwise, register it instead** - regenerating erases the only evidence it
exists, and the next update takes it away with nothing to notice.

## The mod's own settings UI writes on exit

Where mods share a settings framework, the in-game panel is the source of truth
and it **writes its config file when the session ends**. An edit made externally
while the game is running is overwritten on exit with no error - the change simply
is not there next time, and the obvious conclusion ("the setting does not work")
is wrong.

So **report what differs and which setting controls it, then stop.** A diff of
intent against saved values is genuinely useful; a blind write to the config file
is a change the user did not see, may lose anyway, and cannot easily undo. Offer
to write it only if they ask for that.

## Redscript compilation is all-or-nothing

**If redscript fails to compile, every single `.reds` mod is silently off.** No
error, no warning, no missing-feature message. Check `r6\logs\redscript_*.log`
for `Compilation complete` and a plausible source reference count - this belongs
among the first things verified on any install where "a script mod isn't
working". On a virtualising install the log lands wherever that manager redirects
runtime writes (MO2: Overwrite) rather than where you expect.

Causes, plugin-DLL gating, and how to tell a real absence from a false one:
`/engine/compiled-script-bundle` and `references/script-cache.md`.

## Triaging TweakXL errors

**The count is not a health metric** - see
[a data-layer log is noisy by design](/diagnosis/reading-a-noisy-tweak-log) in
the base wiki for what the noise is made of, why the failing set changes between
launches with no mod change, and the one question that separates a broken
feature from a benign line.

What that leaves as procedure: do not drive the count to zero, and check an
error's timestamp against your own file moves before chasing it.

## Compile-testing redscript without launching the game

`scc.exe` ships with redscript and lives under the game root, so this only exists
on an install that has redscript at all:

```
<game>\engine\tools\scc.exe -compile <game>\r6\scripts -compilePathsFile <paths> \
    -customCacheDir <dir> -outputCacheFile <file>
```

`<paths>` must list **only the extra script directories** - every directory under
`red4ext\plugins` that contains `.reds` (Codeware, TweakXL, ArchiveXL, mod_settings
and similar). Enumerate them; do not hardcode a list, since which frameworks are
installed varies per install.

- **Do not also list `r6/scripts` in the paths file.** It double-compiles and
  produces thousands of bogus `SYM_REDEFINITION` errors.
- **Do not omit the plugin directories.** That produces bogus "Codeware missing"
  errors instead.

Caution: `scc.exe` writes into `r6\logs` and rotates at 5 files, destroying older
`redscript_*.log` history. Back that folder up first if it matters. It also pops a
GUI dialog on failure, so do not run it unattended. And it **overwrites the record
of the last real launch** - see `references/script-cache.md`.

**On a virtualising install this must be run through the manager.** Started from a
plain shell, it compiles a game directory the mods are not in, and reports a clean
build that means nothing.

## PowerShell traps

The tooling shipped with this skill is PowerShell, and both of these produced
convincing wrong answers before being caught:

- **`$PSScriptRoot` is EMPTY inside a param-block default** on Windows
  PowerShell 5.1, whenever the script carries `[CmdletBinding()]` and is started
  with `-File` or dot-sourced. Under the call operator it is populated, and
  pwsh 7 populates it in every case - which is exactly why it survives review.
  A tool gets written and tried at a prompt, where it works, and then breaks the
  first time a scheduled task, an installer step, the tray or an agent runs it
  with `-File`. **Six tools shipped with it here before anything noticed**, and
  the only reason it surfaced was an agent running one non-interactively.

  It fails two ways, and the quiet one is worse: `Split-Path` and `Join-Path`
  reject the empty string loudly, so those at least stop - but
  `"$PSScriptRoot	hemes"` silently becomes `"	hemes"`, the root of whatever
  drive is current. `$MyInvocation.MyCommand.Path` is **not** a workaround; it
  is null in the same position. Leave the parameter undefaulted and resolve it
  in the body:

  ```powershell
  [CmdletBinding()]
  param([string] $ThemeDir)
  if (-not $ThemeDir) { $ThemeDir = Join-Path (Split-Path -Parent $PSScriptRoot) 'themes' }
  ```

  That is correct on both engines by every invocation route, and still honours
  an explicit override. `Test-Family.ps1` checks for this by AST.
- **`Test-Path` without `-LiteralPath`** treats `[` and `]` in mod filenames as
  wildcards. On a large load order this reports a handful of phantom missing files.
- **`Sort-Object $scriptblock` binds `$_`**, so a `param($n)` block inside it
  silently receives `$null` and the sort appears to do nothing.

Also worth knowing:

- `UInt64` arithmetic throws on overflow, which breaks any hash implementation.
  Use an inline C# helper via `Add-Type` where wrapping multiply is required.
- Reading a very large JSON with `ConvertFrom-Json` is slow and memory-hungry.
  Line-by-line reading with a small state machine is faster and more predictable.
- Preserve line endings when rewriting game config files. Many are CRLF; writing LF
  can matter.

These are facts about this family's own tooling rather than about Cyberpunk,
which is why they stayed here rather than moving to a wiki that ships as game
knowledge.
