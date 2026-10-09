# Creating OKF content with mq

Read this file when the task creates an OKF concept document, `index.md`, `log.md`, or another generated result.

## Procedure

1. Define the OKF fields before writing the query. Every concept document needs a non-empty `type` field. Add the title, description, resource, tags, and other fields required by the project.
2. Import `okf.mq` and build the document with `okf::okf_new`. Pipe the result to `okf::okf_stringify` when the output must be Markdown:

```mq
import "github.com/harehare/okf.mq" |
okf::okf_new(
  "Concept",
  {title: "Example", description: "A short description"},
  "# Example\n\nBody text."
) | okf::okf_stringify(.)
```

3. Create a bundle index with `okf::okf_build_index`. Create log content with `okf::okf_build_log` when the task needs a log.
4. Run with `-I null` when the query creates a value without input. Use `-F text` for Markdown output:

```sh
mq --allow-http-import -I null -F text \
  'import "github.com/harehare/okf.mq" | okf::okf_new("Concept", {title: "Example"}, "# Example") | okf::okf_stringify(.)'
```

5. Validate each document with `okf::okf_validate`. Validate a complete bundle with `okf::okf_check_bundle` after writing all files.
6. Preserve the OKF reserved-file rules. `index.md` and `log.md` have special structure. The bundle-root `index.md` may carry `okf_version`.

## Route to references

- Read `references/docs/modules_and_imports.md` for imports and module loading.
- Read `references/docs/types_and_values.md` and `references/docs/functions.md` for value construction.
- Read `references/docs/cookbook/add-row-to-table.md`, `references/docs/cookbook/update-text-in-place.md`, or another matching recipe for output updates.
- Read `references/docs/modules.md` for the upstream extension list. The imported module remains `https://github.com/harehare/okf.mq`.

## Completion criteria

Every generated concept has a valid non-empty `type`, generated reserved files follow OKF structure, the output is written in the requested format, and bundle validation returns no errors.
