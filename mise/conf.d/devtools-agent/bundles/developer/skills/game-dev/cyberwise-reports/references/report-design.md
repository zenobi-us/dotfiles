# Report design

> **Verified:** Practice as of August 2026
> **Re-check after a patch:** Nothing here depends on a game patch. Re-check when a browser changes default rendering, or when the deliverable's audience changes (a page for a phone is not a page for a second monitor).

House standard for anything this skill generates for a human to read: a mod
manifest, a hotkey sheet, a system profile. Two output formats, one design
language, and one rule that matters more than any of the styling.

## First: ask what it has to fit

**"Fits on screen" is meaningless until you know whose screen, and how they will
have the window.** Do not detect it. Ask:

> Open this and put the browser window on the monitor you'll actually read it
> on, at the size you'll actually use - then tell me the number.

```powershell
.\Show-ViewportProbe.ps1     # opens a page reporting its own viewport, live
```

The user drags the window wherever they want it and reads back a figure like
`1712 x 945`. That goes straight into `-Width` / `-Height`.

Detecting the display cannot answer this, because between the panel and the
viewport sit: which monitor, maximised or half-width, the tab strip, the address
bar, an optional bookmarks bar, a sidebar, browser zoom, and OS display scaling.
Auto-detection assumes maximised-on-the-primary-at-100%, and silently sizes for
that. The cases where it is simply wrong are ordinary ones:

- a small secondary or prompter panel - detection reports the big monitor and
  produces a page that will never fit the one they meant
- a wall-mounted TV across the room
- "half the width of my second monitor", which no screen enumeration can express

**Then say what that viewport implies, honestly.** The number is an input to the
design, not just a pass/fail:

- **Small** (a prompter panel, a phone, a narrow split) - say plainly that not
  everything will be visible at once, agree what earns the top of the page, and
  accept scrolling for the rest. Do not shrink the type until it fits; an
  unreadable page that fits is not a win.
- **Large or far away** (a TV, a big second monitor) - scale the type up hard.
  The default that reads well at desk distance is far too small at three metres.
- **Ordinary** - fit it, and use the headroom for breathing room rather than
  more content.

## Then: look at the result

**Render the page and look at it before calling it done.** Generating HTML you
have never seen is writing code you have never run.

```powershell
.\Measure-PageFit.ps1 -Path out.html -Width 1712 -Height 945 -Screenshot -ShotPath shot.png
```

Then actually read `shot.png`. The measurement catches what you cannot see; the
screenshot catches what a number cannot describe.

**Reading the result:** `DocHeight == ViewHeight` does *not* mean the page fills
the window exactly. `scrollHeight` has the viewport as its floor, so equality
just means "shorter than the viewport" - which is what `Fits: True` already told
you. To learn the true content height, and therefore how much headroom is left
to spend, measure again against a deliberately short window:

```powershell
.\Measure-PageFit.ps1 -Path out.html -Width 1712 -Height 400   # DocHeight is now real
```

Spend headroom deliberately. If a page has 230px spare, a `-Scale` bump may be
better than empty space - but check the *worst* state, not the current one. On
one sheet, scaling up 20% fitted comfortably with an optional column hidden and
overflowed by 219px with it shown, so the smaller scale was the right answer:
it was the only one where the toggle worked in both directions.

`Measure-PageFit.ps1` renders headless at a stated viewport and returns the
document height, the viewport height, and the class of anything overflowing
horizontally. It exists because two failure modes are **invisible** in the
normal build-and-eyeball loop:

- **An element pushed clean off the page.** A long inline label with
  `white-space:nowrap` forced its row wider than the container and shoved a
  keycap past the right edge. Not clipped, not squeezed - *absent*. Nothing in
  the visible layout suggested a missing element; only the overflow probe named
  it.
- **A page that "fits" because the flag was ignored.** In PowerShell,
  `--window-size=$W,$H` unquoted is parsed as an **array**, so two arguments
  reach the browser, the flag is dropped, and it silently renders at its 800x600
  default. The first reading claimed a 754px viewport. Quote it.

