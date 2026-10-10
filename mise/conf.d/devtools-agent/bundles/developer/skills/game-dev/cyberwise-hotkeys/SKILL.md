---
name: cyberwise-hotkeys
description: Find what every key is actually bound to on a modded Cyberpunk 2077 install, across the five separate stores that hold bindings, and generate a hotkey cheatsheet from what is really on disk. Also reads a Corsair iCUE mouse profile and joins each thumb button to the keystroke it sends and the binding that keystroke actually has. Use when asked what a key or a mouse button does, whether a key is free, how to rebind something, why a mouse button does nothing in game, or for a keybind reference or cheatsheet.
---

# Cyberwise: input bindings

> **Verified:** Cyberpunk 2077 patch 2.31 - August 2026
> **Re-check after a patch:** Confirm the merged input cache is still regenerated at launch, and that CET still packs virtual-key codes at bits 48-55. Both are internal formats with no compatibility promise.

Load `cyberwise` alongside this for the method rules - in particular **never
quote a mod's shipped defaults as the user's configuration**, of which this whole
topic is the worst case.

`Get-Hotkeys.ps1` reads all five stores in the right precedence, so use it rather
than transcribing by hand. If you are decoding a packed CET value yourself, check
the patch first - the bit layout is an internal format:

```powershell
(Get-Item "$GameRoot\bin\x64\Cyberpunk2077.exe").VersionInfo.ProductVersion
```


## The CET overlay will not open

Five hours, once. It is a checklist now. Work it in this order - each step rules
out a layer, and the cheap ones come first.

**1. Is anything else attached?**

```powershell
tools\Get-Hotkeys.ps1 -Devices
```

More than one physical keyboard is the finding. See the front-door skill for why
a keyboard that is switched off still counts.

**2. Is the key free, and is the binding a single key or a chord?**

```powershell
tools\Get-Hotkeys.ps1 -CheckKey Delete
```

Then decode what CET actually stored. `bindings.json` packs a chord into four
16-bit slots, most significant first:

```powershell
$v = (Get-Content '<game>ind\plugins\cyber_engine_tweaksindings.json' -Raw |
      ConvertFrom-Json -AsHashtable).cet.overlay_key
0..3 | ForEach-Object { [math]::Floor($v / [math]::Pow(2, 48 - 16*$_)) % 65536 }
```

`46, 0, 0, 0` is Delete alone. **`255, 46, 0, 0` is the failure**: VK 255 is HID
filler, and a stored chord never matches a plain keypress. Use `-AsHashtable` -
`bindings.json` has keys differing only in case and `ConvertFrom-Json` throws
without it.

**3. Did CET's render layer ever start?**

```powershell
Select-String '<game>ind\plugins\cyber_engine_tweaks\cyber_engine_tweaks.log' -Pattern 'D3D12::Initialize'
```

A working session logs `D3D12::Initialize() - initialization successful!` about a
minute after the hooks complete. **No line means the overlay has nowhere to
draw** - the key is fine and nothing will ever appear. Wait the full minute
before concluding it is absent: the line is written late, and reading too early
produces a confident wrong answer.

**4. Does CET receive input at all?** A CET mod with `registerInput` and a
heartbeat, bound by editing `bindings.json` directly, answers this without the
overlay. Log every press AND a periodic "still alive" line - otherwise silence
cannot be told from a mod that never loaded.

**5. Only then, the software.** CET's four state files (`bindings.json`,
`config.json`, `persistent.json`, `layout.ini`) are written by CET, not the mod
manager, so they survive a purge and a reinstall. Moving them aside and letting
CET regenerate is the whole configuration surface in one launch.

### What this checklist is not for

Do not end it with a workaround. If the overlay is broken, CET is not the thing
to stop using - it works for everyone else. Find the cause.


## Never hand-transcribe a keybind. There are five stores.

They disagree on format, and only one of them holds what the player actually
pressed last:

| store | holds |
|---|---|
| `r6\input\*.xml` | per-mod **defaults** plus an `overridableUI` id |
| `r6\cache\inputUserMappings.xml` | the merged output; the only place `buttonGroup` ids resolve |
| `red4ext\plugins\mod_settings\user.ini` | the user's **actual** rebinds. **Wins.** |
| `cyber_engine_tweaks\bindings.json` | CET hotkeys, as packed VK codes |
| `cyber_engine_tweaks\mods\<mod>\**\*.json` | CET mods keeping their **own** config |

