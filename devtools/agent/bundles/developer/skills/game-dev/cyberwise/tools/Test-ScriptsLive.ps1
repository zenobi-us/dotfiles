# Test-ScriptsLive.ps1 -- is a script mod's code actually in the compiled bundle?
#
#     .\Test-ScriptsLive.ps1 -GameRoot '<path>'                  # the bundle, and what is stale
#     .\Test-ScriptsLive.ps1 -GameRoot '<path>' -Mod 'Audioware' # one mod
#     .\Test-ScriptsLive.ps1 -GameRoot '<path>' -All             # every script folder
#
# WHY THIS EXISTS
#
# "redscript compiled OK" is a statement about a LOG. This is a statement about
# the artefact the game loads. The two come apart constantly, and every way they
# do is silent:
#
#   - a script mod deployed since the last launch is not in the bundle yet, so
#     its code is not running even though every file is in place and enabled
#   - a compile TEST writes a bundle somewhere else entirely, and overwrites the
#     log that recorded the last real launch
#   - stale bundles from an older toolchain sit in the cache directory for months
#     looking exactly like the live one
#
# So this reads the log to find where the live bundle actually is, reads the
# bundle to see which symbols are in it, and compares both against the sources on
# disk. Nothing here is a guess about intent - it is what the last run wrote.
#
# It never writes to the install. It reads logs, one bundle and the .reds sources.

[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string] $GameRoot,

    # A folder name under r6\scripts, or a bare symbol (class/func) to look for.
    [string] $Mod,

    # Report every script folder rather than only the ones with nothing in the
    # bundle. Slow on a large install; the default answers the usual question.
    [switch] $All,

    # Check against a specific bundle instead of the one the log names. For
    # comparing a compile test's output against the live one.
    [string] $Bundle
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

$scriptDir = Join-Path $GameRoot 'r6\scripts'
$logDir    = Join-Path $GameRoot 'r6\logs'

# ------------------------------------------------------------------- logs ----

function Get-RedscriptRuns {
    <#
    .SYNOPSIS
        Every redscript run still on disk, newest first, with where it wrote.
    .DESCRIPTION
        THE FILENAME OF AN ARCHIVED LOG IS NOT THE TIME OF THE RUN INSIDE IT.
        redscript rotates by renaming the current log using the timestamp of the
        run that is displacing it, so `redscript_r2026-08-14_21-49-16.log`
        contains the run BEFORE that one - here, 2026-08-12 23:35. Verified
        across five consecutive rotations on one install: every file's first line
        matched the previous file's name, never its own.

        Reading the date off the filename therefore sends you to the wrong run,
        and the log you are shown looks perfectly plausible. The first line is
        the truth, so that is what this reads.
    #>
    param([string] $Dir)
    if (-not (Test-Path -LiteralPath $Dir)) { return @() }

    $runs = foreach ($f in (Get-ChildItem -LiteralPath $Dir -Filter 'redscript_r*.log' -File)) {
        $head = Get-Content -LiteralPath $f.FullName -TotalCount 1
        $when = $null
        if ($head -match '^\[\w+ - (.+?) [-+]\d{4}\]') {
            try { $when = [datetime]::Parse($matches[1], [Globalization.CultureInfo]::InvariantCulture) } catch { $when = $null }
        }
        if (-not $when) { $when = $f.LastWriteTime }

        $text   = Get-Content -LiteralPath $f.FullName -Raw
        $output = $null
        if ($text -match '(?m)Output successfully saved to (.+?)\s*$') { $output = $matches[1] }

        [pscustomobject]@{
            File     = $f.Name
            When     = $when
            Output   = $output
            Failed   = ($text -notmatch 'Compilation complete')
            Errors   = @([regex]::Matches($text, '(?m)^\[ERROR[^\]]*\]\s*(.+)$') | ForEach-Object { $_.Groups[1].Value })
        }
    }
    return @($runs | Sort-Object When -Descending)
}

# A game launch writes its bundle INSIDE the game directory - cybercmd's config
# builds the path from {game_dir}. A compile test writes somewhere else, usually
# a temp folder. Telling them apart matters because a test also overwrites
# redscript_rCURRENT.log, so the newest run on disk is frequently not the one
# that produced what the game is running.
#
# Inside-or-outside the game root, NOT "does the path look like a temp folder".
# The first version keyed on `\Temp\` and `scc_test`, which is not a property of
# being a test at all: a fixture (or a game) living under a temp path made every
# real launch look like a test, and the tool then reported no bundle at all.
function Test-IsOutsideGame {
    param([string] $Path)
    if (-not $Path) { return $true }
    try {
        $full = [IO.Path]::GetFullPath($Path)
        $root = [IO.Path]::GetFullPath($GameRoot).TrimEnd('\') + '\'
        return -not $full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)
    } catch { return $true }
}

