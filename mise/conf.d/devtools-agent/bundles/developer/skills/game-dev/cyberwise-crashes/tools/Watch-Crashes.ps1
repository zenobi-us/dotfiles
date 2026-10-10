# Watch-Crashes.ps1 -- sample the game while it runs, and capture its own
# post-mortem when it dies.
#
#     .\Watch-Crashes.ps1 -Dir <output folder> [-GameRoot <path>] [-IntervalSec 15]
#
# Runs until stopped. Waits for Cyberpunk2077.exe, logs one CSV per session, and
# on death captures the game's post-mortem telemetry - DEDUPED, see below - then
# re-arms for the next session.
#
# WHY A WATCHER AT ALL
#
# This game catches its own fault, writes telemetry and exits, so nothing reaches
# Windows Error Reporting: no Application Error event, no dump, even with WER
# LocalDumps correctly configured. The only first-party evidence is
# CrashInfo.json, and the game overwrites it on the next crash. If you are not
# watching, you get one crash's worth of data and no memory series.
#
# THE MISTAKE THIS EXISTS TO PREVENT
#
# CrashInfo.json is overwritten on each crash but NOT deleted on a clean exit -
# it sits holding the last crash indefinitely. A watcher that copies it whenever
# the process disappears therefore re-saves the same record after every normal
# quit, under a fresh timestamped name.
#
# On the install this was written against that produced 21 files holding 2 real
# crashes: one copied 9 times, one 12. A location analysis over that folder
# "finds" a nine-hit cluster in one district that is a single event counted nine
# times - and sends someone bisecting archives for a fault that is not there.
#
# So: dedupe on crashVisitId, name captures after the crash's own timeCrash, and
# write a verdict per session so a clean quit is distinguishable from a crash.

