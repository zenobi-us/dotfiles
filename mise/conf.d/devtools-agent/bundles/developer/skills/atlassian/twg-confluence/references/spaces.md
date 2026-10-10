---
description: Create and manage Confluence spaces, keys, visibility, folders, page trees, and hierarchy.
---

# Confluence Spaces And Hierarchy

Use `confluence space` for space metadata and lifecycle. Use `confluence tree`
for graph-backed hierarchy reads.

## Space Operations

- Resolve the site and space key before acting.
- Read a space before archive, unarchive, or update.
- Distinguish the human-readable key from the numeric space ID required by some
  content creation commands.
- Check for key collisions before creating a new space.
- Treat private/public visibility as a consequential choice.

## Hierarchy

- Use folders for navigation-only containers.
- Use pages or live docs for nodes that should carry content.
- Resolve parent IDs before creating or moving children.
- Verify that the parent belongs to the destination space.
- Bound tree depth for discovery; hydrate only branches relevant to the task.

Space-scoped settings and agent context may require additional scopes. Report a
scope failure directly rather than substituting a content mutation.

## Space Instructions (read before authoring)

Before creating or editing content in a space, read that space's instructions —
its AGENTS.MD protocol (tone, casing, structure, canonical sources, routing,
what to avoid) — and apply them while authoring.

- Fetch with `confluence space instructions get --key <spaceKey>` (`-s <site>`
  selects the site; `--body-format` defaults to markdown). Use `--id <spaceId>`
  for a numeric space ID. A bare positional key remains available as the legacy
  form. When using `--key`, resolve the space key first; a personal space key
  looks like `~<accountid>`.
- When present, the instructions are authoritative for that space and override
  your defaults on conflict. Apply them throughout **all authored content** —
  the title, headings, body text, cell values, and sticky-note content, not just
  the title.
- A successful call returning an empty body means the space has no
  instructions — author with your normal defaults. If your build does not expose
  the command yet, note it and proceed with defaults; do not block.
- On the twg CLI this command is the single space-instructions path. Ignore any
  MCP-only guidance (a `getConfluenceSpaceInstructions` tool, `execute`/`discover`
  runners, `cloudId`) that appears in content-type prompt bundles — that is for
  the MCP surface, not for you.
