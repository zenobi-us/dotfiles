---
description: Choose HTML or Markdown body formats, preserve macros, encode mentions, and avoid unsafe conversions.
---

# Confluence Body Formats

Use only formats advertised by the exact command and content type.

## HTML

HTML is the preferred lossless editing format for existing page-like content.
Use real structural tags such as `<p>`, `<h2>`, `<ul>`, `<code>`, and links. For the full compact schema, run `twg confluence content body-formats html`.

Before creating or editing a page, live doc, or blog post body, load and read
the body format help for the exact content type. Pass `--ack-body-formats` only
to attest that you read and will follow that help; never pass it otherwise:

```bash
twg confluence content body-formats html
```

For mentions, resolve the person and use a real Atlassian account ID:

```html
<span data-type="mention" data-user-id="AAID">@Display Name</span>
```

For arbitrary macros, use extension HTML — never storage XML like `<ac:structured-macro>`. Native Confluence macros use `data-extension-type="com.atlassian.confluence.macro.core"`; third-party/app macros use the same pattern with the exact type/key/params captured from an existing page. Omit `macroId`; Confluence generates it.

```html
<div data-type="extension" data-extension-key="toc" data-extension-type="com.atlassian.confluence.macro.core" data-parameters='{"macroParams":{"maxLevel":{"value":"3"}},"macroMetadata":{"schemaVersion":{"value":"1"},"title":"Table of Contents"}}'></div>
```

Use `bodied-extension` for body macros (`excerpt`, `details`) and `inline-extension` inside `<p>` for inline macros (`anchor`, `pagetree`). Popular native `macroParams`: `toc` `{minLevel,maxLevel}`, `children` `{all,depth}`, `include` `{"":"Page title"}`, `excerpt` `{name}`, `details` `{label}`, `detailssummary` `{cql,headings}`, `contentbylabel` `{cql,max}`, `attachments` `{patterns,labels}`, `jira` `{jqlQuery,showSummary}`, `viewpdf` `{name}`.

Do not invent opaque IDs for media, sync blocks, mentions, or embedded resources. Copy `data-id`, `data-collection`, `data-media-id`, `data-media-collection`, `data-resource-id`, and `data-local-id` only from existing content or tool output; omit `data-local-id` on new nodes.

## Markdown

Use `--format md` (preferred); `--format markdown` is also supported. Before
acknowledging the body format, load:

```bash
twg confluence content body-formats md
```

Markdown is suitable for new prose and repository-authored documentation when
the command supports it. It may not preserve every macro or storage-format
construct during round trips.

## Specialized Formats

Whiteboards and databases use their own specialized helper information. Do not
reuse page/blog/live-doc HTML or markdown guidance for these content types.

For whiteboards, load the whiteboard body-format helper before creating or
editing SVG content:

```bash
twg confluence content body-formats --content-type whiteboard
```

For databases, load the database body-format helper before creating CSV payloads
or edit envelopes:

```bash
twg confluence content body-formats --content-type database
```

Each helper returns an index and follow-up `--reference` paths for that content
type. Use the whiteboard helper only for whiteboards and the database helper
only for databases, then follow the referenced format contract exactly. Use
`--ack-body-formats` only after reading the exact helper output and
understanding the format contract.

Keep title and body separate. Prefer body files over shell-inline multiline
content. Verify rendered or returned content after consequential writes.
