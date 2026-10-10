# New-InstallSnapshot.ps1 -- record what the install looks like right now.
#
#     .\New-InstallSnapshot.ps1                      # snapshot, auto-detect the game
#     .\New-InstallSnapshot.ps1 -Label 'before DF update'
#     .\New-InstallSnapshot.ps1 -List                # what snapshots exist
#
# WHY THIS EXISTS
#
# The first question in any crash or "it stopped working" investigation is **what
# changed** - and it is the question nobody can answer. The user remembers
# installing "a couple of things"; the manager records install dates but not what
# was already there; and by the time the symptom appears the previous state is
# gone. So the investigation defaults to bisecting hundreds of mods, which costs
# an evening of load screens to rediscover something a diff would have named in
# seconds.
#
# A snapshot is cheap - a few hundred KB and about a second - and it turns
# "somewhere in 700 mods" into "these three moved since Tuesday".
#
# WHAT IT DELIBERATELY DOES NOT DO
#
# It does not hash archive contents. Hashing ~700 archives means reading tens of
# gigabytes, which turns a one-second habit into a two-minute chore that nobody
# runs. Name, size and write time catch every change that matters here - a mod
# updated, added, removed, or re-deployed - without the I/O. Loose script and
# tweak files ARE small, so those get sized and timed too.
#
# Snapshots live with the other install records:
#   %USERPROFILE%\Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\snapshots\

