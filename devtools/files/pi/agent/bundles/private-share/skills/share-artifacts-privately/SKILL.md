---
name: share-artifacts-privately
description: Use when an agent must publish an HTML session export through the private-share GitHub Pages repository, especially when setup, filename and sessions.jsonl rules, validation, or safe push behavior must be enforced.
---

# Share Artifacts Privately

## Overview

Use the bundled `scripts/private-share.mjs` CLI as the only mutation path. The published `gh-pages` branch MUST obey [the branch contract](assets/web/llms.txt): HTML exports live under `sessions/`, every export has one `sessions.jsonl` record, and unrelated files are not committed.

A private repository does not by itself make its Pages site private. GitHub Pages access control requires an eligible organization-owned project site and GitHub Enterprise Cloud. Verify Pages visibility before uploading; if private publication is unavailable, stop rather than publish publicly.

## Supported Input

The branch contract currently defines **HTML session exports only**. If the input is a directory, archive, or another file type, stop and report that the workflow is not defined rather than inventing an `/s/<hash>` layout.

## Process

### 1. Resolve inputs

Require:

- an existing `.html` file to share;
- a repository in `owner/repo` form when setup is required;
- a short human-readable title or enough filename context to derive one.

Inspect the export for credentials, tokens, private keys, or unrelated confidential data. If exposure is unclear, ask before publishing.

### 2. Preflight the CLI

Resolve paths relative to this skill directory, not the caller's project directory.

```bash
cd <share-artifacts-privately-skill-directory>
command -v gh
gh auth status
./scripts/private-share.mjs --help
```

All commands MUST exit successfully before continuing. If `--help` crashes, a command handler is still a placeholder, or the documented subcommands are absent, stop and report the CLI defect. Do not silently replace the CLI with ad hoc `gh`, `git`, or file-copy commands.

### 3. Set up once

Only run setup when `~/.config/private-share.json` is absent or the user explicitly requests a different repository. The CLI owns this file's schema; do not hand-edit it.

Expected interface, subject to confirmation by `--help`:

```bash
./scripts/private-share.mjs setup <owner/repo>
```

Setup MUST establish these postconditions before it is considered complete:

1. `<owner/repo>` exists and is private.
2. The `gh-pages` branch contains `index.html`, `sessions.jsonl`, and `scripts/validate-sessions-index.mjs` at the branch root.
3. GitHub Pages publishes from the `gh-pages` branch.
4. The CLI records the repository and Pages URL in its configuration.
5. GitHub Pages visibility is explicitly private, and the intended audience has repository read access.

Do not treat a zero exit code alone as proof. Verify the repository visibility, Pages source, and returned URL.

### 4. Share the export

Expected interface, subject to confirmation by `--help`:

```bash
./scripts/private-share.mjs share <path-to-session.html>
```

The CLI MUST produce a commit equivalent to this contract:

- Copy the export to `sessions/<isodate>-<snake-case-description>.html`.
- Use `YYYY-MM-DD` unless multiple exports on that day need ordering; then use `YYYY-MM-DDTHH-MM-SSZ`.
- Use only lowercase letters, numbers, and underscores in the description.
- Append exactly one JSON object to `sessions.jsonl` with `date`, `path`, and human-readable `title`.
- Keep the `date` field identical to the filename date prefix.
- Commit only the new export and index change.
- Use `add session export: <short-name>` as the commit message.
- Push without force.

Example record:

```jsonl
{"date":"2026-06-23","path":"sessions/2026-06-23-build_session_index.html","title":"Build session index"}
```

### 5. Validate before reporting success

The workflow is complete only after all checks pass:

1. Run the bundled validator from the published branch root:
   ```bash
   node scripts/validate-sessions-index.mjs
   ```
2. Confirm the new HTML file exists at the indexed relative path.
3. Confirm `sessions.jsonl` contains one matching record and every non-comment line parses as JSON.
4. Confirm `index.html` loads the record.
5. Confirm the push succeeded and the published URL resolves.
6. Confirm no unrelated files were committed.

Return the final URL plus the repository, branch, commit, and validation result. If any check cannot be completed, state exactly what remains unverified and do not claim the share succeeded.

## Quick Reference

| Situation | Action |
|---|---|
| CLI help or handler fails | Stop; report the defect |
| Setup missing | Run `setup <owner/repo>`, then verify all setup postconditions |
| HTML session export | Run `share <path>` and validate the branch contract |
| Directory or non-HTML artifact | Stop; unsupported by the current branch contract |
| Filename collision | Preserve the existing export; use a timestamped filename |
| Validation failure | Do not commit or push |
| Push conflict | Stop and report; never force-push |

## Common Mistakes

- Assuming private repository visibility makes GitHub Pages private.
- Publishing secrets because the command is named “private-share”.
- Following the script's old `/s/<hash>` comments instead of the `sessions/` branch contract.
- Hand-editing CLI configuration with an invented schema.
- Overwriting an existing export or duplicating its JSONL record.
- Returning a URL before validation, push, and Pages publication are verified.
