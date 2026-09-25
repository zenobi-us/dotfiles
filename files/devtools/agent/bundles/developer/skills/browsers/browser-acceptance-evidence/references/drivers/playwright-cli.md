# Driver: playwright-cli

Status: **ready**

Drives a headless Chrome through the `playwright-cli` daemon. Each session gets
its own in-memory profile: no existing logins, no extensions, no shared
cookies. That makes a run repeatable from zero, safe to run without the
operator at the keyboard, and safe to run beside the user's own browser.

For the command surface itself, load the `playwright-cli` skill. This reference
covers only what acceptance evidence needs on top of it.

Facts below were verified against `playwright-cli 0.1.18` on WSL2. When a
command behaves differently, fix this file before you fix the run.

## Choose this driver or surf

| | playwright-cli | surf |
|---|---|---|
| Profile | Fresh, in-memory, per session | The user's real Chrome profile |
| Login | You drive it, or you load a saved state | Already signed in |
| Operator | Not needed | Window must hold focus |
| `window.open` from a click | **Captured.** The tab appears. | Suppressed. `PARTIAL` at best. |
| Runs unattended | Yes | No |

The popup row is the reason to prefer this driver for any flow that opens a
tab. Under surf that step can never be better than `PARTIAL`.

## 0. Environment. MUST.

```sh
export NO_UPDATE_NOTIFIER=1
```

The update notice is written to the same stream as the result, and a caller
that parses the output reads it as a tool failure. In this repository
`payroll-login.sh` reports it as `browser-probe-failed`.

## 1. Claim a session. MUST.

```sh
export PLAYWRIGHT_CLI_SESSION="<work-id>"
playwright-cli open about:blank
```

One session per work item. Every later command picks the name up from the
environment. Use `-s=<work-id>` instead when a single shell drives two sessions.

A session owns its cookies, storage, cache, history and tabs. A second agent
cannot retarget your commands, because it holds a different session name.

Check and tear down:

```sh
playwright-cli list                 # every open session
playwright-cli close                # close this session
playwright-cli delete-data          # drop its profile directory
```

The profile is in-memory unless you pass `--persistent` or `--profile=<dir>` to
`open`. Keep it in-memory. A run that needs the profile to survive is a run
whose preconditions are not written down.

Headless is the default. Pass `--headed` only to watch a flow you are
debugging. Screenshots are identical either way.

## 2. Codify the plan as script files. MUST.

The plan is a script. Write it as one.

Each test in `test-plan.md` becomes one script file:

```
./.playwright/acceptance/<work-id>-test-1.js
./.playwright/acceptance/<work-id>-test-2.js
```

One script **per test**, not one for the whole plan. A script drives but does
not record, so the boundary between scripts is where you stop and write
evidence.

```js
// <work-id>-test-1.js
// Test 1 - the upgrade banner opens the billing page.
// Run: playwright-cli run-code --filename=<abs path to this file>
async (page) => {
  const shots = '/abs/path/to/report/shots';
  const base = 'http://app.localhost:8090';
  const seen = [];

  await page.goto(`${base}/settings/payments`);
  await page.screenshot({ path: `${shots}/11-settings.png` });
  seen.push({ step: '1.1', url: page.url() });

  const upgrade = page.getByRole('link', { name: 'Upgrade now' });
  seen.push({ step: '1.4', href: await upgrade.getAttribute('href') });
  await upgrade.click();
  await page.screenshot({ path: `${shots}/14-portal.png` });

  return seen;
};
```

Rules for the script file:

- The file **MUST** hold one function expression and nothing else. The runner
  wraps it in `(...)` and evaluates it. `import`, `export` and `require` fail.
- Step order **MUST** mirror the numbered steps in `test-plan.md`. A reviewer
  reads the plan and the script side by side.
- Every step that needs proof **MUST** end in a `page.screenshot({ path })`
  whose path is the step's evidence path, so the file names line up with
  `evidence.jsonl` without renaming.
- The script **MUST** return the values you cannot see in a screenshot: the
  url, an `href`, an attribute, a text content. That return value is what you
  paste into `evidence.jsonl`.
- You **MUST NOT** write a username, password, token or MFA code into the
  script. The file is an artifact that gets copied into shared context. See
  section 6.
