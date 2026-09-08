<#
.SYNOPSIS
    Generate a readable manifest of an installed Cyberpunk 2077 mod list.

.DESCRIPTION
    Answers "what is all this stuff and what does it do", which no mod manager
    shows you in one place.

    Works in two tiers:

      Tier 1 (always, offline)
        Mod name, Nexus ID and URL, version, install date, and what the mod
        actually deploys - archives, redscript, CET, tweaks, REDmod, ASI, input.
        All of this comes from the staging folder name and layout, so it needs
        no credentials and no network.

      Tier 2 (optional, -NexusApiKey)
        Adds the one-line summary, category, author and the adult-content flag
        straight from Nexus. Responses are cached to disk, so a second run costs
        nothing and you can re-render the report freely.

    Why the folder name is often enough for tier 1: Vortex encodes
    <Display Name>-<NexusID>-<version>-<timestamp> when it installs from Nexus,
    and that one convention yields the name, a working URL and the install date.

    Other managers do not. Mod Organizer 2 names a mod folder whatever the user
    named it, and a hand-unzipped folder is whatever was in the archive. Those
    still list - name, footprint and file count all come from the folder itself -
    they just carry no Nexus link, version or install date, and the report says
    how many entries are in that position rather than quietly showing less.

.PARAMETER StagingRoot
    Folder holding one subfolder per mod. Vortex: the "Mod Staging Folder" from
    Settings > Mods. MO2: the "mods" folder inside the instance. No manager: any
    folder you keep unpacked mods in. Guessed from the usual Vortex locations
    when omitted.

.PARAMETER NexusApiKey
    Personal API key from nexusmods.com/users/myaccount?tab=api. Without it the
    manifest still generates; it just has no descriptions and NSFW filtering
    falls back to a name heuristic that is clearly labelled as approximate.

.PARAMETER NoNexus
    Never contact Nexus, even if a key is stored in Credential Manager. Produces
    the tier 1 manifest only - name, id, version, install date, footprint - with
    no network access at all.

.PARAMETER HideNSFW
    Omit adult-flagged mods entirely. With an API key this uses Nexus's own
    contains_adult_content flag. Without one it uses a keyword heuristic, which
    WILL miss things - the report says so rather than implying certainty.

.EXAMPLE
    .\New-ModManifest.ps1
    .\New-ModManifest.ps1 -NexusApiKey abc123 -HideNSFW -Out manifest.md
    .\New-ModManifest.ps1 -NoNexus -Out inventory.md
#>

[CmdletBinding()]
param(
    [string] $StagingRoot,
    [string] $GameRoot,
    [string] $Game        = 'cyberpunk2077',
    [string] $NexusApiKey,
    # Skip the Nexus lookup entirely, even if a key is stored. Tier 1 only.
    [switch] $NoNexus,
    # Show the real staging path in the report. Paths carry the username.
    [switch] $NoRedact,
    [switch] $HideNSFW,
    # Written to the current directory, not beside the script: the script may
    # live in a shared or read-only skill folder, and a manifest is a listing of
    # somebody's install - it belongs where they ran the command, not in the
    # tool's own directory where it can end up committed by accident.
    [string] $Out         = "$env:USERPROFILE\Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\reports\mod-manifest.md",
    [string] $CachePath,
    [string] $OverridePath,
    [string] $HtmlOut,
    [switch] $NoHtml,
    [int]    $ThrottleMs  = 120
)

# $PSScriptRoot is EMPTY inside a param default on Windows PowerShell 5.1
# when the script is run with -File or dot-sourced - it is only populated
# under the call operator, and pwsh 7 populates it in every case. So the
# default below is resolved HERE, where it is correct on both engines and
# by every invocation route. See cyberwise/references/environment.md.

if (-not $OverridePath) { $OverridePath = (Join-Path $PSScriptRoot 'nsfw-overrides.json') }

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


# ---------------------------------------------------------------- discovery --

