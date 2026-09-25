# Plan: Local artifact-share publication

## Goal

Make artifact-share stores available through stable local HTTPS URLs and make completed evidence reports publish through one safe store interface.

A bootstrapped machine must provide this command from any directory:

```text
~/.local/bin/artifact-share
```

Each registered store must have a stable local URL:

```text
https://<store>.artifacts.localhost/
```

A completed report must print its local URL. If its selected store is Git-backed, publication must commit and push only the files owned by that operation.

## Decisions

1. Keep the skill and source directory named `artifact-shares`.
2. Use `artifact-share` as the canonical terminal command.
3. Keep the config at `~/.config/artifact-shares.json`.
4. Make stores local-first. Git and a remote site are optional.
5. Use Traefik as the preferred local HTTPS ingress.
6. Use one loopback artifact server behind Traefik. Traefik does not serve files itself.
7. Serve only `public/` and `dist/public/`. Never serve the store root or `shared-context/`.
8. Keep report creation, validation, and publication as separate operations.
9. Point report `local_url` at the untouched self-contained HTML report.
10. Use exact path manifests for Git staging. Never use `git add .` for store publication.
11. Treat Git storage readiness and GitHub Pages readiness as separate states.
12. Run Git preflight before a write and publication finalization after the write.

## Current gaps

- The artifact-share CLI is only convenient through its skill-local path.
- The config requires a GitHub repository and has no local URL.
- `list` has no stable JSON output for other skills.
- Artifact publication stages the full worktree with `git add .`.
- Report validation prints a path but no served local URL.
- Report publication is not part of the writing-reports workflow.
- Shared-context guidance can create a store before it checks registered stores.
- Shared-context publication preflight happens after the write.
- No local service serves registered stores.

## Target config

Keep the file at `~/.config/artifact-shares.json` and introduce version 2:

```json
{
  "version": 2,
  "stores": [
    {
      "name": "work",
      "path": "~/.local/share/artifact-shares/work",
      "local_url": "https://work.artifacts.localhost/",
      "git_repo": "zenobi-us/work-shares",
      "git_branch": "main",
      "remote_url": "https://zenobi-us.github.io/work-shares/"
    },
    {
      "name": "personal",
      "path": "~/Documents/artifact-shares/personal",
      "local_url": "https://personal.artifacts.localhost/"
    }
  ],
  "local_server": {
    "provider": "traefik",
    "domain": "artifacts.localhost",
    "backend": "http://127.0.0.1:43119"
  }
}
```

Required store fields:

- `name`
- `path`
- `local_url`

Optional Git fields:

- `git_repo`
- `git_branch`
- `remote_url`

A store with no `git_repo` is local-only.

The loader must continue to read the current schema. An explicit `config migrate` command must write version 2. Read-only commands must not rewrite config.

## Terminal command and mise bootstrap

Add a mise dotfile entry to `files/devtools/agent/mise.unix.toml`:

```toml
"~/.local/bin/artifact-share" = {
  source = "./bundles/agent-core/skills/artifact-shares/scripts/artifact-shares/cli.ts",
  mode = "symlink",
}
```

The source is already executable. The direct symlink keeps the command synchronized with the skill source and avoids a wrapper.

Use `artifact-share` as the Crust application name and in user-facing examples. Skill-local execution remains the fallback on machines without the mise link.

## Store commands

Add or extend these commands:

```text
artifact-share config migrate [--dry-run]
artifact-share store add <name> --path <path> [Git options]
artifact-share store remove <name>
artifact-share store show <name> [--json]
artifact-share store verify <name>
artifact-share list [--json]
artifact-share url <name> [--artifact <hash>] [--json]
artifact-share serve [--listen 127.0.0.1:43119]
```

`list --json` is the integration contract for writing-reports and shared-context. Human output must remain concise.

Validate store-name DNS syntax, unique names, normalized unique paths, trailing URL slashes, Git field combinations, and local hostname consistency. Report malformed JSON with the config path.

## Safe publication

Before a Git-backed write:

1. Validate the selected store.
2. Confirm the checkout origin matches `git_repo`.
3. Confirm the current branch matches `git_branch`.
4. Confirm the expected upstream.
5. Fetch and fast-forward.
6. Refuse detached HEAD.
7. Record initial dirty paths.
8. Refuse pre-existing changes in paths owned by the operation.

For `share`, the owned manifest is:

```text
.types
content/shares/<hash>.mdx
public/s/<hash>/
```

Stage only the manifest. Verify `git diff --cached --name-only` before commit. Unrelated dirty files must remain untouched.

A local-only store runs all content checks but runs no GitHub command and no Git mutation.

