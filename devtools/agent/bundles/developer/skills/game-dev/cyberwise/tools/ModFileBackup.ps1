# ModFileBackup.ps1 -- take back the ability to undo.
#
#     . .\tools\ModFileBackup.ps1        # dot-source, then use the functions
#
#     Backup-ModFile   -Path <file> [-Note 'why']     snapshot before you write
#     Show-ModFileDiff -Path <file> -NewText <text>   preview WITHOUT writing
#     Get-ModFileBackup -Path <file>                  what snapshots exist
#     Restore-ModFile  -Path <file> [-Snapshot <id>]  put it back
#
# WHY THIS EXISTS
#
# None of cyberwise's tools modify a user's install - they only write their own
# reports. The risk is what an ASSISTANT does by hand while following the skill:
# rewriting `modlist.txt`, patching another author's `.yaml` in place, editing
# `user.ini`. Those edits are irreversible, and that is the actual hazard - not
# whether the user understood the command they approved.
#
# A confused "yes" to a read-only command costs nothing. A confused "yes" to a
# modlist rewrite on a 900-mod load order costs the load order. The permission
# dialog cannot fix that in any client. A backup can.
#
# So: **snapshot before every in-place write, and show a diff before asking.**
# What the user approves should be a readable preview, not a line of PowerShell.
#
# TWO THINGS THAT MAKE THIS LESS OBVIOUS THAN IT LOOKS
#
# 1. Backups must NOT live inside the game directory. A mod manager deploying by
#    hardlink treats that tree as its own: a purge, a redeploy or an uninstall can
#    remove or overwrite what you left there. The vault is under LOCALAPPDATA.
#
# 2. Vortex deploys by HARDLINK, so a deployed file and its staging copy are one
#    file on disk. Copy-Item to the vault makes a genuine independent copy, which
#    is what you want. Restoring writes through to staging as well - also what you
#    want, and worth knowing before you are surprised by it.

# --------------------------------------------------------------------- vault --

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot 'UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }

function Get-ModBackupVault {
    <#  Outside the game directory on purpose - see the header. #>
    param([string]$Vault)
    if (-not $Vault) { $Vault = Join-Path $env:LOCALAPPDATA 'cyberwise\backups' }
    if (-not (Test-Path -LiteralPath $Vault)) { New-Item -ItemType Directory -Path $Vault -Force | Out-Null }
    return $Vault
}

function Get-ModBackupIndex {
    param([string]$Vault)
    $idx = Join-Path (Get-ModBackupVault $Vault) 'index.json'
    if (-not (Test-Path -LiteralPath $idx)) { return @() }
    try   { return @(Get-Content -LiteralPath $idx -Raw | ConvertFrom-Json) }
    catch { return @() }   # a corrupt index must never block a backup
}

function Save-ModBackupIndex {
    param($Entries, [string]$Vault)
    $idx = Join-Path (Get-ModBackupVault $Vault) 'index.json'
    @($Entries) | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $idx -Encoding UTF8
}

# -------------------------------------------------------------------- backup --

function Backup-ModFile {
    <#
    .SYNOPSIS
        Snapshot a file before modifying it. Returns the snapshot record.
    .DESCRIPTION
        Call this BEFORE the write, every time, including when you are confident.
        Confidence is not the variable that decides whether an edit was wrong.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string] $Path,
        [string] $Note,
        [string] $Vault,
        # Archives run to gigabytes and are never hand-edited; refuse by default
        # rather than quietly filling a disk.
        [int]    $MaxMB = 50,
        [switch] $Force
    )

    if (-not (Test-Path -LiteralPath $Path)) { throw "nothing to back up - no such file: $Path" }
    $item = Get-Item -LiteralPath $Path
    if ($item.PSIsContainer) { throw "Backup-ModFile takes a file, not a directory: $Path" }

    $mb = $item.Length / 1MB
    if ($mb -gt $MaxMB -and -not $Force) {
        throw ("refusing to back up $([math]::Round($mb,1)) MB (limit $MaxMB MB): $Path`n" +
               "Large binaries are not hand-edited - if you really mean it, pass -Force.")
    }

    $vaultDir = Get-ModBackupVault $Vault
    $hash     = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
    $stamp    = Get-Date -Format 'yyyyMMdd-HHmmss'
    $safe     = ($item.Name -replace '[^A-Za-z0-9._-]', '_')
    $snapId   = "$stamp-$($hash.Substring(0,8))"
    $snapFile = Join-Path $vaultDir "$safe.$snapId.bak"

    Copy-Item -LiteralPath $Path -Destination $snapFile -Force

    $entry = [pscustomobject]@{
        SnapshotId = $snapId
        Original   = $item.FullName
        Snapshot   = $snapFile
        Sha256     = $hash
        Bytes      = $item.Length
        TakenUtc   = (Get-Date).ToUniversalTime().ToString('s') + 'Z'
        Note       = $Note
    }

    Save-ModBackupIndex (@(Get-ModBackupIndex $Vault) + $entry) $Vault
    Write-Verbose "backed up $Path -> $snapFile"
    return $entry
}

