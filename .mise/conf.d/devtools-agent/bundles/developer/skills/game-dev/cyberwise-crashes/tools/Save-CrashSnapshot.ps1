# Save-CrashSnapshot.ps1 -- preserve what a relaunch destroys, then state the facts.
#
#     .\Save-CrashSnapshot.ps1 -GameRoot '<path>'
#     .\Save-CrashSnapshot.ps1 -GameRoot '<path>' -Note 'corpo intro, near Jenkins office'
#
# STEP ZERO OF EVERY CRASH. RUN IT BEFORE ANYTHING ELSE, INCLUDING THINKING.
#
# The moment somebody relaunches, the evidence is gone:
#
#   CrashInfo.json           overwritten by the NEXT crash
#   redscript_rCURRENT.log   replaced at every launch
#   scripting.log            CET truncates and rotates it
#   gamelog.log              same
#   cyber_engine_tweaks.log  appended, but rotates at a size cap
#
# On 2026-08-23 a crash was investigated 20 minutes after it happened. By then
# the game had been relaunched and every log above had already been rewritten.
# The only survivor was CrashInfo.json, and only because the crash watcher had
# copied it - which is one artefact out of five.
#
# WHAT IT DOES NOT DO
#
# It does not analyse. Gathering and diagnosing in one step is how a first guess
# becomes the frame for everything after it. This writes a folder and prints the
# bare facts, and the next step is a QUESTION FOR THE USER, not a theory:
#
#   "What quest was active, and what were you doing when it crashed?"
#
# That question costs one message and routinely collapses the search space more
# than an hour of tooling. Ask it before analysing, every time.

[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string] $GameRoot,

    # Where snapshots go. Defaults beside the family's other records.
    [string] $OutRoot = (Join-Path $env:USERPROFILE 'Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\crash-snapshots'),

    # Anything the user said about what they were doing. Recorded verbatim - it
    # is usually the most valuable line in the folder.
    [string] $Note
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $GameRoot)) { throw "no such game root: $GameRoot" }

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$dest  = Join-Path $OutRoot $stamp
New-Item -ItemType Directory -Path $dest -Force | Out-Null

# --- the volatile set -------------------------------------------------------
$artifacts = @(
    @{ Name = 'CrashInfo.json';         Path = (Join-Path $env:LOCALAPPDATA 'CD Projekt Red\Cyberpunk 2077\CrashInfo.json') }
    @{ Name = 'redscript_rCURRENT.log'; Path = (Join-Path $GameRoot 'r6\logs\redscript_rCURRENT.log') }
    @{ Name = 'scripting.log';          Path = (Join-Path $GameRoot 'bin\x64\plugins\cyber_engine_tweaks\scripting.log') }
    @{ Name = 'gamelog.log';            Path = (Join-Path $GameRoot 'bin\x64\plugins\cyber_engine_tweaks\gamelog.log') }
    @{ Name = 'cyber_engine_tweaks.log'; Path = (Join-Path $GameRoot 'bin\x64\plugins\cyber_engine_tweaks\cyber_engine_tweaks.log') }
    @{ Name = 'red4ext.log';            Path = (Join-Path $GameRoot 'red4ext\logs\red4ext.log') }
)

$saved = 0; $stale = @()
foreach ($a in $artifacts) {
    if (-not (Test-Path -LiteralPath $a.Path)) { continue }
    $f = Get-Item -LiteralPath $a.Path
    Copy-Item -LiteralPath $a.Path -Destination (Join-Path $dest $a.Name) -Force
    $saved++
    # A log written well after the crash has already been overwritten by a
    # relaunch. Copy it anyway - but say so, because treating a fresh log as
    # crash evidence is worse than having no log.
    $ageMin = [math]::Round(((Get-Date) - $f.LastWriteTime).TotalMinutes, 1)
    if ($ageMin -lt 0.5) { $stale += "$($a.Name) (written $ageMin min ago - probably from a LATER launch)" }
}

