# New-ModDossier.ps1 -- everything this install knows about ONE mod.
#
#     .\New-ModDossier.ps1 -Mod 'Wannabe Edgerunner' -GameRoot '<path>'
#     .\New-ModDossier.ps1 -Mod 'edgerunner' -GameRoot '<path>' -StagingRoot '<staging>'
#
# WHAT THIS IS FOR
#
# The question a modder actually asks is "I installed this - is it working?", and
# nothing answers it, because a mod is not one thing. It is up to seven separate
# payloads, each deployed to a different place, each failing in its own silent
# way:
#
#   archive     present, enabled, and beaten to every file it contests
#   .reds       on disk but not in the compiled bundle, so not running
#   CET         a folder with no init.lua does nothing and says nothing
#   TweakXL     a .yaml that never loaded looks exactly like one that did
#   input XML   a binding the user rebound elsewhere
#   settings    the mod's shipped default, mistaken for the user's choice
#   overrides   your patch, still winning over the author's newer file
#
# Every one of those is answerable from disk. None of them is answerable from the
# same place as the others, which is why this exists: it walks the mod's own
# staging folder to learn what it SHOULD deploy, then checks each layer for what
# it ACTUALLY does, and says so per layer rather than as a single verdict.
#
# It reads. It never writes to the install.

[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string] $Mod,
    [Parameter(Mandatory)] [string] $GameRoot,

    # Vortex-style staging root. Auto-detected when omitted; MO2 needs its
    # instance 'mods' folder passed explicitly.
    [string] $StagingRoot,

    [string] $Html = "$env:USERPROFILE\Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\reports\mod-dossier.html",
    [switch] $NoHtml,

    # The same dossier as markdown. This is the report most likely to be pasted
    # into a help thread - "here is everything this mod ships and what of it is
    # running" - and a thread wants text, not an HTML file nobody can open.
    [string] $Md,

    # Show the real paths. Off by default: a dossier is something people paste
    # into a thread when asking why a mod does nothing.
    [switch] $NoRedact
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

if (-not $StagingRoot) {
    $StagingRoot = @(
        (Join-Path $env:APPDATA 'Vortex\cyberpunk2077\mods')
        (Join-Path $env:APPDATA 'Vortex\cyberpunk\mods')
    ) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}
if (-not $StagingRoot -or -not (Test-Path -LiteralPath $StagingRoot)) {
    throw @"
No mod staging folder found. Pass -StagingRoot:
  Vortex - Settings > Mods > "Mod Staging Folder"
  MO2    - the 'mods' folder inside your instance
A fully manual install has no staging tree, so there is nothing to walk.
"@
}

function Hide-Path {
    param([string] $Text)
    if ($NoRedact -or -not $Text) { return $Text }
    $s = $Text -replace [regex]::Escape([string]$env:USERPROFILE), '~'
    if ($env:USERNAME) { $s = $s -replace "(?i)\\$([regex]::Escape([string]$env:USERNAME))\b", '\<user>' }
    return $s
}

# ------------------------------------------------------------- find the mod --

# Vortex encodes <Display Name>-<NexusID>-<version>-<timestamp> into the folder
# name. That is the only reason name, link and install date are free.
function ConvertFrom-StagingName {
    param([string] $Folder)
    if ($Folder -match '^(?<name>.+?)-(?<id>\d+)-(?<ver>.*?)-(?<ts>\d{10})$') {
        return [pscustomobject]@{
            Name    = $matches['name']
            NexusId = [int]$matches['id']
            Version = ($matches['ver'] -replace '-', '.')
            Installed = [DateTimeOffset]::FromUnixTimeSeconds([int64]$matches['ts']).LocalDateTime
        }
    }
    # MO2 and hand-unzipped folders do not match, and are still real mods.
    return [pscustomobject]@{ Name = $Folder; NexusId = $null; Version = $null; Installed = $null }
}