- Prefer a stable locator: `getByRole`, `getByTestId`, `getByLabel`, an `href`.
  A snapshot ref such as `e46` is valid only inside one page read and
  **MUST NOT** appear in a script file.

### The sandbox has one global

`run-code` evaluates the function with `page` and nothing else. `process`,
`require` and `globalThis.fetch` are all absent, verified:

```sh
playwright-cli run-code "async page => ({ p: typeof process, r: typeof require })"
# {"p":"undefined","r":"undefined"}
```

So a script **cannot** read an environment variable. Parameters are literals in
the file. That is the reason secrets never go in one: there is no other place
to put them, and the file is a deliverable.

## 3. Resolve, syntax-check, then run. MUST, in that order.

`playwright-cli` has no `--dry-run`. These two passes replace it. Skipping them
half-executes a flow and leaves the app in a state the next test does not
expect.

```sh
# 1. Resolve every locator the script uses, against the live page.
playwright-cli open "$BASE/settings/payments"
playwright-cli --raw find "Upgrade now"
playwright-cli --raw generate-locator e5

# 2. Syntax-check the file.
node --check ./.playwright/acceptance/<work-id>-test-1.js

# 3. Run it.
playwright-cli run-code --filename="$PWD/.playwright/acceptance/<work-id>-test-1.js"
```

`node --check` accepts the bare function expression as written, verified. It
catches a syntax error and nothing else. A locator that no longer matches still
gets through, so the resolve pass is the real gate. Do not pass the file
through process substitution: `node` cannot read a pipe, and the check exits 0
after printing an `ENOENT` it never applied.

### Selector capture

`generate-locator` turns a snapshot ref into the real locator expression. That
string is the `resolved` field in `evidence.jsonl`, and it is also what belongs
in the script file.

```sh
playwright-cli --raw generate-locator e3
# getByRole('button', { name: 'Open portal' })
```

`click`, `fill` and the rest accept that expression directly, so no ref ever
has to reach the script:

```sh
playwright-cli click "getByRole('button', { name: 'Continue', exact: true })"
```

### Screenshot paths

`--filename` and `path` resolve against the current working directory, and
neither one creates a missing directory. A missing `shots/` directory fails
with `ENOENT` after the action already ran.

```sh
mkdir -p "$SHOTS"                       # MUST, before the first shot
playwright-cli screenshot --filename="$SHOTS/11-settings.png"   # absolute
```

Point `$SHOTS` at the report's `shots/` directory from the start, so nothing
needs moving later.

## 4. Record evidence between scripts. MUST.

A script reports what it did; it does not decide whether that satisfies the
plan. After each script run:

```sh
playwright-cli --raw eval "location.href"
playwright-cli --raw find "<the thing>"
playwright-cli tab-list
playwright-cli console
```

Then append this test's records to `evidence.jsonl`, including the resolved
locator from `generate-locator`. Only then start the next test's script.

`--raw` strips the page header, the generated code and the snapshot section, so
the output is the value alone. Use it for everything you paste into evidence.

## 5. Popup behaviour. Verified.

A `window.open` called from a synthesized click **does** open a tab under this
driver. So does a `target="_blank"` link. Reproduction:

```sh
playwright-cli -s=probe open about:blank
playwright-cli -s=probe run-code "async page => page.setContent('<button onclick=\"window.open(\'https://example.com/\')\">Open</button>')"
playwright-cli -s=probe click "getByRole('button', { name: 'Open' })"
playwright-cli -s=probe --raw tab-list
# - 0: (current) [Popup probe](about:blank)
# - 1: [Example Domain](https://example.com/)
```

Consequences for the verdict:

- A popup step that is `PARTIAL` under surf can be a real `PASS` here. You
  **MUST** prove it the same way as any other step: switch to the new tab and
  screenshot it.
- The new tab is **not** selected by the click. Tab 0 stays current. Run
  `playwright-cli tab-select 1` before you read or screenshot the popup.
- `tab-list` before and after the click is the cheapest proof that the tab is
  new and not a leftover.

## 6. Authentication. MUST pick one, and MUST say which in the report.

**Option A - drive the login, once, as evidence.** Preferred when the sign-in
is part of what you are proving, or when no helper exists. Type secrets from a
shell variable read from a gitignored file. `playwright-cli` echoes its
arguments, so filter the output.

