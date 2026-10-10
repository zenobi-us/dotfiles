# Test-InstallReady.ps1 -- if you launched right now, what would be wrong?
#
#     .\Test-InstallReady.ps1 -GameRoot '<path>'
#     .\Test-InstallReady.ps1 -GameRoot '<path>' -Deep      # also reads the bundle
#
# WHY THIS EXISTS
#
# Every check in this family answers one question well, and a modder about to
# press Play has a different one: **is this install in a state worth launching?**
# Answering it by hand means four tools and knowing which of their findings
# matter, which is exactly the knowledge somebody new does not have.
#
# THE DISTINCTION THAT MAKES IT USEFUL: some problems fix themselves the moment
# you launch, and some do not, and they look identical in every existing report.
#
#   Ten script mods missing from the compiled bundle  -> launching fixes it
#   Fourteen archives missing from modlist.txt        -> launching does NOT
#
# The first is a normal consequence of installing something since the last
# launch. The second means those mods sort last and lose every file they
# contest, silently, for as long as nobody notices. Told apart, one is noise and
# the other is the finding. Together, they are a wall of warnings people learn to
# scroll past.
#
# Fast by default: file times, one log, one text file. -Deep adds the reads that
# take real time.

[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string] $GameRoot,

    # Read the compiled bundle and the archive indices. Accurate, and slower -
    # the bundle alone is 35 MB and the collision scan reads every archive.
    [switch] $Deep,

    [string] $Json
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot 'UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath (Join-Path $GameRoot 'bin\x64\Cyberpunk2077.exe'))) {
    throw "No Cyberpunk2077.exe under '$GameRoot'. Pass -GameRoot 'X:\path\to\Cyberpunk 2077'."
}

# Three states, and the middle one is the point of the tool.
#   ready    - nothing to do
#   onlaunch - real, and launching resolves it. Not a warning; a fact.
#   action   - launching will NOT resolve it
#   unknown  - could not be established, said plainly rather than assumed fine
$findings = New-Object System.Collections.Generic.List[object]
function Add-Finding {
    param([string] $Check, [ValidateSet('ready','onlaunch','action','unknown')] [string] $State, [string] $Detail)
    $findings.Add([pscustomobject]@{ Check = $Check; State = $State; Detail = $Detail })
}

# ------------------------------------------------------- what is running -----

$gameUp = @(Get-Process -Name 'Cyberpunk2077' -ErrorAction SilentlyContinue).Count -gt 0
if ($gameUp) {
    Add-Finding 'game running' 'action' 'The game is already running. Anything below describes the install on disk, not the session in memory.'
}

# ------------------------------------------------------ the last compile -----

# redscript is an all-or-nothing gate: if the last compile failed, EVERY .reds
# mod is off with no sign in game. It is the single highest-value check here,
# and it is a log read.
$logDir = Join-Path $GameRoot 'r6\logs'
$lastRun = $null
if (Test-Path -LiteralPath $logDir) {
    foreach ($f in (Get-ChildItem -LiteralPath $logDir -Filter 'redscript_r*.log' -File)) {
        $head = Get-Content -LiteralPath $f.FullName -TotalCount 1
        $when = $f.LastWriteTime
        if ($head -match '^\[\w+ - (.+?) [-+]\d{4}\]') {
            try { $when = [datetime]::Parse($matches[1], [Globalization.CultureInfo]::InvariantCulture) } catch { }
        }
        $text = Get-Content -LiteralPath $f.FullName -Raw
        $out = if ($text -match '(?m)Output successfully saved to (.+?)\s*$') { $matches[1] } else { $null }
        # Only a run that wrote INSIDE the game directory is a real launch; a
        # compile test writes to a temp folder and overwrites the current log.
        $isLaunch = $out -and ([IO.Path]::GetFullPath($out)).StartsWith(
            ([IO.Path]::GetFullPath($GameRoot).TrimEnd([char]92) + [char]92), [StringComparison]::OrdinalIgnoreCase)
        if ($isLaunch -and (-not $lastRun -or $when -gt $lastRun.When)) {
            $lastRun = [pscustomobject]@{ When = $when; Output = $out; Ok = ($text -match 'Compilation complete') }
        }
    }
}
if (-not $lastRun) {
    Add-Finding 'redscript' 'unknown' 'No launch-time compile found in r6\logs. Either the game has never been launched with redscript installed, or the logs were cleared.'
} elseif (-not $lastRun.Ok) {
    Add-Finding 'redscript' 'action' "The last compile ($($lastRun.When.ToString('yyyy-MM-dd HH:mm'))) did not complete. EVERY .reds mod is off until it does - with no error in game. Read r6\logs\redscript_rCURRENT.log."
} else {
    Add-Finding 'redscript' 'ready' "Last launch compiled cleanly ($($lastRun.When.ToString('yyyy-MM-dd HH:mm')))."
}

# ------------------------------------------- scripts newer than the bundle ---

