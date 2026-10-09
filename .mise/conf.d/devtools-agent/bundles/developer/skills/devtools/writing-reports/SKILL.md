---
name: writing-reports
description: Writes a self-contained HTML evidence report with screenshots, captions, result badges and a clickable summary table. Use when work must be proved rather than claimed - manual test results, acceptance evidence, an audit, a migration check, a bug reproduction, or any hand-off that needs "here is the screenshot that shows it". Results in one portable directory that renders anywhere, with gaps and leftover test data named.
---

# writing-reports

A report is evidence. It states what was checked, shows the screenshot that
proves each result, and names what was **not** covered.

A wall of terminal output is not a report. A Markdown file with no screenshots
is not a report. This skill produces a directory that renders in any browser,
survives being moved or zipped, and can be attached to a ticket.

## When to use

- Someone asks for a test report, acceptance evidence, QA results, or proof.
- You finished manual testing and the result must outlive the chat session.
- An audit, migration, or reproduction needs a durable record.
- Another skill hands you evidence and a destination. The
  `browser-acceptance-evidence` skill does exactly this.

Do not use for a running commentary, a plan, or a design document. A report
records what happened, in the past tense, with proof.

## Core shape

```
<destination>/
  index.html              the report
  assets/theme/v1/        tokens.css, base.css     <- never edit
  assets/report/v1/       report.css               <- never edit
  assets/lightbox/v1/     lightbox.js              <- never edit
  shots/                  NN-slug.png
  files/                  companion artifacts the report links to
```

Every report carries its own copy of the four asset files, linked
sibling-relative. That is deliberate: a report gets moved, zipped, downloaded
and reopened from somewhere else. A report that only renders inside one
directory tree is a report that dies on first contact with a reviewer.

`files/` holds the same idea for everything else the report links to: the test
plan it ran, the evidence file behind the verdicts, a script or a workflow a
reader would re-run. Those artifacts usually live in a sibling directory. A
copy goes in `files/` so the link survives the move.

## Rules

- You **MUST** create the report with `scripts/new-report.ts`. Do not write a
  report page from scratch, and do not copy the template by hand.
- You **MUST NOT** put a `<style>` block, a `style=""` attribute, or inline
  lightbox JavaScript into the page. Every rule lives in the linked CSS.
- You **MUST NOT** write a colour into the page. Every colour is a theme token.
  A raw hex value outside `<pre>` and `<code>` fails validation.
- You **MUST NOT** edit any file under `assets/theme/v1/`, `assets/report/v1/`,
  or `assets/lightbox/v1/` — in a report or in this skill's template. Published
  reports link those files forever. A breaking change goes in a new `v2`
  directory.
- You **MUST NOT** change an asset path to `../` or `../../`. The report is
  self-contained.
- You **MUST** copy any companion artifact the report links to — a test plan,
  an evidence file, a script, a workflow — into `<destination>/files/`, and
  link it sibling-relative as `files/<name>`. You **MUST NOT** reach a sibling
  directory with `../`, even for a link that is not an asset. A report is
  handed over on its own; a `../` link dies the first time it moves. Leave the
  original where it is and treat the copy as the reader's copy.
- You **MUST** give every `<img>` a `class`, `src`, `alt`, `width`, and
  `height`. Without the size the page shifts while screenshots load and every
  jump link lands on the wrong section.
- You **MUST** read each image's real pixel size with `scripts/imgsize.ts`.
  You **MUST NOT** guess a size, reuse the size of another shot, copy the
  template's placeholder numbers, or trust what a screenshot tool said it
  produced. The validator reads the file itself and fails on a mismatch.
  `imgsize.ts` reads PNG and JPEG headers directly, so it needs no external
  tool. You **MUST NOT** write your own size reader, wrapper or shim — if
  `imgsize.ts` cannot read a file, save that screenshot as PNG or tell the
  user, and do not type a number it did not give you.
- You **MUST** class every styled node. Strict BEM. A node with no class gets
  no style.
- You **MUST** use the vocabulary in `references/markup.md`. Do not invent a
  class. A layout the vocabulary cannot express is a reason to ask the user,
  not a reason to add a `<style>` block.