# The Nexus API cache is per-user data, not part of the tool, so it defaults to
# LOCALAPPDATA. An existing cache beside the script still wins, so nobody loses
# one they already built up.
if (-not $CachePath) {
    $legacyCache = Join-Path $PSScriptRoot '.nexus-cache.json'
    $CachePath = if (Test-Path -LiteralPath $legacyCache) { $legacyCache }
                 else { Join-Path ([string]$env:LOCALAPPDATA) 'cyberwise\nexus-cache.json' }
}

# Only Vortex has a predictable staging location. MO2 keeps its mods inside
# whichever instance folder the user chose, and a self-managed install is
# wherever they put it - neither can be guessed, so both are asked for.
if (-not $StagingRoot) {
    $guesses = New-Object System.Collections.Generic.List[string]
    $guesses.Add((Join-Path ([string]$env:APPDATA) "Vortex\$Game\mods"))
    # Vortex's other common layout is <drive>:\Vortex Mods\<game>, used whenever
    # the staging folder was moved off the system drive.
    foreach ($d in ([IO.DriveInfo]::GetDrives() | Where-Object { $_.DriveType -eq 'Fixed' -and $_.IsReady })) {
        $guesses.Add((Join-Path $d.RootDirectory.FullName "Vortex Mods\$Game"))
    }
    $StagingRoot = $guesses | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}
if (-not $StagingRoot -or -not (Test-Path -LiteralPath $StagingRoot)) {
    throw @"
Could not find a mod staging folder. Pass -StagingRoot explicitly:
  Vortex - Settings > Mods > "Mod Staging Folder" (default %APPDATA%\Vortex\$Game\mods)
  MO2    - the 'mods' folder inside your instance (Tools > Settings > Paths)
  neither - any folder holding one subfolder per unpacked mod
"@
}

Write-Host "staging: $StagingRoot" -ForegroundColor DarkGray

# The HTML renderer is dot-sourced HERE rather than at the point of use, because
# the markdown report needs its path-redaction helper as well - and the markdown
# is written first. Sourcing it only for the HTML is how the markdown header came
# to ship an un-redacted staging path while the HTML header was already safe.
$htmlHelper = Join-Path $PSScriptRoot 'ModManifestHtml.ps1'
$htmlHelperLoaded = Test-Path -LiteralPath $htmlHelper
if ($htmlHelperLoaded) { . $htmlHelper }

# ------------------------------------------------------------------ parsing --

# Vortex's folder convention, for mods it installed from Nexus:
#   <Display Name>-<NexusID>-<version>-<unix timestamp>
# Nothing else guarantees it - an MO2 folder or a hand-unzipped one simply does
# not match, and those mods fall back to the folder name alone. Non-matching
# folders are counted and reported, never dropped.
# The version segment is NOT always numeric - real examples include "2k",
# "1-0-beta", "v2". Anchor on the trailing 10-digit unix timestamp and the
# numeric id instead, and let the version be anything between them.
$namePattern = '^(?<name>.+?)-(?<id>\d+)-(?<ver>.*?)-(?<ts>\d{10})$'

# Where a mod deploys tells you what kind of mod it is - more reliably than its
# name does. Order matters: first match wins for the primary label.
$footprintMap = [ordered]@{
    'archive\pc\mod'                              = 'archive'
    'archive\pc\patch'                             = 'archive'
    'mods'                                         = 'REDmod'
    'r6\scripts'                                   = 'redscript'
    'r6\tweaks'                                    = 'tweak'
    'r6\input'                                     = 'input'
    'bin\x64\plugins\cyber_engine_tweaks\mods'     = 'CET'
    'red4ext\plugins'                              = 'RED4ext'
    'bin\x64\plugins'                              = 'ASI'
}

function Get-Footprint {
    param([string]$Dir)
    $hits = New-Object System.Collections.Generic.List[string]
    foreach ($rel in $footprintMap.Keys) {
        $p = Join-Path $Dir $rel
        if (-not (Test-Path -LiteralPath $p)) { continue }

        # bin\x64\plugins is an ANCESTOR of the CET mods path, so a plain
        # Test-Path tags every CET mod as an ASI plugin too. Only call it ASI if
        # something lives there that is not the cyber_engine_tweaks subtree.
        if ($rel -eq 'bin\x64\plugins') {
            $other = Get-ChildItem -LiteralPath $p -Force -ErrorAction SilentlyContinue |
                     Where-Object { $_.Name -ne 'cyber_engine_tweaks' }
            if (-not $other) { continue }
        }

        $label = $footprintMap[$rel]
        if (-not $hits.Contains($label)) { $hits.Add($label) }
    }
    if ($hits.Count -eq 0) { $hits.Add('other') }
    return $hits
}

