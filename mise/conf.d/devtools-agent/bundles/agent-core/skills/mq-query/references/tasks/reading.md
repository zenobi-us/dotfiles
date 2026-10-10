# Reading and validating OKF content

Read this file when the task inspects, extracts, validates, or summarises an OKF document or bundle.

## Single document

Use raw input and parse it through the required extension:

```sh
mq --allow-http-import -I raw -F json \
  'import "github.com/harehare/okf.mq" | okf::okf_parse(.)' \
  concept.md
```

Use these functions for focused reads:

- `okf::okf_type(doc)` returns the document type.
- `okf::okf_validate(doc)` returns structured validation errors.
- `okf::okf_extract_links(body)` returns links and link kinds.
- `okf::okf_extract_citations(body)` returns citation entries.

## Bundle

Use `okf::okf_check_bundle(root)` for a complete health check. It discovers files from the bundle index, loads them, validates reserved files and concept documents, and checks internal links.

```sh
mq --allow-http-import -I null -F json \
  'import "github.com/harehare/okf.mq" | okf::okf_check_bundle("./bundle")'
```

Use `okf::okf_summarize(files)` for a compact overview after loading the bundle. Use `okf::okf_format_validation_errors(errors)` when a human-readable report is required.

## Route to references

- Read `references/docs/modules_and_imports.md` for import, cache, and lock behaviour.
- Read `references/docs/functions.md` for function calls and pipelines.
- Read `references/docs/cookbook/extract-frontmatter.md`, `references/docs/cookbook/extract-links-from-html.md`, or another matching extraction recipe.
- Read `references/docs/reference-index.md` for the language reference index.

## Completion criteria

The command uses `okf.mq`, reports structured results, and returns a clear validation result. A bundle read is complete only when `okf_check_bundle` has run or the task records why a full bundle check is not applicable.
