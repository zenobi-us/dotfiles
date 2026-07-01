# Project overrides

Pair a global default with a per-project replacement: keep your usual hook, then have a trusted project file replace or disable it by `id`.

## Step 1: define the global hook with an id

`~/.pi/agent/hook/hooks.yaml`

```yaml
hooks:
  - id: idle-notify
    event: session.idle
    actions:
      - notify: "Global idle"
```

## Step 2: replace it in the project file

`<project>/.pi/hook/hooks.yaml`

```yaml
hooks:
  - override: idle-notify
    event: session.idle
    actions:
      - notify: "Project-specific idle"
```

## Step 3: trust the project

Either run PI with one-session trust:

```bash
PI_YAML_HOOKS_TRUST_PROJECT=1 pi
```

Or add the repo/worktree trust anchor to `~/.pi/agent/trusted-projects.json`.

## Disable instead of replace

```yaml
hooks:
  - override: idle-notify
    disable: true
```

## Important note

Overrides are resolved against hooks that were already loaded earlier. The intended authoring pattern is later-file-over-earlier-file, especially project-over-global.
