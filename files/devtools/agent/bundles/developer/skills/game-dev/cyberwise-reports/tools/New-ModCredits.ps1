# New-ModCredits.ps1 -- the people whose work is in your game, as end credits.
#
#     .\New-ModCredits.ps1 -StagingRoot '<staging>'
#     .\New-ModCredits.ps1 -StagingRoot '<staging>' -Md credits.md
#
# WHY THIS EXISTS
#
# Every other report here is diagnostic: what is broken, what is losing, what is
# not running. This one is not for debugging anything. A heavily modded install
# is the work of hundreds of people who never met, and the only place that shows
# up is a folder listing full of version numbers and hashes.
#
# So: a credits roll. Names, what each person made, and nothing else - no load
# order, no file counts, no conflicts, nothing that needs explaining. It is the
# one page here you could show somebody who does not mod.
#
# ADULT MODS ARE OMITTED BY DEFAULT, and the count of what was omitted is
# printed rather than hidden. This page is built to be shown to other people, so
# the safe default is the one that does not surprise its author on a stream -
# but silently dropping mods from a credits list is its own unkindness, hence
# the count. -ShowAdult includes everything.
#
# It reads the metadata cache the manifest tool builds and makes NO network call
# of its own. Authors come from Nexus, so a mod that has never been enriched
# appears under its folder name with no author - said plainly, not guessed at.

