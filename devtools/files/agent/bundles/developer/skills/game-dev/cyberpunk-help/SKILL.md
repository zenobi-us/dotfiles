---
name: cyberpunk-help
description: >
  Help with a Cyberpunk 2077 playthrough on Windows, Linux, or macOS (Vortex or
  manual mods): missions, Night City locations, save state, and CET console
  commands. On first use in a conversation (or when the deploy list changes /
  the user says they added mods), discover the local install by signature files,
  read OS + today's date, then check Nexus for newer files and relevant comments.
  Never freeze a mod list, save path, or CET cheat-sheet in this skill.
  Use when the user asks about CP2077 quests, map places, "dónde está", Afterlife,
  Nocturne, journal, CET, Cyber Engine Tweaks, or runs /cyberpunk-help.
---

# Cyberpunk 2077 playthrough help

Works on Windows, Linux (Steam/Proton, Flatpak, Heroic), and macOS. Mods may be Vortex or manual. This skill is **quests / map / CET lookup / this playthrough**. Compatibility and Nexus *candidates* belong in **`vortex-mods`** if that skill exists.

Do **not** hardcode game or save locations in replies or in this file. Every machine is different. **Find** the install via signature files (script below).

## When to refresh local inventory + Nexus

Full pass if **any** of:

- First `cyberpunk-help` use in this conversation
- User says they installed, removed, updated, or enabled mods
- Script `inventoryChanged` is true, or added/removed lists are non-empty
- User asks to recheck updates

Otherwise reuse inventory from this conversation. Do not hit Nexus on every follow-up.

Never paste the full mod table into `SKILL.md` or every chat reply.

## Session bootstrap

Canonical (Python 3, stdlib only):

```bash
python3 "$HOME/.grok/skills/cyberpunk-help/scripts/get_cp2077_help_context.py"
```

Windows (finds `python` / `python3`):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.grok\skills\cyberpunk-help\scripts\Get-Cp2077HelpContext.ps1"
```

If the skill was installed via `npx skills add`, run the `scripts/` copy next to this `SKILL.md` (resolve the skill directory; do not assume a username).

The script **searches** for:

- `Cyberpunk2077.exe` (game root = `bin/x64/` parent)
- `vortex.deployment.json` beside that root
- save folders: `metadata.9.json` **and** `sav.dat` whose JSON looks like a CP2077 save
- CET log by filename under the game tree

It seeds from Steam `libraryfolders.vdf` if present, the home directory, and mounted drives — then follows what it finds. If discovery fails, search the same signatures yourself; **ask the user** only if nothing turns up.

Read from the JSON (do not guess):

- **Today** — `localDate`, day/month/year (machine local)
- **OS** — `osCaption`, `osVersion`, `osBuild`
- **Game + CET** — `gamePatchFromSave`, `gameVersionFromCet`, `cetVersionFromLog` (log wins if it disagrees with a Vortex folder name)
- **Playthrough** — `trackedQuestEntry`, `playerPosition`, `latestSave`
- **Mods** — `deployedMods` (Vortex folder parse: name, Nexus id, version). Skip entries with no `NexusId` when talking to Nexus. If Vortex is absent, the script lists loose files under the game tree without pretending they have Nexus versions.

### Nexus (only on bootstrap / change)

`https://www.nexusmods.com/cyberpunk2077/mods/<NexusId>`

Compare installed `Version` to the current main file as of `localDate`. Open **description / posts / comments** only when it changes the answer (newer file, broken-on-this-patch notes, or the question is CET / stuck quest / a feature that mod could alter).

If a lookup fails (Cloudflare, login), keep the local version; do not invent a “latest”.

**User-facing bootstrap:** one line — date, OS, patch, CET, deployed count — plus only mods that are outdated, newly added, or relevant to *this* question. Full dump only if they ask what is installed.

## Label the source

- **save** — `metadata.9.json` / `screenshot.png`
- **live CET** — console output the user pasted
- **wiki** — fandom / redmodding / walkthrough
- **install** — Vortex deployment / CET log / loose game files
- **nexus** — description/posts as of `localDate`

Wiki is not the user's journal. Resolve `LocKey#…` before treating it as a title.

Read-only on saves: metadata + screenshot. Do not write `sav.dat` or quest facts.

Quest path → title: https://wiki.redmodding.org/cyberpunk-2077-modding/for-mod-creators-theory/references-lists-and-overviews/reference-quest-ids.md (`?ask=` on GitBook `.md` URLs).

## CET: look up, do not freeze a list

APIs change with **this** `buildPatch` + **this** CET. After bootstrap:

1. https://wiki.redmodding.org/cyber-engine-tweaks/console/console/how-do-i.md
2. https://wiki.redmodding.org/cyber-engine-tweaks/teleportation-locations.md
3. https://wiki.redmodding.org/cyber-engine-tweaks/llms.txt
4. Thin page → `GET {url}.md?ask=...&goal=...`
5. Use the **2.x spreadsheet** from “Useful commands” when `buildPatch` is 2.x+, not the 1.x sheet.

Case-sensitive. Prefer `Game.GetPlayer():…` on 2.x+. One or few paste-ready lines for *this* request, tagged with CET + patch. If it fails, re-fetch wiki; do not invent.

Default **inspect only**. Mutate (teleport, inventory, level, `SetFactStr`, force-complete journal) only if the user clearly asked. Teleport: print current position first. Do not use facts as quest repair unless they accept brick risk.

Overlay needs a bound hotkey; exclusive fullscreen often breaks it.

## How to answer

**Where is X?** Wiki / teleport list (fetch). If save or pasted CET has `x,y,z`, give delta (Z up). No made-up compass.

**Playthrough / quest?** Latest save + quest-id wiki. Walkthrough = **wiki**. Mention deployed mods that change quests/companions/journal when the inventory has them.

**CET command?** Look up against current wiki + this CET. Extra commands from a deployed CET *mod* come from inventory, not vanilla CET.

## Limits

- Never deploy / enable / disable / delete Vortex mods from here.
- No trainer or item dumps unless explicitly requested.
- No custom CET telemetry mods, no holocall, no Prime Agent.

## Reply shape

1. Bootstrap line (date, OS, patch, CET, count; updates only if this was a refresh).
2. Answer tagged **save / live CET / wiki / install / nexus**.
3. CET: Lua to paste, then ask for console output if live state is needed.