**Option B - a repository login helper.** In this repository the
`reckon-frontend-dev-servers` skill owns the whole journey and never prints a
secret:

```sh
.agents/skills/reckon-frontend-dev-servers/scripts/payroll-login.sh login -s "$PLAYWRIGHT_CLI_SESSION"
```

It leaves the session open for evidence capture. Pass the same session name to
every later `playwright-cli` call.

**Option C - a saved storage state.** Acceptable only when the run that
produced the state is itself in the report, or in a report this one links to. A
`storageState` file alone is not evidence of a logged-in run: it proves a
session existed, not that this run used a real one.

```sh
playwright-cli state-save "$MT/auth.json"     # absolute path, verified
playwright-cli open about:blank               # MUST come first
playwright-cli state-load "$MT/auth.json"
playwright-cli goto "$BASE"
```

`state-load` fails with `The browser '<name>' is not open` when no session is
open. The order above is the working one.

The state file holds live cookies. You **MUST NOT** copy it into the report's
`files/` directory or into shared context.

## 7. Copy the scripts into shared context. MUST.

```sh
cp ./.playwright/acceptance/<work-id>-test-*.js "<root>/<work-id>/manual-tests/workflows/"
cp ./.playwright/acceptance/<work-id>-test-*.js "<root>/<work-id>/manual-tests/report/files/"
```

They are a deliverable. The next person re-runs the test instead of re-reading
it, and a regression later has a script waiting for it.

The report links the second copy as `files/<name>`, never as
`../workflows/<name>`. The shared-context copy is the source of truth; the
report copy is the one that survives the report being zipped and sent on.

## playwright-cli traps

- **`file:` is blocked.** `open file:///...` fails with
  `Access to "file:" protocol is blocked`. Serve a fixture over HTTP, or build
  it with `page.setContent` inside `run-code`.
- **`--filename` does not create directories.** `mkdir -p` the shots directory
  before the first screenshot, or lose the shot to `ENOENT` after the action
  already happened.
- **Snapshots land in the working directory.** Every command writes
  `./.playwright-cli/page-<timestamp>.yml`. Run from a directory where that is
  gitignored. It is gitignored in this repository.
- **Refs are per-read.** `e46` changes on every navigation and re-render.
  Re-read before you click, and record what `generate-locator` resolved it to.
- **`run-code` returns 0 even when a locator is missing.** The exit code is not
  a verdict. Read the returned value and assert on it yourself.
- **A dialog wedges the session.** A `beforeunload` guard puts the CLI in a
  modal state where every command fails. Clear it with
  `playwright-cli dialog-accept`, then retry. If that fails, `close` the
  session and open a new one.
- **`playwright-cli` echoes its arguments.** Pass secrets through a shell
  variable read from a gitignored file, and filter tool output through `sed`
  when a value could appear.
- **Sessions outlive the shell.** The daemon keeps them. `playwright-cli list`
  before you claim a name, and `close` plus `delete-data` when you finish.
  `kill-all` is for a wedged daemon, and it takes every session with it.

## Quick reference

| Need | Command |
|---|---|
| List sessions | `playwright-cli list` |
| Claim session | `export PLAYWRIGHT_CLI_SESSION="<work-id>"; playwright-cli open about:blank` |
| Where am I | `playwright-cli --raw eval "location.href"` |
| Find an element | `playwright-cli --raw find "Upgrade now"` |
| Resolve a ref | `playwright-cli --raw generate-locator e5` |
| Click a stable locator | `playwright-cli click "getByRole('link', { name: 'Upgrade now' })"` |
| Evidence shot | `playwright-cli screenshot --filename="$SHOTS/NN-slug.png"` |
| New tabs after a click | `playwright-cli tab-list` then `playwright-cli tab-select 1` |
| Page errors | `playwright-cli console` |
| Failed requests | `playwright-cli requests` |
| Run a test script | `playwright-cli run-code --filename="$PWD/.playwright/acceptance/<work-id>-test-1.js"` |
| Save a login | `playwright-cli state-save "$MT/auth.json"` |
| Tear down | `playwright-cli close && playwright-cli delete-data` |
