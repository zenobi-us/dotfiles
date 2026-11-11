---
name: creating-herdr-app-mods
description: Creates and edits Herdr-app mods and their layout integration. Use for personal mods, linked mod directories, or stale edits; produces a checked mod with its changes verified in the running window.
---

# Creating Herdr-app mods

For agents creating or editing mods. Refresh the layout before judging a saved edit.

## Workflow

1. Read `herdr-app --skill`, the installed app-home guide, and the relevant generated `.d.ts` files. Resolve the home from `HERDR_APP_HOME`, then `XDG_CONFIG_HOME/herdr-app`, otherwise `~/.config/herdr-app`.
2. Inspect `herdr-app status` and `herdr-app commands`. Record the original layout and identify another existing layout for the refresh round-trip.
3. Create a personal `mods/<name>/main.js`, with optional `mod.json` and relative imports. Clone shipped mods/layouts before editing. For source kept elsewhere, symlink the whole mod directory into the app home's `mods/`. Use copies when manifests must stay machine-local; individual frontend file symlinks can break relative imports. Use theme colours and current installed APIs.
4. After each code-edit batch, run `herdr-app check <app-home>/mods/<name>`. Fix failures before proceeding.
5. You MUST switch away from the edited mod's layout and back, even when `check` passes and `status` has no errors. Linked source edits can remain stale until this round-trip. Use existing layout names; do not restart the app or its core.
6. Inspect `herdr-app status`, capture `herdr-app shot /tmp/herdr-mod.png`, and open the image. Finish only when the changed text, style, or behaviour is visible and no new errors remain. A passing check alone does not prove the running copy updated.
7. Restore the original layout unless the user requested another. For temporary mods, remove their layout blocks before removing their symlinks and source files.

## Refresh example

When the edited layout is `cli` and `shared-context` also exists:

```sh
herdr-app do layout.switch --name shared-context
herdr-app do layout.switch --name cli
herdr-app status
herdr-app shot /tmp/herdr-mod.png
```

If the intended layout is not currently shown, show it before this round-trip. Preserve the user's terminals and unrelated layout edits.

Linked-directory loading and relative imports work; automatic reload of external target edits is tracked in [herdr-app #887](https://github.com/herdrdev/herdr-app/issues/887). Recheck the installed version before assuming this limitation changed.
