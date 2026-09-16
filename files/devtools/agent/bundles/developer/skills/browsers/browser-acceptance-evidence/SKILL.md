---
name: browser-acceptance-evidence
description: Writes manual test steps, drives them in a real browser with surf or Playwright, captures screenshots and element selectors as evidence, and publishes an HTML report to shared context. Use when a change must be proved in a running app - manual test steps, QA steps, acceptance criteria, a smoke test, visual verification, "show me it works", or a hand-off that needs screenshots. Results in a written plan, a re-runnable script, and a linked report instead of a claim in chat.
---

# browser-acceptance-evidence

Proving a change works in a running application is a procedure, not a vibe.
The procedure is the same whichever browser tool drives it, so this skill holds
the invariant part and routes the driving to a driver reference.

Three artifacts come out, all in shared context:

| Artifact | What it is |
|---|---|
| `test-plan.md` | The steps, written **before** the browser opens |
| `evidence.jsonl` | One record per step: selector, URL, screenshot, verdict |
| `report/index.html` | The reviewable page, built by the `writing-reports` skill |

## When to use

- The user asks for manual test steps, QA steps, acceptance evidence, or a test report.
- A fix needs proving in the running app, not just in tests.
- Someone will ask "did you actually look at it?" and the answer must be a link.

Do not use for unit or integration tests. Those belong in the test suite.

## Procedure

### 1. Resolve the shared-context root. MUST.

```sh
cd "<repository being worked on>" && "<shared-context-skill>/scripts/shared-context/cli.ts"
```

Every artifact goes under `<root>/<work-id>/manual-tests/`. You **MUST NOT**
write the plan, the evidence, the screenshots, or the report into the
repository being tested. A repository holds code, not session output.

### 2. Write the plan before opening a browser. MUST.

`<root>/<work-id>/manual-tests/test-plan.md`. It **MUST** contain:

- A **Preconditions** block: feature flags, plan tier, permissions, account,
  seed data, environment. Each one stated as a fact to be checked, not assumed.
- Numbered tests. Each test has numbered steps, written in the imperative, one
  action per step, with any condition first.
- An explicit **PASS** line and **FAIL** line per test. If you cannot write
  what failure looks like, you do not understand the test yet.

Writing steps after the fact is not testing, it is narrating. The plan exists
so the browser work has something to disagree with.

### 3. Route to a driver. MUST read the reference first.

| Driver | Reference | Use when |
|---|---|---|
| `surf` | `references/drivers/surf-cli.md` | A live browser with the user's real profile, existing logins and extensions |
| `playwright` | `references/drivers/playwright-cli.md` | A clean isolated profile, repeatable from zero |

You **MUST** read the chosen driver's reference before the first browser
command. If that reference is marked **TODO**, you **MUST** stop and tell the
user the driver is not ready. You **MUST NOT** improvise a driver from general
knowledge — the whole point of the reference is the traps it records.

### 4. Execute, recording evidence as you go. MUST.

Append one record per step to `evidence.jsonl` at the time you take the step.
The contract is in `references/evidence-schema.md`. You **MUST NOT** batch the
records at the end from memory — that is how selectors become `e46` and
observations become wishful thinking.

Loop per step: **read state, act, verify, record.**

### 5. Build the report with the `writing-reports` skill. MUST.

Load `writing-reports`. Run its `new-report.ts` into
`<root>/<work-id>/manual-tests/report`, fill it from `evidence.jsonl`, and pass
its validator.

You **MUST NOT** hand-write report HTML, invent CSS, or emit a Markdown file
instead. Report presentation is that skill's job and it has a validator that
this skill does not duplicate.

Map each evidence record onto the template:

| Evidence field | Report node |
|---|---|
| `step` | the section `id` a summary row targets |
| `screenshot` | `<img class="figure__image">` |
| `observed` | `.figure__caption` — what the shot proves |
| `resolved` | `<code class="code">` next to the figure |
| `verdict` | the `badge--*` in the summary row and the section heading |

### 6. Name every gap. MUST.

The report's "Not covered" section lists each test you could not complete and
the risk it leaves. The "Test data left behind" section lists every override,
account, record or running process, with the undo for each.

## Verdict rules

These exist because each one has been got wrong in a real run.

- **A synthesized click does not beat the popup blocker.** `window.open` called
  from an automated click is suppressed. No tab appears. You **MUST** record
  `PARTIAL`, capture the underlying `href` or config value as supporting
  evidence, and name the human click still needed. You **MUST NOT** record
  `PASS` because the code obviously would work.
- **A missing element is `BLOCKED`, not `FAIL`, until the precondition is
  proved.** A feature flag, plan tier or permission hides things. Check the
  precondition before you write a failure into a report that someone will act
  on.
- **`PASS` requires a screenshot.** Reading the source is not evidence. If the
  only artifact you have is a config file or a code path, the verdict is
  `PARTIAL` and the config is supporting evidence, not proof.
- **Record the resolved selector, not the tool's ref.** `e46` is meaningless
  next week and to everyone else. Record what it resolved to.

## Traps

- **Never dump full page text.** One unfiltered `page.text` of a real app can
  run to thousands of tokens of inline CSS and buries the finding. Filter the
  accessibility tree, search for the string you need, or screenshot it.
- **Preconditions cost more time than the tests.** Budget for flags and seed
  data. Finding no book, tenant, or account in the right state is a normal
  outcome — report it as `NOT COVERED` rather than faking a near-enough case.
- **A direct URL is not always navigation.** A client-routed app can render
  blank when entered mid-route with state in the hash. Click through the UI
  once to confirm the route works, then use direct URLs.
- **Changing a config to enable the test changes the test.** Record every
  override in "Test data left behind" with its undo, and say in the report that
  the run used it.

## Reference

- `references/evidence-schema.md` — the `evidence.jsonl` record contract.
- `references/drivers/surf-cli.md` — the surf driver.
- `references/drivers/playwright-cli.md` — the Playwright driver. **TODO.**
