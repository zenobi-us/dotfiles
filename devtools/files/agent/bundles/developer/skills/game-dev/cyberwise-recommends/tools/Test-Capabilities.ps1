# Test-Capabilities.ps1 -- what this install cannot do, and what is missing to do it.
#
#     .\Test-Capabilities.ps1 -GameRoot '<install>'
#     .\Test-Capabilities.ps1 -GameRoot '<install>' -For presets     # exit 1 if blocked
#     .\Test-Capabilities.ps1 -GameRoot '<install>' -Json
#
# NOT a readiness check and NOT a shopping list.
#
# `cyberwise/tools/Test-InstallReady.ps1` already answers "would launching work",
# including the framework layer (RED4ext, redscript, CET, ArchiveXL, TweakXL,
# Codeware). This tool answers a different question: **what can this install do**,
# and it covers the CET-mod layer that readiness does not - starting with ACU,
# whose absence means the appearance-preset tools in `cyberwise-saves` have
# literally nothing to read.
#
# The distinction that matters, and the reason -For exists:
#
#   PREREQUISITE - the user asked for something this install cannot do. Saying so
#                  is the ANSWER to their question, not a recommendation, and it
#                  is never suppressed by a preference.
#   RECOMMENDATION - nobody asked. That goes through Test-RecommendAllowed in
#                  ModPreference.ps1 and can be turned off forever.
#
# Entry criteria for this table: a missing item must make something IMPOSSIBLE or
# INVISIBLE, stated as one concrete loss. Taste is not a criterion. If this table
# ever grows past about six rows it has become a modlist and has failed.

