# New-ProblemReport.ps1 -- assemble a report the author can act on.
#
#     .\New-ProblemReport.ps1 -Summary 'the hotkey sheet lists a key I rebound' `
#         -Detail 'It shows F3 for night vision, but I moved that to F7 last week.' `
#         -Expected 'my binding, not the one the mod ships' -Area cyberwise-hotkeys
#
# WHAT THIS IS FOR
#
# "It didn't work" cannot be fixed by anyone. What can be fixed is a report that
# names the version, the agent, what was asked, what happened and what was
# expected - and gathering those is work the USER should never be handed. They
# are already stuck; that is why they are reporting.
#
# Two outputs, because the two places to send it have different shapes:
#
#   <name>.md          the whole thing, for a GitHub issue or a file attachment
#   <name>.discord.md  trimmed to fit one Discord message, for the chat route
#
# Over 2000 characters Discord REFUSES a message rather than shortening it, so an
# untrimmed paste does not arrive short - it does not arrive, and the person is
# left retyping it by hand at the exact moment they are already stuck.
#
# It collects facts about the TOOLING, not about the install. A mod problem needs
# a system profile (cyberwise-reports) attached alongside; this file does not
# duplicate that detection, because two implementations of "which manager is
# this" is how they come to disagree.

[CmdletBinding()]
param(
    # One line. This becomes the issue title, so it should read like one.
    [Parameter(Mandatory)] [string] $Summary,

    # What happened, in the user's own words wherever possible.
    [string] $Detail = '',

    # What they expected instead. Often the more useful half: it is where a
    # wrong assumption in the notes shows up.
    [string] $Expected = '',

    # Which skill or tool, if known. 'unsure' is a fine answer and better than a
    # confident wrong one.
    [string] $Area = 'unsure',

    # Exact error text, pasted rather than paraphrased. Stack traces carry full
    # paths, which is why the whole report is redacted at the end rather than
    # field by field.
    [string] $ErrorText = '',

    # Game root, only if the problem involves the install. Not guessed: a default
    # that happens to exist on the wrong machine produces a plausible report
    # about a game nobody was playing.
    [string] $GameRoot = '',

    # The cyberwise checkout, so the report can name a version.
    [string] $RepoRoot,

    [string] $Out = "$env:USERPROFILE\Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\reports\problem-report.md",

    # Paths and the account name are stripped by default. This report is going to
    # a stranger on the internet, by design.
    [switch] $NoRedact
)

# $PSScriptRoot is EMPTY inside a param default on Windows PowerShell 5.1
# when the script is run with -File or dot-sourced - it is only populated
# under the call operator, and pwsh 7 populates it in every case. So the
# default below is resolved HERE, where it is correct on both engines and
# by every invocation route. See cyberwise/references/environment.md.

if (-not $RepoRoot) { $RepoRoot = (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))) }

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


$ErrorActionPreference = 'Stop'

# ------------------------------------------------------------------ helpers --

function Get-Redacted {
    param([string] $Text)
    if ($NoRedact -or -not $Text) { return $Text }
    $s = $Text -replace [regex]::Escape([string]$env:USERPROFILE), '~'
    if ($env:USERNAME) { $s = $s -replace "(?i)$([regex]::Escape([string]$env:USERNAME))", '<user>' }
    if ($env:COMPUTERNAME) { $s = $s -replace "(?i)\b$([regex]::Escape([string]$env:COMPUTERNAME))\b", '<machine>' }
    return $s
}

function Get-Fitted {
    <#
    .SYNOPSIS
        Trim to a character budget by dropping whole lines off the end, and say
        how many went.
    .DESCRIPTION
        Silent truncation is worse than no truncation: the sender believes they
        pasted everything, and the missing half is the half the author needed.
    #>
    param([string] $Text, [int] $Limit = 2000)
    if (-not $Text -or $Text.Length -le $Limit) { return $Text }

    $lines = [System.Collections.Generic.List[string]](($Text -replace "`r`n", "`n").TrimEnd("`n") -split "`n")
    $dropped = 0
    while ($lines.Count -gt 1) {
        $lines.RemoveAt($lines.Count - 1)
        $dropped++
        $note = "...and $dropped more line(s), dropped to fit a $Limit-character message. Full report attached."
        $candidate = ($lines -join "`n") + "`n" + $note + "`n"
        if ($candidate.Length -le $Limit) { return $candidate }
    }
    return $Text.Substring(0, [Math]::Max(0, $Limit - 1)) + [char]0x2026
}

function Get-LinkKind {
    <#
    .SYNOPSIS
        How a skill got into an agent's skills directory - or that it did not.
    .DESCRIPTION
        install.ps1 makes a symlink, or falls back to a junction where a symlink
        would need elevation, and a hand-install is a plain copy. Which one it is
        changes what "I edited the repo and nothing changed" means, so the report
        says rather than assumes.
    #>
    param([string] $Path)
    if (-not (Test-Path -LiteralPath $Path)) { return 'not installed' }
    $item = Get-Item -LiteralPath $Path -Force
    if ($item.LinkType) { return "$($item.LinkType) -> $($item.Target -join ', ')" }
    return 'plain copy'
}

