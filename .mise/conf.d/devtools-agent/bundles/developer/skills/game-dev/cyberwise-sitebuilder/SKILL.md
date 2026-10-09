---
name: cyberwise-sitebuilder
description: Turn a folder of character documents into a website - plain HTML, CSS and JS with no build step, no runtime and no account, deployable by copying a folder. Each character gets its own stylesheet, CSS Zen Garden style, so a dossier and a monologue do not come out looking like the same page. Use when someone wants to publish or share their V's backstory, character records or install documentation as a web page rather than a Markdown file.
---

# Cyberwise: sitebuilder

> **Verified:** 2026-08-21
> **Re-check after a patch:** nothing here depends on a game patch. Re-check when
> the character document layout changes.

Somebody has written their V. It is sitting in a `.md` file that nobody will ever
read, because *"read this Markdown file"* is a thing you can only ask of other
developers.

```powershell
tools\New-CharacterSite.ps1 -From <characters folder> -Out <site folder> -Open
```

`-From` defaults to `characters` beside you, because pointing it at your own
folder of documents is the normal way to use this. **`-Out` does not**: it
defaults to `...\Cyberpunk 2077\Cyberwise\reports\site`, with the install's
other records. It used to default to the current directory, which for an agent
is usually a clone - so the site got written into the source tree.

That is the whole interface. The output folder **is** the site: copy it to a web
host, a USB stick or a Discord upload, or double-click `index.html`.

## The architecture is CSS Zen Garden

Every character page emits **the same semantic markup** - eyebrow, `h1`, subhead,
content, meta, footer - and a per-character stylesheet owns everything about how
it looks. Not a palette swap. A different world:

| character | what the page is |
|---|---|
| an Arasaka personnel file | gold leaf on a kill order: classification band, watermark, misregistered headline, redactions as objects lying on the page |
| a monologue told to a dying man | wet, green, breathing; the room a fraction off true; her asides cut across the column |
| a nomad legend at a fire | dust, rust and firelight, torn edges, type like a hand-painted sign on a truck |
| an AI reading somebody's file aloud | a terminal that discusses a person exactly as it would discuss disk usage |

**A theme is one CSS file in `themes\`.** Copy `default.css`, rename it after the
character, done - the builder picks up `themes\<character>.css` with no
configuration, or reads a `theme.txt` in the character's folder. That is why this
tool does not *generate* CSS: generated CSS is CSS nobody can edit.

`tests\Test-Tools.ps1` enforces the invariant by comparing the two pages' tag and
class skeletons. If the builder ever starts emitting different structure per
character, a theme can no longer be written blind, and the whole idea collapses.

## What it must never do: flatten the documents

Character documents are not copies of one form. **The format is the
characterisation** - which is also why the tool renders each document as written
instead of extracting Name / Lifepath / Backstory into fields. A template would
make all four the same shape, the one outcome that makes the site worse than the
files it was built from.

Three places this shows up, all tested:

- **A field block keeps its lines.** Markdown says consecutive lines are one
  paragraph, which is right for wrapped prose and catastrophic for `SUBJECT:` /
  `CODENAME:` / `AKAS:`, where each line is a field.
- **A nested list nests.** Indentation in a dossier is structure.
- **Document furniture is tagged, not styled.** The renderer marks a
  classification stamp `.cls`, a redaction `.redact`, a single all-capitals line
  `.allcaps`, a short beat `.brief` - and each theme decides what those mean. In
  the transcript, `.allcaps` is the machine interrupting; in the dossier it is a
  reference number.

## Why there is no dependency

The audience is somebody with no technical patience, and every dependency is a
place they stop: a runtime to install, a package manager to learn, an account to
make. So it is PowerShell, which is already on the machine, and the output is
plain HTML, a few stylesheets and one small script.

**The site must work from `file://`.** Nothing fetches - the browser blocks it
from a filesystem origin - so every page is complete when written. That is also
what makes it private by default: no tracking, no fonts phoning home, no CDN.
Every texture is CSS or an inline SVG data URI; there is not one image file in
the theme layer.

## The layout it reads

```
characters\valkyrie\Profile - Valkyrie.md    the document (required)
characters\valkyrie\Meta - Valkyrie.md       optional second section
characters\valkyrie\media\*.jpg|png|webp     optional images
characters\valkyrie\theme.txt                optional theme name
```

Anything else is ignored, so presets, backups and working notes can live beside
the document without being published. A folder whose name starts with `_` is a
draft and is skipped unless `-IncludeDrafts` is passed. `Profile*.md` is the
convention, but a folder holding exactly one Markdown file works without it - a
convention nobody was told about is a trap.

## Media is optional, and its absence must not look broken

The prototype was built for somebody with **no images at all**, which is the
normal starting state. The directory is typographic rather than a card grid, so
nothing is waiting for a photograph that does not exist; when images arrive, drop
them in `media\` and rebuild for a gallery and lightbox on the character's page.

## Tools

| tool | does |
|---|---|
| `tools/New-CharacterSite.ps1` | the whole site: directory, one page per character, themes, JS |
| `tools/ConvertFrom-Markdown.ps1` | the Markdown subset these documents use, plus the document markers (dot-sourced) |
| `themes/*.css` | one file per character, plus `_base.css` (structure only), `index.css` and `default.css` |

## Not built yet

- **Other sections** - a mod list from `cyberwise-reports`, a hotkey sheet from
  `cyberwise-hotkeys`. Both already render HTML; the work is a shared shell.
- **`cyberwise-media`** does not exist, so galleries are a plain grid.
- **A theme picker in the output.** Zen Garden's own trick - the same document
  under every stylesheet - would be a few lines, and would make the point better
  than any explanation.
