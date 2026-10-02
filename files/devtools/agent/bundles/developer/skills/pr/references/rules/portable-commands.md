# Portable commands

Every command in this skill is a plain `git`, `gh` or `pr.ts` call with no shell features, so
it runs the same from every shell and every agent harness.

| Never | Use instead |
|---|---|
| `\| jq '...'` | `gh --json` and read the JSON, or `gh --jq` (built in, no external binary) |
| `$(cat body.md)`, `--body "..."` | `--body-file body.md`, or `-F body=@body.md` for `gh api` |
| `VAR=$(gh ...)` capture | the JSON from `pr.ts`, or `git push origin HEAD` |
| a `while`/`for` loop, `mktemp`, `sed`, `grep` | `pr.ts threads` |
| a multi-line `-f query='...'` GraphQL string | `pr.ts threads` |
| `2>/dev/null`, `\|\|`, `&&` chains | separate commands, or a new `pr.ts` subcommand |

The scripts exist because those operations cannot be written portably in a shell at all:
pagination needs a loop and a JSON parser, and a GraphQL document needs quoting that differs
on every shell.

## Extending the scripts

Anything new of that shape becomes a subcommand of `scripts/pr.ts`, never a shell snippet in a
playbook. One module per command group under `scripts/commands/`, with the Crust wiring in
`pr.ts` and the shared process helpers in `scripts/core.ts`.

## Anti-patterns

- A generic slug that names no change (`feature/stuff`, `fix/bug`).
- A long-lived branch that drifts from the default branch.
- A question `rules/fixed-decisions.md` already answers.
- `git stash`, or a bare `--force-with-lease` that trusts the remote-tracking ref.
- A PR body built as an inline string - write the file, then pass `--body-file`.
- A PR body written from this skill's template when the repository ships its own.
- A Copilot suggestion applied without checking it against the repository's own rules.
