# Initialize-UserWiki.ps1 -- create this user's knowledge bundle, from nothing.
#
#     .\Initialize-UserWiki.ps1 -GameRoot '<path>'
#     .\Initialize-UserWiki.ps1 -GameRoot '<path>' -WhatIf
#     .\Initialize-UserWiki.ps1 -GameRoot '<path>' -Force      # refresh stubs too
#
# WHY THIS EXISTS
#
# The base wiki ships with the skills, so every install has the GAME knowledge
# from the first minute. Nothing shipped can know THIS install: which mods are
# deployed, what the hardware is, what has been diagnosed here. That half has to
# be built on the machine, and until it exists every session re-derives the same
# facts from scratch - which is exactly the cost the wiki was created to remove.
#
# So this is the first thing to run on a fresh install. It is idempotent: run it
# again after adding mods and it fills in what is new without flattening
# anything that has been deepened by hand.
#
# WHAT IT CREATES, and why in this order
#
#   1. index.md / log.md   the bundle's own frame. A bundle with no log cannot
#                          be reviewed later, which is most of its value.
#   2. machine.md          hardware, frameworks, install shape. Cheap, and it
#                          decides which suspicions are even worth having here -
#                          a crash on 32 GB of VRAM and a crash on 6 GB deserve
#                          different first questions.
#   3. mods/*.md           one stub per DEPLOYED mod, from the deployment
#                          manifest rather than a manager's list. A stub records
#                          only what is true from disk and claims nothing about
#                          behaviour.
#
# Deepening the stubs is a separate, ongoing job - see cyberwise-modbase for the
# order to do it in. This tool deliberately stops at "every mod has an honest
# stub", because a stub that guesses is worse than no article: it reads exactly
# like one somebody verified.

[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)] [string] $GameRoot,

    # The USER bundle. Never the base wiki - see the boundary in the skill.
    [string] $Bundle = (Join-Path $env:USERPROFILE 'Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\wiki'),

    # Rewrite stubs that already exist. Off by default so a deepened article is
    # never flattened back to a stub by a later run.
    [switch] $Force,

    # Skip the machine profile (it shells out to cyberwise-reports).
    [switch] $NoMachine
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

# REFUSE TO INITIALISE THE SHIPPING BUNDLE.
#
# The base wiki lives inside this skill. Pointing this tool at it would fill the
# repo with one user's mod list and hardware, and the next commit would ship it.
# Two independent checks, because a path check alone misses a copy of the base
# bundle sitting somewhere else.
$skillWiki = Join-Path (Split-Path -Parent $PSScriptRoot) 'wiki'
$resolved  = if (Test-Path -LiteralPath $Bundle) { (Resolve-Path -LiteralPath $Bundle).ProviderPath } else { $Bundle }
if ($resolved -like "$skillWiki*") {
    throw "Refusing to write: '$Bundle' is the SHIPPING base wiki. The user bundle belongs beside the game's own records."
}
$rootIndex = Join-Path $resolved 'index.md'
if (Test-Path -LiteralPath $rootIndex) {
    $head = Get-Content -LiteralPath $rootIndex -Raw -ErrorAction SilentlyContinue
    if ($head -and $head -match '(?im)^\s*ships\s*:\s*yes|this bundle ships') {
        throw "Refusing to write: '$Bundle' declares itself the shipping bundle."
    }
}

