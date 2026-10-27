# Driver: surf CLI

Status: **ready, attended only.**

Drives a real Chrome through the `surf` extension and native host. The browser
keeps the user's profile, so existing logins, cookies and extensions are all
live. That makes surf the right driver when signing in from zero is expensive
or needs a second factor.

Surf drives a **visible** Chrome. A screenshot fails when the session tab is not
the active tab in its window, so surf **cannot** capture evidence unattended.
Prefer `playwright-cli` for any run that has to produce screenshots with nobody
at the keyboard, and for any flow that opens a popup.

For the surf command surface itself, load the `surf` skill. This reference
covers only what acceptance evidence needs on top of it. The step-schema table
and the `--json` contract live in that skill's `references/advanced-features.md`.
Read them before you debug a generated workflow; you never write one by hand.

## What `browser-evidence.ts` does for surf

Set `driver: "surf"` in `plan.ts` (or `init --driver surf`), then use the same
commands as any driver: `render`, `compile`, `run`, `verdicts`, `report`. You do
not write or run a workflow by hand. `run` does the following, each because a
real run failed without it:

| `run` does this | Because |
|---|---|
| `session.ensure`, then `tab.switch` to the session's tab | A fresh session window is unfocused, and every screenshot in it fails with `screenshot_target_not_visible` |
| `navigate about:blank` before each test | A same-document navigate (query or hash change) fires no load event, so the workflow's first `navigate` hangs for 60 s |
| Retries a test once when it stalls on its first navigate | That stall still happens now and then from `about:blank`; the second attempt passes |
| Passes `--shots <manual-tests>/report/shots` | The report reads screenshots from there |
| Rebuilds `evidence.jsonl` from `--json` with the step map `compile` wrote (`workflows/<work-id>-test-N.map.json`) | A workflow returns only a status per workflow step and its `as` captures; it cannot build records |
| Captures `location.href` after every navigate and click | `--json` has no URL, and a record without one proves nothing about which page or tenant |
| Closes the session at the end | The session is a window in the developer's own Chrome |

`compile` writes every assertion as a `js` step that throws, and polls it for
up to `timeoutMs` first. Surf has no working assertion keyword: `expect`,
`when`, `if`, `retry`, `continueOnError` and `until` are accepted by
`workflow.validate` and ignored by the runner, so a failing `expect` reports
`ok`. An `expect` with a `shot` is shot both before and after its check, so a
failure halts the workflow with an image and a pass shows the settled page.

What stays yours:

- **Keep the session window in front for the whole run.** If you focus another
  tab, every later screenshot fails.
- **Write locators as CSS.** Every surf locator reaches
  `document.querySelector`. Quote an attribute value that starts with a digit:
  `.ag-row[row-index="0"]`.
- **Click a hidden checkbox through its label with `dom: true`.** A
  synthesized pointer click on a styled checkbox lands on its icon.
- **Put a `scroll` before a click below the fold.** `click --selector` does not
  scroll, and a click into empty space still reports ok.

## surf-specific traps

- **A screenshot needs a visible tab.** `screenshot_target_not_visible` is the
  error, no file is written, and it fires after the earlier actions already
  ran. Run `tab.switch` once when you claim the session. If the user focuses
  another tab mid-run, every later shot fails the same way.
- **`surf click --selector` does not scroll into view.** It dispatches at the
  element's coordinates, so a control below the fold — a pager under a long
  grid, a footer button — is clicked into empty space. The step reports `ok`
  and nothing happens. `locate.role --action click` does scroll first, but a
  workflow cannot call it, so put a `{ do: "scroll", locator }` step in the
  plan before any click on something that may be off-screen.
- **`surf click` does not beat the popup blocker.** A `window.open` in a new
  tab is suppressed for a synthesized click. `tab.list` shows no new tab and
  the console shows no error. Do not retry it a third time. Record `PARTIAL`,
  capture the `href` or the served config value as supporting evidence, and
  name the human click in the report. `playwright-cli` captures that popup and
  can reach a real `PASS` — prefer it when a test opens a tab.
- **Six step keys do nothing.** `expect`, `when`, `if`, `retry`,
  `continueOnError`, `until`. The validator accepts all of them. `compile`
  never emits them; it asserts with `js` steps that throw (see the section
  above). Keep them out of any workflow you write for debugging, too.
- **A loop's `as` keeps only the last iteration.** Collect per-iteration values
  by returning an array from one `js` step, not by looping with `as`.
- **`surf read --compact` prints the whole page text after the tree.** Always
  bound it: `sed -n '/^\[surf/,/^\[Viewport/p'`, `grep -i`, or `surf search`.
  An unfiltered read of a real app costs thousands of tokens.
- **Refs are per-read.** `e46` changes on every navigation and re-render.
  Re-read before you click, and record what the ref resolved to.
- **`surf type` echoes its argument.** Pass secrets through a shell variable
  read from a gitignored file, and filter tool output through `sed` when a
  value could appear.
- **Surf shares the user's Chrome.** You are driving a real browser with real
  sessions. Do not click destructive controls in a production tab, and put the
  session in its own window (`session.new` defaults to one).

## Quick reference

| Need | Command |
|---|---|
| Health check | `surf doctor` |
| Claim session | `surf session.ensure "$SURF_SESSION" about:blank` |
| Make the tab visible | `surf tab.switch <tab-id>` |
| Where am I | `surf page.state` |
| Find an element | `surf locate.role link --name "Upgrade now"` |
| Find text | `surf search "Upgrade"` |
| Bounded tree read | `surf read --compact \| sed -n '/^\[surf/,/^\[Viewport/p'` |
| Evidence shot | `surf snap --output "$SHOTS/NN-slug.png"` |
| New tabs after a click | `surf tab.list` |
| Page errors | `surf console` |
| Validate a workflow | `surf workflow.validate "$WF"` (absolute path) |
| Run every test | `browser-evidence.ts run "$MT"` |
| Run one test | `browser-evidence.ts run "$MT" --test N` |
| Re-run one workflow by hand | `surf do "$WF" --base "$BASE" --shots "$MT/report/shots" --json` |
