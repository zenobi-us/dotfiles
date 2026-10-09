# Diagnosing a broken install

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> **Re-check after a patch:** Log paths move when RED4ext, ArchiveXL, TweakXL or CET update. Verify each path exists before concluding a log is empty rather than relocated - or simply absent because that framework was never installed here.

**The knowledge that used to live here is now in the base wiki**, which ships
with the skill. This file keeps only what changes what you *do*.

| what you need | article |
|---|---|
| which of the seven logs carries a given symptom, and why an absent log is usually an absent framework | `/diagnosis/which-log-carries-which-symptom` |
| the failure shapes, and locating a visual symptom before theorising about it | `/diagnosis/which-log-carries-which-symptom` |
| things that look like mod bugs and are not - quest facts, vendor stock, input maps, cyberware | `/diagnosis/which-log-carries-which-symptom` |

## In what order to do it

1. **Establish the game root first**, and join every log path to it. Every path
   in the article above is relative to the folder containing
   `bin\x64\Cyberpunk2077.exe`, and that differs per storefront and per drive.
   Ask if it is not obvious; never assume a library path.
2. **Work out which frameworks are present before reading meaning into an absent
   log.** `tools/New-InstallSnapshot.ps1` records framework versions, and
   `cyberwise/tools/Test-InstallReady.ps1` reports what is missing.
3. **Read the ArchiveXL log after every `.xl` change**, not only when something
   looks wrong. A single malformed entry reverts the whole file and presents as
   total mod failure.
4. **Ask where the camera was** before proposing a cause for anything visual.
   World rendering, reflections and the character creator have disjoint suspect
   lists.

## Bisecting responsibly

- Reproduce the fault at least twice before halving anything.
- Change one variable per test and write down what you changed.
- Prefer disabling *groups* by function (all appearance mods, all quest mods)
  over alphabetical halves - related mods fail together.
- When a suspect is found, confirm by **re-enabling it alone** against the full
  load order, never by the absence of the fault.
- On a short mod list, do not halve anything - start from what changed most
  recently.

Full method and how it scales: `bisecting.md`, and
`/diagnosis/sizing-a-bisect-to-the-list`.

## ArchiveXL `nodeDeletions`

Authoring knowledge rather than diagnosis, and it now lives in the base wiki at
`/authoring/archivexl-node-deletions` - the `debugName` that lies about `$type`,
why one bad entry reverts every deletion in the file, and using a companion `.xl`
to remove props from another mod's sector without repacking their archive.
