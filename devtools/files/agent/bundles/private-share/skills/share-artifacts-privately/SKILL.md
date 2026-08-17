---
name: share-artifacts-privately
description: Use when an agent must publish an artifact through the private-share GitHub Pages repository, especially when setup, /s/<hash> paths, sessions.jsonl rules, validation, or safe push behavior must be enforced.
---

# Share Artifacts Privately

## Overview

Use the bundled `scripts/private-share.mjs` CLI as the only mutation path. The published `gh-pages` branch MUST obey [the branch contract](assets/web/llms.txt): shares live under `s/<hash>/`, directory archives live at `s/<hash>.zip`, and each share has one `sessions.jsonl` record.

A private repository does not always make its Pages site private. GitHub Pages access control requires an eligible organization-owned project site and GitHub Enterprise Cloud. Verify Pages visibility before uploading sensitive data.

## Supported Input

The CLI accepts:

- an HTML file;
- another single file;
- a directory.

For an HTML file, the CLI copies it to `s/<hash>/index.html`.

For another file, the CLI copies it to `s/<hash>/<filename>` and creates a small `index.html` with a download link.

For a directory, the CLI copies the directory contents to `s/<hash>/` and creates `s/<hash>.zip`.

## Process

### 1. Resolve inputs

Require:

- an existing file or directory to share;
- a repository in `owner/repo` form when setup is required;
- a short human-readable title, or enough path context to derive one.

Inspect the artifact for credentials, tokens, private keys, or unrelated confidential data. If exposure is unclear, ask before publishing.

### 2. Preflight the CLI

Resolve paths relative to this skill directory, not the caller's project directory.

```bash
cd <share-artifacts-privately-skill-directory>
command -v gh
gh auth status
./scripts/private-share.mjs --help
./scripts/private-share.mjs self-test
```

All commands MUST exit successfully before continuing. If the CLI fails, stop and report the defect. Do not replace the CLI with ad hoc `gh`, `git`, or file-copy commands.

### 3. Set up once

Only run setup when `~/.config/private-share.json` is absent or the user explicitly requests a different repository. The CLI owns this file's schema.

```bash
./scripts/private-share.mjs setup <owner/repo>
```

Setup MUST establish these postconditions before it is complete:

1. `<owner/repo>` exists and is private.
2. The `gh-pages` branch contains `index.html`, `sessions.jsonl`, and `scripts/validate-sessions-index.mjs` at the branch root.
3. GitHub Pages publishes from the `gh-pages` branch.
4. The CLI records the repository and Pages URL in `~/.config/private-share.json`.
5. GitHub Pages visibility is private when the artifact contains sensitive data.

### 4. Share the artifact

```bash
./scripts/private-share.mjs share <path>
```

Use `--title` when the file name is not clear:

```bash
./scripts/private-share.mjs share <path> --title "Build session index"
```

The CLI MUST produce a commit equivalent to this contract:

- Put the share entry point at `s/<hash>/index.html`.
- Put related share files under `s/<hash>/`.
- Put a directory archive at `s/<hash>.zip`.
- Append exactly one JSON object to `sessions.jsonl`.
- Include `hash`, `date`, `path`, `title`, and `kind` in the record.
- Include `zipPath` only for a directory share.
- Commit only the new share files and `sessions.jsonl`.
- Use `add share: <short-name>` as the commit message.
- Push without force.

Example HTML record:

```jsonl
{"hash":"abc123def456","date":"2026-06-23T14-30-00Z","path":"s/abc123def456/","title":"Build session index","kind":"html"}
```

Example directory record:

```jsonl
{"hash":"abc123def456","date":"2026-06-23T14-30-00Z","path":"s/abc123def456/","zipPath":"s/abc123def456.zip","title":"Build session index","kind":"directory"}
```

### 5. Validate before reporting success

The workflow is complete only after all checks pass:

1. Run the bundled validator from the published branch root:
   ```bash
   node scripts/validate-sessions-index.mjs
   ```
2. Confirm that the new `s/<hash>/index.html` file exists.
3. For a directory, confirm that `s/<hash>.zip` exists.
4. Confirm that `sessions.jsonl` contains one matching record.
5. Confirm that the push succeeded.
6. Confirm that no unrelated files were committed.

Return the final URL plus the repository, branch, commit, and validation result. If any check cannot be completed, state what remains unverified.

## Quick Reference

| Situation | Action |
|---|---|
| CLI help or handler fails | Stop; report the defect |
| Setup missing | Run `setup <owner/repo>`, then verify postconditions |
| HTML file | Run `share <path>` |
| Single non-HTML file | Run `share <path>` |
| Directory | Run `share <path>` and return both URLs |
| Duplicate hash | Return the existing URL |
| Validation failure | Do not commit or push |
| Push conflict | Stop and report; never force-push |

## Common Mistakes

- Assuming private repository visibility makes GitHub Pages private.
- Publishing secrets because the command is named “private-share”.
- Hand-editing CLI configuration with an invented schema.
- Overwriting an existing share.
- Duplicating a `sessions.jsonl` record.
- Returning a URL before validation, push, and Pages publication are verified.
