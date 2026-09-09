---
type: Environment
title: Two downloads from one mod page may not be alternatives
description: Files labelled like variants are often not mutually exclusive, and when two builds of the same filename contend, byte size is the only thing that identifies which one is deployed.
tags: [downloads, variants, conflicts, deployment, verification]
status: stable
generated: { by: "claude", at: "2026-08-24T18:30:00-04:00" }
---

# Two downloads from one mod page may not be alternatives

Do not assume that files labelled like variants are mutually exclusive. Compare
their **contents and file counts** first.

A real case: one download was the full package - 23 files, a script plus 20 tweak
files and an archive - while the "alternative" was 2 files, a manifest and a
*different build* of the same script. Disabling the first to use the second
silently dropped 20 tweaks and an archive that nothing else supplied.

The correct setup was to install **both**, and decide explicitly which copy of
the shared script survived: a conflict rule in Vortex, mod priority in MO2, or,
installing by hand, keeping only the intended copy of the contested file.

## File size is the identity tell

When two builds of the same filename contend, they have the same name, the same
path, and often the same timestamp. **Byte size is usually the only way to tell
which one is deployed.**

```powershell
(Get-Item "$GameRoot\<contested file>").Length
```

Record the byte count of the copy that should win, once. A redeploy that
silently flips the winner then becomes a one-command check instead of an
invisible behaviour change.

This matters most for the files nothing warns you about: **a script that changes
behaviour reports no error when the other build wins - it just behaves
differently.**

## The mirror image: shared records are not duplication

The opposite inference fails just as often. Several mods writing to the same
records are frequently a modular suite rather than a fight, because the tweak
layer resolves field by field - so **compare the fields each mod writes, not the
records it targets**, before recommending that anybody uninstall one:
[a TweakXL record is resolved last-wins](/authoring/tweakxl-records-are-last-wins).

## Related

- [What the game directory shows you depends on how the mods got there](/install/how-the-install-is-assembled)
- [There are two load-order systems](/engine/two-load-order-domains)
- [A TweakXL record is resolved last-wins, and that is the lever for everything else](/authoring/tweakxl-records-are-last-wins) - the resolution rule behind the section above
