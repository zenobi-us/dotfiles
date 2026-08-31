# ModPreference.ps1 -- what this user has already said about being recommended things.
#
#     . .\ModPreference.ps1
#     Test-RecommendAllowed -Item 'Appearance Change Unlocker'
#     Register-Decline -Item 'Appearance Change Unlocker' -Reason 'not interested'
#     Set-RecommendMode  -Mode off
#
# WHY THIS IS A FILE AND NOT AN AGENT'S MEMORY
#
# An agent's memory is excellent local mutable config and a bad place for a rule
# that governs behaviour, for three reasons that all bite here:
#
#   1. This family is used from Claude Code AND Codex. One agent's memory is
#      invisible to the other, so "stop recommending things" would hold in one
#      session and be forgotten in the next.
#   2. The skills ship to other people. Their agent has no memory of anybody's
#      preferences and must not need one.
#   3. A preference that governs a tool's behaviour should be readable by the
#      person it governs, in a file they can open and edit.
#
# So the file is the authority and lives with the family's other records, which
# are deliberately agent-neutral:
#
#   %USERPROFILE%\Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\preferences.json
#
# An agent may ALSO note the preference in its own memory - that is a cache, and
# a convenience for knowing the file exists at all. **When the two disagree, the
# file wins**, and the memory is what gets corrected.
#
# A decline is permanent and dated. Asking twice is the failure this exists to
# prevent, and "I forgot" is not a defence the user can see.

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }

$script:CwRecordsDefault = Join-Path $env:USERPROFILE 'Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise'

function Get-CwPreferencePath {
    param([string] $RecordsRoot)
    if (-not $RecordsRoot) { $RecordsRoot = $script:CwRecordsDefault }
    Join-Path $RecordsRoot 'preferences.json'
}

function Get-CwPreferences {
    <#
        Returns the preference object, always - a missing or unreadable file
        yields defaults rather than an error. A tool that throws because nobody
        has stated a preference yet would make the common case the broken one.
    #>
    param([string] $RecordsRoot)

    $path = Get-CwPreferencePath -RecordsRoot $RecordsRoot
    $default = [pscustomobject]@{
        recommendations = 'on'
        declined        = @()
        source          = $path
        exists          = $false
    }
    if (-not (Test-Path -LiteralPath $path)) { return $default }

    try {
        $raw = Get-Content -LiteralPath $path -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
    } catch {
        # A corrupt preferences file must not silently re-enable recommendations
        # the user turned off. Fail CLOSED: assume off, and say why.
        Write-Warning "preferences file unreadable ($path): $($_.Exception.Message). Treating recommendations as OFF."
        return [pscustomobject]@{ recommendations = 'off'; declined = @(); source = $path; exists = $true }
    }

    [pscustomobject]@{
        recommendations = if ($raw.recommendations) { "$($raw.recommendations)".ToLower() } else { 'on' }
        declined        = @($raw.declined)
        source          = $path
        exists          = $true
    }
}

function Test-CwDeclined {
    param([Parameter(Mandatory)] [string] $Item, [string] $RecordsRoot)
    $p = Get-CwPreferences -RecordsRoot $RecordsRoot
    foreach ($d in $p.declined) {
        if ($d -and $d.mod -and $d.mod -eq $Item) { return $true }
    }
    return $false
}

function Test-RecommendAllowed {
    <#
        The single gate every recommendation must pass. Off globally, or declined
        individually, means silence - not a softer mention.
    #>
    param([Parameter(Mandatory)] [string] $Item, [string] $RecordsRoot)

    $p = Get-CwPreferences -RecordsRoot $RecordsRoot
    if ($p.recommendations -eq 'off') { return $false }
    return -not (Test-CwDeclined -Item $Item -RecordsRoot $RecordsRoot)
}

function Save-CwPreferences {
    param([Parameter(Mandatory)] $Preferences, [string] $RecordsRoot)

    $path = Get-CwPreferencePath -RecordsRoot $RecordsRoot
    $dir  = Split-Path $path -Parent
    if (-not (Test-Path -LiteralPath $dir)) { $null = New-Item -ItemType Directory -Path $dir -Force }

    # Only the two fields that mean anything are written back, so a hand-edited
    # file cannot grow junk through a round trip.
    $prefJson = ([pscustomobject]@{
        recommendations = $Preferences.recommendations
        declined        = @($Preferences.declined)
    } | ConvertTo-Json -Depth 5)
    # `-Encoding utf8NoBOM` DOES NOT EXIST on Windows PowerShell 5.1 and throws
    # there; `-Encoding UTF8` means *with* a BOM on 5.1, which is how three
    # invisible bytes end up in front of `---` and stop a front-matter parser. Write
    # through an explicit no-BOM encoder instead. The path is made absolute first
    # because [System.IO.File] resolves a relative path against .NET's own current
    # directory, which is not PowerShell's.
    $prefFull = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($path)
    [System.IO.File]::WriteAllText($prefFull, $prefJson + "`r`n", (New-Object System.Text.UTF8Encoding($false)))
    $path
}

function Register-Decline {
    <#
        Record that the user said no to one item. Idempotent: saying no twice
        does not produce two entries, and does not move the original date.
    #>
    param(
        [Parameter(Mandatory)] [string] $Item,
        [string] $Reason,
        [string] $On,
        [string] $RecordsRoot
    )
    if (-not $On) { $On = (Get-Date).ToString('yyyy-MM-dd') }

    $p = Get-CwPreferences -RecordsRoot $RecordsRoot
    if (Test-CwDeclined -Item $Item -RecordsRoot $RecordsRoot) { return (Get-CwPreferencePath -RecordsRoot $RecordsRoot) }

    $p.declined = @($p.declined) + [pscustomobject]@{ mod = $Item; on = $On; reason = $Reason }
    Save-CwPreferences -Preferences $p -RecordsRoot $RecordsRoot
}

function Set-RecommendMode {
    <#
        'off' is the "never recommend me anything" switch. It is deliberately a
        single field rather than a per-skill matrix: a user who says never means
        never, and a setting they have to find in four places is one they cannot
        trust.
    #>
    param(
        [Parameter(Mandatory)] [ValidateSet('on', 'off')] [string] $Mode,
        [string] $RecordsRoot
    )
    $p = Get-CwPreferences -RecordsRoot $RecordsRoot
    $p.recommendations = $Mode
    Save-CwPreferences -Preferences $p -RecordsRoot $RecordsRoot
}