$all = @(Get-ChildItem -LiteralPath $StagingRoot -Directory)
$hits = @($all | Where-Object { $_.Name -like "*$Mod*" })
if (-not $hits.Count) {
    # Try the display half of the Vortex convention, so 'Wannabe Edgerunner'
    # matches 'Wannabe Edgerunner-12345-2-1-0-1700000000'.
    $hits = @($all | Where-Object { (ConvertFrom-StagingName $_.Name).Name -like "*$Mod*" })
}
if (-not $hits.Count) {
    # Last resort: ignore spacing and punctuation entirely. People type a mod's
    # name the way the mod page writes it, and the folder is whatever the author
    # zipped - 'MutedMarkers' and 'Muted Markers' are the same mod, and failing
    # to find it reads as "you do not have this installed".
    $flat = ($Mod -replace '[^A-Za-z0-9]', '')
    if ($flat) {
        $hits = @($all | Where-Object { ($_.Name -replace '[^A-Za-z0-9]', '') -like "*$flat*" })
    }
}
if (-not $hits.Count) {
    Write-Host "No staged mod matching '$Mod'." -ForegroundColor Red
    $near = @($all | Where-Object { $_.Name -match ([regex]::Escape(($Mod -split '\s+')[0])) } | Select-Object -First 8)
    if ($near) {
        Write-Host 'Closest folder names:' -ForegroundColor DarkGray
        $near | ForEach-Object { Write-Host "  $($_.Name)" -ForegroundColor DarkGray }
    }
    exit 1
}
if ($hits.Count -gt 1) {
    Write-Host "'$Mod' matches $($hits.Count) staged mods:" -ForegroundColor Yellow
    $hits | Select-Object -First 12 | ForEach-Object { Write-Host "  $((ConvertFrom-StagingName $_.Name).Name)" }
    Write-Host 'Narrow it down - a dossier is about one mod.' -ForegroundColor DarkGray
    exit 1
}

$stage = $hits[0]
$meta  = ConvertFrom-StagingName $stage.Name

# --------------------------------------------------------------- footprint ---

# What the staging folder holds IS what it deploys, path for path. That makes the
# footprint exact rather than inferred - no guessing from the mod's category or
# its page.
$staged = @(Get-ChildItem -LiteralPath $stage.FullName -Recurse -File |
            Where-Object { $_.Name -ne '__folder_managed_by_vortex' })

$layers = [ordered]@{}
function Add-Layer {
    param([string] $Kind, [string] $Rel)
    if (-not $layers.Contains($Kind)) { $layers[$Kind] = @() }
    $layers[$Kind] += $Rel
}

foreach ($f in $staged) {
    $rel = $f.FullName.Substring($stage.FullName.Length + 1)
    switch -Regex ($rel) {
        '^archive\\pc\\mod\\.+\.archive$'                  { Add-Layer 'archive' $rel; continue }
        '^archive\\pc\\mod\\.+\.xl$'                       { Add-Layer 'archivexl' $rel; continue }
        '^mods\\'                                          { Add-Layer 'redmod' $rel; continue }
        '^r6\\scripts\\'                                   { Add-Layer 'redscript' $rel; continue }
        '^r6\\tweaks\\'                                    { Add-Layer 'tweakxl' $rel; continue }
        '^r6\\input\\.+\.xml$'                             { Add-Layer 'input' $rel; continue }
        '^red4ext\\plugins\\'                              { Add-Layer 'red4ext' $rel; continue }
        '^bin\\x64\\plugins\\cyber_engine_tweaks\\mods\\'  { Add-Layer 'cet' $rel; continue }
        '^bin\\x64\\plugins\\.+\.asi$'                     { Add-Layer 'asi' $rel; continue }
        default                                            { Add-Layer 'other' $rel }
    }
}

# ------------------------------------------------------------------ checks ---

$findings = New-Object System.Collections.Generic.List[object]
function Add-Finding {
    param([string] $Layer, [string] $State, [string] $Detail)
    # State is one of: live, dormant, unknown. "unknown" is a first-class answer
    # here: several layers cannot be confirmed from disk at all, and saying so is
    # the difference between a report and a guess.
    $findings.Add([pscustomobject]@{ Layer = $Layer; State = $State; Detail = $Detail })
}

# --- deployed at all? --------------------------------------------------------
$deployedCount = 0
foreach ($f in $staged) {
    $rel = $f.FullName.Substring($stage.FullName.Length + 1)
    if (Test-Path -LiteralPath (Join-Path $GameRoot $rel)) { $deployedCount++ }
}
$deployRatio = if ($staged.Count) { $deployedCount / $staged.Count } else { 0 }

if ($deployedCount -eq 0) {
    Add-Finding 'deployment' 'dormant' "None of its $($staged.Count) files are in the game directory. It is staged but not deployed - on a virtualising setup (MO2) that is normal with the game closed, and on Vortex it means the deployment did not run."
} elseif ($deployRatio -lt 1) {
    Add-Finding 'deployment' 'unknown' "$deployedCount of $($staged.Count) files are in the game directory. A partial deployment usually means another mod owns the rest, or a conflict rule excluded them."
} else {
    Add-Finding 'deployment' 'live' "All $($staged.Count) files are in place."
}

