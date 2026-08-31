# Resolve-ResourcePath.ps1 -- turn archive hashes into file paths, and back.
#
#     . .\Resolve-ResourcePath.ps1
#     Resolve-ResourceHash 0x4C8E...        # -> base\characters\...\skin_d.xbm
#     Get-ResourceHash 'base\characters\player\player.ent'
#
# WHY THIS EXISTS
#
# A `.archive` indexes its contents by 64-bit hashes and carries no path strings,
# so every conflict report this family produces has been able to say HOW MANY
# files a mod loses and never WHICH. That is a direct violation of the family's
# own rule - always dereference an internal name to something the user can act on
# - and it is the difference between "Preem Skin loses 3 of 16 files" and "Preem
# Skin loses the torso diffuse to MaterialGirl".
#
# The lookup table is vendored: 751,710 paths for 2.31 + Phantom Liberty, from
# VanStorm's resource-path database (CC BY 4.0, see data/ATTRIBUTION.md).
#
# WHAT IT COSTS AND WHY IT IS SHAPED THIS WAY
#
# The upstream data is an 79 MB SQLite file, and reading SQLite means shipping a
# database engine. The vendored form is 11 MB, front-coded and deflated, and
# needs nothing but seek-and-read - which is the only reason this is a script
# rather than a dependency. Format and rebuild instructions:
# tools/Build-ResourcePathIndex.py at the repo root.
#
# First call decompresses to %LOCALAPPDATA%\cyberwise\cache (23 MB) and later
# calls memory-map that. Nothing is written to the game install.

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }

$script:CWPX = $null

