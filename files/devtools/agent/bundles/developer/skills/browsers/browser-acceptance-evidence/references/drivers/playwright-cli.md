# Driver: playwright-cli

Status: **ready. The default driver.**

Drives a headless Chrome through the `playwright-cli` daemon. Each session gets
its own in-memory profile: no existing logins, no extensions, no shared
cookies. That makes a run repeatable from zero, safe to run without the
operator at the keyboard, and safe to run beside the user's own browser.

For the command surface itself, load the `playwright-cli` skill. This reference
covers only what acceptance evidence needs on top of it.

Facts below were verified against `playwright-cli 0.1.22` on WSL2. When a
command behaves differently, fix this file before you fix the run.

## Choose this driver or surf

| | playwright-cli | surf |
|---|---|---|
| Profile | Fresh, in-memory, per session | The user's real Chrome profile |
| Login | You drive it, or you load a saved state | Already signed in |
| Operator | Not needed | Window must hold focus |
| Screenshot | Works headless | Fails unless the session tab is visible |
| `window.open` from a click | **Captured.** The tab appears. | Suppressed. `PARTIAL` at best. |
| Assertion | A throw, and the exit code reports it | A throw inside a `js` step |
| Runs unattended | Yes | No |

The screenshot and popup rows are why this is the default. Under surf, an
unattended run captures nothing and a popup step can never beat `PARTIAL`.
Choose surf only when a live login is worth those costs.

## 0. Environment and version. MUST.

```sh
export NO_UPDATE_NOTIFIER=1
```

The update notice is written to the same stream as the result, and a caller
that parses the output reads it as a tool failure. In this repository
`payroll-login.sh` reports it as `browser-probe-failed`.

The `playwright-cli` mise shim may have no version set, which fails with
`No version is set for shim: playwright-cli`. Check before the run:

```sh
mise ls | grep playwright
playwright-cli --version
```

If the shim is unpinned, pin it or call the installed binary by path. You
**MUST** record the version you ran in the report's environment line.

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

Each test in `test-plan.md` becomes one script file, written **straight to
shared context**:

```
<root>/<work-id>/manual-tests/workflows/<work-id>-test-1.js
<root>/<work-id>/manual-tests/workflows/<work-id>-test-2.js
```

You **MUST NOT** write these into the repository under test. A repository holds
code, not session output, and the scripts are a report deliverable. Writing
them to their destination also removes a copy step.

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
  const href = await upgrade.getAttribute('href');
  if (!href) throw new Error('ASSERT FAIL: upgrade link has no href');
  seen.push({ step: '1.4', href });

  await upgrade.click();
  await page.screenshot({ path: `${shots}/14-portal.png` });

  const url = page.url();
  if (!/portal\./.test(url)) throw new Error(`ASSERT FAIL: expected portal, got ${url}`);
  seen.push({ step: '1.5', url });

  return seen;
}
```

Rules for the script file:

- The file **MUST** hold one function expression and nothing else. The runner
  wraps it in `(...)` and evaluates it. `import`, `export` and `require` fail.
- The file **MUST NOT** end with a semicolon after the closing brace. A
  trailing `};` fails with `SyntaxError: Unexpected token ';'`, and
  `node --check` does **not** catch it. See section 3.
- Step order **MUST** mirror the numbered steps in `test-plan.md`. A reviewer
  reads the plan and the script side by side.
- Every step that needs proof **MUST** end in a `page.screenshot({ path })`
  whose path is the step's evidence path, so the file names line up with
  `evidence.jsonl` without renaming.
- A `page.screenshot` **MUST** come before the first action that can throw or
  time out. A failed run stops where it failed, so an assertion placed before
  the first shot leaves a `FAIL` with no image.
- The script **MUST** assert by throwing, with a message that says what was
  expected and what was found. The throw sets the exit code, which is what
  decides the verdict.
- The script **MUST** return the values you cannot see in a screenshot: the
  url, an `href`, an attribute, a text content. That return value is what you
  paste into `evidence.jsonl`.
- You **MUST NOT** write a username, password, token or MFA code into the
  script. The file is an artifact that gets copied into the report. See
  section 6.
- Prefer a stable locator: `getByRole`, `getByTestId`, `getByLabel`, an `href`.
  A snapshot ref such as `f1e13` is valid only inside one page read and
  **MUST NOT** appear in a script file.

### The sandbox has `page`, and no way to read a secret

`run-code` evaluates the function with `page`. `process` and `require` are
absent, verified:

```sh
playwright-cli run-code "async page => ({ p: typeof process, r: typeof require })"
# {"p":"undefined","r":"undefined"}
```

So a script **cannot** read an environment variable. Parameters are literals in
the file. That is the reason secrets never go in one: there is no other place
to put them, and the file is a deliverable.

(`fetch` is defined in 0.1.22, unlike earlier versions. Do not use it to reach
an app under test — a request that does not go through the page is not evidence
about the page.)

## 3. Resolve, syntax-check, then run. MUST, in that order.

`playwright-cli` has no `--dry-run`. These passes replace it.

```sh
# 1. Resolve every locator the script uses, against the live page.
playwright-cli open "$BASE/settings/payments"
playwright-cli --raw find "Upgrade now"
playwright-cli --raw generate-locator f1e13

# 2. Syntax-check the file.
node --check "$WF/<work-id>-test-1.js"

