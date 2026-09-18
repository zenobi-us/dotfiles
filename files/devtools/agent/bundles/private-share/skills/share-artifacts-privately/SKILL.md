---
name: share-artifacts-privately
description: Publish an artifact through the private-share GitHub Pages repository.
---

# Share Artifacts Privately

Use `scripts/private-share.ts` as the only mutation path. It uses Bun and the exact `mise x -- bun --install=fallback` shebang.

Publishing is explicit-only. `setup` and `share` mutate remote state. `--help`, `self-test`, `validate`, and `doctor` are read-only.

## Preflight

Resolve paths relative to this skill directory.

```bash
./scripts/private-share.ts --help
./scripts/private-share.ts doctor
./scripts/private-share.ts self-test
./scripts/private-share.ts validate
```

The CLI requires `gh`, GitHub authentication, `git`, a private repository, Pages setup, and `~/.config/private-share.json`. It owns the config schema.

## Commands

```bash
./scripts/private-share.ts setup <owner/repo>
./scripts/private-share.ts share <path>
./scripts/private-share.ts share <path> --title "Build session index"
```

The CLI preserves the branch contract: shares are under `s/<hash>/`, directory archives are `s/<hash>.zip`, and each share has one `sessions.jsonl` record. HTML files become `index.html`; other files get a download page; directories get a zip archive. It validates before commit and push and never force-pushes.

Confirm that the artifact contains no credentials or unrelated confidential data before sharing. Verify Pages visibility for sensitive data.

The bundled `assets/web/scripts/validate-sessions-index.ts` is a direct Bun validator and is copied into the published branch.