**The fifth is the trap.** Nothing obliges a CET mod to use CET's registry, so a
key can be live in game and absent from all four other stores. On one install
that was three mods out of roughly 150 - and one of them was a night-vision
toggle sitting on top of two other bindings, invisible to every generated sheet.

> **A binding you cannot find is not evidence the key is free.**

`user.ini` is applied at runtime, so it is **not** reflected in the merged cache.
Read the cache alone and you get the mod author's defaults and learn nothing
about what the user changed.

**The game's own claims are a sixth file** - `r6\config\inputUserMappings.xml`.
It is left out of a mods report by default because ~99 identical vanilla rows
swamp it. **That gate now governs DISPLAY only.** It used to govern knowledge
too, and the consequence shipped: with the switch off nothing in the harvested
set claimed `IK_MiddleMouse`, so a mouse button sending Middle Mouse was printed
as *"nothing binds this key - does nothing in game"*, in red, on a sheet whose
owner had labelled that button "Use Gadget". The game binds it to `combatGadget`
out of the box. The sheet was not unhelpful; it was asserting something false in
the style it reserves for findings.

`New-HotkeySheet.ps1` therefore always harvests the vanilla mappings and then
splits them: one set answers *is this key claimed by anything*, the other is
filtered for display. A button whose key only the base game claims is shown with
what the game does with it, attributed to the base game, and is never marked
dead. **If you add another "is this key bound?" question anywhere, ask it of the
full set, not the displayed one.**
There is a sharper reason to keep it reachable: **a mod can change what a vanilla
mapping does without registering a key of its own**, so the key somebody presses
*because of a mod* can appear only there. Free-look leaning and consumable /
grenade cycling ride `LeanLeft_Button`, `LeanRight_Button`,
`UseConsumable_Button` and `CombatGadget_Button` - all vanilla, none declared by
any mod. Hide base-game rows to cut noise and you hide exactly the rows the
question was about.

**Check the store is not empty before believing it.** A binding store can
silently lose its contents: every one of a mod's registered hotkeys read `0` in
CET's `bindings.json`, unnoticed until the keys stopped working, and rebinding
restored them. The cheap signal is the **bound-to-total ratio over the whole
file** - 2 of 169 while broken, 9 of 169 healthy. Count before filtering zeroes,
because the filter destroys the measurement. And the natural reading of "almost
everything is 0" - *this must not be where bindings live, look elsewhere* - is
**wrong**: an empty store and a wrong store look identical.

Full format detail is in the base wiki (`cyberwise-wiki`) under `/input`: the
five stores, `overridableUI` linkage, `buttonGroup` indirection, ids that are not
keys, the CET packing, per-mod json conventions, and both findings above.
`references/input-bindings.md` indexes them and keeps the sheet-generation
procedure.

## One key, four spellings - never compare key NAMES

The stores do not agree on what a key is called, and every one of them is
authoritative for its own file:

| written as | by |
|---|---|
| `IK_Period` | the engine, in `r6\input` and `r6\config` |
| `Period` | `Get-Hotkeys` base-game rows - the raw id minus its prefix |
| `.` | `Get-Hotkeys` mod rows - prettified for reading |
| `PeriodAndBiggerThan` | iCUE, which names a key after every glyph on it |

