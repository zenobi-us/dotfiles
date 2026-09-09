# UpstreamGuard.ps1 -- the upstream check every tool runs at startup, and the change register behind it.
#
#     . .\UpstreamGuard.ps1
#
#     Test-CwUpstream                       # the classification, as objects
#     Register-CwChange -File <path> -What '<what>' -Why '<why>' -ApprovedBy '<who>'
#     Get-CwChangeRegister                  # what is already recorded
#     Invoke-CwStartupGuard                 # the one-line advisory tools call
#
# WHY THIS EXISTS
#
# Cyberwise ships tools and instructions, and a fresh agent halfway through a
# problem will sometimes edit one of those tools to solve something the family
# already solves through a user-bundle affordance, an override mod, or a
# registered patch. Nothing reports it. The next session inherits a tool that no
# longer behaves the way its own documentation says, and cannot tell.
#
# The same lack of a record is how deliberately malicious behaviour would hide.
# A modified tool is invisible precisely because nobody ever compares.
#
# DEVIATION IS NOT SIN. This says "differs from upstream", never "corrupted" or
# "tampered". Plenty of people want their copy changed, and they are right to.
# A check that scolds them gets switched off, and then it protects nobody.
#
# **The finding is the UNLOGGED change, not the change.** A modification with a
# register entry beside it is a known local customization and reports as one.
#
# TWO HALVES, AND THEY LIVE IN DIFFERENT PLACES ON PURPOSE
#
#   the MANIFEST establishes truth -- skills\cyberwise\upstream.manifest
#       sha256 of every behaviour-bearing file, shipped WITH the repo so a fresh
#       clone carries its own idea of what it should look like.
#
#   the REGISTER records intent -- <records>\Cyberwise\changes.md
#       in the USER BUNDLE, never in the repo, because it has to survive a fresh
#       clone, a hard reset, and an update that overwrites the working tree.
#       A record of local changes that is destroyed by pulling is not a record.
#
# WHAT IS GUARDED, AND WHAT DELIBERATELY IS NOT
#
#   guarded:  skills\**\tools\*.ps1, every SKILL.md, tests\*.ps1, install.ps1
#   NOT:      wiki articles.
#
# The wiki is MEANT to grow - `Initialize-UserWiki` writes one stub per deployed
# mod and every documentation pass deepens more of them. Guarding it would put
# the register into double figures within a day, and a noisy register is an
# ignored register. Behaviour-bearing files change rarely; that is what makes a
# difference in one worth a line of output.
#
# THIS IS ADVISORY AND IT NEVER BLOCKS ANYTHING.
#
# It is not a PreToolUse hook and must not become one. A failing PreToolUse hook
# fails CLOSED and blocks every Edit in every session on the machine, including
# the edit that would fix the hook. That has already bitten this setup once.
# Every entry point here is wrapped so that a fault in the guard costs a line of
# output and nothing else.

# NOTHING HERE MAY CHANGE THE CALLER'S SHELL STATE. This file is dot-sourced
# into every tool in the family, so a `Set-StrictMode` or an
# `$ErrorActionPreference` set here would silently rewrite the rules the tool
# was written under. It defines functions and nothing else, and the functions
# are written to survive StrictMode rather than switching it off.

# --------------------------------------------------------------- locations --

$script:CwGuardScriptRoot = $PSScriptRoot

function Get-CwRecordsRoot {
    <#
        Where this family keeps records about an install: beside the game's own
        data, in a namespace folder of ours. Agent-neutral by design - Claude
        Code and Codex read the same path, so a change registered under one is
        visible to the other.

        CYBERWISE_RECORDS overrides it. That exists for tests and for an install
        whose saves are not on the default path; it is not a machine-specific
        default hidden in an environment variable.
    #>
    param([string] $RecordsRoot)
    if ($RecordsRoot)            { return $RecordsRoot }
    if ($env:CYBERWISE_RECORDS)  { return $env:CYBERWISE_RECORDS }
    return (Join-Path $env:USERPROFILE 'Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise')
}

function Resolve-CwGuardRoot {
    <#
    .SYNOPSIS
        Work out what layout this copy is in, and therefore what can be checked.
    .DESCRIPTION
        Two layouts are both legitimate and they can see different things:

          repo    a checkout. skills\, tests\ and install.ps1 are all present,
                  so the whole guarded set is reachable.
          skills  an INSTALLED copy. install.ps1 links skills\* individually
                  into ~\.claude\skills, so from a tool the family's skills are
                  siblings but the repo root is not above them. tests\ and
                  install.ps1 simply are not there.

        An installed copy must not report tests\Test-Family.ps1 as MISSING - it
        was never supposed to have one. Entries outside the reachable scope are
        skipped, and the report says how many.
    #>
    param([string] $Root)

    if ($Root) {
        $full = (Resolve-Path -LiteralPath $Root -ErrorAction SilentlyContinue)
        if (-not $full) { return $null }
        $r = $full.Path
    } else {
        # <root>\skills\cyberwise\tools\UpstreamGuard.ps1
        $r = Split-Path (Split-Path (Split-Path $script:CwGuardScriptRoot))
    }

    $skills = Join-Path $r 'skills'
    if (-not (Test-Path -LiteralPath $skills)) { return $null }

    $scope = 'skills'
    if ((Test-Path -LiteralPath (Join-Path $r 'install.ps1')) -and
        (Test-Path -LiteralPath (Join-Path $r 'tests'))) { $scope = 'repo' }

    [pscustomobject]@{ Root = $r; SkillsRoot = $skills; Scope = $scope }
}

