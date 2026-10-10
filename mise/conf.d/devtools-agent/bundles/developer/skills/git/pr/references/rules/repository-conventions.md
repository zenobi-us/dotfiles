# The repository's conventions win

This skill is installed once and runs against whatever repository you are in. Its conventions
are defaults, not law.

## Read these before the first branch, commit or PR body in a repository

| File | What it gives |
|---|---|
| `CONTRIBUTING.md` | branch names, commit format, the review and merge process |
| `.github/PULL_REQUEST_TEMPLATE.md`, `.github/PULL_REQUEST_TEMPLATE/` | the PR body the reviewers expect |
| `.github/workflows/` | the checks a PR must pass, and what runs them |
| `AGENTS.md`, `CLAUDE.md`, `README.md` | the build, test and lint commands |

Use what you find. Fall back to this skill's own rules only where the repository says nothing.

## Pre-PR checks

The repository's own checks MUST be green before a PR opens. Find them in this order:

1. `CONTRIBUTING.md` - what the project asks a contributor to run.
2. `AGENTS.md` or `CLAUDE.md` - the commands an agent is told to run.
3. `.github/workflows/` - what CI runs on a pull request. Run the same commands locally.
4. The task runner the repository uses (`package.json` scripts, `Makefile`, `mise.toml`,
   `moon.yml`, `justfile`).

Run only the checks the diff touches. When you find none, say so in the summary rather than
inventing a command.
