# Commit the working tree

Execution spec for the `pr` skill. Read it when the request is to commit staged or unstaged
work, with no PR in the request.

Load `../rules/commits.md` first. Load `../rules/fixed-decisions.md`: it answers whether to
commit and how many commits to make.

## Steps

1. MUST NOT commit on the default branch. Create a working branch first with
   `branch.md`.
2. MUST resolve every merge conflict first. `git ls-files -u` must print nothing.
3. MUST unstage before analysis, so the grouping comes from the diff and not from what
   happened to be staged:

   ```bash
   git restore --staged .
   ```

4. MUST read the whole change before grouping it:

   ```bash
   git status --porcelain
   git diff
   ```

5. MUST plan atomic groupings with the correct scope. Several commits is the default. Plan one
   commit only when the user asked for a single commit in this request.
6. MUST print the plan as a table, then continue. Do not wait for approval and do not ask
   whether to commit: the request is the approval.
7. MUST make each commit with its own `git add <paths>` and `git commit -m "<message>"`, with
   no `&&` or `;` between them (`../rules/portable-commands.md`).
8. MUST stop and report any file that belongs to no group. Never `git stash`: the stash is
   shared by every worktree of the checkout.
9. SHOULD rebase on the target branch last, because `git rebase` refuses to start while the
   working tree has unstaged changes:

   ```bash
   git fetch origin <target-branch>
   git rebase origin/<target-branch>
   ```

   Skip step 9 when the calling flow rebases next. `create.md` Step 2.2 and `resolve.md`
   Stage 3 both do. With no calling flow, the target is the base of the branch's open PR,
   else the default branch.

## Success criteria

- Every commit holds one logical change.
- `git status --porcelain` prints nothing, or prints only files you reported in step 8.
- Every subject follows `../rules/commits.md`, with the ticket reference when there is one.
