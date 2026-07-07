# Snapshot autocommit (pi-hooks example)

A YAML-driven `pi-hooks` example that auto-commits every recognized `file.changed` event. One hook, one worker, one SQLite queue per worktree. The hook captures file edits, snapshots them into git objects, and replays them as real commits after a short quiet window.

This is **not** a built-in feature of `pi-hooks`. It is an example you wire up yourself by adding the snippet below to your `hooks.yaml`.

> **Repository-only example.** This directory is **not** shipped with the npm package. Use it by cloning the [pi-hooks GitHub repository](https://github.com/KristjanPikhof/pi-hooks) and pointing your `hooks.yaml` at the on-disk path. `pi install pi-hooks` alone does not give you these scripts.

## Use as a pi-hooks hook

### 1. Prerequisites

- macOS or Linux. The worker uses `fcntl` locks and POSIX signals; Windows is unsupported.
- `python3` 3.x on `$PATH`
- `git` 2.x
- `sqlite3` (only needed if you want to inspect the queue manually)

### 2. Wire it from `hooks.yaml`

Use this example as a project-local hook unless you really want automatic commits in every trusted repo session. Put it in `<project>/.pi/hook/hooks.yaml` (preferred) or `<project>/.pi/hooks.yaml`, and make sure that repo or worktree is trusted before you expect the hook to load.

You also need a real checkout or copied script directory on disk. `pi install` by itself does not give you a stable example-script path to point at. Replace `<snapshot-example-dir>` below with the actual path to the `examples/atomic-commit-snapshot-worker/` directory that contains `snapshot-hook.py`, `snapshot-worker.py`, and `snapshot_shared.py`.

```yaml
hooks:
  - id: snapshot-autocommit
    event: file.changed
    async: true
    actions:
      - bash: 'python3 <snapshot-example-dir>/snapshot-hook.py'

  # Best-effort flush on shutdown or session switch so commits do not trail too far behind.
  - id: snapshot-flush-on-exit
    event: session.deleted
    actions:
      - bash: 'python3 <snapshot-example-dir>/snapshot-worker.py --flush --repo "$PI_PROJECT_DIR"'
```

A copy of these two hooks lives next to this README as [`hooks.yaml`](./hooks.yaml). Copy it as a starting point.

### 3. Verify it works

From a PI session inside a git repo:

1. Use the `write` or `edit` tool to touch a file.
2. Wait roughly 1 second (the default `SNAPSHOTD_QUIET_SECONDS`).
3. Check `git log --oneline`. You should see a fresh commit.
4. Check the worker queue:

   ```bash
   python3 <snapshot-example-dir>/snapshot-worker.py \
     --status --repo .
   ```

   Expect `published > 0` and `pending: 0`.

### 4. Operating commands

```bash
# Inspect queue
python3 snapshot-worker.py --status --repo /path/to/repo

# Drain pending events synchronously (exit 0 = empty, exit 2 = work remains)
python3 snapshot-worker.py --flush --repo /path/to/repo

# Run worker in foreground (debugging)
python3 snapshot-worker.py --repo /path/to/repo
```

### PI-specific caveat about the flush hook

The example uses `session.deleted` for the flush path. On PI that event is intentionally lossy: it fires on real shutdown, but also before session switches such as `/new`, `/resume`, and `/fork`.

That means the flush hook is best-effort. It is useful for reducing trailing commits, but it is not a strict "flush only on final session exit" guarantee.

## Implementation details

The capture contract, branch generation rules, quarantine semantics, environment variable reference, and operational debugging notes live in [`INTERNALS.md`](./INTERNALS.md).

## Related files

- `snapshot-hook.py`
- `snapshot-worker.py`
- `snapshot_shared.py`

## Scope note

This README documents the `pi-hooks` wiring for this example. The worker itself can be adapted to other harnesses, but those integrations are out of scope here and are not part of the documented `pi-hooks` surface.
