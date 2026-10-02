# Fixed decisions - never ask

These decisions are made. Apply them; do not put them to the user as a question.

| Decision | Rule | The only exception |
|---|---|---|
| Commit or not | When the user asks for a commit, a PR or a review resolution, the commits are part of the request | None |
| One commit or several | Several atomic commits, one logical change each | The user asks for a single commit in this request |
| A dirty working tree | Commit the changes that belong to the branch's work, with `playbooks/commit.md`. Stop and report the files that do not belong to it. Never `git stash`: the stash is shared by every worktree of the checkout | None |
| Push when a PR is created or updated | Always push, before the `gh pr` call: `git push -u origin HEAD` creates the upstream when it is missing (`playbooks/create.md` Step 6.1 gives the lease form after a rebase) | None |
| Rebase before the PR push | Always rebase on the latest target branch before the checks (`playbooks/create.md` Step 2.2), then push with a lease on the checked sha (`--force-with-lease=refs/heads/<branch>:<sha>`), never a bare lease | The user asks not to rebase in this request |
| Rebase before review threads are resolved | Always fetch and rebase on the PR's base branch (`baseRefName` from Stage 1.1 of `playbooks/resolve.md`) before the first fix | The user asks not to rebase in this request |
| Watch the PR after it is created or updated | Always: `playbooks/watch.md` fixes what it can and asks the user only the important decisions in its Step 3 | The request has `no-watch`, or no user is present (CI with `GITHUB_ACTIONS=true`, a headless run): no watch |

A question about one of these is a defect in the workflow, not caution. Print the decision you
applied in the summary output instead.