# 3. Run it.
playwright-cli run-code --filename="$WF/<work-id>-test-1.js"
echo "exit=$?"
```

`node --check` is a weak gate. Verified: it exits 0 for a file ending `};`,
which `run-code` then rejects with `SyntaxError: Unexpected token ';'`. It also
exits 0 for a locator that matches nothing. The resolve pass is the real gate,
and the first real run is the rest of it.

### Selector capture

`generate-locator` turns a snapshot ref into the real locator expression. That
string is the `resolved` field in `evidence.jsonl`, and it is also what belongs
in the script file.

```sh
playwright-cli --raw generate-locator f1e13
# getByRole('link', { name: 'Learn more' })
```

`click`, `fill` and the rest accept that expression directly, so no ref ever
has to reach the script:

```sh
playwright-cli click "getByRole('button', { name: 'Continue', exact: true })"
```

### Screenshot paths

`--filename` and `path` resolve against the current working directory. In
0.1.22 a missing directory **is created**, so the older `mkdir -p` rule no
longer applies. Still pass an absolute path, so a shot never lands next to
whichever directory you happened to run from:

```sh
playwright-cli screenshot --filename="$SHOTS/11-settings.png"
```

Point `$SHOTS` at the report's `shots/` directory from the start, so nothing
needs moving later.

## 4. Record evidence from the exit code and the return value. MUST.

A script reports what it did; it does not decide whether that satisfies the
plan. Two things come back from a run:

| Source | Meaning |
|---|---|
| Exit code | `0` every assertion held. `1` a throw, a missing locator, or a timeout. |
| Return value | The array the function returned, printed under `### Result`. `--raw` prints the value alone. |

Verified: `run-code` exits `1` both for an explicit `throw` and for a locator
that never matches. The exit code **is** a verdict signal in 0.1.22, unlike
earlier versions.

```sh
OUT=$(playwright-cli --raw run-code --filename="$WF/<work-id>-test-1.js"); RC=$?
```

Map it onto `evidence.jsonl`:

| Evidence field | Source |
|---|---|
| `resolved` | the `href` or locator in the returned array, or `generate-locator` |
| `url` | the `url` entry the script pushed for that step |
| `screenshot` | the `path` of that step's `page.screenshot` |
| `observed` | the returned entry on success; the `ASSERT FAIL` message on a throw |
| `verdict` | `PASS` when `RC` is `0`; `FAIL` on an `ASSERT FAIL` throw |

A run that stops on a missing element is `BLOCKED`, not `FAIL`, until the
precondition is proved. Check the precondition before you write the record.

After the run, read what the screenshot cannot show:

```sh
playwright-cli --raw eval "location.href"
playwright-cli tab-list
playwright-cli console
playwright-cli requests
```

`--raw` strips the page header, the generated code and the snapshot section, so
the output is the value alone. Use it for everything you paste into evidence.

Append this test's records, then start the next test's script.

## 5. Popup behaviour. Verified.

A `window.open` called from a synthesized click **does** open a tab under this
driver. So does a `target="_blank"` link. Reproduction:

```sh
playwright-cli -s=probe open about:blank
playwright-cli -s=probe run-code "async page => page.setContent('<button onclick=\"window.open(\'https://example.com/\')\">Open</button>')"
playwright-cli -s=probe click "getByRole('button', { name: 'Open' })"
playwright-cli -s=probe --raw tab-list
# - 0: (current) [](about:blank)
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

`state-load` fails with `The browser '<name>' is not open, please run open
first` when no session is open. The order above is the working one.

The state file holds live cookies. You **MUST NOT** copy it into the report's
`files/` directory or into shared context.

## 7. Copy the scripts into the report. MUST.

The scripts already live in shared context, so there is one copy to make:

```sh
cp "<root>/<work-id>/manual-tests/workflows/"<work-id>-test-*.js \
   "<root>/<work-id>/manual-tests/report/files/"
```

They are a deliverable. The next person re-runs the test instead of re-reading
it, and a regression later has a script waiting for it.

The report links that copy as `files/<name>`, never as `../workflows/<name>`.
The shared-context copy is the source of truth; the report copy is the one
that survives the report being zipped and sent on.

## playwright-cli traps

- **A trailing `};` breaks the file.** `run-code` wraps the contents in
  parentheses, so a statement terminator after the function expression is a
  syntax error. `node --check` passes it. End the file with `}`.
- **`file:` is blocked.** `goto file:///...` fails with
  `Access to "file:" protocol is blocked`. Serve a fixture over HTTP, or build
  it with `page.setContent` inside `run-code`.
- **Snapshots land in the working directory.** Every command writes
  `./.playwright-cli/page-<timestamp>.yml`. Run from a directory where that is
  gitignored. It is gitignored in this repository.
- **Refs are per-read.** `f1e13` changes on every navigation and re-render.
  Re-read before you click, and record what `generate-locator` resolved it to.
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
| Version | `playwright-cli --version` |
| List sessions | `playwright-cli list` |
| Claim session | `export PLAYWRIGHT_CLI_SESSION="<work-id>"; playwright-cli open about:blank` |
| Where am I | `playwright-cli --raw eval "location.href"` |
| Read the page | `playwright-cli --raw snapshot` |
| Find an element | `playwright-cli --raw find "Upgrade now"` |
| Resolve a ref | `playwright-cli --raw generate-locator f1e13` |
| Click a stable locator | `playwright-cli click "getByRole('link', { name: 'Upgrade now' })"` |
| Evidence shot | `playwright-cli screenshot --filename="$SHOTS/NN-slug.png"` |
| New tabs after a click | `playwright-cli tab-list` then `playwright-cli tab-select 1` |
| Page errors | `playwright-cli console` |
| Failed requests | `playwright-cli requests` |
| Run a test script | `playwright-cli --raw run-code --filename="$WF/<work-id>-test-1.js"` |
| Save a login | `playwright-cli state-save "$MT/auth.json"` |
| Tear down | `playwright-cli close && playwright-cli delete-data` |
