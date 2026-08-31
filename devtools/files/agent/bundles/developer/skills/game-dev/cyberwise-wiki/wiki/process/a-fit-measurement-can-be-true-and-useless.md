---
type: Process
title: A fit measurement can be true and useless
description: A document height equal to the viewport height means only "not taller than the viewport", because the measurement has the viewport as its floor - and two faults it can never show, an element pushed clean off the page and a layout that fits only because a size flag was ignored, are both obvious in a rendering.
tags: [reports, html, measurement, verification, deliverables, method]
status: stable
generated: { by: "claude", at: "2026-08-24T20:50:00-04:00" }
---

# A fit measurement can be true and useless

Measuring a rendered page and finding its document height exactly equal to the
viewport height looks like confirmation that everything fits. It is not a
confirmation of anything.

**The measurement has the viewport as its floor.** A document shorter than the
window still reports the window's height, because that is the height of the
element being measured. So the reading means "not taller than the viewport" - it
is equally consistent with a page that fills the space perfectly and a page with
one line of content on it.

The number is true. It just does not answer the question it was collected for.

## Two faults a number cannot show and a rendering can

Both were real, and both passed a height check cleanly.

- **An element pushed clean off the page rather than clipped.** Content
  positioned outside the visible area contributes nothing to the measured
  document box. The page reports as fitting *because* something is missing from
  it. The worse the fault, the better the number.
- **A layout that "fits" only because a size flag was silently ignored.** A width
  or scale directive that the renderer did not apply produces a page laid out at
  some other size entirely - which may well fit - and no error anywhere. The
  measurement describes the layout that happened, not the one that was asked for.

Neither survives thirty seconds of looking at the rendered page. Both survive
any amount of arithmetic about it.

## What to do instead

1. **Render it and look.** For anything a person will read, an image of the page
   at the target size is the primary evidence; the measurement is supporting.
2. **Measure content, not the container.** The height of the outermost content
   element, or the position of the last element's bottom edge, says something the
   document box cannot.
3. **Check for overflow in both axes explicitly**, rather than inferring it from
   a height. A page that scrolls horizontally is a fault that a vertical
   measurement is structurally unable to report.
4. **Confirm the page rendered at the size you asked for.** Read back the applied
   width, and treat a mismatch as a failed run rather than a result.
5. **Count what should be there.** If the report has nine sections, assert nine.
   An off-page element that vanished from the measurement does not vanish from a
   count.

The general form: **a measurement whose floor or ceiling is the thing being
tested against cannot distinguish pass from degenerate.** It is worth asking, of
any number about to be used as a check, what its lowest possible value is and
what would produce it.

## The other size limit: a chat platform refuses rather than truncating

A different deliverable, the same class of surprise. Output meant to be pasted
somewhere has a length limit, and **the platform may refuse the message outright
rather than trimming it**. The person finds out at the moment they try to send
it, which is precisely when they are already stuck and asking for help.

So any paste-facing output should **print its own length** and, when it is over,
**name the alternative** - a file, a shortened variant, a split. That is one line
of arithmetic and it converts a dead end into a choice made before it matters.

The same reasoning as everything above: the constraint is real and invisible
until the moment it is fatal, and it costs almost nothing to surface early.

## Related

- [Ask for the viewport rather than detecting the display](/process/asking-for-the-viewport) - getting the number that this measurement is checked against
- [A passing validator has checked structure, not truth](/process/a-passing-check-is-not-a-true-claim) - the same gap between a green check and a correct artefact
- [An empty result is the absence of evidence, and it looks exactly like a finding](/process/an-empty-result-is-not-a-finding)