$runs = Get-RedscriptRuns -Dir $logDir
if (-not $runs.Count) {
    Write-Warning "No redscript logs under $logDir - nothing has compiled here, or the logs were cleared."
}

$lastRun    = $runs | Select-Object -First 1
$lastLaunch = $runs | Where-Object { $_.Output -and -not (Test-IsOutsideGame $_.Output) } | Select-Object -First 1

# ----------------------------------------------------------------- bundle ----

if (-not $Bundle) {
    if ($lastLaunch) { $Bundle = $lastLaunch.Output }
    elseif ($lastRun -and $lastRun.Output) { $Bundle = $lastRun.Output }
}
if (-not $Bundle -or -not (Test-Path -LiteralPath $Bundle)) {
    Write-Host ''
    Write-Host 'SCRIPT BUNDLE' -ForegroundColor Cyan
    Write-Host "  no compiled bundle found$(if ($Bundle) { " at $Bundle" })" -ForegroundColor Red
    Write-Host '  Nothing that depends on a .reds mod is running. Launch the game once, then re-run this.'
    exit 1
}

# The .ts beside a bundle is a u64 of NANOSECONDS SINCE THE UNIX EPOCH, followed
# by eight reserved zero bytes. Verified against two independent bundles, each
# matching its own file mtime to the second. It is worth reading rather than
# trusting the mtime, because a redeploy can rewrite file times without anything
# having been compiled - and a .ts newer than the bundle beside it means exactly
# that: something stamped a build that did not produce this file.
function Get-BundleStamp {
    param([string] $BundlePath)
    $ts = [IO.Path]::ChangeExtension($BundlePath, '.ts')
    if (-not (Test-Path -LiteralPath $ts)) { return $null }
    $b = [IO.File]::ReadAllBytes($ts)
    if ($b.Length -lt 8) { return $null }
    $ns = [BitConverter]::ToUInt64($b, 0)
    if ($ns -eq 0) { return $null }
    return [DateTimeOffset]::FromUnixTimeMilliseconds([int64]($ns / 1000000)).LocalDateTime
}

$bundleItem  = Get-Item -LiteralPath $Bundle
$bundleStamp = Get-BundleStamp $Bundle
$built       = if ($bundleStamp) { $bundleStamp } else { $bundleItem.LastWriteTime }

Write-Host ''
Write-Host 'SCRIPT BUNDLE' -ForegroundColor Cyan
Write-Host "  file        $Bundle"
Write-Host ("  size        {0:N1} MB" -f ($bundleItem.Length / 1MB))
Write-Host "  built       $($built.ToString('yyyy-MM-dd HH:mm'))$(if (-not $bundleStamp) { '  (from file time - no .ts beside it)' })"

if ($bundleStamp -and [math]::Abs(($bundleStamp - $bundleItem.LastWriteTime).TotalMinutes) -gt 5) {
    Write-Host "  MISMATCH    the timestamp file says $($bundleStamp.ToString('yyyy-MM-dd HH:mm')) but this file was written $($bundleItem.LastWriteTime.ToString('yyyy-MM-dd HH:mm'))" -ForegroundColor Yellow
    Write-Host '              something stamped a build without producing this bundle - usually a compile test.' -ForegroundColor DarkYellow
}

if ($lastRun -and $lastLaunch -and $lastRun.File -ne $lastLaunch.File) {
    Write-Host ''
    Write-Host "  The most recent redscript run ($($lastRun.When.ToString('yyyy-MM-dd HH:mm'))) wrote to" -ForegroundColor DarkGray
    Write-Host "  $($lastRun.Output)" -ForegroundColor DarkGray
    Write-Host '  which is a compile test, not the game. The bundle above is from the last real launch.' -ForegroundColor DarkGray
}

if ($lastLaunch -and $lastLaunch.Failed) {
    Write-Host ''
    Write-Host '  THE LAST COMPILE DID NOT COMPLETE.' -ForegroundColor Red
    Write-Host '  Every .reds mod on this install is off - all of them, with no sign in game.' -ForegroundColor Red
    $lastLaunch.Errors | Select-Object -First 5 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkRed }
}

# ------------------------------------------------------------------ pool -----

# Symbols live in a null-terminated ASCII pool inside the bundle, stored as
# Module.Path.Symbol where the source declared a module, and bare where it did
# not. Probing for the bare name of a modularised symbol therefore reports a
# FALSE ABSENCE - two of the three "missing" mods in the first run of this were
# exactly that, and the mod was fine. Both forms are matched below.
Write-Host ''
Write-Host '  reading the bundle...' -ForegroundColor DarkGray -NoNewline
$text = [Text.Encoding]::ASCII.GetString([IO.File]::ReadAllBytes($Bundle))
$pool = [Collections.Generic.HashSet[string]]::new()
foreach ($m in [regex]::Matches($text, '[A-Za-z_][A-Za-z0-9_.]{2,}')) { [void]$pool.Add($m.Value) }
$tail = [Collections.Generic.HashSet[string]]::new()
foreach ($t in $pool) {
    $i = $t.LastIndexOf('.')
    if ($i -ge 0 -and $i -lt $t.Length - 1) { [void]$tail.Add($t.Substring($i + 1)) }
}
Write-Host " $($pool.Count) symbols" -ForegroundColor DarkGray

