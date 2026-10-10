---
type: File Format
title: A serialized RED4 file survives a targeted regex, not a JSON round-trip
description: ConvertFrom-Json piped back through ConvertTo-Json mangles typed RED4 structures. Values usually appear twice - once in components, again in the compiled buffer - so a single-occurrence edit is normally a bug, and emptying an array of handle references produces a file that no longer converts at all.
tags: [wolvenkit, json, serialization, authoring, archive]
status: stable
generated: { by: "claude", at: "2026-08-24T21:00:00-04:00" }
---

# A serialized RED4 file survives a targeted regex, not a JSON round-trip

Converting an `.app`, `.ent` or `.effect` to JSON, editing it, and converting it
back is the standard way to change another mod's content without touching binary
data. Four things about that JSON are not what a JSON tool assumes.

## Edit by targeted regex on the raw text

`ConvertFrom-Json` piped back through `ConvertTo-Json` **mangles typed RED4
structures**. Reading via `ConvertFrom-Json` to inspect a file is fine; writing
through it is not. Edit the raw text.

## Values usually appear twice

Once in `components`, and again in the compiled buffer. **A global replace is
normally correct; a single-occurrence edit is normally a bug** - and the bug
presents as "the change did nothing" or "the change half-worked", not as an
error.

## Do not empty an array holding handle references

Emptying an `effectDescs` array left dangling handles, and the file would no
longer convert at all. Change a flag instead of removing the entry.

## `HandleId` values must be unique across the whole file

Cloning a block without renumbering its handles produces a file that **converts
successfully and then behaves oddly** - the worst failure shape available,
because the round-trip reports success.

## Round-trip mechanics worth knowing before you start

- The WolvenKit **CLI is a separate download from the GUI**. A GUI install has
  no CLI.
- Pattern matching in extraction is against the **full depot path**, not just
  the filename.
- Copy the source archive to a **short, apostrophe-free path** first; both long
  paths and apostrophes misbehave.
- **Enable Windows long-path support** - packing requires it.
- Delete the `.json` files before packing, or they ship inside the archive.
- Old files from pre-2.0-era mods may fail to serialize outright. That is a
  **converter limitation, not a corrupt archive** - do not conclude the mod is
  damaged.
- Serializing writes into an output directory that **must already exist**.

## Related

- [An .archive index is plain structured data](/conflicts/rdar-index-is-plain-data) - none of the above is needed for collision work
- [Scaling a placed prop is four separate edits](/conflicts/scaling-a-placed-prop)
