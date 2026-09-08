# Get-ToolIndex.ps1 -- every tool in the family, in one table.
#
#     .\Get-ToolIndex.ps1                 # print the table
#     .\Get-ToolIndex.ps1 -Write          # rewrite the block in cyberwise/SKILL.md
#     .\Get-ToolIndex.ps1 -Check          # exit 1 if SKILL.md is out of date
#
# WHY THIS EXISTS
#
# On 2026-08-22 I proposed building a preset decoder. The family had shipped one
# months earlier - `cyberwise-saves/tools/Decode-Preset.ps1`, with the exact
# `-Compare` mode being asked for. The routing table in SKILL.md even points at
# `cyberwise-saves` for "ACU appearance presets". The information was there; what
# was missing was a single place that answers **"does this already exist?"**
# without reading eleven skill files first.
#
# Building a second copy of a tool is worse than not building one. It splits the
# tests, and the next person finds whichever one they find.
#
# WHY IT IS GENERATED AND CHECKED
#
# A hand-maintained index would reproduce the same failure with extra steps: it
# would be right on the day it was written and quietly wrong afterwards, which is
# more dangerous than having none, because an index is trusted. So the table is
# derived from the tools on disk, and `-Check` runs in the test suite - a new
# tool that never reaches the index fails the build.

[CmdletBinding()]
param(
    # Repo root. Defaults to two levels above this script (skills\cyberwise\tools).
    [string] $Root,

    [switch] $Write,
    [switch] $Check
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot 'UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$ErrorActionPreference = 'Stop'

if (-not $Root) { $Root = Split-Path (Split-Path (Split-Path $PSScriptRoot)) }
$skillsDir = Join-Path $Root 'skills'
$skillMd   = Join-Path $skillsDir 'cyberwise\SKILL.md'

$startMark = '<!-- TOOL-INDEX:START -->'
$endMark   = '<!-- TOOL-INDEX:END -->'

# --- reading a tool's one-line purpose -------------------------------------
#
# Two header conventions are in use and both are fine; what matters is that a
# tool cannot be in the family without SAYING what it is for in its first lines.
#
#   <#\n.SYNOPSIS\n    <purpose>          - comment-based help
#   # Name.ps1 -- <purpose>               - plain comment, may wrap one line
function Get-ToolPurpose {
    param([string] $Path)

    $lines = Get-Content -LiteralPath $Path -TotalCount 12

    if ($lines[0] -match '^\s*<#') {
        for ($i = 1; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match '^\s*\.SYNOPSIS\s*$') {
                for ($j = $i + 1; $j -lt $lines.Count; $j++) {
                    $t = $lines[$j].Trim()
                    if ($t) { return $t }
                }
            }
        }
        return $null
    }

    # SCAN THE HEADER, NOT JUST ITS FIRST LINE.
    #
    # This read $lines[0] only, so a tool whose header opens with a "# ====="
    # banner - and several do - indexed as "(no purpose line in header)" no
    # matter how good the purpose line under it was. Test-Tools.ps1 checks the
    # same thing across the first twelve lines, so the two disagreed about what
    # a purpose line even IS: the test passed the tool, the generator filed it
    # as missing, and the index drifted from what the test expected forever.
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^#\s*[\w.-]+\.ps1\s+--\s+(.+)$') {
            $text = $matches[1].Trim()
            # A purpose that wraps continues on the next comment line. A line
            # that is blank, indented as a usage example, or a RULE OFF - the
            # "# =====" that closes a banner header - is not a continuation.
            # Missing that last one appended the banner to the description and
            # produced an index entry with a row of equals signs in it.
            if ($text -notmatch '[.?!]$' -and $i + 1 -lt $lines.Count -and
                $lines[$i + 1] -notmatch '^#\s*[=-]{4,}\s*$' -and
                $lines[$i + 1] -match '^#\s{1,3}(\S.*)$') {
                $text = "$text $($matches[1].Trim())"
            }
            return $text
        }
    }
    return $null
}

