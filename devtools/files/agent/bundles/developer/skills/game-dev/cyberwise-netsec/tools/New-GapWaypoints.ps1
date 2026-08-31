# New-GapWaypoints.ps1 -- turn NetSec's GAP diagnostic into CETMonkey teleport
# waypoints, so the holes in the world can be visited instead of hunted for.
#
# NetSec logs a GAP line whenever a device or a person came out UNLOCKED because
# nothing on their network could ever be breached. Nothing happens in play when
# you walk past one - that is exactly why they have to report themselves - so the
# log is the only place they exist. This turns them into somewhere you can stand.
#
# WHY CETMONKEY AND NOT AMM. CETMonkey reads exactly one file, locations.lua,
# and that is the whole teleport list its UI filters (init.lua:248). Its own
# "Record here" button writes an AMM-format .json for you to move by hand, so
# writing AMM files would mean an extra manual step for something generated.
#
# locations.lua carries a header saying it is generated from AMM and should not
# be hand-edited. That is respected: entries that did not come from here are
# read, kept, and written back untouched. Only rows whose name starts with the
# prefix are ever replaced, so re-running is idempotent and regenerating from
# AMM costs you nothing but a re-run of this.

[CmdletBinding()]
param(
    # The game folder. Only used to find the log and CETMonkey when the explicit
    # paths are not given.
    [string] $GameRoot,

    # CET's scripting log. Defaults to the live one plus its rotations, because
    # the interesting GAP lines are frequently from the session before last.
    [string[]] $LogPath,

    # CETMonkey's teleport list.
    [string] $LocationsPath,

    # Two GAP hits this close together are the same place. Sector-scale rather
    # than room-scale on purpose: the output is "somewhere an access point
    # should go", and one per doorway would be useless.
    [double] $ClusterRadius = 25.0,

    # Clusters smaller than this are dropped. One stray unlocked device is
    # usually a lone gonk's toaster, not a site that wants defending.
    [int] $MinHits = 2,

    # Every row written carries this. It is how existing entries are told from
    # generated ones, and it is what you type in CETMonkey's filter box.
    [string] $Prefix = 'NETSEC-GAP',

    # Without this the script reports and writes nothing.
    [switch] $Write
)

$ErrorActionPreference = 'Stop'

# --- upstream guard ---------------------------------------------------------
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }

# --- locate things ----------------------------------------------------------

