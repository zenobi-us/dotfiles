# DeviceGeometry.ps1 -- where a device's buttons physically ARE, read from the
#   user's own wiki bundle rather than from a table shipped inside the tool.
#
#     . .\DeviceGeometry.ps1
#     $g = Get-DeviceGeometry -Name 'SCIMITAR RGB ELITE WIRELESS'
#     $g.Cells    # -> Label / Row / Col, one per key that exists
#
# ---------------------------------------------------------------------------
# WHY THE DATA IS NOT IN HERE
# ---------------------------------------------------------------------------
#
# A registry of every peripheral, shipped with the tool, is a database that
# rots. It needs an edit every time anybody buys a mouse, it is permanently
# behind, and the one device it is guaranteed not to know is the one the person
# asking actually owns.
#
# A device's geometry is a fact about ONE PERSON'S DESK - exactly like the
# machine profile that already sits beside it - so it lives in that person's
# wiki bundle, where adding a device is a wiki edit rather than a release. What
# ships is the format; what never ships is whose desk it describes.
#
# The format is documented for everybody in the base wiki at
# /input/describing-a-device-physical-geometry. The short version, one fenced
# block per surface, conventionally in the bundle's `devices.md`:
#
#     ```device
#     match: SCIMITAR RGB ELITE     <- regex against the reported device name
#     name: Corsair Scimitar RGB Elite Wireless
#     surface: side keypad
#     columns: 4
#     rows: 3
#     origin: bottom-left           <- which corner holds the FIRST key
#     flow: column                  <- up a column, then to the next column
#     first: 1
#     prefix: G                     <- label = prefix + number, so `G1`
#     count: 12
#     ```
#
# A corner plus a flow is the whole of "which direction does the numbering run":
# bottom-left + column means up, then rightwards. An irregular surface uses
# `map:` instead and draws itself, top row first, `.` for a hole.
#
# NOTHING HERE IS MOUSE-SHAPED, deliberately. A Stream Deck, a macro pad and a
# thumb pad are one abstraction - a grid of physical keys, each mapped to an
# action - and a schema that only describes thumb pads gets rewritten the first
# time somebody plugs in something else.
#
# ---------------------------------------------------------------------------
# DEGRADING IS THE NORMAL CASE
# ---------------------------------------------------------------------------
#
# Most people own no programmable peripheral, and most of those who do have
# written no geometry down. No bundle, no article, no matching block, or a block
# that will not parse must each return NOTHING and let the caller fall back to a
# flat list. A page that fails over an absent optional article is worse than one
# that never drew a grid. Only a block that is present and WRONG warns, because
# that is the one case where somebody is waiting for a grid that will not come.
#
# PowerShell 5.1: there is no YAML parser on the machine and there is not going
# to be one. Everything below is regex and string work, and the format was chosen
# so that it can be.

# Where this user's records live. Same root every other tool in the family uses.
$script:CwDeviceBundleDefault =
    Join-Path $env:USERPROFILE 'Saved Games\CD Projekt Red\Cyberpunk 2077\Cyberwise\wiki'

# One `key: value` list, plus `key: |` block scalars. Not YAML - the shapes the
# format actually uses, and null for anything else, because a wrong parse that
# reports success would draw a confidently wrong pad.
function ConvertFrom-DeviceBlock {
    <#
    .SYNOPSIS
        Parse one device block's body into a field table.
    #>
    param([string] $Text)

    $fields = @{}
    if (-not $Text) { return $fields }
    $lines = $Text -split "\r?\n"
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if ($line -match '^\s*$' -or $line -match '^\s*#') { continue }
        if ($line -notmatch '^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*?)\s*$') { continue }
        $key = $matches[1].ToLowerInvariant()
        $val = $matches[2]

        # A block scalar swallows every following line that is INDENTED. The
        # first line back at column 0 is the next field, so a missing `|` can
        # never silently eat the rest of the block.
        if ($val -match '^\|-?$') {
            $body = New-Object System.Collections.Generic.List[string]
            while ($i + 1 -lt $lines.Count -and ($lines[$i + 1] -match '^\s+\S' -or $lines[$i + 1] -match '^\s*$')) {
                $i++
                $body.Add($lines[$i])
            }
            while ($body.Count -gt 0 -and $body[$body.Count - 1].Trim() -eq '') { $body.RemoveAt($body.Count - 1) }
            $fields[$key] = ($body -join "`n")
        } else {
            $fields[$key] = $val.Trim('"').Trim("'")
        }
    }
    return $fields
}

