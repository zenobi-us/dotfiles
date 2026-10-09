<#
.SYNOPSIS
    Check (and optionally repair) the Cyberpunk 2077 archive load order.

.DESCRIPTION
    Three independent checks against archive\pc\mod\modlist.txt:

      1. INVENTORY  - entries listed with no file on disk (stale), and archives
                      on disk with no entry (unlisted). Unlisted archives cannot
                      be positioned at all, so they are a silent failure.

      2. PRECEDENCE - the standing "X must load before Y" rules in $Rules below.
                      EARLIER IN modlist.txt WINS (verified 2026-08-09 against a
                      conflict checker on three independent collisions). This is
                      the opposite of the usual "zzz_ prefix wins" intuition.

      3. COLLISIONS - parses every .archive index and reports which archives lose
                      files to which. Flags INERT archives: every file they carry
                      is owned by something earlier, so the mod is installed,
                      enabled, and doing absolutely nothing. This is the trap that
                      silently ate the Arasaka monowire retex twice, because
                      whatever rewrites modlist.txt APPENDS new archives at the
                      end -- and the end is the bottom of the priority stack.

    Run this after ANY Vortex change: install, uninstall, or variant swap.

.PARAMETER Fix
    Apply repairs: reorder to satisfy the rules, and place unlisted archives next
    to their closest-named sibling. Backs up modlist.txt first. Without this the
    script only reports.

.PARAMETER PruneStale
    Also delete entries whose archive is missing. Off by default on purpose: a
    stale line holds the slot for a mod you have merely disabled, so it keeps its
    position if you re-enable it.

.PARAMETER SkipScan
    Skip the collision scan (checks 1 and 2 only). The scan reads 680 archive
    indices in about 7 seconds, so you rarely want this.

.EXAMPLE
    .\Repair-LoadOrder.ps1
    .\Repair-LoadOrder.ps1 -Fix
