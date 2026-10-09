# Test-ModPresent.ps1 -- is this mod actually installed right now?
#
#     .\Test-ModPresent.ps1 -GameRoot '<path>' -Name 'Immersive Gigs'
#     .\Test-ModPresent.ps1 -GameRoot '<path>' -Name a,b,c -Quiet
#
# WHY THIS EXISTS
#
# NEVER NAME A MOD YOU HAVE NOT CONFIRMED IS INSTALLED.
#
# On 2026-08-23, hunting a crash, a suspect list was assembled that included
# `AnywherePrologueUnlock`. It had been uninstalled. The user had to say so, and
# every other name in that list became worth less for it - which is the real
# cost. A diagnosis is only worth what its weakest claim is worth, and "that mod
# isn't even installed" is the fastest way to make someone stop reading.
#
# It happened because the name came from a REMEMBERED list rather than from
# disk. The stale sources are all seductive because they look authoritative:
#
#   - a bisect park manifest (a snapshot of a past state, by design)
#   - a backup folder (things that WERE installed)
#   - modlist.txt (holds slots for disabled mods on purpose)
#   - the mod manager's own list (staged is not deployed)
#   - anything said earlier in the same conversation
#
# So this resolves the question the only way that is safe: by looking in the
# places a mod can actually live, right now.

[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string] $GameRoot,
    [Parameter(Mandatory)] [string[]] $Name,

    # Exit 1 if ANY name is not installed, and print nothing on success. For use
    # as a gate in front of a report that is about to name mods.
    [switch] $Quiet
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot 'UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $GameRoot)) { throw "no such game root: $GameRoot" }

# SPLIT COMMA-JOINED INPUT.
#
# `pwsh -File script.ps1 -Name 'a','b'` does NOT pass an array - the shell hands
# over one string, "a,b". The tool then searched for a single mod with a comma in
# its name, found nothing, and reported NOT INSTALLED with full confidence. A
# false negative here is worse than no tool at all: it is the exact claim this
# script exists to stop anyone making.
$Name = @($Name | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })

# Every place a mod can put itself. Kept in step with the "Know where each kind
# of mod lives" table in SKILL.md - a location missing here reads as "not
# installed", which is the exact wrong answer this tool exists to prevent.
$locations = @(
    @{ Kind = 'archive';   Path = 'archive\pc\mod';                                  File = $true  }
    @{ Kind = 'REDmod';    Path = 'mods';                                            File = $false }
    @{ Kind = 'CET mod';   Path = 'bin\x64\plugins\cyber_engine_tweaks\mods';         File = $false }
    @{ Kind = 'RED4ext';   Path = 'red4ext\plugins';                                 File = $false }
    @{ Kind = 'redscript'; Path = 'r6\scripts';                                      File = $false }
    @{ Kind = 'tweak';     Path = 'r6\tweaks';                                       File = $true  }
    @{ Kind = 'input xml'; Path = 'r6\input';                                        File = $true  }
    @{ Kind = 'ASI';       Path = 'bin\x64\plugins';                                 File = $true  }
)

$results = foreach ($n in $Name) {
    $found = New-Object System.Collections.Generic.List[string]
    foreach ($loc in $locations) {
        $dir = Join-Path $GameRoot $loc.Path
        if (-not (Test-Path -LiteralPath $dir)) { continue }
        $items = if ($loc.File) { Get-ChildItem -LiteralPath $dir -File -ErrorAction SilentlyContinue }
                 else            { Get-ChildItem -LiteralPath $dir -Directory -ErrorAction SilentlyContinue }
        foreach ($i in $items) {
            # Match on the stem so 'Immersive Gigs' finds ImmersiveGigs.archive,
            # and a partial name still resolves - a report that misses a mod
            # because of a space is no better than one that invents it.
            $stem = [IO.Path]::GetFileNameWithoutExtension($i.Name)
            $a = ($stem -replace '[^A-Za-z0-9]', '').ToLower()
            $b = ($n    -replace '[^A-Za-z0-9]', '').ToLower()
            if ($a -eq $b -or ($b.Length -ge 4 -and $a -like "*$b*")) {
                $found.Add("$($loc.Kind): $($loc.Path)\$($i.Name)")
            }
        }
    }
    [pscustomobject]@{ Name = $n; Installed = ($found.Count -gt 0); Where = $found }
}

$missing = @($results | Where-Object { -not $_.Installed })

if (-not $Quiet) {
    foreach ($r in $results) {
        if ($r.Installed) {
            Write-Host ("  INSTALLED  {0}" -f $r.Name) -ForegroundColor Green
            foreach ($w in $r.Where) { Write-Host ("             {0}" -f $w) -ForegroundColor DarkGray }
        } else {
            Write-Host ("  NOT FOUND  {0}" -f $r.Name) -ForegroundColor Red
            Write-Host  "             do not name this mod in a report - it is not installed" -ForegroundColor DarkGray
        }
    }
}

if ($missing.Count) {
    if ($Quiet) { $missing | ForEach-Object { Write-Host "NOT INSTALLED: $($_.Name)" -ForegroundColor Red } }
    exit 1
}
exit 0
