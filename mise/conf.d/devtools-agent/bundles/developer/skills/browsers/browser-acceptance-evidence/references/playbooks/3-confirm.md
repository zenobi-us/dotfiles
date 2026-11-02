# Stage 3: Confirm

Show the plan to the user and agree it before the browser runs it. A green run
of the wrong test is the most expensive outcome of this skill.

## Procedure

1. Show `test-plan.md` in your reply. Keep the test titles, steps, PASS and
   FAIL lines exactly as rendered.
2. Under the plan, state:
   - the driver, and why it was chosen;
   - the test data each test uses;
   - each gap from stage 1 that the run cannot prove.
3. Decide whether the plan would benefit from video. Video helps when the claim
   is about motion or sequence rather than a final state:
   - an animation, a transition or a loading state;
   - a drag, a resize or another continuous gesture;
   - a multi-step flow whose order matters;
   - a defect that only shows between two screenshots.

   A claim about a value on a settled page, such as "the Rate column shows
   $12.00", does not need video.
4. Ask the user, in one message with numbered options:
   - Are the tests and the data right?
   - Is the driver right?
   - **Only when step 3 found a reason:** record video? Say that video needs
     the `playwright` driver, so a `surf` plan changes driver.
   - Where should the steps be posted in stage 5? Name the issue you found in
     stage 1 as the default.
5. Apply the answers:
   - Change `plan.ts` for every correction, then run `"$SC" render "$MT"` again.
   - For video, set `video: true` in `plan.ts`. `render` refuses video with the
     `surf` driver.
   - Show the changed part of the plan when the change is more than a word.

## When no user is present

In a headless run, do not wait. Write each question and the answer you assumed
in your output, and continue. Assume no video unless the request asked for it.

## Next

Go to `4-collect-evidence.md`.
