# Layout

Read this before you write an ingested source or authored note. Each file-backed
record can use a different store.

## Typed path rule

Resolve the record kind with `shared-context resolve <kind> ... --json`. Use its
`path` for file access and `ref` for cross-store links. Never join paths under
the alignment root or select a store from `mode`.

| Record | Command | Result |
|---|---|---|
| Alignment | `resolve alignment` | Alignment store root |
| Ticket | Ticket skill; local Markdown uses `resolve ticket --id <ID>` | External ticket reference or local file |
| Initiative | `resolve initiative --id <ID>` | Configured initiative directory |
| Workflow | `resolve workflow --id <ID>` | Configured workflow directory |
| Evidence | `resolve evidence --workflow <ID> --run <RUN>` | Configured evidence directory |
| Ticket source | `resolve source --ticket <ID> --source <SOURCE>` | Configured source directory |
| Library source | `resolve source --library --source <SOURCE>` | Configured source directory |
| ADR | `resolve adr --id <ID>` | Unique matching file in the alignment store, or the proposed file path |

The resolver prints a path and does not create it. Create the resolved directory,
or its parent for a file path, only when the operation writes there. IDs cannot
contain a slash or `..`. A source request must select exactly one of `--ticket`
and `--library`.

`<SOURCE>` starts with a lowercase letter and contains only lowercase letters,
numbers, and dashes: `confluence`, `jira`, `web`, `document`, `library-docs`,
or `local`. It must not contain slashes, dots, underscores, or uppercase letters.
Use an existing source name before you add one.

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
shared-context index "<source directory>"
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

Keep a source binary beside the Markdown that describes it.

- Put a screenshot used as ticket source material under the ticket's `local`
  source directory.
- Put workflow test screenshots under
  `workflows/<ticket>/artifacts/evidence/<run-id>/screenshots/`. The worktree
  skill owns that path.
- Keep a converted document beside its Markdown, for example
  `sources/library/document/superstream-spec.pdf` next to
  `superstream-spec.md`.
Copy the original into the store. Do not move it. The user's own copy stays where
it is.

Record the original in the Markdown frontmatter with `sha256`, `converter`, and
`local_copy`. Binary files carry no frontmatter, so `index` ignores them.