#>
[CmdletBinding()]
param(
    [string] $ModDir,
    [string] $RulesFile,

    # Where modlist.txt backups are written. Defaults to the user's save-game
    # vault for a REAL install, and to <root>\_loadorder\modlist-backups for
    # anything else - see the derivation below.
    [string] $BackupDir,

    [switch] $Fix,
    [switch] $PruneStale,
    [switch] $SkipScan,
    # Leave REDmod archives out of the scan. They are included by default,
    # because excluding them silently was the bug.
    [switch] $SkipRedmod,
    # Name the files one archive loses, and to whom - and what it beats. Needs
    # the vendored resource-path table to turn hashes into paths; without it the
    # relationships still print, as hashes.
    [string] $Explain
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# WHERE THE INSTALL IS. Steam, GOG and Epic all install elsewhere and the drive
# is the user's choice, so never assume a path - read the storefront's own
# record and confirm the exe is actually there.
# ---------------------------------------------------------------------------
if (-not $ModDir) {
    $seen = New-Object System.Collections.Generic.List[string]
    try {
        $steam = (Get-ItemProperty 'HKLM:\SOFTWARE\WOW6432Node\Valve\Steam' -ErrorAction SilentlyContinue).InstallPath
        if ($steam) {
            $seen.Add((Join-Path $steam 'steamapps\common\Cyberpunk 2077'))
            $vdf = Join-Path $steam 'steamapps\libraryfolders.vdf'
            if (Test-Path -LiteralPath $vdf) {
                foreach ($m in [regex]::Matches((Get-Content -LiteralPath $vdf -Raw), '"path"\s+"([^"]+)"')) {
                    $seen.Add((Join-Path ($m.Groups[1].Value -replace '\\\\','\') 'steamapps\common\Cyberpunk 2077'))
                }
            }
        }
    } catch {}
    foreach ($k in 'HKLM:\SOFTWARE\WOW6432Node\GOG.com\Games\1423049311','HKLM:\SOFTWARE\GOG.com\Games\1423049311') {
        try { $g = (Get-ItemProperty $k -ErrorAction SilentlyContinue).path; if ($g) { $seen.Add($g) } } catch {}
    }
    foreach ($p in $seen) {
        if ($p -and (Test-Path -LiteralPath (Join-Path $p 'bin\x64\Cyberpunk2077.exe'))) {
            $ModDir = Join-Path $p 'archive\pc\mod'; break
        }
    }
}
if (-not $ModDir -or -not (Test-Path -LiteralPath $ModDir)) {
    throw "Could not find archive\pc\mod. Pass -ModDir 'X:\...\Cyberpunk 2077\archive\pc\mod'."
}

# ---------------------------------------------------------------------------
# YOUR standing decisions live in a separate file, not in this script.
#
#   <ModDir>\..\..\..\_loadorder\loadorder-rules.psd1     (or pass -RulesFile)
#
# It is deliberately EMPTY here. Precedence rules are one person's settled
# conflicts on one load order; shipping somebody else's would silently reorder
# an install that never had those mods. Write the file as:
#
#   @{
#       Rules = @(
#           @{ Before = 'specific_retex.archive'
#              After  = 'catch_all_aio.archive'
#              Why    = 'AIO should lose to anything specific' }
#
#           # Either side may be a WILDCARD (* or ?), matched against the
#           # archives present and expanded to one rule per match. Use this for
#           # any mod whose archive is renamed when you switch variant - a skin
#           # tone, a hair colour - so the rule survives the swap instead of
#           # quietly ceasing to apply:
#           @{ Before = 'SkinTone_BODY_*.archive'
#              After  = 'catch_all_aio.archive'
#              Why    = 'whichever tone is installed still beats the AIO' }
#       )
#       BenignInert      = @{ 'some.archive' = 'why this being inert is fine' }
#       RuntimeGenerated = @{ 'other.archive' = 'why this appears and vanishes' }
#   }
# ---------------------------------------------------------------------------
$Rules = @()

# Facts about PUBLIC mods, true on any install that has them - as distinct from
# one user's preferences, which belong in the rules file above.
$RuntimeGenerated = @{
    'dynamic_moon_phases.archive' =
        'written at runtime by bin\x64\plugins\dynamic_moon_phases.asi from its .luna phase textures. It ships NO archive in staging, so it appears and vanishes with game sessions - never prune its entry as stale. It still needs a permanent slot: unlisted archives sort last and would lose the moon texture.'
}

$BenignInert = @{
    'SkillfulAttributes.archive' =
        'Skillful and Skillful Attributes are companion mods, not rivals - Skillful guards its settings with @if(!ModuleExists("SBAConfig")). Both archives carry the same single localization string, so either copy works.'
}

# Merge in the user's own file, if there is one.
if (-not $RulesFile) { $RulesFile = Join-Path (Split-Path (Split-Path (Split-Path $ModDir))) '_loadorder\loadorder-rules.psd1' }
if (Test-Path -LiteralPath $RulesFile) {
    try {
        $userRules = Import-PowerShellDataFile -LiteralPath $RulesFile
        if ($userRules.Rules)            { $Rules = @($userRules.Rules) }
        if ($userRules.BenignInert)      { foreach ($k in $userRules.BenignInert.Keys)      { $BenignInert[$k]      = $userRules.BenignInert[$k] } }
        if ($userRules.RuntimeGenerated) { foreach ($k in $userRules.RuntimeGenerated.Keys) { $RuntimeGenerated[$k] = $userRules.RuntimeGenerated[$k] } }
        Write-Host "rules file: $RulesFile ($($Rules.Count) precedence rule(s))" -ForegroundColor DarkGray
    } catch {
        Write-Warning "could not read $RulesFile : $($_.Exception.Message)"
    }
} else {
    Write-Host "no rules file at $RulesFile - precedence check will pass trivially" -ForegroundColor DarkGray
}

# ---------------------------------------------------------------------------
# .archive index reader. Header: magic 'RDAR' u32, version u32,
# indexPosition u64, indexSize u32. At indexPosition: fileTableOffset u32,
# fileTableSize u32, crc u64, fileEntryCount u32, fileSegmentCount u32,
# resourceDependencyCount u32 (28 bytes), then fileEntryCount * 56-byte entries
# whose first 8 bytes are the FNV1a-64 name hash. File data is Oodle-compressed;
# only the index is readable without a decompressor.
# ---------------------------------------------------------------------------
function Get-ArchiveHashes {
    param([string] $Path)
    $fs = [IO.File]::Open($Path, 'Open', 'Read', 'ReadWrite')
    try {
        $br = New-Object IO.BinaryReader($fs)
        if ([Text.Encoding]::ASCII.GetString($br.ReadBytes(4)) -ne 'RDAR') { return $null }
        $null = $br.ReadUInt32()
        $indexPosition = $br.ReadUInt64()
        $null = $br.ReadUInt32()
        $fs.Position = [int64] $indexPosition
        $null = $br.ReadUInt32(); $null = $br.ReadUInt32(); $null = $br.ReadUInt64()
        $count = $br.ReadUInt32()
        $null = $br.ReadUInt32(); $null = $br.ReadUInt32()
        $out = New-Object 'System.Collections.Generic.List[UInt64]'
        for ($i = 0; $i -lt $count; $i++) {
            $e = $br.ReadBytes(56)
            if ($e.Length -lt 56) { break }
            $out.Add([BitConverter]::ToUInt64($e, 0))
        }
        return $out
    } finally { $fs.Dispose() }
}

function Write-Section { param([string] $Text) Write-Host "`n=== $Text ===" -ForegroundColor Cyan }
function Write-Ok      { param([string] $Text) Write-Host "  OK   $Text" -ForegroundColor DarkGray }
function Write-Warn    { param([string] $Text) Write-Host "  WARN $Text" -ForegroundColor Yellow }
function Write-Bad     { param([string] $Text) Write-Host "  BAD  $Text" -ForegroundColor Red }

$listPath = Join-Path $ModDir 'modlist.txt'
if (-not (Test-Path -LiteralPath $listPath)) { throw "modlist.txt not found at $listPath" }

# Backups go with the other install records, NOT beside this script.
#
# $PSScriptRoot here is inside the skill - which is a link into a repo, or into
# an installed copy. Writing backups there means they land in somebody's git
# clone, or disappear when the skill is reinstalled or unlinked. A backup that
# lives inside the thing that gets replaced is not a backup.
#
# modlist.txt is a deliberate custom order that nothing else can reconstruct, so
# this one matters more than most.
# WHERE THIS GOES IS DERIVED FROM -ModDir, NOT FROM THE USER PROFILE.
#
# It used to be a fixed path under %USERPROFILE%. That meant EVERY run wrote
# there - including every run against a test sandbox. On 2026-08-22 the real
# vault was found holding 415 junk backups, 411 of them twelve bytes containing
# "aio.archive": the test suite's fixture, written into a live user's backups by
# the suite that was supposed to prove the tool safe.
#
# Worse than the clutter is what it does to the backups that matter. The vault is
# the only copy of a hand-built 744-line load order, and burying it under
# hundreds of fixtures is how the real one stops being findable.
#
# So: a sandbox backs up beside the sandbox, and the real install backs up where
# it always did. -BackupDir still overrides both.
if (-not $BackupDir) {
    $gameRoot = Split-Path (Split-Path (Split-Path $ModDir))   # <root>\archive\pc\mod
    $realSaved = Join-Path $env:USERPROFILE 'Saved Games\CD Projekt Red\Cyberpunk 2077'
    $isRealInstall = Test-Path -LiteralPath (Join-Path $gameRoot 'bin\x64\Cyberpunk2077.exe')
    $BackupDir = if ($isRealInstall -and (Test-Path -LiteralPath $realSaved)) {
        Join-Path $realSaved 'Cyberwise\modlist-backups'
    } else {
        Join-Path $gameRoot '_loadorder\modlist-backups'
    }
}
$backupDir = $BackupDir
$lines     = [System.Collections.Generic.List[string]](Get-Content -LiteralPath $listPath)
$onDisk    = (Get-ChildItem -LiteralPath $ModDir -Filter *.archive).Name
$dirty     = $false
$problems  = 0

Write-Host "modlist.txt : $($lines.Count) entries"
Write-Host "on disk     : $($onDisk.Count) .archive files"

# --- 1. inventory -----------------------------------------------------------
Write-Section 'INVENTORY'

foreach ($rg in $RuntimeGenerated.Keys) {
    if (($lines -contains $rg) -or ($onDisk -contains $rg)) {
        Write-Host "  INFO runtime-generated: $rg" -ForegroundColor DarkGray
        Write-Host "         $($RuntimeGenerated[$rg])" -ForegroundColor DarkGray
    }
}
# Runtime-generated archives keep their slot even when the file is absent, so they
# are exempt from the stale check -- but they still get listed and positioned.
$stale = @($lines | Where-Object { $_.Trim() -and -not $RuntimeGenerated.ContainsKey($_) -and -not (Test-Path -LiteralPath (Join-Path $ModDir $_)) })
if ($stale.Count -eq 0) { Write-Ok 'no stale entries' }
else {
    foreach ($s in $stale) { Write-Warn "listed but missing: $s" }
    if ($PruneStale) {
        foreach ($s in $stale) { $null = $lines.Remove($s) }
        $dirty = $true
        Write-Host "       -> pruned $($stale.Count) stale entr$(if($stale.Count -eq 1){'y'}else{'ies'})" -ForegroundColor Green
    } else {
        Write-Host '       (kept - a stale line holds the slot for a disabled mod. -PruneStale to remove)' -ForegroundColor DarkGray
    }
}

$unlisted = @($onDisk | Where-Object { $lines -notcontains $_ })
if ($unlisted.Count -eq 0) { Write-Ok 'no unlisted archives' }
else {
    $problems += $unlisted.Count
    foreach ($u in $unlisted) { Write-Bad "on disk but unlisted (cannot be positioned): $u" }
    if ($Fix) {
        foreach ($u in $unlisted) {
            # place next to the closest-named listed sibling, else append
            $best = $null; $bestLen = 0
            foreach ($cand in $lines) {
                if (-not $cand.Trim()) { continue }
                $n = 0
                while ($n -lt $cand.Length -and $n -lt $u.Length -and $cand[$n] -eq $u[$n]) { $n++ }
                if ($n -gt $bestLen) { $bestLen = $n; $best = $cand }
            }
            if ($best -and $bestLen -ge 8) {
                $lines.Insert($lines.IndexOf($best) + 1, $u)
                Write-Host "       -> placed after sibling '$best' (matched $bestLen chars)" -ForegroundColor Green
            } else {
                $lines.Add($u)
                Write-Warn "       -> no sibling found; APPENDED at the end, where it loses every conflict. Position it yourself."
            }
        }
        $dirty = $true
    }
}

# --- 2. precedence ----------------------------------------------------------
Write-Section 'PRECEDENCE RULES'

function Get-Index { param($List) $h = @{}; for ($i = 0; $i -lt $List.Count; $i++) { $h[$List[$i]] = $i }; return $h }

# A rule name containing * or ? is a PATTERN. It is matched against the entries
# actually present and expands to one concrete rule per match, so everything
# downstream still deals only in exact names.
#
# The reason this exists: tone- and variant-selectable mods rename their archive
# on every swap (##_Arkhe_UniversalSkinTone_BODY_PALE -> ..._BODY_FAIR). An
# exact-name rule stops applying the instant the name changes, and it fails
# SILENTLY - the archive is merely reported unlisted, and unlisted sorts LAST,
# which is exactly where a skin texture must not be. A pattern follows the swap.
#
# Caveat worth knowing when writing one: -like treats [ ] in the PATTERN as a
# character class. Archive names full of #, !, ~ and & are fine; a literal
# bracket in a pattern needs escaping as `[.
function Expand-Rules {
    param($Rules, $Entries, [int] $MaxPairs = 200)

    $out = New-Object System.Collections.Generic.List[object]
    foreach ($r in $Rules) {
        if (($r.Before -notmatch '[*?]') -and ($r.After -notmatch '[*?]')) { $out.Add($r); continue }

        $befores = if ($r.Before -match '[*?]') { @($Entries | Where-Object { $_ -like $r.Before }) } else { @($r.Before) }
        $afters  = if ($r.After  -match '[*?]') { @($Entries | Where-Object { $_ -like $r.After  }) } else { @($r.After)  }

        if ($befores.Count -eq 0 -or $afters.Count -eq 0) {
            Write-Ok ("skipped (pattern matched nothing): {0} -> {1}" -f $r.Before, $r.After)
            continue
        }
        # A pattern broad enough to pair hundreds of archives is a typo, not an
        # intention. Refuse it rather than reordering the whole load order.
        if ($befores.Count * $afters.Count -gt $MaxPairs) {
            Write-Bad ("pattern too broad ({0} x {1} pairs): {2} -> {3}" -f $befores.Count, $afters.Count, $r.Before, $r.After)
            continue
        }
        foreach ($b in $befores) {
            foreach ($a in $afters) {
                if ($b -eq $a) { continue }
                $out.Add(@{
                    Before = $b
                    After  = $a
                    Why    = "$($r.Why) [pattern: $($r.Before) -> $($r.After)]"
                })
            }
        }
    }
    return $out
}

$Rules = @(Expand-Rules -Rules $Rules -Entries $lines)

$violations = @()
$idx = Get-Index $lines
foreach ($r in $Rules) {
    $hasA = $idx.ContainsKey($r.Before); $hasB = $idx.ContainsKey($r.After)
    if (-not $hasA -or -not $hasB) { Write-Ok "skipped (archive absent): $($r.Before) -> $($r.After)"; continue }
    if ($idx[$r.Before] -lt $idx[$r.After]) {
        Write-Ok ("{0} ({1}) before {2} ({3})" -f $r.Before, ($idx[$r.Before] + 1), $r.After, ($idx[$r.After] + 1))
    } else {
        $violations += $r
        Write-Bad ("{0} ({1}) must precede {2} ({3})" -f $r.Before, ($idx[$r.Before] + 1), $r.After, ($idx[$r.After] + 1))
        Write-Host "       why: $($r.Why)" -ForegroundColor DarkGray
    }
}

if ($violations.Count -gt 0) {
    $problems += $violations.Count
    if ($Fix) {
        for ($pass = 0; $pass -lt 50; $pass++) {
            $idx = Get-Index $lines
            $bad = @($Rules | Where-Object {
                $idx.ContainsKey($_.Before) -and $idx.ContainsKey($_.After) -and $idx[$_.Before] -gt $idx[$_.After] })
            if ($bad.Count -eq 0) { break }
            $r = $bad[0]
            $null = $lines.Remove($r.Before)
            $lines.Insert($lines.IndexOf($r.After), $r.Before)
            $dirty = $true
        }
        $idx = Get-Index $lines
        $left = @($Rules | Where-Object {
            $idx.ContainsKey($_.Before) -and $idx.ContainsKey($_.After) -and $idx[$_.Before] -gt $idx[$_.After] })
        if ($left.Count -eq 0) { Write-Host "       -> all rules satisfied" -ForegroundColor Green }
        else { Write-Bad "       -> could not satisfy $($left.Count) rule(s); they may contradict each other" }
    }
}

# --- write ------------------------------------------------------------------
if ($dirty) {
    if (-not (Test-Path -LiteralPath $backupDir)) { $null = New-Item -ItemType Directory -Path $backupDir }
    $bak = Join-Path $backupDir ("modlist.{0}.bak" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
    Copy-Item -LiteralPath $listPath -Destination $bak
    # `-Encoding utf8NoBOM` DOES NOT EXIST on Windows PowerShell 5.1 and throws
    # there; `-Encoding UTF8` means *with* a BOM on 5.1, which is how three
    # invisible bytes end up in front of `---` and stop a front-matter parser. Write
    # through an explicit no-BOM encoder instead. The path is made absolute first
    # because [System.IO.File] resolves a relative path against .NET's own current
    # directory, which is not PowerShell's.
    $listFull = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($listPath)
    [System.IO.File]::WriteAllLines($listFull, [string[]] $lines, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "`nmodlist.txt written. Backup: $bak" -ForegroundColor Green
    $dupes = @($lines | Group-Object | Where-Object Count -gt 1)
    if ($dupes.Count) { Write-Bad "duplicate entries introduced: $($dupes.Name -join ', ')" }
}
elseif ($Fix) { Write-Host "`nnothing to change." -ForegroundColor DarkGray }

# --- 3. collisions ----------------------------------------------------------
if (-not $SkipScan) {
    Write-Section 'COLLISION SCAN'
    $sw = [Diagnostics.Stopwatch]::StartNew()
    $lines = [System.Collections.Generic.List[string]](Get-Content -LiteralPath $listPath)
    $idx = Get-Index $lines
    # Sort-Object binds $_ inside the scriptblock; unlisted archives sort last.
    $rank = { if ($null -ne $_ -and $idx.ContainsKey($_)) { $idx[$_] } else { [int]::MaxValue } }

    $owner = @{}
    $total = @{}
    $domain = @{}     # archive name -> 'loose' or 'redmod'

    foreach ($f in (Get-ChildItem -LiteralPath $ModDir -Filter *.archive)) {
        $hs = Get-ArchiveHashes $f.FullName
        if ($null -eq $hs) { Write-Warn "unreadable (not RDAR): $($f.Name)"; continue }
        $total[$f.Name] = $hs.Count
        $domain[$f.Name] = 'loose'
        foreach ($h in $hs) {
            if (-not $owner.ContainsKey($h)) { $owner[$h] = New-Object 'System.Collections.Generic.List[string]' }
            $owner[$h].Add($f.Name)
        }
    }

    # REDMOD ARCHIVES LIVE SOMEWHERE ELSE ENTIRELY, and until now this scan did
    # not look at them. That is an unstated boundary rather than a wrong answer,
    # and it is the worse kind: a report saying "no unexplained inert archives"
    # was making a claim about `archive\pc\mod` while `mods\<name>rchives`
    # sat outside its view. A REDmod can win or lose a file without appearing in
    # any report the user runs.
    #
    # They are a SEPARATE PRECEDENCE DOMAIN. `modlist.txt` does not order them -
    # REDmod deploy does, and this tool does not establish which domain wins a
    # file contested across both. So they are scanned, reported, and explicitly
    # NOT ranked against loose archives. Naming a winner here would be a guess
    # wearing a verdict's clothing.
    $redmodRoot = $null
    if (-not $SkipRedmod) {
        $gameRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $ModDir))
        $candidate = Join-Path $gameRoot 'mods'
        if (Test-Path -LiteralPath $candidate) { $redmodRoot = $candidate }
    }
    if ($redmodRoot) {
        foreach ($f in (Get-ChildItem -LiteralPath $redmodRoot -Recurse -Filter *.archive -File -ErrorAction SilentlyContinue)) {
            # Name it by its REDmod folder, because the bare filename collides
            # with the loose copy constantly - the same mod shipped both ways is
            # exactly the case this has to describe clearly.
            $rel = $f.FullName.Substring($redmodRoot.Length + 1)
            $key = "redmod:" + ($rel.Split([char]92)[0]) + "/" + $f.Name
            $hs = Get-ArchiveHashes $f.FullName
            if ($null -eq $hs) { Write-Warn "unreadable (not RDAR): $key"; continue }
            $total[$key] = $hs.Count
            $domain[$key] = 'redmod'
            foreach ($h in $hs) {
                if (-not $owner.ContainsKey($h)) { $owner[$h] = New-Object 'System.Collections.Generic.List[string]' }
                $owner[$h].Add($key)
            }
        }
    }

    $lost = @{}
    $crossDomain = @{}
    foreach ($kv in $owner.GetEnumerator()) {
        if ($kv.Value.Count -lt 2) { continue }

        # A file claimed in both domains cannot be ranked by modlist.txt, which
        # only orders one of them. Record it and move on rather than inventing a
        # winner - see the note above.
        $domains = @($kv.Value | ForEach-Object { $domain[$_] } | Select-Object -Unique)
        if ($domains.Count -gt 1) {
            $crossDomain[$kv.Key] = @($kv.Value)
            continue
        }

        $ranked = $kv.Value | Sort-Object $rank
        foreach ($l in $ranked[1..($ranked.Count - 1)]) {
            if (-not $lost.ContainsKey($l)) { $lost[$l] = @{ Count = 0; To = @{}; Hashes = @{} } }
            $lost[$l].Count++
            $lost[$l].To[$ranked[0]] = 1 + $lost[$l].To[$ranked[0]]
            # Keep the hashes, not just the tally. Naming the FILE is the whole
            # point of a conflict report - "3 of 16 lost" tells a user nothing
            # they can act on, and this is the data that turns it into a path.
            if (-not $lost[$l].Hashes.ContainsKey($ranked[0])) {
                $lost[$l].Hashes[$ranked[0]] = New-Object 'System.Collections.Generic.List[UInt64]'
            }
            $lost[$l].Hashes[$ranked[0]].Add($kv.Key)
        }
    }

    Write-Host ("scanned {0} archives in {1:N1}s; {2} distinct resources" -f $total.Count, $sw.Elapsed.TotalSeconds, $owner.Count)

    $allInert = @($lost.Keys | Where-Object { $total[$_] -gt 0 -and $lost[$_].Count -ge $total[$_] } | Sort-Object $rank)
    $benign   = @($allInert | Where-Object { $BenignInert.ContainsKey($_) })
    $inert    = @($allInert | Where-Object { -not $BenignInert.ContainsKey($_) })

    foreach ($b in $benign) {
        Write-Host "  INFO inert but known harmless: $b" -ForegroundColor DarkGray
        Write-Host "         $($BenignInert[$b])" -ForegroundColor DarkGray
    }

    if ($inert.Count -eq 0) { Write-Ok 'no unexplained inert archives' }
    else {
        $problems += $inert.Count
        foreach ($i in $inert) {
            $pos = if ($idx.ContainsKey($i)) { $idx[$i] + 1 } else { 'UNLISTED' }
            Write-Bad "INERT: $i (line $pos) - all $($total[$i]) of its files are owned by:"
            foreach ($w in ($lost[$i].To.Keys | Sort-Object $rank)) {
                $wp = if ($idx.ContainsKey($w)) { $idx[$w] + 1 } else { 'UNLISTED' }
                Write-Host "         $($lost[$i].To[$w]) file(s) -> $w (line $wp)" -ForegroundColor DarkGray
            }
        }
    }

    if ($crossDomain.Count) {
        Write-Host ''
        Write-Host ("  {0} file(s) are claimed by BOTH a loose archive and a REDmod." -f $crossDomain.Count) -ForegroundColor Yellow
        Write-Host '  modlist.txt orders only the loose ones, so which side wins is not' -ForegroundColor DarkGray
        Write-Host '  established here. Test it in game before assuming either way, or' -ForegroundColor DarkGray
        Write-Host '  remove one copy - the same mod installed both ways is the usual cause.' -ForegroundColor DarkGray
        $shown = 0
        foreach ($kv in $crossDomain.GetEnumerator()) {
            if ($shown -ge 10) { Write-Host "    ...and $($crossDomain.Count - 10) more" -ForegroundColor DarkGray; break }
            $namesFor = ($kv.Value -join '  vs  ')
            Write-Host "    $namesFor" -ForegroundColor DarkGray
            $shown++
        }
    }

    $partial = @($lost.Keys | Where-Object { $total[$_] -gt 0 -and $lost[$_].Count -lt $total[$_] })
    Write-Host "`n  $($partial.Count) archive(s) lose some but not all of their files (normal for overlapping retextures)."
    Write-Host "  Re-run with -Verbose to list them, or -Explain <archive> to name the files."
    if ($VerbosePreference -ne 'SilentlyContinue') {
        foreach ($p in ($partial | Sort-Object $rank)) {
            $pos = if ($idx.ContainsKey($p)) { $idx[$p] + 1 } else { 'UNLISTED' }
            Write-Host ("    line {0,5}  {1,-58} {2}/{3} files lost" -f $pos, $p, $lost[$p].Count, $total[$p])
        }
    }

    # ---------------------------------------------------------- explain ------
    # One archive, named files, both directions. This is the question every
    # conflict prompts - "which mod is beating this one, and over what?" - and
    # until the resource-path table was vendored it could only ever be answered
    # with a count.
    if ($Explain) {
        $target = @($total.Keys | Where-Object { $_ -eq $Explain -or $_ -like "*$Explain*" })
        if ($target.Count -ne 1) {
            Write-Host ''
            if ($target.Count -eq 0) { Write-Bad "no archive matching '$Explain'" }
            else {
                Write-Host "'$Explain' matches $($target.Count) archives:" -ForegroundColor Yellow
                $target | ForEach-Object { Write-Host "  $_" }
            }
        } else {
            $t = $target[0]
            $tpos = if ($idx.ContainsKey($t)) { $idx[$t] + 1 } else { 'UNLISTED' }
            Write-Host ''
            Write-Host "$t (line $tpos) - carries $($total[$t]) file(s)" -ForegroundColor Cyan

            $resolver = Join-Path $PSScriptRoot 'Resolve-ResourcePath.ps1'
            $canName = Test-Path -LiteralPath $resolver
            if ($canName) { . $resolver }
            else { Write-Host '  (resource-path table not present - hashes cannot be named)' -ForegroundColor DarkYellow }

            if ($lost.ContainsKey($t)) {
                Write-Host "  LOSES $($lost[$t].Count) file(s):" -ForegroundColor Yellow
                foreach ($w in ($lost[$t].To.Keys | Sort-Object $rank)) {
                    $wp = if ($idx.ContainsKey($w)) { $idx[$w] + 1 } else { 'UNLISTED' }
                    Write-Host "    to $w (line $wp):" -ForegroundColor DarkGray
                    foreach ($h in $lost[$t].Hashes[$w]) {
                        $name = if ($canName) { Resolve-ResourceHash -Hash $h } else { $null }
                        # An unresolved hash is not an error: the table covers the
                        # BASE GAME, so a miss usually means the file is a mod's
                        # own resource. Say which it is rather than printing a
                        # bare number and letting the reader assume.
                        if ($name) { Write-Host "      $name" -ForegroundColor DarkGray }
                        else { Write-Host ("      0x{0:X16}  (not a base-game path - probably mod-added)" -f $h) -ForegroundColor DarkGray }
                    }
                }
            } else {
                Write-Ok "loses nothing - it wins every file it ships"
            }

            $beats = @($lost.Keys | Where-Object { $lost[$_].To.ContainsKey($t) } | Sort-Object $rank)
            if ($beats.Count) {
                Write-Host "  BEATS:" -ForegroundColor Green
                foreach ($b in $beats) {
                    $bp = if ($idx.ContainsKey($b)) { $idx[$b] + 1 } else { 'UNLISTED' }
                    Write-Host "    $b (line $bp) loses $($lost[$b].To[$t]) file(s) to it" -ForegroundColor DarkGray
                }
            }
        }
    }
}

Write-Host ''
if ($problems -eq 0) { Write-Host 'Load order is clean.' -ForegroundColor Green; exit 0 }
if ($Fix)            { Write-Host "Finished with $problems issue(s) flagged - re-run to confirm." -ForegroundColor Yellow; exit 1 }
Write-Host "$problems issue(s) found. Re-run with -Fix to repair." -ForegroundColor Yellow
exit 1