$mods = New-Object System.Collections.Generic.List[object]

foreach ($d in (Get-ChildItem -LiteralPath $StagingRoot -Directory)) {
    $entry = [ordered]@{
        Folder    = $d.Name
        Name      = $d.Name
        NexusId   = $null
        Version   = $null
        Installed = $null
        Footprint = (Get-Footprint $d.FullName)
        Files     = (Get-ChildItem -LiteralPath $d.FullName -Recurse -File -ErrorAction SilentlyContinue).Count
        Summary   = $null
        Category  = $null
        Author    = $null
        Adult     = $null
    }
    if ($d.Name -match $namePattern) {
        $entry.Name      = $matches['name']
        $entry.NexusId   = [int]$matches['id']
        $entry.Version   = ($matches['ver'] -replace '-', '.')
        $entry.Installed = [DateTimeOffset]::FromUnixTimeSeconds([int64]$matches['ts']).LocalDateTime
    }
    $mods.Add([pscustomobject]$entry)
}

$withId = @($mods | Where-Object NexusId).Count
Write-Host "found $($mods.Count) mods; $withId carry a Nexus ID" -ForegroundColor DarkGray
if ($mods.Count -gt 0 -and $withId -eq 0) {
    Write-Warning ("no folder name matched <Name>-<NexusID>-<version>-<timestamp>, so this is " +
                   "almost certainly not a Vortex staging folder. Everything still lists, but " +
                   "with no Nexus link, version, install date or descriptions.")
}

# -------------------------------------------------------------- enrichment --

# Fall back to Windows Credential Manager so the key never has to be typed on a
# command line, pasted into a chat, or committed. See NexusCredential.ps1.
#
# -NoNexus opts out of tier 2 entirely. Without it, a stored credential means the
# script reaches the network whether or not the caller wanted it to - which is
# wrong for a quick inventory, wrong on a metered or offline connection, and
# wrong in a test, where it would fetch real descriptions for invented mod ids.
if ($NoNexus) { $NexusApiKey = $null }
elseif (-not $NexusApiKey -and $env:NEXUS_API_KEY) {
    # A KEY PASSED AS AN ARGUMENT IS VISIBLE TO EVERY PROCESS ON THE MACHINE for
    # the duration of the call - Get-Process, Win32_Process and Task Manager's
    # command-line column all show it, and it lands in shell history too. The
    # parameter stays, because sometimes it is the only option, but this is
    # strictly better and costs one line.
    $NexusApiKey = $env:NEXUS_API_KEY
    Write-Host "using API key from NEXUS_API_KEY" -ForegroundColor DarkGray
}
elseif (-not $NexusApiKey) {
    $credHelper = Join-Path $PSScriptRoot 'NexusCredential.ps1'
    if (Test-Path $credHelper) {
        . $credHelper
        $stored = Get-NexusApiKey
        if ($stored) {
            $NexusApiKey = $stored
            Write-Host "using API key from Windows Credential Manager" -ForegroundColor DarkGray
        }
    }
}

$cache = @{}
if (Test-Path $CachePath) {
    try {
        (Get-Content $CachePath -Raw | ConvertFrom-Json).PSObject.Properties |
            ForEach-Object { $cache[$_.Name] = $_.Value }
        Write-Host "cache: $($cache.Count) entries" -ForegroundColor DarkGray
    } catch { Write-Warning "cache unreadable, starting fresh" }
}

