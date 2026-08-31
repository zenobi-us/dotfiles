# Invoke-BisectRound.ps1 -- park a set of mods, record the round, launch the game.
#
#     .\Invoke-BisectRound.ps1 -GameRoot '<path>' -Round A -Park cut1.txt -Launch
#     .\Invoke-BisectRound.ps1 -GameRoot '<path>' -Round A -Restore
#     .\Invoke-BisectRound.ps1 -GameRoot '<path>' -Status
#
# WHY THIS EXISTS
#
# A bisect is twenty rounds of the same three actions, and two of them are chores
# the person testing should never have to do:
#
#   1. Move this set of files out of the way, exactly, and reversibly.
#   2. Start the game.
#   3. Look at the screen and say what happened.
#
# Only the third one needs a human. Doing (1) by hand in a mod manager is a
# hundred checkboxes per round and an excellent way to lose track of what was
# actually tested; doing (2) by hand means the person sits waiting to be told a
# round is ready. So this does both, and the round is over when they glance at
# the screen and see the game is up.
#
# What it will NOT do is decide whether the round passed. A watcher cannot tell a
# livelock from a loaded game sitting at a menu - see references/bisecting.md.
# The person looking at the screen is the oracle; this just gets them there
# faster.
#
# Every round is written to disk as a manifest, because "which config was that,
# exactly?" is the question that ruins long bisects, and memory is not an answer.

[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string] $GameRoot,

    # A label for the round. Rounds are cheap to name and expensive to confuse.
    [string] $Round = 'A',

    # What to park: a file listing one name per line, or names passed directly.
    # A name may be an archive filename, an r6\scripts folder, a CET mod folder,
    # or a path relative to the game root.
    [string[]] $Park,

    # Put a round's files back, from its manifest.
    [switch] $Restore,

    # Show what is parked right now, by which round, and whether the mod manager
    # has quietly undone any of it.
    [switch] $Status,

    # Resolve the list and report what would move, without moving anything. Worth
    # running first on a list somebody typed: the failure it catches is a name
    # that matches nothing, which parks nothing and scores as "the fault went
    # away".
    [switch] $Plan,

    # Start the game after parking, the way this install normally starts it.
    [switch] $Launch,

    # Wait this long for the game process to appear before reporting it did not.
    [int] $LaunchTimeoutSec = 120,

    # Where round manifests live. Overridable so a test run cannot write into a
    # real install's records - which it did, the first time this was exercised.
    [string] $RecordDir = (Join-Path $env:USERPROFILE 'Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\bisect')
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath (Join-Path $GameRoot 'bin\x64\Cyberpunk2077.exe'))) {
    throw "No Cyberpunk2077.exe under '$GameRoot'. Pass -GameRoot 'X:\path\to\Cyberpunk 2077'."
}

# Records live beside the game's own data by default, not in this repo and not in
# an agent's memory: the next round may be run by a different agent, or by the
# user alone.
$recordDir = $RecordDir
$parkRoot  = Join-Path $GameRoot '_bisect_parked'

function Test-InsideGameRoot {
    <#
    .SYNOPSIS
        Is this resolved path genuinely under the game directory?
    .DESCRIPTION
        Compares FULLY RESOLVED paths, because `<game>\..\x` and `<game>\x` look
        equally "under the game root" to a string comparison and only one of them
        is. The trailing separator matters too: without it, a sibling directory
        named `Cyberpunk 2077 Backup` passes as inside `Cyberpunk 2077`.
    #>
    param([string] $Path)
    try {
        $full = [IO.Path]::GetFullPath($Path)
        $root = [IO.Path]::GetFullPath($GameRoot).TrimEnd([char]92) + [char]92
        return $full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)
    } catch { return $false }
}

function Test-GameRunning {
    return @(Get-Process -Name 'Cyberpunk2077' -ErrorAction SilentlyContinue).Count -gt 0
}

# NEVER MOVE MOD FILES WHILE THE GAME IS RUNNING. The result is uninterpretable -
# you no longer know which configuration was actually tested, and every round
# after it inherits the doubt.
function Assert-GameClosed {
    param([string] $Action)
    if (Test-GameRunning) {
        throw "Cyberpunk 2077 is running. Close it before $Action - moving mod files under a running game makes the round meaningless."
    }
}

