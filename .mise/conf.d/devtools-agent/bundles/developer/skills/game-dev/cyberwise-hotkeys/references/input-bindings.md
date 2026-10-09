# Input bindings

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> **Re-check after a patch:** Confirm `r6\cache\inputUserMappings.xml` is still regenerated at launch, and that CET's `bindings.json` still packs virtual-key codes at bits 48-55. Both are internal formats with no compatibility promise.

**The knowledge that used to live here is now in the base wiki**, at
`skills/cyberwise-wiki/wiki/input/`. It was reference material, not instructions,
and the two rot at different rates. What is left here is the procedure for
*generating* a sheet, which is this skill's own job.

| you want | read |
|---|---|
| the five stores, their formats, `overridableUI` precedence, `buttonGroup` indirection, ids that are not keys, per-mod CET json conventions | `/input/five-binding-stores` |
| why a key a mod made you press can exist only in the base game's own file, and what that does to a report that hides vanilla rows | `/input/a-mod-can-repurpose-a-vanilla-mapping` |
| a programmable mouse is a LAYER, the three-way join, and the dead button only the join finds | `/input/a-peripheral-profile-is-a-layer` |
| `IK_Period` / `Period` / `.` / `PeriodAndBiggerThan` are one key, and comparing two of them finds nothing | `/input/one-key-four-spellings` |
| a store that silently zeroed every binding, the bound-to-total health signal, and the wrong inference it prevents | `/input/a-binding-store-can-empty-itself` |
| CET's packed VK codes, `0` for unbound, the VK 255 chord, `-AsHashtable` | `/input/packed-key-codes` |
| why input contexts make terrible categories, and why a shared key is usually fine | `/input/input-contexts-are-not-categories` |

The one line to carry out of all of it:

> **A binding you cannot find is not evidence the key is free.**

## Tools

- `tools/Get-Hotkeys.ps1` - harvests all five stores, resolves groups, applies
  overrides, returns objects. `-IncludeBaseGame` adds the game's own claims;
  `-CheckKey` folds every spelling and asks all of them, including the base game.
- `tools/KeyIdentity.ps1` - the single key-identity fold every store's reader
  passes through. Dot-source it rather than writing a second table.
- `tools/Get-MouseProfile.ps1` - reads a Corsair iCUE 5 profile so its buttons can
  be joined to the bindings. Separate from the harvest on purpose: a mouse action
  is not a binding.
- `tools/New-HotkeySheet.ps1` - renders a self-contained HTML cheatsheet, merging
  an optional notes json for hardware maps and tap/hold semantics. `-Hide`
  carries the entries the owner has taken off the sheet; it is **authoritative**,
  so it both rewrites `sheet-preferences.md` in the user's wiki bundle and omits
  what it names, and `-Hide @()` puts everything back.
- `cyberwise-reports/tools/Measure-PageFit.ps1` - renders a page headless at a
  given viewport and reports document height, viewport height, and the class of
  anything overflowing horizontally.

**Pass `-GameRoot` and the viewport explicitly.** The scripts carry defaults so
they can be run without arguments, and a default game path or window size is
whatever machine the script was last used on. Supply the real ones.

## Measure a layout, do not eyeball it

A cheatsheet is only glanceable if it fits on one screen - **the screen it will be
read on, which is the user's, not the one any default assumes.** Ask for the
resolution and scaling, or derive it (`[System.Windows.Forms.Screen]::AllScreens`
plus the `LogPixels` registry value for DPI), and pass it explicitly; a page tuned
for an ultrawide overflows a laptop, and every viewport baked into a script is
someone else's monitor.

Then measure rather than judge, because "looks too tall" is not a number you can
act on. Several rounds of tuning were wasted guessing a viewport from downscaled
screenshots before measuring it directly; the fixes took one pass afterwards.

Two failures that a screenshot hides completely:

- **An element pushed clean off the page.** A long inline label with
  `white-space:nowrap` forced its row wider than the container and shoved the
  keycap past the right edge. Not clipped, not squeezed - absent. Only the
  overflow probe named it.
- **A page that "fits" because the browser default was used.** In PowerShell,
  `--window-size=$W,$H` unquoted is parsed as an **array**, so two separate
  arguments reach the browser, the flag is ignored, and it silently renders at
  800x600. The first measurement claimed a 754px viewport. Quote it.

When testing a page that restores its own state on load, do not inject that
state into the markup - a class forced onto `<body>` is stripped by the page's
own restore logic before anything is measured, and the result looks like a
feature that does nothing. Drive the real control instead:

```powershell
(Get-Content $f -Raw) -replace '(?i)</body>',
  '<script>document.getElementById("modtoggle").click();</script></body>'
```

**Every toggle state has to be measured, not just the default one** - hide mode,
the greyed-out state inside it, the sheet with things hidden, and the hidden-list
lightbox are four different layouts, and only one of them is what the generator
wrote.

Two things that make those measurements lie, both hit while building hide mode:

- **`localStorage` is shared across the copies.** Every state file is written to
  the same folder, they are all `file://`, and the state that hid four rows leaks
  into the next screenshot - which then looks correct for the wrong reason. Clear
  it **in `<head>`**, before the page's own script reads it; clearing after only
  clears the store, not the variable the page already built from it.
- **`DocHeight == ViewHeight` says nothing.** `scrollHeight` has the viewport as
  its floor, so five states all reporting 1554 against a 1647px window means only
  "all shorter than that". Re-run each against `-Height 400` for the real content
  height, which is the number that shows whether a state actually grew.