function Test-Symbol {
    param([string] $Name)
    return ($pool.Contains($Name) -or $tail.Contains($Name))
}

function Get-DeclaredSymbols {
    <#
    .SYNOPSIS
        Symbols a folder's sources declare, classified by whether their absence
        from the bundle would mean anything.
    .DESCRIPTION
        Two classes of symbol are absent from a healthy bundle, and reporting
        either as a fault is how a check earns itself an ignored reputation:

        CONDITIONAL. redscript has compile-time conditionals - `@if(ModuleExists
        ("AlternativeBerserk"))` above a class means it is compiled ONLY when
        that other mod is present. On the install this was written against, that
        exact line accounted for BlackChrome's "missing" class: the compatibility
        path is inactive because the mod it bridges to is not installed, which is
        correct behaviour and worth reporting as information rather than damage.

        TOO SHORT. Symbol extraction from a 35 MB blob needs a minimum token
        length or it matches noise, so a name under three characters cannot be
        confirmed either way. `func MM` in MutedMarkers is a real example. Say
        "cannot tell" rather than "absent".
    #>
    param([string] $Dir)

    # TOP-LEVEL DECLARATIONS ONLY - no leading whitespace. A method inside a
    # class is not a separate entry to look up, and treating it as one is where
    # most of the noise came from: an unused `private final func` never resolves
    # on its own and reads as a missing symbol, which flagged four working mods.
    $decl = '(?m)^(?:public\s+|private\s+|protected\s+|native\s+|abstract\s+|final\s+|persistent\s+|importonly\s+)*(?:class|struct|enum|func)\s+([A-Za-z_][A-Za-z0-9_]*)'
    $out = [ordered]@{ Firm = [Collections.Generic.HashSet[string]]::new()
                       Conditional = [Collections.Generic.HashSet[string]]::new()
                       Short = [Collections.Generic.HashSet[string]]::new() }

    foreach ($f in (Get-ChildItem -LiteralPath $Dir -Recurse -Filter *.reds -File -ErrorAction SilentlyContinue)) {
        $t = [IO.File]::ReadAllText($f.FullName)

        # STRIP COMMENTS FIRST. Mods document their own API in block comments -
        # WannabeEdgerunner lists five `public func` signatures inside a /** */
        # header - and a declaration matched there is a symbol the compiler never
        # saw. It then reads as "declared but missing from the bundle", which is
        # the exact false alarm this tool exists to avoid raising.
        $t = [regex]::Replace($t, '(?s)/\*.*?\*/', '')
        $t = [regex]::Replace($t, '(?m)^\s*//.*$', '')

        foreach ($m in [regex]::Matches($t, $decl)) {
            $name = $m.Groups[1].Value

            # Look back over the two lines above the declaration for an @if.
            # Attributes sit directly above what they gate, sometimes with a
            # @addMethod/@wrapMethod line between.
            $before = $t.Substring([Math]::Max(0, $m.Index - 240), [Math]::Min(240, $m.Index))
            $lines  = @($before -split "`r?`n" | Where-Object { $_.Trim() } | Select-Object -Last 2)
            $gated  = @($lines | Where-Object { $_ -match '^\s*@if\s*\(' }).Count -gt 0

            if ($name.Length -lt 3)  { [void]$out.Short.Add($name) }
            elseif ($gated)          { [void]$out.Conditional.Add($name) }
            else                     { [void]$out.Firm.Add($name) }
        }
    }
    return $out
}

# --------------------------------------------------------------- per-mod -----

