---
name: writing-and-creating-git-commits
description: Create semantic, atomic git commits that follow the Conventional Commits specification. Use when committing staged or unstaged work, grouping a dirty working tree into commits, or writing a commit message. Results in one logical change per commit and a message a reader can act on.
---

# Writing and creating git commits

The commit rules and the commit procedure live in the `pr` skill, so one set of rules covers
committing on its own, committing for a pull request, and committing during a review round.

| Need | Read |
|---|---|
| The message format, the type and scope vocabulary | `skill://pr/references/rules/commits.md` |
| The procedure: unstage, group, print the plan, commit | `skill://pr/references/playbooks/commit.md` |

Load those two files, then follow the playbook.

## Before the first commit

1. MUST NOT commit on the default branch. Create a working branch first:
   `skill://pr/references/playbooks/branch.md`.
2. MUST resolve every merge conflict before committing. `git ls-files -u` must print nothing.
3. MUST include the issue or ticket reference in the commit subject when the caller resolved
   one. The body alone is not enough.

## This skill does not push

Pushing, rebasing on the target branch and opening a pull request belong to
`skill://pr/references/playbooks/create.md`.
