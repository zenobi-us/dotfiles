# Stage 5: PublishEvidence

Turn the run into published evidence, and post the steps to the issue with a
link to that evidence.

## Procedure

1. Build the report and the results:

   ```sh
   "$SC" report "$MT"
   ```

   | File | Contents |
   |---|---|
   | `report/index.html` | The `writing-reports` page, validated by that skill's validator |
   | `results.json` | `plan.json` plus each test's verdict, screenshots, video, failure and notes |
   | `evidence.md` | `results.json` as Markdown, with the screenshots inline and a link to each video |

   You **MUST NOT** hand-write report HTML, `results.json` or `evidence.md`.
   The HTML report links no video; `evidence.md` and `results.json` do.

2. Finish what the runner cannot know:
   - **A defect on the side.** Append one `WARN` record to `evidence.jsonl`, in
     the format in `references/evidence-schema.md`, with a screenshot and a
     note that says why it is unrelated. Run `report` again.
   - **Gaps.** The report's "Not covered" table lists only tests that did not
     finish. Replace its "None" row with each gap from stage 1, such as a layer
     that ran from a remote service. A "None" there must be true.
   - **Test data left behind.** Add every config override, seed record,
     account or process the run needed to the "Test data left behind" table,
     each with its undo. A run that changed a flag to pass **MUST** say so in
     the report's opening line too.
   - After editing `index.html` by hand, run the `writing-reports` validator on
     it again.
3. Publish the evidence directory. Follow `references/publishing.md` in the
   `agent-core:shared-context` skill:
   - Commit only the evidence paths. The store can hold other sessions' staged
     work; commit with a pathspec so it stays out of your commit:
     `git commit -m "context(<work-id>): add browser acceptance evidence" -- <evidence path>`.
   - A pre-commit hook in the store may add a generated file, such as an index.
     Check the commit with `git show --stat HEAD` and report any file it added.
   - Push to the store's upstream. Do not create an upstream or a remote
     without approval.
4. Build the evidence URL after the push, by the shared-context link rule:
   - For a private store with GitHub Pages, use the Pages URL of `evidence.md`
     (or of `report/index.html`). Never build a public URL from a private store.
   - Check that the Pages build for your commit has finished before you post.
5. Generate the comment:

   ```sh
   "$SC" comment "$MT" --url "<evidence URL>"
   ```

   `comment.md` holds the manual test steps and PASS lines, with no screenshots,
   and a footnote `[1]` that links to the evidence.
6. Post `comment.md` to the issue agreed in stage 3, through the repository's
   ticket skill, as Markdown. For Jira through `twg`:
   `twg jira workitem comment create --issue-id <KEY> --body "$(cat "$MT/comment.md")" --body-format markdown`.
7. Read the comment back from the tracker. Check that the steps, quoted names,
   amounts such as `$12.00`, and the footnote link survived the format change.

## Output

Report, in this order:

- each test and its verdict;
- each gap the run could not prove;
- the evidence URL and the comment reference;
- the commit and push, and any file a hook added;
- test data left behind, or that there is none.

Say "published" only after the push and the comment read-back both succeeded.