Same for `MiddleMouse` / `Middle Click` / `Mouse3`, `GraveAccent` / `` ` `` /
`GraveAccentAndTilde`, the brackets, minus and equals, and the numpad.

> **Comparing the strings answers a question about spelling while looking like it
> answered one about keys** - and here, finding nothing is the dangerous result
> rather than the harmless one.

That is not theoretical. Until 2026-08-24 `-CheckKey` compared raw strings and
was wrong in both directions at once: `-CheckKey .` found no base-game claim,
`-CheckKey Period` found no mod claim, and the two contradicted each other while
each looked authoritative. **A gate that reports a taken key as free is worse
than no gate** - it is exactly how a test hotkey lands on quickload.

**Key identity is therefore vocabulary-agnostic, and lives in ONE place:**
`tools\KeyIdentity.ps1`, dot-sourced by both `Get-Hotkeys.ps1` and
`New-HotkeySheet.ps1`.

```powershell
. tools\KeyIdentity.ps1
Get-KeyIdentity 'PeriodAndBiggerThan'   # -> '.'   (compare these, never print them)
Get-KeyIdentitySet 'F1 / 1'             # -> 'f1','1' - a row can claim two keys
```

Three rules if you add a sixth store, or a second peripheral vendor:

- **Fold through `Get-KeyIdentity` - do not compare its strings**, and do not
  start a second table. A copied table is right the day it is copied and drifts
  silently after, with both copies internally consistent and disagreeing.
- **The token is for equality only.** Display keeps whatever each store rendered,
  because the pretty names are what make the sheet readable.
- **An unknown name folds to itself**, never to nothing and never to a guess. A
  table that swallows what it does not recognise recreates the original bug: the
  unrecognised key claims nothing and reads as free.

## A peripheral profile is a LAYER over the five stores, not a sixth store

The five stores answer *what the game does when this key arrives*. A programmable
mouse answers something else entirely: *which physical button sends that key*.

**The device performs no game action.** A Corsair Scimitar, a Logitech G600, a
Razer Naga - none of them tell the game a device button was pressed. They emit a
**keystroke**, and the game or a mod then interprets it exactly as if it had come
from the keyboard. Nothing in the five stores knows a mouse exists.

So a mouse profile can never be listed *beside* the harvested bindings as another
set of controls. It has to be **joined** to them:

> physical button &rarr; keystroke sent &rarr; what that keystroke is bound to

Print only the first two and you have printed the label the user typed into their
vendor software months ago. That is a memory, not evidence: the label can be
stale, the mod can have been rebound since, or the keystroke can be bound to
**nothing at all**.

**That last case is the finding.** A button whose keystroke nothing binds is
DEAD - it does nothing in game, and in the vendor configurator it looks identical
to a working one. Nothing but the join will ever say so. On the install this was
built against, one of twelve thumb buttons was dead: it sent `=` while the mod it
was meant to drive was listening on `'`.

The vocabularies above have to be reconciled before the join lands, and skipping
that reports **every** button as dead - iCUE's `PeriodAndBiggerThan` matches
neither the `.` a mod row carries nor the `Period` a base-game row does. The
sheet folds both sides through `Get-KeyIdentity` first; a hand-rolled comparison
of any two vocabularies finds nothing.

## A pad is an ARRANGEMENT, and the arrangement lives in the user's wiki

The join above says *what* each button does. It does not say **where the button
is**, and on a thumb pad that is the property that makes the thing usable without
looking down. "G7 sends `]`" is a fact you have to read. "the middle key of the
third column sends `]`" is a fact you can feel.

Vendor software does not export the arrangement - iCUE says `MouseG7` and stops.
So the geometry has to come from somewhere, and **it is not a table inside the
tool.** A registry of every peripheral, shipped with the code, is a database that
rots: it needs an edit whenever anybody buys a mouse, it is permanently behind,
and the one device it is guaranteed not to know is the one the person asking
owns.

A device's geometry is a fact about **one person's desk**, like the machine
profile already sitting beside it. So it lives in that person's **user wiki
bundle**, conventionally `<records>\Cyberwise\wiki\devices.md`, and adding a
device is a wiki edit rather than a release.

````markdown
```device
match: SCIMITAR RGB ELITE     <- regex against the reported device name
name: Corsair Scimitar RGB Elite Wireless
surface: side keypad
columns: 4
rows: 3
origin: bottom-left           <- which corner holds the FIRST key
flow: column                  <- up a column, then to the next column
first: 1
prefix: G                     <- label = prefix + number, giving `G1`
count: 12                     <- when fewer keys than columns x rows
```
````

**A corner plus a flow is the whole of "which way does the numbering run".**
Bottom-left + `column` means up, then rightwards; top-right + `row` means
leftwards, then down. Nothing else is needed and nothing else should be added.

