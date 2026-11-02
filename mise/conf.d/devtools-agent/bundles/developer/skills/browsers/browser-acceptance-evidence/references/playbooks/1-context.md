# Stage 1: Context

Know what changed, what the ticket asks for, and what the running environment
can prove, before you write a single step.

## Inputs

- The branch under test.
- The work id, usually the ticket key.

## Procedure

1. You **MUST** read the work on the branch:
   - `git log --oneline <base>..HEAD` for the commits.
   - `git diff --stat <base>..HEAD` for the changed files.
   - The diff of each user-facing change. Note which layer each commit touches:
     UI, API, data.
2. You **MUST** read the ticket through the repository's ticket skill:
   - The description and acceptance criteria.
   - Every comment. A later comment often narrows or strikes part of the scope.
   - Every image attachment. Download it and look at it; a screenshot of the
     defect names the page, the data and the expected value.
3. You **SHOULD** read the work receipts when they exist. Resolve the workflow
   with `shared-context resolve workflow --id <work-id> --json` and read its
   latest receipt, `projections/pr-draft.md` and any open questions. A decision
   recorded there, such as "match Kendo", is a requirement for the plan.
4. You **MUST** list what the running environment serves from the branch. For
   each layer the change touches, record whether the environment runs it from
   this branch or from somewhere else, such as a remote API.
   - A layer that runs from somewhere else cannot be proved by this run. Record
     it now as a gap; stage 5 states it in the report.
5. You **SHOULD** find a "before" view. A deployed environment that runs the
   base branch can show the defect next to the fix. Note its URL.

## Output

Write a short summary in your reply. It **MUST** state:

- **Claims to prove:** one line each, taken from the ticket and the receipts.
- **Layers and where they run:** branch, remote, or not running.
- **Gaps:** what this environment cannot prove, and why.
- **Before view:** its URL, or that none exists.

## Next

Go to `2-test-plan.md`.