# --- archives: listed, and where ---------------------------------------------
$modlist = Join-Path $GameRoot 'archive\pc\mod\modlist.txt'
$listed = @()
if (Test-Path -LiteralPath $modlist) {
    # '#' is a filename character here, not a comment marker. Stripping it drops
    # real entries and then reports them as unlisted.
    $listed = @(Get-Content -LiteralPath $modlist | Where-Object { $_.Trim() })
}
foreach ($a in @($layers['archive'] | Where-Object { $_ })) {
    $leaf = Split-Path $a -Leaf
    if (-not $listed.Count) {
        Add-Finding 'archive' 'unknown' "$leaf - no modlist.txt on this install, so load order is alphabetical."
        continue
    }
    $idx = [array]::IndexOf($listed, $leaf)
    if ($idx -lt 0) {
        Add-Finding 'archive' 'dormant' "$leaf is not in modlist.txt. An unlisted archive sorts last, which under earlier-wins is the bottom of the stack - it loses every file it contests."
    } else {
        $pos = $idx + 1
        $where = if ($pos -le $listed.Count * 0.33) { 'early - it wins most contests' }
                 elseif ($pos -ge $listed.Count * 0.66) { 'late - it loses most contests' }
                 else { 'mid-list' }
        Add-Finding 'archive' 'live' "$leaf is entry $pos of $($listed.Count) ($where)."
    }
}

# --- redscript: is the code in the compiled bundle? --------------------------
# This is the layer that lies most convincingly, and the only one with a
# purpose-built check. Reuse it rather than re-deriving the answer here.
$scriptFolders = @($layers['redscript'] | Where-Object { $_ } | ForEach-Object { ($_ -split '\\')[2] } | Select-Object -Unique)
if ($scriptFolders.Count) {
    $liveTool = Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) 'cyberwise\tools\Test-ScriptsLive.ps1'
    foreach ($sf in $scriptFolders) {
        if (-not (Test-Path -LiteralPath $liveTool)) {
            Add-Finding 'redscript' 'unknown' "$sf - Test-ScriptsLive.ps1 not found beside this skill, so the compiled bundle was not checked."
            continue
        }
        $out = & $liveTool -GameRoot $GameRoot -Mod $sf *>&1 | Out-String
        if ($out -match 'ABSENT') {
            $absent = @([regex]::Matches($out, '(?m)^\s+(\S+)\s+ABSENT') | ForEach-Object { $_.Groups[1].Value })
            Add-Finding 'redscript' 'dormant' "$sf - $($absent.Count) declared symbol(s) are not in the compiled bundle ($(($absent | Select-Object -First 3) -join ', ')). Its code is not running until the game is launched again."
        } elseif ($out -match 'in the bundle') {
            Add-Finding 'redscript' 'live' "$sf - its declarations are in the bundle the game loads."
        } else {
            Add-Finding 'redscript' 'unknown' "$sf - declares nothing verifiable. A @wrapMethod-only patch looks like this and works fine."
        }
    }
}

# --- CET: a folder is not a mod ----------------------------------------------
foreach ($c in (@($layers['cet'] | Where-Object { $_ }) | ForEach-Object { ($_ -split '\\')[5] } | Select-Object -Unique)) {
    $init = Join-Path $GameRoot "bin\x64\plugins\cyber_engine_tweaks\mods\$c\init.lua"
    if (Test-Path -LiteralPath $init) {
        Add-Finding 'cet' 'live' "$c has an init.lua - CET will load it."
    } else {
        Add-Finding 'cet' 'dormant' "$c has no init.lua. CET loads that file and nothing else; without it the folder does nothing."
    }
}