function Get-ModFileBackup {
    <# Snapshots for one file, or the whole vault when -Path is omitted. Newest first. #>
    [CmdletBinding()]
    param([string]$Path, [string]$Vault)

    $all = Get-ModBackupIndex $Vault
    if ($Path) {
        # Resolve when it exists, so a relative path matches a stored absolute one.
        $full = if (Test-Path -LiteralPath $Path) { (Get-Item -LiteralPath $Path).FullName } else { $Path }
        $all  = $all | Where-Object { $_.Original -eq $full }
    }
    return @($all | Sort-Object TakenUtc -Descending)
}

# ------------------------------------------------------------------- restore --

function Restore-ModFile {
    <#
    .SYNOPSIS
        Put a file back. Defaults to the most recent snapshot.
    .DESCRIPTION
        Takes a snapshot of the CURRENT contents first, so a restore is itself
        undoable - restoring the wrong version must not be a second dead end.
    #>
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)][string] $Path,
        [string] $Snapshot,
        [string] $Vault
    )

    $snaps = Get-ModFileBackup -Path $Path -Vault $Vault
    if (-not $snaps.Count) { throw "no snapshots on file for: $Path" }

    $pick = if ($Snapshot) { $snaps | Where-Object SnapshotId -eq $Snapshot | Select-Object -First 1 }
            else           { $snaps[0] }
    if (-not $pick) { throw "no snapshot '$Snapshot' for $Path. Available: $(($snaps.SnapshotId) -join ', ')" }
    if (-not (Test-Path -LiteralPath $pick.Snapshot)) { throw "index names a snapshot that is gone: $($pick.Snapshot)" }

    if ($PSCmdlet.ShouldProcess($Path, "restore snapshot $($pick.SnapshotId)")) {
        if (Test-Path -LiteralPath $Path) {
            Backup-ModFile -Path $Path -Note "auto: state before restoring $($pick.SnapshotId)" -Vault $Vault -Force | Out-Null
        }
        Copy-Item -LiteralPath $pick.Snapshot -Destination $Path -Force
        Write-Verbose "restored $Path from $($pick.SnapshotId)"
    }
    return $pick
}

# ---------------------------------------------------------------- dry run ----

