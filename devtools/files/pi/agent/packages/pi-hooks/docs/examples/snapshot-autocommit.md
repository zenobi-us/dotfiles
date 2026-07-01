# Snapshot autocommit

This repository ships a full Python example that auto-commits recognized file changes through a snapshot worker.

This is an opt-in example, not a built-in `pi-hooks` feature.

## Use the bundled example (repo-only)

The `atomic-commit-snapshot-worker` directory is repo-only; it is not shipped in the npm tarball. Clone the GitHub repository to use it.

- example directory: [`examples/atomic-commit-snapshot-worker/`](https://github.com/KristjanPikhof/pi-hooks/tree/main/examples/atomic-commit-snapshot-worker/) (repo-only)
- detailed setup: [`examples/atomic-commit-snapshot-worker/README.md`](https://github.com/KristjanPikhof/pi-hooks/blob/main/examples/atomic-commit-snapshot-worker/README.md) (repo-only)
- starter hook file: [`examples/atomic-commit-snapshot-worker/hooks.yaml`](https://github.com/KristjanPikhof/pi-hooks/blob/main/examples/atomic-commit-snapshot-worker/hooks.yaml) (repo-only)

## Hook snippet

Use this as a project-local hook. It is a repo-specific workflow, and project hooks only load after the repo or worktree anchor is trusted.

```yaml
hooks:
  - id: snapshot-autocommit
    event: file.changed
    async: true
    actions:
      - bash: 'python3 <snapshot-example-dir>/snapshot-hook.py'

  - id: snapshot-flush-on-exit
    event: session.deleted
    actions:
      - bash: 'python3 <snapshot-example-dir>/snapshot-worker.py --flush --repo "$PI_PROJECT_DIR"'
```

Replace `<snapshot-example-dir>` with the actual path to the cloned `examples/atomic-commit-snapshot-worker/` directory that contains `snapshot-hook.py`, `snapshot-worker.py`, and `snapshot_shared.py`. `pi install` alone does not give you a stable working-tree path for this snippet.

## When to use it

Use this example when you want:

- automatic git commits after edits settle
- a per-worktree queue and worker
- a more advanced example of `file.changed`, `async`, and `session.deleted`

The `session.deleted` flush path is best-effort on PI because that event is intentionally lossy.
