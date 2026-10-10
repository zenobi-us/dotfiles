---
name: twg-confluence
description: >
  Use with root `twg` for Confluence content, spaces, hierarchy, authoring,
  editing, comments, versions, permissions, exports, and CQL. Applies
  Confluence semantics and safe write rules.
---

# twg-confluence

Use with the root `twg` skill whenever Confluence is the source of truth or a
Confluence mutation is required. This skill owns content-type, hierarchy,
format, and concurrency semantics; exact command grammar comes from live help.

## CLI launcher fallback

Run `twg <command>`. On shell `command not found`, use `$HOME/.local/bin/twg`
(macOS/Linux) / `$env:LOCALAPPDATA\Programs\twg\bin\twg.exe` (PowerShell), then
tell user to add that directory to PATH. Do not treat auth or command errors as
PATH failures.

## Use When

- A Confluence URL, content ID, space key, page title, or CQL expression is the
  primary anchor.
- The user asks to create, edit, move, copy, comment on, export, archive, or
  organize Confluence content.
- A workflow needs authoritative page bodies, hierarchy, versions,
  permissions, or space metadata.

Do not load this skill merely because a Confluence page is one supporting link
inside a broader workflow.

## First Route

| Intent | Route |
| --- | --- |
| Known content ID or URL | `confluence content get` |
| Exact Confluence filtering | Confluence search with CQL |
| Fuzzy page/topic discovery | Cross-product search, then native get |
| Create or update content | Unified `confluence content` surface |
| Space metadata/lifecycle | `confluence space` |
| Hierarchy | `confluence tree` |
| Export | Word returns a download directly; PDF requires export-status polling |

Use `twg help describe "<exact path>"` before an unfamiliar or consequential
mutation.

## Confluence Semantics

- Use the unified content surface for pages, blog posts, live docs,
  whiteboards, databases, folders, comments, versions, history, permissions,
  tasks, labels, and attachments when advertised.
- For Confluence Share dialog access changes, treat General access as
  `restriction-state` and Specific access rows as direct `permissions`:
  `Open / Can edit` -> `OPEN`, `Open / Can view` -> `EDIT_RESTRICTED`,
  `Restricted` -> `VIEW_RESTRICTED`; Specific `Can edit` -> `update`, and
  Specific `Can view` -> `read`.
- Use `confluence space` for spaces and `confluence tree` for hierarchy.
- A stable URL may resolve directly, but exact help remains authoritative about
  accepted ID, URL, site, and content-type forms.
- Search snippets are discovery candidates. Read the selected content before
  summarizing or editing it.
- Page titles are supplied separately from bodies. Do not repeat the title as
  the first body heading.

## Safe Authoring And Editing

- Before creating or editing content in a space, read that space's instructions
  with `confluence space instructions get --key <spaceKey>` (or with
  `confluence space instructions get --id <spaceId>`) and apply them while
  authoring; see `references/spaces.md`. Absent or empty ⇒ author with defaults.
- For an unspecified new internal "page," "doc," "write-up," "runbook," or
  notes artifact, prefer a live doc.
- Prefer a classic page for knowledge bases, customer-facing help, established
  classic-page spaces, page-only operations, or explicit page requests.
- For non-trivial edits, read current content, save the body locally, edit the
  file, then update with the snapshot token.
- Use the lossless HTML round trip when macros or exact storage representation
  matter.
- Use `--dry-run` only for explicit preview or validation requests, or for
  unusually risky edits where direct execution was not requested.
- Read back the content or space after mutation and report its URL.

## Handoffs

- Load `twg-context-discovery` for related Jira work, projects, goals, or
  dependencies; load `twg-responsibility-routing` for people, ownership,
  authority, or escalation.
- Load `twg-status-rollups` when pages contribute to a broader status report.
- Load `twg-operational-health` for runbooks, incidents, PIRs, or reliability
  evidence.

## References

- `references/content.md` - content types, reads, writes, and exports
- `references/editing.md` - concurrency-safe body editing
- `references/spaces.md` - space lifecycle and hierarchy
- `references/querying.md` - CQL and fuzzy discovery
- `references/body-formats.md` - HTML, markdown, mentions, and special formats
