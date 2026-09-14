# Sources

One fetch recipe per source type. Read this at step 6 of `references/ingest.md`.

`references/layout.md` owns the filename rule and the frontmatter contract. This
file adds only what is specific to a source.

## Repository skills win

A repository can ship its own access rule in `.agents/skills/`. That rule beats
every default below. Check first:

```bash
ls "<repository-root>/.agents/skills/"
```

Example: `reckon-frontend` ships `.agents/skills/confluence/` with its own script
and forbids raw MCP calls and `WebFetch` for Confluence. Read that skill for the
exact subcommand. Follow the repository. Do not substitute the bundle skill.

## Recipes

| Source | Directory | Tool | Comparator |
|---|---|---|---|
| Confluence page | `confluence` | repository `confluence` skill, else `developer:twg-confluence` | `version` |
| Jira issue | `jira` | repository `jira` skill, else `developer:twg-jira` | `updated` |
| Web page | `web` | `WebFetch`, or `lynx -dump` for a plain page | body text |
| PDF, DOCX, PPTX, XLSX, image, audio | `document` | `agent-core:docling` | `sha256` |
| Library or SDK documentation | `library-docs` | the library's own docs site through `WebFetch` | body text |
| Local text file | `local` | `cp` | `sha256` |
| Screenshot | none — see below | the tool that took it | none |

## Confluence

Extra frontmatter: `space`, `version`, `parent_id`.

A Confluence read returns the body and the version together. Fetch, then compare
`version` against the existing copy, then decide whether to write. There is no
metadata-only read, so a refresh always costs a fetch. Allow a long timeout — the
`reckon-frontend` script asks for 180000 ms.

## Jira

Extra frontmatter: `issue_type`, `status`, `status_category`, `priority`,
`assignee`, `reporter`, `labels`, `created`, `updated`, `comment_count`.

Child issues go in `jira/children/`. Text you have not yet posted goes in
`jira/drafts/`. Never let a draft reach the same filename as a fetched issue.

## Documents

`docling` is not on `PATH` here. Run it through `uvx`:

```bash
uvx --from docling docling <input> --to md --output <anchor directory>
```

- Copy the original into the anchor directory first, then convert the copy.
- Docling writes `<input stem>.md` into the output directory. That stem is the
  filename the layout rule already chose.
- A scanned document needs OCR. Docling enables OCR when it finds no text layer.
  If the output is empty or nearly empty, the document is scanned and the run
  needs OCR options. Read `agent-core:docling` before you add flags.
- A large PDF takes minutes. Allow a long timeout. Do not kill and retry.
- Docling writes no frontmatter. Prepend it yourself with `Edit` or a heredoc, then
  run `index`. Writing frontmatter by hand is required. Writing `index.md` by hand
  is not.

Extra frontmatter: `sha256` of the original, `converter: "docling"`, `local_copy`,
and `page_count` when docling reports one.

## Web pages

Prefer `WebFetch`. Use `lynx -dump <url>` when the page is plain HTML and you want
the text with no rendering. Record the fetched URL in `url`, not a redirect target,
unless the redirect is permanent.

## Screenshots

A screenshot is not a source directory. Write it at the work-key root as
`<root>/<KEY>/screenshot-<subject>.png` and reference it from the note that
explains it. `index` ignores binary files.

## Adding a source type

Add a row to the table above. Name the directory, the tool, and the comparator. Do
not change `references/layout.md` — the contract is the same for every source.
