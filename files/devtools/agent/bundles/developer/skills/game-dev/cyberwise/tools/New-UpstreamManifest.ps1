# New-UpstreamManifest.ps1 -- declare what upstream looks like, right now.
#
#     .\New-UpstreamManifest.ps1              # show what would change, write nothing
#     .\New-UpstreamManifest.ps1 -Write       # rewrite skills\cyberwise\upstream.manifest
#
# WHY THIS IS A SEPARATE SCRIPT FROM THE CHECK
#
# Because a guard that can also regenerate is not a guard. If `Test-Upstream.ps1`
# had a `-Fix`, the first thing any agent would do on seeing a finding is run it,
# and the manifest would silently bless whatever was already there - including
# the edit nobody meant to keep. The two actions are opposite in intent and they
# are kept in opposite files so that blessing a change is always something a
# person chose to do.
#
# WHEN TO RUN IT
#
#   YES - you are working ON Cyberwise and the change you just made IS the new
#         upstream. Regenerate before shipping, the way you rerun
#         Get-ToolIndex.ps1 -Write after adding a tool.
#
#   NO  - you are changing a shipped file to suit THIS install. That is a local
#         customization and it goes in the register, where an update can find it
#         again afterwards:
#
#             . .\UpstreamGuard.ps1
#             Register-CwChange -File '<path>' -What '<what>' -Why '<why>' -ApprovedBy '<who>'
#
#         Regenerating instead would erase the only evidence the change exists,
#         and the next `git pull` would take it away with nothing to notice.

[CmdletBinding()]
param(
    # Repo root. Defaults to three levels above this script.
    [string] $Root,
    # Write the file. Without this, nothing is written and the diff is printed -
    # the default is deliberately the harmless one.
    [switch] $Write,
    [string] $ManifestPath
)

$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'UpstreamGuard.ps1')

$loc = Resolve-CwGuardRoot -Root $Root
if (-not $loc) { Write-Host "no skills\ directory found - run this from a Cyberwise checkout, or pass -Root" -ForegroundColor Red; exit 2 }
if ($loc.Scope -ne 'repo') {
    Write-Host "this looks like an INSTALLED copy: no install.ps1 or tests\ above $($loc.SkillsRoot)." -ForegroundColor Red
    Write-Host "Regenerate the manifest in the repo, where the whole guarded set exists - otherwise tests\ and install.ps1 would silently drop out of it." -ForegroundColor DarkGray
    exit 2
}

if (-not $ManifestPath) { $ManifestPath = Get-CwManifestPath -Root $Root }

# What the manifest says now, so the write can be reported as a diff rather than
# as a number. "wrote 61 files" tells nobody whether the right thing happened.
$before = Read-CwManifest -Path $ManifestPath -Root $Root
$files  = Get-CwGuardedFile -Root $Root

$now = @{}
foreach ($f in $files) { $now[$f.Path] = (Get-CwContentHash -Path $f.FullName).Sha }

$added = @(); $removed = @(); $changed = @()
if ($before) {
    foreach ($p in ($now.Keys | Sort-Object))            { if (-not $before.Entries.ContainsKey($p)) { $added += $p } }
    foreach ($p in ($before.Entries.Keys | Sort-Object)) { if (-not $now.ContainsKey($p))            { $removed += $p } }
    foreach ($p in ($now.Keys | Sort-Object)) {
        if ($before.Entries.ContainsKey($p) -and $before.Entries[$p].Sha -ne $now[$p]) { $changed += $p }
    }
} else {
    $added = @($now.Keys | Sort-Object)
}

Write-Host "guarded set: $($files.Count) file(s) under $($loc.Root)" -ForegroundColor Cyan
if (-not $before) { Write-Host "  no manifest yet at $ManifestPath" -ForegroundColor DarkGray }
foreach ($p in $changed) { Write-Host "  changed  $p" -ForegroundColor Yellow }
foreach ($p in $added)   { Write-Host "  added    $p" -ForegroundColor Green }
foreach ($p in $removed) { Write-Host "  removed  $p" -ForegroundColor DarkGray }
if (-not ($changed.Count + $added.Count + $removed.Count)) {
    Write-Host '  manifest already matches what is on disk' -ForegroundColor DarkGreen
}

if (-not $Write) {
    Write-Host ''
    Write-Host 'nothing written. -Write to make this the new upstream.' -ForegroundColor DarkGray
    # Say the other half out loud, every time, because this is the exact moment
    # somebody blesses a customization by accident.
    if ($changed.Count) {
        Write-Host 'If any of those changes belong to THIS install rather than to Cyberwise, register them instead:' -ForegroundColor DarkGray
        Write-Host "  . `$PSScriptRoot\UpstreamGuard.ps1; Register-CwChange -File '<path>' -What '<what>' -Why '<why>' -ApprovedBy '<who>'" -ForegroundColor DarkGray
    }
    exit 0
}

$res = Write-CwManifest -Root $Root -Path $ManifestPath
Write-Host ''
Write-Host "wrote $($res.Count) file(s) into $($res.Path)" -ForegroundColor Green
exit 0
