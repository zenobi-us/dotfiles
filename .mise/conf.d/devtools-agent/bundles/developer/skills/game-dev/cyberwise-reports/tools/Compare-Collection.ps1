# Compare-Collection.ps1 -- what a curated Nexus collection has that you do not.
#
#     .\Compare-Collection.ps1 -Slug eem6yz -NexusApiKey <key>
#     .\Compare-Collection.ps1 -Slug eem6yz -NexusApiKey <key> -Focus stability
#     .\Compare-Collection.ps1 -Slug eem6yz -NexusApiKey <key> -Json out.json
#
# WHY THIS EXISTS
#
# A good collection is a curator's answer to "what does a stable install of this
# game need", tested across a lot of machines. Diffing your install against one
# is the cheapest second opinion available - not to install everything it has,
# which would be someone else's load order, but to find the **bug fixes and
# stability patches you never heard of**. Those are the entries nobody arrives at
# by browsing: they are boring, they are named after the bug rather than the
# feature, and they are exactly what a curator accumulates.
#
# On the install this was written against, one such entry was a native fix for
# two confirmed crash paths in vehicle explosions - against an open, unexplained,
# reproducible crash while driving.
#
# WHAT IT IS NOT
#
# It is not a shopping list and must not be presented as one. A collection is a
# WHOLE, tested together, with a stated scope; taking 128 mods out of one and
# adding them to a 900-mod install tests nothing anybody has tested. Read the
# scope line it prints first - a collection that says "no major gameplay changes"
# is silent on gameplay mods by choice, not by oversight.