if ($NexusApiKey) {
    $ids = $mods | Where-Object NexusId | Select-Object -ExpandProperty NexusId -Unique
    $todo = $ids | Where-Object { -not $cache.ContainsKey("$_") }
    Write-Host "Nexus: $($ids.Count) unique ids, $($todo.Count) to fetch" -ForegroundColor DarkGray

    $n = 0
    foreach ($id in $todo) {
        $n++
        Write-Progress -Activity 'Fetching from Nexus' -Status "$n / $($todo.Count)" -PercentComplete (100 * $n / [Math]::Max(1, $todo.Count))
        $url = "https://api.nexusmods.com/v1/games/$Game/mods/$id.json"
        try {
            $r = Invoke-RestMethod -Uri $url -Headers @{ APIKEY = $NexusApiKey } -TimeoutSec 20
            $cache["$id"] = [pscustomobject]@{
                name     = $r.name
                summary  = $r.summary
                author   = $r.author
                category = $r.category_id
                adult    = [bool]$r.contains_adult_content
                status   = 'ok'
            }
        } catch {
            $code = $_.Exception.Response.StatusCode.value__
            if ($code -eq 429) { Write-Warning "rate limited at id $id - stopping early, re-run later"; break }
            $cache["$id"] = [pscustomobject]@{ status = "error $code" }
        }
        Start-Sleep -Milliseconds $ThrottleMs
    }
    Write-Progress -Activity 'Fetching from Nexus' -Completed
    $cacheDir = Split-Path -Parent $CachePath
    if ($cacheDir -and -not (Test-Path -LiteralPath $cacheDir)) {
        New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null
    }
    $cache | ConvertTo-Json -Depth 4 | Set-Content $CachePath -Encoding UTF8
}

# Apply whatever the cache holds, whether fetched now or previously.
foreach ($m in $mods) {
    if ($m.NexusId -and $cache.ContainsKey("$($m.NexusId)")) {
        $c = $cache["$($m.NexusId)"]
        if ($c.status -eq 'ok') {
            $m.Summary  = $c.summary
            $m.Author   = $c.author
            $m.Category = $c.category
            $m.Adult    = $c.adult
        }
    }
}

# ------------------------------------------------------------------- NSFW ----

# Fallback only. Deliberately conservative in what it claims: it is a name
# match, it will miss mods whose names are innocuous, and the report says so.
#
# Two lessons are baked into this list. Adult mods are often named for a place
# or a character rather than for their content - a venue, a club, a braindance -
# so location and euphemism terms matter as much as anatomy. And the list will
# still be wrong in both directions, which is what the override file is for.
$nsfwWords = @(
    # explicit
    'nude','nudity','naked','nsfw','sex','sexual','erotic','porn','lewd',
    'hentai','xxx','fetish','bdsm','orgasm',
    # anatomy
    'genital','penis','vagina','breast','nipple','boob','dick','cock',
    'pubic','titty','areola',
    # garments that in practice mark adult mods
    'lingerie','panties','topless','underwear',
    # sex work, venues and euphemism - the category keywords miss most often
    'joytoy','brothel','strip','escort','stripper','pleasures','pleasure',
    'jig jig','jigjig','licks club','clouds','cloud - ','braindance',
    'hotscenes','shower','milk','tongue',
    # body-mod shorthand
    'busty','thicc','curvy','jiggle','onlyfans','adult'
)
function Test-NsfwByName { param([string]$Name)
    $l = $Name.ToLower()
    foreach ($w in $nsfwWords) { if ($l -match [regex]::Escape($w)) { return $true } }
    return $false
}

# Overrides, because no keyword list gets both directions right. Tactical
# clothing mods legitimately contain "underwear"; adult mods legitimately have
# innocuous names. A small hand-maintained file beats endlessly tuning regexes.
#
# Format (all fields optional):
#   { "forceAdult": { "ids": [123], "names": ["exact or *wildcard*"] },
#     "forceSafe":  { "ids": [456], "names": ["*Tactical Underwear*"] } }
$override = $null
if (Test-Path $OverridePath) {
    try { $override = Get-Content $OverridePath -Raw | ConvertFrom-Json }
    catch { Write-Warning "override file unreadable: $OverridePath" }
}
function Test-Override {
    param($Mod, $Rule)
    if (-not $Rule) { return $false }
    if ($Rule.ids -and $Mod.NexusId -and ($Rule.ids -contains $Mod.NexusId)) { return $true }
    if ($Rule.names) {
        foreach ($pat in $Rule.names) { if ($Mod.Name -like $pat) { return $true } }
    }
    return $false
}