function Show-ModFileDiff {
    <#
    .SYNOPSIS
        Print what a change WOULD do. Writes nothing.
    .DESCRIPTION
        The point is the approval surface: a user who cannot read PowerShell can
        still read "this line becomes that line". Show this, get agreement, then
        write - never the other way round.

        Trims the common head and tail and reports the changed middle. That is
        exact for the localised edits this is for (a key, a value, a line in
        modlist.txt). For a wholesale rewrite it will say so rather than pretend
        to be a real diff engine.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string] $Path,
        [Parameter(Mandatory, ParameterSetName='Text')][AllowEmptyString()][string] $NewText,
        [Parameter(Mandatory, ParameterSetName='File')][string] $NewFile,
        [int] $Context = 2
    )

    if (-not (Test-Path -LiteralPath $Path)) { throw "no such file: $Path" }
    # `if` is a statement, not an expression: `(if (...) {...} else {...})` parses
    # as a call to a command named "if" and yields NOTHING. That produced a diff
    # claiming every line was being deleted while the write itself was correct -
    # a lying preview, which is the one failure this whole file exists to prevent.
    # Assign from the statement on its own line and split afterwards.
    $newRaw = if ($NewFile) { [IO.File]::ReadAllText($NewFile) } else { $NewText }

    $old = [IO.File]::ReadAllText($Path) -split "`r?`n"
    $new = $newRaw -split "`r?`n"

    if (($old -join "`n") -eq ($new -join "`n")) {
        Write-Host "no change: $Path" -ForegroundColor DarkGray
        return [pscustomobject]@{ Changed = $false; Removed = 0; Added = 0 }
    }

    $head = 0
    while ($head -lt $old.Count -and $head -lt $new.Count -and $old[$head] -eq $new[$head]) { $head++ }
    $tail = 0
    while ($tail -lt ($old.Count - $head) -and $tail -lt ($new.Count - $head) -and
           $old[$old.Count - 1 - $tail] -eq $new[$new.Count - 1 - $tail]) { $tail++ }

    $oldMid = if ($old.Count - $tail - $head -gt 0) { $old[$head..($old.Count - $tail - 1)] } else { @() }
    $newMid = if ($new.Count - $tail - $head -gt 0) { $new[$head..($new.Count - $tail - 1)] } else { @() }

    Write-Host ''
    Write-Host $Path -ForegroundColor Cyan
    Write-Host ("-" * [math]::Min(78, [math]::Max(20, $Path.Length)))

    $ctxStart = [math]::Max(0, $head - $Context)
    for ($i = $ctxStart; $i -lt $head; $i++) { Write-Host ("  {0,5}   {1}" -f ($i + 1), $old[$i]) -ForegroundColor DarkGray }

    $n = 0
    foreach ($l in $oldMid) { Write-Host ("- {0,5}   {1}" -f ($head + 1 + $n), $l) -ForegroundColor Red;   $n++ }
    $n = 0
    foreach ($l in $newMid) { Write-Host ("+ {0,5}   {1}" -f ($head + 1 + $n), $l) -ForegroundColor Green; $n++ }

    $after = $old.Count - $tail
    for ($i = $after; $i -lt [math]::Min($old.Count, $after + $Context); $i++) {
        Write-Host ("  {0,5}   {1}" -f ($i + 1), $old[$i]) -ForegroundColor DarkGray
    }

    Write-Host ''
    Write-Host ("{0} line(s) removed, {1} added" -f $oldMid.Count, $newMid.Count) -ForegroundColor Yellow
    if ($head -eq 0 -and $tail -eq 0 -and $old.Count -gt 5) {
        Write-Host "NOTE: nothing in common at either end - this is a wholesale rewrite, not an edit." -ForegroundColor Yellow
    }
    Write-Host ''

    return [pscustomobject]@{ Changed = $true; Removed = $oldMid.Count; Added = $newMid.Count }
}

# ------------------------------------------------------------------ combined --

function Set-ModFileContent {
    <#
    .SYNOPSIS
        The safe write: diff, snapshot, then write. Use this instead of Set-Content.
    .DESCRIPTION
        -WhatIf shows the diff and stops, which is the intended first call.
        Encoding defaults to UTF8 without BOM: a BOM at the top of a .yaml, .ini
        or modlist.txt is read as part of the first entry by some parsers.
    #>
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)][string] $Path,
        [Parameter(Mandatory)][AllowEmptyString()][string] $NewText,
        [string] $Note,
        [string] $Vault,
        [switch] $Force
    )

    $diff = Show-ModFileDiff -Path $Path -NewText $NewText
    if (-not $diff.Changed) { return }

    if ($PSCmdlet.ShouldProcess($Path, "write $($diff.Added) line(s), removing $($diff.Removed)")) {
        $snap = Backup-ModFile -Path $Path -Note $Note -Vault $Vault -Force:$Force
        [IO.File]::WriteAllText($Path, $NewText, (New-Object Text.UTF8Encoding $false))
        Write-Host "wrote $Path  (undo: Restore-ModFile -Path '$Path' -Snapshot $($snap.SnapshotId))" -ForegroundColor Green
        return $snap
    }
}
