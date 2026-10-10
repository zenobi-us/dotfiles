---
name: working-with-pi-coding-agent-shared-sessions
description: Use when you need to find, review, open, or remove Pi shared-session gists created via mono sharing.
---

# Working with Pi Coding Agent Shared Sessions

Use `scripts/pi-session-gists.ts` to manage Pi session-export gists. Filter first, verify with evidence, then delete intentionally.

## Rules

- You MUST run `list` first before any open or delete action.
- You MUST ask for an explicit `gist_id` for follow-up actions.
- You MUST NOT use row numbers or inferred index selection.
- Delete-all MUST require explicit confirmation unless `--yes` is supplied.

## Commands

Run the executable directly. It uses the exact `mise x -- bun --install=fallback` shebang.

```bash
./scripts/pi-session-gists.ts --help
./scripts/pi-session-gists.ts doctor
./scripts/pi-session-gists.ts list
./scripts/pi-session-gists.ts open <gist_id>
./scripts/pi-session-gists.ts delete <gist_id> --yes
./scripts/pi-session-gists.ts delete-all
./scripts/pi-session-gists.ts delete-all --yes
```

`gh` and GitHub authentication are required. `PI_SESSION_GIST_LIMIT` sets the list limit (default `200`).

The list command checks the first 40 lines of each gist for `<title>Session Export</title>`, reads metadata with `gh api`, and prints the gist ID, update date, size, title, and visibility.

## Verification

Run `./scripts/pi-session-gists.ts list`. Confirm that the table and next actions are visible. Use explicit gist IDs only.