# ------------------------------------------------------------------ status ---

if ($Status) {
    Write-Host ''
    Write-Host 'BISECT ROUNDS' -ForegroundColor Cyan
    if (-not (Test-Path -LiteralPath $recordDir)) {
        Write-Host '  no rounds recorded on this install' -ForegroundColor DarkGray
        exit 0
    }
    $undone = @()
    foreach ($m in (Get-ChildItem -LiteralPath $recordDir -Filter '*.json' | Sort-Object LastWriteTime)) {
        $r = Get-Content -LiteralPath $m.FullName -Raw | ConvertFrom-Json
        $state = if ($r.RestoredAt) { "restored $($r.RestoredAt)" } else { 'PARKED' }
        $colour = if ($r.RestoredAt) { 'DarkGray' } else { 'Yellow' }
        Write-Host ("  {0,-10} {1,-22} {2,4} item(s)  {3}" -f $r.Round, $r.ParkedAt, @($r.Items).Count, $state) -ForegroundColor $colour

        # HAS THE MANAGER UNDONE IT? A round is armed by moving files out while
        # the manager still believes they are deployed - which is what makes
        # arming instant, and is also why any deployment silently puts them all
        # back. A round that quietly re-armed itself scores as a result, and the
        # configuration tested is not the one in the manifest.
        if (-not $r.RestoredAt) {
            foreach ($item in $r.Items) {
                if (Test-Path -LiteralPath (Join-Path $GameRoot $item.Rel)) { $undone += "$($r.Round): $($item.Rel)" }
            }
        }
    }
    if ($undone.Count) {
        Write-Host ''
        Write-Host "$($undone.Count) parked item(s) are back in the game directory:" -ForegroundColor Red
        $undone | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkRed }
        Write-Host '  A deployment ran during the round. Whatever you tested was not the configuration recorded - re-arm it.' -ForegroundColor DarkRed
    }
    $stray = if (Test-Path -LiteralPath $parkRoot) { @(Get-ChildItem -LiteralPath $parkRoot -Recurse -File).Count } else { 0 }
    Write-Host ''
    Write-Host "  $stray file(s) currently sitting in $parkRoot" -ForegroundColor DarkGray
    exit 0
}

# ----------------------------------------------------------------- restore ---

if ($Restore) {
    $manifest = Join-Path $recordDir "$Round.json"
    if (-not (Test-Path -LiteralPath $manifest)) { throw "No manifest for round '$Round' under $recordDir." }
    Assert-GameClosed "restoring round $Round"

    $r = Get-Content -LiteralPath $manifest -Raw | ConvertFrom-Json
    $back = 0; $missing = @()
    foreach ($item in $r.Items) {
        $from = Join-Path $parkRoot (Join-Path $Round $item.Rel)
        $to   = Join-Path $GameRoot $item.Rel
        # The manifest is a file on disk like any other. Restoring blindly would
        # write wherever it says, which is the same hole as parking blindly.
        if (-not (Test-InsideGameRoot $to)) {
            Write-Warning "refusing to restore '$($item.Rel)' - it resolves outside the game directory"
            continue
        }
        if (-not (Test-Path -LiteralPath $from)) { $missing += $item.Rel; continue }
        $toDir = Split-Path -Parent $to
        if (-not (Test-Path -LiteralPath $toDir)) { New-Item -ItemType Directory -Path $toDir -Force | Out-Null }
        Move-Item -LiteralPath $from -Destination $to -Force
        $back++
    }

    $r | Add-Member -NotePropertyName RestoredAt -NotePropertyValue (Get-Date -Format 'yyyy-MM-dd HH:mm') -Force
    $r | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $manifest -Encoding UTF8

    Write-Host ''
    Write-Host "Round $Round restored: $back item(s) back in place." -ForegroundColor Green
    if ($missing.Count) {
        # Do not paper over this. A file that is not where the manifest says it
        # was parked means something else moved it - a redeploy, a cleanup, or
        # another round - and the install is no longer the one that was recorded.
        Write-Host "  $($missing.Count) item(s) were NOT in the park folder:" -ForegroundColor Red
        $missing | Select-Object -First 10 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkRed }
        Write-Host '  Something else moved them. Redeploy from your manager before trusting the next round.' -ForegroundColor DarkRed
    }
    exit 0
}