Screenshots you are *given* are a poor substitute for measuring: they arrive
downscaled by an unknown factor, so sizing from one is sizing for a guessed
viewport. They are still worth asking for as a *look* - they show crowding,
contrast and ugliness that no measurement reports.

**Testing a page that restores its own state:** drive the real control. A class
forced onto `<body>` is stripped by the page's own restore logic before anything
is measured, which reads as a feature that does nothing.

```powershell
(Get-Content $f -Raw) -replace '(?i)</body>',
  '<script>document.getElementById("modtoggle").click();</script></body>'
```

## Self-contained, always

A strict rule with no exceptions: **no external fonts, scripts, stylesheets or
images.** Inline everything. These files get pasted into forum posts, opened
from USB sticks, read on a phone with the desktop offline, and attached to help
threads. A Google Fonts `@import` turns into a flash of unstyled text at best
and a broken page at worst.

Use the platform fonts:

```css
--mono:'Consolas','SF Mono','DejaVu Sans Mono',monospace;
--sans:'Segoe UI',system-ui,-apple-system,sans-serif;
```

## Palette

Drawn from the game's own UI so the artefact looks like it belongs to the
subject. Yellow is the primary accent, cyan the secondary, red for problems,
green for all-clear. Everything sits on near-black.

```css
:root{
  --yellow:#fcee0a; --cyan:#00f0ff; --red:#ff003c; --green:#39ff88; --purple:#b56cff;
  --bg:#07070a; --panel:#101018; --line:#26263a; --text:#e4e4ee; --dim:#8a8aa2;
}
```

**Luminous text on a dark ground, never dark text on a luminous ground.** Small
uppercase letter-spaced type in black on solid `#00f0ff` is genuinely hard to
read, and it was the first thing a reader complained about. A chip should be the
accent colour on a translucent wash of itself:

```css
color: var(--cyan);
background: rgba(0,240,255,.12);
border: 1px solid rgba(0,240,255,.45);
```

Reserve solid-fill-with-dark-text for a single active control, where the
inversion signals state rather than decoration.

## One type base

Every size derives from one custom property, so the whole artefact scales as a
unit and a `-Scale` parameter is one substitution rather than forty:

```css
:root{ --fs:20px }
body       { font-size:var(--fs) }
.row-label { font-size:calc(var(--fs)*.84) }
.mod-name  { font-size:calc(var(--fs)*.50) }
```

Hard-coded `px` scattered through the sheet drifts out of proportion the moment
anyone asks for it bigger - and they will ask, because the right size depends
on a viewing distance you cannot see.

## Layout: flex, not multi-column

**Do not use CSS `columns` for a page of panels.** It derives its own column
count and balances into it; in the case that produced this note a 3000px
container settled on two columns and left two thirds of the screen empty. Use
flex and let it fill the row:

```css
.cols  { display:flex; flex-wrap:wrap; align-items:flex-start; gap:14px }
.panel { flex:1 1 400px; min-width:0 }
```

`min-width:0` is load-bearing: without it a flex item refuses to shrink below
its content, which is how things get pushed off the page.

Multi-column is still right *inside* one oversized panel, to stop it setting the
height of the whole page:

```css
.panel.big       { flex-grow:2; flex-basis:820px }
.panel.big .rows { columns:2; column-gap:22px }
.rows .row       { break-inside:avoid }
```

**Do not cap the width** of something destined for a second monitor. A centred
1200px column on an ultrawide wastes the reason it is on that monitor.

Watch bottom padding against a bevelled `clip-path` - 6px of padding under a
14px corner bevel silently sliced the last row off a panel.

## Structure: the answer first

Lead with the conclusion, then the evidence. A system profile opens with flags,
not with the CPU model. A conflict report opens with what is broken. Someone
pasting the artefact into a help channel should get value from the first six
lines, and the tables underneath exist to justify those six lines.

