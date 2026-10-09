# Register-CrashWatch.ps1 -- keep the crash watcher alive without a terminal.
#
#     .\Register-CrashWatch.ps1 -Dir <output folder> [-GameRoot <path>]  # install
#     .\Register-CrashWatch.ps1 -Status                                  # is it on?
#     .\Register-CrashWatch.ps1 -Remove                                  # uninstall
#     .\Register-CrashWatch.ps1 -Dir <...> -WhatIf                       # show, do nothing
#
# WHY THIS AND NOT "just run the watcher"
#
# A watcher launched from a shell dies with the shell, dies on reboot, and dies
# silently if it throws. None of that is visible - and an investigation that
# believes it is recording, and is not, is worse than one that knows it has no
# data. The next crash looks like it produced no telemetry.
#
# A scheduled task fixes all three: it starts at logon, restarts if it stops, and
# survives reboots. It needs no elevation for a per-user logon task, and no tray
# icon or background service to install.
#
# ALSO: AN ASSISTANT MAY NOT BE ABLE TO START THE WATCHER AT ALL. In a sandboxed
# or supervised tool session the process tree can be reaped when the call
# returns, so Start-Process reports success and leaves nothing running. Register
# it as a task instead and the problem disappears - the task scheduler owns the
# process, not the session.

