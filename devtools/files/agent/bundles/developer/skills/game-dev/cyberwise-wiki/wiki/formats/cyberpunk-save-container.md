---
type: File Format
title: A sav.dat is an LZ4 block container with an uncompressed index bolted on the end
description: The chunk table, the node table, the packed-VLQ count, and the offset arithmetic that makes a naive seek overrun the buffer and look like a decompression bug.
tags: [saves, sav.dat, lz4, binary-format, offsets]
status: stable
sources:
  - id: autosave
    resource: "a 2,108,220-byte AutoSave sav.dat written by patch 2.31 (saveVersion 269, gameVersion 2310)"
generated: { by: "claude", at: "2026-08-24T21:40:00-04:00" }
---

# A sav.dat is an LZ4 block container with an uncompressed index bolted on the end

**Verified against a real save on patch 2.31 (August 2026). This is an internal
format with no compatibility promise - the save carries its own `saveVersion`,
and CDPR revises it. Re-verify every offset below before trusting it on a
newer patch.**

Two facts do most of the work, and both are the opposite of the obvious guess:

- **The compressed payload is LZ4 *blocks*, not LZ4 *frames*.** A general LZ4
  library refuses them outright, because it is looking for a frame magic that is
  not there.
- **The node table at the end of the file is NOT compressed**, and its offsets
  point into the *logical* (decompressed-plus-header) file, not into your
  decompressed blob. Get that wrong and the last node overruns your buffer by
  roughly 1700 bytes - which looks exactly like a decompression bug and is not.

## Answer the question from metadata first, if you can

Each save is a folder under `%USERPROFILE%\Saved Games\CD Projekt Red\Cyberpunk 2077\`.
Inside it, `metadata.9.json` sits beside `sav.dat` and needs **no decoding**. It
carries level, street cred, attributes, skills, lifepath, playtime, difficulty,
build/patch version, active quests and some quest facts. Most questions about a
playthrough are answered there without opening the container at all.

`LocKey#<small number>` values in that JSON are localization **primaryKeys**, not
hashes. (An ACU preset's `LocKey#` is a third thing again - see
[the ACU preset format](/formats/acu-preset).)

A save is personal data. Read what the question needs, quote back the minimum,
and never write a decoded save or an appearance dump anywhere shareable.

## The header, byte for byte

The first 96 bytes of a real save:

```
00000000: 5641 5343 0d01 0000 0609 0000 00ed 4072  VASC..........@r
00000010: 0400 dca3 7ec3 0000 0046 5a4c 431f 0000  ....~....FZLC...
00000020: 0021 1800 00d8 1401 0000 0004 00f9 2c01  .!............,.
```

Reading it:

| offset | bytes | meaning |
|---|---|---|
| `0x00` | `56 41 53 43` | `'CSAV'`, stored byte-reversed as `VASC` |
| `0x04` | `0d 01 00 00` | `saveVersion` u32 = **269** |
| `0x08` | `06 09 00 00` | `gameVersion` u32 = **2310** (patch 2.31) |
| `0x0C` | 13 bytes | misc; not needed to parse |
| `0x19` | `46 5A 4C 43` | `'CLZF'`, stored as `FZLC` - the chunk table marker |
| `0x1D` | `1f 00 00 00` | `chunkCount` u32 = **31** |
| `0x21` | ... | `chunkCount` triplets |

**Do not hardcode `0x19` for the `FZLC` marker.** The 13 misc bytes are the part
least worth trusting across patches; scan forward from offset 12 for the four
bytes `46 5A 4C 43` instead.

Each triplet is three u32s: `fileOffset`, `compressedSize`, `decompressedSize`,
and the first triplet starts at the marker + 8 (offset `0x21` here, not `0x1D`).
The sample's table:

```
chunk  0  off=6177     comp=70872   decomp=262144
chunk  1  off=77049    comp=59511   decomp=262144
...
chunk 29  off=1945204  comp=110200  decomp=262144
chunk 30  off=2055404  comp=45190   decomp=100454
```

Every chunk decompresses to 256 KB (0x40000) except the last. Note that chunk
30's `fileOffset + compressedSize` = 2100594, which is exactly where the node
table starts - the compressed region and the index are adjacent with no padding.

### Each chunk payload has its own 8-byte header

At file offset 6177:

```
00001821: 345a 4c58 0000 0400 f01f 0000 0000 0100  4ZLX............
```

`34 5A 4C 58` is `'XLZ4'` stored byte-reversed as `4ZLX`, followed by the u32
decompressed size (0x40000 again). **The raw LZ4 block starts 8 bytes into the
payload**, so decode from `fileOffset + 8` for `compressedSize - 8` bytes.

> A shipped decoder in this family carries a comment calling this magic `'XNLZ'`.
> That comment is wrong; the bytes on disk are `4ZLX`. If you are checking a
> magic against a comment rather than against a file, check the file.

