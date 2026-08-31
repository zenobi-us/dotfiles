# New-ArchiveAnatomy.ps1 -- what the archive layer actually contains.
#
#     .\New-ArchiveAnatomy.ps1 -GameRoot '<install>'
#     .\New-ArchiveAnatomy.ps1 -GameRoot '<install>' -Md anatomy.md
#
# WHY THIS EXISTS
#
# Every other report in this family answers a question about ONE mod, or about
# a contest between two. None of them can describe the load order as a thing in
# itself: how much of the base game it replaces, what kind of files it is made
# of, and which parts of Night City it concentrates on.
#
# The distinction that makes this possible is REPLACE versus ADD. An archive
# hash that appears in the vendored base-game path table is an override - the
# game shipped that file and this mod is standing on top of it. A hash that does
# not is a new asset the mod invented. Those two are indistinguishable in every
# tool that reads archives without the path table, and they mean opposite
# things: 4,000 new meshes is a content pack, 40 overridden ones is a mod that
# can break a patch.
#
# UNRESOLVED IS NOT UNKNOWN. The table covers 99.97% of base game + EP1, so a
# hash it does not hold is a mod-authored asset rather than a lookup failure.
# That is why the "new" column is trustworthy at all, and why the coverage
# caveat is printed on the page rather than buried here.
#
# COST: it reads the index of every .archive in the load order. On an 800-mod
# install that is a minute or two, most of it in the path table. Nothing is
# written to the game install.