[CmdletBinding(SupportsShouldProcess)]
param(
    [string] $Dir,
    [string] $GameRoot,
    [string] $TaskName = 'Cyberwise crash watch',
    [string] $RunValueName = 'Cyberwise crash watch',

    # The TRAY's own Run entry. It launches CyberwiseTray.exe, which starts the
    # watcher itself - a third autostart route this script does not own but must
    # be able to see, or it reports a perfectly good setup as unregistered.
    [string] $TrayRunValueName = 'Cyberwise',
    [int]    $IntervalSec = 15,
    [switch] $Status,
    [switch] $Remove
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$watcher = Join-Path $PSScriptRoot 'Watch-Crashes.ps1'

function Get-Task { Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue }

# ------------------------------------------------------------------- status --

$runKeyPath = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
function Get-RunEntry { (Get-ItemProperty -Path $runKeyPath -Name $RunValueName -ErrorAction SilentlyContinue).$RunValueName }
function Get-TrayRunEntry { (Get-ItemProperty -Path $runKeyPath -Name $TrayRunValueName -ErrorAction SilentlyContinue).$TrayRunValueName }

# A Run entry stores an ABSOLUTE PATH, and Windows says nothing whatsoever when
# that path stops existing - the icon simply never appears again. Checking the
# target is the whole point of reporting the entry at all.
function Test-RunTarget {
    param([string] $Value)
    if (-not $Value) { return $null }
    $exe = if ($Value -match '^"([^"]+)"') { $matches[1] } else { ($Value -split '\s+')[0] }
    [pscustomobject]@{ Path = $exe; Exists = (Test-Path -LiteralPath $exe) }
}

# Which COPY of the watcher is running decides whether it can snapshot at all.
# Watch-Crashes.ps1 resolves New-InstallSnapshot.ps1 from $PSScriptRoot; the
# installer also drops a flat copy in {app}, where that sibling does not exist.
# Run flat, the watcher works and silently takes no session-start snapshot - so
# "what changed since this last worked" has nothing to answer with, and nothing
# anywhere says so.
function Get-WatcherHealth {
    param([string] $CommandLine)
    if ($CommandLine -notmatch '-File\s+"?([^"]*Watch-Crashes\.ps1)"?') { return $null }
    $script = $matches[1]
    $sib = Join-Path (Split-Path -Parent $script) 'New-InstallSnapshot.ps1'
    [pscustomobject]@{ Script = $script; CanSnapshot = (Test-Path -LiteralPath $sib) }
}

if ($Status) {
    $t = Get-Task
    $run = Get-RunEntry
    $tray = Get-TrayRunEntry
    if (-not $t -and $run) {
        Write-Host "registered as a logon Run entry '$RunValueName'" -ForegroundColor Green
        Write-Host "  (starts at logon, but will NOT restart the watcher if it dies)" -ForegroundColor Yellow
        $tgt = Test-RunTarget $run
        if ($tgt -and -not $tgt.Exists) {
            Write-Host "  BUT its target no longer exists: $($tgt.Path)" -ForegroundColor Red
            Write-Host "  Windows reports nothing when this happens - it just stops starting." -ForegroundColor DarkGray
        }
    }
    # The tray is a legitimate third route. Reporting "not registered" while the
    # watcher is plainly running reads as "somebody started this by hand and it
    # is gone after a reboot" - which is the opposite of what is true.
    if (-not $t -and -not $run -and $tray) {
        Write-Host "started at logon by the Cyberwise tray ('$TrayRunValueName')" -ForegroundColor Green
        Write-Host "  (the tray owns the watcher - start and stop it from the tray menu)" -ForegroundColor DarkGray
        $tgt = Test-RunTarget $tray
        if ($tgt -and -not $tgt.Exists) {
            Write-Host "  BUT its target no longer exists: $($tgt.Path)" -ForegroundColor Red
            Write-Host "  Windows reports nothing when this happens - it just stops starting." -ForegroundColor DarkGray
        }
    }
    if (-not $t -and -not $run -and -not $tray) { Write-Host "not registered ('$TaskName')" -ForegroundColor Yellow }
    if (-not $t) {
        $live = @(Get-CimInstance Win32_Process -Filter "Name='powershell.exe' OR Name='pwsh.exe'" -ErrorAction SilentlyContinue |
                  Where-Object { $_.CommandLine -like '*-File*Watch-Crashes.ps1*' })
        Write-Host "process   $(if ($live.Count) { "running (pid $($live[0].ProcessId))" } else { 'NOT running' })" `
            -ForegroundColor $(if ($live.Count) { 'Green' } else { 'Yellow' })
        if ($live.Count) {
            $h = Get-WatcherHealth $live[0].CommandLine
            if ($h -and -not $h.CanSnapshot) {
                Write-Host "snapshot  NO - this copy cannot take one" -ForegroundColor Red
                Write-Host "  $($h.Script)" -ForegroundColor DarkGray
                Write-Host "  New-InstallSnapshot.ps1 is not beside it, so no session-start snapshot" -ForegroundColor DarkGray
                Write-Host "  is recorded and 'what changed since this worked' cannot be answered." -ForegroundColor DarkGray
            } elseif ($h) {
                Write-Host "snapshot  yes" -ForegroundColor Green
            }
        }
        exit 0
    }

    $info = Get-ScheduledTaskInfo -TaskName $TaskName -ErrorAction SilentlyContinue
    Write-Host "task      $TaskName" -ForegroundColor Green
    Write-Host "state     $($t.State)"
    if ($info) {
        Write-Host "last run  $($info.LastRunTime)   result $($info.LastTaskResult)"
        Write-Host "next run  $($info.NextRunTime)"
    }
    # Registered is not running: report the process separately, and match on the
    # -File argument. A bare 'Watch-Crashes.ps1' substring also matches the query
    # doing the asking, which reports a watcher that is not there.
    $live = @(Get-CimInstance Win32_Process -Filter "Name='powershell.exe' OR Name='pwsh.exe'" -ErrorAction SilentlyContinue |
              Where-Object { $_.CommandLine -like '*-File*Watch-Crashes.ps1*' })
    Write-Host "process   $(if ($live.Count) { "running (pid $($live[0].ProcessId))" } else { 'NOT running' })" `
        -ForegroundColor $(if ($live.Count) { 'Green' } else { 'Yellow' })
    exit 0
}

# ------------------------------------------------------------------- remove --

if ($Remove) {
    if (Get-RunEntry) {
        Remove-ItemProperty -Path $runKeyPath -Name $RunValueName -ErrorAction SilentlyContinue
        Write-Host "removed the logon Run entry '$RunValueName'" -ForegroundColor Green
    }
    if (-not (Get-Task)) { Write-Host "no scheduled task to remove"; exit 0 }
    if ($PSCmdlet.ShouldProcess($TaskName, 'unregister scheduled task')) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "removed '$TaskName'" -ForegroundColor Green
    }
    exit 0
}

# ----------------------------------------------------------------- register --

if (-not $Dir)                              { throw "-Dir is required (where session CSVs and crashinfo\ go)" }
if (-not (Test-Path -LiteralPath $watcher)) { throw "Watch-Crashes.ps1 not found beside this script: $watcher" }

# Resolve WITHOUT touching the disk. Resolve-Path needs the path to exist, and
# under -WhatIf the directory has not been created - which silently left $Dir
# empty and printed a preview of a command containing -Dir "". A preview that
# shows something other than what would run is worse than no preview.
$Dir = [IO.Path]::GetFullPath($Dir)
if ($GameRoot) {
    if (-not (Test-Path -LiteralPath $GameRoot)) { throw "-GameRoot does not exist: $GameRoot" }
    $GameRoot = [IO.Path]::GetFullPath($GameRoot)
}

# Creating the output folder is a prerequisite, not the operation being previewed,
# so it is exempt from -WhatIf. The task registration below is what -WhatIf gates.
if (-not (Test-Path -LiteralPath $Dir)) { New-Item -ItemType Directory -Path $Dir -Force -WhatIf:$false | Out-Null }

# Quote every path in the argument string. Start-Process -ArgumentList does NOT
# quote array elements, and the default game directory is "Cyberpunk 2077" - a
# path with a space. Getting this wrong makes the launch fail with "does not have
# a '.ps1' extension" and look, from outside, exactly like a platform limitation.
# That mistake cost real time on this project.
$args = @(
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden'
    '-File', "`"$watcher`""
    '-Dir',  "`"$Dir`""
    '-IntervalSec', $IntervalSec
)
if ($GameRoot) { $args += @('-GameRoot', "`"$((Resolve-Path -LiteralPath $GameRoot).Path)`"") }

$action  = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ($args -join ' ')
$trigger = New-ScheduledTaskTrigger -AtLogOn

# RestartCount/RestartInterval are the point of the exercise: a watcher that dies
# comes back by itself. ExecutionTimeLimit 0 = never kill it for running long.
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit (New-TimeSpan -Seconds 0)

if ($PSCmdlet.ShouldProcess($TaskName, "register logon task running $watcher")) {
    if (Get-Task) { Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false }

    # Register, then PROVE it. `| Out-Null` hides a non-terminating failure, and
    # this script previously printed "registered and started" over an "Access is
    # denied" that left nothing registered at all. Reporting success you have not
    # checked is the exact failure this skill warns about elsewhere; do not let
    # the tool that watches for crashes be the thing that lies about its state.
    try {
        Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
            -Description "Watches Cyberpunk 2077 for crashes and captures its post-mortem telemetry (cyberwise)." `
            -ErrorAction Stop | Out-Null
    } catch {
        # FALL BACK TO THE PER-USER RUN KEY. Task creation in the root folder
        # generally wants elevation, and this fails with "Access is denied" even
        # in the user's own session - observed on a normal desktop, not a
        # sandbox. HKCU\...\Run needs no elevation ever and is the ordinary
        # mechanism for a per-user autostart, so a denied task is a reason to use
        # the simpler thing rather than a reason to give up.
        #
        # What it loses: the task scheduler's restart-on-failure. A Run entry
        # starts the watcher once per logon and that is all. Say so, rather than
        # letting the user believe they got supervision they did not.
        Write-Warning "scheduled task refused ($($_.Exception.Message.Trim())) - falling back to a logon Run entry."
        $runKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
        $cmd    = "powershell.exe " + ($args -join ' ')
        try {
            New-ItemProperty -Path $runKey -Name $RunValueName -Value $cmd -PropertyType String -Force -ErrorAction Stop | Out-Null
            if (-not (Get-ItemProperty -Path $runKey -Name $RunValueName -ErrorAction SilentlyContinue)) {
                throw "the Run value is not there after writing it"
            }
            Write-Host "registered a logon Run entry '$RunValueName' instead" -ForegroundColor Green
            Write-Host "  NOTE: this starts the watcher at logon but will NOT restart it if it dies." -ForegroundColor Yellow
            Write-Host "  remove   .\Register-CrashWatch.ps1 -Remove"
            Write-Host "  output   $Dir"
            exit 0
        } catch {
            Write-Warning "the Run entry failed too: $($_.Exception.Message)"
        }

        throw ("could not register '$TaskName': $($_.Exception.Message)`n" +
               "Task creation can be blocked by policy, by a restricted/sandboxed session, or by an " +
               "account without the right. Run this from a normal PowerShell window; if it still fails, " +
               "start the watcher directly instead:`n" +
               "  Start-Process powershell.exe -WindowStyle Hidden -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','$watcher','-Dir','$Dir'`n" +
               "(quote both paths - the default game directory contains a space)")
    }

    if (-not (Get-Task)) { throw "Register-ScheduledTask reported no error but '$TaskName' does not exist afterwards." }

    try { Start-ScheduledTask -TaskName $TaskName -ErrorAction Stop }
    catch { Write-Warning "registered, but could not start it now: $($_.Exception.Message). It will start at next logon." }

    Write-Host "registered '$TaskName'" -ForegroundColor Green
    Write-Host "  output   $Dir"
    Write-Host "  check    .\Register-CrashWatch.ps1 -Status"
    Write-Host "  remove   .\Register-CrashWatch.ps1 -Remove"
} else {
    Write-Host "WhatIf: would register '$TaskName' running:" -ForegroundColor Yellow
    Write-Host "  powershell.exe $($args -join ' ')"
}
exit 0