[CmdletBinding()]
param(
    [string] $StagingRoot,
    [string] $Game = 'cyberpunk2077',

    [string] $Html = "$env:USERPROFILE\Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\reports\mod-credits.html",

    # Every HTML report here can also be markdown - for a forum post, a readme,
    # or a Discord message where a web page is useless.
    [string] $Md,

    [switch] $NoHtml,
    [switch] $ShowAdult,

    # Where the manifest tool keeps enriched Nexus metadata.
    [string] $CachePath
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$ErrorActionPreference = 'Stop'

if (-not $StagingRoot) {
    $StagingRoot = @(
        (Join-Path $env:APPDATA "Vortex\$Game\mods")
        (Join-Path $env:APPDATA 'Vortex\cyberpunk2077\mods')
    ) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}
if (-not $StagingRoot -or -not (Test-Path -LiteralPath $StagingRoot)) {
    throw "No staging root found. Pass -StagingRoot."
}

if (-not $CachePath) {
    $CachePath = @(
        (Join-Path $env:LOCALAPPDATA 'cyberwise\nexus-cache.json')
        (Join-Path (Get-Location) '.nexus-cache.json')
    ) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}
$cache = @{}
if ($CachePath -and (Test-Path -LiteralPath $CachePath)) {
    $raw = Get-Content -LiteralPath $CachePath -Raw | ConvertFrom-Json
    foreach ($p in $raw.PSObject.Properties) { $cache[$p.Name] = $p.Value }
}

# --------------------------------------------------------------- gather ------

$mods = New-Object System.Collections.Generic.List[object]
$unknownAuthor = 0
$adultHidden = 0

foreach ($dir in (Get-ChildItem -LiteralPath $StagingRoot -Directory)) {
    $name = $dir.Name; $id = $null
    if ($dir.Name -match '^(?<n>.+?)-(?<id>\d+)-(?<v>.*?)-(?<ts>\d{10})$') {
        $name = $matches['n']; $id = $matches['id']
    }
    $meta = if ($id -and $cache.ContainsKey($id)) { $cache[$id] } else { $null }
    if ($meta -and $meta.adult -and -not $ShowAdult) { $adultHidden++; continue }

    $author = if ($meta -and $meta.author) { [string]$meta.author } else { $null }
    if (-not $author) { $unknownAuthor++ }

    $mods.Add([pscustomobject]@{
        Name   = if ($meta -and $meta.name) { [string]$meta.name } else { $name }
        Author = $author
        Id     = $id
    })
}

# ONE MOD, MANY FOLDERS. A FOMOD with options installs as several staging
# folders sharing a Nexus id, so counting folders counted "Preem Fixes" four
# times and printed it four times in its author's line. A credits page that
# repeats a title looks broken, and the headline number was wrong in the
# direction that flatters - it said 798 when it meant folders.
#
# Distinct by id, falling back to name for folders that carry no id.
$seen = @{}
$deduped = New-Object System.Collections.Generic.List[object]
foreach ($m in $mods) {
    $key = if ($m.Id) { "id:$($m.Id)" } else { "name:$($m.Name)" }
    if ($seen.ContainsKey($key)) { continue }
    $seen[$key] = $true
    $deduped.Add($m)
}
$folderCount = $mods.Count
$mods = $deduped

# One person, many mods - that is the whole shape of the page, and it is why
# this groups by author rather than listing mods. The long tail matters as much
# as the top: most authors here made exactly one thing.
$byAuthor = @{}
foreach ($m in $mods) {
    if (-not $m.Author) { continue }
    if (-not $byAuthor.ContainsKey($m.Author)) { $byAuthor[$m.Author] = New-Object System.Collections.Generic.List[string] }
    $byAuthor[$m.Author].Add($m.Name)
}
# Sort-Object cannot take -Descending for one key and ascending for another in
# a single call, so this sorts by name first and by count second - the second
# sort is stable, which leaves equal-count authors alphabetical.
$authors = @($byAuthor.Keys | Sort-Object | Sort-Object { $byAuthor[$_].Count } -Descending)
$single = @($authors | Where-Object { $byAuthor[$_].Count -eq 1 }).Count

Write-Host ''
Write-Host ("{0} distinct mods across {1} staged folders, {2} authors" -f $mods.Count, $folderCount, $authors.Count) -ForegroundColor Cyan
if ($unknownAuthor) { Write-Host "  $unknownAuthor mod(s) have no author on record - enrich the manifest cache to name them" -ForegroundColor DarkGray }
if ($adultHidden)   { Write-Host "  $adultHidden adult mod(s) omitted (-ShowAdult to include)" -ForegroundColor DarkGray }

# ----------------------------------------------------------------- render ----

function Get-Esc { param([string]$s) ($s -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;') }

$stamp = Get-Date -Format 'yyyy-MM-dd'

if ($Md) {
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine("# Night City, as modded by $($authors.Count) people")
    [void]$sb.AppendLine()
    [void]$sb.AppendLine("$($mods.Count) mods. $($authors.Count) authors. $single of them made exactly one thing.")
    [void]$sb.AppendLine()
    if ($authors.Count -eq 0) {
        [void]$mb.AppendLine('No authors on record yet - run `New-ModManifest.ps1` with a Nexus API key once and this fills in.')
        [void]$mb.AppendLine()
    }
    foreach ($a in $authors) {
        $list = $byAuthor[$a]
        [void]$sb.AppendLine("**$a** - $($list.Count) mod$(if ($list.Count -ne 1) { 's' })")
        [void]$sb.AppendLine()
        foreach ($t in ($list | Sort-Object)) { [void]$sb.AppendLine("- $t") }
        [void]$sb.AppendLine()
    }
    if ($unknownAuthor) { [void]$sb.AppendLine("_$unknownAuthor further mods have no author recorded._") }
    if ($adultHidden)   { [void]$sb.AppendLine("_$adultHidden adult mods omitted._") }
    [void]$sb.AppendLine()
    [void]$sb.AppendLine("_Generated $stamp._")
    Set-Content -LiteralPath $Md -Value $sb.ToString() -Encoding UTF8
    Write-Host "wrote $((Resolve-Path -LiteralPath $Md).Path)" -ForegroundColor Green
}

if ($NoHtml) { exit 0 }

$rows = foreach ($a in $authors) {
    $list = ($byAuthor[$a] | Sort-Object | ForEach-Object { Get-Esc $_ }) -join '<span class="dot">&middot;</span>'
    "<div class=""credit""><div class=""who"">$(Get-Esc $a)</div><div class=""what"">$list</div></div>"
}

$doc = @"
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Night City - mod credits</title>
<style>
  :root { --bg:#07070a; --ink:#e8e6e3; --dim:#8a8f9a; --hot:#fcee0a; --cool:#00f0ff; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
         font:16px/1.6 "Segoe UI",system-ui,sans-serif; }
  .wrap { max-width:820px; margin:0 auto; padding:72px 28px 96px; }
  h1 { font:700 clamp(30px,6vw,52px)/1.08 "Segoe UI",system-ui,sans-serif;
       letter-spacing:-.02em; margin:0 0 6px; }
  h1 em { font-style:normal; color:var(--hot); }
  .sub { color:var(--dim); font-size:15px; margin-bottom:14px; }
  .count { display:flex; gap:34px; flex-wrap:wrap; margin:26px 0 54px;
           padding:20px 0; border-top:1px solid #1b1d24; border-bottom:1px solid #1b1d24; }
  .count div { min-width:96px; }
  .count b { display:block; font:700 30px/1.1 "Segoe UI",system-ui,sans-serif; color:var(--cool); }
  .count span { color:var(--dim); font-size:12px; text-transform:uppercase; letter-spacing:.12em; }
  .credit { display:grid; grid-template-columns:minmax(150px,26%) 1fr; gap:20px;
            padding:12px 0; border-top:1px solid #14161c; }
  .credit:hover { background:#0c0e13; }
  .who { font-weight:600; color:var(--hot); overflow-wrap:anywhere; }
  .what { color:var(--dim); font-size:14px; overflow-wrap:anywhere; }
  .dot { padding:0 7px; opacity:.4; }
  .empty { border:1px solid #1b1d24; padding:18px 20px; color:var(--dim); font-size:14px; }
  .empty code { color:var(--cool); }
  footer { margin-top:56px; color:var(--dim); font-size:13px; line-height:1.8; }
  @media (max-width:620px) { .credit { grid-template-columns:1fr; gap:4px; } }
</style></head><body>
<div class="wrap">
  <h1>Night City, as modded by <em>$($authors.Count) people</em></h1>
  <div class="sub">None of them met. All of them are in this game.</div>

  <div class="count">
    <div><b>$($mods.Count)</b><span>mods</span></div>
    <div><b>$($authors.Count)</b><span>authors</span></div>
    <div><b>$single</b><span>made just one</span></div>
  </div>

$(if ($authors.Count -eq 0) { @"
  <div class="empty">No authors on record yet. Names come from Nexus metadata, which
  <code>New-ModManifest.ps1</code> caches when it runs with an API key - run that once
  and this page fills in. Nothing is wrong with the install.</div>
"@ })
$($rows -join "`n")

  <footer>
    $(if ($unknownAuthor) { "$unknownAuthor further mods have no author on record.<br>" })
    $(if ($adultHidden) { "$adultHidden adult mods omitted.<br>" })
    Generated $stamp.
  </footer>
</div>
</body></html>
"@

$dir = Split-Path -Parent $Html
if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
Set-Content -LiteralPath $Html -Value $doc -Encoding UTF8
Write-Host "wrote $((Resolve-Path -LiteralPath $Html).Path)" -ForegroundColor Green
exit 0
