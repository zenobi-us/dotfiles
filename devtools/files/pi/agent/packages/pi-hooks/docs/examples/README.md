# Examples

These examples are designed to be copied into `hooks.yaml` with minimal editing.

## Copy-paste examples

| File | What it covers |
|---|---|
| [`notify-on-idle.md`](./notify-on-idle.md) | The simplest possible visible hook |
| [`confirm-before-bash.md`](./confirm-before-bash.md) | Require user approval before any `bash` tool call |
| [`block-destructive-bash.md`](./block-destructive-bash.md) | Block selected `bash` commands with exit code `2` |
| [`log-file-changes.md`](./log-file-changes.md) | Capture `file.changed` payloads to a local log |
| [`path-filters.md`](./path-filters.md) | Run hooks only for selected files or directories |
| [`session-scope.md`](./session-scope.md) | Use `scope: all\|main\|child` |
| [`project-overrides.md`](./project-overrides.md) | Replace or disable a global hook from a trusted project file |
| [`background-hooks.md`](./background-hooks.md) | Run slow post-processing asynchronously |
| [`tool-follow-up-prompts.md`](./tool-follow-up-prompts.md) | Ask the current PI session to do something next |
| [`tail-hook-logs.md`](./tail-hook-logs.md) | Tail and filter the persistent hook log while debugging |
| [`snapshot-autocommit.md`](./snapshot-autocommit.md) | Hook up the included Python snapshot worker example |

## Complete example packs

| Pack | What it does |
|---|---|
| [`../../examples/pre-tool-developer-guards/`](../../examples/pre-tool-developer-guards/) | Pre-tool guards for risky bash, protected files, and dependency installs |
| [`../../examples/post-tool-developer-feedback/`](../../examples/post-tool-developer-feedback/) | Post-tool logging, status, and follow-up prompts for developer workflows |
| [`atomic-commit-snapshot-worker`](https://github.com/KristjanPikhof/pi-hooks/tree/main/examples/atomic-commit-snapshot-worker/) (repo-only) | Advanced snapshot worker example |

The `atomic-commit-snapshot-worker` directory is repo-only; it is not shipped in the npm tarball. Clone the GitHub repository to use it.

These packs are opt-in examples, not built-in `pi-hooks` features.

## Before you paste

- If you are using a project hook file, trust the project first.
- If a snippet references an absolute path, replace it with your real path.
- If the snippet uses `bash`, test it once with a harmless input before relying on it.