# Every ```device block in a chunk of markdown. Only that fence - an article is
# full of other code blocks, and the diagram a human draws beside the block is
# usually one of them.
function Get-DeviceBlock {
    <#
    .SYNOPSIS
        Every parsed device block in a markdown document.
    #>
    param([string] $Text, [string] $From = '')

    # A plain array, not a generic List: a List of hashtables does not survive
    # PowerShell's own @() conversion, and it fails as an ArgumentException five
    # frames from anything that explains it.
    $out = @()
    if (-not $Text) { return ,$out }

    # NORMALISE THE LINE ENDINGS FIRST, and this is not a nicety.
    #
    # .NET's `$` in multiline mode matches immediately before a `\n` - which is
    # AFTER the `\r` of a CRLF pair. So `^[ \t]*```[ \t]*$` never matches a
    # closing fence in a file with Windows line endings, and every block in it
    # is invisible.
    #
    # That is the normal way for this file to be written. Notepad, most Windows
    # editors and PowerShell's own Set-Content all produce CRLF, and this
    # article is meant to be HAND-EDITED - the whole point of keeping device
    # geometry in a wiki bundle is that adding a device is a text edit rather
    # than a release. The failure was silent in the worst way: the article sits
    # there, correct and readable, and the sheet just quietly draws a list.
    $Text = $Text -replace "`r`n", "`n"

    foreach ($m in [regex]::Matches($Text, '(?ms)^[ \t]*```[ \t]*device[ \t]*\r?\n(.*?)^[ \t]*```[ \t]*$')) {
        $f = ConvertFrom-DeviceBlock $m.Groups[1].Value
        $f['_from'] = $From
        $out += $f
    }
    return ,$out
}

# ------------------------------------------------------------------ layout ---
#
# A corner and a flow fix both axes, so there is no third direction field to get
# wrong. `flow: column` counts along a column first; the origin corner says
# which end of the column is the start and which side the next column is on.