[CmdletBinding()]
param(
    [string] $GameRoot,

    # Ask about one capability: exits 0 when the install can do it, 1 when not.
    [ValidateSet('presets', 'appearance', 'modsettings', 'console', 'photo', 'livequery')]
    [string] $For,

    [switch] $Json
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$ErrorActionPreference = 'Stop'

# Ask the STOREFRONT where the game is; never guess a path. Steam, GOG and Epic
# all differ and the drive is whatever the user chose - the first version of this
# file carried a hardcoded Steam library path from one machine, written three
# paragraphs below its own skill saying never to assume a default install
# location. The family test that forbids absolute user paths is what caught it,
# and then caught the rewritten COMMENT for quoting the offending path verbatim -
# a real directory in a shipped file is a real directory whether it is code or
# prose.
if (-not $GameRoot) {
    $seen = New-Object System.Collections.Generic.List[string]
    try {
        $steam = (Get-ItemProperty 'HKLM:\SOFTWARE\WOW6432Node\Valve\Steam' -ErrorAction SilentlyContinue).InstallPath
        if ($steam) {
            $seen.Add((Join-Path $steam 'steamapps\common\Cyberpunk 2077'))
            $vdf = Join-Path $steam 'steamapps\libraryfolders.vdf'
            if (Test-Path -LiteralPath $vdf) {
                foreach ($m in [regex]::Matches((Get-Content -LiteralPath $vdf -Raw), '"path"\s+"([^"]+)"')) {
                    $seen.Add((Join-Path ($m.Groups[1].Value -replace '\\\\', '\') 'steamapps\common\Cyberpunk 2077'))
                }
            }
        }
    } catch {}
    foreach ($k in 'HKLM:\SOFTWARE\WOW6432Node\GOG.com\Games\1423049311', 'HKLM:\SOFTWARE\GOG.com\Games\1423049311') {
        try { $g = (Get-ItemProperty $k -ErrorAction SilentlyContinue).path; if ($g) { $seen.Add($g) } } catch {}
    }
    foreach ($p in $seen) {
        if ($p -and (Test-Path -LiteralPath (Join-Path $p 'bin\x64\Cyberpunk2077.exe'))) { $GameRoot = $p; break }
    }
}
if (-not $GameRoot -or -not (Test-Path -LiteralPath $GameRoot)) {
    throw "Could not find Cyberpunk 2077. Pass -GameRoot 'X:\path\to\Cyberpunk 2077'."
}

# Each row: what it is, how to see it, what is lost without it, and what it needs
# first. `Needs` matters because recommending ACU to somebody with no CET is
# advice they cannot act on.
$capabilities = @(
    [pscustomobject]@{
        Name    = 'Cyber Engine Tweaks'
        Short   = 'CET'
        Probe   = @('bin\x64\plugins\cyber_engine_tweaks.asi')
        Needs   = $null
        Without = 'no in-game console or overlay, and every CET mod - ACU, AMM, Mod Settings - cannot run at all'
        Enables = @('console')
    }
    [pscustomobject]@{
        Name    = 'Appearance Change Unlocker'
        Short   = 'ACU'
        Probe   = @('bin\x64\plugins\cyber_engine_tweaks\mods\AppearanceChangeUnlocker')
        Needs   = 'Cyber Engine Tweaks'
        Without = "V's appearance cannot be changed after character creation, and no .preset files exist - so the appearance tools in cyberwise-saves have nothing to read"
        Enables = @('presets', 'appearance')
    }
    # TWO settings frameworks, not one, serving different mod ecosystems - and
    # neither is where a first guess puts it. The original probe here looked under
    # CET mods and reported ABSENT on an install that had both, which is exactly
    # the false recommendation this skill exists to prevent. Probe is a LIST for
    # that reason: installers and mod versions move things, and one hardcoded path
    # is one wrong answer.
    [pscustomobject]@{
        Name    = 'Mod Settings'
        Short   = 'mod_settings'
        Probe   = @('red4ext\plugins\mod_settings')
        Needs   = $null
        Without = 'redscript mods that ship no UI of their own have no reachable options - their settings exist but cannot be seen or changed'
        Enables = @('modsettings')
    }
    [pscustomobject]@{
        Name    = 'Native Settings UI'
        Short   = 'nativeSettings'
        Probe   = @('bin\x64\plugins\cyber_engine_tweaks\mods\nativeSettings')
        Needs   = 'Cyber Engine Tweaks'
        Without = 'CET and Lua mods that rely on it have no options screen at all'
        Enables = @('modsettings')
    }
    # The only way to ask the RUNNING game a question. Without it the console is
    # the sole route, and the console strips newlines from multi-line pastes - so
    # anything past a one-liner cannot be run at all, and a one-liner cannot
    # afford the per-field pcall that live inspection needs.
    [pscustomobject]@{
        Name    = 'CETMonkey'
        Short   = 'cetmonkey'
        Probe   = @('bin\x64\plugins\cyber_engine_tweaks\mods\cetmonkey')
        Needs   = 'Cyber Engine Tweaks'
        Without = 'no way to run a multi-line script in the running game, so live state - inventory contents, applied status effects, real vendor stock - cannot be read at all'
        Enables = @('livequery')
    }
    [pscustomobject]@{
        Name    = 'Appearance Menu Mod'
        Short   = 'AMM'
        Probe   = @('bin\x64\plugins\cyber_engine_tweaks\mods\AppearanceMenuMod')
        Needs   = 'Cyber Engine Tweaks'
        Without = 'no free camera, NPC appearance editing or scene tooling'
        Enables = @('photo')
    }
)

$rows = foreach ($c in $capabilities) {
    # First probe that exists wins, and the one that matched is reported - so a
    # later "why did it say that?" can be answered without re-deriving the guess.
    $hit = $null
    foreach ($probe in @($c.Probe)) {
        if (Test-Path -LiteralPath (Join-Path $GameRoot $probe)) { $hit = $probe; break }
    }
    [pscustomobject]@{
        Name      = $c.Name
        Short     = $c.Short
        Installed = [bool]$hit
        FoundAt   = $hit
        Needs     = $c.Needs
        Without   = $c.Without
        Enables   = $c.Enables
        Probe     = @($c.Probe)
    }
}

# --- -For: the prerequisite gate other skills call ---------------------------
if ($For) {
    $needed = @($rows | Where-Object { $_.Enables -contains $For })
    $missing = @($needed | Where-Object { -not $_.Installed })

    # A dependency that is itself missing has to be named too, or the advice is
    # unactionable: "install ACU" is useless to somebody with no CET.
    foreach ($m in @($missing)) {
        if ($m.Needs) {
            $dep = $rows | Where-Object { $_.Name -eq $m.Needs }
            if ($dep -and -not $dep.Installed -and $missing.Name -notcontains $dep.Name) { $missing += $dep }
        }
    }

    if ($Json) { [pscustomobject]@{ Capability = $For; Satisfied = ($missing.Count -eq 0); Missing = @($missing.Name) } | ConvertTo-Json -Depth 4 }
    elseif ($missing.Count -eq 0) {
        Write-Host "'$For' is available on this install." -ForegroundColor Green
    } else {
        Write-Host "'$For' is NOT available on this install." -ForegroundColor Yellow
        foreach ($m in $missing) {
            Write-Host "  missing: $($m.Name)" -ForegroundColor Yellow
            Write-Host "           without it, $($m.Without)" -ForegroundColor DarkGray
            if ($m.Needs) { Write-Host "           requires: $($m.Needs)" -ForegroundColor DarkGray }
        }
    }
    if ($missing.Count -eq 0) { exit 0 } else { exit 1 }
}

# --- default: the whole table ------------------------------------------------
if ($Json) { $rows | ConvertTo-Json -Depth 4; return }

Write-Host "capabilities at $GameRoot" -ForegroundColor DarkGray
Write-Host ''
foreach ($r in $rows) {
    if ($r.Installed) {
        Write-Host ("  present  {0}" -f $r.Name) -ForegroundColor Green
    } else {
        Write-Host ("  ABSENT   {0}" -f $r.Name) -ForegroundColor Yellow
        Write-Host ("           {0}" -f $r.Without) -ForegroundColor DarkGray
    }
}
Write-Host ''
Write-Host 'Absent is not advice. Say something only when the user is trying to do the thing it blocks,' -ForegroundColor DarkGray
Write-Host 'and check Test-RecommendAllowed first if nobody asked.' -ForegroundColor DarkGray
