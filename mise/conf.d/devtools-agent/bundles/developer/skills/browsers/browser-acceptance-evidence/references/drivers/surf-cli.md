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
and the `--json` contract live in that skill's `references/advanced-features.md`
and you **MUST** read them before writing a workflow.

## 1. Claim a session, then make its tab visible. MUST.

```sh
export SURF_SESSION="<work-id>"
surf session.ensure "$SURF_SESSION" about:blank
surf tab.switch "$(surf page.state | grep -oE 'tab=[0-9]+' | head -1 | cut -d= -f2)"
```

One session per work item. A session owns one tab, so a second agent or a
Chrome focus change cannot retarget your commands mid-test.

The `tab.switch` is not optional. `session.ensure` opens an unfocused window,
and in that state every `screenshot` fails with
`screenshot_target_not_visible` — **after** the actions before it already ran,
leaving the app in a state the next test does not expect.

## 2. Codify the plan as surf workflow files. MUST.

The plan is a script. Write it as one.

Each test in `test-plan.md` becomes one workflow file, written **straight to
shared context**:

```
<root>/<work-id>/manual-tests/workflows/<work-id>-test-1.json
<root>/<work-id>/manual-tests/workflows/<work-id>-test-2.json
```

You **MUST NOT** create `./.surf/workflows/` inside the repository under test.
Surf has no setting that moves its search path, but `surf do` treats any
argument containing `/` or ending in `.json` as a file path, so an absolute
path works from anywhere. Writing the file to its destination also removes a
copy step.

One workflow **per test**, not one for the whole plan. A workflow drives but
does not decide, so the boundary between workflows is where you stop and write
evidence. One giant workflow gives you one undifferentiated run and nothing to
attach a verdict to.

```json
{
  "name": "acme-42-test-1",
  "description": "Test 1 - the upgrade banner opens the billing page",
  "args": {
    "base":  { "required": true, "desc": "App base URL" },
    "shots": { "required": true, "desc": "Absolute directory for evidence screenshots" }
  },
  "steps": [
    { "tool": "navigate",   "args": { "url": "%{base}/settings/payments" } },
    { "tool": "wait.load",  "args": {} },
    { "tool": "screenshot", "args": { "output": "%{shots}/11-settings.png" } },
    { "tool": "wait.element", "args": { "selector": "[data-testid=upgrade]" } },

    { "tool": "js", "args": { "code":
      "var a=document.querySelector('[data-testid=upgrade]'); if(!a) throw new Error('ASSERT FAIL: no upgrade link'); return a.getAttribute('href')" },
      "as": "upgradeHref" },

    { "tool": "click", "args": { "selector": "[data-testid=upgrade]" } },
    { "tool": "wait.load", "args": {} },

    { "tool": "js", "args": { "code":
      "var u=location.href; if(!/portal\\./.test(u)) throw new Error('ASSERT FAIL: expected portal, got '+u); return u" },
      "as": "portalUrl" },

    { "tool": "screenshot", "args": { "output": "%{shots}/14-portal.png" } }
  ]
}
```

Rules for the workflow file:

- Step order **MUST** mirror the numbered steps in `test-plan.md`. A reviewer
  reads the plan and the workflow side by side.
- Every step that needs proof **MUST** end in a `screenshot` whose `output`
  path is the step's evidence path, so the file names line up with
  `evidence.jsonl` without renaming.
- Screenshot paths **MUST** be absolute, passed in as a `%{shots}` arg. A
  relative path resolves against the working directory, not the report.
- Secrets **MUST** go through `args` and `%{...}` placeholders. You
  **MUST NOT** write a username, password, token or MFA code into the workflow
  file. The file is an artifact that gets copied into the report.
- Prefer a stable selector: a test id, a role plus name, an `href`. A tool ref
  such as `e46` is valid only inside one page read and **MUST NOT** appear in a
  workflow file.
- A `screenshot` **MUST** come before the first `wait` that can time out. A
  halted run stops where it halted, so a `wait.element` timeout placed before
  the first shot leaves a `FAIL` with no image. Navigate, settle, shoot the
  landing state, then wait for the specific element.
- You **MUST NOT** capture a whole page read with `"as"`. `page.read` into a
  variable puts thousands of tokens of tree into `vars` and into every later
  interpolation. Return the specific fields you need from a `js` step instead.

