# ModPatchWatch.ps1 -- notice when a mod you patched or overrode has changed.
#
#     . .\tools\ModPatchWatch.ps1
#
#     Register-ModPatch -Name 'VisibleBullets Borg4a' `
#                       -UpstreamPath '<staging>\...\Items.Preset_Borg4a_Default.yaml' `
#                       -OverridePath '<staging>\zzz_Fix\...\Items.Preset_Borg4a_Default.yaml' `
#                       -Note 'author indents line 3 by 3 spaces; yaml-cpp rejects the file'
#
#     Test-ModPatches            # the sweep: has anything changed underneath us?
#     Get-ModPatch               # what is registered
#     Unregister-ModPatch -Name  # retired, author fixed it upstream
#
# WHY THIS EXISTS
#
# Fixing somebody else's mod has two failure modes and they are opposites:
#
#   An IN-PLACE PATCH is wiped by their update. Loud - the bug comes back.
#   An OVERRIDE is NOT wiped. Silent - your old copy keeps winning, and every
#   fix the author ships afterwards loses to it with nothing reporting the fact.
#
# The second is the dangerous one, and it is the reason to be careful about
# overriding whole files. But that danger comes entirely from *not noticing*.
# Record what the upstream file looked like when you patched it, and a sweep
# turns the silent failure into a loud one - at which point an override is the
# better option almost everywhere, because it also survives the update.
#
# So: register every patch and override, and run the sweep after any mod update.

# WHERE THE RECORDS LIVE, and why it is not next to this script.
#
#   %USERPROFILE%\Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\patches.json
#
# Beside the saves, in a namespace folder of our own - the same shape mod authors
# use for their own data there. Three reasons, and the third is the point:
#
#   1. It describes THE INSTALL, not the tooling. It belongs with the game.
#   2. It survives the tooling. Reinstalling, moving or deleting the skill does
#      not lose the record of what was patched.
#   3. **It is agent-neutral.** Claude Code and Codex both read this path, so
#      work started under one is picked up by the other. A record kept in one
#      agent's memory is invisible to the next one and is lost on a switch.
#
# NEVER put install records in the repo: they describe one person's machine.
# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot 'UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }

$script:PatchStore = Join-Path $env:USERPROFILE 'Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\patches.json'

function Get-ModPatchStorePath { $script:PatchStore }

# One-time move from the old per-user location, so an existing record is not
# orphaned by this change.
$legacyStore = Join-Path $env:LOCALAPPDATA 'cyberwise\patches.json'
if ((Test-Path -LiteralPath $legacyStore) -and -not (Test-Path -LiteralPath $script:PatchStore)) {
    $dir = Split-Path -Parent $script:PatchStore
    if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Move-Item -LiteralPath $legacyStore -Destination $script:PatchStore
    Write-Host "moved the patch record to $script:PatchStore" -ForegroundColor DarkGray
}

function Get-ModPatch {
    <#  Registered patches, newest first. -Name filters.  #>
    [CmdletBinding()]
    param([string]$Name)
    if (-not (Test-Path -LiteralPath $script:PatchStore)) { return @() }
    try   { $all = @(Get-Content -LiteralPath $script:PatchStore -Raw | ConvertFrom-Json) }
    catch { Write-Warning "patch store unreadable: $($_.Exception.Message)"; return @() }
    if ($Name) { $all = $all | Where-Object { $_.Name -eq $Name } }
    return @($all)
}

function Save-ModPatchStore {
    param($Entries)
    $dir = Split-Path -Parent $script:PatchStore
    if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    @($Entries) | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $script:PatchStore -Encoding UTF8
}

