# Layout

Read this before any write under `ALIGNMENT_ROOT`. It applies to ingested source
material and to notes you author.

## Anchor rule

Every ingested file lives in a source directory under an anchor.

| Condition | Anchor |
|---|---|
| A work key is active (ticket key, branch ticket) | `<root>/<KEY>/<source>/` |
| No work key | `<root>/library/<source>/` |

Get the directory from the CLI. Do not build the path by hand:

```bash
"<skillroot>/scripts/shared-context/cli.ts" anchor --source confluence --key RWR-16627
"<skillroot>/scripts/shared-context/cli.ts" anchor --source web --dry-run
```

`anchor` creates the directory and prints the absolute path. `--dry-run` prints the
same path and creates nothing. Use `--dry-run` when you are planning. Both forms refuse
a key or source containing a slash or `..`.

`<source>` is one lowercase word: `confluence`, `jira`, `web`, `document`,
`library-docs`, `local`. Use an existing directory name before you invent one.

Work-key directories also hold task material that is not an ingest: `planning.md`,
`workflow-record.md`, `deliverable-tasks/`. Those keep their existing names.

## Filename rule

One source, one file. Pick the name with the first rule that applies.

| Condition | Filename | Example |
|---|---|---|
| The source has a native id | `<id>.md` | `4280287398.md`, `RWR-16627.md` |
| The source is a file on disk | kebab-case of the filename stem | `superstream-spec.pdf` → `superstream-spec.md` |
| Neither | kebab-case slug of the title | `rfc-2119.md` |

A file on disk uses its filename, not its title. The Markdown then sits beside the
original binary under the same stem.

You **MUST NOT** write `4280287398-2.md`, `-copy`, or a date suffix. A second copy
of one source is a defect.

## Frontmatter contract

Every ingested Markdown file **MUST** open with these six fields, in this order:

```yaml
---
source: "confluence"
id: "4280287398"
title: "Leave Management - Phase 1 - Leave screen"
url: "https://reckon.atlassian.net/wiki/pages/viewpage.action?pageId=4280287398"
fetched_at: "2026-09-14T04:10:06.000Z"
linked_from: ["RWR-16627"]
---
```

- `source` — the source directory name.
- `id` — the native identifier. Use the filename stem when there is none.
- `title` — the title the source itself reports. Trust the fetch over an older
  copy.
- `url` — the canonical remote address. For a file taken from disk, the absolute
  path it came from. That path records provenance and may not exist on another
  machine, so add `local_copy` naming the copy inside the store.
- `fetched_at` — UTC, ISO 8601.
- `linked_from` — work keys that reference this file. `[]` for a `library/` file.

Add source-specific fields after those six: `space`, `version`, `parent_id`,
`status`, `assignee`, `updated`, `sha256`, `converter`, `page_count`, `local_copy`.

`page_id` is a legacy alias for `id`, and older files use other shapes. A refresh
is a rewrite: bring the frontmatter to this contract in the same write. Do not open
an older file only to reformat it.

## Authored-content guard

Some files at ingest paths hold hand-written analysis, not a fetched body. They
look like ingests and are not.

Before you overwrite, read the target. **STOP and ask the user** when any of these
is true:

- The body is analysis about the source rather than the source's own content.
- The frontmatter `id` or `url` does not match the source you are fetching.
- The file holds headings the source does not have, such as "Why this page matters".

Losing that work is worse than a stale copy. Ask.

A file can hold both a fetched body and authored analysis. There is no automatic
merge. Offer the user this split and wait for an answer:

- Move the analysis to a sibling `<id>-notes.md` with its own frontmatter.
- Refresh `<id>.md` from the source.
- Link the two with `linked_from`.

## Refresh rule

1. Check whether the target file exists. If it does not, write it.
2. Apply the authored-content guard.
3. Compare the existing copy against the fetch, using the comparator for the source:

   | Source | Comparator |
   |---|---|
   | Confluence | `version` |
   | Jira | `updated` |
   | Document, local file | `sha256` of the original |
   | Web page | the body text |

4. If the values match, skip the write and report the skip.
5. If they differ, overwrite the whole file and set a new `fetched_at`.

Most fetch tools return the body and the metadata together. Comparing after the
fetch is normal. The comparison decides whether to write, not whether to fetch.

## Index rule

After you add or remove a file in a source directory, rebuild its index:

```bash
"<skillroot>/scripts/shared-context/cli.ts" index "<anchor directory>"
```

The command reads every sibling `.md` file's frontmatter and writes the list
between these markers:

```
<!-- shared-context:index start -->
<!-- shared-context:index end -->
```

Text outside the markers is kept. An `index.md` with no markers is treated as
hand-written and the command refuses to touch it.

Adding the markers to a hand-written `index.md` is itself an edit to someone's
work. Ask before you do it. Then run the command again. Use `--force` only when the
user agrees to lose the existing file.

Do not hand-write the list inside the markers. Hand-written indexes drifted into
three different shapes in this store.

## Binary assets

Screenshots and source binaries live beside the Markdown that describes them.

- A screenshot attached to a work key: `<root>/<KEY>/screenshot-<subject>.png`.
- A converted document: keep the original beside the Markdown, for example
  `library/document/superstream-spec.pdf` next to `superstream-spec.md`.

Copy the original into the store. Do not move it. The user's own copy stays where
it is.

Record the original in the Markdown frontmatter with `sha256`, `converter`, and
`local_copy`. Binary files carry no frontmatter, so `index` ignores them.
