# Stage 2: TestPlan

Write the manual test steps in `plan.ts`, then generate `plan.json` and
`test-plan.md`. Neither generated file carries evidence; they are the steps a
person follows.

## Procedure

1. Resolve `$MT` (see the router) and scaffold the plan:

   ```sh
   "$SC" init "$MT"                # playwright driver
   "$SC" init "$MT" --driver surf  # surf driver
   ```

   Choose the driver now; `3-confirm.md` asks the user to agree it.

   | Driver | Use when |
   |---|---|
   | `playwright` | **Default.** Clean isolated profile, runs unattended, captures a popup, records video |
   | `surf` | Signing in from zero is expensive or needs a second factor, and a person is at the keyboard. No video |

2. Find the test data before you write a step. Open the page read-only with
   the chosen driver and find a record in each state the claims need, such as
   "a fixed-amount line" and "a percentage line". Note what the screen calls
   it: the batch name, the employee, the amount.
   - If no record in the needed state exists, record the claim as not covered.
     You **MUST NOT** fake a near-enough case.
3. Write every `says` first, with the locators left out. Each `says` is one
   sentence naming what is on the screen: the visible label, the button text,
   the field name. Read the plan back as a manual test; a person with no
   developer tools open must be able to follow it.
4. Add a "before" test when stage 1 found a before view. Give its `navigate`
   an absolute URL. Its PASS line says the defect reproduces there.
5. Give every test a `claim`, a `pass` line and a `fail` line. If you cannot
   write what failure looks like, you do not understand the test yet.
6. Write each precondition as a `check` the runner performs: the record, the
   flag, the permission. A test whose `requires` is not met is recorded
   `BLOCKED`, never `FAIL`.
7. Attach one locator to each step, derived from its `says`. Read the chosen
   driver's reference first (`references/drivers/`). If that reference is
   marked **TODO**, stop and tell the user the driver is not ready.
   - Under `playwright`, prefer `getByRole(...)` built from the words in `says`.
   - Under `surf`, every locator is CSS for `document.querySelector`.
   - You **MUST NOT** reword a `says` to fit a locator you found. If the element
     cannot be reached the way the sentence describes it, that is a finding.
8. Add plumbing steps where the page needs them. They take no `says` and never
   reach a reader:
   - `{ do: "wait", locator }` after a `navigate`, gated on what you touch next.
   - `{ do: "wait", locator, gone: true }` after a delete or a dismiss.
   - `{ do: "scroll", locator }` before a click on anything below the fold.
9. Use `{ do: "press", says, key }` when the screen opens only from the
   keyboard, such as an AG Grid cell editor that opens on Enter. Click the
   element first to focus it; the key goes to whatever has focus.
10. Mark a step only a person can finish, such as a popup or a payment, as
   `{ do: "human", needs: "..." }`. It records `PARTIAL` and never fails the run.
11. Leave `video` out of the plan for now. `3-confirm.md` decides it.
12. Generate the plan files:

    ```sh
    "$SC" render "$MT"   # writes test-plan.md and plan.json
    ```

    `render` refuses a `says` that carries selector syntax, and a test that
    still has scaffold text. Fix `plan.ts` and render again.

## Output

| File | Contents |
|---|---|
| `plan.ts` | The source: steps, locators, preconditions |
| `plan.json` | The plan for tools: environment, preconditions, each test's reader steps, PASS and FAIL |
| `test-plan.md` | The same plan for people |

The step numbers in `test-plan.md` and `plan.json` count manual steps only.
They do not match the plan step ids in `evidence.jsonl`.

## Next

Go to `3-confirm.md`.