# -------------------------------------------------------------------- park ---

function Resolve-ModItem {
    <#
    .SYNOPSIS
        Turn a name a human would type into a real path under the game root.
    .DESCRIPTION
        People type what they see: an archive filename from a conflict report, a
        folder name from r6\scripts, or a mod's display name. Requiring a full
        relative path is how a bisect turns into transcription work, and a
        mistyped path silently parks nothing at all - which scores as "the fault
        went away" and sends the whole search down the wrong branch.
    #>
    param([string] $Name)

    $candidates = @(
        $Name
        "archive\pc\mod\$Name"
        "archive\pc\mod\$Name.archive"
        "r6\scripts\$Name"
        "r6\tweaks\$Name"
        "bin\x64\plugins\cyber_engine_tweaks\mods\$Name"
        "red4ext\plugins\$Name"
    )
    foreach ($c in $candidates) {
        $full = Join-Path $GameRoot $c
        if (Test-Path -LiteralPath $full) {
            # CONTAINMENT. A name comes out of a text file, and `..\..\Documents\x`
            # resolves perfectly well - it just resolves OUTSIDE the game. Before
            # this check, parking such a list moved a file that had nothing to do
            # with the game into the park folder, reported success, and recorded
            # it in a manifest. Verified by test.
            #
            # It is more than a typo guard: a cut list is exactly the kind of
            # thing that gets pasted from a forum or a mod page, or generated by
            # an agent reading untrusted text.
            if (-not (Test-InsideGameRoot $full)) {
                Write-Warning "refusing '$Name' - it resolves outside the game directory ($full)"
                return $null
            }
            return [pscustomobject]@{ Rel = $c; Full = $full }
        }
    }
    return $null
}

if (-not $Park) {
    throw "Nothing to do. Pass -Park (names or a list file), -Restore, -Status or -Plan."
}

if (-not $Plan) { Assert-GameClosed "parking round $Round" }

# A single argument that is a readable file is a list, not a mod name.
$names = @()
foreach ($p in $Park) {
    if ((Test-Path -LiteralPath $p) -and -not (Get-Item -LiteralPath $p).PSIsContainer) {
        $names += @(Get-Content -LiteralPath $p | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith('#') })
    } else {
        $names += $p
    }
}
$names = @($names | Select-Object -Unique)

$items = @(); $unresolved = @()
foreach ($n in $names) {
    $r = Resolve-ModItem $n
    if ($r) { $items += $r } else { $unresolved += $n }
}

if ($Plan) {
    Write-Host ''
    Write-Host "ROUND $Round - plan only, nothing moved" -ForegroundColor Cyan
    foreach ($i in $items) { Write-Host "  would park   $($i.Rel)" -ForegroundColor DarkGreen }
    foreach ($u in $unresolved) { Write-Host "  NO MATCH     $u" -ForegroundColor Red }
    Write-Host ''
    Write-Host ("  {0} of {1} name(s) resolve." -f $items.Count, $names.Count) -ForegroundColor DarkGray
    if ($unresolved.Count) { Write-Host '  Arming would refuse - fix the list first.' -ForegroundColor Yellow }
    exit $(if ($unresolved.Count) { 1 } else { 0 })
}

if ($unresolved.Count) {
    # Refuse rather than park a partial set. A round that parked 37 of 38 is not
    # the round in the manifest, and nothing downstream would ever notice.
    Write-Host ''
    Write-Host "$($unresolved.Count) of $($names.Count) name(s) do not resolve to anything on this install:" -ForegroundColor Red
    $unresolved | Select-Object -First 15 | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkRed }
    Write-Host ''
    Write-Host 'Nothing was parked. Fix the list and re-run - a partly-parked round tests a configuration nobody recorded.' -ForegroundColor Yellow
    exit 1
}