function Resolve-DeviceLayout {
    <#
    .SYNOPSIS
        Turn one device block into placed cells, or null if it cannot be drawn.
    #>
    [CmdletBinding()]
    param([hashtable] $Block, [string] $ReportedName = '')

    if (-not $Block) { return $null }
    $where = if ($Block['_from']) { " (in $($Block['_from']))" } else { '' }
    $label = if ($Block['name']) { [string]$Block['name'] } elseif ($ReportedName) { $ReportedName } else { 'device' }

    $cells = @()
    $prefix = [string]$Block['prefix']

    # ---- the explicit map wins wherever both are present ---------------------
    #
    # Not because it is more expressive, but because it is CHECKABLE: somebody
    # holding the device can hold the page up next to it. `origin: bottom-left`
    # is right or wrong in a way nobody can see.
    if ($Block.ContainsKey('map') -and [string]$Block['map']) {
        $rows = @([string]$Block['map'] -split "\r?\n" | Where-Object { $_.Trim() -ne '' })
        $cols = 0
        for ($r = 0; $r -lt $rows.Count; $r++) {
            $toks = @($rows[$r].Trim() -split '\s+')
            if ($toks.Count -gt $cols) { $cols = $toks.Count }
            for ($c = 0; $c -lt $toks.Count; $c++) {
                if ($toks[$c] -eq '.' -or $toks[$c] -eq '-') { continue }
                $t = $toks[$c]
                if ($t -match '^\d+$') { $t = "$prefix$t" }
                $cells += [pscustomobject]@{ Label = $t; Row = $r; Col = $c }
            }
        }
        if (-not @($cells).Count) {
            Write-Warning "device geometry for '$label'$where has a map with no keys in it - ignoring it"
            return $null
        }
        return [pscustomobject]@{
            Name = $label; Surface = [string]$Block['surface']
            Columns = $cols; Rows = $rows.Count; Source = 'map'
            Cells = @($cells)
        }
    }

    # ---- derived from dimensions + corner + flow ------------------------------
    $cols = 0; $rowN = 0
    if (-not ([int]::TryParse([string]$Block['columns'], [ref]$cols)) -or
        -not ([int]::TryParse([string]$Block['rows'], [ref]$rowN)) -or
        $cols -lt 1 -or $rowN -lt 1) {
        # Present but unusable. Somebody is waiting for a grid, so say so - this
        # is the one case that is a mistake rather than an absence.
        Write-Warning "device geometry for '$label'$where needs columns and rows (or a map) - falling back to a list"
        return $null
    }

    $origin = ([string]$Block['origin']).ToLowerInvariant()
    if (-not $origin) { $origin = 'top-left' }
    if ($origin -notmatch '^(top|bottom)-(left|right)$') {
        Write-Warning "device geometry for '$label'$where has origin '$origin' - use top-left, top-right, bottom-left or bottom-right"
        return $null
    }
    $flow = ([string]$Block['flow']).ToLowerInvariant()
    if (-not $flow) { $flow = 'row' }
    if ($flow -ne 'row' -and $flow -ne 'column') {
        Write-Warning "device geometry for '$label'$where has flow '$flow' - use row or column"
        return $null
    }

    $first = 1
    if ($Block.ContainsKey('first')) { [void][int]::TryParse([string]$Block['first'], [ref]$first) }
    $count = $cols * $rowN
    if ($Block.ContainsKey('count')) {
        $c = 0
        if ([int]::TryParse([string]$Block['count'], [ref]$c) -and $c -gt 0) { $count = [math]::Min($c, $cols * $rowN) }
    }

    $fromTop  = $origin -like 'top-*'
    $fromLeft = $origin -like '*-left'

    for ($i = 0; $i -lt $count; $i++) {
        if ($flow -eq 'column') {
            $major = [math]::Floor($i / $rowN)   # which column, counting from the origin side
            $minor = $i % $rowN                  # how far along that column, from the origin end
            $col = if ($fromLeft) { $major } else { $cols - 1 - $major }
            $row = if ($fromTop)  { $minor } else { $rowN - 1 - $minor }
        } else {
            $major = [math]::Floor($i / $cols)   # which row
            $minor = $i % $cols                  # how far along it
            $row = if ($fromTop)  { $major } else { $rowN - 1 - $major }
            $col = if ($fromLeft) { $minor } else { $cols - 1 - $minor }
        }
        $cells += [pscustomobject]@{ Label = "$prefix$($first + $i)"; Row = [int]$row; Col = [int]$col }
    }

    return [pscustomobject]@{
        Name = $label; Surface = [string]$Block['surface']
        Columns = $cols; Rows = $rowN; Source = 'derived'
        Cells = @($cells)
    }
}

# ------------------------------------------------------------------ lookup ---

function Get-DeviceGeometry {
    <#
    .SYNOPSIS
        The physical layout of a named device, from the user's wiki bundle.
    .DESCRIPTION
        Returns null - never an error - when there is no bundle, no article, no
        block whose `match` fits, or nothing to match against. The caller falls
        back to a flat list.
    #>
    [CmdletBinding()]
    param(
        # The device name as the profile reader reported it, e.g. iCUE's
        # 'SCIMITAR RGB ELITE WIRELESS'.
        [string] $Name,

        # The user's wiki bundle. Root-level *.md only: `mods/` holds hundreds of
        # articles and none of them describes hardware.
        [string] $Bundle = $script:CwDeviceBundleDefault
    )

    if (-not $Name) { return $null }
    if (-not $Bundle -or -not (Test-Path -LiteralPath $Bundle)) { return $null }

    $files = @(Get-ChildItem -LiteralPath $Bundle -Filter *.md -File -ErrorAction SilentlyContinue |
               Sort-Object @{e = { if ($_.Name -ieq 'devices.md') { 0 } else { 1 } } }, Name)
    foreach ($f in $files) {
        $text = Get-Content -LiteralPath $f.FullName -Raw -ErrorAction SilentlyContinue
        foreach ($b in (Get-DeviceBlock -Text $text -From $f.Name)) {
            $pat = [string]$b['match']
            if (-not $pat) { continue }
            # A hand-written regex can be malformed. That is the author's typo,
            # not a reason to stop reading the file - fall back to a literal
            # containment test so the block still has a chance of matching.
            $hit = $false
            try { $hit = [bool]($Name -imatch $pat) }
            catch { $hit = $Name.IndexOf($pat, [StringComparison]::OrdinalIgnoreCase) -ge 0 }
            if (-not $hit) { continue }

            $layout = Resolve-DeviceLayout -Block $b -ReportedName $Name
            if ($layout) { return $layout }
        }
    }
    return $null
}
