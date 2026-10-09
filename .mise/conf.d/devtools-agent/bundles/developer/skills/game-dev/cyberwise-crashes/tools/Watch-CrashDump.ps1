# Watch-CrashDump.ps1 -- catch the exception the game swallows, and name the module.
#
#     .\Watch-CrashDump.ps1 -GameRoot '<path>'            # wait, attach, capture
#     .\Watch-CrashDump.ps1 -GameRoot '<path>' -Status
#
# WHY THIS EXISTS, AND WHY THE OBVIOUS ROUTE DOES NOT WORK
#
# Cyberpunk 2077 installs its own unhandled-exception filter. It catches the
# fault, writes CrashInfo.json, and exits cleanly - so from Windows' point of
# view nothing crashed. That is why Windows Error Reporting never fires for it
# and why %LOCALAPPDATA%\CrashDumps holds dumps for every other app on the
# machine and none for this one. Turning on WER LocalDumps does not help: the
# game's handler runs first and there is nothing left to report.
#
# A DEBUGGER SEES THE EXCEPTION FIRST. That is the whole trick. Attached, cdb
# gets the first-chance exception before the game's filter, so we can record the
# faulting module and stack and THEN hand it back with `gn` - the game carries
# on exactly as it would have, writes its own CrashInfo.json, and dies. Nothing
# is prevented and nothing is hidden; we just get to look on the way past.
#
# WHAT IT WRITES, and why not a full dump
#
# A full dump (`.dump /ma`) of this game is the size of its private working set -
# measured at 27-30 GB on this install. That is not a diagnostic, it is a disk
# problem. The stack, the module list and !analyze's verdict are what actually
# name a culprit, and they cost kilobytes. A MINIdump is written alongside for
# anything that needs revisiting.
#
# LIMITS, stated up front:
#   - It catches ACCESS VIOLATIONS. A crash that is not an AV (a fail-fast, a
#     stack overflow, a pure abort) will not trip this and the log will say so.
#   - First-chance means benign, handled AVs are also caught. Some engines throw
#     those routinely. If the log fills with them, the answer is not to widen the
#     filter but to read which one immediately precedes the process exiting.
#   - Attaching a debugger changes timing. A crash that depends on a race may
#     move or disappear. That is worth knowing before concluding it is "fixed".

[CmdletBinding()]
param(
    [string] $GameRoot,
    [string] $Dir,
    [string] $SymbolCache,

    # How long to wait for the game to appear before giving up.
    [int] $WaitMinutes = 120,

    # Attach to a game that is ALREADY running rather than waiting for a new one.
    [switch] $AttachNow,

    # The process to watch. Exists so this tool can be exercised against a
    # program that faults ON PURPOSE - a capture path that has never been shown
    # to catch anything is a capture path nobody should trust.
    [string] $ProcessName = 'Cyberpunk2077',

    # Keep going after the game exits, waiting for the next launch. A capture
    # tool that has to be remembered before every session is a capture tool that
    # is not running on the day it was needed - which is exactly what happened:
    # the crash this was built for arrived while nothing was attached.
    [switch] $Loop,

    [switch] $Status
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }

$ErrorActionPreference = 'Stop'

# $PSScriptRoot is EMPTY inside a param default on Windows PowerShell 5.1 when
# the script is run with -File or dot-sourced. Resolve here instead.
# See cyberwise/references/environment.md.
if (-not $Dir) {
    $Dir = Join-Path $env:USERPROFILE 'Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\crash-dumps'
}
if (-not $SymbolCache) { $SymbolCache = Join-Path $Dir '_symbols' }

# ------------------------------------------------------------------ the debugger --

# cdb ships inside the WinDbg package. The WindowsApps alias (cdbX64.exe) is on
# PATH for interactive shells but is an execution-alias reparse point, which some
# hosts refuse to launch - so prefer the real binary and fall back to the alias.
function Find-Cdb {
    $candidates = @()
    $pkg = Get-ChildItem 'C:\Program Files\WindowsApps' -Directory -Filter 'Microsoft.WinDbg_*' -ErrorAction SilentlyContinue |
           Sort-Object Name -Descending
    foreach ($p in $pkg) { $candidates += (Join-Path $p.FullName 'amd64\cdb.exe') }
    $candidates += (Join-Path $env:LOCALAPPDATA 'Microsoft\WindowsApps\cdbX64.exe')
    $candidates += 'cdb.exe'
    foreach ($c in $candidates) {
        if ($c -eq 'cdb.exe') {
            $cmd = Get-Command cdb.exe -ErrorAction SilentlyContinue
            if ($cmd) { return $cmd.Source }
        } elseif (Test-Path -LiteralPath $c) { return $c }
    }
    return $null
}

$cdb = Find-Cdb
if ($Status) {
    Write-Host "cdb        $(if ($cdb) { $cdb } else { 'NOT FOUND - install with: winget install Microsoft.WinDbg' })"
    Write-Host "dump dir   $Dir"
    $g = @(Get-Process -Name $ProcessName -ErrorAction SilentlyContinue)
    Write-Host "game       $(if ($g.Count) { "running (pid $($g[0].Id))" } else { 'not running' })"
    $me = $PID
    $att = @(Get-CimInstance Win32_Process -Filter "Name='cdb.exe'" -ErrorAction SilentlyContinue |
             Where-Object { $_.ProcessId -ne $me })
    Write-Host "debugger   $(if ($att.Count) { "attached (pid $($att[0].ProcessId))" } else { 'not attached' })"
    exit 0
}