# ---------------------------------------------------------------- gathering --

# Version, from the checkout itself. `git describe` gives the tag when one is on
# HEAD and tag-n-gsha when it is not, which is exactly the distinction between
# "a release" and "somewhere after it".
$version = 'unknown'
$branch  = ''
$dirty   = ''
if (Test-Path -LiteralPath (Join-Path $RepoRoot '.git')) {
    $git = Get-Command git -ErrorAction SilentlyContinue
    if ($git) {
        $version = (& git -C $RepoRoot describe --tags --always --dirty 2>$null | Select-Object -First 1)
        $branch  = (& git -C $RepoRoot rev-parse --abbrev-ref HEAD 2>$null | Select-Object -First 1)
        $status  = @(& git -C $RepoRoot status --porcelain 2>$null)
        if ($status.Count) { $dirty = "$($status.Count) uncommitted file(s)" }
        if (-not $version) { $version = 'unknown' }
    } else {
        $version = 'unknown (git not on PATH)'
    }
} else {
    $version = 'unknown (not a git checkout)'
}

$claudeSkill = Join-Path $env:USERPROFILE '.claude\skills\cyberwise'
$codexHome   = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE '.codex' }
$codexSkill  = Join-Path $codexHome 'skills\cyberwise'

# Only what was actually passed. An unprovided game root is reported as such -
# "not provided" is a fact; a guessed path is a fabrication.
$patch = 'not provided'
if ($GameRoot) {
    $exe = Join-Path $GameRoot 'bin\x64\Cyberpunk2077.exe'
    if (Test-Path -LiteralPath $exe) {
        $patch = (Get-Item -LiteralPath $exe).VersionInfo.ProductVersion
    } else {
        $patch = "no Cyberpunk2077.exe under the path given"
    }
}

$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm'

# ------------------------------------------------------------------ report ---

$sb = New-Object System.Text.StringBuilder
function W($t = '') { [void]$sb.AppendLine($t) }

W "# $Summary"
W ""
W "## What happened"
W ""
W $(if ($Detail) { $Detail } else { '_(not stated)_' })
W ""
W "## What I expected"
W ""
W $(if ($Expected) { $Expected } else { '_(not stated)_' })
W ""
if ($ErrorText) {
    W "## Error text"
    W ""
    W '```'
    W $ErrorText.TrimEnd()
    W '```'
    W ""
}
W "## Environment"
W ""
W '```'
W "cyberwise      $version"
if ($branch) { W "branch         $branch" }
if ($dirty)  { W "working tree   $dirty" }
W "area           $Area"
W "game patch     $patch"
W "claude code    $(Get-LinkKind $claudeSkill)"
W "codex          $(Get-LinkKind $codexSkill)"
W "powershell     $($PSVersionTable.PSVersion)"
W "windows        $([Environment]::OSVersion.Version)"
W '```'
W ""
W "_Generated $stamp by cyberwise-feedback. Paths and account name removed._"

$full = Get-Redacted $sb.ToString()

$dir = Split-Path -Parent $Out
if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
Set-Content -LiteralPath $Out -Value $full -Encoding UTF8
Write-Host "wrote $((Resolve-Path -LiteralPath $Out).Path) ($($full.Length) chars)" -ForegroundColor Green

# ----------------------------------------------------------- discord form ----
# Same facts, one message. Ordered so that what survives a trim is what the
# author needs first: the symptom, then the version, then the detail.

$short = New-Object System.Text.StringBuilder
function S($t = '') { [void]$short.AppendLine($t) }

S "**$Summary**"
S "cyberwise $version | area: $Area | patch: $patch"
if ($Expected) { S "expected: $Expected" }
S ""
if ($Detail)    { S $Detail }
if ($ErrorText) {
    S ""
    S '```'
    S $ErrorText.TrimEnd()
    S '```'
}

$discordOut = [IO.Path]::ChangeExtension($Out, '.discord.md')
$discordText = Get-Fitted (Get-Redacted $short.ToString()) 2000
Set-Content -LiteralPath $discordOut -Value $discordText -Encoding UTF8
Write-Host "wrote $((Resolve-Path -LiteralPath $discordOut).Path) ($($discordText.Length) chars, fits one Discord message)" -ForegroundColor Green

Write-Host ''
Write-Host 'Where to send it:' -ForegroundColor Cyan
Write-Host '  Discord  https://discord.gg/UltraPlace - post in the cyberpunk channel and tag @GhostWorldTourist'
Write-Host '  GitHub   https://github.com/GhostWorldTourist/cyberwise/issues/new/choose'
Write-Host ''
Write-Host 'Read both files before sending them. They are yours, not mine.' -ForegroundColor DarkGray