function Get-CwManifestPath {
    <#
        The manifest ships INSIDE skills\cyberwise, not at the repo root, for the
        same reason the base wiki does: install.ps1 links skills\* and nothing
        above them, so anything kept at the root is unreachable from an installed
        copy. A guard the installed copies cannot run is a guard for developers
        only, and developers are not who it is for.
    #>
    param([string] $Root)
    $loc = Resolve-CwGuardRoot -Root $Root
    if (-not $loc) { return $null }
    Join-Path $loc.SkillsRoot 'cyberwise\upstream.manifest'
}

function Get-CwRegisterPath {
    param([string] $RecordsRoot)
    Join-Path (Get-CwRecordsRoot -RecordsRoot $RecordsRoot) 'changes.md'
}

# ---------------------------------------------------------------- hashing --

function Get-CwContentHash {
    <#
    .SYNOPSIS
        sha256 over the file's content with CRLF normalised to LF.
    .DESCRIPTION
        NORMALISATION IS LOAD-BEARING, not tidiness. This repo has no
        .gitattributes, so what lands in a working tree depends on the machine's
        core.autocrlf. Hashing raw bytes would make a manifest generated here
        disagree with a fresh clone on someone else's machine, for every single
        file - and a check that fires on everything is a check nobody reads.

        Every guarded file is text (.ps1, .md), so there is nothing binary to
        damage. A lone CR is left alone; only CRLF collapses.

        NORMALISE IN .NET, NOT IN A POWERSHELL LOOP. The obvious version walks
        the byte array skipping CRs; it is correct and it took 135 ms for the
        63 guarded files, which is most of a startup check that has to be
        unnoticeable. Decoding once, calling String.Replace and re-encoding does
        the same job in single-digit milliseconds.
    #>
    param([Parameter(Mandatory)][string] $Path)

    # .NET's idea of the current directory is not PowerShell's, so a relative
    # path handed to ReadAllBytes resolves somewhere else entirely - silently,
    # and usually to "file not found" in a directory nobody mentioned.
    $full = if ([System.IO.Path]::IsPathRooted($Path)) { $Path }
            else { (Resolve-Path -LiteralPath $Path -ErrorAction Stop).ProviderPath }
    $bytes = [System.IO.File]::ReadAllBytes($full)

    # Strip a UTF-8 BOM before hashing. Several tools in this family are written
    # by PowerShell 5.1's Set-Content, which adds one, and whether a BOM survives
    # an edit is an artefact of the editor rather than a change to behaviour.
    $start = 0
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) { $start = 3 }

    $text = [System.Text.Encoding]::UTF8.GetString($bytes, $start, $bytes.Length - $start)
    $norm = [System.Text.Encoding]::UTF8.GetBytes($text.Replace("`r`n", "`n"))

    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $h = $sha.ComputeHash($norm)
    } finally {
        $sha.Dispose()
    }
    [pscustomobject]@{
        Sha  = ([System.BitConverter]::ToString($h) -replace '-', '')
        Size = $norm.Length
    }
}

# ------------------------------------------------------------ guarded set --

