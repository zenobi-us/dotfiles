# Compare-InstallSnapshot.ps1 -- answer "what changed?"
#
#     .\Compare-InstallSnapshot.ps1                    # newest vs the one before
#     .\Compare-InstallSnapshot.ps1 -Since '20260810'  # newest vs the first on/after that
#     .\Compare-InstallSnapshot.ps1 -From a -To b
#     .\Compare-InstallSnapshot.ps1 -Full              # list every loose-file change
#
# WHY THIS MATTERS MORE THAN IT LOOKS
#
# "It worked yesterday" is the most common and least usable sentence in mod
# support, because nothing records yesterday. Without that, an investigation
# bisects hundreds of mods to rediscover a change the user could not recall - at
# Cyberpunk load times, an evening.
#
# With two snapshots the same question is a diff, and the answer is usually three
# lines long. **Read the diff before proposing a bisect.** Bisecting is what you
# do when you cannot narrow it any other way, not a ritual to start with.
#
# WHAT A CHANGE MEANS HERE
#
#   added / removed   a mod arrived or left
#   changed           same filename, different size or write time - an update, a
#                     redeploy, or somebody editing a file in place
#   MOVED             the file is identical but its position in modlist.txt
#                     changed, so it now wins or loses files it did not before.
#                     This one is invisible on disk and breaks things silently.