# ASK THE MACHINE WHERE THE GAME IS, never guess at a drive letter. The first
# version of this listed C:\Games and two other likely paths, which is exactly
# what the family test forbids: it works on the author's box and nowhere else,
# and it fails by quietly reading the wrong directory rather than by saying so.
if (-not $GameRoot) {
    $candidates = [System.Collections.Generic.List[string]]::new()
    $steam = $null
    try   { $steam = (Get-ItemProperty 'HKLM:\SOFTWARE\WOW6432Node\Valve\Steam' -Name InstallPath -ErrorAction Stop).InstallPath }
    catch { try { $steam = (Get-ItemProperty 'HKCU:\SOFTWARE\Valve\Steam' -Name SteamPath -ErrorAction Stop).SteamPath } catch { } }
    if ($steam) {
        # Read the library list: the game is very often not on the Steam drive.
        $vdf = Join-Path $steam 'steamapps\libraryfolders.vdf'
        if (Test-Path -LiteralPath $vdf) {
            foreach ($m in [regex]::Matches((Get-Content -LiteralPath $vdf -Raw), '"path"\s+"([^"]+)"')) {
                $candidates.Add((Join-Path ($m.Groups[1].Value -replace '\\\\', '\') 'steamapps\common\Cyberpunk 2077'))
            }
        }
        $candidates.Add((Join-Path $steam 'steamapps\common\Cyberpunk 2077'))
    }
    try {
        foreach ($k in (Get-ChildItem 'HKLM:\SOFTWARE\WOW6432Node\GOG.com\Games' -ErrorAction Stop)) {
            $p = (Get-ItemProperty $k.PSPath -Name path -ErrorAction SilentlyContinue).path
            if ($p) { $candidates.Add($p) }
        }
    } catch { }
    foreach ($c in $candidates) {
        if (Test-Path -LiteralPath (Join-Path $c 'bin\x64\Cyberpunk2077.exe')) { $GameRoot = $c; break }
    }
}
if (-not $GameRoot) { throw "Could not find the game. Pass -GameRoot." }

$cetDir = Join-Path $GameRoot 'bin\x64\plugins\cyber_engine_tweaks'
if (-not $LogPath) {
    # scripting.log is the live one; scripting.N.log are rotations, newest first.
    $LogPath = @(Get-ChildItem -LiteralPath $cetDir -Filter 'scripting*.log' -ErrorAction SilentlyContinue |
                 Sort-Object LastWriteTime -Descending | Select-Object -ExpandProperty FullName)
}
if (-not $LogPath) { throw "No scripting log found under $cetDir. Is CET installed and has the game run?" }

if (-not $LocationsPath) {
    $LocationsPath = Join-Path $cetDir 'mods\cetmonkey\locations.lua'
}

# --- parse ------------------------------------------------------------------
#
# Two shapes, both ending in a coordinate triple:
#   [NetSec] GAP device no-access-point at=-1490.28,2021.28,7.14
#   [NetSec] GAP people no-network      at=-1148.20,1571.90,73.40

$gapRe = [regex] '\[NetSec\]\s+GAP\s+(?<kind>device|people)\s+(?<reason>\S+)\s+at=(?<x>-?[\d.]+),(?<y>-?[\d.]+),(?<z>-?[\d.]+)'

$hits = New-Object System.Collections.Generic.List[object]
foreach ($lp in $LogPath) {
    if (-not (Test-Path -LiteralPath $lp)) { continue }
    foreach ($line in [System.IO.File]::ReadLines($lp)) {
        # Cheap reject first - these logs run to megabytes - but NOT with -like.
        # In a -like pattern "[NetSec]" is a CHARACTER CLASS, so it matches any
        # single one of those letters and the whole test silently means something
        # else. It reported zero hits against a log holding 1,534 of them.
        if (-not $line.Contains('[NetSec] GAP')) { continue }
        $m = $gapRe.Match($line)
        if (-not $m.Success) { continue }
        $hits.Add([pscustomobject]@{
            Kind = $m.Groups['kind'].Value
            X    = [double] $m.Groups['x'].Value
            Y    = [double] $m.Groups['y'].Value
            Z    = [double] $m.Groups['z'].Value
        })
    }
}

Write-Host ("logs read      : {0}" -f ($LogPath.Count))
Write-Host ("GAP lines found: {0}" -f $hits.Count)
if ($hits.Count -eq 0) {
    Write-Host ""
    Write-Host "Nothing to do. Either the world has no holes in it (unlikely), or"
    Write-Host "NetSec's Diagnostics -> 'Log decisions to the game log' is off."
    return
}

# --- cluster ----------------------------------------------------------------
#
# Single-pass greedy clustering against cluster CENTRES. Good enough and stable:
# the input is a few hundred points at most, and the answer only has to be
# "roughly here", because where the access point actually goes is a judgement
# about the scene that no script can make.

$clusters = New-Object System.Collections.Generic.List[object]
foreach ($h in $hits) {
    $placed = $false
    foreach ($c in $clusters) {
        $dx = $c.X - $h.X; $dy = $c.Y - $h.Y; $dz = $c.Z - $h.Z
        if ([math]::Sqrt($dx*$dx + $dy*$dy + $dz*$dz) -le $ClusterRadius) {
            $c.N++
            if ($h.Kind -eq 'device') { $c.Devices++ } else { $c.People++ }
            # Running mean, so the centre drifts toward the bulk of the hits
            # rather than sticking wherever the first one happened to land.
            $c.X += ($h.X - $c.X) / $c.N
            $c.Y += ($h.Y - $c.Y) / $c.N
            $c.Z += ($h.Z - $c.Z) / $c.N
            $placed = $true
            break
        }
    }
    if (-not $placed) {
        $clusters.Add([pscustomobject]@{
            X = $h.X; Y = $h.Y; Z = $h.Z; N = 1
            Devices = [int]($h.Kind -eq 'device')
            People  = [int]($h.Kind -eq 'people')
        })
    }
}

$kept = @($clusters | Where-Object { $_.N -ge $MinHits } | Sort-Object -Property N -Descending)
Write-Host ("clusters       : {0} ({1} with {2}+ hits)" -f $clusters.Count, $kept.Count, $MinHits)
Write-Host ""

if ($kept.Count -eq 0) {
    Write-Host "No cluster reached -MinHits $MinHits. Lower it, or play more with logging on."
    return
}

$rows = @()
$i = 0
foreach ($c in $kept) {
    $i++
    $what = if ($c.People -gt 0 -and $c.Devices -gt 0) { "{0} dev, {1} ppl" -f $c.Devices, $c.People }
            elseif ($c.People -gt 0)                   { "{0} ppl" -f $c.People }
            else                                        { "{0} dev" -f $c.Devices }
    $name = '{0} {1:d2} ({2})' -f $Prefix, $i, $what
    $rows += [pscustomobject]@{ Name = $name; X = $c.X; Y = $c.Y; Z = $c.Z }
    Write-Host ("  {0,-34} {1,10:N1} {2,10:N1} {3,8:N1}" -f $name, $c.X, $c.Y, $c.Z)
}

if (-not $Write) {
    Write-Host ""
    Write-Host "Nothing written. Re-run with -Write to merge these into:"
    Write-Host "  $LocationsPath"
    return
}

# --- merge ------------------------------------------------------------------
#
# Read what is there, drop only our own previous rows, keep everybody else's
# exactly as written. AMM owns that file's contents by its own header, and this
# is a guest in it.

$existing = @()
if (Test-Path -LiteralPath $LocationsPath) {
    $rowRe = [regex] '\{\s*name\s*=\s*"(?<n>(?:[^"\\]|\\.)*)"\s*,(?<rest>[^}]*)\}'
    foreach ($m in $rowRe.Matches((Get-Content -LiteralPath $LocationsPath -Raw))) {
        if ($m.Groups['n'].Value.StartsWith($Prefix)) { continue }
        $existing += ('  {{name="{0}",{1}}},' -f $m.Groups['n'].Value, $m.Groups['rest'].Value.TrimEnd())
    }
}

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('-- locations.lua -- generated from AMM''s User\Locations folder.')
[void]$sb.AppendLine('-- Regenerate rather than hand-edit; AMM owns the source of truth.')
[void]$sb.AppendLine(('-- {0} rows added by cyberwise-netsec New-GapWaypoints.ps1; re-running replaces them.' -f $Prefix))
[void]$sb.AppendLine('return {')
foreach ($line in $existing) { [void]$sb.AppendLine($line) }
foreach ($r in $rows) {
    [void]$sb.AppendLine(('  {{name="{0}", x={1:R}, y={2:R}, z={3:R}, w=1, yaw=0}},' -f $r.Name, $r.X, $r.Y, $r.Z))
}
[void]$sb.AppendLine('}')
$text = $sb.ToString()

# Snapshot and show the diff before touching anything in the install, which is
# the family rule and the only reason this is safe to run twice.
$backup = Join-Path $PSScriptRoot '..\..\cyberwise\tools\ModFileBackup.ps1'
if (Test-Path -LiteralPath $backup) {
    . $backup
    Set-ModFileContent -Path $LocationsPath -NewText $text -Note 'cyberwise-netsec gap waypoints'
} else {
    if (Test-Path -LiteralPath $LocationsPath) {
        Copy-Item -LiteralPath $LocationsPath -Destination "$LocationsPath.bak" -Force
        Write-Host "backed up to $LocationsPath.bak"
    }
    Set-Content -LiteralPath $LocationsPath -Value $text -Encoding UTF8
}

Write-Host ""
Write-Host ("wrote {0} waypoint(s), kept {1} existing row(s)" -f $rows.Count, $existing.Count)
Write-Host "Reload all mods in CET (or restart) and filter the Teleport list for '$Prefix'."