[CmdletBinding()]
param(
    [string] $GameRoot,
    [string] $Label,
    [switch] $List,
    # Keep this many, newest first. Old ones are pruned automatically: the value
    # of a snapshot is highest when recent, and unbounded growth in someone's
    # save folder is its own small betrayal.
    [int]    $Keep = 30
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$ErrorActionPreference = 'Stop'

function Get-SnapshotDir {
    $d = Join-Path $env:USERPROFILE 'Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\snapshots'
    if (-not (Test-Path -LiteralPath $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
    $d
}

if ($List) {
    Get-ChildItem (Get-SnapshotDir) -Filter '*.json' | Sort-Object Name -Descending | ForEach-Object {
        $j = Get-Content -LiteralPath $_.FullName -Raw | ConvertFrom-Json
        '{0,-22} {1,5} archives  {2,5} loose  {3}' -f $_.BaseName, $j.Counts.Archives, $j.Counts.Loose, $j.Label
    }
    return
}

# ------------------------------------------------------------------- locate --

if (-not $GameRoot) {
    $seen = New-Object System.Collections.Generic.List[string]
    try {
        $steam = (Get-ItemProperty 'HKLM:\SOFTWARE\WOW6432Node\Valve\Steam' -ErrorAction SilentlyContinue).InstallPath
        if ($steam) {
            $seen.Add((Join-Path $steam 'steamapps\common\Cyberpunk 2077'))
            $vdf = Join-Path $steam 'steamapps\libraryfolders.vdf'
            if (Test-Path -LiteralPath $vdf) {
                foreach ($m in [regex]::Matches((Get-Content -LiteralPath $vdf -Raw), '"path"\s+"([^"]+)"')) {
                    $seen.Add((Join-Path ($m.Groups[1].Value -replace '\\\\','\') 'steamapps\common\Cyberpunk 2077'))
                }
            }
        }
    } catch {}
    foreach ($k in 'HKLM:\SOFTWARE\WOW6432Node\GOG.com\Games\1423049311','HKLM:\SOFTWARE\GOG.com\Games\1423049311') {
        try { $g = (Get-ItemProperty $k -ErrorAction SilentlyContinue).path; if ($g) { $seen.Add($g) } } catch {}
    }
    foreach ($p in $seen) {
        if ($p -and (Test-Path -LiteralPath (Join-Path $p 'bin\x64\Cyberpunk2077.exe'))) { $GameRoot = $p; break }
    }
}
if (-not $GameRoot -or -not (Test-Path -LiteralPath (Join-Path $GameRoot 'bin\x64\Cyberpunk2077.exe'))) {
    throw "Could not find Cyberpunk 2077. Pass -GameRoot 'X:\path\to\Cyberpunk 2077'."
}

# -------------------------------------------------------------------- gather --

function Stamp([IO.FileSystemInfo]$f) { $f.LastWriteTimeUtc.ToString('yyyyMMddHHmmss') }

$archDir = Join-Path $GameRoot 'archive\pc\mod'
$archives = @()
if (Test-Path -LiteralPath $archDir) {
    $archives = Get-ChildItem -LiteralPath $archDir -Filter '*.archive' -File -ErrorAction SilentlyContinue |
        ForEach-Object { [pscustomobject]@{ n = $_.Name; s = $_.Length; t = (Stamp $_) } }
}

# The ORDER is a fact in its own right - a mod that merely moved changes which
# files it wins, with no file on disk changing at all.
$modlist = @()
$mlPath = Join-Path $archDir 'modlist.txt'
if (Test-Path -LiteralPath $mlPath) {
    $modlist = @(Get-Content -LiteralPath $mlPath | ForEach-Object { $_.Trim() } | Where-Object { $_ })
}

# Loose files: small enough to size and time individually, and where most
# silent breakage lives (scripts, tweaks, CET mods, plugins).
$loose = @()
foreach ($rel in 'r6\scripts', 'r6\tweaks', 'bin\x64\plugins', 'red4ext\plugins', 'r6\input', 'mods') {
    $p = Join-Path $GameRoot $rel
    if (-not (Test-Path -LiteralPath $p)) { continue }
    $loose += Get-ChildItem -LiteralPath $p -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Extension -in '.reds', '.yaml', '.yml', '.lua', '.xl', '.asi', '.dll', '.xml', '.json' } |
        ForEach-Object { [pscustomobject]@{ n = $_.FullName.Substring($GameRoot.Length).TrimStart('\'); s = $_.Length; t = (Stamp $_) } }
}

# Framework versions, because "it broke after an update" is often theirs, not a mod's.
$frameworks = @{}
foreach ($fw in @(
    @{ n = 'RED4ext';  p = 'red4ext\RED4ext.dll' }
    @{ n = 'CET';      p = 'bin\x64\plugins\cyber_engine_tweaks.asi' }
    @{ n = 'redscript';p = 'engine\tools\scc.exe' }
    @{ n = 'ArchiveXL';p = 'red4ext\plugins\ArchiveXL\ArchiveXL.dll' }
    @{ n = 'TweakXL';  p = 'red4ext\plugins\TweakXL\TweakXL.dll' }
    @{ n = 'Codeware'; p = 'red4ext\plugins\Codeware\Codeware.dll' }
)) {
    $f = Join-Path $GameRoot $fw.p
    if (Test-Path -LiteralPath $f) {
        $i = Get-Item -LiteralPath $f
        $frameworks[$fw.n] = "$($i.Length)/$(Stamp $i)"
    }
}

$snapshot = [pscustomobject]@{
    TakenUtc    = (Get-Date).ToUniversalTime().ToString('s') + 'Z'
    Label       = $Label
    GameRoot    = $GameRoot
    GameVersion = (Get-Item -LiteralPath (Join-Path $GameRoot 'bin\x64\Cyberpunk2077.exe')).VersionInfo.ProductVersion
    Frameworks  = $frameworks
    Modlist     = $modlist
    Archives    = $archives
    Loose       = $loose
    Counts      = [pscustomobject]@{ Archives = $archives.Count; Loose = $loose.Count; Modlist = $modlist.Count }
}

$dir  = Get-SnapshotDir
$name = (Get-Date).ToString('yyyyMMdd-HHmmss') + '.json'
$out  = Join-Path $dir $name
$snapshot | ConvertTo-Json -Depth 6 -Compress | Set-Content -LiteralPath $out -Encoding UTF8

# Prune oldest beyond -Keep.
$all = Get-ChildItem $dir -Filter '*.json' | Sort-Object Name -Descending
if ($all.Count -gt $Keep) { $all | Select-Object -Skip $Keep | Remove-Item -Force }

Write-Host ("snapshot {0}  -  {1} archives, {2} loose files, {3} modlist entries  ({4} KB)" -f
    [IO.Path]::GetFileNameWithoutExtension($name), $archives.Count, $loose.Count, $modlist.Count,
    [math]::Round((Get-Item $out).Length / 1KB)) -ForegroundColor Green
if ($Label) { Write-Host "  label: $Label" -ForegroundColor DarkGray }
Write-Host "  compare with: .\Compare-InstallSnapshot.ps1" -ForegroundColor DarkGray
