# New-HotkeySheet.ps1 -- build a self-contained hotkey cheatsheet from the
# bindings actually present in a Cyberpunk install.
#
#     .\New-HotkeySheet.ps1 -Out ~\Downloads\hotkeys.html
#
# Keys come from Get-Hotkeys.ps1, which reads them off disk - no hand-typed
# bindings, so the sheet cannot drift from the game the way a hand-written one
# does. Anything that genuinely is not on disk (mouse hardware mapping, tap/hold
# semantics) lives in a small notes json and is merged over the top; pass it with
# -Notes. Everything is inlined, so the file works offline and on a phone
# propped next to the keyboard.
#
# Optimised for reading at a glance mid-game: big keycaps, one accent colour per
# situation, no information that only appears on hover.

[CmdletBinding()]
param(
    # Left empty, Get-Hotkeys.ps1 locates the install itself (Steam / GOG / Epic
    # records, then their default folders) and errors if it cannot.
    [string] $GameRoot,
    [string] $Notes,
    [string] $Out = "$env:USERPROFILE\Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\reports\cp2077_hotkeys_cheatsheet.html",

    # The same sheet as markdown, for a forum post, a wiki, or a Discord message
    # where a local HTML file is useless to whoever you are talking to.
    [string] $Md,

    # Every type size on the sheet derives from one base, so this scales the
    # whole thing without disturbing the proportions. 1.0 is sized for reading
    # from normal seating distance; go up for a TV or a glance across the desk.
    [double] $Scale = 1.0,

    # Both off by default. The mouse pad and the shared-key list are reference
    # material, not things you glance at mid-fight, and every row they add is a
    # row competing with the ones you actually came to look up.
    [switch] $ShowMousePad,
    [switch] $ShowSharedKeys,

    # Include the bindings the BASE GAME claims, from
    # r6\config\inputUserMappings.xml. Off by default for the same reason
    # Get-Hotkeys.ps1 has it off: ~99 vanilla rows swamp a sheet about mods.
    #
    # But "vanilla row" and "the key I actually use" are not the same thing, and
    # that is why this switch had to exist here at all. Several mods CHANGE
    # BEHAVIOUR ON A VANILLA MAPPING rather than registering their own input -
    # Advanced Control and Lean Anywhere both ride LeanLeft_Button/
    # LeanRight_Button (IK_Q / IK_E), and consumable and grenade cycling ride
    # UseConsumable_Button and CombatGadget_Button. Those read as base-game
    # rows and were therefore invisible on a modded install's own cheatsheet,
    # with no way to switch them on. Reported by the user, 2026-08-24.
    [switch] $IncludeBaseGame,

    # ---- the programmable-mouse layer -------------------------------------
    #
    # ON by default whenever an iCUE profile exists, and that asymmetry with
    # -IncludeBaseGame is deliberate. The ~99 vanilla rows are generic - the
    # same list every install has - so they are noise until asked for. A mouse
    # profile is the opposite: it is a description of how THIS user actually
    # plays, hand-built by them, and it exists on maybe one machine in twenty.
    # Nothing about it is boilerplate, so nothing about it should need a flag.
    #
    # -NoMouseProfile is the escape hatch for a sheet meant for somebody else.
    [switch] $NoMouseProfile,

    # Which profile, by the name shown in iCUE. Left empty, the one with the
    # most key remaps is read and the sheet SAYS which - the filenames are
    # opaque GUIDs, so a user with several profiles has no other way to tell
    # where the rows came from.
    [string] $MouseProfile,

    # Where iCUE keeps its profiles, for a machine that puts them somewhere
    # else - and for proving the graceful path against an empty folder.
    [string] $MouseProfileRoot,

    # ---- where a device's PHYSICAL layout comes from -----------------------
    #
    # Not from a table in this tool. A registry of every peripheral, shipped
    # with the code, is a database that rots - it needs an edit every time
    # anybody buys a mouse, and the one device it will not know is the one the
    # person asking owns. A device's geometry is a fact about ONE PERSON'S DESK,
    # so it lives in that person's wiki bundle beside their machine profile,
    # where adding a device is a wiki edit rather than a release.
    #
    # Format: /input/describing-a-device-physical-geometry in the base wiki.
    # Absent, unreadable or unmatched, the buttons render as the flat list they
    # always did - most people own no programmable device at all.
    [string] $WikiBundle = (Join-Path $env:USERPROFILE 'Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\wiki'),

    # ---- what the owner has hidden ----------------------------------------
    #
    # The sheet has a hide mode: click a row or a key and it goes away, because
    # a cheatsheet is only useful at the size you can actually take in, and half
    # of any install's bindings are things the owner will never press.
    #
    # THE PAGE CANNOT KEEP THAT BY ITSELF. localStorage survives a reload, and
    # nothing more - the sheet is REGENERATED, and a hidden set living only in
    # the browser evaporates the moment it is. So the durable copy goes where
    # the device geometry already went: this user's wiki bundle, in
    # `sheet-preferences.md`, in a block a person can read and edit.
    #
    # PASSING -Hide IS AUTHORITATIVE, not additive. The list given here BECOMES
    # the hidden set - it is written to the article, and anything absent from it
    # becomes visible again. That is what makes unhiding work without anybody
    # hand-editing a file: the page hands over the complete list it is holding,
    # and the next run agrees with the page.
    #
    # Omit it entirely and nothing is written - the article is read as it
    # stands. `-Hide @()` is therefore how you unhide everything.
    [string[]] $Hide,

    # Where that article lives. Defaults inside the bundle, beside devices.md.
    [string] $PreferencesPath
)

