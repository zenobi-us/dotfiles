# New-ModStubs.ps1 -- one OKF article per deployed mod, built from the install.
#
#     .\New-ModStubs.ps1 -GameRoot '<path>'
#     .\New-ModStubs.ps1 -GameRoot '<path>' -WhatIf
#
# WRITES INTO THE USER BUNDLE ONLY. Every article this produces describes a
# specific mod, which makes all of it user-only and none of it shippable. The
# default output path is beside the game's own records for that reason - see the
# boundary in cyberwise-wiki.
#
# WHAT A STUB MAY AND MAY NOT CLAIM
#
# A stub records what is TRUE FROM DISK: which files this mod deployed, which
# layers it touches, which of its files a settings question would be answered
# from, and its derived Nexus id with the pattern that produced it.
#
# It says nothing about what the mod DOES. That requires reading its config, its
# scripts or its page, and a stub that guesses is worse than no article - it
# reads exactly like one somebody verified. Every stub is therefore
# `status: draft`, and deepening one means replacing the body, not appending to
# it.

[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)] [string] $GameRoot,

    [string] $Bundle = (Join-Path $env:USERPROFILE 'Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\wiki'),

    # Overwrite stubs that already exist. Off by default so a deepened article is
    # never flattened back to a stub by a later inventory run.
    [switch] $Force
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$ErrorActionPreference = 'Stop'

$inventoryTool = Join-Path $PSScriptRoot 'Get-ModInventory.ps1'
if (-not (Test-Path -LiteralPath $inventoryTool)) { throw "missing $inventoryTool" }

$rows = & $inventoryTool -GameRoot $GameRoot -Json | ConvertFrom-Json
$rows = @($rows)
if ($rows.Count -eq 0) { throw 'inventory returned nothing' }

$modsDir = Join-Path $Bundle 'mods'
if ($PSCmdlet.ShouldProcess($modsDir, 'create bundle directory')) {
    New-Item -ItemType Directory -Path $modsDir -Force | Out-Null
}

# A stable, filesystem-safe concept id. Two different mods must never collide
# onto one article, so the derived id is appended when there is one - staging
# names differ by version and timestamp, which would otherwise churn the id
# every time the user updates a mod.
function Get-Slug([object] $row) {
    $name = [string]$row.Source
    $name = $name -replace '-\d{10}$', ''
    $name = $name -replace '\s+\d{4}-\d{2}-\d{2}T[\w\-]+\s+\S+$', ''
    if ($row.NexusModId) { $name = $name -replace ('[-\s]' + $row.NexusModId + '[-\s].*$'), '' }
    $slug = ($name -replace '[^A-Za-z0-9]+', '-').Trim('-').ToLower()
    if ([string]::IsNullOrWhiteSpace($slug)) { $slug = 'mod' }
    if ($slug.Length -gt 60) { $slug = $slug.Substring(0, 60).Trim('-') }
    if ($row.NexusModId) { $slug = $slug + '-' + $row.NexusModId }
    return $slug
}

