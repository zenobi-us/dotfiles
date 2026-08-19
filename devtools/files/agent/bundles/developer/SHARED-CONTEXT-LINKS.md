# Shared context: writes and links

Applies whenever a command resolves `ALIGNMENT_ROOT` per `ALIGNMENT-ROOT.md` and finds `storage="shared"`.

## Write rule

`storage="shared"` means `ALIGNMENT_ROOT` is a directory managed by `shared-agent-context/cli.ts`, not part of the worktree's repository. It is also not that repo's root: the same shared-context repo holds every project's notes, each under its own slug directory, so `ALIGNMENT_ROOT` is `<shared-context-repo-root>/<slug>/`.

Commit and push every file you create or update under `ALIGNMENT_ROOT` (workflow records, `CONTEXT.md`, `CONTEXT-MAP.md`, ADRs, `docs/agents/`, review artifacts, `domain-modeling`/`codebase-design` output) inside the shared-context repo as soon as you write it. Other worktrees and agents only see the update after it lands on the remote — an uncommitted or unpushed write is invisible to them.

## Reference rule

Any ADR, task, or review artifact cited in a commit message or pull request body must be a link a reviewer can click, not a bare filesystem path.

- If the cited file lives under `ALIGNMENT_ROOT` with `storage="shared"`: run `git -C "$ALIGNMENT_ROOT" rev-parse --show-toplevel` to find the shared-context repo's actual root, read its `origin` remote and current commit, and build the link relative to that root so it includes the slug-directory prefix, e.g. `https://github.com/{owner}/{shared-context-repo}/blob/{sha}/{slug}/docs/adr/0007-use-postgres.md`. Only do this once the shared-context commit has been pushed.
- If the cited file lives in the repository being merged or submitted (`storage="repository"`, or any path under `repository-root`): link with a path relative to the repository root (e.g. `docs/adr/0007-use-postgres.md`) — no host prefix needed, it resolves against the same repo.