# --- TweakXL / ArchiveXL: present is all disk can tell us --------------------
foreach ($kind in 'tweakxl', 'archivexl', 'red4ext', 'asi', 'redmod', 'input') {
    # $layers[$missing] yields $null, and @($null) is an array of ONE - so a mod
    # with no TweakXL files reported "1 of 1 file(s) deployed", because
    # Join-Path with a null tail resolves to the game root, which exists. Every
    # mod looked like it shipped every layer. Ask whether the key exists.
    if (-not $layers.Contains($kind)) { continue }
    $items = @($layers[$kind] | Where-Object { $_ })
    if (-not $items.Count) { continue }
    $deployed = @($items | Where-Object { Test-Path -LiteralPath (Join-Path $GameRoot $_) })
    if ($deployed.Count -eq 0) {
        Add-Finding $kind 'dormant' "$($items.Count) file(s) staged, none deployed."
    } else {
        $note = switch ($kind) {
            'tweakxl'   { 'TweakXL merges per record, so this can be partially overridden by another mod without either failing.' }
            'archivexl' { 'An .xl adds paths and variants; the log is the only place that says it loaded.' }
            'red4ext'   { 'A plugin whose DLL fails to load never runs its scripts either - check the RED4ext log.' }
            'input'     { 'Shipped bindings. What the user actually pressed lives in a different file entirely.' }
            default     { '' }
        }
        Add-Finding $kind 'live' ("$($deployed.Count) of $($items.Count) file(s) deployed. " + $note).Trim()
    }
}

# --- the user's own settings for it -------------------------------------------
# Sections in user.ini are `<Module>.<Class>`, keyed on the mod's REDSCRIPT
# module rather than its display name - so read the modules out of its own staged
# sources and match on those. Matching the display name alone misses every mod
# whose module is spelled differently, which is most of them; it stays as a
# fallback because a mod with no .reds can still register settings.
$userIni = Join-Path $GameRoot 'red4ext\plugins\mod_settings\user.ini'
$settings = @()
if (Test-Path -LiteralPath $userIni) {
    $modules = [Collections.Generic.HashSet[string]]::new()
    foreach ($rel in @($layers['redscript'] | Where-Object { $_ })) {
        $src = Join-Path $stage.FullName $rel
        if (-not (Test-Path -LiteralPath $src)) { continue }
        foreach ($m in [regex]::Matches([IO.File]::ReadAllText($src), '(?m)^\s*module\s+([A-Za-z0-9_.]+)')) {
            [void]$modules.Add($m.Groups[1].Value)
        }
    }
    $needle = ($meta.Name -replace '[^A-Za-z0-9]', '')

    $current = $null
    foreach ($line in (Get-Content -LiteralPath $userIni)) {
        if ($line -match '^\s*\[(.+?)\]\s*$') { $current = $matches[1]; continue }
        if (-not $current) { continue }
        $owned = ($modules | Where-Object { $current -eq $_ -or $current.StartsWith("$_.") }).Count -gt 0
        if (-not $owned -and $needle) { $owned = ($current -replace '[^A-Za-z0-9]', '') -like "*$needle*" }
        if ($owned -and $line -match '^\s*([^=]+?)\s*=\s*(.+?)\s*$') {
            $settings += [pscustomobject]@{ Section = $current; Key = $matches[1]; Value = $matches[2] }
        }
    }
}

# --- overrides registered against it ------------------------------------------
$patchStore = Join-Path $env:USERPROFILE 'Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\patches.json'
$patches = @()
if (Test-Path -LiteralPath $patchStore) {
    try {
        # The store is a bare ARRAY of records, not an object with a .patches
        # property. Reading it as the latter silently yields nothing, and a
        # dossier that omits your own overrides is worse than one that has none:
        # an override that keeps winning after the author's update is the failure
        # this whole family exists to make visible.
        $records = @(Get-Content -LiteralPath $patchStore -Raw | ConvertFrom-Json)
        $patches = @($records | Where-Object {
            $_.Name -like "*$($meta.Name)*" -or
            $_.UpstreamPath -like "*$($stage.Name)*" -or
            $_.OverridePath -like "*$($meta.Name)*" -or
            $_.Note -like "*$($meta.Name)*"
        })
    } catch { $patches = @() }
}

# ------------------------------------------------------------------ verdict --

$live    = @($findings | Where-Object { $_.State -eq 'live' })
$dormant = @($findings | Where-Object { $_.State -eq 'dormant' })

$verdict =
    if ($dormant.Count -and -not $live.Count) { 'nothing this mod ships is doing anything' }
    elseif ($dormant.Count)                   { "$($dormant.Count) of its $($findings.Count) layers are dormant" }
    else                                      { 'every layer it ships is in place' }

# ------------------------------------------------------------------ console --

Write-Host ''
Write-Host $meta.Name -ForegroundColor Cyan
$idLine = @()
if ($meta.Version)   { $idLine += "v$($meta.Version)" }
if ($meta.Installed) { $idLine += "installed $($meta.Installed.ToString('yyyy-MM-dd'))" }
if ($meta.NexusId)   { $idLine += "nexusmods.com/cyberpunk2077/mods/$($meta.NexusId)" }
if ($idLine) { Write-Host ("  " + ($idLine -join '  //  ')) -ForegroundColor DarkGray }
Write-Host ("  staged at " + (Hide-Path $stage.FullName)) -ForegroundColor DarkGray
Write-Host ''
Write-Host "  $verdict" -ForegroundColor $(if ($dormant.Count -and -not $live.Count) { 'Red' } elseif ($dormant.Count) { 'Yellow' } else { 'Green' })
Write-Host ''