# The cheap form of "is this mod live": compare file times rather than reading
# 35 MB. -Deep does it properly.
$bundle = if ($lastRun) { $lastRun.Output } else { $null }
if ($bundle -and (Test-Path -LiteralPath $bundle)) {
    $built = (Get-Item -LiteralPath $bundle).LastWriteTime
    $ts = [IO.Path]::ChangeExtension($bundle, '.ts')
    if (Test-Path -LiteralPath $ts) {
        $b = [IO.File]::ReadAllBytes($ts)
        if ($b.Length -ge 8) {
            $ns = [BitConverter]::ToUInt64($b, 0)
            if ($ns -gt 0) { $built = [DateTimeOffset]::FromUnixTimeMilliseconds([int64]($ns / 1000000)).LocalDateTime }
        }
    }
    $scriptDir = Join-Path $GameRoot 'r6\scripts'
    if (Test-Path -LiteralPath $scriptDir) {
        # NOT just the .reds files. A hardlinking manager deploys by creating a
        # second name for the staging inode, so the deployed .reds keeps the mod
        # AUTHOR'S timestamp - often years old - no matter when it was deployed.
        # Filtering to *.reds therefore reported "every script predates the
        # bundle" for ten mods deployed the day before, and only disagreed with
        # Test-ScriptsLive, which reads the bundle itself, loudly enough to catch.
        #
        # What does move is everything the manager writes at deploy time: the
        # folder itself and its marker file. So look at every entry, not one
        # extension.
        $folders = @()
        $newer = @(Get-ChildItem -LiteralPath $scriptDir -Recurse -ErrorAction SilentlyContinue |
                   Where-Object { $_.LastWriteTime -gt $built })
        if ($newer.Count) {
            $folders = @($newer | ForEach-Object { ($_.FullName.Substring($scriptDir.Length + 1) -split [regex]::Escape([string][char]92))[0] } | Select-Object -Unique)

            # A REMOVED MOD LEAVES A FRESH, EMPTY FOLDER. Vortex purges the
            # .reds files but leaves the directory and its own marker behind,
            # both stamped at deploy time - so an uninstalled mod looks exactly
            # like a newly installed one to the check above, and gets reported
            # as "not running yet" when there is nothing left to run. Observed
            # with BetterNetrunning and Limited Slip Differential on one
            # install. Keep the permissive scan; drop folders holding no script.
            $folders = @($folders | Where-Object {
                @(Get-ChildItem -LiteralPath (Join-Path $scriptDir $_) -Filter *.reds -Recurse -ErrorAction SilentlyContinue).Count -gt 0
            })
        }
        if ($folders.Count) {
            Add-Finding 'script bundle' 'onlaunch' "$($folders.Count) script mod(s) are newer than the compiled bundle, so their code is not running yet. Launching compiles them in: $(($folders | Select-Object -First 4) -join ', ')$(if ($folders.Count -gt 4) { ', ...' })"
        } else {
            Add-Finding 'script bundle' 'ready' 'Every .reds file predates the compiled bundle.'
        }
    }
}

# ------------------------------------------------------- unlisted archives ---

