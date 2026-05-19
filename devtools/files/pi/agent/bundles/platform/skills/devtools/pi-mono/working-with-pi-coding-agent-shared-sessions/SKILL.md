---
name: working-with-pi-coding-agent-shared-sessions
description: Use when you need to find, review, open, or remove Pi shared-session gists created via mono sharing, especially when session exports clutter gist history; this provides a repeatable workflow and script-driven actions for listing, opening, and deleting safely.
---

# Working with Pi Coding Agent Shared Sessions

## Overview

Use this skill to manage Pi shared-session gists created from session exports. 

Core principle: **filter first, verify with evidence, then delete intentionally**.

This skill provides a script that:
- lists Pi session-export gists in a table (`date`, `title`, `size`),
- offers immediate next actions (open one, delete one, or delete all),
- uses `gh` as the source of truth.

## Agent Operating Rules (Pi Chat)

- You MUST run `list` first before any open/delete action.
- You MUST ask the user for an explicit **gist_id** for follow-up actions.
- You MUST NOT use row numbers or inferred index selection.
- For single-item deletion, you SHOULD execute `gh gist delete <gist_id> --yes` directly.
- For delete-all, you MUST require explicit user confirmation before running bulk delete.

## When to Use

Use this when:
- `gh gist list` is noisy and you only want Pi shared-session exports,
- you want to inspect sessions via `https://pi.dev/session/#<gist_id>`,
- you need a safe bulk-delete flow for old Pi session exports.

Do **not** use this for:
- non-Pi gists you still need,
- deleting without reviewing the filtered list first.

## State Flow

```text
[Start]
   |
   v
[List Pi session gists] --none--> [Stop]
   |
   v
[Review table: date/title/size]
   |
   +--> [Open one in browser] --> [Review session] --> [Back to review]
   |
   +--> [Delete one] -----------> [Back to review]
   |
   +--> [Delete all listed] ----> [Verify empty / done]
```

## Script

Path:
- `./ai/files/skills/devtools/working-with-pi-coding-agent-shared-sessions/scripts/pi-session-gists.sh`

Make executable once:

```bash
chmod +x ./ai/files/skills/devtools/working-with-pi-coding-agent-shared-sessions/scripts/pi-session-gists.sh
```

## Quick Reference

| Goal | Command |
|---|---|
| List Pi session gists in table | `./ai/files/skills/devtools/working-with-pi-coding-agent-shared-sessions/scripts/pi-session-gists.sh list` |
| Open one in Pi web UI | `./ai/files/skills/devtools/working-with-pi-coding-agent-shared-sessions/scripts/pi-session-gists.sh open <gist_id>` |
| Delete one gist (direct GH CLI) | `gh gist delete <gist_id> --yes` |
| Delete one gist (script wrapper) | `.../pi-session-gists.sh delete <gist_id> --yes` |
| Delete all listed Pi session gists | `.../pi-session-gists.sh delete-all` |
| Delete all listed without prompt | `.../pi-session-gists.sh delete-all --yes` |

## How Listing Works

The script:
1. reads gist candidates from `gh gist list --limit 200` (configurable),
2. validates each candidate by checking for Pi session export marker: `<title>Session Export</title>`,
3. fetches gist metadata with `gh api gists/<id>`,
4. prints a table with:
   - gist id,
   - updated date,
   - total size,
   - session title (description or first file name),
   - visibility.

After listing, it explicitly offers next commands to:
- open one in browser,
- delete one,
- delete all filtered Pi session gists.

## How to Open a Session

Use:

```bash
./ai/files/skills/devtools/working-with-pi-coding-agent-shared-sessions/scripts/pi-session-gists.sh open <gist_id>
```

This opens:
- `https://pi.dev/session/#<gist_id>`

Use this before deletion if you need to confirm content.

## How to Delete

Single delete:

```bash
./ai/files/skills/devtools/working-with-pi-coding-agent-shared-sessions/scripts/pi-session-gists.sh delete <gist_id>
```

Bulk delete (only filtered Pi session gists):

```bash
./ai/files/skills/devtools/working-with-pi-coding-agent-shared-sessions/scripts/pi-session-gists.sh delete-all
```

Non-interactive bulk delete:

```bash
./ai/files/skills/devtools/working-with-pi-coding-agent-shared-sessions/scripts/pi-session-gists.sh delete-all --yes
```

## Common Mistakes

- Deleting by manual gist ID list without a fresh filtered listing.
- Assuming all `.html` gists are Pi sessions without checking export marker.
- Bulk deleting without opening recent sessions first.
- Running with stale auth (`gh auth status` should be healthy).
- Using row numbers from chat output instead of explicit gist IDs.

## Verification

Run:

```bash
./ai/files/skills/devtools/working-with-pi-coding-agent-shared-sessions/scripts/pi-session-gists.sh list
```

Then confirm that:
- table output includes date/title/size,
- suggested next actions are printed,
- open/delete/delete-all commands are visible and usable.