foreach ($f in $findings) {
    $colour = switch ($f.State) { 'live' { 'DarkGreen' } 'dormant' { 'Red' } default { 'DarkYellow' } }
    Write-Host ("  {0,-11} {1,-8} {2}" -f $f.Layer, $f.State, $f.Detail) -ForegroundColor $colour
}

if ($settings.Count) {
    Write-Host ''
    Write-Host "  SETTINGS YOU CHANGED ($($settings.Count))" -ForegroundColor Cyan
    $settings | Select-Object -First 12 | ForEach-Object {
        Write-Host ("    {0,-46} {1}" -f $_.Key, $_.Value) -ForegroundColor DarkGray
    }
    if ($settings.Count -gt 12) { Write-Host "    ...and $($settings.Count - 12) more" -ForegroundColor DarkGray }
}

if ($patches.Count) {
    Write-Host ''
    Write-Host "  YOUR OVERRIDES ON IT ($($patches.Count))" -ForegroundColor Cyan
    $patches | ForEach-Object { Write-Host ("    {0} - {1}" -f $_.Name, $_.Note) -ForegroundColor DarkGray }
    Write-Host '    Run Test-ModPatches after any update to this mod.' -ForegroundColor DarkGray
}

# ----------------------------------------------------------------- markdown --

if ($Md) {
    $mb = [Text.StringBuilder]::new()
    $bar = { param($x) ([string]$x) -replace '\|', '\|' }

    [void]$mb.AppendLine("# $($meta.Name)")
    [void]$mb.AppendLine()
    $id = @()
    if ($meta.Version)   { $id += "v$($meta.Version)" }
    if ($meta.Installed) { $id += "installed $($meta.Installed.ToString('yyyy-MM-dd'))" }
    if ($meta.NexusId)   { $id += "[nexus $($meta.NexusId)](https://www.nexusmods.com/cyberpunk2077/mods/$($meta.NexusId))" }
    if ($id) { [void]$mb.AppendLine(($id -join ' - ')); [void]$mb.AppendLine() }
    [void]$mb.AppendLine("**$verdict**")
    [void]$mb.AppendLine()
    [void]$mb.AppendLine('| Layer | State | Detail |')
    [void]$mb.AppendLine('| --- | --- | --- |')
    foreach ($f in $findings) {
        [void]$mb.AppendLine("| $(& $bar $f.Layer) | $(& $bar $f.State) | $(& $bar $f.Detail) |")
    }
    [void]$mb.AppendLine()
    if ($settings.Count) {
        [void]$mb.AppendLine("## Settings you changed ($($settings.Count))")
        [void]$mb.AppendLine()
        foreach ($s in $settings) { [void]$mb.AppendLine("- ``$($s.Key)`` = $($s.Value)") }
        [void]$mb.AppendLine()
    }
    if ($patches.Count) {
        [void]$mb.AppendLine("## Your overrides on it ($($patches.Count))")
        [void]$mb.AppendLine()
        foreach ($pa in $patches) { [void]$mb.AppendLine("- **$($pa.Name)** - $($pa.Note)") }
        [void]$mb.AppendLine()
    }
    # Hide-Path, not the raw path: the markdown is the variant that gets pasted,
    # so it is the one that must not carry a username.
    [void]$mb.AppendLine("_$(Hide-Path $stage.FullName) - generated $(Get-Date -Format 'yyyy-MM-dd HH:mm') by cyberwise._")

    $mdText = $mb.ToString()
    $dirM = Split-Path -Parent $Md
    if ($dirM -and -not (Test-Path -LiteralPath $dirM)) { New-Item -ItemType Directory -Path $dirM -Force | Out-Null }
    Set-Content -LiteralPath $Md -Value $mdText -Encoding UTF8
    Write-Host ''
    Write-Host "wrote $((Resolve-Path -LiteralPath $Md).Path)" -ForegroundColor Green
    # Discord refuses a message over 2000 characters rather than truncating it.
    if ($mdText.Length -gt 2000) {
        Write-Host "  $($mdText.Length) chars - too long for one Discord message (2000 max); attach the file" -ForegroundColor DarkYellow
    }
}