[CmdletBinding()]
param(
    [string] $From,
    [string] $To,
    [string] $Since,
    [switch] $Full,
    [int]    $MoveThreshold = 1
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$ErrorActionPreference = 'Stop'
$dir = Join-Path $env:USERPROFILE 'Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\snapshots'
if (-not (Test-Path -LiteralPath $dir)) { throw "no snapshots yet - run New-InstallSnapshot.ps1 first" }

$all = @(Get-ChildItem $dir -Filter '*.json' | Sort-Object Name)
if ($all.Count -lt 2 -and -not ($From -and $To)) {
    throw "need at least two snapshots to compare (have $($all.Count)). Run New-InstallSnapshot.ps1 again after a change."
}

function Resolve-Snap([string]$key, $default) {
    if (-not $key) { return $default }
    $hit = $all | Where-Object { $_.BaseName -like "$key*" } | Select-Object -First 1
    if (-not $hit) { throw "no snapshot matching '$key'. Available: $((($all | ForEach-Object BaseName) -join ', '))" }
    $hit
}

$toFile   = Resolve-Snap $To   $all[-1]
$fromFile = if ($Since) { Resolve-Snap $Since $all[0] } else { Resolve-Snap $From $all[-2] }

$a = Get-Content -LiteralPath $fromFile.FullName -Raw | ConvertFrom-Json
$b = Get-Content -LiteralPath $toFile.FullName   -Raw | ConvertFrom-Json

Write-Host ''
Write-Host "from  $($fromFile.BaseName)  $($a.Label)" -ForegroundColor DarkGray
Write-Host "to    $($toFile.BaseName)  $($b.Label)" -ForegroundColor DarkGray
Write-Host ''

$findings = 0

# ---------------------------------------------------------------- the game --

if ($a.GameVersion -ne $b.GameVersion) {
    Write-Host "GAME PATCH  $($a.GameVersion) -> $($b.GameVersion)" -ForegroundColor Yellow
    Write-Host "   Everything version-stamped is now suspect: script mods against the old" -ForegroundColor DarkGray
    Write-Host "   API, record IDs, save offsets. Suspect this before suspecting a mod." -ForegroundColor DarkGray
    $findings++
}

foreach ($k in ($a.Frameworks.PSObject.Properties.Name + $b.Frameworks.PSObject.Properties.Name | Sort-Object -Unique)) {
    $av = $a.Frameworks.$k; $bv = $b.Frameworks.$k
    if ($av -ne $bv) {
        $what = if (-not $av) { 'installed' } elseif (-not $bv) { 'REMOVED' } else { 'updated' }
        Write-Host "FRAMEWORK   $k $what" -ForegroundColor Yellow
        if ($what -eq 'REMOVED') { Write-Host "   Every mod depending on it is now inert, silently." -ForegroundColor DarkGray }
        $findings++
    }
}

# -------------------------------------------------------------- the mods ----

function Index($list) { $h = @{}; foreach ($x in $list) { $h[$x.n] = $x }; $h }
$ai = Index $a.Archives; $bi = Index $b.Archives

$added   = @($b.Archives | Where-Object { -not $ai.ContainsKey($_.n) })
$removed = @($a.Archives | Where-Object { -not $bi.ContainsKey($_.n) })
$changed = @($b.Archives | Where-Object { $ai.ContainsKey($_.n) -and ($ai[$_.n].s -ne $_.s -or $ai[$_.n].t -ne $_.t) })

foreach ($set in @(
    @{ n = 'ARCHIVE +'; items = $added;   c = 'Green';  why = '' }
    @{ n = 'ARCHIVE -'; items = $removed; c = 'Red';    why = '' }
    @{ n = 'ARCHIVE ~'; items = $changed; c = 'Yellow'; why = 'updated, redeployed, or edited in place' }
)) {
    if (-not $set.items.Count) { continue }
    Write-Host "$($set.n)  $($set.items.Count)" -ForegroundColor $set.c
    if ($set.why) { Write-Host "   $($set.why)" -ForegroundColor DarkGray }
    $set.items | Select-Object -First $(if ($Full) { 999 } else { 15 }) | ForEach-Object { Write-Host "     $($_.n)" }
    if (-not $Full -and $set.items.Count -gt 15) { Write-Host "     ... and $($set.items.Count - 15) more (-Full)" -ForegroundColor DarkGray }
    $findings += $set.items.Count
}

# ------------------------------------------------------------- the ORDER ----
#
# The change with no evidence on disk. A mod that merely moved wins and loses
# different files, and nothing about it looks different if you go and look at it.

$aPos = @{}; for ($i = 0; $i -lt $a.Modlist.Count; $i++) { $aPos[$a.Modlist[$i]] = $i }
$bPos = @{}; for ($i = 0; $i -lt $b.Modlist.Count; $i++) { $bPos[$b.Modlist[$i]] = $i }
$moved = foreach ($n in $b.Modlist) {
    if ($aPos.ContainsKey($n)) {
        $d = $bPos[$n] - $aPos[$n]
        if ([Math]::Abs($d) -gt $MoveThreshold) { [pscustomobject]@{ n = $n; from = $aPos[$n]; to = $bPos[$n]; d = $d } }
    }
}
$moved = @($moved)
if ($moved.Count) {
    Write-Host "LOAD ORDER  $($moved.Count) entr(ies) moved" -ForegroundColor Yellow
    Write-Host "   Earlier wins. A mod that moved now beats - or loses to - things it did not." -ForegroundColor DarkGray
    $moved | Sort-Object { -[Math]::Abs($_.d) } | Select-Object -First $(if ($Full) { 999 } else { 12 }) |
        ForEach-Object {
            # '+5' is not valid alignment syntax - sign the number ourselves. The
            # direction is the point: a negative delta moved EARLIER, so it now
            # wins files it previously lost.
            $delta = if ($_.d -gt 0) { "+$($_.d)" } else { "$($_.d)" }
            Write-Host ("     {0,5}  {1,4} -> {2,-5} {3}" -f $delta, $_.from, $_.to, $_.n)
        }
    if (-not $Full -and $moved.Count -gt 12) { Write-Host "     ... and $($moved.Count - 12) more (-Full)" -ForegroundColor DarkGray }
    $findings += $moved.Count
}

# ------------------------------------------------------------ loose files ---

$al = Index $a.Loose; $bl = Index $b.Loose
$lAdded   = @($b.Loose | Where-Object { -not $al.ContainsKey($_.n) })
$lRemoved = @($a.Loose | Where-Object { -not $bl.ContainsKey($_.n) })
$lChanged = @($b.Loose | Where-Object { $al.ContainsKey($_.n) -and ($al[$_.n].s -ne $_.s -or $al[$_.n].t -ne $_.t) })

if ($lAdded.Count -or $lRemoved.Count -or $lChanged.Count) {
    Write-Host "LOOSE FILES  +$($lAdded.Count) / -$($lRemoved.Count) / ~$($lChanged.Count)" -ForegroundColor Yellow
    # Group by mod folder: 400 changed files under one mod is one event, not 400.
    $byMod = @($lAdded + $lRemoved + $lChanged) | ForEach-Object {
        $parts = $_.n -split '\\'
        if ($parts.Count -ge 3) { ($parts[0..2]) -join '\' } else { $_.n }
    } | Group-Object | Sort-Object Count -Descending
    $byMod | Select-Object -First $(if ($Full) { 999 } else { 12 }) |
        ForEach-Object { Write-Host ("     {0,5}  {1}" -f $_.Count, $_.Name) }
    if (-not $Full -and $byMod.Count -gt 12) { Write-Host "     ... and $($byMod.Count - 12) more locations (-Full)" -ForegroundColor DarkGray }
    $findings += $lAdded.Count + $lRemoved.Count + $lChanged.Count
}

Write-Host ''
if ($findings -eq 0) {
    Write-Host 'Nothing changed between these snapshots.' -ForegroundColor Green
    Write-Host 'If the symptom is new, it is not a change to the install - look at settings,' -ForegroundColor DarkGray
    Write-Host 'save state, drivers, or accept that it may not be deterministic.' -ForegroundColor DarkGray
} else {
    Write-Host "$findings change(s). Read these before proposing a bisect." -ForegroundColor Yellow
}