if (-not $cdb) {
    throw "cdb.exe not found. Install it with:  winget install --id Microsoft.WinDbg"
}

New-Item -ItemType Directory -Path $Dir -Force | Out-Null
New-Item -ItemType Directory -Path $SymbolCache -Force | Out-Null

# ------------------------------------------------------------------ wait for it --

# One pass = wait for the game, attach, capture until it exits. With -Loop this
# repeats for ever, so the debugger is armed for every session rather than for
# the one somebody remembered to arm it for.
function Get-GamePid {
    $p = @(Get-Process -Name $ProcessName -ErrorAction SilentlyContinue)
    if ($p.Count) { return $p[0].Id }
    return $null
}

$gamePid = Get-GamePid
if ($gamePid -and -not $AttachNow) {
    Write-Warning "$ProcessName is already running (pid $gamePid)."
    Write-Warning "Attaching to a session that is already underway is fine, but pass -AttachNow to say so."
    exit 2
}

if (-not $gamePid) {
    Write-Host "waiting for $ProcessName (up to $WaitMinutes min) - start it now" -ForegroundColor Cyan
    $deadline = (Get-Date).AddMinutes($WaitMinutes)
    while (-not $gamePid -and (Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 3
        $gamePid = Get-GamePid
    }
    if (-not $gamePid) { Write-Warning "game never appeared; nothing to attach to"; exit 1 }
}

$stamp = (Get-Date).ToString('yyyyMMdd-HHmmss')
$log   = Join-Path $Dir "cdb-$stamp.log"
$dump  = Join-Path $Dir "av-$stamp.dmp"

# ------------------------------------------------------------------- the script --
#
# `gn` is the load-bearing word: GO, exception NOT handled. It hands the fault
# straight back to the game's own filter, so the game behaves exactly as it does
# without a debugger - same CrashInfo.json, same exit. We only read on the way
# past. Using `gh` instead would swallow the fault and change what the game does,
# which would be lying to the thing we are trying to measure.
#
# `k 60` is capped rather than `k` because a corrupted stack can otherwise walk
# for thousands of frames and bury the useful part.
# PATHS INSIDE THE sxe -c "..." STRING USE FORWARD SLASHES, and this is not a
# style choice. cdb treats backslash as an escape inside a quoted command, so a
# Windows path arrives mangled - the first test wrote "C:Users<TAB>ohuw..." and
# .dump failed with Win32 error 123. Forward slashes survive, Windows accepts
# them, and the quotes are escaped so a path containing spaces - which the
# default one does, "Saved Games" - is still passed as a single argument.
$dumpCdb = '\"' + $dump.Replace([char]92, [char]47) + '\"'

$cmds = @"
.echo ==CW== attached $stamp
.sympath srv*$SymbolCache*https://msdl.microsoft.com/download/symbols
.reload
sxe -c ".echo ==CW_AV==; .time; .echo --- faulting module ---; lmv a @rip; .echo --- stack ---; k 60; .echo --- registers ---; r; .echo --- analyze ---; !analyze -v; .echo --- writing minidump ---; .dump /m $dumpCdb; .echo ==CW_AV_END==; gn" av
.echo ==CW== armed, running
g
q
"@

$cmdFile = Join-Path $Dir "cdb-$stamp.txt"
[System.IO.File]::WriteAllText($cmdFile, $cmds, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "attaching cdb to pid $gamePid" -ForegroundColor Green
Write-Host "  log   $log" -ForegroundColor DarkGray
Write-Host "  dump  $dump (written only if an access violation occurs)" -ForegroundColor DarkGray
Write-Host "  the game is handed every fault back untouched - it will still crash exactly as it would have" -ForegroundColor DarkGray

# -g   do not break on the initial attach breakpoint
# -G   do not break on process exit
# -o   also debug child processes - off, we want this process only
& $cdb -p $gamePid -g -G -logo $log -cf $cmdFile

Write-Host ''
if ($Loop) {
    Write-Host 'game exited - waiting for the next launch (Ctrl+C to stop watching)' -ForegroundColor Cyan
}
if (Test-Path -LiteralPath $log) {
    $txt = Get-Content -LiteralPath $log -Raw
    if ($txt -match '==CW_AV==') {
        Write-Host "ACCESS VIOLATION captured. The faulting module is the first thing to read:" -ForegroundColor Yellow
        Write-Host "  $log" -ForegroundColor Yellow
    } else {
        Write-Host "no access violation was seen before the process ended." -ForegroundColor Cyan
        Write-Host "That is a finding, not a failure: this crash is not an AV, so it is" -ForegroundColor DarkGray
        Write-Host "something else - a fail-fast, an abort, or a clean exit path." -ForegroundColor DarkGray
    }
}
