# Driver: Playwright

Status: **TODO — do not use**

This driver is not written. If the work needs Playwright, stop and tell the
user that the driver reference is a stub, then either use the `surf` driver or
agree to write this one first.

You **MUST NOT** improvise Playwright steps from general knowledge and call the
result acceptance evidence. The value of a driver reference is the traps it
records, and this one records none yet. A run driven from memory produces a
report whose failures cannot be told apart from tool mistakes.

## Why it is wanted

Playwright gives a clean isolated profile: no existing logins, no extensions,
no shared cookies. That makes a run repeatable from zero and safe to hand to
CI, where surf's live-browser model does not fit.

## What the author must resolve before this file loses its TODO

1. **Session and profile isolation.** How a run claims its own browser context,
   how state carries between the tests of one plan, and how it is torn down.
2. **Selector capture.** The `resolved` field in `evidence.jsonl` needs a real
   selector, not a handle. Decide what Playwright records and how it is read
   back out of a locator.
3. **Screenshot naming.** How a step writes straight into the report's `shots/`
   directory with the `NN-slug.png` name, without a rename pass.
4. **Popup behaviour — the interesting one.** Under surf, a `window.open` from
   a synthesized click is suppressed by the popup blocker and the step can only
   be `PARTIAL`. Playwright's `context.on('page')` may capture that popup
   instead, which would turn a `PARTIAL` into a real `PASS`. Confirm this, with
   a reproduction, and say so plainly. It is the strongest argument for the
   driver existing at all.
5. **Authentication.** Whether a stored `storageState` is acceptable evidence
   of a logged-in run, or whether the login itself must be in the plan.
6. **The plan-as-script requirement.** The surf driver requires the plan be
   codified as workflow files that ship with the report. Decide the Playwright
   equivalent — a spec file, a script, or a trace — and require it the same
   way. A driver that leaves nothing re-runnable is weaker than the one it
   sits beside.

## Before writing it

Read `references/drivers/surf-cli.md` first. This file must cover the same
ground in the same order, so a reader can switch drivers without relearning the
procedure.