$heuristicUsed = -not $NexusApiKey
foreach ($m in $mods) {
    if ($null -eq $m.Adult) { $m.Adult = Test-NsfwByName $m.Name }
}

# Propagate the flag across a shared Nexus ID. One Nexus page carries one adult
# flag, but a page can ship many separately-named files - and those file names
# are frequently innocuous. Without this, an adult mod's optional add-ons sail
# straight past the filter: a set of character plugins whose parent page is
# adult-flagged were each named only for the character.
$flaggedIds = @{}
foreach ($m in $mods) { if ($m.NexusId -and $m.Adult) { $flaggedIds["$($m.NexusId)"] = $true } }
# Propagation cuts both ways. It catches an adult mod's innocuously-named
# add-ons, but it also drags in genuinely safe siblings that merely share a
# Nexus page - a base skin texture sharing an ID with an adult edition of
# itself, for instance. So record who was caught this way and print the list:
# hiding is the safer default for this feature, but the user needs to be able
# to audit it and exempt the mistakes.
$propagatedNames = New-Object System.Collections.Generic.List[string]
foreach ($m in $mods) {
    if ($m.NexusId -and -not $m.Adult -and $flaggedIds.ContainsKey("$($m.NexusId)")) {
        $m.Adult = $true
        $propagatedNames.Add($m.Name)
    }
}
$propagated = $propagatedNames.Count

# Overrides win over everything, including the API flag - they are the user's
# explicit judgement about their own install.
$forcedAdult = 0; $forcedSafe = 0
foreach ($m in $mods) {
    if (Test-Override $m $override.forceAdult) { if (-not $m.Adult) { $forcedAdult++ }; $m.Adult = $true }
    elseif (Test-Override $m $override.forceSafe) { if ($m.Adult) { $forcedSafe++ }; $m.Adult = $false }
}

$hidden = 0
if ($HideNSFW) {
    $before = $mods.Count
    $mods = @($mods | Where-Object { -not $_.Adult })
    $hidden = $before - $mods.Count
}

# ------------------------------------------------------------------ report ---

$sb = New-Object System.Text.StringBuilder
function W($t = '') { [void]$sb.AppendLine($t) }

W "# Cyberpunk 2077 mod manifest"
W ""
# The markdown is the output people paste. Same rule as the HTML header: the
# staging path names the user unless something strips it. With the helper
# missing, say nothing rather than leak - a manifest is still useful without
# knowing which folder it came from.
$shownRoot =
    if ($NoRedact) { $StagingRoot }
    elseif ($htmlHelperLoaded) { Get-RedactedStagingPath $StagingRoot }
    else { '<staging folder>' }

W "Generated $(Get-Date -Format 'yyyy-MM-dd HH:mm') from ``$shownRoot``."
W ""
W "- **$($mods.Count)** mods listed"
# Recomputed rather than reusing the pre-filter count: -HideNSFW may have
# dropped rows since.
$listedWithId = @($mods | Where-Object NexusId).Count
if ($listedWithId -lt $mods.Count) {
    W ("- **$listedWithId** of them have a Nexus ID in the folder name. Only Vortex writes one, " +
       "so mods installed with another manager or by hand list without a link, version or install date.")
}
if ($NexusApiKey) {
    $desc = ($mods | Where-Object Summary).Count
    W "- **$desc** enriched with Nexus descriptions"
} else {
    W "- No API key supplied, so there are no descriptions. Pass ``-NexusApiKey`` to add them."
}
if ($HideNSFW) {
    $how = if ($heuristicUsed) {
        "by **name heuristic plus shared-Nexus-ID propagation**. This is approximate and *will* miss mods whose names give nothing away - supply ``-NexusApiKey`` to filter on Nexus's own flag instead"
    } else {
        "using Nexus's own ``contains_adult_content`` flag"
    }
    W "- **$hidden** adult-flagged mods omitted, $how"
    if ($propagated -gt 0) {
        W "- of those, **$propagated** were caught only by sharing a Nexus ID with a flagged mod:"
        W ""
        foreach ($n in ($propagatedNames | Sort-Object)) { W "  - $n" }
        W ""
        W "  Check that list. A safe mod sharing a Nexus page with an adult one gets"
        W "  hidden too; add any mistakes to ``forceSafe`` in the override file."
    }
    if ($forcedAdult -gt 0) { W "- **$forcedAdult** added by override file" }
    if ($forcedSafe -gt 0) { W "- **$forcedSafe** exempted by override file (false positives)" }
}
W ""