function Get-ResourceHash {
    <#
    .SYNOPSIS
        FNV-1a 64-bit of a resource path, the way the archives compute it.
    .DESCRIPTION
        UTF-8 bytes of the path with BACKSLASH separators and no null
        terminator. Forward slashes hash to something else entirely, which is a
        silent wrong answer rather than an error, so they are normalised here.
    #>
    param([Parameter(Mandatory)][string] $Path)

    # BigInteger with an explicit mask, because POWERSHELL DOES NOT WRAP.
    # `[uint64] * [uint64]` promotes to double on overflow and then fails the
    # cast - so the naive loop produced 0xCBF29CE484222337 for every path, which
    # is the offset basis XORed once and nothing else. FNV is defined on
    # wrapping 64-bit arithmetic; masking each round is that definition.
    $mask = [bigint]::Pow(2, 64) - 1
    $h = [bigint]14695981039346656037
    $prime = [bigint]1099511628211
    foreach ($b in [Text.Encoding]::UTF8.GetBytes(($Path -replace '/', '\'))) {
        $h = ($h -bxor [bigint]$b)
        $h = ($h * $prime) -band $mask
    }
    return [uint64]$h
}

function Get-ResourcePathIndex {
    <#
    .SYNOPSIS
        Load the vendored index, decompressing to a cache on first use.
    #>
    param([string] $IndexPath)

    if ($script:CWPX) { return $script:CWPX }

    if (-not $IndexPath) {
        $IndexPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'data\resource-paths-2.31.cwpx'
    }
    if (-not (Test-Path -LiteralPath $IndexPath)) {
        Write-Warning "No resource-path index at $IndexPath - hashes cannot be named."
        return $null
    }

    # Decompressed once into a cache: 23 MB of index is cheap on disk and
    # expensive to inflate on every call. Keyed by the source file's write time
    # so a rebuilt index is picked up rather than silently ignored.
    $stamp = (Get-Item -LiteralPath $IndexPath).LastWriteTimeUtc.ToString('yyyyMMddHHmmss')
    $cache = Join-Path $env:LOCALAPPDATA "cyberwise\cache\resource-paths-$stamp.bin"
    if (-not (Test-Path -LiteralPath $cache)) {
        $dir = Split-Path -Parent $cache
        if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        $in  = [IO.File]::OpenRead($IndexPath)
        $ds  = New-Object IO.Compression.DeflateStream($in, [IO.Compression.CompressionMode]::Decompress)
        $tmp = "$cache.$PID.tmp"
        $out = [IO.File]::Create($tmp)
        try { $ds.CopyTo($out) } finally { $out.Dispose(); $ds.Dispose(); $in.Dispose() }
        # Move into place only once complete: a half-written cache read by the
        # next run would resolve garbage rather than fail.
        Move-Item -LiteralPath $tmp -Destination $cache -Force
        Get-ChildItem -LiteralPath $dir -Filter 'resource-paths-*.bin' |
            Where-Object { $_.FullName -ne $cache } | Remove-Item -Force -ErrorAction SilentlyContinue
    }

    $bytes = [IO.File]::ReadAllBytes($cache)
    if ($bytes.Length -lt 37 -or [Text.Encoding]::ASCII.GetString($bytes, 0, 5) -ne 'CWPX1') {
        Write-Warning "Resource-path index is not a CWPX1 file; ignoring it."
        return $null
    }

    $script:CWPX = [pscustomobject]@{
        Bytes     = $bytes
        Count     = [BitConverter]::ToUInt32($bytes, 5)
        BlockSize = [BitConverter]::ToUInt32($bytes, 9)
        HashOff   = [BitConverter]::ToUInt32($bytes, 13)
        HashLen   = [BitConverter]::ToUInt32($bytes, 17)
        BlkOff    = [BitConverter]::ToUInt32($bytes, 21)
        BlkLen    = [BitConverter]::ToUInt32($bytes, 25)
        BodyOff   = [BitConverter]::ToUInt32($bytes, 29)
        BodyLen   = [BitConverter]::ToUInt32($bytes, 33)
    }
    return $script:CWPX
}

function Resolve-ResourceHash {
    <#
    .SYNOPSIS
        The path for an archive hash, or $null when the table does not know it.
    .DESCRIPTION
        $null is a real answer and must not be dressed up as one: the table
        covers 99.97% of base-game and EP1 files, so an unresolved hash usually
        means the resource belongs to a MOD rather than to the game - which is
        itself information, and the opposite of "this file does not exist".
    #>
    param(
        [Parameter(Mandatory, ValueFromPipeline)] [uint64] $Hash,
        [string] $IndexPath
    )
    begin { $ix = Get-ResourcePathIndex -IndexPath $IndexPath }
    process {
        if (-not $ix) { return $null }

        # The table stores hashes SIGNED, because SQLite has no unsigned 64-bit
        # integer. Comparing a uint64 against those directly finds nothing for
        # every hash above 2^63 - which is half of them, silently.
        $signed = [BitConverter]::ToInt64([BitConverter]::GetBytes($Hash), 0)

        $lo = 0
        $hi = [int]($ix.HashLen / 12) - 1
        $ordinal = -1
        while ($lo -le $hi) {
            $mid = [int](($lo + $hi) / 2)
            $at  = $ix.HashOff + $mid * 12
            $probe = [BitConverter]::ToInt64($ix.Bytes, $at)
            if ($probe -eq $signed) { $ordinal = [BitConverter]::ToUInt32($ix.Bytes, $at + 8); break }
            if ($probe -lt $signed) { $lo = $mid + 1 } else { $hi = $mid - 1 }
        }
        if ($ordinal -lt 0) { return $null }

        # Front-coded body: seek the block, then walk forward, rebuilding each
        # path from the previous one's shared prefix.
        $block = [int]([math]::Floor($ordinal / $ix.BlockSize))
        $within = $ordinal - $block * $ix.BlockSize
        $p = $ix.BodyOff + [BitConverter]::ToUInt32($ix.Bytes, $ix.BlkOff + $block * 4)

        $len = [BitConverter]::ToUInt16($ix.Bytes, $p); $p += 2
        $cur = New-Object byte[] $len
        [Array]::Copy($ix.Bytes, $p, $cur, 0, $len); $p += $len

        for ($i = 1; $i -le $within; $i++) {
            $shared = $ix.Bytes[$p]; $p += 1
            $sufLen = [BitConverter]::ToUInt16($ix.Bytes, $p); $p += 2
            $next = New-Object byte[] ($shared + $sufLen)
            if ($shared -gt 0) { [Array]::Copy($cur, 0, $next, 0, $shared) }
            [Array]::Copy($ix.Bytes, $p, $next, $shared, $sufLen); $p += $sufLen
            $cur = $next
        }
        return [Text.Encoding]::UTF8.GetString($cur)
    }
}

function Resolve-ResourceHashes {
    <#
    .SYNOPSIS
        Bulk form: a hashtable of hash -> path for the hashes it knows.
    .DESCRIPTION
        A conflict scan asks about thousands of hashes at once, and the index
        loads once for the whole set rather than once per call.
    #>
    param(
        [Parameter(Mandatory)] [uint64[]] $Hashes,
        [string] $IndexPath
    )
    $map = @{}
    $ix = Get-ResourcePathIndex -IndexPath $IndexPath
    if (-not $ix) { return $map }
    foreach ($h in $Hashes) {
        $p = Resolve-ResourceHash -Hash $h -IndexPath $IndexPath
        if ($p) { $map[$h] = $p }
    }
    return $map
}

function Find-ResourcePath {
    <#
    .SYNOPSIS
        Every base-game path matching a wildcard, with its hash.
    .DESCRIPTION
        The reverse direction, and the one that makes quest work possible: you
        know the shape of what you are looking for (`*\sq026\*.questphase`) and
        need the hashes to look for inside mod archives.

        The body is stored in PATH order, so a prefix search could binary-search
        it - but a substring search cannot, and substring is what people
        actually have ("clouds", "sq026"). So this decodes the whole table once
        and caches the result for the session. It is one pass over 751,710
        entries; the alternative is a second index nobody would keep in step.
    #>
    param(
        [Parameter(Mandatory)] [string] $Like,
        [string] $IndexPath
    )

    $ix = Get-ResourcePathIndex -IndexPath $IndexPath
    if (-not $ix) { return @() }

    if (-not $script:AllPaths) {
        $list = New-Object 'System.Collections.Generic.List[string]' ([int]$ix.Count)
        $p = [int]$ix.BodyOff
        $end = $p + [int]$ix.BodyLen
        $cur = $null
        $n = 0
        while ($p -lt $end) {
            if ($n % $ix.BlockSize -eq 0) {
                $len = [BitConverter]::ToUInt16($ix.Bytes, $p); $p += 2
                $cur = New-Object byte[] $len
                [Array]::Copy($ix.Bytes, $p, $cur, 0, $len); $p += $len
            } else {
                $shared = $ix.Bytes[$p]; $p += 1
                $sufLen = [BitConverter]::ToUInt16($ix.Bytes, $p); $p += 2
                $next = New-Object byte[] ($shared + $sufLen)
                if ($shared -gt 0) { [Array]::Copy($cur, 0, $next, 0, $shared) }
                [Array]::Copy($ix.Bytes, $p, $next, $shared, $sufLen); $p += $sufLen
                $cur = $next
            }
            $list.Add([Text.Encoding]::UTF8.GetString($cur))
            $n++
        }
        $script:AllPaths = $list
    }

    $out = New-Object 'System.Collections.Generic.List[object]'
    foreach ($p in $script:AllPaths) {
        if ($p -like $Like) {
            $out.Add([pscustomobject]@{ Path = $p; Hash = (Get-ResourceHash $p) })
        }
    }
    return $out
}