Concatenating the decoded chunks in table order gives one flat blob. If your
language has no LZ4 - .NET and PowerShell do not - the block decoder is about 40
lines (token nibbles, `0xF` means read continuation bytes, matches use a 16-bit
back-offset and **must** be copied byte-at-a-time because overlapping runs are
how LZ4 encodes repeats). Writing it is safer than adding a dependency.

## The node table: read it from the end, not by scanning

The **last eight bytes of the file** are the whole index to the index:

```
00202b2c: 82a0 7900 0500 0000 720d 2000 454e 4f44  ..y.....r. .ENOD
                                ^^^^^^^^^ ^^^^^^^^
                                u32 offset  'ENOD'
```

`72 0d 20 00` = **2100594**, the file offset where the node table begins - and at
that offset sits the opening marker `EDON`:

```
00200d72: 4544 4f4e 7603 8f47 616d 6553 6573 7369  EDONv..GameSessi
00200d82: 6f6e 4465 7363 0200 0000 0100 0000 2118  onDesc........!.
00200d92: 0000 3a00 0000 9367 616d 653a 3a53 6573  ..:....game::Ses
```

So: seek to `fileLength - 8`, read a u32, verify `ENOD` follows it, jump there,
verify `EDON`. No scanning, no heuristics.

### The count is a packed VLQ, not a u16

After `EDON` come the bytes `76 03`, and reading them as a little-endian u16
gives **886**. That number is wrong. Parsing the sample's entries to exhaustion
yields **246** nodes, and the table ends exactly at `fileLength - 8`.

`76 03` is CDPR's packed variable-length integer:

```
byte 0:  bit 7 = sign, bit 6 = "more bytes follow", bits 0-5 = low 6 bits
byte n:  bit 7 = "more bytes follow",               bits 0-6 = next 7 bits

0x76 = 0b0111_0110 -> more=1, low6 = 0b110110 = 54
0x03                              -> 3 << 6   = 192
                                     54 + 192 = 246   <- the real node count
```

A u16 read happens to leave the stream aligned here purely because the value is
two bytes wide. On a save with fewer than 64 nodes it would be one byte, and the
whole table would parse as garbage.

### Entry layout

Each entry is:

```
[lenByte][name][nextId i32][childId i32][offset u32][size u32]
```

`lenByte` is `0x80 | length`. The two i32s are **`nextId` and `childId`**, both
`-1` (`0xFFFFFFFF`) for a leaf - they are not a single id followed by a literal
sentinel, which is what a table full of leaves looks like if you only read the
leaves. The root entry proves it:

```
[1] GameSessionDesc         next=2   child=1   off=6177     size=58
[2] game::SessionConfig     next=-1  child=-1  off=6181     size=54
[3] DynamicEntityIDSystem   next=3   child=-1  off=6235     size=5544
[4] TypeDatabase_v2         next=4   child=-1  off=11779    size=143748
```

## The offset trap

Node offsets are into the **logical** file, which includes the uncompressed
header. Index into your decompressed blob as:

```
blobIndex = nodeOffset - firstChunkFileOffset
```

In the sample, `firstChunkFileOffset` is 6177 - which is also, not by
coincidence, the offset of the root `GameSessionDesc` node. That equality is the
cheapest sanity check you have: **if the first node's offset is not the first
chunk's file offset, you have parsed something wrong.**

The arithmetic closes exactly, which is the second check:

```
sum of decompressedSize over all 31 chunks     7,964,774
+ firstChunkFileOffset                             6,177
= logical size                                 7,970,951

last node (ModdingSystem)   offset 7,970,946  size 5
                            end    7,970,951   <- the same number
```

**So the overrun from skipping the correction is exactly
`firstChunkFileOffset`** - 6177 bytes here, and whatever the header happens to
be on another save. The failure is quiet because it only bites at the end: every
node except the last few still lands inside the buffer and decodes to plausible
content, so the parse looks correct right up to the point where it throws.

## What this does not tell you

- **The node payloads are not documented here.** Locating a node is solved; the
  bytes inside it are per-node and mostly still opaque. The appearance node is
  the exception - see
  [where appearance lives inside a save](/formats/appearance-in-a-save).
- **The 13 misc bytes at `0x0C` were not decoded.** Nothing here needs them.
- **One save, one patch.** The packed-VLQ node count, the `nextId`/`childId`
  reading and the `ENOD` footer were each confirmed against a single 2.31 save.
  The arithmetic is self-checking (the table consumed exactly to `length - 8`),
  but a second save on a different patch has not been parsed.

## Related

- [Where appearance lives inside a save](/formats/appearance-in-a-save)
- [The AppearanceChangeUnlocker preset format](/formats/acu-preset)
- [An inventory of somebody's install is personal data](/process/generated-output-is-personal-data) - what may be read out of a save and what must never be written down