function Register-ModPatch {
    <#
    .SYNOPSIS
        Record that you have patched or overridden a file, and what it looked like.
    .DESCRIPTION
        Register at the moment you make the change, not later - the whole value is
        in the hash of the version you actually worked against.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string] $Name,
        # The AUTHOR'S file - the thing that changes when they release an update.
        [Parameter(Mandatory)][string] $UpstreamPath,
        # Your override file, if this is an override rather than an in-place edit.
        [string] $OverridePath,
        [string] $Note
    )

    if (-not (Test-Path -LiteralPath $UpstreamPath)) { throw "no upstream file at: $UpstreamPath" }

    # Keep a COPY of their file as it was, not just its hash.
    #
    # When the sweep later says CHANGED, the question is never "did it change" -
    # it is "does my change still apply, and did they fix it themselves?". That
    # needs their-old against their-new, which needs their-old to still exist.
    # A hash tells you something moved; the snapshot tells you what.
    #
    # This exists to make the JUDGEMENT fast, not to enable an automatic merge.
    # See Show-ModPatchDrift, and the warning above it.
    $snapDir = Join-Path (Split-Path -Parent $script:PatchStore) 'upstream'
    if (-not (Test-Path -LiteralPath $snapDir)) { New-Item -ItemType Directory -Path $snapDir -Force | Out-Null }
    $safe = ($Name -replace '[^A-Za-z0-9._-]', '_')
    $snap = Join-Path $snapDir "$safe.upstream"
    $srcItem = Get-Item -LiteralPath $UpstreamPath
    if ($srcItem.Length -le 5MB) {
        Copy-Item -LiteralPath $UpstreamPath -Destination $snap -Force
    } else {
        $snap = $null   # too big to be a text patch target; hash-only is honest
    }

    $entry = [pscustomobject]@{
        Name         = $Name
        Kind         = if ($OverridePath) { 'override' } else { 'in-place' }
        UpstreamPath = (Get-Item -LiteralPath $UpstreamPath).FullName
        UpstreamSha  = (Get-FileHash -LiteralPath $UpstreamPath -Algorithm SHA256).Hash
        UpstreamSize = (Get-Item -LiteralPath $UpstreamPath).Length
        OverridePath = if ($OverridePath) { $OverridePath } else { $null }
        Snapshot     = $snap
        RecordedUtc  = (Get-Date).ToUniversalTime().ToString('s') + 'Z'
        Note         = $Note
    }

    $all = @(Get-ModPatch | Where-Object { $_.Name -ne $Name })   # re-registering replaces
    Save-ModPatchStore (@($all) + $entry)
    Write-Host "registered '$Name' ($($entry.Kind)) against $($entry.UpstreamSha.Substring(0,12))" -ForegroundColor Green
    return $entry
}

function Unregister-ModPatch {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string] $Name)
    $all = @(Get-ModPatch)
    $keep = @($all | Where-Object { $_.Name -ne $Name })
    if ($keep.Count -eq $all.Count) { Write-Warning "nothing registered as '$Name'"; return }
    Save-ModPatchStore $keep
    Write-Host "unregistered '$Name'" -ForegroundColor Green
}

function Show-ModPatchDrift {
    <#
    .SYNOPSIS
        Show what the AUTHOR changed since you patched their file.
    .DESCRIPTION
        Run this when the sweep says CHANGED. It diffs their file as it was when
        you patched it against their file now - so you can see what they did, and
        judge whether your change still applies, still belongs somewhere else, or
        is no longer needed because they fixed it themselves.

        ** NEVER AUTO-APPLY THE OLD PATCH TO THE NEW FILE. **

        This is deliberate and it is not laziness. A patch is a semantic change
        to code that has since moved. Re-applying it mechanically either fails -
        which is fine - or SUCCEEDS IN THE WRONG PLACE, which is silent and
        worse. Fuzzy or context-matched patching exists precisely to land a hunk
        somewhere plausible, and "plausible" is not "correct" in someone else's
        refactored file.

        Three questions, in order, every time:

          1. **Did they fix it themselves?** Then retire the patch:
             Unregister-ModPatch, and uninstall the override. This is the happy
             outcome and it is easy to miss while concentrating on re-applying.
          2. **Does the thing you changed still exist**, under that name, doing
             that job? A rename or a restructure can make an old patch
             meaningless while still applying cleanly.
          3. **Re-derive from their new file** - read it, make the change again,
             rebuild the override, then Register-ModPatch again to clear the flag.

        No -AutoFix switch will ever be added here, and one should not be.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string] $Name)

    $p = Get-ModPatch -Name $Name | Select-Object -First 1
    if (-not $p) { throw "nothing registered as '$Name'" }
    if (-not $p.Snapshot -or -not (Test-Path -LiteralPath $p.Snapshot)) {
        throw "no snapshot of their original file for '$Name' - registered before snapshots, or the file was too large. Re-derive by reading their file directly."
    }
    if (-not (Test-Path -LiteralPath $p.UpstreamPath)) { throw "their file is gone: $($p.UpstreamPath)" }

    $backup = Join-Path $PSScriptRoot 'ModFileBackup.ps1'
    if (-not (Test-Path -LiteralPath $backup)) { throw "ModFileBackup.ps1 not found beside this script" }
    . $backup

    Write-Host ''
    Write-Host "what the AUTHOR changed since you patched '$Name':" -ForegroundColor Cyan
    Write-Host "  yours was for: $($p.Note)" -ForegroundColor DarkGray
    Show-ModFileDiff -Path $p.Snapshot -NewFile $p.UpstreamPath | Out-Null
    Write-Host 'Re-derive from their new file. Do not replay the old edit blindly.' -ForegroundColor Yellow
}

