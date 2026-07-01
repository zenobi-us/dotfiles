# Example hook packs

These folders include complete example packs. Copy the `hooks.yaml` snippets into a global or trusted project hook file, and keep any referenced scripts at the paths used by the YAML or update those paths.

## Complete packs

| Pack | What it does |
|---|---|
| [`pre-tool-developer-guards`](./pre-tool-developer-guards/) | Block risky shell commands and protected-file edits before tools run |
| [`post-tool-developer-feedback`](./post-tool-developer-feedback/) | Log useful post-tool context, update status, and nudge follow-up checks after developer-facing changes |

These are examples only. They are not built-in `pi-hooks` product features.

## Repository-only examples

These are not shipped in the npm tarball. Clone [the GitHub repository](https://github.com/KristjanPikhof/pi-hooks) to use them:

| Pack | What it does |
|---|---|
| [`atomic-commit-snapshot-worker`](https://github.com/KristjanPikhof/pi-hooks/tree/main/examples/atomic-commit-snapshot-worker) (repo-only) | Python snapshot worker that auto-commits every recognized `file.changed` event into a per-worktree SQLite queue |
