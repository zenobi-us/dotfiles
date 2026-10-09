---
name: pr
description: Runs the git and GitHub pull request workflow of any repository - opens and updates pull requests, names and creates branches, makes semantic commits, watches a PR for failed checks and reviewer comments, and resolves review threads with the gh CLI. Use when opening or updating a PR, writing a PR body, committing work, naming or creating a branch, watching a PR, working through review comments or failed checks, or posting a PR line comment. Results in conventional branches and commits, a reviewer-ready PR body, green checks and zero unresolved review threads.
---

# PR: the git and GitHub workflow

This skill owns PR and branch workflows. Commit grouping, commit mechanics, and commit-message rules belong to the `skill://commit` skill; invoke it whenever a PR workflow needs to create commits. Read only the PR playbook and rules needed for the task.

## Route

Match the request against this table. Read the playbook, then do what it says.

| The request | Playbook |
|---|---|
| Open a PR, update one, write a PR body | `references/playbooks/create.md` |
| Work through review threads, reviewer comments and failing checks | `references/playbooks/resolve.md` |
| Watch a PR, fix CI failures and comments as they arrive | `references/playbooks/watch.md` |
| Name a branch, create one, check the current name | `references/playbooks/branch.md` |
| Commit staged or unstaged work, with no PR in the request | `skill://commit` skill |

No match: read the five playbook headings and pick the one whose goal fits. Say which you
chose and why. Ask when two fit equally.

Every playbook names the rule files it needs. Load those, not this file.

## Lookup

| Need | Read |
|---|---|
| GraphQL queries, pagination, line comments, error codes, rate limits | `references/github-api.md` |
| `gh pr edit` exits 0 but the body does not change | `references/troubleshooting/pr-body-not-saved.md` |

## Rules every playbook shares

PR work MUST NOT commit directly on the default branch. Create or switch to the PR working branch using the branch workflow. This restriction belongs to PR workflows; standalone commits are governed by `skill://commit` and do not create branches automatically.


| File | Covers |
|---|---|
| `references/rules/repository-conventions.md` | the repository's own conventions win, and where to find them |
| `references/rules/fixed-decisions.md` | what to apply instead of asking the user |
| `references/rules/branch-naming.md` | the branch name form and the checker |
| `skill://commit` skill | commit grouping, mechanics, and message format when a PR workflow needs commits |
| `references/rules/portable-commands.md` | no shell features, and how to extend the scripts |

## Scripts

One executable, `scripts/pr.ts`, with a subcommand per job:

```bash
<pr-skill>/scripts/pr.ts meta [--json] [<target-branch>]
<pr-skill>/scripts/pr.ts branch validate|build ...
<pr-skill>/scripts/pr.ts threads list|reply|resolve|comment ...
<pr-skill>/scripts/pr.ts watch [<pr>] [--max-wait <minutes>]
```

`<pr-skill>` is this skill's own directory. It is not inside the repository you work on: this
skill is installed once and acts on whatever repository the shell is in. Replace it with this
skill's absolute path.

MUST run every command from inside the target repository. They find the repository root with
`git rev-parse --show-toplevel`, so the working directory decides which repository they act on.

`--help` works on the router and on every subcommand. The scripts need `mise`, `bun` and the
`gh` CLI. They have no install step.

Every command prints to stdout and writes no file into the repository. Write a PR body or a
reply body to your own scratch directory, outside the repository, then pass that path to
`--body-file`.
