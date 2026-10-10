# Find-QuestConflicts.ps1 -- which mods touch a quest, and which of them win.
#
#     .\Find-QuestConflicts.ps1 -Quest sq026 -GameRoot '<path>'
#     .\Find-QuestConflicts.ps1 -Quest 'q101' -GameRoot '<path>' -All
#
# WHAT THIS IS AND IS NOT
#
# It is NOT softlock detection, and nothing here should be sold as that. A quest
# that is stuck and a quest that is legitimately waiting look identical from
# outside - plenty of them wait on in-game days, on a phone call the player has
# not taken, or on a fact only set somewhere else. The same reason automated hang
# detection does not work (references/bisecting.md) applies with more force here,
# because "waiting" is the normal state of most of the journal.
#
# What it does is answer the question you have once you ARE stuck: **which mods
# rewrote this quest, and which of them is actually winning?** That is answerable
# exactly, from disk, offline.
#
# The interesting output is a CONTESTED resource - one that two or more mods each
# replace. Under earlier-wins only one of them is in the game, and the other's
# quest edits are silently absent. Two mods that each patch a quest phase are not
# additive: the loser might as well not be installed, and its author's fix for
# the bug you are hitting may be the half that lost.
#
# Needs the vendored resource-path table to know what a quest's files are called.

[CmdletBinding()]
param(
    # Quest id or a fragment of its path: sq026, q101, 'clouds', 'mq055'.
    [Parameter(Mandatory)] [string] $Quest,

    [Parameter(Mandatory)] [string] $GameRoot,

    # Defaults to the game's own archive folder.
    [string] $ModDir,

    # Also list resources only one mod replaces. Off by default: one mod owning
    # a quest file is ordinary, and burying the contested ones in that list is
    # how the real finding gets missed.
    [switch] $All
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$ErrorActionPreference = 'Stop'

if (-not $ModDir) { $ModDir = Join-Path $GameRoot 'archive\pc\mod' }
if (-not (Test-Path -LiteralPath $ModDir)) { throw "No archive folder at $ModDir" }

. (Join-Path $PSScriptRoot 'Resolve-ResourcePath.ps1')

# Reuse the archive index reader rather than a second copy of the RDAR parsing.
$repair = Join-Path $PSScriptRoot 'Repair-LoadOrder.ps1'
$ast = [System.Management.Automation.Language.Parser]::ParseFile($repair, [ref]$null, [ref]$null)
foreach ($f in $ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] }, $true)) {
    if ($f.Name -match 'Get-ArchiveHashes|Read-') { Invoke-Expression $f.Extent.Text }
}

Write-Host ''
Write-Host "QUEST: $Quest" -ForegroundColor Cyan

# Quest logic lives across several resource kinds and a mod can break the quest
# by replacing any of them: the phase graph, a scene, or an entity the phase
# spawns and then waits for.
$patterns = @("*\$Quest\*", "*$Quest*")
$wanted = @{}
foreach ($pat in $patterns) {
    foreach ($r in (Find-ResourcePath -Like $pat)) {
        if ($r.Path -match '\.(quest|questphase|scene|ent|journal)$') { $wanted[$r.Hash] = $r.Path }
    }
    if ($wanted.Count) { break }
}
if (-not $wanted.Count) {
    Write-Host "  no base-game quest resources match '$Quest'." -ForegroundColor Yellow
    Write-Host "  Try a quest id (sq026, q101, mq055) or a location word that appears in the paths." -ForegroundColor DarkGray
    exit 1
}
Write-Host "  $($wanted.Count) base-game resource(s) belong to it" -ForegroundColor DarkGray

# Load order decides the winner, so it has to be read the same way the game does.
$listPath = Join-Path $ModDir 'modlist.txt'
$order = @{}
if (Test-Path -LiteralPath $listPath) {
    $i = 0
    foreach ($line in (Get-Content -LiteralPath $listPath)) {
        if ($line.Trim()) { $order[$line.Trim()] = $i; $i++ }
    }
}
$rankOf = { param($n) if ($order.ContainsKey($n)) { $order[$n] } else { [int]::MaxValue } }

$byResource = @{}
foreach ($f in (Get-ChildItem -LiteralPath $ModDir -Filter *.archive)) {
    $hs = Get-ArchiveHashes $f.FullName
    if (-not $hs) { continue }
    foreach ($h in $hs) {
        if (-not $wanted.ContainsKey($h)) { continue }
        if (-not $byResource.ContainsKey($h)) { $byResource[$h] = New-Object 'System.Collections.Generic.List[string]' }
        $byResource[$h].Add($f.Name)
    }
}

if (-not $byResource.Count) {
    Write-Host ''
    Write-Host "  No mod on this install replaces any of its resources." -ForegroundColor Green
    Write-Host "  Whatever is wrong, an archive is not rewriting this quest. Check .xl quest" -ForegroundColor DarkGray
    Write-Host "  intercepts and .reds hooks next - both change quests without owning a file." -ForegroundColor DarkGray
    exit 0
}

$contested = @($byResource.Keys | Where-Object { $byResource[$_].Count -gt 1 })
$single    = @($byResource.Keys | Where-Object { $byResource[$_].Count -eq 1 })

if ($contested.Count) {
    Write-Host ''
    Write-Host "  CONTESTED - two or more mods replace the same file, so only one is live:" -ForegroundColor Red
    foreach ($h in $contested) {
        Write-Host "    $($wanted[$h])" -ForegroundColor Yellow
        $ranked = $byResource[$h] | Sort-Object { & $rankOf $_ }
        $first = $true
        foreach ($m in $ranked) {
            $pos = if ($order.ContainsKey($m)) { $order[$m] + 1 } else { 'UNLISTED' }
            if ($first) { Write-Host "      WINS   $m (line $pos)" -ForegroundColor Green; $first = $false }
            else        { Write-Host "      loses  $m (line $pos) - its version of this file is not in the game" -ForegroundColor DarkRed }
        }
    }
}

if ($single.Count) {
    Write-Host ''
    Write-Host "  $($single.Count) resource(s) replaced by exactly one mod$(if (-not $All) { ' - -All to list them' })" -ForegroundColor DarkGray
    if ($All) {
        foreach ($h in $single) {
            Write-Host "    $($wanted[$h])" -ForegroundColor DarkGray
            Write-Host "      $($byResource[$h][0])" -ForegroundColor DarkGray
        }
    }
}

Write-Host ''
Write-Host "  This names what rewrote the quest. It does not prove any of it is the fault -" -ForegroundColor DarkGray
Write-Host "  a mod can own a quest file and be entirely correct. Park the winner of a" -ForegroundColor DarkGray
Write-Host "  contested file and reload an earlier save to test one." -ForegroundColor DarkGray
exit 0