$stamp = (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')
$today = (Get-Date).ToString('yyyy-MM-dd')

if ($PSCmdlet.ShouldProcess($resolved, 'create user wiki bundle')) {
    New-Item -ItemType Directory -Path $resolved -Force | Out-Null
}

# -- index.md ---------------------------------------------------------------
# Only a ROOT index may carry frontmatter, and only okf_version. Written once;
# a re-run leaves an edited index alone rather than overwriting the owner's
# additions.
$indexPath = Join-Path $resolved 'index.md'
if ($Force -or -not (Test-Path -LiteralPath $indexPath)) {
    $index = @"
---
okf_version: "0.2"
---

# This install

Everything here is about ONE Cyberpunk 2077 installation: its mods, its
hardware, and what has been worked out on it. **It does not ship.** Its content
is derived from mod authors' own descriptions, configs and pages, and
redistributing a compiled version of that is passing on somebody else's work.

Game, engine and format knowledge lives in the base wiki that ships with the
Cyberwise skills. If something you are about to write here would be true on
anybody's install, it belongs there instead.

## What is in here

- ``machine.md`` - hardware, frameworks, install shape, and what they rule in
  or out. Regenerated by ``New-SystemProfile.ps1 -Wiki``; edits are overwritten.
- ``mods/`` - one article per deployed mod.
- ``log.md`` - what was learned here, newest first.

## Coverage

Not yet measured. Run the validator and count once the stubs exist.
"@
    if ($PSCmdlet.ShouldProcess($indexPath, 'write index')) {
        [System.IO.File]::WriteAllText($indexPath, $index, (New-Object System.Text.UTF8Encoding($false)))
    }
    Write-Host "  index.md" -ForegroundColor Green
} else {
    Write-Host "  index.md already exists, left alone" -ForegroundColor DarkGray
}

# -- log.md -----------------------------------------------------------------
# Newest-first, ISO date headings. Created empty-but-framed rather than absent,
# because a log nobody started is a log nobody writes.
$logPath = Join-Path $resolved 'log.md'
if (-not (Test-Path -LiteralPath $logPath)) {
    $log = @"
# Log

## $today

**Bundle created** by ``Initialize-UserWiki.ps1``.

Write here what was LEARNED and why, not what changed - a diff is recoverable
from the files, and the reasoning is not. Newest entry first, ISO date headings.
"@
    if ($PSCmdlet.ShouldProcess($logPath, 'write log')) {
        [System.IO.File]::WriteAllText($logPath, $log, (New-Object System.Text.UTF8Encoding($false)))
    }
    Write-Host "  log.md" -ForegroundColor Green
} else {
    Write-Host "  log.md already exists, left alone" -ForegroundColor DarkGray
}

# -- machine.md -------------------------------------------------------------
# Owned by cyberwise-reports, which already gathers every fact correctly -
# including the VRAM read that a naive WMI query gets wrong.
if (-not $NoMachine) {
    $profiler = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'cyberwise-reports\tools\New-SystemProfile.ps1'
    if (Test-Path -LiteralPath $profiler) {
        if ($PSCmdlet.ShouldProcess((Join-Path $resolved 'machine.md'), 'generate machine profile')) {
            try {
                & $profiler -GameRoot $GameRoot -Wiki -WikiPath (Join-Path $resolved 'machine.md') -NoHtml -Md ([IO.Path]::GetTempFileName()) | Out-Null
                Write-Host "  machine.md" -ForegroundColor Green
            } catch {
                Write-Warning "  machine profile failed: $($_.Exception.Message)"
            }
        }
    } else {
        Write-Warning "  cyberwise-reports not found beside this skill; skipping machine.md"
    }
}

# -- mods/*.md --------------------------------------------------------------
$stubber = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'cyberwise-modbase\tools\New-ModStubs.ps1'
if (Test-Path -LiteralPath $stubber) {
    if ($PSCmdlet.ShouldProcess((Join-Path $resolved 'mods'), 'write one stub per deployed mod')) {
        $args = @{ GameRoot = $GameRoot; Bundle = $resolved }
        if ($Force) { $args.Force = $true }
        & $stubber @args
    }
} else {
    Write-Warning "  cyberwise-modbase not found beside this skill; skipping mod stubs"
}

# -- validate ---------------------------------------------------------------
# A bundle that does not conform is worse than none: every later tool trusts it.
$validator = Join-Path $PSScriptRoot 'Test-Wiki.ps1'
if (Test-Path -LiteralPath $validator) {
    Write-Host ''
    & $validator -Bundle $resolved
}

Write-Host ''
Write-Host 'NEXT: the stubs describe NOTHING about behaviour, on purpose.' -ForegroundColor Cyan
Write-Host 'Deepen them in the order cyberwise-modbase gives - frameworks first,' -ForegroundColor DarkGray
Write-Host 'then settings-bearing mods, then anything already implicated in a finding.' -ForegroundColor DarkGray