# --------------------------------------------------------------------- html --

if (-not $NoHtml) {
    function E { param([string]$s) ($s -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;') }

    $rows = foreach ($f in $findings) {
        $cls = switch ($f.State) { 'live' { 'ok' } 'dormant' { 'bad' } default { 'meh' } }
        "<tr class=""$cls""><td class=""layer"">$(E $f.Layer)</td><td class=""state"">$(E $f.State)</td><td>$(E $f.Detail)</td></tr>"
    }
    $setRows = foreach ($s in $settings) {
        "<tr><td class=""layer"">$(E $s.Key)</td><td colspan=""2"">$(E $s.Value)</td></tr>"
    }
    $patchRows = foreach ($p in $patches) {
        "<tr><td class=""layer"">$(E $p.Name)</td><td colspan=""2"">$(E $p.Note)</td></tr>"
    }

    $vclass = if ($dormant.Count -and -not $live.Count) { 'bad' } elseif ($dormant.Count) { 'meh' } else { 'ok' }
    $link = if ($meta.NexusId) { "<a href=""https://www.nexusmods.com/cyberpunk2077/mods/$($meta.NexusId)"">nexus $($meta.NexusId)</a>" } else { '' }

    $doc = @"
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>$(E $meta.Name) - mod dossier</title>
<style>
  :root { --bg:#08090c; --panel:#0e1117; --line:#1c2230; --text:#c8d2e0; --dim:#6b7686;
          --cyan:#22d3ee; --yellow:#fde047; --red:#f87171; --green:#4ade80; }
  * { box-sizing:border-box; }
  body { margin:0; padding:28px 32px; background:var(--bg); color:var(--text);
         font:14px/1.55 "Segoe UI",system-ui,sans-serif; }
  h1 { margin:0; font:600 26px/1.2 "Consolas",monospace; letter-spacing:.02em; }
  h1 span { color:var(--cyan); }
  .sub { color:var(--dim); font:12px/1.6 "Consolas",monospace; margin:6px 0 22px; }
  .sub a { color:var(--cyan); text-decoration:none; }
  .verdict { padding:14px 18px; border-left:3px solid var(--dim); background:var(--panel);
             margin-bottom:26px; font-size:15px; }
  .verdict.ok  { border-color:var(--green); }
  .verdict.meh { border-color:var(--yellow); }
  .verdict.bad { border-color:var(--red); }
  h2 { font:600 12px/1 "Consolas",monospace; letter-spacing:.14em; text-transform:uppercase;
       color:var(--cyan); margin:26px 0 10px; }
  table { width:100%; border-collapse:collapse; background:var(--panel); }
  td { padding:9px 12px; border-top:1px solid var(--line); vertical-align:top; }
  tr:first-child td { border-top:none; }
  .layer { font-family:"Consolas",monospace; color:var(--text); white-space:nowrap; width:120px; }
  .state { font-family:"Consolas",monospace; width:80px; }
  tr.ok  .state { color:var(--green); }
  tr.bad .state { color:var(--red); }
  tr.meh .state { color:var(--yellow); }
  footer { margin-top:30px; color:var(--dim); font:11px/1.6 "Consolas",monospace;
           border-top:1px solid var(--line); padding-top:12px; }
</style></head><body>
<h1>$(E $meta.Name)<span> // dossier</span></h1>
<div class="sub">$(if ($meta.Version) { "v$(E $meta.Version) &nbsp;//&nbsp; " })$(if ($meta.Installed) { "installed $($meta.Installed.ToString('yyyy-MM-dd')) &nbsp;//&nbsp; " })$link</div>
<div class="verdict $vclass">$(E $verdict)</div>
<h2>Layers</h2>
<table>$($rows -join "`n")</table>
$(if ($setRows) { "<h2>Settings you changed</h2><table>$($setRows -join "`n")</table>" })
$(if ($patchRows) { "<h2>Your overrides on it</h2><table>$($patchRows -join "`n")</table>" })
<footer>$(E (Hide-Path $stage.FullName)) &nbsp;//&nbsp; generated $(Get-Date -Format 'yyyy-MM-dd HH:mm') by CYBERWISE</footer>
</body></html>
"@

    $dir = Split-Path -Parent $Html
    if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Set-Content -LiteralPath $Html -Value $doc -Encoding UTF8
    Write-Host ''
    Write-Host "wrote $((Resolve-Path -LiteralPath $Html).Path)" -ForegroundColor Green
}

exit 0
