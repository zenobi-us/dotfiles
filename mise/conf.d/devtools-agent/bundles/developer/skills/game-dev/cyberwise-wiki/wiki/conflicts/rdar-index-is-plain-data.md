---
type: File Format
title: An .archive index is plain structured data - only the file bodies are compressed
description: The RDAR header and file table can be read with any binary reader, so "which mods collide" and "what is in this archive" need no WolvenKit. Resource names are FNV1a-64 over the raw ASCII depot path, and two numeric traps make a naive PowerShell implementation return a constant for every input.
tags: [archive, rdar, fnv1a, hashing, format, powershell]
status: stable
generated: { by: "claude", at: "2026-08-24T21:00:00-04:00" }
---

# An .archive index is plain structured data - only the file bodies are compressed

You do not need WolvenKit to answer "which mods collide" or "what does this
archive contain". The index is plain structured data; only the file *bodies* are
compressed.

```
header:  'RDAR' u32 | version u32 | indexPosition u64 | indexSize u32
at indexPosition:
         fileTableOffset u32 | fileTableSize u32 | crc u64
         fileEntryCount u32 | fileSegmentCount u32 | resourceDependencyCount u32   (28 bytes)
then fileEntryCount entries of 56 bytes each; the first 8 bytes are the name hash
```

File data is **Oodle-compressed**, so running `strings` over an archive returns
garbage. Only the index is readable this way - and the index is all a collision
scan ever needs, which is why that scan is
[cheap enough to run on every mod change](/conflicts/an-archive-that-contributes-nothing).

## Path hashing

Resource names are **FNV1a-64 over the raw ASCII depot path**, backslash
separated, exactly as written - no normalisation, no case folding beyond what is
already in the path:

```
h = 0xCBF29CE484222325
for each byte b:  h ^= b;  h *= 0x100000001B3
```

Implement it in a language with a **wrapping 64-bit multiply**.

## Two numeric traps that produced silently wrong answers

Both of these fail quietly rather than loudly, which is why they cost time.

- **PowerShell does not wrap on `UInt64` overflow.** It promotes to `double` and
  then fails the cast, so a naive FNV loop returns **the offset basis XORed once
  - a constant - for every input**. Every hash "matches" nothing, or everything,
  depending on which way the comparison runs. Use `BigInteger` with an explicit
  64-bit mask, or an inline C# helper via `Add-Type`.
- **A hex literal with the high bit set parses as a negative `Int64`**, so
  `[uint64]0x800008F5BA040F7E` throws at runtime. That is **half of all 64-bit
  hashes**, so the bug reproduces on roughly every other input and looks random.
  Use the explicit conversion instead:

```powershell
[Convert]::ToUInt64('800008F5BA040F7E', 16)
```

Upstream hash databases store these values **signed** for the same underlying
reason - SQLite has no unsigned 64-bit type - so converting on the way in and
back out is not optional when consuming one.

## Related

- [A hash you cannot name is still a conflict](/conflicts/resolving-a-hash-to-a-path)
