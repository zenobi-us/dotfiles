---
schema: tracker-ticket/v1
id: artifact-share-02-stores-config
title: Read and write stores.toml in the XDG config directory
parent: artifact-share-publish-targets
sequence: 2
type: enhancement
triage: ready-for-agent
work_status: unclaimed
blocked_by:
  - artifact-share-01-rename
---

## What to build

Replace the JSON config with `stores.toml` at
`${XDG_CONFIG_HOME:-~/.config}/artifact-share/stores.toml`.

- A store has a name, an optional git `remote`, a `branch`, and zero or more
  `publish` targets. Each target has a `type` and a `public_url`, plus fields
  for its type. The initiative shows the shape.
- On first run, if the new file is missing and the old JSON config exists, the
  CLI writes the new file from it. Each old share becomes a store with its
  remote. If it has a `pages_url`, it also gets one `github-pages` target. The
  CLI leaves the old file in place and prints what it moved.
- `list` prints every store, its remote or "local only", and its targets with
  their public URLs.
- `create` writes the new store to the TOML file.
- The CLI writes TOML with a pinned `smol-toml` import, through a temporary file.
- The config holds no credentials. The CLI rejects keys that look like secrets
  (`secret`, `password`, `token`, `access_key`).

## Acceptance criteria

- [ ] `XDG_CONFIG_HOME` selects the config directory. Without it, the CLI uses
      `~/.config`.
- [ ] A test moves an old JSON config into an equal TOML config.
- [ ] A store with no remote and no targets is valid and `list` shows it.
- [ ] A config with a secret-like key fails with an error that names the key.
- [ ] `references/config.md` documents the schema.

## Comments
