# Expand-Save.ps1 -- decompress a Cyberpunk 2077 sav.dat into a flat blob.
#
# Format (confirmed against ManualSave-1's own header):
#   'CSAV' magic (stored 'VASC'), saveVersion u32, gameVersion u32, 13 misc bytes,
#   'CLZF' magic (stored 'FZLC'), chunkCount u32,
#   then chunkCount triplets of (fileOffset u32, compressedSize u32, decompressedSize u32).
#
# Each chunk's payload is an LZ4 BLOCK (not a frame), prefixed by an 8-byte
# header. .NET has no LZ4, so the block decoder below is hand-rolled -- the
# format is small enough that this is safer than pulling in a dependency.

param(
    [Parameter(Mandatory = $true)][string]$SavePath,
    [Parameter(Mandatory = $true)][string]$OutPath
)

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }


Add-Type -TypeDefinition @'
using System;

public static class Lz4Block
{
    // Canonical LZ4 block decoder: token nibbles give literal and match
    // lengths, 0xF means "read continuation bytes", matches use a 16-bit
    // back-offset and MUST be copied byte-at-a-time (overlapping runs are legal
    // and are how LZ4 encodes repeats).
    public static byte[] Decode(byte[] src, int srcStart, int srcLen, int dstLen)
    {
        byte[] dst = new byte[dstLen];
        int s = srcStart, sEnd = srcStart + srcLen, d = 0;

        while (s < sEnd)
        {
            int token = src[s++];

            int litLen = token >> 4;
            if (litLen == 15)
            {
                int add;
                do { add = src[s++]; litLen += add; } while (add == 255);
            }

            Buffer.BlockCopy(src, s, dst, d, litLen);
            s += litLen;
            d += litLen;

            if (s >= sEnd) break;

            int offset = src[s] | (src[s + 1] << 8);
            s += 2;

            int matchLen = token & 0xF;
            if (matchLen == 15)
            {
                int add;
                do { add = src[s++]; matchLen += add; } while (add == 255);
            }
            matchLen += 4;

            int m = d - offset;
            for (int i = 0; i < matchLen; i++) dst[d++] = dst[m++];
        }

        return dst;
    }
}
'@

$bytes = [System.IO.File]::ReadAllBytes($SavePath)

function Get-U32([byte[]]$b, [int]$o) { return [BitConverter]::ToUInt32($b, $o) }

$saveVersion = Get-U32 $bytes 4
$gameVersion = Get-U32 $bytes 8
Write-Host "saveVersion  $saveVersion"
Write-Host "gameVersion  $gameVersion"

# locate the 'FZLC' table marker
$tableAt = -1
for ($i = 12; $i -lt 128; $i++) {
    if ($bytes[$i] -eq 0x46 -and $bytes[$i + 1] -eq 0x5A -and $bytes[$i + 2] -eq 0x4C -and $bytes[$i + 3] -eq 0x43) {
        $tableAt = $i
        break
    }
}
if ($tableAt -lt 0) { throw "no FZLC chunk table found" }

$chunkCount = Get-U32 $bytes ($tableAt + 4)
Write-Host "chunks       $chunkCount (table at $tableAt)"

$out = New-Object System.IO.MemoryStream
$p = $tableAt + 8

for ($c = 0; $c -lt $chunkCount; $c++) {
    $offset     = Get-U32 $bytes $p
    $compSize   = Get-U32 $bytes ($p + 4)
    $decompSize = Get-U32 $bytes ($p + 8)
    $p += 12

    # payload begins with an 8-byte chunk header ('XNLZ' + decompressed size)
    $payloadAt  = [int]$offset + 8
    $payloadLen = [int]$compSize - 8

    $chunk = [Lz4Block]::Decode($bytes, $payloadAt, $payloadLen, [int]$decompSize)
    $out.Write($chunk, 0, $chunk.Length)
}

[System.IO.File]::WriteAllBytes($OutPath, $out.ToArray())
$out.Dispose()

Write-Host "wrote $OutPath  ($((Get-Item $OutPath).Length) bytes)"