**Irregular surfaces draw themselves** with `map:` instead - one text row per
grid row, top row first, `.` for a hole, a bare number taking `prefix`. Where
both forms are present `map` wins, because a reader holding the device can check
a picture and cannot check `origin: bottom-left`.

**Nothing in the schema is mouse-shaped, deliberately.** A Stream Deck, a macro
pad and a thumb pad are one abstraction - a grid of physical keys, each mapped to
an action - and a schema that only describes thumb pads has to be redesigned the
first time somebody plugs in something else.

To add a device: write a block, run the sheet, look at the pad it draws. Nothing
is rebuilt and no code changes.

**Unknown devices degrade to the flat list**, and that is the normal case. No
bundle, no article, no matching block, or a block that will not parse each yield
no geometry and the same list the sheet has always produced - most people own no
programmable peripheral at all. Only a block that is *present and wrong* warns,
because that is the one case where somebody is waiting for a grid.

`tools\DeviceGeometry.ps1` is the reader (`Get-DeviceGeometry -Name '<device>'`);
the format is documented for everybody in the base wiki at
`/input/describing-a-device-physical-geometry`.

Two things every rendered key must carry, or the grid is just the vendor's
configurator redrawn: **the keystroke, and what that keystroke is bound to**.
That is also the only way a grid can show a **dead** button - and a physical
layout is the best possible place to show one, because the useful fact is not
"G8 is dead", it is "the one your thumb rests on is".

**Draw only the seats that carry an action.** A seat the profile never assigned
costs a full cell to say "not assigned", which is a thing the owner knows,
because they are the one who did not assign it. Leave it out - and because every
key states its own grid coordinates, its position stays EMPTY rather than letting
the keys after it slide up into the gap. The shape on the page is still the shape
under the thumb, which is the entire reason for drawing a pad instead of a list.

A key whose keystroke is bound to **nothing** is the opposite case and must still
draw, flagged. That one is a finding, and there is nowhere else it can be seen.

## Hiding what you never press

A cheatsheet is only useful at a size you can take in, and on a large install
most rows are things this player will never touch. So the sheet has a **hide**
mode - the eye-off toggle in its header - and clicking any row or key in that
mode takes it off the sheet.

**The hard part is not the clicking, it is that the sheet is REGENERATED.** A
hidden set living in the page evaporates the next time it is built from disk, and
the owner gets all of it back with no explanation. So there are two tiers, and
only the second one is durable:

| tier | holds | lasts |
|---|---|---|
| `localStorage` | the instant effect | until the sheet is regenerated |
| `sheet-preferences.md` in the **user wiki bundle** | the real list | for ever |

Same argument as the device geometry above, and the same bundle: what somebody
wants on their own cheatsheet is a fact about them, not about Cyberpunk.

````markdown
```sheet-hidden
binding: Kiroshi Night Vision | Toggle night vision | F3
button: G11
action: Skip radio song
```
````

`<kind>: <field> | <field>`, parsed with regex and string work like every other
block this family reads - there is no YAML parser on a PowerShell 5.1 box. **The
same string appears in the article, in the page's `data-hid`, and on the
generator's command line**, so an entry cannot mean one thing in one place and
something else in another. A line that will not parse is skipped, never guessed
at: losing one entry is recoverable, hiding the wrong row is not, because nobody
goes looking for a row they never noticed vanishing.

**`-Hide` is authoritative, not additive.** What is passed BECOMES the hidden
set, so `-Hide @()` unhides everything and the page's own hidden list can undo
itself simply by handing over a shorter list. That is what makes hiding
reversible without anybody opening a file - and it is why **the regeneration
prompt has to carry the list and name the article**. A regeneration that forgets
it silently un-hides everything, which looks exactly like the feature not
working.

## No account name on a page built to be shared

A cheatsheet gets screenshotted. Every absolute path the sheet prints - in the
prose, in the footer, inside the prompt meant to be pasted into a chat window -
carries the home directory, and the home directory carries the username.

`New-HotkeySheet.ps1` substitutes **`$env:USERPROFILE`** rather than `~`,
because the prompt's command still has to run when it is pasted back, and
PowerShell expands the variable. Paths are de-named where they are built, and the
whole page is swept once more before it is written; anything that survives is
warned about at generation time rather than found by a reader.