function Get-CwGuardedFile {
    <#
    .SYNOPSIS
        Every behaviour-bearing file, as paths relative to the root.
    .DESCRIPTION
        ONE definition, used by the generator and the checker alike. Two copies
        of this list would drift, and the direction they drift in is always the
        same: the generator stops covering something and the checker stops
        noticing that it stopped.

        Only cyberwise* skills are enumerated. An installed copy lives in
        ~\.claude\skills beside every other skill the user has, and reporting
        somebody's unrelated skills as "new files in a guarded location" would be
        both wrong and insulting.
    #>
    param([string] $Root)

    $loc = Resolve-CwGuardRoot -Root $Root
    if (-not $loc) { return @() }

    # ArrayList, NOT System.Collections.Generic.List[object].
    #
    # On PowerShell 7.6 `@($list)` over a generic List[object] throws "Argument
    # types do not match" straight out of the binder, with a stack trace that
    # names neither the list nor the line you think you are on. Every collection
    # in this file is an ArrayList returned through .ToArray() for that reason -
    # it is not a style preference and swapping it back reintroduces the fault.
    # [IO.Directory] rather than Get-ChildItem, for the same reason the hash
    # normalises in .NET: enumerating this set with cmdlets cost 80 ms, and the
    # whole check has to disappear into the noise of starting a tool.
    $abs = New-Object System.Collections.ArrayList

    $skillDirs = @()
    try { $skillDirs = [System.IO.Directory]::GetDirectories($loc.SkillsRoot, 'cyberwise*') } catch { }
    foreach ($skill in ($skillDirs | Sort-Object)) {

        $md = Join-Path $skill 'SKILL.md'
        if ([System.IO.File]::Exists($md)) { [void]$abs.Add($md) }

        $toolsDir = Join-Path $skill 'tools'
        if ([System.IO.Directory]::Exists($toolsDir)) {
            foreach ($t in ([System.IO.Directory]::GetFiles($toolsDir, '*.ps1') | Sort-Object)) { [void]$abs.Add($t) }
        }
    }

    if ($loc.Scope -eq 'repo') {
        $testsDir = Join-Path $loc.Root 'tests'
        if ([System.IO.Directory]::Exists($testsDir)) {
            foreach ($t in ([System.IO.Directory]::GetFiles($testsDir, '*.ps1') | Sort-Object)) { [void]$abs.Add($t) }
        }
        $inst = Join-Path $loc.Root 'install.ps1'
        if ([System.IO.File]::Exists($inst)) { [void]$abs.Add($inst) }
    }

    $out = New-Object System.Collections.ArrayList
    foreach ($p in $abs) {
        $rel = $p.Substring($loc.Root.Length).TrimStart('\', '/') -replace '\\', '/'
        [void]$out.Add([pscustomobject]@{ Path = $rel; FullName = $p })
    }
    return $out.ToArray()
}

function Test-CwPathInScope {
    <#
        Is this manifest entry something the current layout is even supposed to
        have? An installed copy has no tests\ and no install.ps1 - that is the
        install working correctly, not a missing file.
    #>
    param([string] $RelPath, [string] $Scope)
    if ($Scope -eq 'repo') { return $true }
    return ($RelPath -like 'skills/*')
}

# ---------------------------------------------------------------- manifest --

function Read-CwManifest {
    <#
        Parsed by hand, deliberately. There is no format here that needs a
        parser: '#' comments, then one tab-separated line per file. The whole
        family's position is that PowerShell is already on the machine and
        nothing else should need installing.

        Returns $null when there is no manifest - which is a different answer
        from "the manifest is empty", and the callers treat it differently.
    #>
    param([string] $Path, [string] $Root)

    if (-not $Path) { $Path = Get-CwManifestPath -Root $Root }
    if (-not $Path -or -not (Test-Path -LiteralPath $Path)) { return $null }

    $entries = @{}
    $generated = $null
    foreach ($line in [System.IO.File]::ReadAllLines($Path)) {
        if ($line -match '^\s*#\s*generated:\s*(\S+)') { $generated = $matches[1]; continue }
        if ($line -match '^\s*#') { continue }
        if (-not $line.Trim()) { continue }
        $parts = $line -split "`t"
        if ($parts.Count -lt 3) { continue }
        $rel = ($parts[2].Trim() -replace '\\', '/')
        $entries[$rel] = [pscustomobject]@{
            Path = $rel
            Sha  = $parts[0].Trim().ToUpperInvariant()
            Size = [int]$parts[1].Trim()
        }
    }

    [pscustomobject]@{ Path = $Path; Generated = $generated; Entries = $entries }
}

function Write-CwManifest {
    <#
    .SYNOPSIS
        Write the manifest from what is on disk NOW.
    .DESCRIPTION
        Called only by New-UpstreamManifest.ps1, and that separation is the
        point. If checking could also regenerate, the guard would silently bless
        whatever it found the first time anything looked at it, and the whole
        thing would degrade into a very slow way of reporting no news.
    #>
    param([string] $Root, [string] $Path)

    $loc = Resolve-CwGuardRoot -Root $Root
    if (-not $loc) { throw "no skills\ directory found - is this a Cyberwise checkout?" }
    if ($loc.Scope -ne 'repo') {
        throw "this looks like an INSTALLED copy (no install.ps1 / tests\ above skills\). Regenerate the manifest in the repo, where the whole guarded set exists."
    }
    if (-not $Path) { $Path = Get-CwManifestPath -Root $Root }

    $files = Get-CwGuardedFile -Root $Root
    $lines = New-Object System.Collections.ArrayList

    [void]$lines.Add('# cyberwise upstream manifest')
    [void]$lines.Add('#')
    [void]$lines.Add('# sha256 of every behaviour-bearing file in the family, as it shipped. This is')
    [void]$lines.Add('# the "truth" half of the upstream guard; the "intent" half is the change')
    [void]$lines.Add('# register, which lives in the user bundle and never in this repo.')
    [void]$lines.Add('#')
    [void]$lines.Add('# Wiki articles are deliberately absent. They are meant to grow, and guarding')
    [void]$lines.Add('# them would fill the register with noise inside a day.')
    [void]$lines.Add('#')
    [void]$lines.Add('# Hashes are taken over content with CRLF collapsed to LF and any UTF-8 BOM')
    [void]$lines.Add('# dropped, so a fresh clone matches whatever line endings git hands you.')
    [void]$lines.Add('#')
    [void]$lines.Add('# REGENERATE DELIBERATELY, and only when the change IS the new upstream:')
    [void]$lines.Add('#     skills\cyberwise\tools\New-UpstreamManifest.ps1')
    [void]$lines.Add('# A local customization you want to keep goes in the register instead:')
    [void]$lines.Add('#     . skills\cyberwise\tools\UpstreamGuard.ps1; Register-CwChange ...')
    [void]$lines.Add('#')
    [void]$lines.Add("# generated: $((Get-Date).ToUniversalTime().ToString('s'))Z")
    [void]$lines.Add("# files: $($files.Count)")
    [void]$lines.Add('#')
    [void]$lines.Add('# <sha256> <TAB> <normalised bytes> <TAB> <path, relative to the repo root>')

    foreach ($f in ($files | Sort-Object Path)) {
        $h = Get-CwContentHash -Path $f.FullName
        [void]$lines.Add(("{0}`t{1}`t{2}" -f $h.Sha, $h.Size, $f.Path))
    }

    $dir = Split-Path -Parent $Path
    if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    # WriteAllText with an explicit no-BOM encoder: Set-Content -Encoding UTF8
    # adds a BOM under Windows PowerShell 5.1 and does not under 7, so the same
    # command would produce two different files depending on who ran it.
    [System.IO.File]::WriteAllText($Path, (($lines -join "`n") + "`n"), (New-Object System.Text.UTF8Encoding($false)))

    [pscustomobject]@{ Path = $Path; Count = $files.Count }
}

# ---------------------------------------------------------------- register --

function Get-CwChangeRegister {
    <#
    .SYNOPSIS
        Read the change register.
    .DESCRIPTION
        Markdown with a `## <id>` heading per entry and `- key: value` lines
        under it, because two audiences have to read this file and neither can be
        sacrificed to the other:

          a PERSON, a year later, deciding whether they still want a
          customization - which needs prose, in a file they can open and edit;

          the UPDATE FLOW, which pulls upstream, re-applies what is registered
          and lists it at the bottom of a changelog - which needs fields.

        Parsed by hand for the reason Test-Wiki.ps1 hand-rolls its own: there is
        no YAML parser in Windows PowerShell and adding one would break the rule
        that this family needs nothing installed.

        Hand-editing is expected. An entry missing a field is returned with that
        field empty rather than rejected - a register that refuses to load
        because somebody fixed a typo is a register that gets deleted.
    #>
    param([string] $RecordsRoot, [string] $Path)

    if (-not $Path) { $Path = Get-CwRegisterPath -RecordsRoot $RecordsRoot }
    if (-not (Test-Path -LiteralPath $Path)) {
        return [pscustomobject]@{ Path = $Path; Exists = $false; Entries = @() }
    }

    # Two passes: find the heading lines, then parse each block. A single pass
    # with a nested "close the current entry" helper is the obvious shape and it
    # is the one that trips the binder bug documented in Get-CwGuardedFile.
    $lines = @(Get-Content -LiteralPath $Path)
    $starts = New-Object System.Collections.ArrayList
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^##\s+(\S.*?)\s*$') { [void]$starts.Add($i) }
    }

    $entries = New-Object System.Collections.ArrayList
    for ($s = 0; $s -lt $starts.Count; $s++) {
        $from = $starts[$s]
        $to   = if ($s + 1 -lt $starts.Count) { $starts[$s + 1] - 1 } else { $lines.Count - 1 }

        $null = $lines[$from] -match '^##\s+(\S.*?)\s*$'
        $cur = [pscustomobject]@{
            Id = $matches[1]; File = ''; Status = 'active'; Sha = ''; Upstream = ''
            Copy = ''; Reapply = ''; ApprovedBy = ''; Recorded = ''; Body = ''; What = ''; Why = ''
        }

        $body = New-Object System.Collections.ArrayList
        for ($i = $from + 1; $i -le $to; $i++) {
            # [a-z0-9-], NOT [a-z-]. The first version of this pattern had no
            # digits in it, so `- sha256:` fell through to the body and every
            # entry parsed with an EMPTY hash - which reads as "this entry does
            # not describe the file", so every registered change reported as
            # unregistered. It parsed, it looked right, and it was silently
            # wrong in exactly the direction that makes the guard useless.
            if ($lines[$i] -match '^-\s+([a-z][a-z0-9-]*)\s*:\s*(.*)$') {
                $k = $matches[1]; $v = $matches[2].Trim()
                switch ($k) {
                    'file'        { $cur.File       = ($v -replace '\\', '/') }
                    'status'      { $cur.Status     = $v.ToLowerInvariant() }
                    'sha256'      { $cur.Sha        = $v.ToUpperInvariant() }
                    'upstream'    { $cur.Upstream   = $v.ToUpperInvariant() }
                    'copy'        { $cur.Copy       = $v }
                    'reapply'     { $cur.Reapply    = $v }
                    'approved-by' { $cur.ApprovedBy = $v }
                    'recorded'    { $cur.Recorded   = $v }
                    default       { $cur | Add-Member -NotePropertyName $k -NotePropertyValue $v -Force }
                }
                continue
            }
            [void]$body.Add($lines[$i])
        }

        $text = (($body -join "`n").Trim())
        $cur.Body = $text
        if ($text -match '(?ms)\*\*What changed\.\*\*\s*(.*?)(?:\n\s*\n|\z)') { $cur.What = $matches[1].Trim() }
        if ($text -match '(?ms)\*\*Why\.\*\*\s*(.*?)(?:\n\s*\n|\z)')          { $cur.Why  = $matches[1].Trim() }
        [void]$entries.Add($cur)
    }

    [pscustomobject]@{ Path = $Path; Exists = $true; Entries = $entries.ToArray() }
}

