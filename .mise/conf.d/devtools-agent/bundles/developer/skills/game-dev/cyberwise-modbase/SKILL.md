---
name: cyberwise-modbase
description: Build and maintain a per-user knowledge base covering every mod actually deployed on this install - the inventory that comes from the deployment manifest rather than a manager's list, how to derive a Nexus id without guessing one, and the order to document them in. Use when asked what a mod does, when auditing a large load order, or when starting a documentation pass.
---

# Cyberwise: the mod base

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026

Load `cyberwise` for the method rules and `cyberwise-wiki` for the article
format. Everything this skill produces goes in the **user** bundle and **never
ships** - see the boundary in `cyberwise-wiki`.

## Start from what is deployed, never from a list

```powershell
tools\Get-ModInventory.ps1 -GameRoot '<path>' -OutFile inventory.json
```

This reads `<GameRoot>\vortex.deployment.json`, which stamps every deployed file
with the staging mod that put it there. That matters for two reasons:

- **Staged is not deployed.** A manager's list holds disabled mods on purpose,
  and naming one in a report discredits every other name in it.
- **Nothing on disk says who owns a file.** `archive\pc\mod` is a flat pile of
  archives. The manifest is the only mapping back to an owner, and without it
  "which mod put this here" is unanswerable.

On the reference install this yields **812 deployed mods from 8,699 files**.

## Nexus ids are DERIVED, and a derived id can be wrong

Vortex names staging folders after the download, in one of two shapes:

```
Immersive Bullet Holes-15309-2k-1718581479        Name-<id>-<version>-<unix stamp>
0-Engine Pure CET 27967 0.18.6 2026-06-29T14-25Z  Name <id> <version> <ISO date>
```

The inventory reports the id **with the pattern that produced it**, so a reader
can judge the claim. 801 of 812 resolve; the other 11 have no id at all, because
a mod installed from a local zip or built by hand never had one.

**Verify a sample against the API before building anything on top of the ids.**
An id derived wrong does not fail - it silently points every later lookup at a
different author's mod page, and the article that results is confidently about
the wrong software. The API key lives in Proton Pass and the agent session
expires; when it does, this whole avenue is blocked and the local sources below
are the fallback, not a lesser option.

## The local sources outrank the mod page

A description is what the author says it does. These are what it does:

| question | read |
|---|---|
| what settings exist, and their defaults | `r6\scripts\<mod>\Config.reds`, `@runtimeProperty("ModSettings.*")` |
| what the user actually set | `red4ext\plugins\mod_settings\user.ini` |
| what records it adds or changes | `r6\tweaks\**\*.yaml` |
| what it hooks | `@wrapMethod` / `@replaceMethod` / `@addField` in its `.reds` |
| what it registers | `registerHotkey` / `registerForEvent` in its CET `init.lua` |
| what files it contests | `cyberwise-conflicts` |

A settings table built from `Config.reds` defaults plus `user.ini` overrides is
checkable and dated. One built from a mod page is a paraphrase of marketing.

## Order to document in

Depth is not free, so spend it where it is repaid:

1. **Frameworks** - anything other mods depend on. Wrong here poisons everything.
2. **Settings-bearing mods** - a `Config.reds` or a Mod Settings category means
   there are decisions to record, and decisions are what a user comes back for.
3. **Mods already implicated in a finding** - the investigation is already done.
4. **Mods that hook shared systems** - loot, inventory, vendors, status effects,
   save/load. These are where interactions come from.
5. **Everything else** - name, layer, files, id. A stub that says where a mod
   lives is worth having; a stub that guesses what it does is not.

Track coverage in the bundle's own `log.md` and an `index.md` per directory.
**Never let the index claim an article that is a stub** - a listing that
overstates coverage is how a documentation pass quietly stops being trusted.

## Tools

| tool | what it does |
|---|---|
| `tools/Get-ModInventory.ps1` | every deployed mod, its layers, its files, and its derived Nexus id with the pattern that produced it |
| `tools/New-ModStubs.ps1` | one OKF article per deployed mod in the USER bundle, recording only what is true from disk |
