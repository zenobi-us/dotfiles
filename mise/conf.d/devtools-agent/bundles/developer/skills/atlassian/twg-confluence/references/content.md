---
description: Create, read, update, move, archive, label, comment on, version, and export Confluence pages and content.
---

# Confluence Content

Use the unified `confluence content` surface for supported content operations.
Inspect live help because available content types and operations can differ by
build profile.

## Content Types

- `live_doc`: collaborative internal documents and ordinary new team content.
- `page`: classic pages, knowledge bases, customer-facing help, and operations
  that are page-only.
- `blogpost`: dated posts and announcements.
- `folder`: hierarchy-only containers.
- `whiteboard` and `database`: specialized formats when the build advertises
  support.

For known content, use the native get command with the stable ID or URL. Request
full body, comments, versions, or permissions only when the task needs them.

## Non-doc Read-back And Whiteboard Rendering

Non-doc body formats hydrate their bodies through `--format`, not `--detail`:

```bash
# Editable persisted whiteboard SVG.
twg confluence content get <ID-or-URL> \
  --format svg \
  --body-output-file /tmp/whiteboard.svg \
  --site <site>

# Persisted database rows and fields.
twg confluence content get <ID-or-URL> \
  --format csv \
  --body-output-file /tmp/database.csv \
  --site <site>
```

Do not add `--detail` to whiteboard, database, embed, or smart-link body reads;
those content types reject it. For whiteboard visual verification, request the
rendered PNG explicitly:

```bash
twg confluence content get <ID-or-URL> \
  --format png \
  --output json \
  --site <site> > /tmp/whiteboard-png.json
```

The response contains a short-lived signed media URL, normally in
`data.body.value`. Download the bytes behind that URL to a `.png` file, open the
file, and inspect the rendered layout before claiming visual verification.
`--body-output-file` writes the returned PNG body value (the URL), not the image
bytes. A URL alone is not visual proof.

## Writes

- Supply the title through the title option, not as the first body heading.
- Use body files for multiline or structured content.
- Resolve the destination space and parent before create, move, or copy.
- Read current state before update or delete.
- Verify the created or changed entity and report its stable URL.

Copy operations may copy only the selected entity rather than descendants.
Inspect the exact contract and do not imply a subtree copy without evidence.

## Exports

Export behavior depends on the requested format:

- Word export is synchronous and returns the download URL directly.
- PDF export starts an asynchronous task. Capture the returned task ID, poll
  the export-status command, and return the download URL after completion.

Do not poll Word exports, and do not treat the initial PDF task response as a
completed export.