$order = @('archive','redscript','CET','tweak','REDmod','RED4ext','ASI','input','other')
$byKind = @{}
foreach ($m in $mods) {
    $primary = ($order | Where-Object { $m.Footprint -contains $_ } | Select-Object -First 1)
    if (-not $primary) { $primary = 'other' }
    if (-not $byKind.ContainsKey($primary)) { $byKind[$primary] = New-Object System.Collections.Generic.List[object] }
    $byKind[$primary].Add($m)
}

foreach ($kind in $order) {
    if (-not $byKind.ContainsKey($kind)) { continue }
    $list = $byKind[$kind] | Sort-Object Name
    W "## $kind  ($($list.Count))"
    W ""
    foreach ($m in $list) {
        $title = $m.Name
        if ($m.NexusId) {
            $title = "[$($m.Name)](https://www.nexusmods.com/$Game/mods/$($m.NexusId))"
        }
        $bits = @()
        if ($m.Version)   { $bits += "v$($m.Version)" }
        if ($m.Installed) { $bits += $m.Installed.ToString('yyyy-MM-dd') }
        if ($m.Footprint.Count -gt 1) { $bits += ($m.Footprint -join '+') }
        $bits += "$($m.Files) files"
        $meta = ($bits -join ' · ')

        W "**$title**"
        W "<sub>$meta</sub>"
        if ($m.Summary) {
            $s = ($m.Summary -replace '\s+', ' ').Trim()
            if ($s.Length -gt 300) { $s = $s.Substring(0, 297) + '...' }
            W ""
            W $s
        }
        W ""
    }
}

W "---"
W ""
W "Tier 1 data (name, id, version, install date, footprint) is read from staging"
W "folder names and layout. Tier 2 (summary, author, adult flag) comes from the"
W "Nexus v1 API and is cached in ``$(Split-Path $CachePath -Leaf)`` so re-runs are free."

Set-Content -LiteralPath $Out -Value $sb.ToString() -Encoding UTF8
$mdChars = $sb.Length
Write-Host "wrote $((Resolve-Path -LiteralPath $Out).Path) ($mdChars chars)" -ForegroundColor Green

# Say the size, and say what it means. A manifest of any real load order is far
# past Discord's 2000-character message cap, and pasting a long one does not
# arrive truncated - it does not arrive at all. The person then either retypes it
# or gives up, and neither is the outcome this file was written for.
if ($mdChars -gt 2000) {
    Write-Host ("  that is past Discord's 2000-character message cap - attach the file " +
                "or share the HTML rather than pasting it") -ForegroundColor DarkGray
}

# ------------------------------------------------------------------- html ----
# Markdown stays the primary output - it diffs, greps and pastes. The HTML is a
# second rendering of the same data for when you want to browse and search it.

if (-not $NoHtml) {
    if ($htmlHelperLoaded) {
        if (-not $HtmlOut) {
            $HtmlOut = [IO.Path]::ChangeExtension($Out, '.html')
        }
        $flagSource = if ($heuristicUsed) { 'name heuristic' } else { 'nexus flag' }
        $html = ConvertTo-ManifestHtml -Mods $mods -Game $Game -StagingRoot $StagingRoot `
                    -HiddenCount $hidden -HideNSFW:$HideNSFW -FlagSource $flagSource -NoRedact:$NoRedact
        Set-Content -LiteralPath $HtmlOut -Value $html -Encoding UTF8
        Write-Host "wrote $((Resolve-Path -LiteralPath $HtmlOut).Path)" -ForegroundColor Green
    } else {
        Write-Warning "ModManifestHtml.ps1 not found beside this script; skipped HTML"
    }
}
