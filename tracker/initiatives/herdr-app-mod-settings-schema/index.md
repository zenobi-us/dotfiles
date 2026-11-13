---
schema: tracker-initiative/v1
id: herdr-app-mod-settings-schema
title: "herdr-app feature request: mods declare a settings schema shown in Settings"
---

# herdr-app feature request: mods declare a settings schema shown in Settings

Status: `viable`. Submitted as herdrdev/herdr-app#987.

## Repository examined

- Repository: `https://github.com/herdrdev/herdr-app`
- Revision: `ce0fd1b245a7fdaa4e6c9e3c7ddac23ddbb1e799` (master, 2026-11-13)
- Clone: `/tmp/herdrdev-herdr-app.mYgxci/repository` (temporary, read-only)

## Original idea

- Mods define a settings schema, with a storage schema version: `herdrVersion`, `modConfigSchemaVersion`.
- herdr-app maps data types to herdr-app-owned settings widgets, so a schema entry such as `{ kind: 'string', widget: 'combo', choices: ['a','b','c'] }` renders a combo box. Modelled on Obsidian.

## Clarified answers (Q, 2026-11-13)

| Question | Answer |
|---|---|
| Declarative schema or imperative (Obsidian `PluginSettingTab`)? | Declarative schema. herdr renders the widgets. |
| Where are values stored? | Per-mod file, for example `data/<mod>/settings.json` holding `{ herdrVersion, modConfigSchemaVersion, values }`. Not `settings.json`. |
| Who migrates values when `modConfigSchemaVersion` changes? | The mod. herdr records versions and hands the stored version to the mod. |
| Which version is `herdrVersion`? | herdr-app or herdr-core; Q unsure. Resolved as herdr-app: mods, the mod API and Settings are in the app. In `mod.json`: lowest herdr-app that understands the schema. In the stored file: herdr-app that wrote it. |

Note: Obsidian is imperative (`new Setting(el).addDropdown(...)`, `loadData()`/`saveData()` to `data.json`, `minAppVersion` in `manifest.json`). The declarative part is closer to VS Code `contributes.configuration`. The request cites Obsidian for per-plugin storage, the version gate and the widget set only.

## Outcome and scope

- Users: mod authors and the people who install their mods.
- Problem: a mod has no place in the Settings window. Each mod builds its own settings overlay, its own widgets and its own storage.
- Smallest useful behaviour: Settings shows one section per mod that declares a schema. Each field renders with an app-owned widget. A change writes the mod's settings file at once, like the rest of Settings. The mod reads values and gets a re-render on change.
- Out of scope: mod-supplied UI code inside Settings; a `custom` widget; herdr-side migration; per-space settings (#513).

## Repository rules and channel

| File | State | Rule that applies |
|---|---|---|
| `CONTRIBUTING.md` | read | Open issues for "things a mod cannot do yet (a missing API, an event, a setting)". Requests a mod can already do get closed. |
| `AGENTS.md` | read | App core stays small. Before core growth answer three questions, then the maintainer (Can, `ogulcancelik`) decides. `defaults/AGENTS.md` must change with any new mod feature or file. |
| `.github/ISSUE_TEMPLATE/config.yml` | read | Blank issues disabled. |
| `.github/ISSUE_TEMPLATE/mod-api.yml` | read | Template "A mod can't do this yet": fields "What did you try to build?" and "What is missing?". |
| `.github/ISSUE_TEMPLATE/bug.yml` | not applicable | Bug reports. |
| `SECURITY.md` | not applicable | No security aspect. |

Channel: GitHub issue with the `mod-api.yml` template.

## Research record

| Surface | Search | Result |
|---|---|---|
| Source | `defaults/frame/settings/main.js` | inspected. Settings is an app-owned JS frame mod. `SECTIONS` is a fixed array (look, keyboard, machines, alerts, updates, privacy). It writes `settings.json` with `writeTextFile(path, text, expected)`. |
| Source | `src/mods.rs` `struct Hint` (line 338) | inspected. `mod.json` holds only `place`, `size`, `focusable`. No settings or version field. |
| Docs | `defaults/AGENTS.md` lines 75-91, 845-870, 1085-1101 | inspected. Mod state: `shared(key)`/`setShared`, `localStorage` per copy, `data/`, `fs/promises` write under `~/.config/herdr-app`. `frame/` is rewritten on every start. |
| API types | `defaults/herdr.d.ts` | inspected. `settings()` returns `settings.json`. No `mods()` listing and no per-mod settings API. |
| Tests | `cargo test` checks `defaults/AGENTS.md` names every `settings.json` key | inspected via `AGENTS.md`. A per-mod file avoids new `settings.json` keys. |
| Issues | title list of all issues; keyword searches | inspected. No duplicate. Related: #888, #520, #289, #385 (closed: mod commands in palette). |
| Upstream | Obsidian plugin API | from prior knowledge, not re-fetched. |

## Feasibility

- Functional: possible. The Settings window is a JS mod, so a schema-driven section is JS work plus two host pieces: a way for Settings to list mods with their schema, and a read/subscribe API for the mod. Evidence: `defaults/frame/settings/main.js` lines 9-16.
- Technical: new `mod.json` field (`settings`), Rust parse in `Hint` or a sibling struct, one host API (for example `modSettings()`), a per-mod file under `data/`, `defaults/AGENTS.md` and `herdr.d.ts` updates. Risks: write conflicts (reuse the `expected` check that Settings already uses), schema validation in `herdr-app check`.
- Political: the three core-growth questions. (1) The app acts on it: it renders and writes it in its own window. (2) Only the app can see it: `frame/` is rewritten on start, so no mod can add a section. (3) Mods cannot do it correctly: each mod can only build its own overlay. Inference: it passes, but Can decides.

## Existing capability

Classification: possible with compromise.

| Level | Approach | Note |
|---|---|---|
| Exact fit | Declarative schema in `mod.json`, Settings renders app-owned widgets, per-mod versioned file, mod migrates | The request. |
| Small compromise | Same, without the version fields | Loses safe upgrades. Rejected by Q. |
| Major compromise | Each mod opens its own settings overlay with `mod.open` and stores in `localStorage` or `data/` | Works today. Not in Settings, no shared widgets, `localStorage` is per copy. |
| Major compromise | Imperative, Obsidian-style hosted view | Mod code runs in the app-owned frame. Rejected by Q. |
| Not a match | Clone the `settings` frame | `frame/` is rewritten on every start. |

## Viability gate

| Condition | Result |
|---|---|
| Clear outcome | pass |
| No existing capability solves it | pass (only the overlay workaround) |
| Fits vision, credible path | pass, pending maintainer decision on core growth |
| Compromises approved by user | pass (Q answers above) |
| Policy permits the request type | pass (`CONTRIBUTING.md`: a missing API or setting) |
| Focused request possible | pass |

Recommendation: submit with `mod-api.yml`. Confidence: medium. The maintainer's core-growth bar is the main risk.

## Submission

Submitted 2026-11-13 with `gh issue create --repo herdrdev/herdr-app`: https://github.com/herdrdev/herdr-app/issues/987

## Tickets

## Comments