[CmdletBinding()]
param(
    # Where to write session CSVs and the crashinfo/ folder.
    [Parameter(Mandatory)][string] $Dir,

    # Only used to record which build crashed. Not required to watch.
    [string] $GameRoot,

    [int] $IntervalSec = 15,

    # Stop after this many sessions. 0 = run forever (the normal case).
    [int] $MaxSessions = 0
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$ErrorActionPreference = 'Continue'
if (-not (Test-Path -LiteralPath $Dir)) { New-Item -ItemType Directory -Path $Dir -Force | Out-Null }

# ONE WATCHER PER OUTPUT FOLDER, enforced here rather than by whoever launches it.
#
# There are now several things that can start a watcher - the tray app, a logon
# Run entry, a scheduled task, a person at a prompt - and none of them knows
# about the others. "Check whether one is running, then start one" is a race
# between any two of them, and the failure is quiet: two watchers writing session
# CSVs into the same folder, interleaved, each capturing the same crash.
#
# A named mutex settles it wherever the launch came from. It is keyed on the
# OUTPUT FOLDER, not globally, so two game installs can each have their own.
$mutexName = 'Global\CyberwiseWatch_' + [BitConverter]::ToString(
    [Security.Cryptography.MD5]::Create().ComputeHash(
        [Text.Encoding]::UTF8.GetBytes($Dir.ToLowerInvariant()))).Replace('-', '')

$createdNew = $false
$mutex = New-Object Threading.Mutex($true, $mutexName, [ref]$createdNew)
if (-not $createdNew) {
    Write-Host "another watcher is already running for $Dir - exiting" -ForegroundColor Yellow
    exit 0
}

$crashDir = Join-Path $Dir 'crashinfo'
$seenFile = Join-Path $crashDir 'captured-ids.txt'
$ciPath   = Join-Path $env:LOCALAPPDATA 'CD Projekt Red\Cyberpunk 2077\CrashInfo.json'

$gameVer = 'unknown'
if ($GameRoot) {
    $exe = Join-Path $GameRoot 'bin\x64\Cyberpunk2077.exe'
    if (Test-Path -LiteralPath $exe) { $gameVer = (Get-Item -LiteralPath $exe).VersionInfo.ProductVersion }
}

function Save-PostMortem {
    <#
        Returns a human-readable verdict string. Captures only a post-mortem that
        has not been seen before - see the header for why this is the whole point.
    #>
    if (-not (Test-Path -LiteralPath $ciPath)) { return 'clean exit - no post-mortem file' }
    if (-not (Test-Path -LiteralPath $crashDir)) { New-Item -ItemType Directory -Path $crashDir -Force | Out-Null }

    try {
        $pm = (Get-Content -LiteralPath $ciPath -Raw | ConvertFrom-Json).Data.postMortem
    } catch {
        return "post-mortem unreadable: $($_.Exception.Message)"
    }

    $id = [string]$pm.crashVisitId
    if (-not $id) {
        # No id to dedupe on: keep it rather than lose evidence, but say so.
        Copy-Item -LiteralPath $ciPath -Destination (Join-Path $crashDir ("CrashInfo-noid-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + ".json")) -Force
        return 'post-mortem has no crashVisitId - captured unconditionally'
    }

    $ids = if (Test-Path -LiteralPath $seenFile) { @(Get-Content -LiteralPath $seenFile) } else { @() }
    if ($ids -contains $id) { return "clean exit - post-mortem $($id.Substring(0,8)) already on file" }

    $stamp = try { ([datetime]$pm.timeCrash).ToUniversalTime().ToString('yyyyMMdd-HHmmss') }
             catch { Get-Date -Format 'yyyyMMdd-HHmmss' }
    Copy-Item -LiteralPath $ciPath -Destination (Join-Path $crashDir "CrashInfo-$stamp-$($id.Substring(0,8)).json") -Force
    Add-Content -LiteralPath $seenFile -Value $id

    $district = if ($pm.district) { $pm.district } else { '(blank)' }
    return ("CRASH - $stamp $($id.Substring(0,8)) district=$district isOom=$($pm.isOom) " +
            "session=$([int]$pm.sessionLength)s at ($([math]::Round($pm.location.X)),$([math]::Round($pm.location.Y)))")
}

# --- preserve, then say so ---------------------------------------------------
#
# THE RACE THIS CLOSES. The crash skill's step 0 is "preserve before anything
# else, including thinking", because relaunching destroys the evidence:
# redscript_rCURRENT.log is replaced at every launch and CET truncates its own
# logs. On 2026-08-23 a crash was looked at twenty minutes later and every one
# of those had already been rewritten. Asking a human to remember a command
# between dying and pressing Play is asking them to lose the evidence.
#
# So the watcher runs the snapshot itself, and then TOASTS - because the only
# thing standing between the player and a relaunch is knowing it is safe to.
function Invoke-AutoPreserve {
    param([string] $Summary)

    $tool = Join-Path $PSScriptRoot 'Save-CrashSnapshot.ps1'
    if (-not (Test-Path -LiteralPath $tool)) {
        Write-Host "  cannot auto-preserve: Save-CrashSnapshot.ps1 is not beside this script" -ForegroundColor Yellow
        return $null
    }

    $dest = $null
    try {
        $out = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $tool `
                    -GameRoot $GameRoot -Note "auto-preserved by the crash watcher: $Summary" 2>&1 | Out-String
        $m = [regex]::Match($out, 'snapshot:\s*(\S.*)')
        if ($m.Success) { $dest = $m.Groups[1].Value.Trim() }
    } catch {
        Write-Host "  auto-preserve failed: $($_.Exception.Message)" -ForegroundColor Yellow
        return $null
    }
    return $dest
}

# A balloon from a throwaway NotifyIcon. Deliberately not BurntToast or a WinRT
# toast: both want something installed or an AppID registered, and a
# notification that only works on the developer's machine is worse than none.
function Show-CrashToast {
    param([string] $Title, [string] $Message)
    try {
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        $ni = New-Object System.Windows.Forms.NotifyIcon
        $ni.Icon = [System.Drawing.SystemIcons]::Information
        $ni.Visible = $true
        $ni.BalloonTipTitle = $Title
        $ni.BalloonTipText = $Message
        $ni.ShowBalloonTip(15000)
        Start-Sleep -Seconds 8
        $ni.Visible = $false
        $ni.Dispose()
    } catch { }
}

$sessions = 0
while ($true) {

    while (-not (Get-Process -Name 'Cyberpunk2077' -ErrorAction SilentlyContinue)) { Start-Sleep -Seconds 10 }
    $p = Get-Process -Name 'Cyberpunk2077' -ErrorAction SilentlyContinue
    if (-not $p) { continue }

    # SNAPSHOT THE INSTALL AT SESSION START.
    #
    # This is what makes "it worked last night" answerable. The watcher already
    # knows the moment play begins, which is exactly when the install state is
    # worth recording - and a snapshot taken by hand is a snapshot nobody takes.
    # Roughly a second and a megabyte; failure here must never stop the watch.
    $snapTool = Join-Path $PSScriptRoot 'New-InstallSnapshot.ps1'
    if (Test-Path -LiteralPath $snapTool) {
        try {
            $lbl = 'session start'
            if ($GameRoot) { & $snapTool -GameRoot $GameRoot -Label $lbl *>$null }
            else           { & $snapTool -Label $lbl *>$null }
        } catch { }
    }

    $csv = Join-Path $Dir ("session-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + ".csv")
    "# game $gameVer, sampled every $IntervalSec s" | Set-Content -LiteralPath $csv
    "stamp,uptime_min,proc_ws_gb,proc_priv_gb,proc_gpu_gb,adapter_gpu_gb,free_ram_gb,handles,threads" | Add-Content -LiteralPath $csv
    $start = Get-Date

    while ($true) {
        $p = Get-Process -Name 'Cyberpunk2077' -ErrorAction SilentlyContinue
        if (-not $p) {
            "{0},{1},PROCESS_GONE,,,,,," -f (Get-Date -Format 'HH:mm:ss'),
                [math]::Round(((Get-Date) - $start).TotalMinutes, 1) | Add-Content -LiteralPath $csv
            Start-Sleep -Seconds 3   # the game writes its post-mortem as it goes
            $verdict = Save-PostMortem
            "{0},,{1},,,,,," -f (Get-Date -Format 'HH:mm:ss'), $verdict | Add-Content -LiteralPath $csv

            # ONLY ON A REAL CRASH. Save-PostMortem returns a "clean exit" line
            # when the post-mortem it found was already on file - the game
            # overwrites CrashInfo.json per crash but never deletes it, so every
            # normal quit re-presents the last crash. Preserving on that would
            # fill the vault with copies of one event and toast somebody who
            # simply stopped playing.
            if ($verdict -like 'CRASH *') {
                Write-Host "  preserving evidence before anything can overwrite it..." -ForegroundColor Cyan
                $dest = Invoke-AutoPreserve -Summary $verdict
                if ($dest) {
                    Write-Host "  preserved: $dest" -ForegroundColor Green
                    Show-CrashToast -Title 'Cyberwise - crash preserved' `
                        -Message "Logs and deployed list are saved. Safe to relaunch.`n$verdict"
                } else {
                    Show-CrashToast -Title 'Cyberwise - crash detected' `
                        -Message "Could not auto-preserve. Do NOT relaunch until the logs are saved."
                }
            }
            break
        }

        # Both counters are best-effort: they are absent on some drivers and a
        # missing sample must never take the watcher down mid-session.
        $ad = 0; $pg = 0
        try { $ad = ((Get-Counter '\GPU Adapter Memory(*)\Dedicated Usage' -ErrorAction Stop).CounterSamples |
                     Measure-Object CookedValue -Maximum).Maximum } catch {}
        try { $pg = ((Get-Counter '\GPU Process Memory(*)\Dedicated Usage' -ErrorAction Stop).CounterSamples |
                     Where-Object InstanceName -like "*$($p.Id)*" | Measure-Object CookedValue -Sum).Sum } catch {}
        $os = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue

        "{0},{1},{2},{3},{4},{5},{6},{7},{8}" -f (Get-Date -Format 'HH:mm:ss'),
            [math]::Round(((Get-Date) - $start).TotalMinutes, 1),
            [math]::Round($p.WorkingSet64 / 1GB, 2), [math]::Round($p.PrivateMemorySize64 / 1GB, 2),
            [math]::Round($pg / 1GB, 2), [math]::Round($ad / 1GB, 2),
            $(if ($os) { [math]::Round($os.FreePhysicalMemory / 1MB, 1) } else { '' }),
            $p.HandleCount, $p.Threads.Count | Add-Content -LiteralPath $csv

        Start-Sleep -Seconds $IntervalSec
    }

    $sessions++
    if ($MaxSessions -gt 0 -and $sessions -ge $MaxSessions) { break }
    Start-Sleep -Seconds 5
}