$script:CwRegisterPreamble = @'
# Cyberwise change register

Local modifications to files that **ship with Cyberwise**, and why they were
made. One `##` block per change.

**Deviation is not a fault.** This file exists so that a change is *known*, not
so that it is discouraged. Anything recorded here reports as a known local
customization and never as a finding.

**It lives here, beside the game's own data, and never in the repo.** It has to
survive a fresh clone, a hard reset, and an update that overwrites the working
tree - and it has to be readable by whichever agent picks the work up next.

**Before adding an entry, check whether the change was necessary at all.** The
family's own affordances usually cover it: the user bundle for anything about
this install, an override mod for a fix to somebody else's mod, a registered
patch (`ModPatchWatch.ps1`) for an edit to their file. Editing a shipped tool
should be the last option, not the first.

Add an entry with:

```powershell
. <skills>\cyberwise\tools\UpstreamGuard.ps1
Register-CwChange -File '<path>' -What '<what changed>' -Why '<why>' -ApprovedBy '<who>'
```

Fields, for the reader and for the update flow that consumes this:

| field | meaning |
|---|---|
| `file` | path relative to the repo root, forward slashes |
| `status` | `active` (still wanted) / `superseded` (replaced by a later entry) / `retired` (no longer wanted, kept for the history) |
| `sha256` | the file as registered. If it no longer matches, the file changed again and the entry no longer describes it |
| `upstream` | what the manifest said at the time, so a later reader knows which version this was made against |
| `copy` | a copy of the modified file, for re-deriving the change after an update |
| `reapply` | `re-derive` (read the copy, make the change again) or `none` (do not carry it forward) |

