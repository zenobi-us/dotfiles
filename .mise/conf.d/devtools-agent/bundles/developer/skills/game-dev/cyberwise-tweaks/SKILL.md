---
name: cyberwise-tweaks
description: Author Cyberpunk 2077 mods that are code rather than assets - TweakXL/TweakDB records, CET Lua, and redscript that changes world state. Covers finding the real record ID rather than guessing it, what the CET console can and cannot do, reading the game's own shipped script dump for real signatures, and locating in-game text. Use when writing or repairing a .yaml tweak or a .reds script, running console commands, or hunting for an in-game string or record.
---

# Cyberwise: TweakDB and CET Lua

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> **Re-check after a patch:** Record IDs and the string blob move between versions - re-extract rather than reusing a noted ID.

Load `cyberwise` alongside this for the method rules.

**Check the patch version before reusing any noted record ID:**

```powershell
(Get-Item "$GameRoot\bin\x64\Cyberpunk2077.exe").VersionInfo.ProductVersion
```

A record ID noted under one patch is a lead, not a fact, on another. If the
installed version differs from the stamp above, re-extract rather than trusting
the note - which is the same rule as below, just with a reason to apply it.

## Never patch another author's file in place without a snapshot

Repairing someone else's `.yaml` is the most common mutating job in this topic,
and a mod update silently reverts it - so the patch has to be re-appliable and
the original has to survive. Use the front door's helper:

```powershell
. <path-to>\cyberwise\tools\ModFileBackup.ps1
Show-ModFileDiff   -Path $yaml -NewText $fixed          # get agreement on THIS
Set-ModFileContent -Path $yaml -NewText $fixed -Note 'fix <mod> <what>'
```

Then **write down what you changed and why**, somewhere outside the mod folder.
A hand-patch you cannot re-apply after an update is a fix with a short life and
no memory of itself.

**Better still, do not edit their file at all.** Ship the corrected file as its
own small mod at the same relative path and let load order decide - the original
stays untouched, their update cannot revert you, and removing the fix is one
toggle. Where the patched file goes differs per manager, and on MO2 the usual
"edit the deployed copy" advice is actively wrong: see *Fixing a bug in someone
else''s mod* in the `cyberwise` skill''s `environment.md`.

An override has its own failure mode worth stating to the user: it is **not**
reverted by an update, so a fix that has since been superseded keeps winning
silently. Re-check after the mod updates.

## Do not guess a record ID

The single biggest time sink here is inventing a plausible-looking TweakDB ID.
Extract the real one. `references/tweakdb-and-text.md` says when to do it and
what to check; the mechanism - the string blob TweakXL writes, why CDPR's naming
defeats every guess, and `$base` over a hand-written `$type` - is in the base
wiki at `/authoring/finding-the-real-record-id`.

## Reach for a record override before an edit

TweakXL resolves **per record, last one wins**, which makes it the only mod
layer here with a partial-override escape. A folder that sorts last redeclares
another author's record, needs no conflict rule, touches none of their files,
and survives their updates. Give it a retire condition -
`/authoring/tweakxl-records-are-last-wins`.

## The CET console is a sandbox

It cannot do everything the game can. `references/cet-lua.md` covers how to
deliver a probe; `/authoring/the-cet-console-is-a-sandbox` covers what actually
works from the console, what silently does nothing, and the dialect limits worth
knowing before writing a script that cannot work.

## Reference material

**These are now mostly pointers.** The knowledge they used to carry lives in the
**base wiki** - `wiki/` in the Cyberwise repo, described by `cyberwise-wiki` -
because a skill file is instructions and a wiki article is knowledge, and those
rot at different rates. Each reference keeps the part that changes what you
*do*, and names the article for the rest.

| file | covers |
|---|---|
| `references/tweakdb-and-text.md` | when to extract the ID list, when to prefer a `zzz_` override, which log to read, which language's text archive to search |
| `references/cet-lua.md` | delivering a probe as a file rather than a paste, and verifying a call exists before recommending it |
| `references/redscript.md` | establishing who owns the class before designing, measuring identifiers, and reporting "compiles" versus "works" honestly |

The base wiki's **`/authoring`** area holds the knowledge behind all three:
TweakXL resolution and the `zzz_` override, the YAML error that disables a whole
file, real record IDs, vendor stock and pricing, the CET sandbox, the shipped
script dump, addressing a world object, ArchiveXL node deletions, finding game
text, and why detection keyed to interaction text breaks when another mod owns
it. Read `/authoring/index` first.
