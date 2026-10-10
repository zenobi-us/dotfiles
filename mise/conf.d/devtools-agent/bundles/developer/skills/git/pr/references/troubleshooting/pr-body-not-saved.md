# PR body fallback: the GitHub REST API

Reference for the `pr` skill, `../playbooks/create.md` Step 6. Read it only when `gh pr edit --body-file`
exits 0 but the PR description on GitHub does not change (a known silent failure of `gh` on
some configurations).

## The fallback

Send the same body file straight to the pull-requests endpoint. `-F body=@<file>` reads the
value from the file, so the markdown (backticks, `$`, blank lines) never passes through a shell
and the command is the same from every shell:

```bash
gh api repos/{nameWithOwner}/pulls/{prNumber} -X PATCH -F body=@"{bodyFile}"
```

`{prNumber}` comes from `pr.ts meta --json` (Step 0), `{bodyFile}` is the
scratch file Step 5 wrote, and `{nameWithOwner}` is this checkout's repository:

```bash
gh repo view --json nameWithOwner --jq .nameWithOwner
```

## Verify

The PATCH response echoes the stored body; confirm the first heading of your file is in it:

```bash
gh pr view {prNumber} --json body --jq .body
```

## Common mistakes

- Building the body as an inline string: newlines and special characters get lost. Always write
  the file first (Step 5) and pass it with `--body-file` / `-F body=@file`.
- Skipping the `gh pr edit --body-file` attempt: try it first, fall back only on the silent
  failure described above.
- A `422 Unprocessable Entity` means the PR number or the repository path is wrong, or `gh auth
  status` is not logged in; it is not a body-format problem.