## Tools

```powershell
tools\Get-Hotkeys.ps1 -GameRoot '<path>'          # every binding, all five stores
tools\Get-MouseProfile.ps1 -List                  # which iCUE profiles exist
tools\New-HotkeySheet.ps1 -GameRoot '<path>' -Out sheet.html
tools\New-HotkeySheet.ps1 -GameRoot '<path>' -Out sheet.html -Md sheet.md
```

`Get-MouseProfile.ps1` reads Corsair iCUE 5 profiles from
`%APPDATA%\Corsair\CUE5\profiles`. They are `.cueprofiledata` files - XML despite
the extension, serialised by the cereal C++ library, so the root is `<cereal>`
and everything repeated is `<value0>`, `<value1>`, ... Each action splits into
`<first>` (the label the user typed, plus the `keyName` it emits) and `<second>`
(the physical button, e.g. `MouseG9`, plus the event). `<second><key>` is
routinely empty - that is an action left assigned to nothing, and it is carried
through as such rather than invented into a button.

It is a **separate tool, not part of the five-store harvest**, precisely because
of the layer argument above: `Get-Hotkeys.ps1` returns bindings, and a mouse
action is not a binding. Keeping them apart is what leaves its contract intact.

**It must degrade to nothing, and does.** No Corsair folder, no profiles, or
unreadable XML each produce a warning and zero rows - never an error. Most people
have no Corsair device, and a hotkey sheet that fails to build over the brand of
somebody's mouse is worse than one that never mentioned mice.

The sheet's mouse section is **on by default whenever a profile exists**, which
is the opposite of `-IncludeBaseGame`, and deliberately so. The ~99 vanilla rows
are the same on every install - boilerplate until asked for. A mouse profile is
hand-built by this user and describes how they actually play. `-NoMouseProfile`
turns it off; `-MouseProfile '<name>'` picks one by name.

**Say which profile the rows came from.** The filenames are opaque GUIDs, so a
user with several profiles has no other way to tell. Left to itself the sheet
picks the profile iCUE **auto-activates for `Cyberpunk2077.exe`** (recorded in
`linkedProgramsPaths` - the user pointed it at the game themselves, so it is not
a guess), falling back to whichever holds the most remaps. Either way the name
goes on the sheet.

`Get-Hotkeys.ps1` resolves the install itself from Steam/GOG/Epic records if
`-GameRoot` is omitted, and errors rather than guessing. Zero bindings is a valid
result - an archives-only load order declares no keys.

`-Md` writes the same bindings as markdown tables, for pasting somewhere the
HTML is no use. A full sheet runs past Discord's 2000-character limit, which
refuses the message rather than truncating it, so the tool prints the length
when it is over.

`New-HotkeySheet.ps1` renders a self-contained sheet. Anything genuinely not on
disk - a programmable mouse's hardware mapping, a mod's tap/hold semantics - goes
in a small notes json passed with `-Notes`, and actions are re-resolved from the
harvested bindings on every run, so a rebind in game propagates without editing
the notes.

**Hardware sits outside all five stores**, in the vendor's own files. Corsair
iCUE 5 is readable and `Get-MouseProfile.ps1` reads it; every other vendor still
needs `-Notes`. Do not assume the user has any of it - most do not, and the
harvested bindings are the whole answer for them.

**The sheet is an HTML deliverable**, so load `cyberwise-reports` too when
generating one: it carries the house style, the viewport probe and the fit
measurement, and a sheet sized for a guessed viewport is the failure mode that
produces rounds of "still too small".

## Reference material

| file | covers |
|---|---|
| base wiki `/input/*` | the knowledge: five stores, vanilla mappings a mod repurposes, key-name vocabularies, packed VK codes, a store that emptied itself, why contexts are not categories, and the device-geometry format |
| `references/input-bindings.md` | an index of those, plus the procedure for generating and **measuring** a sheet |
| `tools/KeyIdentity.ps1` | the one key-identity table, and the reasoning in its header - read it before adding a store |
| `tools/DeviceGeometry.ps1` | the geometry reader, and why the data is in the user's bundle rather than in here - read it before adding a device or a vendor |