$roundPark = Join-Path $parkRoot $Round
$moved = @()
foreach ($i in $items) {
    $dest = Join-Path $roundPark $i.Rel
    $destDir = Split-Path -Parent $dest
    if (-not (Test-Path -LiteralPath $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    Move-Item -LiteralPath $i.Full -Destination $dest -Force
    $moved += $i
}

if (-not (Test-Path -LiteralPath $recordDir)) { New-Item -ItemType Directory -Path $recordDir -Force | Out-Null }
$manifest = Join-Path $recordDir "$Round.json"
[pscustomobject]@{
    Round    = $Round
    ParkedAt = (Get-Date -Format 'yyyy-MM-dd HH:mm')
    GameRoot = $GameRoot
    ParkDir  = $roundPark
    Items    = @($moved | ForEach-Object { [pscustomobject]@{ Rel = $_.Rel } })
} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $manifest -Encoding UTF8

Write-Host ''
Write-Host "Round $Round armed: $($moved.Count) item(s) parked." -ForegroundColor Green
Write-Host "  parked to   $roundPark" -ForegroundColor DarkGray
Write-Host "  manifest    $manifest" -ForegroundColor DarkGray
Write-Host "  undo        -Round $Round -Restore" -ForegroundColor DarkGray

# ------------------------------------------------------------------ launch ---

function Start-Game {
    <#
    .SYNOPSIS
        Start the game the way THIS install starts it.
    .DESCRIPTION
        Not by running the exe directly. A storefront launch applies the launch
        options the user has configured - on the install this was written
        against, `--launcher-skip -skipStartScreen` - and those are part of how
        their game actually runs. Bypassing them makes the round a test of a
        configuration the user never plays.

        launcher-configuration.json in the game root names the platform, which is
        how this picks the route rather than guessing from the folder path.
    #>
    $cfgPath = Join-Path $GameRoot 'launcher-configuration.json'
    $platform = $null
    if (Test-Path -LiteralPath $cfgPath) {
        try { $platform = (Get-Content -LiteralPath $cfgPath -Raw | ConvertFrom-Json).platform } catch { $platform = $null }
    }

    switch ($platform) {
        'steam' {
            Write-Host '  launching through Steam (keeps your launch options)' -ForegroundColor DarkGray
            Start-Process 'steam://rungameid/1091500'
            return
        }
        default {
            $pre = Join-Path $GameRoot 'REDprelauncher.exe'
            if (Test-Path -LiteralPath $pre) {
                Write-Host "  launching REDprelauncher.exe (platform: $(if ($platform) { $platform } else { 'unknown' }))" -ForegroundColor DarkGray
                Start-Process -FilePath $pre -WorkingDirectory $GameRoot
            } else {
                Write-Host '  launching the game exe directly - no prelauncher found' -ForegroundColor DarkYellow
                Start-Process -FilePath (Join-Path $GameRoot 'bin\x64\Cyberpunk2077.exe') -WorkingDirectory (Join-Path $GameRoot 'bin\x64')
            }
        }
    }
}

if ($Launch) {
    Write-Host ''
    Start-Game

    $deadline = (Get-Date).AddSeconds($LaunchTimeoutSec)
    $proc = $null
    while ((Get-Date) -lt $deadline) {
        $proc = Get-Process -Name 'Cyberpunk2077' -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($proc) { break }
        Start-Sleep -Seconds 2
    }

    if ($proc) {
        Write-Host ''
        Write-Host "ROUND $Round IS UP - the game is running (pid $($proc.Id), started $($proc.StartTime.ToString('HH:mm:ss')))." -ForegroundColor Green
        Write-Host '  Load the save, or start the new game, and say what happens.' -ForegroundColor Cyan
    } else {
        # Worth saying rather than assuming: the launcher may be showing a
        # storefront prompt, or the game may have died before the first frame,
        # which is itself a result.
        Write-Host ''
        Write-Host "The game process did not appear within $LaunchTimeoutSec seconds." -ForegroundColor Yellow
        Write-Host '  Either the launcher is waiting on something, or it failed before the first frame.' -ForegroundColor DarkYellow
        Write-Host '  A failure that fast is a result too - check the logs before re-running.' -ForegroundColor DarkYellow
    }
}
exit 0