[CmdletBinding()]
param(
    [string] $GameRoot,

    [string] $Html = "$env:USERPROFILE\Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\reports\archive-anatomy.html",

    # The same anatomy as markdown, for a forum post or a wiki.
    [string] $Md,

    [switch] $NoHtml,

    # REDmod archives live in a separate precedence domain that modlist.txt does
    # not order. They are counted here, and never ranked against loose archives.
    [switch] $SkipRedmod,

    [string] $IndexPath,

    # Show the real install path in the report.
    [switch] $NoRedact
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$ErrorActionPreference = 'Stop'

. (Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'cyberwise-conflicts\tools\Resolve-ResourcePath.ps1')

if (-not $GameRoot) {
    # Ask the storefronts where it is rather than guessing at drive letters. The
    # guess-list failed on the first install it met: the library was on C:\Games,
    # which is not a path anybody would think to hard-code.
    $candidates = New-Object System.Collections.Generic.List[string]
    $steam = (Get-ItemProperty -Path 'HKCU:\Software\Valve\Steam' -Name SteamPath -ErrorAction SilentlyContinue).SteamPath
    if ($steam) {
        $vdf = Join-Path ($steam -replace '/', '\') 'steamapps\libraryfolders.vdf'
        if (Test-Path -LiteralPath $vdf) {
            foreach ($m in [regex]::Matches((Get-Content -LiteralPath $vdf -Raw), '"path"\s+"([^"]+)"')) {
                $lib = $m.Groups[1].Value -replace '\\\\', '\'
                $candidates.Add((Join-Path $lib 'steamapps\common\Cyberpunk 2077'))
            }
        }
    }
    foreach ($g in 'HKLM:\SOFTWARE\WOW6432Node\GOG.com\Games\1423049311', 'HKLM:\SOFTWARE\GOG.com\Games\1423049311') {
        $gp = (Get-ItemProperty -Path $g -Name path -ErrorAction SilentlyContinue).path
        if ($gp) { $candidates.Add($gp) }
    }
    foreach ($d in 'C:\Program Files (x86)\Steam\steamapps\common\Cyberpunk 2077',
                   'C:\GOG Games\Cyberpunk 2077') { $candidates.Add($d) }

    $GameRoot = $candidates | Where-Object { Test-Path -LiteralPath (Join-Path $_ 'bin\x64\Cyberpunk2077.exe') } | Select-Object -First 1
}
if (-not $GameRoot -or -not (Test-Path -LiteralPath (Join-Path $GameRoot 'bin\x64\Cyberpunk2077.exe'))) {
    throw "No Cyberpunk 2077 install found. Pass -GameRoot."
}

$modDir = Join-Path $GameRoot 'archive\pc\mod'
if (-not (Test-Path -LiteralPath $modDir)) { throw "No archive\pc\mod under $GameRoot." }

function Hide-Path {
    param([string] $s)
    if ($NoRedact -or -not $s) { return $s }
    ($s -replace [regex]::Escape($env:USERPROFILE), '~') -replace '(?i)\\Users\\[^\\]+', '\Users\<you>'
}

# ------------------------------------------------------- the archive reader --
#
# Header: magic 'RDAR' u32, version u32, indexPosition u64, indexSize u32. At
# indexPosition: fileTableOffset u32, fileTableSize u32, crc u64,
# fileEntryCount u32, fileSegmentCount u32, resourceDependencyCount u32, then
# fileEntryCount * 56-byte entries whose first 8 bytes are the FNV1a-64 hash.

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

# ------------------------------------------------------------- the vanilla ----
#
# One pass over the hash table builds hash -> ordinal, and one pass over the
# front-coded body builds ordinal -> path. Per-hash binary search is the right
# shape for a handful of lookups and the wrong one for a million of them: this
# report asks about every file in every archive.

Write-Host 'loading the base-game path table...' -ForegroundColor DarkGray
$ix = Get-ResourcePathIndex -IndexPath $IndexPath
if (-not $ix) { throw 'No resource-path index. Without it there is no replace-versus-add distinction, which is the whole report.' }

$sw = [Diagnostics.Stopwatch]::StartNew()

$entries = [int]($ix.HashLen / 12)
$ordOf = New-Object 'System.Collections.Generic.Dictionary[long,int]' $entries
for ($i = 0; $i -lt $entries; $i++) {
    $at = $ix.HashOff + $i * 12
    $ordOf[[BitConverter]::ToInt64($ix.Bytes, $at)] = [int][BitConverter]::ToUInt32($ix.Bytes, $at + 8)
}

$paths = New-Object 'string[]' $ix.Count
$p = [int]$ix.BodyOff
$end = $p + [int]$ix.BodyLen
$cur = $null
$n = 0
while ($p -lt $end -and $n -lt $ix.Count) {
    if ($n % $ix.BlockSize -eq 0) {
        $len = [BitConverter]::ToUInt16($ix.Bytes, $p); $p += 2
        $cur = New-Object byte[] $len
        [Array]::Copy($ix.Bytes, $p, $cur, 0, $len); $p += $len
    } else {
        $shared = $ix.Bytes[$p]; $p += 1
        $sufLen = [BitConverter]::ToUInt16($ix.Bytes, $p); $p += 2
        $next = New-Object byte[] ($shared + $sufLen)
        if ($shared -gt 0) { [Array]::Copy($cur, 0, $next, 0, $shared) }
        [Array]::Copy($ix.Bytes, $p, $next, $shared, $sufLen); $p += $sufLen
        $cur = $next
    }
    $paths[$n] = [Text.Encoding]::UTF8.GetString($cur)
    $n++
}
Write-Host ("  {0:N0} base-game paths in {1:N1}s" -f $ix.Count, $sw.Elapsed.TotalSeconds) -ForegroundColor DarkGray

# -------------------------------------------------------------- the scan -----

$listPath = Join-Path $modDir 'modlist.txt'
$order = @{}
if (Test-Path -LiteralPath $listPath) {
    $ln = 0
    foreach ($l in (Get-Content -LiteralPath $listPath)) {
        if ($l) { $order[$l] = $ln; $ln++ }
    }
}

$files = @(Get-ChildItem -LiteralPath $modDir -Filter *.archive -File)
if (-not $SkipRedmod) {
    $redmodRoot = Join-Path $GameRoot 'mods'
    if (Test-Path -LiteralPath $redmodRoot) {
        $files += @(Get-ChildItem -LiteralPath $redmodRoot -Recurse -Filter *.archive -File -ErrorAction SilentlyContinue)
    }
}

# A resource claimed by more than one archive: the winner is whichever sits
# earlier in modlist.txt. REDmod archives are recorded but never ranked, for the
# reason in the parameter comment.
$owner = New-Object 'System.Collections.Generic.Dictionary[uint64,System.Collections.Generic.List[int]]'

$archives = New-Object System.Collections.Generic.List[object]
$sw.Restart()
$k = 0
foreach ($f in $files) {
    $isRedmod = $f.FullName -notlike "$modDir\*"
    $name = if ($isRedmod) { 'redmod:' + $f.Directory.Parent.Name + '/' + $f.Name } else { $f.Name }
    $hs = Get-ArchiveHashes $f.FullName
    if ($null -eq $hs) { Write-Warning "unreadable (not RDAR): $name"; continue }

    $idx = $archives.Count
    $replaces = New-Object 'System.Collections.Generic.List[string]'
    $added = 0
    foreach ($h in $hs) {
        $signed = [BitConverter]::ToInt64([BitConverter]::GetBytes($h), 0)
        $o = 0
        if ($ordOf.TryGetValue($signed, [ref]$o)) { $replaces.Add($paths[$o]) } else { $added++ }

        $lst = $null
        if (-not $owner.TryGetValue($h, [ref]$lst)) {
            $lst = New-Object 'System.Collections.Generic.List[int]'
            $owner[$h] = $lst
        }
        $lst.Add($idx)
    }

    $archives.Add([pscustomobject]@{
        Name     = $name
        Index    = $idx
        Rank     = if ($order.ContainsKey($f.Name) -and -not $isRedmod) { $order[$f.Name] } else { [int]::MaxValue }
        Redmod   = $isRedmod
        Total    = $hs.Count
        Replaces = $replaces
        Added    = $added
        Bytes    = $f.Length
        Lost     = 0
        LostTo   = @{}
    })

    $k++
    if ($k % 100 -eq 0) { Write-Host "  $k/$($files.Count) archives" -ForegroundColor DarkGray }
}
Write-Host ("scanned {0} archives in {1:N1}s; {2:N0} distinct resources" -f $archives.Count, $sw.Elapsed.TotalSeconds, $owner.Count) -ForegroundColor Cyan

# --------------------------------------------------------- who beats whom ----

$crossDomain = 0
foreach ($kv in $owner.GetEnumerator()) {
    if ($kv.Value.Count -lt 2) { continue }
    $claimants = @($kv.Value | ForEach-Object { $archives[$_] })
    if (@($claimants | Select-Object -ExpandProperty Redmod -Unique).Count -gt 1) { $crossDomain++; continue }
    $ranked = @($claimants | Sort-Object Rank, Name)
    $win = $ranked[0]
    foreach ($l in $ranked[1..($ranked.Count - 1)]) {
        $l.Lost++
        $l.LostTo[$win.Name] = 1 + $l.LostTo[$win.Name]
    }
}

# ------------------------------------------------------------ aggregates -----

# Two levels of the vanilla tree, which is where the meaning is: 'base' alone
# says nothing, 'base\characters' says the load order is mostly clothes.
$byArea = @{}
$byType = @{}
$replacedTotal = 0
$addedTotal = 0

foreach ($a in $archives) {
    $addedTotal += $a.Added
    foreach ($path in $a.Replaces) {
        $replacedTotal++
        $seg = $path.Split([char]92)
        $area = if ($seg.Count -ge 2) { $seg[0] + '\' + $seg[1] } else { $seg[0] }
        $byArea[$area] = 1 + $byArea[$area]
        $ext = [IO.Path]::GetExtension($path)
        if (-not $ext) { $ext = '(none)' }
        $byType[$ext] = 1 + $byType[$ext]
    }
}

$topReplacers = @($archives | Where-Object { $_.Replaces.Count } | Sort-Object { $_.Replaces.Count } -Descending | Select-Object -First 15)
# The other half of the same story. An archive that adds 4,000 files and
# replaces none cannot break a patch, and reading only the override table would
# leave the biggest things in the load order invisible.
$topAdders = @($archives | Where-Object { $_.Added } | Sort-Object Added -Descending | Select-Object -First 12 |
                ForEach-Object { [pscustomobject]@{ Key = ($_.Name -replace '\.archive$',''); Value = $_.Added } })
$topLosers    = @($archives | Where-Object { $_.Lost } | Sort-Object Lost -Descending | Select-Object -First 15)
$eclipsed     = @($archives | Where-Object { $_.Total -gt 0 -and $_.Lost -ge $_.Total } | Sort-Object Rank)
$pureContent  = @($archives | Where-Object { $_.Total -gt 0 -and $_.Replaces.Count -eq 0 })
$areas = @($byArea.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 12)
$types = @($byType.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 12)

$totalFiles = ($archives | Measure-Object Total -Sum).Sum
$totalBytes = ($archives | Measure-Object Bytes -Sum).Sum

Write-Host ''
Write-Host ("{0:N0} files across {1} archives - {2:N0} replace a base-game file, {3:N0} are new" -f $totalFiles, $archives.Count, $replacedTotal, $addedTotal) -ForegroundColor Cyan
if ($eclipsed.Count) { Write-Host "  $($eclipsed.Count) archive(s) fully eclipsed - every file they ship loses" -ForegroundColor Yellow }
if ($crossDomain)    { Write-Host "  $crossDomain resource(s) contested across the loose/REDmod boundary - not ranked here" -ForegroundColor DarkYellow }

# ---------------------------------------------------------------- render -----

$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
function Get-Esc { param([string]$s) ($s -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;') }
function Get-Pct { param([double]$n, [double]$d) if ($d -le 0) { 0 } else { [math]::Round(100 * $n / $d, 1) } }

if ($Md) {
    $mb = [Text.StringBuilder]::new()
    [void]$mb.AppendLine('# Archive anatomy')
    [void]$mb.AppendLine()
    [void]$mb.AppendLine("$($archives.Count) archives, $('{0:N0}' -f $totalFiles) files, $('{0:N1}' -f ($totalBytes/1GB)) GB. Read $stamp.")
    [void]$mb.AppendLine()
    [void]$mb.AppendLine("- **$('{0:N0}' -f $replacedTotal)** files replace something the base game ships ($(Get-Pct $replacedTotal $totalFiles)%)")
    [void]$mb.AppendLine("- **$('{0:N0}' -f $addedTotal)** are assets no vanilla file occupies")
    [void]$mb.AppendLine("- **$('{0:N0}' -f $owner.Count)** distinct resources after overlaps")
    if ($eclipsed.Count)  { [void]$mb.AppendLine("- **$($eclipsed.Count)** archives are fully eclipsed - every file they ship loses to something above them") }
    if ($crossDomain)     { [void]$mb.AppendLine("- **$crossDomain** resources are contested across the loose/REDmod boundary and are not ranked") }
    [void]$mb.AppendLine()
    [void]$mb.AppendLine('## What it stands on')
    [void]$mb.AppendLine()
    [void]$mb.AppendLine('| Area of the game | Files replaced |')
    [void]$mb.AppendLine('| --- | ---: |')
    foreach ($a in $areas) { [void]$mb.AppendLine("| ``$($a.Key)`` | $('{0:N0}' -f $a.Value) |") }
    [void]$mb.AppendLine()
    [void]$mb.AppendLine('## What it is made of')
    [void]$mb.AppendLine()
    [void]$mb.AppendLine('| Type | Files replaced |')
    [void]$mb.AppendLine('| --- | ---: |')
    foreach ($t in $types) { [void]$mb.AppendLine("| ``$($t.Key)`` | $('{0:N0}' -f $t.Value) |") }
    [void]$mb.AppendLine()
    [void]$mb.AppendLine('## Biggest additions')
    [void]$mb.AppendLine()
    [void]$mb.AppendLine('| Archive | New assets |')
    [void]$mb.AppendLine('| --- | ---: |')
    foreach ($a in $topAdders) { [void]$mb.AppendLine("| $($a.Key -replace '\|','\|') | $('{0:N0}' -f $a.Value) |") }
    [void]$mb.AppendLine()
    [void]$mb.AppendLine('## Deepest reach into vanilla')
    [void]$mb.AppendLine()
    [void]$mb.AppendLine('| Archive | Replaces | Adds |')
    [void]$mb.AppendLine('| --- | ---: | ---: |')
    foreach ($a in $topReplacers) {
        [void]$mb.AppendLine("| $($a.Name -replace '\|','\|') | $('{0:N0}' -f $a.Replaces.Count) | $('{0:N0}' -f $a.Added) |")
    }
    [void]$mb.AppendLine()
    if ($eclipsed.Count) {
        [void]$mb.AppendLine('## Nothing survives')
        [void]$mb.AppendLine()
        [void]$mb.AppendLine('Installed, enabled, and contributing no file to the game.')
        [void]$mb.AppendLine()
        foreach ($e in $eclipsed) {
            $to = @($e.LostTo.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1 | ForEach-Object { $_.Key })
            [void]$mb.AppendLine("- **$($e.Name)** - all $($e.Total) file(s) claimed by $($to -join '')")
        }
        [void]$mb.AppendLine()
    }
    if ($topLosers.Count) {
        [void]$mb.AppendLine('## Losing ground')
        [void]$mb.AppendLine()
        [void]$mb.AppendLine('| Archive | Files lost | of | To |')
        [void]$mb.AppendLine('| --- | ---: | ---: | --- |')
        foreach ($a in $topLosers) {
            $to = (@($a.LostTo.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 2 |
                     ForEach-Object { "$($_.Key) ($($_.Value))" }) -join ', ') -replace '\|','\|'
            [void]$mb.AppendLine("| $($a.Name -replace '\|','\|') | $($a.Lost) | $($a.Total) | $to |")
        }
        [void]$mb.AppendLine()
    }
    [void]$mb.AppendLine("_Base-game paths from VanStorm's resource-path database (2.31 + Phantom Liberty, 99.97% coverage). A file the table does not know is a mod-authored asset, not a lookup failure._")
    [void]$mb.AppendLine()
    [void]$mb.AppendLine("_$(Hide-Path $modDir) - generated $stamp by cyberwise._")

    $dirM = Split-Path -Parent $Md
    if ($dirM -and -not (Test-Path -LiteralPath $dirM)) { New-Item -ItemType Directory -Path $dirM -Force | Out-Null }
    Set-Content -LiteralPath $Md -Value $mb.ToString() -Encoding UTF8
    Write-Host "wrote $((Resolve-Path -LiteralPath $Md).Path)" -ForegroundColor Green
}

if ($NoHtml) { exit 0 }

function Get-Bars {
    param($Pairs, [string]$Class)
    if (-not $Pairs) { return '' }
    $max = ($Pairs | ForEach-Object { $_.Value } | Measure-Object -Maximum).Maximum
    ($Pairs | ForEach-Object {
        $w = Get-Pct $_.Value $max
        "<div class=""bar $Class""><span class=""bl"">$(Get-Esc $_.Key)</span><span class=""bt""><i style=""width:$w%""></i></span><span class=""bv"">$('{0:N0}' -f $_.Value)</span></div>"
    }) -join ''
}

$repRows = ($topReplacers | ForEach-Object {
    $share = Get-Pct $_.Replaces.Count $_.Total
    "<tr><td class=""nm"">$(Get-Esc $_.Name)</td><td class=""num rep"">$('{0:N0}' -f $_.Replaces.Count)</td><td class=""num add"">$('{0:N0}' -f $_.Added)</td><td class=""mix""><i style=""width:$share%""></i></td></tr>"
}) -join ''

$lossRows = ($topLosers | ForEach-Object {
    $to = ($_.LostTo.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 2 |
           ForEach-Object { "$(Get-Esc $_.Key) <b>$($_.Value)</b>" }) -join ' &middot; '
    $all = if ($_.Lost -ge $_.Total) { ' class="gone"' } else { '' }
    "<tr$all><td class=""nm"">$(Get-Esc $_.Name)</td><td class=""num"">$($_.Lost)<em>/$($_.Total)</em></td><td class=""to"">$to</td></tr>"
}) -join ''

$doc = @"
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Archive anatomy</title>
<style>
  :root { --bg:#06070a; --panel:#0d1016; --line:#191e28; --text:#c9d3e2; --dim:#6a7484;
          --cyan:#22d3ee; --yellow:#fde047; --red:#f87171; --green:#4ade80; --violet:#a78bfa; }
  * { box-sizing:border-box; }
  body { margin:0; padding:30px 34px 60px; background:var(--bg); color:var(--text);
         font:13.5px/1.55 "Segoe UI",system-ui,sans-serif; }
  h1 { margin:0; font:600 24px/1.2 Consolas,monospace; letter-spacing:.02em; }
  h1 span { color:var(--cyan); }
  .sub { color:var(--dim); font:11.5px/1.6 Consolas,monospace; margin:6px 0 24px; }
  h2 { font:600 11px/1 Consolas,monospace; letter-spacing:.16em; text-transform:uppercase;
       color:var(--cyan); margin:0 0 12px; }
  h2 em { font-style:normal; color:var(--dim); letter-spacing:0; text-transform:none; margin-left:10px; font-size:11px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(420px,1fr)); gap:18px; }
  .panel { background:var(--panel); border:1px solid var(--line); padding:16px 18px; }
  .panel.wide { grid-column:1/-1; }
  .kpi { display:flex; gap:0; flex-wrap:wrap; margin-bottom:18px; border:1px solid var(--line); background:var(--panel); }
  .kpi div { flex:1 1 150px; padding:14px 18px; border-right:1px solid var(--line); }
  .kpi div:last-child { border-right:none; }
  .kpi b { display:block; font:600 24px/1.15 Consolas,monospace; color:var(--cyan); }
  .kpi b.warn { color:var(--yellow); }
  .kpi span { color:var(--dim); font-size:11px; text-transform:uppercase; letter-spacing:.1em; }
  .split { display:flex; height:26px; border:1px solid var(--line); margin-bottom:6px; }
  .split i { display:block; height:100%; }
  .split .r { background:linear-gradient(90deg,#7c2d12,#f97316); }
  .split .a { background:linear-gradient(90deg,#065f46,#22c55e); }
  .legend { display:flex; gap:22px; color:var(--dim); font-size:11.5px; margin-bottom:4px; }
  .legend b { color:var(--text); font-weight:600; }
  .legend i { display:inline-block; width:9px; height:9px; margin-right:6px; }
  .bar { display:grid; grid-template-columns:150px 1fr 62px; align-items:center; gap:10px; padding:3px 0; }
  .bar .bl { font:11.5px/1.4 Consolas,monospace; color:var(--text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .bar .bt { background:#11151d; height:11px; }
  .bar .bt i { display:block; height:100%; background:var(--cyan); }
  .bar.t .bt i { background:var(--violet); }
  .bar.a .bt i { background:var(--green); }
  .bar.a .bl { color:var(--text); }
  .bar .bv { text-align:right; font:11.5px/1.4 Consolas,monospace; color:var(--dim); }
  table { width:100%; border-collapse:collapse; font-size:12.5px; }
  td { padding:6px 8px; border-top:1px solid var(--line); vertical-align:middle; }
  tr:first-child td { border-top:none; }
  td.nm { font-family:Consolas,monospace; overflow-wrap:anywhere; }
  td.num { text-align:right; font-family:Consolas,monospace; width:88px; white-space:nowrap; }
  td.num em { color:var(--dim); font-style:normal; }
  td.num.rep { color:#fb923c; }
  td.num.add { color:var(--green); }
  td.mix { width:90px; }
  td.mix i { display:block; height:9px; background:#fb923c; box-shadow:inset -1px 0 0 var(--line); }
  td.to { color:var(--dim); font-size:11.5px; }
  td.to b { color:var(--text); font-weight:600; }
  tr.gone td.nm { color:var(--red); }
  .gone-panel { border-color:#3b1d1d; }
  .gonerow { display:flex; gap:14px; align-items:baseline; padding:5px 0; border-top:1px solid var(--line); }
  .gonerow:first-of-type { border-top:none; }
  .gonerow b { font:600 12.5px/1.4 Consolas,monospace; color:var(--red); overflow-wrap:anywhere; }
  .gonerow span { color:var(--dim); font-size:11.5px; }
  footer { margin-top:26px; color:var(--dim); font:11px/1.7 Consolas,monospace;
           border-top:1px solid var(--line); padding-top:12px; }
</style></head><body>

<h1>Archive anatomy<span> // $($archives.Count) archives</span></h1>
<div class="sub">$(Get-Esc (Hide-Path $modDir)) &nbsp;//&nbsp; read $stamp</div>

<div class="kpi">
  <div><b>$('{0:N0}' -f $totalFiles)</b><span>files shipped</span></div>
  <div><b>$('{0:N0}' -f $owner.Count)</b><span>distinct resources</span></div>
  <div><b>$('{0:N0}' -f $replacedTotal)</b><span>replace vanilla</span></div>
  <div><b>$('{0:N0}' -f $addedTotal)</b><span>brand new</span></div>
  <div><b class="$(if ($eclipsed.Count) { 'warn' })">$($eclipsed.Count)</b><span>fully eclipsed</span></div>
  <div><b>$('{0:N1}' -f ($totalBytes/1GB)) GB</b><span>on disk</span></div>
</div>

<div class="grid">

  <div class="panel wide">
    <h2>Replace or add<em>every file in the load order, by whether the base game already had one</em></h2>
    <div class="split">
      <i class="r" style="width:$(Get-Pct $replacedTotal $totalFiles)%"></i>
      <i class="a" style="width:$(Get-Pct $addedTotal $totalFiles)%"></i>
    </div>
    <div class="legend">
      <span><i style="background:#f97316"></i><b>$('{0:N0}' -f $replacedTotal)</b> stand on a base-game file ($(Get-Pct $replacedTotal $totalFiles)%)</span>
      <span><i style="background:#22c55e"></i><b>$('{0:N0}' -f $addedTotal)</b> are assets vanilla never had ($(Get-Pct $addedTotal $totalFiles)%)</span>
      <span>$($pureContent.Count) archives touch nothing vanilla at all</span>
    </div>
  </div>

  <div class="panel">
    <h2>What it stands on<em>vanilla files replaced, by area</em></h2>
    $(Get-Bars $areas '')
  </div>

  <div class="panel">
    <h2>What it is made of<em>vanilla files replaced, by type</em></h2>
    $(Get-Bars $types 't')
  </div>

  <div class="panel">
    <h2>Biggest additions<em>assets vanilla never had, by archive</em></h2>
    $(Get-Bars $topAdders 'a')
  </div>

  <div class="panel wide">
    <h2>Deepest reach into vanilla<em>orange bar = share of the archive that overrides rather than adds</em></h2>
    <table>$repRows</table>
  </div>

$(if ($eclipsed.Count) { @"
  <div class="panel wide gone-panel">
    <h2>Nothing survives<em>installed, enabled, and contributing no file to the game</em></h2>
    $(($eclipsed | ForEach-Object {
        $to = @($_.LostTo.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1 | ForEach-Object { $_.Key })
        "<div class=""gonerow""><b>$(Get-Esc $_.Name)</b><span>all $($_.Total) file(s) claimed by $(Get-Esc ($to -join ''))</span></div>"
    }) -join '')
  </div>
"@ })

$(if ($lossRows) { @"
  <div class="panel wide">
    <h2>Losing ground<em>files claimed by something earlier in modlist.txt; red = nothing of this archive survives</em></h2>
    <table>$lossRows</table>
  </div>
"@ })

</div>

<footer>
  Base-game paths from VanStorm's resource-path database, 2.31 + Phantom Liberty, 99.97% coverage &mdash;
  a file the table does not know is a mod-authored asset, not a lookup failure.<br>
$(if ($crossDomain) { "  $crossDomain resource(s) are claimed in both the loose and REDmod domains. modlist.txt orders only one of them, so no winner is named for those.<br>`n" })
  generated $stamp by CYBERWISE
</footer>
</body></html>
"@

$dir = Split-Path -Parent $Html
if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
Set-Content -LiteralPath $Html -Value $doc -Encoding UTF8
Write-Host "wrote $((Resolve-Path -LiteralPath $Html).Path)" -ForegroundColor Green
exit 0