Publication output must distinguish:

- `local_url`: untouched local artifact, such as `/s/<hash>/`
- `remote_url`: untouched artifact at a remote site, when available
- `page_url`: converted Fumapress page, when available
- Git status: enabled, commit, branch, and pushed

A rejected push must keep the local commit and report its SHA. Do not retry, rebase, or change upstream silently.

## Local artifact server

Add `artifact-share serve` as one host-aware loopback server. It reads the registry and maps the request hostname to a store.

Routes:

| URL path | Store source |
|---|---|
| `/s/**` | `<store>/public/s/**` |
| `/shares/**` | `<store>/dist/public/shares/**` |
| `/` and built assets | `<store>/dist/public/**` |
| `/healthz` | server health |

The server must bind to loopback by default, reload config changes, reject traversal, resolve symlinks safely, disable directory listings, and never expose `.git/`, `shared-context/`, config files, or the store root.

## Traefik service

Create a dedicated dotfile surface under `files/devtools/artifact-share/` for Traefik and service configuration.

Traefik must:

- Listen on local HTTPS port 443.
- Match `[a-z0-9-]+.artifacts.localhost`.
- Forward all matching hosts to `127.0.0.1:43119`.
- Use a locally trusted certificate for `*.artifacts.localhost`.
- Keep its dashboard disabled.
- Fail clearly when port 443 is already owned by Portless, devhostd, or another service.
- Never stop another ingress service automatically.

Mise bootstrap must install or apply the configs, certificate, backend user service, and Traefik service idempotently. Generated private keys must stay outside Git.

## Writing-reports integration

Add:

```text
writing-reports publish <report-directory> --into <store>
```

The command must:

1. Find `index.html`.
2. Validate the report.
3. Print an encoded `file://` URL after successful validation.
4. Run artifact publication as a dry run.
5. Stop on any dry-run failure.
6. Publish through `artifact-share share report`.
7. Print the served local URL.
8. Print remote URL and Git status when present.

`new` creates an unfinished report and must never publish. `validate` must never push.

Correct writing-reports entry-point shebangs to the repository-standard direct Bun form and add automated tests for URL encoding, validation failure, local-only publication, Git-backed publication, and paths containing spaces or reserved characters.

## Shared-context integration

Add a safe store-selection operation such as:

```text
shared-context use-artifact-store <name> --copy-existing
shared-context use-artifact-store <name> --empty
```

It must read `artifact-share list --json`, check registered stores before offering creation, require explicit selection when several stores exist, and write config atomically only after copy or empty-store validation succeeds.

Shared-context owns its origin-keyed layout, path manifest, index updates, and commit-message vocabulary. Artifact-share owns registry discovery and store verification. Neither operation may stage paths owned by the other.

Do not derive a web URL for files under `shared-context/`. Report the filesystem path and a Git blob URL only after a successful push.

## Delivery sequence

The implementation is intentionally serial:

1. **AS-01 — CLI and registry foundation**
   - Add the mise link.
   - Make `artifact-share` the canonical CLI name.
   - Add config v2 compatibility, migration, store commands, and JSON output.
2. **AS-02 — Safe local and Git publication**
   - Add local-only stores.
   - Add Git preflight, exact manifests, structured URL output, and rollback behavior.
3. **AS-03 — Local server and Traefik bootstrap**
   - Add `serve`, URL routing, security checks, TLS, and mise-managed services.
4. **AS-04 — Writing-reports delivery**
   - Add file URLs, publish command, artifact-share delegation, corrected shebangs, and tests.
5. **AS-05 — Shared-context store integration**
   - Add registry discovery, safe store selection, preflight/finalization split, and link-rule cleanup.
6. **AS-06 — End-to-end verification and documentation**
   - Test bootstrap, local serving, local-only publication, Git-backed publication, report behavior, and cross-skill staging isolation.

Each task requires an independent implementation review. A dependent task starts only after its predecessor passes review and is integrated.

## Acceptance criteria

- `artifact-share --help` works from `/tmp` after mise dotfile application.
- `artifact-share list --json` is stable and machine-readable.
- Existing config remains readable and migrates only on explicit request.
- Local-only stores publish without Git or GitHub.
- Git-backed stores commit and push only operation-owned paths.
- A completed report prints a working `https://<store>.artifacts.localhost/s/<hash>/` URL.
- The local report keeps its CSS and lightbox behavior.
- Traefik and the artifact server restart cleanly through mise bootstrap.
- Shared context is never exposed through the local web server.
- Shared-context writes and artifact publication cannot commit each other’s files.
- All new behavior has Bun tests and direct CLI smoke tests.
