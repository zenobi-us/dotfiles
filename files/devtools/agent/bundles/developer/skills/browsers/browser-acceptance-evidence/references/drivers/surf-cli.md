# Driver: surf CLI

Status: **ready**

Drives a real Chrome through the `surf` extension and native host. The browser
keeps the user's profile, so existing logins, cookies and extensions are all
live. That makes surf the right driver when signing in from zero is expensive
or needs a second factor.

For the surf command surface itself, load the `surf` skill. This reference
covers only what acceptance evidence needs on top of it.

## 1. Claim a session. MUST.

```sh
export SURF_SESSION="<work-id>"
surf session.ensure "$SURF_SESSION" about:blank
```

One session per work item. A session owns one tab, so a second agent or a
Chrome focus change cannot retarget your commands mid-test. Every later command
picks the session up from the environment.

## 2. Codify the plan as surf workflow files. MUST.

The plan is a script. Write it as one.

Each test in `test-plan.md` becomes one workflow file:

```
./.surf/workflows/<work-id>-test-1.json
./.surf/workflows/<work-id>-test-2.json
```

One workflow **per test**, not one for the whole plan. A workflow drives but
does not record, so the boundary between workflows is where you stop and write
evidence. One giant workflow gives you one undifferentiated run and nothing to
attach a verdict to.

```json
{
  "name": "acme-42-test-1",
  "description": "Test 1 - the upgrade banner opens the billing page",
  "args": {
    "base": { "required": true, "desc": "App base URL" },
    "user": { "required": true, "desc": "Login username" },
    "pass": { "required": true, "desc": "Login password" }
  },
  "steps": [
    { "tool": "navigate",   "args": { "url": "%{base}/settings/payments" } },
    { "tool": "wait.load",  "args": {} },
    { "tool": "screenshot", "args": { "output": "shots/11-settings.png" } },
    { "tool": "page.read",  "args": { "compact": true }, "as": "tree" },
    { "tool": "click",      "args": { "selector": "a[data-testid='upgrade']" } },
    { "tool": "wait.load",  "args": {} },
    { "tool": "screenshot", "args": { "output": "shots/14-portal.png" } }
  ]
}
```

Rules for the workflow file:

- Step order **MUST** mirror the numbered steps in `test-plan.md`. A reviewer
  reads the plan and the workflow side by side.
- Every step that needs proof **MUST** end in a `screenshot` whose `output`
  path is the step's evidence path, so the file names line up with
  `evidence.jsonl` without renaming.
- Secrets **MUST** go through `args` and `%{...}` placeholders. You
  **MUST NOT** write a username, password, token or MFA code into the workflow
  file. The file is an artifact that gets copied into shared context.
- Prefer a stable selector: a test id, a role plus name, an `href`. A tool ref
  such as `e46` is valid only inside one page read and **MUST NOT** appear in a
  workflow file.

## 3. Validate, dry run, then run. MUST, in that order.

```sh
surf workflow.validate ./.surf/workflows/<work-id>-test-1.json
surf do <work-id>-test-1 --dry-run --base "$BASE"
surf do <work-id>-test-1 --base "$BASE" --user "$U" --pass "$P"
```

`--dry-run` catches a bad selector before it half-executes a flow and leaves
the app in a state the next test does not expect.

## 4. Record evidence between workflows. MUST.

A workflow reports what it did; it does not decide whether that satisfies the
plan. After each workflow run:

```sh
surf page.state
surf read --compact | grep -i "<the thing>"
```

Then append this test's records to `evidence.jsonl`, including the resolved
selector from the page read. Only then start the next test's workflow.

## 5. Copy the workflows into shared context. MUST.

```sh
cp ./.surf/workflows/<work-id>-test-*.json "<root>/<work-id>/manual-tests/workflows/"
```

They are a deliverable. The next person re-runs the test instead of re-reading
it, and a regression later has a script waiting for it.

Copy them a second time into the report's own `files/` directory:

```sh
cp ./.surf/workflows/<work-id>-test-*.json "<root>/<work-id>/manual-tests/report/files/"
```

The report links that copy as `files/<name>`, never as `../workflows/<name>`.
The shared-context copy is the source of truth; the report copy is the one
that survives the report being zipped and sent on.

## surf-specific traps

- **`surf click` does not beat the popup blocker.** A `window.open` in a new
  tab is suppressed for a synthesized click. `tab.list` shows no new tab and
  the console shows no error. Do not retry it a third time. Record `PARTIAL`,
  capture the `href` or the served config value as supporting evidence, and
  name the human click in the report.
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
- **`surf snap --output` writes where you tell it.** Point it at the report's
  `shots/` directory from the start, so nothing needs moving later.

## Quick reference

| Need | Command |
|---|---|
| Health check | `surf doctor` |
| Claim session | `surf session.ensure "$SURF_SESSION" about:blank` |
| Where am I | `surf page.state` |
| Find an element | `surf locate.role link --name "Upgrade now"` |
| Find text | `surf search "Upgrade"` |
| Bounded tree read | `surf read --compact \| sed -n '/^\[surf/,/^\[Viewport/p'` |
| Evidence shot | `surf snap --output <report>/shots/NN-slug.png` |
| New tabs after a click | `surf tab.list` |
| Page errors | `surf console` |
| Validate a workflow | `surf workflow.validate ./file.json` |
| Run a workflow | `surf do <name> --arg value` |