### Assert by throwing. MUST.

A workflow has no working assertion keyword. Verified against surf v2.20.0,
`expect`, `when`, `if`, `retry`, `continueOnError` are accepted by
`workflow.validate` and **ignored by the runner**, and `until` runs every
iteration without ever exiting its loop. A step with a failing `expect` reports
`ok`.

You **MUST NOT** use any of those six keys. A plan that asserts with `expect`
produces a report where every verdict is `PASS`, which is the exact failure this
skill exists to prevent.

The only deterministic assertion is a `js` step that throws:

```json
{ "tool": "js", "args": { "code":
  "var t=document.querySelector('h2.banner__title'); if(!t) throw new Error('ASSERT FAIL: banner missing'); return t.innerText.trim()" },
  "as": "bannerTitle" }
```

A throw fails the step, halts the run, and puts the message in the `--json`
output where it becomes the `observed` field of a `FAIL` record. Write the
message so it reads as evidence: say what was expected and what was found.

You **MUST NOT** use `semantic.step` with `"op": "assert"` for a verdict. That
op sends the page to a model and returns a confidence judgement. You **MAY**
use `semantic.find` to locate an element, then assert on it by throwing.

## 3. Validate, then run. MUST, in that order.

```sh
WF="<root>/<work-id>/manual-tests/workflows/<work-id>-test-1.json"
surf workflow.validate "$WF"
surf do "$WF" --base "$BASE" --shots "$SHOTS" --json
```

You **MUST** pass the absolute path. A bare name reaches only two hardcoded
directories, and a miss does not error — surf parses the name as an inline
command and runs one bogus step.

`--dry-run` parses and validates only. It does **not** open the page or check a
selector, so it is not a selector gate. Resolve selectors against the live page
first:

```sh
surf locate.role link --name "Upgrade now"
surf search "Upgrade"
```

## 4. Record evidence from `--json`. MUST.

A workflow reports what it did; it does not decide whether that satisfies the
plan. `--json` is the machine-readable report, and `vars` carries every `as`
capture. Read evidence from there, not from a second manual page read.

```json
{
  "status": "failed",
  "completedSteps": 5,
  "totalSteps": 8,
  "results": [
    { "step": 1, "cmd": "navigate", "status": "ok", "ms": 836 },
    { "step": 6, "cmd": "js", "status": "error",
      "error": "Error: ASSERT FAIL: expected portal, got https://app.example.invalid/settings", "ms": 12 }
  ],
  "error": "Error: ASSERT FAIL: expected portal, got https://app.example.invalid/settings",
  "totalMs": 6159,
  "vars": { "base": "...", "shots": "...", "upgradeHref": "https://portal.example.invalid/" }
}
```

`vars` **survives a failed run**, so captures from the steps before the failure
are still readable. That is what turns a halt into a usable `FAIL` record
instead of a lost run.

Map it onto `evidence.jsonl`:

| Evidence field | Source |
|---|---|
| `resolved` | the `as` capture that holds the `href`, selector or test id |
| `url` | an `as` capture of `location.href`, or the capture before the failure |
| `screenshot` | the `output` path of that step's `screenshot` |
| `observed` | the `as` value on success; the `error` string on a throw |
| `verdict` | `PASS` when `status` is `completed`; `FAIL` on an `ASSERT FAIL` throw |

A run that halts on a missing element is `BLOCKED`, not `FAIL`, until the
precondition is proved. Check the precondition before you write the record.

Append this test's records, then start the next test's workflow.

## 5. Copy the workflows into the report. MUST.

The workflows already live in shared context, so there is one copy to make:

```sh
cp "<root>/<work-id>/manual-tests/workflows/"<work-id>-test-*.json \
   "<root>/<work-id>/manual-tests/report/files/"
```

They are a deliverable. The next person re-runs the test instead of re-reading
it, and a regression later has a script waiting for it.

The report links that copy as `files/<name>`, never as `../workflows/<name>`.
The shared-context copy is the source of truth; the report copy is the one that
survives the report being zipped and sent on.

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
  `continueOnError`, `until`. The validator accepts all of them. See the
  assertion section above.
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
| Run a workflow | `surf do "$WF" --base "$BASE" --shots "$SHOTS" --json` |