# --- collect ----------------------------------------------------------------
$rows = New-Object System.Collections.Generic.List[object]
foreach ($skillDir in (Get-ChildItem $skillsDir -Directory | Sort-Object Name)) {
    $toolsDir = Join-Path $skillDir.FullName 'tools'
    if (-not (Test-Path -LiteralPath $toolsDir)) { continue }
    foreach ($t in (Get-ChildItem $toolsDir -Filter *.ps1 -File | Sort-Object Name)) {
        $purpose = Get-ToolPurpose $t.FullName
        if (-not $purpose) { $purpose = '(no purpose line in header)' }
        $rows.Add([pscustomobject]@{
            Skill   = $skillDir.Name
            Tool    = $t.Name
            Path    = "$($skillDir.Name)/tools/$($t.Name)"
            Purpose = $purpose
        })
    }
}

$table = @()
$table += '| tool | skill | what it does |'
$table += '|---|---|---|'
foreach ($r in $rows) {
    # Escape pipes so a purpose containing one cannot break the table.
    $p = $r.Purpose -replace '\|', '\|'
    $table += "| ``$($r.Tool)`` | ``$($r.Skill)`` | $p |"
}
$tableText = ($table -join "`n")

# --- act --------------------------------------------------------------------
if (-not ($Write -or $Check)) {
    $tableText
    Write-Host ''
    Write-Host "$($rows.Count) tool(s) across $(@($rows | Group-Object Skill).Count) skill(s)" -ForegroundColor DarkGray
    return
}

if (-not (Test-Path -LiteralPath $skillMd)) { throw "not found: $skillMd" }
$md = Get-Content -LiteralPath $skillMd -Raw

$si = $md.IndexOf($startMark)
$ei = $md.IndexOf($endMark)
if ($si -lt 0 -or $ei -lt 0 -or $ei -lt $si) {
    throw "markers $startMark / $endMark not found in $skillMd - add them where the index should live"
}

$existing = $md.Substring($si + $startMark.Length, $ei - $si - $startMark.Length).Trim()

if ($Check) {
    # COMPARE THE CONTENT, NOT THE LINE ENDINGS.
    #
    # $existing comes off disk - CRLF after a normal checkout - while $tableText
    # is built here with LF. A raw -eq between them is a comparison of newline
    # conventions wearing the costume of a drift check, and it can only pass on a
    # machine where this tool wrote the file last, bypassing git. It reported
    # "same tools, changed description(s)" for six CI runs while every row was
    # byte-identical.
    $norm = { param($t) ($t -replace "`r`n", "`n").TrimEnd() }
    if ((& $norm $existing) -eq (& $norm $tableText)) {
        Write-Host "tool index is current ($($rows.Count) tools)" -ForegroundColor Green
        exit 0
    }
    Write-Host 'tool index in SKILL.md is out of date.' -ForegroundColor Red

    # Name what moved, rather than printing two tables and leaving the reader to
    # diff them by eye.
    $inMd   = [regex]::Matches($existing,  '(?m)^\| `([^`]+)`') | ForEach-Object { $_.Groups[1].Value }
    $onDisk = $rows.Tool
    foreach ($t in ($onDisk | Where-Object { $_ -notin $inMd })) { Write-Host "  missing from index: $t" -ForegroundColor Red }
    foreach ($t in ($inMd  | Where-Object { $_ -notin $onDisk })) { Write-Host "  indexed but gone:   $t" -ForegroundColor Red }
    if (($onDisk | Where-Object { $_ -notin $inMd }).Count -eq 0 -and
        ($inMd   | Where-Object { $_ -notin $onDisk }).Count -eq 0) {
        Write-Host '  same tools, changed description(s)' -ForegroundColor Yellow
    }
    Write-Host '  fix: .\Get-ToolIndex.ps1 -Write' -ForegroundColor DarkGray
    exit 1
}

$new = $md.Substring(0, $si + $startMark.Length) + "`n" + $tableText + "`n" + $md.Substring($ei)
# `-Encoding utf8NoBOM` DOES NOT EXIST on Windows PowerShell 5.1 and throws
# there; `-Encoding UTF8` means *with* a BOM on 5.1, which is how three
# invisible bytes end up in front of `---` and stop a front-matter parser. Write
# through an explicit no-BOM encoder instead. The path is made absolute first
# because [System.IO.File] resolves a relative path against .NET's own current
# directory, which is not PowerShell's.
$skillMdFull = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($skillMd)
[System.IO.File]::WriteAllText($skillMdFull, $new, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "wrote $($rows.Count) tool(s) into $skillMd" -ForegroundColor Green