function Show-Folder {
    param([IO.DirectoryInfo] $Dir, [switch] $Always)

    $d = Get-DeclaredSymbols $Dir.FullName
    $firm = @($d.Firm)
    if ($firm.Count -eq 0) {
        # A folder can legitimately declare nothing verifiable: @wrapMethod-only
        # patches and compile-fix stubs both look like this. Absence of symbols
        # is not absence of effect, so this is reported, never counted as broken.
        if ($Always) { Write-Host ("  {0,-45} nothing verifiable declared" -f $Dir.Name) -ForegroundColor DarkGray }
        return $null
    }

    $absent = @($firm | Where-Object { -not (Test-Symbol $_) })
    $newest = (Get-ChildItem -LiteralPath $Dir.FullName -Recurse -File -ErrorAction SilentlyContinue |
               Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime

    if ($absent.Count -eq 0) {
        if ($Always) {
            $extra = @()
            if ($d.Conditional.Count) { $extra += "$($d.Conditional.Count) conditional" }
            if ($d.Short.Count)       { $extra += "$($d.Short.Count) too short to check" }
            $note = if ($extra) { "  [$($extra -join ', ')]" } else { '' }
            Write-Host ("  {0,-45} live ({1} symbols){2}" -f $Dir.Name, $firm.Count, $note) -ForegroundColor DarkGreen
        }
        return $null
    }

    # Everything absent is the strong signal. A few absent out of many is usually
    # a conditional this parser did not attribute, so it is stated as a count and
    # not as a verdict.
    $whole = $absent.Count -eq $firm.Count
    Write-Host ("  {0,-45} {1} of {2} declared symbols are not in the bundle" -f $Dir.Name, $absent.Count, $firm.Count) `
        -ForegroundColor $(if ($whole) { 'Red' } else { 'Yellow' })
    Write-Host ("      e.g. {0}" -f (($absent | Select-Object -First 3) -join ', ')) -ForegroundColor DarkGray

    if ($newest -and $newest -gt $built) {
        Write-Host ("      deployed {0}, after this bundle was built - launch the game once and it compiles in" -f $newest.ToString('yyyy-MM-dd HH:mm')) -ForegroundColor DarkYellow
    } elseif ($whole) {
        Write-Host '      nothing it declares is in the bundle, and it predates the build - its code is not running' -ForegroundColor DarkRed
    } else {
        Write-Host '      partial: usually a @if(ModuleExists(...)) path for a mod you do not have' -ForegroundColor DarkGray
    }
    return $Dir.Name
}

if ($Mod) {
    $dir = Join-Path $scriptDir $Mod
    Write-Host ''
    if (Test-Path -LiteralPath $dir) {
        Write-Host "MOD: $Mod" -ForegroundColor Cyan
        $d = Get-DeclaredSymbols $dir
        if ($d.Firm.Count -eq 0 -and $d.Conditional.Count -eq 0 -and $d.Short.Count -eq 0) {
            Write-Host '  declares no classes or functions of its own.' -ForegroundColor DarkGray
            Write-Host '  A @wrapMethod-only patch looks like this and works fine - the bundle cannot confirm it either way.'
        } else {
            foreach ($s in (@($d.Firm) | Sort-Object)) {
                $ok = Test-Symbol $s
                Write-Host ("  {0,-45} {1}" -f $s, $(if ($ok) { 'in the bundle' } else { 'ABSENT' })) -ForegroundColor $(if ($ok) { 'DarkGreen' } else { 'Red' })
            }
            foreach ($s in (@($d.Conditional) | Sort-Object)) {
                $ok = Test-Symbol $s
                Write-Host ("  {0,-45} {1}" -f $s, $(if ($ok) { 'in the bundle (its @if condition held)' } else { 'not compiled - @if condition was false' })) -ForegroundColor DarkGray
            }
            foreach ($s in (@($d.Short) | Sort-Object)) {
                Write-Host ("  {0,-45} {1}" -f $s, 'too short to look up reliably') -ForegroundColor DarkGray
            }
        }
    } else {
        # Not a folder: treat it as a symbol. Someone reading a log or a mod page
        # has a class name far more often than a folder name.
        Write-Host "SYMBOL: $Mod" -ForegroundColor Cyan
        $matchesFound = @($pool | Where-Object { $_ -eq $Mod -or $_ -like "*.$Mod" } | Select-Object -First 8)
        if ($matchesFound) {
            $matchesFound | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGreen }
        } else {
            Write-Host "  not in the bundle, and no folder called '$Mod' under r6\scripts" -ForegroundColor Red
        }
    }
    exit 0
}

# ------------------------------------------------------------------ sweep ----

if (-not (Test-Path -LiteralPath $scriptDir)) {
    Write-Host ''
    Write-Host "  no r6\scripts directory - this install has no loose script mods" -ForegroundColor DarkGray
    exit 0
}

$folders = @(Get-ChildItem -LiteralPath $scriptDir -Directory)
Write-Host ''
Write-Host "SCRIPT MODS ($($folders.Count) folders)" -ForegroundColor Cyan

$flagged = @()
foreach ($d in $folders) {
    $r = Show-Folder -Dir $d -Always:$All
    if ($r) { $flagged += $r }
}

Write-Host ''
if ($flagged.Count) {
    Write-Host "$($flagged.Count) of $($folders.Count) script folders are not fully represented in the live bundle." -ForegroundColor Yellow
    Write-Host 'Most often that means they were installed after the last launch. Launch once, then re-run.' -ForegroundColor DarkGray
} else {
    Write-Host "Every script folder that declares a symbol has it in the live bundle." -ForegroundColor Green
}
exit 0