Every flag names the symptom **and** the reason. "You have 6 GB of VRAM" is a
statistic; "6 GB of VRAM against 40 GB of archives, which is why textures never
sharpen" is a diagnosis.

**A finding earns a line. Good news does not.** No green "everything checks out"
sentence, no "0 problems found" line, no paragraph confirming there was nothing
to report. The absence of findings is already visible - it is the empty space
where they would have been - and spending a sentence on it costs exactly the room
the findings would need on the day there are some. The hotkey sheet carried one
of these for a while ("Every assigned button lands on something the game or a mod
is listening for"), sitting above the grid it was pushing down the page, and its
owner asked for it out.

The counterpart rule is what makes that safe: **a problem is flagged where the
problem is**, on the row, the key, the mod - not narrated in prose above the
table. Prose above a table is read once and then skipped for ever; a red keycap
is seen every time somebody looks for that key. Where a count is genuinely worth
having, one measured line beats a paragraph - and its zero-valued parts are not
drawn, because "0 dead" is the good-news line wearing a number.

## Markdown for Discord

Where a companion markdown file exists, its target is a chat paste, and that
constrains it more than the HTML:

- **Discord does not render markdown tables.** Pipes and dashes become line
  noise in the exact place the file is meant to be read. Use **fenced code
  blocks with space-aligned columns**, which render identically everywhere.
- **2000 characters per message, and over it a message is REFUSED, not
  truncated.** This is the part people design around wrongly. A long paste does
  not arrive clipped - nothing arrives, and the user discovers that while
  already stuck and asking for help.

  So every output whose purpose is to be pasted **states its own size and says
  what to do instead**, at generation time, rather than leaving the user to find
  out in the channel. Three shipped examples, all enforced by tests:

  - `New-SystemProfile.ps1` caps each flag's item list at 8 in the markdown (the
    HTML lists everything) and warns with the actual character count when the
    file still runs over.
  - `New-ModManifest.ps1` cannot make an 800-mod inventory pasteable, so it
    reports the size and names the two things that do work - attach the file,
    or share the HTML.
  - The tray's **Copy crash summary** trims to fit before the text reaches the
    clipboard, dropping oldest-first and saying how many lines went.

  **Trim from the end, and say that you did.** Silent truncation is worse than
  a refused paste: the reader believes they sent everything.
- Bullets, bold and inline code are safe. Headings render but are heavy - bold
  a line instead.

## Determinism

Two runs against an unchanged system should differ only in the timestamp. Sort
every enumeration, fix the section order, never let WMI or a filesystem decide
the order of anything. This is what makes "profile, change one thing, profile
again" a usable diagnostic; a report that reshuffles itself cannot be diffed.

## Privacy

These artefacts get shared. **Redact by default, not on request:** replace the
user's profile path with `~`, strip the machine name, and do not include an
account name in an output whose purpose is to be pasted in public. Offer a
`-NoRedact` switch for local use rather than making the safe path opt-in.

A mod list is personal data too - it discloses interests. Write generated
reports outside any repo, and never commit them.

## Never hand someone a grep

**"Grep the log for X"** is not an instruction to a modder. Most people running
800 mods are not developers, have never opened a terminal, and will read a
pipeline of `Select-String` and `Group-Object` as a reason to stop asking. The
answer arrives looking like homework.

The tool has the log. **Read it and say what it says.**

| instead of | say |
|---|---|
| "grep scripting.log for `NetSec] GAP`" | "you hit 259 spots with no access point - here they are" |
| "tally them with `Group-Object`" | "no-access-point is 40% of them, so run strict" |
| "check the log for the class name" | "it is a plate antenna, filed under distraction devices" |

Where a command genuinely has to be run by hand - an elevated action, something
that must happen with the game closed - **give one complete line that can be
pasted**, say plainly what it will do, and never make its output the user's
problem to interpret. Asking somebody to run a query AND read its results is two
jobs handed over; doing the reading is the part that was being asked for.

This applies hardest when a diagnostic was written for the occasion. A tool that
emits a tagged line and then requires a regex to be useful is half a tool.