function Test-ModPatches {
    <#
    .SYNOPSIS
        The sweep. Reports every patch whose upstream file has changed.
    .DESCRIPTION
        Run after ANY mod update. Exit-style result: returns the findings, and
        writes a non-zero $global:LASTPATCHSWEEP when something needs attention.

        Four things can be wrong, and they need different actions:

          CHANGED  the author shipped a new version of the file you patched.
                   An in-place patch is probably already gone; an override is
                   probably now stale and hiding their fix. RE-DERIVE.
          GONE     the upstream file is missing - the mod was uninstalled,
                   renamed, or updated into a different layout.
          NOOVER   an override was registered but its file is not there, so
                   nothing is overriding anything and the bug is back.
          OK       byte-identical to when you patched it.
    #>
    [CmdletBinding()]
    param([switch] $Quiet)

    $patches = @(Get-ModPatch)
    if (-not $patches.Count) {
        if (-not $Quiet) { Write-Host 'no patches registered' -ForegroundColor DarkGray }
        $global:LASTPATCHSWEEP = 0
        return @()
    }

    $findings = foreach ($p in $patches) {
        $state = 'OK'; $detail = ''

        if (-not (Test-Path -LiteralPath $p.UpstreamPath)) {
            $state = 'GONE'; $detail = 'upstream file is missing - mod uninstalled, renamed, or restructured'
        } else {
            $now = (Get-FileHash -LiteralPath $p.UpstreamPath -Algorithm SHA256).Hash
            if ($now -ne $p.UpstreamSha) {
                $state  = 'CHANGED'
                $detail = if ($p.Kind -eq 'override') {
                    'the author changed this file. Your override still wins, so their change is NOT in effect - re-derive it.'
                } else {
                    'the author changed this file. Your in-place edit is probably gone - re-apply or re-derive.'
                }
            }
        }

        if ($state -eq 'OK' -and $p.Kind -eq 'override' -and $p.OverridePath -and
            -not (Test-Path -LiteralPath $p.OverridePath)) {
            $state = 'NOOVER'; $detail = 'the override file is missing, so nothing is overriding anything'
        }

        [pscustomobject]@{ Name = $p.Name; Kind = $p.Kind; State = $state; Detail = $detail; Path = $p.UpstreamPath; Note = $p.Note }
    }

    if (-not $Quiet) {
        foreach ($f in $findings) {
            $colour = switch ($f.State) { 'OK' { 'DarkGreen' } 'CHANGED' { 'Yellow' } default { 'Red' } }
            Write-Host ("{0,-8} {1}" -f $f.State, $f.Name) -ForegroundColor $colour
            if ($f.Detail) { Write-Host "         $($f.Detail)" -ForegroundColor DarkGray }
            if ($f.State -ne 'OK' -and $f.Note) { Write-Host "         was: $($f.Note)" -ForegroundColor DarkGray }
        }
        $bad = @($findings | Where-Object State -ne 'OK').Count
        Write-Host ''
        if ($bad) { Write-Host "$bad patch(es) need attention" -ForegroundColor Yellow }
        else      { Write-Host "all $($findings.Count) patch(es) still match the version they were made against" -ForegroundColor Green }
    }

    $global:LASTPATCHSWEEP = @($findings | Where-Object State -ne 'OK').Count
    return $findings
}
