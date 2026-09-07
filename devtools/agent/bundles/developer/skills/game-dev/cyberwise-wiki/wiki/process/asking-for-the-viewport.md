---
type: Process
title: Ask for the viewport rather than detecting the display
description: Six things sit between a monitor's panel size and the space a page actually gets, and detection can only assume the one arrangement that is maximised on the primary display at 100% - so send a probe page, and treat what comes back as an input to the design rather than a gate the design has to pass.
tags: [reports, html, viewport, layout, deliverables, method]
status: stable
generated: { by: "claude", at: "2026-08-24T20:44:00-04:00" }
---

# Ask for the viewport rather than detecting the display

A monitor's resolution is not the space a page gets. Between the two sit at
least six independent things, and none of them is visible from the machine's
display configuration:

1. **which monitor** the page is opened on
2. whether the window is **maximised**
3. **browser chrome** - tabs, address bar, status area
4. an optional **bookmarks bar**
5. a **sidebar**, extension panel or reading pane
6. **page zoom** and **OS display scaling**, which stack

Detection can express exactly one arrangement: maximised, on the primary display,
at 100%. It cannot express "half-width on the second monitor", which is a
completely ordinary way to read a report, and it will not say that it cannot -
it returns a plausible number, the same silent-wrong-answer shape as
[a capacity read from the wrong API](/process/a-capacity-read-from-the-wrong-api).

## Send a probe, and launch it yourself

The reliable instrument is a small page that **reports its own size**, opened and
dragged to where the deliverable will actually be read. It measures the thing
that matters - the space this page will have, in the window it will be in - and
it is immune to every layer above.

**Launch the probe yourself.** Do not hand over a command to run and a number to
read back. That turn costs the reader more than the whole measurement is worth,
and the number that comes back is frequently the wrong one of several the probe
prints. Open it, ask them to move the window where they want the report, and read
the value.

Record the measured viewport with the deliverable. A page designed for a size
nobody wrote down cannot be checked later, and the next revision will be designed
for a different one without anyone noticing.

## The viewport is an input, not a pass/fail gate

Having measured it, do not turn it into a test the design must pass. It is one
constraint among several, and the others include being readable.

**When the space is genuinely small, say so plainly** and negotiate:

- state that not everything fits
- agree what earns the top of the page - the finding, the counts, the thing they
  asked for
- accept scrolling for the rest, deliberately, and say what is below the fold

**Do not shrink type until it fits.** An unreadable page that fits is not a win;
it is the same page plus a new problem. Type size, contrast and spacing are the
part of a deliverable that determines whether it is read at all, and trading them
for a fit metric optimises the measurement instead of the artefact.

The same applies to cramming: three columns where two would breathe, a table with
its labels abbreviated to initials, a chart with its legend removed. Each of
those buys height by spending comprehension.

## Spend headroom against the worst state, not the current one

If the page has any state that changes its size - a collapsible section, a
filter, an expandable table, a details block - **the only correct scale is the
largest at which every state still fits.**

The worked case: with an optional section collapsed a page had visible room, and
a generous increase looked safe. With that section expanded, a **smaller**
increase overflowed. Sizing against the collapsed state produced a page that was
fine until somebody clicked the thing that was there to be clicked.

So before sizing:

1. **Enumerate the states.** Every toggle, every expansion, every "show all".
2. **Measure the largest one**, not the one currently on screen.
3. **Design against that**, and let the smaller states have slack. Slack in the
   collapsed state costs nothing; overflow in the expanded state is the bug the
   reader finds.

## Related

- [A fit measurement can be true and useless](/process/a-fit-measurement-can-be-true-and-useless) - why a height number cannot tell you the page is fine
- [A generator needs three guards, and all of them are cheap](/process/writing-a-generator-that-cannot-eat-its-own-source) - the same rule about never assuming one machine's numbers
