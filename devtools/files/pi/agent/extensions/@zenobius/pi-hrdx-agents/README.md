# Pi hrdx Agents

Asynchronous Pi subagents and approved review workflows for [Pi](https://github.com/earendil-works/pi), running in [hrdx](https://github.com/patriceckhart/hrdx).

## Requirements

- Pi with package support.
- hrdx with its socket API enabled.
- `HRDX=1`, set by hrdx for processes in its panes.

Install one multiplexer package. Do not load `pi-herdr-agents` and `pi-hrdx-agents` together.

```bash
pi install npm:pi-hrdx-agents
hrdx
pi
```

## Use

```text
/subagent scout Map the authentication flow
/worktree auth-fix Implement the approved fix
/btw What did we decide about session cleanup?
```

The `subagent` tool creates a shell pane through the hrdx socket API, then starts a Pi process with the requested session, model, thinking level, tools, and skills. Completion returns automatically through the Pi session sidecar.

## Worktrees

A worktree request creates a Git worktree with `git worktree add`. The extension opens that path as an hrdx workspace and starts Pi in its shell pane. Worktree state remains available for review. The extension does not push, merge, or delete branches.

## hrdx limits

hrdx exposes `running` and `busy` state. It does not expose Herdr process groups or a reliable blocked state. Pi activity files provide detail when available. Completion sidecars remain the primary evidence.

The hrdx backend uses the Unix socket beside the hrdx state file. Linux uses `$XDG_CONFIG_HOME/hrdx/hrdx.sock` or `~/.config/hrdx/hrdx.sock`. macOS and Windows use their normal hrdx application-data paths.

## Roles

Bundled roles live in `agents/`. Project and global role definitions override bundled roles. Role packs register through:

```text
pi-hrdx-subagents:roles:discover:v1
```

## Development

```bash
npm test
```

The package test performs syntax checks on the extension entry points. Run live integration tests only from an active hrdx session.
