# Stage 4: CollectEvidence

Run the confirmed plan in a real browser. Collect screenshots, video when the
plan asks for it, and one evidence record per step.

## Procedure

1. Read the driver reference for the plan's driver, if you have not read it in
   this session: `references/drivers/playwright-cli.md` or
   `references/drivers/surf-cli.md`.
2. Compile and run:

   ```sh
   "$SC" compile "$MT"   # plan.ts -> workflows/
   "$SC" run "$MT"       # evidence.jsonl, report/shots/, report/videos/, runs/
   "$SC" verdicts "$MT"  # summary and every note
   ```

   - Read the exit code of `run` directly. `2` means a test failed. A pipe into
     `head` or `tail` reports the pipe's status instead.
   - Under `surf`, keep the session window in front for the whole run; a surf
     screenshot needs a visible tab.
   - With `video: true`, the Playwright driver records `report/videos/test-N.webm`
     for each test.
3. You **MUST** look at every screenshot before you accept its verdict. Open
   each file in `report/shots/` and check that it shows what the step claims.
   A screenshot of an empty toast once hid a failed save.
4. When a step fails, decide which side is wrong before you change anything:
   - A wrong locator, a wrong expected value or a page that has changed is a
     fault in the plan. Fix `plan.ts`, then `compile` and `run` again.
   - A page that does not do what the claim says is a finding about the
     application. Keep the `FAIL`.
   - You **MUST NOT** edit a generated script or an evidence record to get a
     different verdict.

## Verdicts

The runner decides each verdict from this table:

| Condition | Verdict |
|---|---|
| A `requires` precondition check failed | `BLOCKED`; the note names the precondition |
| The driver exited non-zero | `FAIL`; `observed` holds the `ASSERT FAIL` message |
| A `human` step was reached | `PARTIAL`; the note says what is still owed |
| Exit zero and a screenshot exists | `PASS` |
| Exit zero and no screenshot | `PARTIAL`; a `PASS` needs an image |

Three judgements stay yours:

- **Declaring each precondition.** The runner checks only what the plan states.
  A missing element with no declared precondition is recorded `FAIL`, and that
  may be wrong about someone else's code. Find out why an element is absent
  before you publish.
- **`WARN`.** A defect you noticed on the side. The runner never emits one; stage
  5 adds it.
- **Whether the test proves the claim.** The plan is the part no tool checks.

## Traps

- **Never dump full page text.** An unfiltered page read of a real app can run
  to thousands of tokens. Filter the accessibility tree, search for the string,
  or take a screenshot.
- **A direct URL is not always navigation.** A client-routed app can render
  blank when entered mid-route with state in the hash. Click through once, then
  use direct URLs.
- **Changing a config to enable a test changes the test.** Record every
  override. Stage 5 lists it under "Test data left behind" with its undo.
- **A synthesized click does not beat the popup blocker.** Declare that step
  `human`. You **MUST NOT** rewrite it as an `expect` to get a green badge.

## Next

Go to `5-publish-evidence.md`.
