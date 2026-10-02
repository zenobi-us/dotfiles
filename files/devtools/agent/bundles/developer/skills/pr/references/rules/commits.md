# Commit messages

Semantic, atomic commits. One logical change per commit.

```
<type>(<scope>): <description>
```

- `<type>`: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `style`, `test`.
- `<scope>`: the area of the repository the change belongs to. Take the vocabulary from the
  repository's own history: `git log --oneline -50` shows the scopes in use.
- `<description>`: starts lowercase, concise, in the imperative. Under 72 characters, with no
  full stop at the end.

A body is optional. Use it for what changed and why, wrapped at 72 characters.

Examples:

- `fix(auth): guard a null session on first render`
- `feat(reports): add support for multiple currencies`
- `chore(ci): update the deployment scripts for the new environment`

## Rules

- MUST put the issue or ticket reference in the subject when the caller resolved one. The body
  alone is not enough.
- MUST NOT write a vague subject: "fix bug", "update code", "misc changes".
- MUST NOT use an emoji unless the repository's own history uses them.
- MUST NOT batch a review round into one "address review feedback" commit. One review thread
  is one commit; one CI check type is one commit.

## Mapping a review comment to a type

| The comment says | Type |
|---|---|
| Bug, error, crash, wrong behaviour | `fix` |
| Add, support, new behaviour | `feat` |
| Rename, refactor, extract, change X to Y | `refactor` |
| Documentation, comments, README | `docs` |
| Performance, optimise | `perf` |
| Formatting, indent, whitespace | `style` |
| Test coverage, a missing case | `test` |