# the newest crash-watcher session, which holds the telemetry run up to death
$cwDir = Join-Path $GameRoot '_crashwatch'
if (Test-Path -LiteralPath $cwDir) {
    $csv = Get-ChildItem $cwDir -Filter 'session-*.csv' -ErrorAction SilentlyContinue |
           Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($csv) { Copy-Item -LiteralPath $csv.FullName -Destination (Join-Path $dest $csv.Name) -Force; $saved++ }
}

# --- what is ACTUALLY deployed ----------------------------------------------
#
# From disk, never from a manager's list, a manifest, or memory. A suspect list
# that names an uninstalled mod discredits every other name in it.
$layouts = @{
    'archive'   = 'archive\pc\mod';  'REDmod' = 'mods'
    'CET'       = 'bin\x64\plugins\cyber_engine_tweaks\mods'
    'RED4ext'   = 'red4ext\plugins'; 'redscript' = 'r6\scripts'
    'tweak'     = 'r6\tweaks';       'input'     = 'r6\input'
}
$lines = @("# deployed at $stamp - read from disk, not from any manager")
foreach ($k in ($layouts.Keys | Sort-Object)) {
    $d = Join-Path $GameRoot $layouts[$k]
    if (-not (Test-Path -LiteralPath $d)) { continue }
    foreach ($i in (Get-ChildItem -LiteralPath $d -ErrorAction SilentlyContinue | Sort-Object Name)) {
        $lines += "{0,-10} {1}" -f $k, $i.Name
    }
}
# `-Encoding utf8NoBOM` DOES NOT EXIST on Windows PowerShell 5.1 and throws
# there; `-Encoding UTF8` means *with* a BOM on 5.1, which is how three
# invisible bytes end up in front of `---` and stop a front-matter parser. Write
# through an explicit no-BOM encoder instead. The path is made absolute first
# because [System.IO.File] resolves a relative path against .NET's own current
# directory, which is not PowerShell's.
$noBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines((Join-Path $dest 'deployed.txt'), [string[]] $lines, $noBom)

if ($Note) { [System.IO.File]::WriteAllText((Join-Path $dest 'note.txt'), "user said: $Note`r`n", $noBom) }

# --- the bare facts, and nothing more ---------------------------------------
Write-Host "snapshot: $dest" -ForegroundColor Green
Write-Host "  $saved artefact(s) preserved, $($lines.Count - 1) deployed item(s) recorded" -ForegroundColor DarkGray
foreach ($s in $stale) { Write-Host "  WARNING: $s" -ForegroundColor Yellow }
Write-Host ''

$ci = Join-Path $dest 'CrashInfo.json'
if (Test-Path -LiteralPath $ci) {
    $pm = (Get-Content -LiteralPath $ci -Raw | ConvertFrom-Json).Data.postMortem
    if ($pm) {
        Write-Host 'crash reporter says:' -ForegroundColor Cyan
        foreach ($f in 'timeCrash','district','isOom','sessionLength','crashPatch') {
            if ($null -ne $pm.$f) { Write-Host ("  {0,-14} {1}" -f $f, $pm.$f) }
        }
        if ($pm.location) { Write-Host ("  {0,-14} ({1:N0}, {2:N0}, {3:N0})" -f 'location', $pm.location.X, $pm.location.Y, $pm.location.Z) }
        if ($pm.trackedQuest -and $pm.trackedQuest.name) {
            Write-Host ("  {0,-14} {1} / {2}" -f 'trackedQuest', $pm.trackedQuest.name, $pm.trackedQuest.objectiveName)
        }
    }
}

Write-Host ''
Write-Host 'NEXT STEP IS A QUESTION, NOT A THEORY:' -ForegroundColor Yellow
Write-Host '  "What quest was active, and what were you doing when it crashed?"' -ForegroundColor Yellow
Write-Host '  Ask it before analysing. It routinely collapses the search space more than' -ForegroundColor DarkGray
Write-Host '  an hour of tooling does, and the crash reporter only knows the tracked quest -' -ForegroundColor DarkGray
Write-Host '  not what the player was actually doing.' -ForegroundColor DarkGray
exit 0
