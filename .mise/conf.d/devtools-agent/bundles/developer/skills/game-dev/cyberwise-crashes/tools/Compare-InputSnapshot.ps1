# ============================================================================
# Compare-InputSnapshot.ps1 -- diff two input snapshots
# ============================================================================
#
# The point of the pair is a single question: is that ghost node NEW, or has it
# always been there? Without a known-good snapshot that question has no answer,
# and on 2026-08-26 an hour was spent arguing about a node nobody could date.
#
# Take one while the overlay works (-Label working), one while it is broken
# (-Label broken), and run this. Newest two by default.
# ============================================================================

param(
    [string] $Dir,
    [string] $A,
    [string] $B
)

$ErrorActionPreference = 'Stop'

$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }

if (-not $Dir) { $Dir = Join-Path $env:USERPROFILE 'Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\input' }
if (-not (Test-Path -LiteralPath $Dir)) { throw "No input snapshots at $Dir - run New-InputSnapshot.ps1 first." }
$Dir = (Resolve-Path -LiteralPath $Dir).Path

$files = Get-ChildItem $Dir -Filter '*.json' | Sort-Object Name -Descending
if ($files.Count -lt 2 -and -not ($A -and $B)) {
    throw "Need two snapshots to compare; found $($files.Count). Take one while the overlay WORKS."
}

function Load { param([string] $p) return (Get-Content $p -Raw | ConvertFrom-Json) }

if ($A -and $B) {
    $older = Load $A; $newer = Load $B
    $an = Split-Path $A -Leaf; $bn = Split-Path $B -Leaf
} else {
    $newer = Load $files[0].FullName; $older = Load $files[1].FullName
    $bn = $files[0].BaseName; $an = $files[1].BaseName
}

'comparing {0} ({1})  ->  {2} ({3})' -f $an, $older.label, $bn, $newer.label
''

function KeyOf { param($n) return ('{0}|{1}' -f $n.instanceId, $n.status) }

$oldMap = @{}; foreach ($n in @($older.keyboards) + @($older.mice)) { $oldMap[$n.instanceId] = $n }
$newMap = @{}; foreach ($n in @($newer.keyboards) + @($newer.mice)) { $newMap[$n.instanceId] = $n }

$changed = $false

'--- devices that APPEARED ---'
foreach ($k in $newMap.Keys) {
    if (-not $oldMap.ContainsKey($k)) { $changed = $true; '  + {0,-9} {1,-36} {2}' -f $newMap[$k].status, $newMap[$k].name, $k }
}
'--- devices that VANISHED ---'
foreach ($k in $oldMap.Keys) {
    if (-not $newMap.ContainsKey($k)) { $changed = $true; '  - {0,-9} {1,-36} {2}' -f $oldMap[$k].status, $oldMap[$k].name, $k }
}
'--- devices whose STATUS changed (this is the interesting one) ---'
foreach ($k in $newMap.Keys) {
    if ($oldMap.ContainsKey($k) -and $oldMap[$k].status -ne $newMap[$k].status) {
        $changed = $true
        '  ~ {0,-36} {1} -> {2}   {3}' -f $newMap[$k].name, $oldMap[$k].status, $newMap[$k].status, $k
    }
}
if (-not $changed) { '  (no device-level change at all - the input stack is IDENTICAL in both states)' }
''

'--- ghost/not-OK counts ---'
'  {0}: {1}      {2}: {3}' -f $an, $older.ghostCount, $bn, $newer.ghostCount
if ($older.ghostCount -eq $newer.ghostCount) {
    '  SAME ghost count in both. A ghost present in the WORKING snapshot is not the fault.'
}
''

'--- CET overlay bind ---'
'  {0}: slots {1} ({2})' -f $an, ($older.cetOverlayKey.slots -join ','), $older.cetOverlayKey.note
'  {0}: slots {1} ({2})' -f $bn, ($newer.cetOverlayKey.slots -join ','), $newer.cetOverlayKey.note
''
'--- keys held at capture ---'
'  {0}: {1}' -f $an, $(if ($older.keysHeldNow.Count) { $older.keysHeldNow -join ',' } else { 'none' })
'  {0}: {1}' -f $bn, $(if ($newer.keysHeldNow.Count) { $newer.keysHeldNow -join ',' } else { 'none' })
''
'NOTE: a held-key sample only sees PHYSICAL key state. CET keeps its own copy'
'from window messages, and a stale copy there is invisible to this tool.'
