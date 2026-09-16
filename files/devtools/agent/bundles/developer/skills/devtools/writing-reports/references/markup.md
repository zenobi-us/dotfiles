# Report markup vocabulary

Strict BEM. Every styled node carries a class. A node with no class gets no
style. `assets/theme/v1/base.css` holds the only element selectors, and they
cover `body` alone.

Every class below comes from `assets/report/v1/report.css`. Use these. Do not
invent a class, and never add a `<style>` block or a `style` attribute.

## Head

Three stylesheets, in this order, then the lightbox:

```html
<link rel="stylesheet" href="assets/theme/v1/tokens.css">
<link rel="stylesheet" href="assets/theme/v1/base.css">
<link rel="stylesheet" href="assets/report/v1/report.css">
<script src="assets/lightbox/v1/lightbox.js"
        data-figures=".figure"
        data-caption=".figure__caption"
        data-hint="Click image to zoom &middot; Esc to close"
        data-label="Screenshot viewer"
        defer></script>
```

`scripts/validate-report.ts` fails when a sheet is missing or out of order.
The paths are sibling-relative, never `../`. The report is self-contained.

## Colour

Never write a colour. `tokens.css` holds them all, in both themes. Pick the
class whose meaning fits, and the colour follows the reader's theme. A hex
value outside `<pre>` and `<code>` fails validation.

## report — the page shell and its running text

```html
<div class="report">
  <h1 class="report__title">TICKET &mdash; report title</h1>
  <p class="report__subtitle">One line: what the work had to prove.</p>

  <h2 class="report__section" id="check1">Check 1 &mdash; short claim</h2>
  <h3 class="report__subsection" id="check1a">A part of that check</h3>

  <p class="report__text">A paragraph of running text.</p>
  <p class="report__meta">Detail that is not the point itself.</p>

  <ul class="report__list">
    <li class="report__item">A point.</li>
  </ul>
</div>
```

One `.report` per page. `.report__section` draws the rule above an `h2`.
Give every section an `id`, so a summary row can link to it.

## badge — a result

Four exist. Do not add a fifth.

| Class | Use for |
|---|---|
| `badge--pass` | The check passed. |
| `badge--fail` | The check failed. Say who owns the failure. |
| `badge--info` | Not testable, not reached, or a neutral finding. |
| `badge--warn` | A bug found on the side, unrelated to the change. |

```html
<span class="badge badge--pass">Pass</span>
<span class="badge badge--fail">Fail &mdash; backend</span>
<span class="badge badge--info">Not testable</span>
<span class="badge badge--warn">Unrelated bug</span>
```

Put a badge in the summary table and again in the heading of the section that
proves it.

## summary — the result table

Every cell of a row carries the same jump link, which makes the whole row
clickable with no JavaScript.

```html
<div class="card">
  <h3 class="card__title">Result summary</h3>
  <div class="summary"><table class="summary__grid">
    <tr class="summary__row">
      <th class="summary__head">#</th>
      <th class="summary__head">Check</th>
      <th class="summary__head">Result</th>
    </tr>
    <tr class="summary__row">
      <td class="summary__cell"><a class="summary__link" href="#check1">1</a></td>
      <td class="summary__cell"><a class="summary__link" href="#check1">What was checked</a></td>
      <td class="summary__cell"><a class="summary__link" href="#check1"><span class="badge badge--pass">Pass</span></a></td>
    </tr>
  </table></div>
  <p class="card__meta">One line that groups the checks.</p>
</div>
```

## table — any other table

`.table` is the wrapper. It scrolls itself, so a wide table never scrolls the
page sideways.

```html
<div class="table"><table class="table__grid">
  <tr class="table__row">
    <th class="table__head">Step</th>
    <th class="table__head">What</th>
  </tr>
  <tr class="table__row">
    <td class="table__cell">1</td>
    <td class="table__cell">Action taken.</td>
  </tr>
</table></div>
```

## figure — a screenshot and what it proves

The lightbox picks up every `.figure` that holds an image, in document order,
and shows the `.figure__caption` as the caption.

```html
<figure class="figure">
  <img class="figure__image" src="shots/10-example.png"
       alt="Plain description" width="1200" height="556">
  <figcaption class="figure__caption">
    <strong class="figure__label">Label.</strong> What the reader must see, and why it matters.
  </figcaption>
</figure>
```

- `alt` describes the picture for someone who cannot see it.
- `.figure__caption` says what the picture proves. The two are not the same text.
- `width` and `height` are the file's real pixel size. Read them with
  `scripts/imgsize.ts file.png`. Never guess them.

Two figures side by side, stacking below 720px:

```html
<div class="figures figures--pair">
  <figure class="figure">…</figure>
  <figure class="figure">…</figure>
</div>
```

## card — one self-contained finding

```html
<div class="card">
  <h3 class="card__title">F1 &mdash; short title <span class="badge badge--info">Info</span></h3>
  <p class="card__text">What was found, and what it blocks or costs.</p>
  <p class="card__meta">Supporting detail that is not the finding itself.</p>
</div>
```

## note — the reasoning that ties evidence to code

The label is the lead-in phrase only. A `<strong>` later in the sentence stays
plain bold.

```html
<div class="note">
  <p class="note__text">
    <strong class="note__label">Why this proves it.</strong> Tie the evidence back to the change.
  </p>
</div>
```

## code, code-block, mark, link

```html
<code class="code">identifier</code>

<pre class="code-block"><code class="code-block__text">{"paste":"a request or an error, escaped"}</code></pre>

<span class="mark">Missing</span>

<a class="link" href="https://example.invalid/RWR-1">RWR-1</a>
```

Escape `<` and `&` inside `<pre>`. Write `&lt;` and `&amp;`.

## Naming rules

- `block` — a thing that stands on its own: `card`, `note`, `figure`, `badge`.
- `block__element` — a part that only makes sense inside its block:
  `card__title`, `figure__caption`.
- `block--modifier` — a variant of the block: `badge--pass`, `figures--pair`.
- A block may sit inside another block. `.figure` inside `.figures` is correct.
- No element of an element. `card__title__icon` is wrong.