$stamp = (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')
$written = 0; $skipped = 0
$seen = @{}

foreach ($row in $rows) {
    $slug = Get-Slug $row
    if ($seen.ContainsKey($slug)) { $slug = $slug + '-' + $seen[$slug] }
    $seen[$slug] = 1 + ([int]$seen[$slug])

    $path = Join-Path $modsDir ($slug + '.md')
    if ((Test-Path -LiteralPath $path) -and -not $Force) { $skipped++; continue }

    $layers = @($row.Layers) -join ', '
    $title = ($row.Source -replace '-\d{10}$', '')

    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine('---')
    [void]$sb.AppendLine('type: Mod Reference')
    [void]$sb.AppendLine('title: ' + ($title -replace ':', ' -'))
    [void]$sb.AppendLine('description: Deployed mod touching ' + $layers + '. Not yet documented beyond what the install itself states.')
    [void]$sb.AppendLine('distribution: user-only')
    [void]$sb.AppendLine('status: draft')
    [void]$sb.AppendLine('tags: [' + (@($row.Layers) -join ', ') + ']')
    if ($row.NexusModId) {
        [void]$sb.AppendLine('resource: https://www.nexusmods.com/cyberpunk2077/mods/' + $row.NexusModId)
        [void]$sb.AppendLine('nexus_mod_id: ' + $row.NexusModId)
        [void]$sb.AppendLine('nexus_id_derivation: ' + $row.IdPattern)
    }
    [void]$sb.AppendLine('generated: { by: "cyberwise-modbase", at: "' + $stamp + '" }')
    [void]$sb.AppendLine('---')
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('# ' + $title)
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('**Stub.** Everything below is read from the deployment manifest and the files')
    [void]$sb.AppendLine('on disk. Nothing here describes what this mod does - that has not been')
    [void]$sb.AppendLine('established yet, and a guess would read exactly like a verified fact.')
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('| | |')
    [void]$sb.AppendLine('|---|---|')
    [void]$sb.AppendLine('| staging name | `' + $row.Source + '` |')
    [void]$sb.AppendLine('| layers | ' + $layers + ' |')
    [void]$sb.AppendLine('| deployed files | ' + $row.FileCount + ' |')
    if ($row.NexusModId) {
        [void]$sb.AppendLine('| Nexus id | ' + $row.NexusModId + ' (derived: ' + $row.IdPattern + ', unverified) |')
    }
    else {
        [void]$sb.AppendLine('| Nexus id | none - not a Nexus download, or installed from a local file |')
    }
    [void]$sb.AppendLine('')

    if (@($row.ModFolders).Count -gt 0) {
        [void]$sb.AppendLine('## Folders it owns')
        [void]$sb.AppendLine('')
        foreach ($f in @($row.ModFolders)) { [void]$sb.AppendLine('- `' + $f + '`') }
        [void]$sb.AppendLine('')
    }

    if (@($row.Archives).Count -gt 0) {
        [void]$sb.AppendLine('## Archives')
        [void]$sb.AppendLine('')
        [void]$sb.AppendLine('Load order position decides whether these win their file conflicts.')
        [void]$sb.AppendLine('')
        foreach ($a in @($row.Archives)) { [void]$sb.AppendLine('- `' + $a + '`') }
        [void]$sb.AppendLine('')
    }

    if (@($row.ConfigFiles).Count -gt 0) {
        [void]$sb.AppendLine('## Where its behaviour is defined')
        [void]$sb.AppendLine('')
        [void]$sb.AppendLine('Read these before the mod page. A description is what the author says it')
        [void]$sb.AppendLine('does; these are what it does.')
        [void]$sb.AppendLine('')
        foreach ($c in @($row.ConfigFiles)) { [void]$sb.AppendLine('- `' + $c + '`') }
        [void]$sb.AppendLine('')
    }

    [void]$sb.AppendLine('## To deepen this')
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('1. Verify the Nexus id resolves to this mod before trusting it anywhere.')
    [void]$sb.AppendLine('2. Read `Config.reds` for `ModSettings` properties and their defaults.')
    [void]$sb.AppendLine('3. Diff those defaults against `red4ext\plugins\mod_settings\user.ini`.')
    [void]$sb.AppendLine('4. Grep its scripts for `@wrapMethod` / `@replaceMethod` to see what it hooks.')
    [void]$sb.AppendLine('5. Replace this body and set `status: stable`.')

    if ($PSCmdlet.ShouldProcess($path, 'write stub')) {
        # `-Encoding utf8NoBOM` DOES NOT EXIST on Windows PowerShell 5.1 and throws
        # there; `-Encoding UTF8` means *with* a BOM on 5.1, which is how three
        # invisible bytes end up in front of `---` and stop a front-matter parser. Write
        # through an explicit no-BOM encoder instead. The path is made absolute first
        # because [System.IO.File] resolves a relative path against .NET's own current
        # directory, which is not PowerShell's.
        $stubFull = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($path)
        [System.IO.File]::WriteAllText($stubFull, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))
    }
    $written++
}

Write-Host ('bundle: ' + $Bundle) -ForegroundColor Cyan
Write-Host ('  ' + $written + ' stub(s) written, ' + $skipped + ' left alone (already present)') -ForegroundColor DarkGray
Write-Host ('  every one is status: draft and describes NOTHING about behaviour') -ForegroundColor DarkGray
exit 0
