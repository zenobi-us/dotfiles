# Querying with mq

Read this file when the task filters, selects, transforms, aggregates, or converts existing content.

## Procedure

1. Choose the input format. Use `-I raw` for Markdown text that `okf.mq` must parse. Use `-I json`, `-I yaml`, `-I csv`, `-I xml`, or another matching format for structured files.
2. Write the smallest query that selects the required nodes or values.
3. Add the required OKF import at the start of the query:

```mq
import "github.com/harehare/okf.mq"
```

4. Run the query with `--allow-http-import` and an explicit output format when the result format matters:

```sh
mq --allow-http-import -I raw -F json \
  'import "github.com/harehare/okf.mq" | okf::okf_parse(.)["frontmatter"]["title"]' \
  concept.md
```

5. Use `--aggregate` or `--eval-all` only when the query needs all inputs together. Use `--allow-read=PATH` for query functions that read files.
6. Compare the result with the input when the query transforms data. Use `--diff` with `--update` before writing changes.

## Route to references

- Read `references/docs/cli.md` for flags and input/output formats.
- Read `references/docs/selectors.md` and `references/docs/operators.md` for selection and composition.
- Read `references/docs/cookbook/` for a matching document, table, section, link, or file-processing pattern.
- Read `references/docs/modules_and_imports.md` when the HTTP import fails or the lock file changes.

## Completion criteria

The query runs in the mise environment, uses `okf.mq`, produces the requested format, and leaves input files unchanged unless the task explicitly requires an update.