$ErrorActionPreference = 'Stop'
function esc { param([string]$s) ($s -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;' -replace '"','&quot;') }

# ---------------------------------------------------------- no names on it ---
#
# THIS SHEET GETS SCREENSHOTTED AND SHARED. A home directory carries the account
# name, so every absolute path on the page - in the prose, in the footer, in the
# prompt meant to be pasted into a chat, and inside the command that prompt
# carries - is a username waiting to be posted somewhere. There is no reason for
# one to be on a page about keybinds.
#
# `$env:USERPROFILE` is the right substitute rather than `~` because the prompt's
# command has to still RUN: PowerShell expands the variable, and it expands to
# the same folder on the machine that generated the sheet. `~` would too, but it
# does not survive being pasted into a quoted argument.
$homeDir = ([string]$env:USERPROFILE).TrimEnd('\')
function Hide-Home {
    param([string] $s)
    if (-not $s -or -not $homeDir) { return $s }
    if ($s.StartsWith($homeDir, [StringComparison]::OrdinalIgnoreCase)) {
        return '$env:USERPROFILE' + $s.Substring($homeDir.Length)
    }
    return $s
}

# ==================================================================== gather ==

# Only forward -GameRoot when there is one, so an empty value does not override
# Get-Hotkeys' own detection with a blank path.
$harvestArgs = @{}
if ($GameRoot) { $harvestArgs.GameRoot = $GameRoot }
# THE VANILLA MAPPINGS ARE ALWAYS HARVESTED, EVEN WHEN THEY ARE NOT SHOWN.
#
# -IncludeBaseGame governs whether ~99 generic rows appear on a sheet about
# mods. It must NOT govern whether this tool KNOWS about them, and for a while
# it did: with the switch off, nothing in $binds claimed IK_MiddleMouse, so a
# mouse button sending Middle Mouse was reported as "nothing binds this key -
# does nothing in game". The game binds it to combatGadget out of the box. The
# sheet was confidently telling its owner that a working button was dead.
#
# So harvest everything, then split: the vanilla set answers "is this key
# claimed at all", and the display set is filtered exactly as before.
$harvestArgs.IncludeBaseGame = $true
$allBinds     = @(& (Join-Path $PSScriptRoot 'Get-Hotkeys.ps1') @harvestArgs)
$vanillaBinds = @($allBinds | Where-Object { $_.System -eq 'base game' })
$binds        = if ($IncludeBaseGame) { $allBinds }
                else { @($allBinds | Where-Object { $_.System -ne 'base game' }) }
Write-Host "harvested $($binds.Count) keyboard bindings" -ForegroundColor Cyan
if ($binds.Count -eq 0) {
    # Not an error: an archive-only load order declares no keys. The sheet still
    # renders, so any notes file the user passes is not silently thrown away.
    Write-Warning "no bindings on disk - the sheet will hold only whatever -Notes supplies"
}

$n = $null
if ($Notes -and (Test-Path -LiteralPath $Notes)) {
    $n = Get-Content -LiteralPath $Notes -Raw | ConvertFrom-Json
    Write-Host "merged notes from $Notes" -ForegroundColor Cyan
}

foreach ($e in $n.extra) {
    $binds += [pscustomobject]@{
        Mod=$e.mod; Action=$e.action; Key=$e.key; Pad=''
        Context=$e.context; Scope=''; Source='manual'; System='notes'
    }
}

# ======================================================= the mouse-key join ==
#
# A PROGRAMMABLE MOUSE IS A LAYER OVER THE FIVE STORES, NOT A SIXTH STORE.
#
# The device performs no game action. It sends a KEYSTROKE, and the game or a
# mod then interprets that keystroke exactly as if it had come from the
# keyboard. So the profile cannot be rendered beside the harvested bindings as
# another list of controls - it has to be JOINED to them:
#
#     physical button  ->  keystroke sent  ->  what that keystroke is bound to
#
# Printing only the first two is printing the label the user typed into iCUE
# months ago, which is a memory, not evidence. The third column is the whole
# value of the section, and it is the only thing that can report the failure
# that matters: a button whose keystroke is bound to NOTHING on disk. That
# button does nothing in game, it looks identical to a working one in iCUE, and
# there is no other way to find out.
#
# Several key vocabularies have to be reconciled to make the join land. iCUE
# names a key after every glyph on it (`PeriodAndBiggerThan`), Get-Hotkeys prints
# mod bindings prettified (`.`) and base-game rows as raw IK names minus the
# prefix (`Period`, `MiddleMouse`). Comparing any two of those directly finds
# nothing and reports every button dead - so everything is folded to one token.
#
# That folding is NOT done here. It used to be, and the same problem exists in
# Get-Hotkeys' own -CheckKey gate, which had no table at all and so silently
# missed every claimant recorded in the other vocabulary. One table in two
# places is the bug that produces: it is correct the day it is copied and drifts
# apart afterwards, with each copy internally consistent. There is now one
# identity function and both tools fold through it.
. (Join-Path $PSScriptRoot 'KeyIdentity.ps1')

# Where the buttons physically ARE. Same argument as the identity table above -
# one place, read by whoever needs it - except that this one's DATA is not here
# at all, only the reader for it. See the header of DeviceGeometry.ps1.
. (Join-Path $PSScriptRoot 'DeviceGeometry.ps1')

# ================================================== what the owner has hidden ==
#
# TWO TIERS, AND THE SECOND ONE IS THE POINT.
#
# localStorage gives hiding its instant effect and carries it across a reload.
# That is all it can do. THE SHEET IS REGENERATED - from disk, on demand - and a
# hidden set that lives only in the page is gone the first time it is. Anybody
# who hides thirty rows and then asks for a fresh sheet gets all thirty back and
# no explanation.
#
# So the durable copy lives where the device geometry already lives: this user's
# wiki bundle. Same argument, and it is worth restating because it is the whole
# reason there is a bundle at all - "which rows I care about" is a fact about one
# person, not about Cyberpunk, so it belongs beside their machine profile rather
# than inside a tool or inside a browser.
#
# THE FORMAT IS REGEX AND STRING WORK, DELIBERATELY. Windows PowerShell 5.1 has
# no YAML parser and is not getting one, exactly as DeviceGeometry.ps1 says of
# its own blocks. One fenced ```sheet-hidden block, one entry per line:
#
#     binding: Kiroshi Night Vision | Toggle night vision | F3
#     button: G11
#     action: Skip radio song
#
# `<kind>: <field> | <field> | ...`, and that same string is what the page puts
# in `data-hid` and what the regeneration command passes to -Hide. ONE spelling
# in three places, so an entry cannot mean one thing in the article and another
# in the page. Unknown kinds and unparseable lines are skipped rather than
# guessed at - a hide list that hides the wrong row is worse than one that
# hides nothing, because nobody goes looking for a row they did not notice
# vanishing.
if (-not $PreferencesPath) { $PreferencesPath = Join-Path $WikiBundle 'sheet-preferences.md' }

function Get-Hid {
    <#  .SYNOPSIS  The one canonical spelling of a hideable entry.  #>
    param([string] $Kind, [string[]] $Fields)
    # A literal pipe in a mod name would split one field into two and the entry
    # would never match itself again, so it is folded to a slash on the way in -
    # in the article, in the markup and on the command line alike.
    $clean = @($Fields | ForEach-Object { ((([string]$_) -replace '\|', '/') -replace '\s+', ' ').Trim() } |
               Where-Object { $_ -ne '' })
    if (-not $clean.Count) { return '' }
    return ($Kind.ToLowerInvariant() + ': ' + ($clean -join ' | '))
}

function ConvertTo-HideEntry {
    <#  .SYNOPSIS  Normalise one written line, or null if it is not an entry.  #>
    param([string] $Raw)
    if (-not $Raw) { return $null }
    $s = (($Raw -replace '\s+', ' ').Trim())
    if ($s -notmatch '^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.+)$') { return $null }
    return (Get-Hid -Kind $matches[1] -Fields @($matches[2] -split '\|'))
}

function Get-HiddenEntry {
    <#  .SYNOPSIS  Every hidden entry in the preferences article; never an error.  #>
    param([string] $Path)
    # Emitted one entry at a time rather than returned as `,$array`: that idiom
    # turns an EMPTY result into a one-element array holding an empty array, and
    # the caller then iterates a phantom entry. Nothing to say, say nothing.
    $out = @()
    if (-not $Path -or -not (Test-Path -LiteralPath $Path)) { return $out }
    $text = Get-Content -LiteralPath $Path -Raw -ErrorAction SilentlyContinue
    if (-not $text) { return $out }
    # NORMALISE THE LINE ENDINGS BEFORE MATCHING. `$` in .NET multiline mode
    # matches before the `\n` and AFTER the `\r`, so a fence written CRLF never
    # matches `^[ \t]*```[ \t]*$` - and the failure is silent, which is the worst
    # possible shape for it: the article is right there, readable, saying exactly
    # what should be hidden, and the sheet quietly ignores it. A file can easily
    # end up mixed - Set-Content terminates the last line CRLF while the body
    # keeps whatever the string had - so this is the normal case, not an edge.
    $text = $text -replace "`r`n", "`n"
    foreach ($m in [regex]::Matches($text, '(?ms)^[ \t]*```[ \t]*sheet-hidden[ \t]*\r?\n(.*?)^[ \t]*```[ \t]*$')) {
        foreach ($line in ($m.Groups[1].Value -split "\r?\n")) {
            if ($line -match '^\s*(#|$)') { continue }
            $e = ConvertTo-HideEntry $line
            if ($e -and $out -notcontains $e) { $out += $e }
        }
    }
    return $out
}

function Set-HiddenEntry {
    <#
    .SYNOPSIS
        Write the hidden set into the preferences article, creating it if needed.
    .DESCRIPTION
        Only the fenced block is rewritten. Everything a person wrote around it
        survives - the article is meant to be edited by hand as well as by this
        tool, and a generator that flattens somebody's notes teaches them not to
        write any.
    #>
    param([string] $Path, [string[]] $Entries)

    $fence = ([string][char]96) * 3
    $body  = @($Entries)
    $block = $fence + "sheet-hidden`n" + $(if ($body.Count) { ($body -join "`n") + "`n" }) + $fence
    $now   = Get-Date -Format 'yyyy-MM-ddTHH:mm:sszzz'

    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

    if (-not (Test-Path -LiteralPath $Path)) {
        $doc = @"
---
type: Preference
title: Hotkey sheet preferences
description: The entries this user has hidden from their generated hotkey cheatsheet, so a regenerated sheet comes back looking the way they left it.
distribution: user-only
status: stable
tags: [input, hotkeys, reports, preferences]
generated: { by: "New-HotkeySheet.ps1", at: "$now" }
---

# Hotkey sheet preferences

The cheatsheet has a **hide** mode: turn it on, click a row or a key, and it
stops being drawn. This article is where that survives regeneration - the page's
own memory only lasts until the sheet is built again from disk.

Each line below is one entry, spelled the same way here, in the page's markup and
on the generator's command line, so the three can never disagree:

| kind | fields | means |
|---|---|---|
| ``binding`` | mod \| action \| key | one row of the keyboard tables |
| ``button`` | button label | one key of a device pad, or one row of its list |
| ``action`` | iCUE label | a profile action sitting on no button |

**Delete a line to bring an entry back** - or use the sheet's own hidden list,
which does the same thing and rewrites this block for you. Lines that do not
parse are skipped rather than guessed at, so a typo loses one entry and never
hides the wrong one.

$block
"@
        Set-Content -LiteralPath $Path -Value $doc -Encoding UTF8
        return
    }

    # Same normalisation as the reader, and for the same reason: a mixed-ending
    # file would otherwise gain a second block on every write instead of having
    # its existing one replaced.
    $text = (Get-Content -LiteralPath $Path -Raw) -replace "`r`n", "`n"
    $rx   = [regex]'(?ms)^[ \t]*```[ \t]*sheet-hidden[ \t]*\r?\n.*?^[ \t]*```[ \t]*$'
    # A MatchEvaluator, not a replacement string: an entry can contain `$`, and
    # .NET would read that as a substitution and quietly mangle the line.
    if ($rx.IsMatch($text)) {
        $text = $rx.Replace($text, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $block }, 1)
    } else {
        $text = $text.TrimEnd() + "`n`n" + $block + "`n"
    }
    $text = [regex]::Replace($text, '(?m)^(generated:\s*\{[^}]*\bat:\s*")[^"]*(")',
                             [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $m.Groups[1].Value + $now + $m.Groups[2].Value })
    Set-Content -LiteralPath $Path -Value $text -Encoding UTF8
}

if ($PSBoundParameters.ContainsKey('Hide')) {
    $hiddenEntries = @($Hide | ForEach-Object { ConvertTo-HideEntry $_ } | Where-Object { $_ } | Select-Object -Unique)
    Set-HiddenEntry -Path $PreferencesPath -Entries $hiddenEntries
    Write-Host "hidden: $($hiddenEntries.Count) entr$(if ($hiddenEntries.Count -eq 1) { 'y' } else { 'ies' }) written to $(Hide-Home $PreferencesPath)" -ForegroundColor Cyan
} else {
    $hiddenEntries = @(Get-HiddenEntry -Path $PreferencesPath)
    if ($hiddenEntries.Count) {
        Write-Host "hidden: $($hiddenEntries.Count) entr$(if ($hiddenEntries.Count -eq 1) { 'y' } else { 'ies' }) from $(Hide-Home $PreferencesPath)" -ForegroundColor Cyan
    }
}
$hiddenLookup = @{}
foreach ($h in $hiddenEntries) { $hiddenLookup[$h.ToLowerInvariant()] = $true }

# Counters, so the header's one count line is measured rather than asserted.
$script:HidTotal = 0; $script:HidHidden = 0; $script:HidDead = 0

function Test-HiddenHid { param([string] $Hid) return ($Hid -and $hiddenLookup.ContainsKey($Hid.ToLowerInvariant())) }

function New-Hid {
    <#
    .SYNOPSIS
        The markup that makes one element hideable, and its share of the counts.
    #>
    param([string] $Kind, [string[]] $Fields, [string] $Label, [switch] $Dead)
    $hid = Get-Hid -Kind $Kind -Fields $Fields
    $hit = Test-HiddenHid $hid
    $script:HidTotal++
    if ($hit) { $script:HidHidden++ } elseif ($Dead) { $script:HidDead++ }
    if (-not $Label) { $Label = ($Fields -join ' - ') }
    [pscustomobject]@{
        Hid    = $hid
        Hidden = $hit
        Cls    = $(if ($hit) { ' hid' } else { '' })
        Attr   = " data-hid=""$(esc $hid)"" data-hlabel=""$(esc $Label)""$(if ($Dead) { ' data-dead="1"' })"
    }
}

# Sort the pad the way it is laid out under the thumb, not the way cereal
# happened to serialise it: G1..G12 numerically, then the named buttons, then
# actions assigned to no button at all.
function Get-ButtonRank {
    param([string] $b)
    if ($b -match '^G(\d+)$') { return [int]$matches[1] }
    if ($b) { return 900 }
    return 999
}

$mouseRows   = @()
$mouseName   = ''
$mouseDev    = ''
$mouseOther  = @()
$mouseLinked = $false
$mouseAllCount = 0
if (-not $NoMouseProfile) {
    $mpArgs = @{}
    if ($MouseProfileRoot) { $mpArgs.Root = $MouseProfileRoot }
    if ($MouseProfile)     { $mpArgs.ProfileName = $MouseProfile }

    # Warnings are collected rather than emitted. "No iCUE profiles found" is
    # the NORMAL case - most people own no Corsair device - and a warning on a
    # perfectly good run trains people to ignore warnings. It is reported below
    # as one plain line, and only becomes loud if a profile was asked for by
    # name and did not turn up, which is a real mistake.
    $mpWarn = @()
    $mouseAll = @(& (Join-Path $PSScriptRoot 'Get-MouseProfile.ps1') @mpArgs -WarningVariable mpWarn -WarningAction SilentlyContinue)

    if ($mouseAll.Count) {
        # Several profiles and no -MouseProfile. Rank them, best evidence first:
        #
        #   1. iCUE says the profile auto-activates for Cyberpunk2077.exe. That
        #      is not a guess - the user linked it to the game themselves, and
        #      it is the profile that will actually be loaded while they play.
        #   2. failing that, whichever holds the most key remaps.
        #
        # It is still a choice made on the user's behalf, which is why the sheet
        # prints the profile's NAME and how many others exist. The filenames are
        # GUIDs; someone with a Cyberpunk profile and a spreadsheet profile has
        # no other way to tell which one produced these rows.
        $byProfile = $mouseAll | Group-Object Profile | Sort-Object `
            @{e={ if ($_.Group[0].Linked -match '(?i)Cyberpunk2077\.exe') { 1 } else { 0 } }; d=$true},
            @{e={ @($_.Group | Where-Object Kind -eq 'key remap').Count }; d=$true},
            Name
        $chosen     = $byProfile[0]
        $mouseLinked = [bool]($chosen.Group[0].Linked -match '(?i)Cyberpunk2077\.exe')
        $mouseName  = $chosen.Name
        $mouseDev  = (@($chosen.Group | Where-Object Device | ForEach-Object { $_.Device } | Select-Object -Unique) -join ', ')

        foreach ($m in ($chosen.Group | Sort-Object @{e={Get-ButtonRank $_.Button}}, Order)) {
            # Only key remaps can be joined. A macro or a DPI switch emits no
            # keystroke, so nothing in the five stores could ever describe it -
            # they are held back and named separately rather than shown with an
            # empty, accusatory "bound to nothing".
            if ($m.Kind -ne 'key remap') { $mouseOther += $m; continue }
            $canon = Get-KeyIdentity $m.Key
            $hits  = @($binds | Where-Object { (Get-KeyIdentity $_.Key) -eq $canon })
            # Kept apart from $hits so the sheet can say WHICH claims the key.
            # "the base game uses this" and "a mod uses this" are different
            # answers to the user's actual question, which is whether pressing
            # the button will do something.
            $vhits = @($vanillaBinds | Where-Object { (Get-KeyIdentity $_.Key) -eq $canon })
            $mouseRows += [pscustomobject]@{
                Button      = $m.Button
                Label       = $m.Action     # what the USER called it in iCUE
                Key         = $m.Key
                Hits        = $hits
                VanillaHits = $vhits
                Assigned    = [bool]$m.Button
            }
        }

        $mouseAllCount = $byProfile.Count
        $extra = $byProfile.Count - 1
        Write-Host ("iCUE: read profile '$mouseName'" +
                    $(if ($mouseLinked) { ' (iCUE auto-activates it for Cyberpunk2077.exe)' }) +
                    " - $(@($mouseRows).Count) key remap(s) on $mouseDev" +
                    $(if ($extra -gt 0) { " ($extra other profile$(if ($extra -gt 1){'s'}) on this machine)" })) -ForegroundColor Cyan

        $dead = @($mouseRows | Where-Object { $_.Assigned -and -not $_.Hits.Count -and -not $_.VanillaHits.Count })
        if ($dead.Count) {
            Write-Host ("      $($dead.Count) button(s) send a key nothing on disk is bound to: " +
                        (($dead | ForEach-Object { "$($_.Button) sends '$($_.Key)'" }) -join ', ')) -ForegroundColor DarkYellow
        }
    } else {
        # Say it plainly and carry on. This is not a failure of anything.
        Write-Host "iCUE: no mouse profiles found - the mouse section is omitted" -ForegroundColor DarkGray
        if ($MouseProfile -and $mpWarn) { $mpWarn | ForEach-Object { Write-Warning $_ } }
    }
}

# Which categories exist, in the order a player would want them.
$order  = 'Combat','Driving','Stealth & Loot','World','Tools'
$accent = @{ 'Combat'='red'; 'Driving'='cyan'; 'Stealth & Loot'='green'
             'World'='yellow'; 'Tools'='purple' }

# Keys carrying more than one meaning. Most are harmless - the game scopes
# bindings by input context, so 'R' can reload, renew a chip and pick a pocket
# without conflict - but a couple genuinely overlap and are worth seeing.
$collisions = $binds | Group-Object Key | Where-Object Count -gt 1 | Sort-Object Name

# ===================================================================== render ==

$sb = [Text.StringBuilder]::new()
function w { param([string]$s) [void]$sb.AppendLine($s) }

# Which thumb button sends a given key. The mouse panel listed every one of
# these a second time - "Next consumable / ]" as a mouse cell and again as an
# Advanced Control row - so instead the button rides along on the row it
# duplicates, as a badge next to the keycap.
#
# Keyed by the canonical key token, not the printed one, so a badge lands on a
# base-game row too - those carry raw IK names (`MiddleMouse`) while the mouse
# profile speaks glyphs (`Middle Mouse`), and the two never match literally.
$mouseFor = @{}
foreach ($m in $n.mouse) {
    $c = Get-KeyIdentity $m.sends
    if (-not $mouseFor.ContainsKey($c)) { $mouseFor[$c] = "M$($m.button)" }
}
foreach ($m in $mouseRows) {
    if (-not $m.Assigned) { continue }
    $c = Get-KeyIdentity $m.Key
    if (-not $mouseFor.ContainsKey($c)) { $mouseFor[$c] = $m.Button }
}
$mouseTitle = if ($mouseDev) { $mouseDev } elseif ($n.device) { [string]$n.device } else { 'programmable mouse' }

# ---- mouse panel ----
$mouseHtml = ''
# The notes-driven pad is the fallback for a vendor whose profiles cannot be
# read. When a real iCUE profile WAS read, it supersedes this entirely - showing
# both would put every thumb button on the sheet twice, once from disk and once
# from a hand-written file that may already disagree with it.
if ($n.mouse -and $ShowMousePad -and -not $mouseRows.Count) {
    $cells = foreach ($m in $n.mouse) {
        # Resolve what this key actually does from the harvested data, so a
        # rebind in game shows up here without editing the notes file.
        #
        # Only worth printing where it disagrees with the hand-written label -
        # "Flashlight / Toggle flashlight" is noise, while "Night vision /
        # Toggle minimap" is the sheet telling you the label has gone stale.
        $flat = { param($s) ($s -replace '[^a-z0-9]','').ToLower() }
        $lbl  = & $flat $m.label
        $hits = @($binds | Where-Object { $_.Key -eq $m.sends } | Where-Object {
            $a = & $flat $_.Action
            -not ($a.Contains($lbl) -or $lbl.Contains($a))
        })
        $via  = if ($hits) { ($hits | ForEach-Object { "$($_.Action)" } | Select-Object -Unique) -join ' &middot; ' } else { '' }
        @"
    <div class="mbtn">
      <span class="mnum">$($m.button)</span>
      <kbd class="k">$(esc $m.sends)</kbd>
      <span class="mlbl">$(esc $m.label)</span>
      $(if ($via) { "<span class=""mvia"">$via</span>" })
    </div>
"@
    }
    $mouseHtml = @"
  <section class="panel mouse">
    <h2><span class="dot yellow"></span>$(esc $n.device)<b>thumb pad</b></h2>
    <div class="mgrid">$($cells -join '')</div>
  </section>
"@
}

# ---- category panels ----
$catHtml = foreach ($c in $order) {
    $set = @($binds | Where-Object Context -eq $c | Sort-Object Mod, Action)
    if (-not $set) { continue }
    $rows = foreach ($b in $set) {
        $keys = ($b.Key -split ' / ' | ForEach-Object { "<kbd class=""k"">$(esc $_)</kbd>" }) -join '<i>/</i>'
        $mbc  = Get-KeyIdentity $b.Key
        $mb   = if ($mouseFor.ContainsKey($mbc)) {
            "<b class=""ms"" title=""$(esc $mouseTitle) button"">$(esc $mouseFor[$mbc])</b>"
        } else { '' }
        $mark = if ($b.Source -eq 'your setting') { '' } else { '<span class="def" title="mod default - not rebound by you">&#9679;</span>' }
        $h = New-Hid -Kind 'binding' -Fields @($b.Mod, $b.Action, $b.Key) -Label "$($b.Action) &middot; $($b.Key)"
        @"
      <div class="row$($h.Cls)"$($h.Attr) data-s="$(esc "$($b.Action) $($b.Mod) $($b.Key)".ToLower())">
        <span class="act">$(esc $b.Action)<em>$(esc $b.Mod)$mark</em></span>
        <span class="keys">$mb$keys</span>
      </div>
"@
    }
    # One oversized panel sets the height of the whole sheet - a category with
    # three times the rows of its neighbours leaves half the screen empty below
    # the short panels. Split a tall panel's rows into internal columns and let
    # it claim proportionally
    # more width, and every panel ends up roughly the same height.
    $big = $set.Count -gt 12
    @"
  <section class="panel$(if ($big) { ' big' })">
    <h2><span class="dot $($accent[$c])"></span>$(esc $c)</h2>
    <div class="rows">$($rows -join '')</div>
  </section>
"@
}

# ---- mouse-profile panel (the join) ----
#
# Three facts, in the order the causation runs: the button you press, the key it
# sends, what the game does with that key. Read left to right it is a sentence;
# read as a table it is checkable.
#
# WHERE THOSE FACTS SIT IS THE OTHER HALF OF THE ANSWER. A thumb pad is an
# ARRANGEMENT, and a flat list of twelve rows throws away the one property that
# makes it usable without looking: where the button is under your thumb. "G7
# sends ]" is a fact you have to read; "the middle key of the third column sends
# ]" is a fact you can feel. So when the user's wiki bundle describes the
# device's geometry, the pad is drawn; when it does not - no bundle, no article,
# an unknown device, which is most people - the same rows render as the list
# they always did. Nothing here fails over the brand of somebody's mouse.
$mpHtml  = ''
$padGeom = $null
if ($mouseRows.Count) {
    # $mouseDev can name several devices in one profile; the pad belongs to the
    # first of them that has geometry written down.
    foreach ($d in @($mouseDev -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })) {
        $padGeom = Get-DeviceGeometry -Name $d -Bundle $WikiBundle
        if ($padGeom) { break }
    }
    if ($padGeom) {
        Write-Host ("      physical layout from the wiki bundle: $($padGeom.Name)" +
                    $(if ($padGeom.Surface) { " $($padGeom.Surface)" }) +
                    " - $($padGeom.Columns)x$($padGeom.Rows), $(@($padGeom.Cells).Count) keys ($($padGeom.Source))") -ForegroundColor Cyan
    } else {
        Write-Host "      no geometry for this device in $WikiBundle - the buttons render as a list" -ForegroundColor DarkGray
    }
}

# The base game's action names are internal identifiers - combatGadget, tag,
# vehicleReverseCam. Splitting the camelCase and sentence-casing it is a pure
# presentation change: nothing is renamed or guessed, so "combatGadget" becomes
# "Combat gadget" and stays checkable against the XML it came from. Anything
# already spaced or capitalised is left exactly as it is.
function Format-GameAction {
    param([string] $Name)
    ($Name -split ',' | ForEach-Object {
        $t = $_.Trim()
        if (-not $t) { return }
        if ($t -match '\s') { return $t }
        $words = [regex]::Replace($t, '(?<=[a-z0-9])(?=[A-Z])', ' ')
        $words.Substring(0,1).ToUpper() + $words.Substring(1).ToLower()
    }) -join ', '
}

# What a keystroke actually does, in the one markup both a grid key and a list
# row use. Written once because the two must never disagree about whether a
# button is dead - that disagreement would be the finding contradicting itself.
function Get-DoesHtml {
    param($M, [switch]$Compact)
    if ($M.Hits.Count) {
        return (($M.Hits | Sort-Object Mod, Action | ForEach-Object {
            "<span class=""pd"">$(esc $_.Action)<em>$(esc $_.Mod)</em></span>"
        }) -join '')
    }
    # Nothing in the mod stores claims it, but the BASE GAME might - and saying
    # "does nothing in game" about a key the game itself binds is the worst
    # thing this sheet can do, because it reads as a finding.
    if ($M.VanillaHits.Count) {
        return (($M.VanillaHits | ForEach-Object {
            "<span class=""pd"">$(esc (Format-GameAction $_.Action))<em>base game</em></span>"
        }) -join '')
    }
    if ($M.Assigned) {
        if ($Compact) { return '<span class="pd pnone">nothing binds this key<em>does nothing in game</em></span>' }
        return '<span class="pd pnone">nothing on disk binds this key<em>this button does nothing in game</em></span>'
    }
    return '<span class="pd pnone">on no button, and nothing binds the key either<em>inert both ways</em></span>'
}

if ($mouseRows.Count) {
    # ---- the pad, drawn where the keys are --------------------------------
    $padHtml = ''
    $onPad   = @{}
    if ($padGeom) {
        $byButton = @{}
        foreach ($m in $mouseRows) {
            if ($m.Assigned -and -not $byButton.ContainsKey($m.Button)) { $byButton[$m.Button] = $m }
        }
        $sorted  = @($padGeom.Cells | Sort-Object Row, Col)
        $keys = foreach ($c in $sorted) {
            # grid-row / grid-column are stated per key rather than left to
            # source order. The order cells happen to be emitted in is not
            # information; the coordinates are.
            $pos = "grid-row:$($c.Row + 1);grid-column:$($c.Col + 1)"
            if (-not $byButton.ContainsKey($c.Label)) {
                # A SEAT WITH NOTHING ON IT IS NOT DRAWN. It cost a full cell -
                # the same width as a key carrying an action - to say "not
                # assigned", which is a thing the owner already knows because
                # they are the one who did not assign it.
                #
                # The geometry stays honest anyway: every key states its own
                # grid-row and grid-column, so an omitted one leaves its
                # position EMPTY rather than letting the ones after it slide up
                # into the gap. The shape you see is still the shape under your
                # thumb, which is the entire reason for drawing a pad.
                #
                # A key whose keystroke is bound to NOTHING is a different thing
                # and still draws, flagged - see `.pk.dead` below. That one is a
                # finding, and it is invisible everywhere else.
                continue
            }
            $m = $byButton[$c.Label]
            $onPad[$m.Button] = $true
            $isDead = (-not $m.Hits.Count) -and (-not $m.VanillaHits.Count)
            $cls = if ($isDead) { ' dead' } else { '' }
            $h = New-Hid -Kind 'button' -Fields @($c.Label) -Label "$($c.Label) &middot; $($m.Key)" -Dead:$isDead
            @"
        <div class="pk$cls$($h.Cls)" style="$pos"$($h.Attr)>
          <span class="pkb">$(esc $c.Label)</span>
          <kbd class="k">$(esc $m.Key)</kbd>
          <span class="pkd">$(Get-DoesHtml $m -Compact)</span>
          <span class="pkl">$(esc $m.Label)</span>
        </div>
"@
        }
        # The orientation, in words. If the geometry in the bundle is wrong,
        # this line beside the grid is how somebody holding the device sees it.
        # By COORDINATE, not by position in a sort order: the first element of
        # a Row,Col sort is the top-left corner, which is neither of the two
        # corners this sentence is about, and the mistake reads as correct.
        $blCell = @($padGeom.Cells | Sort-Object @{e={$_.Row}; d=$true}, Col)[0]
        $trCell = @($padGeom.Cells | Sort-Object Row, @{e={$_.Col}; d=$true})[0]
        # Every seat unassigned means there is no pad to draw, only an empty
        # grid under a caption claiming a device. Fall through to the list.
        if (@($keys | Where-Object { $_ }).Count) {
            $padHtml = @"
    <div class="padwrap">
      <div class="pad" style="--pc:$($padGeom.Columns);--pr:$($padGeom.Rows)">$($keys -join '')</div>
      <p class="padcap"><b>$(esc $padGeom.Name)</b>$(if ($padGeom.Surface) { ' &middot; ' + (esc $padGeom.Surface) }) &middot; $(esc $blCell.Label) bottom-left, $(esc $trCell.Label) top-right</p>
    </div>
"@
        } else { $onPad = @{} }
    }

    # ---- the buttons a grid cannot seat, beside the pad --------------------
    #
    # With no geometry this is every row, which IS the old sheet. With geometry
    # it is the buttons that have no seat on the pad - the DPI toggle, the
    # sniper button - and it sits next to the pad as part of the same mouse
    # panel rather than under a heading of its own.
    #
    # ACTIONS ASSIGNED TO NO BUTTON ARE NOT LISTED. They sit in the profile
    # doing nothing, and they cannot be pressed: on the measured profile they
    # were three rows of "&mdash;" occupying a quarter of the panel to report
    # that nothing happens. They were once kept so a user would not wonder where
    # a label they remembered creating had gone, but that is a question asked
    # once, in iCUE, and it does not earn permanent space on a sheet where every
    # millimetre competes with a keycap.
    $listRows = @($mouseRows | Where-Object { -not $onPad.ContainsKey($_.Button) -and $_.Assigned })
    $items = foreach ($m in $listRows) {
        $cls = @()
        $rowDead = (-not $m.Hits.Count) -and (-not $m.VanillaHits.Count)
        if ($rowDead) { $cls += 'dead' }
        $btn = esc $m.Button
        $h = New-Hid -Kind 'button' -Fields @($m.Button) -Label "$($m.Button) &middot; $($m.Key)" -Dead:$rowDead
        @"
      <div class="prow$(if ($cls) { ' ' + ($cls -join ' ') })$($h.Cls)"$($h.Attr)>
        <span class="pbtn">$btn</span>
        <kbd class="k">$(esc $m.Key)</kbd>
        <span class="pdoes">$(Get-DoesHtml $m)</span>
        <span class="plbl">$(esc $m.Label)</span>
      </div>
"@
    }
    # No caption. "Off the pad - no arrangement to draw" explained the layout
    # engine's problem rather than telling the reader anything about their
    # mouse, and it announced a section for what is usually a single row.
    $listHtml = if ($items) {
        "<div class=""plist""><div class=""pgrid"">$($items -join '')</div></div>"
    } else { '' }

    # NO PROSE ABOVE THE GRID, AND NO GOOD NEWS AT ALL.
    #
    # Two paragraphs used to sit here. One explained that a mouse emits
    # keystrokes rather than performing game actions; the owner configured the
    # mouse, so they knew. The other was a green line saying every button landed
    # on something - a whole sentence spent confirming that there was nothing to
    # report, on a sheet where every millimetre is competing with a keycap.
    #
    # A FINDING EARNS A LINE. GOOD NEWS DOES NOT. That is the house rule for
    # every report in this family, and it applies hardest here, because the
    # finding this panel exists for - a dead button - is already flagged AT THE
    # KEY, in red, in the place your eye goes. Narrating it above the grid said
    # the same thing twice and buried the grid further down the page.
    #
    # What replaces both is one measured count line in the header, which carries
    # the same facts in the space of half a sentence.
    #
    # Actions that emit no keystroke stay, because nothing else on the sheet can
    # account for them - but as a label and a list, not a paragraph.
    $otherLine = if ($mouseOther.Count) {
        '<p class="foot">No keystroke (macro / DPI / launcher): ' +
        (($mouseOther | ForEach-Object { esc $_.Action }) -join ' &middot; ') + '</p>'
    } else { '' }

    $mpHtml = @"
  <section class="panel wide mp">
    <h2><span class="dot yellow"></span>Mouse buttons<b>iCUE profile &ldquo;$(esc $mouseName)&rdquo;$(if ($mouseDev) { " &middot; " + (esc $mouseDev) })$(
      # WHICH profile these rows came from, on the sheet itself. The filenames
      # are GUIDs, so a user with several profiles cannot otherwise tell - and
      # naming it is what makes the difference between "iCUE says" and "the
      # Cyberpunk profile says", which are not the same claim.
      if ($mouseLinked) { ' &middot; auto-activates for Cyberpunk2077.exe' }
      elseif ($mouseAllCount -gt 1) { " &middot; $mouseAllCount profiles here, none linked to the game - this one has the most remaps" }
    )</b></h2>
    <div class="pwrap">$padHtml$listHtml</div>
    $otherLine
  </section>
"@
}

# ---- gesture panel ----
$gestHtml = ''
if ($n.gestures) {
    # If every group credits the same mod, say it once in the panel heading.
    $mods   = @($n.gestures | ForEach-Object { $_.mod } | Where-Object { $_ } | Select-Object -Unique)
    $oneMod = if ($mods.Count -eq 1) { $mods[0] } else { $null }
    $groups = foreach ($g in $n.gestures) {
        $items = foreach ($i in $g.items) {
            $steps = if ($i.steps) {
                '<span class="steps">' + (($i.steps | ForEach-Object { "<b>$(esc $_)</b>" }) -join '<i>&rsaquo;</i>') + '</span>'
            } else { '' }
            @"
        <div class="grow">
          <span class="gkey"><kbd class="k">$(esc $i.key)</kbd><span class="ges">$(esc $i.gesture)</span></span>
          <span class="gdoes">$(esc $i.does)$steps</span>
        </div>
"@
        }
        # Name the mod per group only when the groups differ. Repeating one mod
        # name down every group is noise; naming none of them leaves the keys
        # unattributable, which is worse.
        $gmod = if ($g.mod -and -not $oneMod) { "<em>$(esc $g.mod)</em>" } else { '' }
        "<div class=""ggroup""><h3>$(esc $g.group)$gmod</h3>$($items -join '')</div>"
    }
    # When one mod owns every gesture, it IS the section - so name the section
    # after it rather than captioning it off to one side.
    $gtitle = if ($oneMod) { "$(esc $oneMod) gestures" } else { 'Vehicle gestures<b>tap &middot; hold &middot; multi-tap</b>' }
    $gestHtml = @"
  <section class="panel wide">
    <h2><span class="dot cyan"></span>$gtitle</h2>
    <div class="ggrid">$($groups -join '')</div>
  </section>
"@
}

# ---- collision panel ----
$colHtml = ''
if ($collisions -and $ShowSharedKeys) {
    $items = foreach ($g in $collisions) {
        $who = ($g.Group | ForEach-Object { "<span class=""cw""><b>$(esc $_.Context)</b>$(esc $_.Action) <em>$(esc $_.Mod)</em></span>" }) -join ''
        "<div class=""crow""><kbd class=""k"">$(esc $g.Name)</kbd><div class=""cwho"">$who</div></div>"
    }
    $colHtml = @"
  <section class="panel wide">
    <h2><span class="dot red"></span>Shared keys<b>$($collisions.Count)</b></h2>
    <p class="foot">Bindings scope to an input context, so most of these never fire at the same time - a key can reload a gun and open a door because you are never doing both. Worth a glance anyway when something does not respond the way you expect.</p>
    <div class="cgrid">$($items -join '')</div>
  </section>
"@
}

$stamp   = Get-Date -Format 'yyyy-MM-dd HH:mm'
$subline = "READ FROM DISK $stamp"

# Which generation of the sheet this is. The page's own hidden set is stored
# against it, so a REGENERATED sheet is recognised as newer than whatever the
# browser is holding and the article wins - which is the only way "hide it, then
# regenerate, and it stays hidden" and "unhide it, then regenerate, and it stays
# visible" can both be true. Same file reopened, same id, and the browser's copy
# wins instead, which is what makes hiding survive a reload.
$genId = Get-Date -Format 'yyyyMMddHHmmssfff'

# ONE MEASURED LINE, IN PLACE OF THE PARAGRAPHS. Rendered here as well as
# recomputed by script, so the sheet still states its own size with scripting
# off. Segments that would read zero are not drawn: a finding earns a line, and
# "0 dead" is the green validation text wearing a number.
$countsHtml =
    "<b id=""cAssigned"">$($script:HidTotal - $script:HidHidden)</b> assigned" +
    "<span id=""cDeadWrap""$(if (-not $script:HidDead) { ' class="hide"' })> &middot; <b id=""cDead"" class=""bad"">$($script:HidDead)</b> dead</span>" +
    "<span id=""cHidWrap""$(if (-not $script:HidHidden) { ' class="hide"' })> &middot; <button id=""cHid"" class=""hlink"" title=""list what is hidden, and put any of it back"">$($script:HidHidden) hidden</button></span>"

# ------------------------------------------------------------------ markdown --
#
# The HTML sheet is for a second monitor; this is for pasting. It carries the
# same bindings and drops only what is purely visual - the mouse-pad diagram and
# the colour coding, neither of which survives as text anyway.

if ($Md) {
    $mb = [Text.StringBuilder]::new()

    # A pipe in a key name or a mod title ends the cell early and the rest of the
    # row lands in the wrong column.
    $cell = { param($x) ([string]$x) -replace '\|', '\|' }
    # The backtick key is the one that breaks its own code span: `` ` `` inside
    # single backticks renders as an empty span and swallows the key. Doubling
    # the fence and padding is the only form every renderer agrees on, and it
    # matters here because ` is a real, commonly bound Cyberpunk key.
    $bt   = [string][char]96
    $code = {
        param($x)
        $s = & $cell $x
        if ($s.Contains($bt)) { "$bt$bt $s $bt$bt" } else { "$bt$s$bt" }
    }

    [void]$mb.AppendLine('# Cyberpunk 2077 - hotkeys')
    [void]$mb.AppendLine()
    [void]$mb.AppendLine("Read from disk $stamp. An asterisk means the mod's own default, not a key you chose.")
    [void]$mb.AppendLine()
    foreach ($c in $order) {
        # Hidden means hidden in both outputs. A row the owner took off the sheet
        # reappearing in the copy they paste into Discord would make the hide
        # control a lie about half the time.
        $set = @($binds | Where-Object Context -eq $c |
                 Where-Object { -not (Test-HiddenHid (Get-Hid -Kind 'binding' -Fields @($_.Mod, $_.Action, $_.Key))) } |
                 Sort-Object Mod, Action)
        if (-not $set) { continue }
        [void]$mb.AppendLine("## $c")
        [void]$mb.AppendLine()
        [void]$mb.AppendLine('| Key | Action | Mod |')
        [void]$mb.AppendLine('| --- | --- | --- |')
        foreach ($b in $set) {
            $dot  = if ($b.Source -eq 'your setting') { '' } else { ' *' }
            [void]$mb.AppendLine("| $(& $code $b.Key) | $(& $cell $b.Action) | $(& $cell $b.Mod)$dot |")
        }
        [void]$mb.AppendLine()
    }
    $mdMouse = @($mouseRows | Where-Object {
        $hid = if ($_.Assigned) { Get-Hid -Kind 'button' -Fields @($_.Button) }
               else             { Get-Hid -Kind 'action' -Fields @($_.Label) }
        -not (Test-HiddenHid $hid)
    })
    if ($mdMouse.Count) {
        [void]$mb.AppendLine("## Mouse buttons - iCUE profile ""$mouseName""$(if ($mouseDev) { " ($mouseDev)" })")
        [void]$mb.AppendLine()
        # Three columns, matching every other table in this file. The iCUE label
        # is folded into the button cell rather than given a fourth column: it is
        # the least trustworthy value here, and a paste-target file does not have
        # the width to spend on it.
        [void]$mb.AppendLine('| Button | Sends | What that key does |')
        [void]$mb.AppendLine('| --- | --- | --- |')
        foreach ($m in $mdMouse) {
            $does = if ($m.Hits.Count) {
                (($m.Hits | Sort-Object Mod, Action | ForEach-Object { "$(& $cell $_.Action) ($(& $cell $_.Mod))" }) -join '; ')
            } elseif ($m.VanillaHits.Count) {
                (($m.VanillaHits | ForEach-Object { "$(& $cell (Format-GameAction $_.Action)) (base game)" }) -join '; ')
            } elseif ($m.Assigned) { '**nothing on disk binds this key**' }
            else { 'on no button; nothing binds the key either' }
            $btn = if ($m.Assigned) { "$(& $cell $m.Button) - $(& $cell $m.Label)" } else { "- $(& $cell $m.Label)" }
            [void]$mb.AppendLine("| $btn | $(& $code $m.Key) | $does |")
        }
        [void]$mb.AppendLine()
    }
    foreach ($g in $n.gestures) {
        [void]$mb.AppendLine("## $($g.group)$(if ($g.mod) { " - $($g.mod)" })")
        [void]$mb.AppendLine()
        foreach ($i in $g.items) {
            $steps = if ($i.steps) { ' (' + (($i.steps) -join ' > ') + ')' } else { '' }
            [void]$mb.AppendLine("- ``$($i.key)`` $($i.gesture) - $($i.does)$steps")
        }
        [void]$mb.AppendLine()
    }
    if ($collisions -and $ShowSharedKeys) {
        [void]$mb.AppendLine('## Shared keys')
        [void]$mb.AppendLine()
        [void]$mb.AppendLine('Bindings scope to an input context, so most of these never fire together.')
        [void]$mb.AppendLine()
        foreach ($g in $collisions) {
            $who = ($g.Group | ForEach-Object { "$($_.Action) ($($_.Context))" }) -join '; '
            [void]$mb.AppendLine("- ``$($g.Name)`` - $who")
        }
        [void]$mb.AppendLine()
    }

    $mdText = $mb.ToString()
    Set-Content -LiteralPath $Md -Value $mdText -Encoding UTF8
    Write-Host "wrote $Md" -ForegroundColor Green

    # DISCORD REFUSES a message over 2000 characters rather than clipping it, and
    # a full key sheet is comfortably over. Somebody pasting this to ask for help
    # finds out at the worst moment, so say it here instead.
    if ($mdText.Length -gt 2000) {
        Write-Host ("  $($mdText.Length) chars - too long for one Discord message (2000 max); attach the file or paste one section" ) -ForegroundColor DarkYellow
    }
}


# ------------------------------------------------- the regeneration prompt --
#
# WHY THIS IS A CLIPBOARD BUTTON AND NOT A LINK, AND NOT A LAUNCHER.
#
# A page opened from file:// is sandboxed. No filesystem, no process launch, no
# way to reach an agent session running on this machine - the sheet cannot start
# its own regeneration however the button is dressed up.
#
# A https://claude.ai/new?q=... deep link DOES open a chat and looks like the
# answer, which is exactly why it is not one: it lands in a web session with no
# access to this disk, so the single thing the button exists to do is the one
# thing that session cannot do. A control that looks like it works and does not
# is worse than no control.
#
# What is left, and what is honest, is to hand over a ready-made prompt. It
# names the skill, names where the device geometry lives - a regeneration that
# forgets the wiki bundle silently loses the pad and nobody would know why - and
# carries the exact invocation THIS sheet was built with, reconstructed from the
# arguments rather than remembered, so the flags cannot drift from the file.
#
# The raw text is printed on the page as well as copied, because the clipboard
# API is frequently unavailable on file:// and a button whose whole function is
# invisible when it fails is the same failure again.
#
# AND IT CARRIES THE HIDDEN LIST, or the loop does not close. Hiding happens in
# the page, after the file was written; a regeneration that does not know what
# was hidden silently un-hides everything, and the owner has no way to tell that
# from the feature not working. So the prompt names the preferences article, and
# the command carries `-Hide` with the complete set - which is also what makes
# UNhiding survive, since the set is authoritative rather than additive.
#
# The version on the page is rebuilt by script on every change, because the
# hidden set moves after this text is generated. The one written here is the
# state at generation time, so the control still says something true with
# scripting off.
#
# EVERY PATH IN IT IS DE-NAMED. This block is meant to be copied into a chat
# window; a home directory carries an account name, and there is no reason for
# one to travel with a list of keybinds. `$env:USERPROFILE` expands on the
# machine that runs it, so the command still works.
$qa = {
    param([string]$s)
    $r = Hide-Home ([string]$s)
    if ($r.StartsWith('$env:USERPROFILE')) {
        # Double quotes, so PowerShell expands the variable rather than passing
        # it as a literal. Everything after the token is escaped for a
        # double-quoted string: backtick first, or it would escape its own
        # escapes; `$$` is how .NET spells a literal dollar in a replacement.
        $rest = $r.Substring('$env:USERPROFILE'.Length)
        $rest = $rest -replace '`', '``'
        $rest = $rest -replace '\$', '`$$'
        $rest = $rest -replace '"', '`"'
        return '"$env:USERPROFILE' + $rest + '"'
    }
    return "'" + ($r -replace "'", "''") + "'"
}
$cmdParts = @("& $(& $qa $PSCommandPath)")
foreach ($nm in @('GameRoot', 'Notes', 'MouseProfile', 'MouseProfileRoot', 'WikiBundle')) {
    if ($PSBoundParameters.ContainsKey($nm)) { $cmdParts += "-$nm $(& $qa ([string]$PSBoundParameters[$nm]))" }
}
foreach ($nm in @('IncludeBaseGame', 'ShowMousePad', 'ShowSharedKeys', 'NoMouseProfile')) {
    if ($PSBoundParameters.ContainsKey($nm) -and $PSBoundParameters[$nm]) { $cmdParts += "-$nm" }
}
if ($PSBoundParameters.ContainsKey('Scale')) { $cmdParts += "-Scale $Scale" }
if ($Md) { $cmdParts += "-Md $(& $qa $Md)" }
# -Out is emitted even when it was defaulted: regenerating somewhere else would
# leave this file sitting here looking current.
$cmdParts += "-Out $(& $qa $Out)"
if ($PSBoundParameters.ContainsKey('PreferencesPath')) { $cmdParts += "-PreferencesPath $(& $qa $PreferencesPath)" }
$regenCmd = $cmdParts -join ' '

# The `-Hide` argument, alone, so the page can replace just this part.
function Format-HideArg {
    param([string[]] $Entries)
    $e = @($Entries)
    if (-not $e.Count) { return '-Hide @()' }
    return '-Hide ' + (($e | ForEach-Object { "'" + ($_ -replace "'", "''") + "'" }) -join ',')
}

$prefsName   = Split-Path -Leaf $PreferencesPath
$bundleShown = Hide-Home $WikiBundle
$regenHead = @"
Regenerate my Cyberpunk 2077 hotkey cheatsheet from disk. Load the cyberwise-hotkeys skill. My wiki bundle at $bundleShown holds both devices.md (where my input devices' keys physically are) and $prefsName (what I have hidden) - read both, or the sheet silently loses the pad or un-hides everything. The -Hide list below is the COMPLETE hidden set, not an addition to it: write exactly it into $prefsName. Then run:
"@
$regenPrompt = $regenHead + "`n`n" + $regenCmd + ' ' + (Format-HideArg $hiddenEntries)


$html = @"
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cyberpunk 2077 Hotkeys</title>
<style>
:root{
  --yellow:#fcee0a; --cyan:#00f0ff; --red:#ff003c; --green:#39ff88; --purple:#b56cff;
  --bg:#07070a; --panel:#101018; --line:#26263a; --text:#e4e4ee; --dim:#8a8aa2;
  --mono:'Consolas','SF Mono','DejaVu Sans Mono',monospace;
  --sans:'Segoe UI',system-ui,-apple-system,sans-serif;
  /* Single type base. Every size below is a ratio of this, so the sheet scales
     as one piece instead of drifting out of proportion. */
  --fs:__FS__px;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  background:var(--bg); color:var(--text); font-family:var(--sans);
  font-size:var(--fs); line-height:1.3;
  background-image:
    linear-gradient(rgba(252,238,10,.02) 1px,transparent 1px),
    linear-gradient(90deg,rgba(252,238,10,.02) 1px,transparent 1px);
  background-size:46px 46px;
}
/* No max-width. This is meant to be parked on a second monitor, so a centred
   column on an ultrawide wastes the whole point - spreading wide buys more
   columns, which buys a shorter page, which is what "at a glance" means. */
.wrap{margin:0 auto;padding:0 22px 8px}

header{position:relative;padding:10px 0 8px;overflow:hidden;border-bottom:1px solid var(--line)}
/* Scanlines are confined to the masthead. Over a page you actually read from,
   they fight the text; over a title block they just set the tone. */
header::after{content:'';position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(0deg,rgba(0,0,0,.34) 0 1px,transparent 1px 3px)}
/* The masthead is also the control the whole hide feature hangs off, so the
   title and the toggle share one line and the toggle sits above the scanlines. */
.mast{display:flex;align-items:center;gap:18px;position:relative;z-index:2}
h1{font-family:var(--mono);font-size:calc(var(--fs)*1.7);font-weight:700;margin:0;
  letter-spacing:.09em;text-transform:uppercase;color:var(--yellow);
  text-shadow:2px 0 var(--red),-2px 0 var(--cyan)}
h1 span{color:var(--text);text-shadow:none}
.sub{font-family:var(--mono);font-size:calc(var(--fs)*.56);letter-spacing:.15em;color:var(--dim);margin-top:6px}

.bar{position:sticky;top:0;z-index:9;padding:7px 0;
  background:linear-gradient(180deg,var(--bg) 76%,transparent);display:flex;gap:12px;align-items:center}
#q{flex:1 1 auto;background:var(--panel);color:var(--text);border:1px solid var(--line);
  border-left:3px solid var(--yellow);padding:13px 16px;font-family:var(--mono);
  font-size:calc(var(--fs)*.78);outline:none}
#q:focus{border-color:var(--cyan);border-left-color:var(--cyan)}
#q::placeholder{color:#4c4c60}
#hits{font-family:var(--mono);font-size:calc(var(--fs)*.55);color:var(--dim);white-space:nowrap}
.pill{font-family:var(--mono);font-size:calc(var(--fs)*.5);letter-spacing:.1em;cursor:pointer;
  background:var(--panel);color:var(--dim);border:1px solid var(--line);padding:10px 14px;
  text-transform:uppercase;white-space:nowrap;transition:.12s}
.pill:hover{color:var(--text);border-color:#3a3a54}
.pill.on{background:var(--yellow);color:#07070a;border-color:var(--yellow);font-weight:700}
/* ---- hide mode ---- */
/* The eye-off icon, at the size of the type beside it rather than a fixed pixel
   count, so it scales with -Scale like everything else on the sheet. */
.eyebtn{display:inline-flex;align-items:center;gap:8px;margin-left:auto}
.eyebtn svg{width:calc(var(--fs)*.72);height:calc(var(--fs)*.72);flex:0 0 auto}
.sub b{color:var(--text);font-weight:400}
.sub .bad{color:var(--red)}
/* The hidden count is a control, not a number: it is the only way back, so it
   has to look like something you can press. */
.hlink{font:inherit;color:var(--yellow);background:none;border:0;border-bottom:1px dashed rgba(252,238,10,.5);
  padding:0;cursor:pointer;letter-spacing:inherit}
.hlink:hover{color:#fff;border-bottom-color:#fff}

/* A hidden entry stays in the document and stops being drawn - it has to, or
   the lightbox would have nothing to offer back. In hide mode it reappears,
   greyed, because you cannot take something off a list you cannot see. */
body:not(.hiding) .hid{display:none !important}
body.hiding .hid{opacity:.3;filter:grayscale(1)}
/* Being in hide mode has to be visible without a sentence saying so, or the
   next click is a surprise. The lit toggle is one signal and a ring round the
   page is the other; between them nothing has to be explained in words. */
body.hiding .wrap{outline:1px solid rgba(252,238,10,.4);outline-offset:-3px}
body.hiding [data-hid]{cursor:pointer}
body.hiding [data-hid]:hover{outline:1px solid var(--yellow);outline-offset:1px}
body.hiding .row:hover,body.hiding .pk:hover,body.hiding .prow:hover{background:#1b1b26}

/* ---- the hidden list ---- */
.lb{position:fixed;inset:0;z-index:50;background:rgba(3,3,6,.82);display:flex;
  align-items:flex-start;justify-content:center;padding:6vh 20px}
.lbbox{background:var(--panel);border:1px solid var(--line);padding:14px 18px 12px;
  width:min(760px,100%);max-height:80vh;overflow:auto;
  clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))}
.lbbox h2 .pill{margin-left:12px}
.lbrow{display:flex;align-items:baseline;gap:12px;padding:6px 2px;border-bottom:1px solid #191926}
.lbrow:last-child{border-bottom:0}
.lbl1{flex:1 1 auto;min-width:0;font-size:calc(var(--fs)*.72);overflow-wrap:anywhere}
.lbl2{font-family:var(--mono);font-size:calc(var(--fs)*.44);color:#5a5a70;letter-spacing:.04em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:34ch}
.lbrow .pill{flex:0 0 auto;padding:5px 10px}
/* Hiding the mod name drops every row to a single line - the densest the sheet
   gets, for when you know your mods and only want the keys. */
body.nomods .act em,body.nomods .pd em{display:none}

/* Flex rather than CSS multi-column. Multicol balances content across a count
   it derives itself, and on a wide monitor it decided two columns were enough
   and left two thirds of the screen empty. Flex just fills the row. */
.cols{display:flex;flex-wrap:wrap;align-items:flex-start;gap:14px}
/* The bottom padding has to clear the 14px corner bevel below - at 6px the
   last row of a panel was being sliced by the clip-path. */
.panel{background:var(--panel);border:1px solid var(--line);padding:11px 16px 14px;
  flex:1 1 400px; min-width:0;
  clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))}
.panel.wide{flex-basis:100%;margin-top:12px}
/* A tall panel splits internally and takes proportionally more width, so no
   single category dictates the height of the page. */
.panel.big{flex-grow:2;flex-basis:820px}
.panel.big .rows{columns:2;column-gap:22px}
.rows .row{break-inside:avoid}
h2{font-family:var(--mono);font-size:calc(var(--fs)*.6);letter-spacing:.2em;text-transform:uppercase;
  margin:0 0 5px;padding-bottom:5px;border-bottom:1px solid var(--line);
  display:flex;align-items:center;gap:10px;color:var(--text)}
h2 b{margin-left:auto;color:var(--dim);font-weight:400;font-size:calc(var(--fs)*.52);letter-spacing:.12em}
.dot{width:10px;height:10px;flex:0 0 10px;transform:rotate(45deg)}
.dot.red{background:var(--red)} .dot.cyan{background:var(--cyan)}
.dot.green{background:var(--green)} .dot.yellow{background:var(--yellow)}
.dot.purple{background:var(--purple)}

/* Keycap. The whole sheet is read at arm's length, so these stay chunky. */
kbd.k{font-family:var(--mono);font-size:calc(var(--fs)*.79);font-weight:700;color:var(--yellow);
  background:#1b1b26;border:1px solid #3a3a52;border-bottom-width:3px;border-radius:4px;
  padding:5px 12px;min-width:calc(var(--fs)*2);display:inline-block;text-align:center;white-space:nowrap}

/* One line per binding. The mod name used to sit on its own line under every
   action, which doubled the height of the entire sheet for information you
   only want when you go to change something. Inline and dimmed, it costs
   nothing and the row stays scannable. */
.row{display:flex;align-items:baseline;gap:12px;padding:3px 2px;border-bottom:1px solid #191926}
.row:last-child{border-bottom:0}
/* min-width:0 + overflow-wrap let the label give way. Without them the action
   text's longest word sets a floor on the row width, and inside a narrow
   column that floor plus a wide keycap ("Caps Lock") overflowed the page. */
.act{flex:1 1 0;min-width:0;overflow-wrap:anywhere;font-size:calc(var(--fs)*.84);line-height:1.22}
/* The mod name goes on its own line, under the action.
   Inline it competes with the action for the same line and wraps mid-phrase -
   "Toggle night vision Kiroshi Night / Vision" - which splits the action name
   in half and leaves every row a different height, so nothing scans. On its own
   line the action stays one clean line and rows stay uniform.
   It still wraps rather than being held on one line: held, a long name like
   "Character Customization Anywhere" set a hard floor on the row width and
   pushed the keycap off the page. */
.act em{display:block;font-style:normal;font-size:calc(var(--fs)*.5);color:#6a6a80;
  font-family:var(--mono);letter-spacing:.03em;margin-top:1px;line-height:1.14}
.def{color:#4c4c60;margin-left:5px;font-size:calc(var(--fs)*.42);vertical-align:1px}
.keys{white-space:nowrap;flex:0 0 auto;display:flex;align-items:center;gap:6px}
.keys i{color:#4c4c60;font-style:normal;padding:0 2px;font-size:calc(var(--fs)*.62)}
/* Thumb-button badge, replacing the mouse panel that repeated these rows. */
.ms{font-family:var(--mono);font-size:calc(var(--fs)*.5);font-weight:700;color:#b4b4cc;
  background:rgba(138,138,162,.14);border:1px solid rgba(138,138,162,.55);
  border-radius:3px;padding:1px 4px;letter-spacing:.02em}

/* ---- mouse ---- */
.mgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.mbtn{background:#15151f;border:1px solid #2b2b40;padding:11px 9px 9px;text-align:center;position:relative}
.mnum{position:absolute;top:4px;left:7px;font-family:var(--mono);font-size:calc(var(--fs)*.52);color:#4c4c60}
.mbtn kbd.k{margin:4px 0 6px}
.mlbl{display:block;font-size:calc(var(--fs)*.68);line-height:1.25;color:var(--text)}
.mvia{display:block;font-size:calc(var(--fs)*.53);color:var(--dim);font-family:var(--mono);
  margin-top:4px;line-height:1.3}
.foot{font-size:calc(var(--fs)*.6);color:var(--dim);line-height:1.5;margin:12px 0 8px}

/* ---- gestures ---- */
.ggrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:18px}
.ggroup h3{font-family:var(--mono);font-size:calc(var(--fs)*.57);letter-spacing:.16em;
  text-transform:uppercase;color:var(--cyan);margin:0 0 6px;font-weight:400}
.grow{display:flex;gap:14px;align-items:baseline;padding:7px 0;border-bottom:1px solid #191926}
.gkey{flex:0 0 auto;min-width:9.2em;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
/* Luminous text on a dark ground, like every other accent on the sheet. Solid
   cyan behind black type was the one place that inverted, and small letter-
   spaced uppercase is exactly where that inversion reads worst. Padding drops
   by the width of the new border, so the chip occupies the same box. */
.ges{font-family:var(--mono);font-size:calc(var(--fs)*.5);letter-spacing:.11em;text-transform:uppercase;
  color:var(--cyan);background:rgba(0,240,255,.12);border:1px solid rgba(0,240,255,.45);
  padding:1px 6px;white-space:nowrap}
.gdoes{flex:1;font-size:calc(var(--fs)*.79);line-height:1.3}
.steps{display:block;margin-top:5px;font-size:calc(var(--fs)*.58);color:var(--dim);font-family:var(--mono)}
.steps b{font-weight:400;color:#a8a8bd} .steps i{font-style:normal;color:#4c4c60;padding:0 5px}

/* ---- mouse profile: the button -> key -> binding join ---- */
/* Wider tracks than the other grids on the sheet, and deliberately so: the
   third column can hold several bindings (one key can be claimed by the base
   game AND two mods), and at 380px those wrapped to four lines each, which set
   the height of every cell in the row. */
.pgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(520px,1fr));gap:10px}
/* Two stacked paragraphs of explanation cost more vertical space than they are
   worth on a sheet that is meant to fit one screen. */
.pgrid+.foot,.foot+.foot{margin-top:-2px}
/* Three cells across the top row, the iCUE label spanning underneath. The
   button and the keycap are fixed-width so every row's third column starts at
   the same x - the whole point is scanning down "what does it actually do". */
.prow{display:grid;grid-template-columns:auto auto 1fr;gap:10px;align-items:baseline;
  background:#15151f;border:1px solid #2b2b40;border-left:3px solid var(--yellow);padding:7px 12px}
/* This panel is the last thing added to a sheet that already fitted one screen,
   so it pays for itself in millimetres: tighter prose margins here rather than
   a smaller --fs everywhere, which would shrink the keys people actually read. */
.panel.mp{padding-bottom:10px;margin-top:9px}
.panel.mp .foot{margin:6px 0 5px}
.panel.mp .foot+.foot{margin-top:-1px}
.pbtn{font-family:var(--mono);font-size:calc(var(--fs)*.62);font-weight:700;color:var(--yellow);
  background:rgba(252,238,10,.1);border:1px solid rgba(252,238,10,.45);border-radius:3px;
  padding:3px 8px;min-width:3.1em;text-align:center;white-space:nowrap}
.pdoes{display:flex;flex-direction:column;gap:4px;min-width:0}
.pd{font-size:calc(var(--fs)*.7);line-height:1.25;overflow-wrap:anywhere}
.pd em{display:inline;font-style:normal;font-family:var(--mono);font-size:calc(var(--fs)*.47);
  color:#6a6a80;letter-spacing:.03em;margin-left:.5em;white-space:nowrap}
/* The user's own name for the button, from iCUE. Deliberately the quietest
   thing in the row: it is a note they typed, not something read from the game,
   and it is the only cell on this sheet that can be out of date. */
.plbl{grid-column:1/-1;font-family:var(--mono);font-size:calc(var(--fs)*.45);color:#5a5a70;
  letter-spacing:.08em;text-transform:uppercase;line-height:1;margin-top:2px}
/* A dead button looks identical to a working one in iCUE. On the sheet it must
   not. */
.prow.dead{border-left-color:var(--red)}
.prow.dead kbd.k{color:var(--red);border-color:#4a1024}
.prow.unassigned{border-left-color:#3a3a52;opacity:.62}
.pnone{color:var(--red)}
.prow.unassigned .pnone{color:var(--dim)}
.foot.warn{color:#ffb3c4} .foot.warn b{color:var(--red)}
/* There is deliberately no "everything is fine" style here. Good news does not
   earn a line on this sheet; a finding does, and it is flagged at the key. */
.foot kbd.k{padding:2px 7px;font-size:calc(var(--fs)*.62)}

/* ---- the pad: the buttons where they physically are ---- */
/* The pad and the leftover list sit side by side. The pad is the thing you look
   at; the list is only what a grid cannot hold. Side by side rather than
   stacked because this panel was already the last thing added to a sheet that
   fitted one screen, and two rows here cost more height than the pad is worth. */
.pwrap{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}
.padwrap{flex:0 1 auto;min-width:0}
.plist{flex:1 1 430px;min-width:0}
/* Fixed-width tracks, in em so they scale with --fs like everything else. A
   1fr track would let one long binding name stretch its whole column and the
   pad would stop looking like the device. minmax(0,..) keeps it shrinkable on
   a narrow window instead of pushing the page sideways. */
.pad{display:grid;grid-template-columns:repeat(var(--pc),minmax(0,13.8em));
  grid-auto-rows:auto;gap:7px}
/* Two-column inner grid: button and keycap share the top line, everything else
   spans both. Saves a whole line per key over a plain stack, twelve times. */
.pk{display:grid;grid-template-columns:auto auto 1fr;gap:2px 9px;align-content:start;
  background:#15151f;border:1px solid #2b2b40;border-left:3px solid var(--yellow);
  padding:5px 10px 6px;min-width:0}
.pkb{grid-row:1;grid-column:1;font-family:var(--mono);font-size:calc(var(--fs)*.62);
  font-weight:700;color:var(--yellow);letter-spacing:.04em;align-self:center}
.pk kbd.k{grid-row:1;grid-column:2;justify-self:start;font-size:calc(var(--fs)*.66);padding:3px 9px}
.pk .pkd{margin-top:2px}
.pkd{grid-row:2;grid-column:1/-1;display:flex;flex-direction:column;gap:2px;min-width:0}
.pkd .pd{font-size:calc(var(--fs)*.63);line-height:1.2}
.pkl{grid-row:1;grid-column:3;align-self:center;justify-self:end;font-family:var(--mono);font-size:calc(var(--fs)*.44);
  color:#5a5a70;letter-spacing:.08em;text-transform:uppercase;line-height:1.15;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
/* A DEAD button looks identical to a working one in iCUE. In a physical layout
   it must be the thing your eye lands on first - the useful fact is not "G8 is
   dead", it is "the one your thumb rests on is". */
.pk.dead{border-left-color:var(--red);border-color:#4a1024;background:#1a1016}
.pk.dead kbd.k{color:var(--red);border-color:#4a1024}
/* A seat the profile does not use is NOT DRAWN - see the renderer. It cost a
   full cell to say "not assigned", which the owner already knew. The grid keeps
   its shape regardless, because every key states its own coordinates. */
.padcap{font-family:var(--mono);font-size:calc(var(--fs)*.45);color:#5a5a70;letter-spacing:.05em;
  line-height:1.45;margin:6px 0 0;overflow-wrap:anywhere}
.padcap b{color:#8a8aa2;font-weight:400}
.plist .padcap{margin:0 0 7px;text-transform:uppercase;letter-spacing:.14em}

/* ---- regenerate: a utility, kept quiet ---- */
/* A page from file:// cannot regenerate itself - no filesystem, no process. All
   this does is hand over the prompt, so it gets the weight of a footnote. */
.regen{display:flex;gap:14px;align-items:flex-start;margin-top:11px;padding-top:9px;
  border-top:1px solid var(--line)}
#regen{flex:0 0 auto}
#regenprompt{flex:1 1 auto;min-width:0;margin:0;font-family:var(--mono);
  font-size:calc(var(--fs)*.44);line-height:1.55;color:#5a5a70;white-space:pre-wrap;
  overflow-wrap:anywhere;user-select:all}

/* ---- collisions ---- */
.cgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:10px}
.crow{display:flex;gap:12px;align-items:flex-start;background:#15151f;border:1px solid #2b2b40;padding:11px 13px}
.crow kbd.k{color:var(--red);border-color:#4a1024}
.cwho{flex:1;display:flex;flex-direction:column;gap:4px}
.cw{font-size:calc(var(--fs)*.68);line-height:1.3}
.cw b{font-family:var(--mono);font-size:calc(var(--fs)*.5);letter-spacing:.1em;text-transform:uppercase;
  color:var(--dim);font-weight:400;margin-right:7px}
.cw em{font-style:normal;color:var(--dim);font-size:calc(var(--fs)*.55);font-family:var(--mono)}

/* Spread across the full width instead of stacking into a cramped block in the
   corner - there is a whole empty page width down here to use. */
footer{margin-top:11px;padding-top:8px;border-top:1px solid var(--line);
  font-family:var(--mono);font-size:calc(var(--fs)*.5);color:#4c4c60;line-height:1.5;
  display:flex;flex-wrap:wrap;gap:10px 34px;align-items:baseline}
footer span:last-child{margin-left:auto}
.hide{display:none !important}

@media print{
  body{background:#fff;color:#000;--fs:12pt;background-image:none}
  .bar,footer,header::after{display:none}
  h1{color:#000;text-shadow:none}
  .panel{border:1px solid #999;background:#fff;clip-path:none;break-inside:avoid;flex-basis:45%}
  kbd.k{color:#000;background:#eee;border-color:#999}
  .act em,.mvia,.foot,.pkl,.padcap{color:#555}
  .pk{background:#fff;border:1px solid #999;break-inside:avoid}
  .pk.dead{background:#fff;border-color:#000;border-left-width:3px}
  .pkb{color:#000}
  .regen{display:none}
}
</style>
</head>
<body>
<div class="wrap">

<header>
  <div class="mast">
    <h1>Cyberpunk 2077 <span>Hotkeys</span></h1>
    <button id="hidetoggle" class="pill eyebtn" title="hide mode - click any row or key to take it off the sheet">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>hide
    </button>
  </div>
  <div class="sub">$subline &middot; <span id="counts">$countsHtml</span></div>
</header>

<div class="bar">
  <input id="q" type="search" placeholder="filter - action, mod or key...">
  <button id="modtoggle" class="pill" title="show or hide which mod each binding belongs to">mod names</button>
  <span id="hits"></span>
</div>

<div class="cols">
$mouseHtml
$($catHtml -join '')
</div>

$mpHtml
$gestHtml
$colHtml

<section class="regen">
  <button id="regen" class="pill" title="copy a prompt that regenerates this sheet with the same flags, and the same things hidden">copy regen prompt</button>
  <pre id="regenprompt">$(esc $regenPrompt)</pre>
</section>

<!-- What is hidden, and the way back. Hiding is only safe to offer if putting
     something back costs one click and needs no file opened. -->
<div id="lb" class="lb hide">
  <div class="lbbox" role="dialog" aria-label="hidden entries">
    <h2><span class="dot yellow"></span>Hidden<b id="lbn"></b><button id="lbx" class="pill">close</button></h2>
    <div id="lbrows"></div>
  </div>
</div>

<footer>
  <span>Keys read from r6\input\*.xml &middot; r6\cache\inputUserMappings.xml &middot; red4ext\plugins\mod_settings\user.ini &middot; cyber_engine_tweaks\bindings.json &middot; cyber_engine_tweaks\mods\*\*.json</span>
  $(if ($mouseName) { "<span>Mouse buttons read from %APPDATA%\Corsair\CUE5\profiles &middot; profile &ldquo;$(esc $mouseName)&rdquo;</span>" })
  $(if ($padGeom) { "<span>Physical arrangement from your wiki bundle &middot; $(esc (Hide-Home $WikiBundle))</span>" })
  <span>&#9679; mod default you have not rebound</span>
  <span>Generated $stamp // CYBERWISE</span>
</footer>
</div>

<script>
// DOM filtering rather than a re-render: the sheet is static, and hiding rows
// keeps the panels and their headings where the eye already expects them.
const q = document.getElementById('q'), hits = document.getElementById('hits');
const rows = [...document.querySelectorAll('.row')];
q.addEventListener('input', () => {
  const terms = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let n = 0;
  rows.forEach(r => {
    const ok = terms.every(t => r.dataset.s.includes(t));
    r.classList.toggle('hide', !ok);
    if (ok) n++;
  });
  // Drop a panel once every row in it is filtered out.
  document.querySelectorAll('.panel:not(.wide)').forEach(p => {
    const rs = p.querySelectorAll('.row');
    p.classList.toggle('hide', rs.length > 0 && ![...rs].some(r => !r.classList.contains('hide')));
  });
  hits.textContent = terms.length ? n + ' / ' + rows.length : '';
});

// Mod-name toggle. The preference sticks across regenerations where the browser
// allows it - localStorage is unavailable on some file:// origins, so treat a
// failure as "no persistence" rather than letting it break the control.
const mt = document.getElementById('modtoggle');
function setMods(on){
  document.body.classList.toggle('nomods', !on);
  mt.classList.toggle('on', on);
  try { localStorage.setItem('cw_modnames', on ? '1' : '0'); } catch (e) {}
}
// Off by default: the keys are what you glance at, and which mod owns a binding
// only matters when you go looking for something to change.
let modsOn = false;
try { modsOn = localStorage.getItem('cw_modnames') === '1'; } catch (e) {}
setMods(modsOn);
mt.addEventListener('click', () => setMods(document.body.classList.contains('nomods')));

// Copy the regeneration prompt. THE PAGE CANNOT REGENERATE ITSELF - file:// has
// no filesystem and no way to reach a local agent - so this hands over the text
// and says plainly whether it managed to.
//
// The clipboard API is frequently unavailable or refused on file://, which is
// where this sheet lives, so there are two attempts and then an admission. The
// prompt is printed on the page for exactly this reason: when both fail it is
// still selectable, which is the whole difference between a degraded control
// and a broken one.
// ============================================================== hide mode ====
//
// TWO TIERS, AND THE PAGE ONLY OWNS THE FIRST.
//
// localStorage makes hiding instant and survives a reload. It cannot survive a
// REGENERATION, because the next sheet is a different file built from disk. The
// durable copy is an article in the user's wiki bundle, which the generator
// reads and this page cannot write - so the page's job is to hold the current
// set and hand it to the regeneration prompt, which is what closes the loop.
//
// Which of the two wins is decided by GEN. Same generation - the same file
// reopened - and the browser's copy is the newer one, so it wins and hiding
// survives a reload. A different generation means the sheet was rebuilt from
// the article since, so the article wins and the browser's copy is replaced.
// Without that, unhiding something and regenerating would leave stale storage
// hiding it again for ever, and the lightbox would look broken.
//
// Every localStorage call is wrapped: file:// origins and private modes throw
// on access, not on read, and an exception here would take the whole control
// with it. No storage means hiding still works for this visit.
const GEN = $(ConvertTo-Json -InputObject $genId -Compress);
const SKEY = 'cw_hidden';
const items = [...document.querySelectorAll('[data-hid]')];
const byHid = new Map(items.map(e => [e.dataset.hid, e]));

let hidden = new Set(items.filter(e => e.classList.contains('hid')).map(e => e.dataset.hid));
try {
  const raw = localStorage.getItem(SKEY);
  if (raw) {
    const o = JSON.parse(raw);
    if (o && o.gen === GEN && Array.isArray(o.hidden)) hidden = new Set(o.hidden);
  }
} catch (e) { /* no storage: this visit only */ }

function saveHidden(){
  try { localStorage.setItem(SKEY, JSON.stringify({ gen: GEN, hidden: [...hidden] })); } catch (e) {}
}

const lb = document.getElementById('lb');
const lbRows = document.getElementById('lbrows'), lbN = document.getElementById('lbn');
const cAssigned = document.getElementById('cAssigned'), cDead = document.getElementById('cDead');
const cHid = document.getElementById('cHid');
const cDeadWrap = document.getElementById('cDeadWrap'), cHidWrap = document.getElementById('cHidWrap');

function applyHidden(){
  items.forEach(e => e.classList.toggle('hid', hidden.has(e.dataset.hid)));

  // The count line, measured rather than asserted. A segment that would read
  // zero is not drawn - "0 dead" is the good-news line wearing a number.
  const shown = items.filter(e => !hidden.has(e.dataset.hid));
  cAssigned.textContent = shown.length;
  const dead = shown.filter(e => e.dataset.dead).length;
  cDead.textContent = dead;
  cDeadWrap.classList.toggle('hide', dead === 0);
  cHid.textContent = hidden.size + ' hidden';
  cHidWrap.classList.toggle('hide', hidden.size === 0);
  if (!hidden.size) lb.classList.add('hide');

  // The list, and the way back out. An entry with no element on the page - a
  // mod uninstalled since it was hidden - is still listed, by its raw id: it is
  // still in the set, it will still be written back on the next regeneration,
  // and silently dropping it would make it unremovable.
  lbRows.innerHTML = '';
  [...hidden].sort().forEach(h => {
    const el = byHid.get(h);
    const row = document.createElement('div');
    row.className = 'lbrow';
    const a = document.createElement('span');
    a.className = 'lbl1';
    // The entry's own label, not its id. The id is machinery - it only earns a
    // line when it is the ONLY thing left to identify a row by.
    a.innerHTML = el ? el.dataset.hlabel : h + ' <i>(not on this sheet any more)</i>';
    const u = document.createElement('button');
    u.className = 'pill'; u.textContent = 'unhide';
    u.addEventListener('click', () => { hidden.delete(h); saveHidden(); applyHidden(); });
    row.append(a, u);
    lbRows.appendChild(row);
  });
  lbN.textContent = hidden.size;
  regenText();
}

const ht = document.getElementById('hidetoggle');
ht.addEventListener('click', () => {
  const on = !document.body.classList.contains('hiding');
  document.body.classList.toggle('hiding', on);
  ht.classList.toggle('on', on);
});

// One delegated listener rather than one per row: the rows are rebuilt by the
// filter and the lightbox, and a listener attached per element goes stale.
document.addEventListener('click', ev => {
  if (!document.body.classList.contains('hiding')) return;
  if (ev.target.closest('.lb') || ev.target.closest('header') || ev.target.closest('.bar')) return;
  const el = ev.target.closest('[data-hid]');
  if (!el) return;
  ev.preventDefault();
  const h = el.dataset.hid;
  if (hidden.has(h)) hidden.delete(h); else hidden.add(h);
  saveHidden();
  applyHidden();
});

cHid.addEventListener('click', () => lb.classList.toggle('hide'));
document.getElementById('lbx').addEventListener('click', () => lb.classList.add('hide'));
lb.addEventListener('click', ev => { if (ev.target === lb) lb.classList.add('hide'); });
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') lb.classList.add('hide'); });

const rg = document.getElementById('regen'), rp = document.getElementById('regenprompt');
const rgLabel = rg.textContent;

// The prompt is rebuilt on every change, because the hidden set moves after the
// file was written and a prompt that carries a stale list un-hides things.
const REGEN_HEAD = $(ConvertTo-Json -InputObject ($regenHead + "`n`n" + $regenCmd) -Compress);
function regenText(){
  const q = [...hidden].sort().map(h => "'" + h.split("'").join("''") + "'");
  rp.textContent = REGEN_HEAD + ' ' + (q.length ? '-Hide ' + q.join(',') : '-Hide @()');
}

saveHidden();
applyHidden();
function rgSay(t, ok){
  rg.textContent = t;
  rg.classList.toggle('on', !!ok);
  setTimeout(() => { rg.textContent = rgLabel; rg.classList.remove('on'); }, 2800);
}
rg.addEventListener('click', async () => {
  const text = rp.textContent;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      rgSay('copied', true); return;
    }
  } catch (e) { /* fall through to the selection copy */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (ok) { rgSay('copied', true); return; }
  } catch (e) { /* fall through to saying so */ }
  rgSay('copy unavailable - select the text', false);
});
</script>
</body>
</html>
"@

$html = $html.Replace('__FS__', [string][math]::Round(30 * $Scale, 1))

# ---- last pass: no account name leaves this file ---------------------------
#
# Every path is already de-named where it is built, and this is the net under
# that. A sheet gets screenshotted and posted; -Notes, a moved bundle or a mod
# folder under the home directory can all put a username somewhere nobody
# thought to look, and every one of those would be found by the reader rather
# than by the author. A MatchEvaluator, not a replacement string, because a `$`
# in a replacement is a substitution and would mangle the token it is inserting.
if ($homeDir) {
    $html = [regex]::Replace($html, [regex]::Escape($homeDir),
                             [System.Text.RegularExpressions.MatchEvaluator]{ param($m) '$env:USERPROFILE' },
                             'IgnoreCase')
}
# And say so if one survived anyway, rather than shipping it quietly. This is
# advisory: a username can legitimately be a substring of an ordinary word, and
# refusing to write the sheet over it would be worse than saying it is there.
if ($env:USERNAME -and $html -match [regex]::Escape($env:USERNAME)) {
    Write-Warning "the sheet still contains '$env:USERNAME' somewhere - check before sharing a screenshot of it"
}

$dir = Split-Path -Parent $Out
if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
Set-Content -LiteralPath $Out -Value $html -Encoding UTF8
Write-Host "wrote $Out ($([math]::Round((Get-Item -LiteralPath $Out).Length/1kb,1)) KB)" -ForegroundColor Green