**`copy` is for re-deriving, never for replaying.** Re-applying an old edit
mechanically to a file that has since moved either fails - which is fine - or
succeeds in the wrong place, which is silent and worse. Same rule as
`Show-ModPatchDrift`, for the same reason.

<!-- entries below; newest last -->
'@

function Register-CwChange {
    <#
    .SYNOPSIS
        Record an approved local modification to a file that ships with Cyberwise.
    .DESCRIPTION
        Register at the moment the change is made. The value of the entry is in
        the hashes and the copy taken while the change is fresh; a week later
        nobody remembers which upstream version it was made against.

        An existing ACTIVE entry for the same file is marked `superseded` rather
        than rewritten, so the history stays readable and nobody's prose is
        destroyed by a tool.
    .EXAMPLE
        Register-CwChange -File 'skills\cyberwise\tools\Test-InstallReady.ps1' `
            -What 'raised the archive-count warning threshold from 200 to 600' `
            -Why  'this install runs 425 archives, so the warning fired every run and stopped being read' `
            -ApprovedBy 'tohuw'
    #>
    [CmdletBinding()]
    param(
        # The modified file. Absolute, or relative to the repo root.
        [Parameter(Mandatory)][string] $File,
        [Parameter(Mandatory)][string] $What,
        [Parameter(Mandatory)][string] $Why,
        # Who said yes. A change nobody approved is exactly what this guards
        # against, so there is no default and it is not optional.
        [Parameter(Mandatory)][string] $ApprovedBy,
        [ValidateSet('re-derive', 'none')][string] $Reapply = 're-derive',
        [string] $Root,
        [string] $RecordsRoot
    )

    $loc = Resolve-CwGuardRoot -Root $Root
    if (-not $loc) { throw "no skills\ directory found above this script - pass -Root" }

    $full = if ([System.IO.Path]::IsPathRooted($File)) { $File } else { Join-Path $loc.Root $File }
    if (-not (Test-Path -LiteralPath $full)) { throw "no such file: $full" }
    $full = (Get-Item -LiteralPath $full).FullName

    $rel = if ($full.StartsWith($loc.Root, [StringComparison]::OrdinalIgnoreCase)) {
        $full.Substring($loc.Root.Length).TrimStart('\', '/') -replace '\\', '/'
    } else {
        throw "that file is outside this copy of Cyberwise ($($loc.Root)). The register covers shipped files only; a patch to somebody else's mod belongs in ModPatchWatch.ps1."
    }

    $guarded = @(Get-CwGuardedFile -Root $Root | Where-Object { $_.Path -eq $rel })
    if (-not $guarded.Count) {
        Write-Warning "$rel is not in the guarded set (skills\**\tools\*.ps1, SKILL.md, tests\*.ps1, install.ps1). Recording it anyway, but nothing will check it."
    }

    $man = Read-CwManifest -Root $Root
    $upstream = ''
    if ($man -and $man.Entries.ContainsKey($rel)) { $upstream = $man.Entries[$rel].Sha }

    $h = Get-CwContentHash -Path $full
    if ($upstream -and $upstream -eq $h.Sha) {
        Write-Warning "$rel is byte-identical to upstream - there is nothing to register yet. Make the change first."
    }

    $records = Get-CwRecordsRoot -RecordsRoot $RecordsRoot
    $regPath = Join-Path $records 'changes.md'
    $copyDir = Join-Path $records 'changes'
    if (-not (Test-Path -LiteralPath $copyDir)) { New-Item -ItemType Directory -Path $copyDir -Force | Out-Null }

    $slug = ($rel -replace '^skills/', '' -replace '[^A-Za-z0-9]+', '-').Trim('-').ToLowerInvariant()
    $stamp = Get-Date
    $id = '{0}-{1}' -f $stamp.ToString('yyyy-MM-dd'), $slug

    $existing = Get-CwChangeRegister -RecordsRoot $RecordsRoot
    $n = 1
    while ($existing.Entries | Where-Object { $_.Id -eq $id }) { $n++; $id = '{0}-{1}-{2}' -f $stamp.ToString('yyyy-MM-dd'), $slug, $n }

    $copyName = "$id.mine"
    Copy-Item -LiteralPath $full -Destination (Join-Path $copyDir $copyName) -Force

    # --- supersede any active entry for the same file ------------------------
    #
    # A one-line edit, so every word anybody wrote in the old entry survives.
    $lines = if ($existing.Exists) { @(Get-Content -LiteralPath $regPath) } else { @($script:CwRegisterPreamble -split "`r?`n") }
    if ($existing.Exists) {
        $inEntry = $false; $entryFile = ''; $statusLine = -1
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match '^##\s+\S') {
                if ($inEntry -and $entryFile -eq $rel -and $statusLine -ge 0) { $lines[$statusLine] = '- status: superseded' }
                $inEntry = $true; $entryFile = ''; $statusLine = -1
                continue
            }
            if (-not $inEntry) { continue }
            if ($lines[$i] -match '^-\s+file\s*:\s*(.*)$')   { $entryFile = ($matches[1].Trim() -replace '\\', '/') }
            if ($lines[$i] -match '^-\s+status\s*:\s*active\s*$') { $statusLine = $i }
        }
        if ($inEntry -and $entryFile -eq $rel -and $statusLine -ge 0) { $lines[$statusLine] = '- status: superseded' }
    }

    $tz = [System.TimeZoneInfo]::Local.GetUtcOffset($stamp)
    $offset = '{0}{1:00}:{2:00}' -f $(if ($tz.Ticks -lt 0) { '-' } else { '+' }), [math]::Abs($tz.Hours), [math]::Abs($tz.Minutes)
    $recorded = $stamp.ToString('yyyy-MM-ddTHH:mm:ss') + $offset

    $block = @(
        ''
        "## $id"
        ''
        "- file: $rel"
        '- status: active'
        "- sha256: $($h.Sha)"
        "- upstream: $(if ($upstream) { $upstream } else { '(not in the manifest)' })"
        "- copy: changes/$copyName"
        "- reapply: $Reapply"
        "- approved-by: $ApprovedBy"
        "- recorded: $recorded"
        ''
        "**What changed.** $What"
        ''
        "**Why.** $Why"
        ''
    )

    $all = @($lines) + $block
    [System.IO.File]::WriteAllText($regPath, (($all -join "`n").TrimEnd() + "`n"), (New-Object System.Text.UTF8Encoding($false)))

    Write-Host "registered '$id' in $regPath" -ForegroundColor Green
    [pscustomobject]@{ Id = $id; File = $rel; Sha = $h.Sha; Upstream = $upstream; Register = $regPath; Copy = (Join-Path $copyDir $copyName) }
}

# ----------------------------------------------------------------- the check --

function Test-CwUpstream {
    <#
    .SYNOPSIS
        Hash the guarded set, diff it against the manifest, cross-reference the
        register, and classify every difference.
    .DESCRIPTION
        States, and what each one means:

          OK            matches the manifest.
          REGISTERED    differs from upstream, and the register has an active
                        entry whose recorded hash IS the bytes on disk. A known
                        local customization. Not a finding.
          UNREGISTERED  differs from upstream with nothing recorded - or with an
                        entry that no longer describes the file, because it was
                        changed again after being registered. THIS is the
                        finding.
          MISSING       in the manifest, not on disk.
          NEW           on disk in a guarded location, not in the manifest.

        Returns objects. Printing is the caller's job, because the startup guard
        wants one line and the CLI wants a table.

        -DifferencesOnly is what the startup guard passes. It changes nothing
        about the comparison - the SAME hashing and the SAME guarded set - and
        only stops matching files being turned into objects nobody will read.
        A second, faster copy of the compare was the tempting version of this
        and it is exactly the shape of bug this whole feature exists to catch:
        two implementations that agree until one of them quietly stops.
    #>
    [CmdletBinding()]
    param([string] $Root, [string] $RecordsRoot, [string] $ManifestPath, [switch] $DifferencesOnly)

    $loc = Resolve-CwGuardRoot -Root $Root
    if (-not $loc) {
        return [pscustomobject]@{ Ok = $false; Reason = 'nolayout'; Findings = @(); Skipped = 0; Scope = $null }
    }

    $man = Read-CwManifest -Path $ManifestPath -Root $Root
    if (-not $man) {
        return [pscustomobject]@{ Ok = $false; Reason = 'nomanifest'; Findings = @(); Skipped = 0
                                  Scope = $loc.Scope; ManifestPath = (Get-CwManifestPath -Root $Root) }
    }

    # The register is read LAZILY. On a clean tree - the overwhelmingly common
    # case, and the one the startup guard pays for on every single tool run -
    # nothing differs, so nothing needs cross-referencing and the file is never
    # opened. $byFile stays $null until the first difference asks for it.
    $reg = $null
    $byFile = $null
    $byFileAny = $null   # includes superseded/retired entries, for the wording only

    $onDisk = @{}
    foreach ($f in (Get-CwGuardedFile -Root $Root)) { $onDisk[$f.Path] = $f }

    $findings = New-Object System.Collections.ArrayList
    $okCount = 0
    $skipped = 0

    foreach ($rel in ($man.Entries.Keys | Sort-Object)) {
        if (-not (Test-CwPathInScope -RelPath $rel -Scope $loc.Scope)) { $skipped++; continue }

        $want = $man.Entries[$rel]
        if (-not $onDisk.ContainsKey($rel)) {
            [void]$findings.Add([pscustomobject]@{ Path = $rel; State = 'MISSING'; Entry = $null
                Detail = 'in the manifest, not on disk' })
            continue
        }

        $h = Get-CwContentHash -Path $onDisk[$rel].FullName
        if ($h.Sha -eq $want.Sha) {
            $okCount++
            if (-not $DifferencesOnly) {
                [void]$findings.Add([pscustomobject]@{ Path = $rel; State = 'OK'; Entry = $null; Detail = '' })
            }
            continue
        }

        if ($null -eq $byFile) {
            $reg = Get-CwChangeRegister -RecordsRoot $RecordsRoot
            $byFile = @{}
            $byFileAny = @{}
            foreach ($e in $reg.Entries) {
                if (-not $e.File) { continue }
                $byFileAny[$e.File] = $e
                if ($e.Status -ne 'active') { continue }
                $byFile[$e.File] = $e   # a later entry wins; Register-CwChange supersedes the earlier one
            }
        }

        $entry = $byFile[$rel]
        if ($entry -and $entry.Sha -eq $h.Sha) {
            [void]$findings.Add([pscustomobject]@{ Path = $rel; State = 'REGISTERED'; Entry = $entry
                Detail = $entry.What })
        } elseif ($entry) {
            [void]$findings.Add([pscustomobject]@{ Path = $rel; State = 'UNREGISTERED'; Entry = $entry
                Detail = "registered as '$($entry.Id)', but the file has changed AGAIN since - the entry no longer describes it" })
        } else {
            # An entry that is superseded or retired is history, not cover - but
            # saying "nothing is recorded" when the register plainly mentions the
            # file sends the reader looking for a second register.
            $old = $byFileAny[$rel]
            $why = if ($old) { "differs from upstream. The register's entry for it is '$($old.Status)', so nothing active describes what is on disk" }
                   else      { 'differs from upstream, and nothing is recorded about it' }
            [void]$findings.Add([pscustomobject]@{ Path = $rel; State = 'UNREGISTERED'; Entry = $null; Detail = $why })
        }
    }

    foreach ($rel in ($onDisk.Keys | Sort-Object)) {
        if ($man.Entries.ContainsKey($rel)) { continue }
        if ($null -eq $byFile) {
            $reg = Get-CwChangeRegister -RecordsRoot $RecordsRoot
            $byFile = @{}
            foreach ($e in $reg.Entries) {
                if ($e.Status -ne 'active') { continue }
                if (-not $e.File) { continue }
                $byFile[$e.File] = $e
            }
        }
        $entry = $byFile[$rel]
        [void]$findings.Add([pscustomobject]@{ Path = $rel; State = 'NEW'; Entry = $entry
            Detail = $(if ($entry) { "recorded as '$($entry.Id)'" } else { 'a file in a guarded location that the manifest has never seen' }) })
    }

    $found = $findings.ToArray()
    $unlogged = @($found | Where-Object { $_.State -eq 'UNREGISTERED' }).Count
    $missing  = @($found | Where-Object { $_.State -eq 'MISSING' }).Count
    $new      = @($found | Where-Object { $_.State -eq 'NEW' -and -not $_.Entry }).Count

    [pscustomobject]@{
        Ok           = (($unlogged + $missing + $new) -eq 0)
        Reason       = 'checked'
        Scope        = $loc.Scope
        Root         = $loc.Root
        ManifestPath = $man.Path
        Generated    = $man.Generated
        RegisterPath = $(if ($reg) { $reg.Path } else { Get-CwRegisterPath -RecordsRoot $RecordsRoot })
        Findings     = $found
        # $okCount counts matching files whether or not they were emitted as
        # objects, so this is right in both modes. Adding $found.Count would
        # double-count them in the full one.
        Checked      = ($okCount + @($found | Where-Object { $_.State -ne 'OK' }).Count)
        Matching     = $okCount
        Skipped      = $skipped
        Unregistered = $unlogged
        Missing      = $missing
        New          = $new
        Registered   = @($found | Where-Object { $_.State -eq 'REGISTERED' }).Count
    }
}

# ----------------------------------------------------------- startup guard --

function Invoke-CwStartupGuard {
    <#
    .SYNOPSIS
        The advisory every Cyberwise tool runs at startup. Silent when clean.
    .DESCRIPTION
        A check nobody runs is worth nothing, and the agent most likely to edit a
        tool is the least likely to run the test suite. So the provocation is the
        tool itself: you use the thing, it notices.

        Three properties, all mandatory:

          FAST     ~60 small files, hashed in-process. Slower than that and it
                   gets ripped out of the tools.
          QUIET    nothing at all when the tree matches, one short line when it
                   does not. Never a table, never a stack trace.
          HARMLESS wrapped so that any fault here costs the line of output and
                   nothing else. It never throws, never sets an exit code, never
                   blocks. It is NOT a PreToolUse hook and must not become one.

        CYBERWISE_NO_GUARD silences it, for a user who does not want it and for
        test suites that need deterministic output.
    #>
    [CmdletBinding()]
    param([string] $Root, [string] $RecordsRoot)

    if ($env:CYBERWISE_NO_GUARD) { return }

    # Once per process. Tools dot-source each other, and the same advisory three
    # times over is how a one-line notice becomes noise people learn to skip.
    # Get-Variable rather than a bare $global: read, because under StrictMode an
    # unset variable throws - and the guard must never be the thing that breaks.
    if (Get-Variable -Name CwStartupGuardRan -Scope Global -ErrorAction SilentlyContinue) { return }
    Set-Variable -Name CwStartupGuardRan -Scope Global -Value $true

    try {
        $r = Test-CwUpstream -Root $Root -RecordsRoot $RecordsRoot -DifferencesOnly

        if ($r.Reason -eq 'nolayout') { return }   # a lone copy of one tool; nothing to say

        if ($r.Reason -eq 'nomanifest') {
            Write-Host "cyberwise: no upstream manifest, so shipped files are not being checked. Rebuild it with skills\cyberwise\tools\New-UpstreamManifest.ps1" -ForegroundColor DarkYellow
            return
        }

        if ($r.Ok) { return }   # clean, or clean apart from things already recorded

        $bits = @()
        if ($r.Unregistered) { $bits += "$($r.Unregistered) modified" }
        if ($r.Missing)      { $bits += "$($r.Missing) missing" }
        if ($r.New)          { $bits += "$($r.New) new" }
        Write-Host ("cyberwise: {0} shipped file(s) differ from upstream and are not in the change register ({1}). skills\cyberwise\tools\Test-Upstream.ps1" -f
                    ($r.Unregistered + $r.Missing + $r.New), ($bits -join ', ')) -ForegroundColor DarkYellow
    } catch {
        # Deliberately swallowed, and this is the one place in the family where
        # that is right. The guard is advisory; a bug in it must not take down
        # the tool the user actually asked for.
    }
}