[CmdletBinding()]
param(
    # The collection's slug - the short code in its URL.
    [Parameter(Mandatory)] [string] $Slug,

    [string] $Game = 'cyberpunk2077',

    # Defaults to the collection's current revision.
    [int] $Revision,

    # Vortex-style staging root. Auto-detected when omitted.
    [string] $StagingRoot,

    # A Nexus API key. Falls back to Credential Manager via NexusCredential.ps1.
    [string] $NexusApiKey,

    # 'stability' filters to the bug-fix and crash-fix shaped entries, which is
    # the reason to run this at all. 'all' lists everything missing.
    [ValidateSet('stability', 'all')] [string] $Focus = 'stability',

    [string] $Json,

    # Analyse a previously fetched payload instead of calling Nexus. The tool is
    # otherwise untestable without the network, and a test suite that calls
    # somebody else's API is not a test suite. Also useful on its own: re-run the
    # comparison after installing something, with no second API call.
    [string] $FromJson,

    # Write the fetched payload here, so a later run can use -FromJson.
    [string] $SaveJson
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$ErrorActionPreference = 'Stop'

# A KEY PASSED AS AN ARGUMENT IS VISIBLE TO EVERY PROCESS ON THE MACHINE for the
# duration of the call - Get-Process, Get-CimInstance Win32_Process and Task
# Manager's command-line column all show it, and it lands in shell history too.
# The parameter stays, because it is convenient and sometimes the only option,
# but an environment variable is strictly better and costs one line.
if (-not $NexusApiKey -and $env:NEXUS_API_KEY) { $NexusApiKey = $env:NEXUS_API_KEY }

if (-not $NexusApiKey -and -not $FromJson) {
    $cred = Join-Path $PSScriptRoot 'NexusCredential.ps1'
    if (Test-Path -LiteralPath $cred) {
        . $cred
        $NexusApiKey = Get-NexusApiKey -ErrorAction SilentlyContinue
    }
}
if (-not $NexusApiKey -and -not $FromJson) {
    throw "No Nexus API key. Pass -NexusApiKey, store one with NexusCredential.ps1, or analyse a saved payload with -FromJson."
}

if (-not $StagingRoot) {
    $StagingRoot = @(
        (Join-Path $env:APPDATA "Vortex\$Game\mods")
        (Join-Path $env:APPDATA 'Vortex\cyberpunk2077\mods')
    ) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}
if (-not $StagingRoot -or -not (Test-Path -LiteralPath $StagingRoot)) {
    throw "No staging root found. Pass -StagingRoot (Vortex: Settings > Mods; MO2: the instance 'mods' folder)."
}

$headers = @{ apikey = $NexusApiKey; 'Application-Name' = 'cyberwise'; 'Application-Version' = '1.0' }

function Invoke-NexusGraph {
    param([string] $Query)
    $body = @{ query = $Query } | ConvertTo-Json -Depth 6
    $r = Invoke-RestMethod -Uri 'https://api.nexusmods.com/v2/graphql' -Method Post -Body $body `
            -ContentType 'application/json' -Headers $headers -TimeoutSec 90
    if ($r.errors) { throw ("Nexus GraphQL: " + (($r.errors | ForEach-Object { $_.message }) -join '; ')) }
    return $r.data
}

# ------------------------------------------------------------- collection ----

if ($FromJson) {
    if (-not (Test-Path -LiteralPath $FromJson)) { throw "No payload at $FromJson" }
    $saved = Get-Content -LiteralPath $FromJson -Raw | ConvertFrom-Json
    $name = $saved.name; $summary = $saved.summary; $Revision = $saved.revision
    $rev = $saved.revision_data
} elseif (-not $Revision) {
    $d = Invoke-NexusGraph "query { collection(slug: `"$Slug`", domainName: `"$Game`", viewAdultContent: true) { name summary currentRevision { revisionNumber } } }"
    if (-not $d.collection) { throw "No collection '$Slug' for $Game." }
    $Revision = $d.collection.currentRevision.revisionNumber
    $name = $d.collection.name
    $summary = $d.collection.summary
}

if (-not $rev) {
    $d = Invoke-NexusGraph @"
query { collectionRevision(slug: "$Slug", domainName: "$Game", revision: $Revision, viewAdultContent: true) {
  modCount totalSize
  modFiles { optional file { mod { modId name summary author category adult } } } } }
"@
    $rev = $d.collectionRevision
    if ($SaveJson) {
        [pscustomobject]@{ name = $name; summary = $summary; revision = $Revision; revision_data = $rev } |
            ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $SaveJson -Encoding UTF8
    }
}
if (-not $rev) { throw "No revision $Revision of '$Slug'." }

# Collections list FILES, not mods, so one mod can appear twice (main + patch).
# Counting rows as mods overstates the list and double-reports every entry that
# ships an optional patch.
$entries = @{}
foreach ($mf in $rev.modFiles) {
    $m = $mf.file.mod
    if (-not $m) { continue }
    $entries["$($m.modId)"] = [pscustomobject]@{
        Id = "$($m.modId)"; Name = $m.name; Category = $m.category
        Author = $m.author; Summary = $m.summary; Adult = $m.adult
    }
}

Write-Host ''
Write-Host "$(if ($name) { $name } else { $Slug })  -  revision $Revision" -ForegroundColor Cyan
if ($summary) { Write-Host "  $summary" -ForegroundColor DarkGray }
Write-Host ("  {0} distinct mods across {1} file entries, {2:N1} GB" -f $entries.Count, $rev.modFiles.Count, ($rev.totalSize / 1GB)) -ForegroundColor DarkGray

# ---------------------------------------------------------------- install ----

# KEYS ARE STRINGS ON BOTH SIDES, deliberately. A hashtable keyed by Int32 and
# probed with an Int64 - which is what a modId out of JSON becomes - matches
# nothing and reports a perfect zero overlap. That is a wrong answer that looks
# like a finding: "you share none of this curated list" reads as a conclusion
# rather than a bug.
$installed = @{}
foreach ($dir in (Get-ChildItem -LiteralPath $StagingRoot -Directory)) {
    if ($dir.Name -match '^(?<n>.+?)-(?<id>\d+)-(?<v>.*?)-(?<ts>\d{10})$') {
        $installed["$($matches['id'])"] = $matches['n']
    }
}
$staged = @(Get-ChildItem -LiteralPath $StagingRoot -Directory).Count
Write-Host ("  your install: {0} of {1} staged mods carry a Nexus id" -f $installed.Count, $staged) -ForegroundColor DarkGray
if ($installed.Count -lt $staged * 0.5) {
    # Vortex encodes the id in the folder name; MO2 and hand-unzipped folders do
    # not. A low ratio means most of the install is invisible to this comparison
    # and every "missing" line below may be wrong.
    Write-Host '  WARNING: fewer than half your mods expose a Nexus id, so "missing" here is unreliable.' -ForegroundColor Red
}

$shared  = @($entries.Values | Where-Object { $installed.ContainsKey($_.Id) })
$missing = @($entries.Values | Where-Object { -not $installed.ContainsKey($_.Id) })

Write-Host ''
Write-Host ("  shared with you : {0}" -f $shared.Count) -ForegroundColor Green
Write-Host ("  missing from you: {0}" -f $missing.Count) -ForegroundColor Yellow

# ------------------------------------------------------------------ focus ----

# Named after the bug rather than the feature - that naming IS the signal. These
# are the entries a curator accumulates from bug reports and nobody finds by
# browsing a category page.
$stabilityWords = 'fix|patch|crash|stutter|stability|freeze|hang|leak|bug|restore[sd]?\b|logic'

$show = if ($Focus -eq 'stability') {
    @($missing | Where-Object { ($_.Name + ' ' + $_.Summary) -match "(?i)$stabilityWords" })
} else { $missing }

Write-Host ''
Write-Host ("  {0} missing entr{1} {2}" -f $show.Count, $(if ($show.Count -eq 1) { 'y' } else { 'ies' }),
            $(if ($Focus -eq 'stability') { 'look like fixes rather than features' } else { 'in total' })) -ForegroundColor Cyan
foreach ($m in ($show | Sort-Object Category, Name)) {
    Write-Host ("    [{0,-20}] {1}" -f $m.Category, $m.Name)
    if ($m.Summary) {
        $s = ($m.Summary -replace '<[^>]+>', '' -replace '\s+', ' ').Trim()
        if ($s.Length -gt 150) { $s = $s.Substring(0, 147) + '...' }
        if ($s) { Write-Host "         $s" -ForegroundColor DarkGray }
    }
    Write-Host ("         nexusmods.com/$Game/mods/{0}" -f $m.Id) -ForegroundColor DarkGray
}

if ($Json) {
    [pscustomobject]@{
        Collection = $name; Slug = $Slug; Revision = $Revision
        Shared = $shared; Missing = $missing
    } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $Json -Encoding UTF8
    Write-Host ''
    Write-Host "wrote $((Resolve-Path -LiteralPath $Json).Path)" -ForegroundColor Green
}

Write-Host ''
Write-Host '  A collection is a whole that was tested together, not a shopping list.' -ForegroundColor DarkGray
Write-Host '  Add a few at a time and re-run your conflict checks - several of these' -ForegroundColor DarkGray
Write-Host '  rewrite quest phases, which is the class that collides silently.' -ForegroundColor DarkGray
exit 0
