# Name and create a branch

Execution spec for the `pr` skill. Read it when the request is to name a branch, create one,
or check the name of the current one.

Load `../rules/branch-naming.md` first. Load `../rules/repository-conventions.md` when you
have not yet read this repository's `CONTRIBUTING.md`.

## Steps

1. MUST read the repository's own convention first. `CONTRIBUTING.md` and any branch-name
   check in `.github/workflows/` beat the default in `rules/branch-naming.md`.
2. MUST build the name from the work type, the ticket key when there is one, and a short
   lowercase slug:

   ```bash
   <pr-skill>/scripts/pr.ts branch build fix "null guard on auth hook" --ticket ABC-123
   ```

3. MUST check the name before you use it:

   ```bash
   <pr-skill>/scripts/pr.ts branch validate <branch>
   ```

   Exit 1 prints one line per problem. Fix each one and check again.

4. MUST create the branch from the fetched target branch, with no upstream:

   ```bash
   git fetch origin
   git switch --no-track -c <branch> origin/<target-branch>
   ```

   `--no-track` matters. With `origin/<target-branch>` as its upstream, `upstreamOk` in the PR
   metadata would read `true` for the wrong ref. The first `git push -u` sets the right one.

5. MAY report the name and the base commit. Nothing else is needed.

## Renaming

| State | Do |
|---|---|
| No PR yet | `git branch -m <new-name>`, then run the flow that needed it again |
| An open PR exists | MUST ask the user with numbered options. Renaming the head branch of an open PR closes the PR. The options are a new branch and a new PR, or this PR with the failing check. |

## Success criteria

- `pr.ts branch validate` exits 0 for the name.
- The repository's own branch-name check, when it has one, passes.
- The branch has no upstream yet.