# THIS is the one launching does not fix. An archive with no modlist.txt entry
# sorts last, so it loses every file it contests - installed, enabled, and
# quietly beaten.
$modDir = Join-Path $GameRoot 'archive\pc\mod'
$listPath = Join-Path $modDir 'modlist.txt'
if ((Test-Path -LiteralPath $modDir) -and (Test-Path -LiteralPath $listPath)) {
    $listed = @(Get-Content -LiteralPath $listPath | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    $onDisk = @(Get-ChildItem -LiteralPath $modDir -Filter *.archive -File | ForEach-Object { $_.Name })
    $unlisted = @($onDisk | Where-Object { $listed -notcontains $_ })
    $stale    = @($listed | Where-Object { $onDisk -notcontains $_ })

    if ($unlisted.Count) {
        Add-Finding 'load order' 'action' "$($unlisted.Count) archive(s) are on disk with no modlist.txt entry. They sort LAST, so they lose every file they contest - and launching does not change that: $(($unlisted | Select-Object -First 4) -join ', ')$(if ($unlisted.Count -gt 4) { ', ...' })"
    } else {
        Add-Finding 'load order' 'ready' "All $($onDisk.Count) archives have a modlist.txt entry."
    }
    if ($stale.Count) {
        # Deliberately not 'action': a stale line holds the slot for a mod you
        # disabled on purpose, and pruning it loses that position.
        Add-Finding 'stale entries' 'ready' "$($stale.Count) modlist entr(ies) have no file. Normal for a mod disabled on purpose - the line holds its slot."
    }
}

# --------------------------------------------------------- REDmod deploy -----

# REDmod content is compiled at deploy, not at launch, so a REDmod changed since
# the last deploy is stale in a way launching will not resolve.
$redmodDir = Join-Path $GameRoot 'mods'
$deployRecord = Join-Path $GameRoot 'r6\cache\modded\mods.json'
if ((Test-Path -LiteralPath $redmodDir) -and (Test-Path -LiteralPath $deployRecord)) {
    $deployed = (Get-Item -LiteralPath $deployRecord).LastWriteTime
    $changed = @(Get-ChildItem -LiteralPath $redmodDir -Recurse -File -ErrorAction SilentlyContinue |
                 Where-Object { $_.LastWriteTime -gt $deployed })
    if ($changed.Count) {
        Add-Finding 'REDmod deploy' 'action' "$($changed.Count) REDmod file(s) changed since the last deploy ($($deployed.ToString('yyyy-MM-dd HH:mm'))). REDmod content is built at DEPLOY, not at launch - run the deploy before playing."
    } else {
        Add-Finding 'REDmod deploy' 'ready' "REDmod deploy is current ($($deployed.ToString('yyyy-MM-dd HH:mm')))."
    }
}

# ------------------------------------------------------------ frameworks -----

$frameworks = [ordered]@{
    'RED4ext'  = 'red4ext\RED4ext.dll'
    'redscript' = 'engine\tools\scc.exe'
    'CET'      = 'bin\x64\plugins\cyber_engine_tweaks.asi'
    'ArchiveXL' = 'red4ext\plugins\ArchiveXL'
    'TweakXL'  = 'red4ext\plugins\TweakXL'
    'Codeware' = 'red4ext\plugins\Codeware'
}
$missing = @()
foreach ($k in $frameworks.Keys) { if (-not (Test-Path -LiteralPath (Join-Path $GameRoot $frameworks[$k]))) { $missing += $k } }
if ($missing.Count) {
    # Absence is only a problem if something needs it, which this cannot know -
    # an archives-only load order legitimately has none of these.
    Add-Finding 'frameworks' 'unknown' "Not present: $($missing -join ', '). Fine if nothing on this install needs them; fatal for the mods that do."
} else {
    Add-Finding 'frameworks' 'ready' 'RED4ext, redscript, CET, ArchiveXL, TweakXL and Codeware are all present.'
}

# ------------------------------------------------------------------ deep -----

if ($Deep) {
    $live = Join-Path $PSScriptRoot 'Test-ScriptsLive.ps1'
    if (Test-Path -LiteralPath $live) {
        $out = & $live -GameRoot $GameRoot *>&1 | Out-String
        if ($out -match '(?m)^(\d+) of (\d+) script folders are not fully represented') {
            if ([int]$matches[1] -gt 0) {
                Add-Finding 'bundle contents' 'onlaunch' "$($matches[1]) of $($matches[2]) script folders have declarations missing from the bundle (read from the bundle itself, not file times)."
            } else {
                Add-Finding 'bundle contents' 'ready' 'Every script folder that declares a symbol has it in the live bundle.'
            }
        }
    }
}

# ---------------------------------------------------------------- verdict ----

$action   = @($findings | Where-Object { $_.State -eq 'action' })
$onlaunch = @($findings | Where-Object { $_.State -eq 'onlaunch' })
$unknown  = @($findings | Where-Object { $_.State -eq 'unknown' })

Write-Host ''
if ($action.Count) {
    Write-Host "NOT READY - $($action.Count) thing(s) launching will not fix" -ForegroundColor Red
} elseif ($onlaunch.Count) {
    Write-Host "READY - $($onlaunch.Count) thing(s) resolve themselves when you launch" -ForegroundColor Green
} else {
    Write-Host 'READY' -ForegroundColor Green
}
Write-Host ''

foreach ($group in @(
    @{ State = 'action';   Title = 'LAUNCHING WILL NOT FIX THESE'; Colour = 'Red' },
    @{ State = 'onlaunch'; Title = 'FIXED BY LAUNCHING';           Colour = 'Yellow' },
    @{ State = 'unknown';  Title = 'COULD NOT ESTABLISH';          Colour = 'DarkYellow' },
    @{ State = 'ready';    Title = 'FINE';                         Colour = 'DarkGreen' }
)) {
    $rows = @($findings | Where-Object { $_.State -eq $group.State })
    if (-not $rows.Count) { continue }
    Write-Host "  $($group.Title)" -ForegroundColor $group.Colour
    foreach ($r in $rows) {
        Write-Host ("    {0,-16} {1}" -f $r.Check, $r.Detail) -ForegroundColor $(if ($group.State -eq 'ready') { 'DarkGray' } else { $group.Colour })
    }
    Write-Host ''
}

if (-not $Deep) {
    Write-Host '  Fast checks only - file times rather than file contents. -Deep reads the bundle.' -ForegroundColor DarkGray
}

if ($Json) {
    [pscustomobject]@{ GameRoot = $GameRoot; CheckedAt = (Get-Date).ToString('s'); Findings = $findings } |
        ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $Json -Encoding UTF8
    Write-Host "wrote $((Resolve-Path -LiteralPath $Json).Path)" -ForegroundColor Green
}

exit $(if ($action.Count) { 1 } else { 0 })
