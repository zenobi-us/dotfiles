# Branch naming

```
<type>/<slug>
<type>/<TICKET>-<slug>
```

- `<type>` is one of: `feat`, `feature`, `fix`, `hotfix`, `chore`, `docs`, `refactor`,
  `perf`, `test`, `ci`, `build`, `style`.
- `<TICKET>` is an issue key such as `ABC-123`. Include it when the repository tracks work
  that way. Some repositories require it; `CONTRIBUTING.md` says so.
- `<slug>` is short, lowercase, and describes the change. Words joined by single hyphens.

Examples:

- `feature/ABC-1234-improve-batch-actions`
- `fix/null-guard-on-auth-hook`
- `chore/upgrade-eslint-rules`

Rules:

- The prefix MUST match the work type. Bugs get `fix/`; tasks get `feat/` or `chore/`.
- Keep branches focused and short-lived; rebase on the default branch regularly.
- MUST NOT work on the default branch itself.

Check a name, or build one:

```bash
<pr-skill>/scripts/pr.ts branch validate [--require-ticket] <branch>
<pr-skill>/scripts/pr.ts branch build fix "null guard on auth hook" --ticket ABC-123
```

`validate` with no branch reads the current one. Exit code 0 is valid, 1 is invalid.
When the repository has its own branch-name check, that check wins; run it instead.

## The name must be right before the PR exists

Some repositories generate the PR title from the branch name, and fail a check when the name
breaks their convention. Renaming the head branch of an open PR closes the PR.