- You **MUST** write a "Not covered" section, with an `id="notdone"`, even when
  it is short. A report that hides its gaps is worth less than one that names
  them. State the risk each gap leaves.
- You **MUST** pass `scripts/validate-report.ts` before you call the report
  done.
- The scripts are TypeScript run by Bun through a `mise x -- bun --install=fallback` shebang. Run
  them directly. Do not invoke them with `bash`, `sh`, `node` or `python`.

## CLI

Run `scripts/report-cli.ts --help` for the Crust router. Use `new`, `validate`, `imgsize`, and `doctor`. The individual script paths remain direct compatibility entry points.

## Procedure

1. **MUST** create the report directory:

   ```sh
   scripts/new-report.ts "<destination-dir>" "<TICKET> &mdash; what this proves"
   ```

   The destination must not exist. When another skill supplies a destination,
   use it verbatim.

2. **MUST** save every screenshot into `<destination>/shots/`, named
   `NN-slug.png`. `NN` orders the shots as the reader meets them, and leaves
   gaps for later inserts: `10-login.png`, `20-banner.png`, `31-missing.png`.

2b. **MUST** copy every companion artifact the report will link to into
   `<destination>/files/`:

   ```sh
   mkdir -p <destination>/files
   cp <plan> <evidence> <workflows> <destination>/files/
   ```

   Link them from the page as `files/<name>`. A report that points at a
   sibling directory stops working the moment someone zips it and sends it on.

3. **MUST** read the real pixel sizes:

   ```sh
   scripts/imgsize.ts <destination>/shots/*.png
   ```

   It prints `<name> <width> <height>` per file, read from the file header.

4. **MUST** write the result summary first, before any section. One row per
   check. Every cell of a row carries the same
   `<a class="summary__link" href="#section">`, which makes the whole row
   clickable with no JavaScript. Drop one anchor and that cell stops working.

5. **MUST** give every section an `id` that a summary row targets. A summary
   row with no target is a broken promise.

6. **MUST** pick the badge that tells the truth:

   | Badge | Use for |
   |---|---|
   | `badge--pass` | The check passed. |
   | `badge--fail` | The check failed. Say who owns the failure. |
   | `badge--info` | Not testable, not reached, or a neutral finding. |
   | `badge--warn` | A bug found on the side, unrelated to the change. |

   A check you could not run is `badge--info`, never `badge--pass`. "The code
   looks right" is not a pass. A pass needs a screenshot.

7. **SHOULD** write a "Test data left behind" section when the work changed
   shared state: accounts, records, config overrides, running servers. Say what
   to delete and how.

8. **MUST** validate:

   ```sh
   scripts/validate-report.ts <destination>/index.html
   ```

   Fix every line it prints. The script is the gate, not a suggestion.

9. **SHOULD** open the page and click one screenshot, to confirm the lightbox
   opens and the caption reads correctly.

## Common mistakes

| Mistake | Why it breaks | Fix |
|---|---|---|
| Guessing `width`/`height` | The page reflows on load; jump links land wrong | Run `scripts/imgsize.ts` |
| A `<style>` block "just for this one bit" | The report stops matching every other report | Use a vocabulary class |
| `badge--pass` on an unproven check | The report lies, and lies are worse than gaps | `badge--info` plus a "Not covered" row |
| Caption repeats the `alt` text | `alt` describes the picture; the caption says what it proves | Write two different sentences |
| No "Not covered" section | The reader assumes full coverage | Always write it |
| `../plan.md` in a link | The report dies when moved or zipped on its own | Copy into `files/`, link `files/plan.md` |
| Editing `report.css` to fix one page | Restyles every past report | New `v2` directory, or ask |

## Reference

- `scripts/imgsize.ts` — real pixel sizes from the file header.
- `references/markup.md` — the class vocabulary, with an example of each block.
- `assets/report-template/index.html` — the skeleton, with slot comments.
- `assets/report-template/assets/theme/v1/tokens.css` — every colour, size and
  radius available.
- `assets/report-template/assets/lightbox/v1/lightbox.js` — the header comment
  lists every `data-*` option the script tag accepts.
