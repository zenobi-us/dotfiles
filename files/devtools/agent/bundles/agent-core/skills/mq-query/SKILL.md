---
name: mq-query
description: Use the mise-installed harehare/mq command to query, read, transform, and create Markdown or structured content, with the harehare/okf.mq extension always loaded for OKF documents and bundles. Use when an agent needs mq syntax, CLI flags, cookbook patterns, or OKF-aware file work. Routes each task to a focused procedure and the bundled upstream mq documentation.
---

# mq-query

Use `mq` as the required interface for local Markdown content. This includes
searching, reading, filtering, selecting, listing, summarising, validating,
transforming, and creating Markdown. Agents may use a domain or tracker CLI to
identify authoritative records and filesystem tools to check whether a path
exists, but they must use `mq` to inspect Markdown content.

Use `mq` for structured document work. The binary is installed through `mise`.

## Required module

Always load the `https://github.com/harehare/okf.mq` extension. Prefer the HTTP import form:

```mq
import "github.com/harehare/okf.mq"
```

Run HTTP-import queries with `--allow-http-import`. For raw Markdown input, use `-I raw` before calling `okf::` functions. For a local checkout of `okf.mq`, use `-L` and `include "okf"` instead.

Do not replace the OKF module with an ad hoc Markdown parser when the input is an OKF document or bundle.

## Workflow

1. Identify the task: query existing content, create content, or read and inspect content.
2. Read the matching task reference before writing the query.
3. Read the required upstream reference. Use the CLI reference for flags, the language references for syntax, and the cookbook for a close working pattern.
4. Check the input format. Use `-I raw` for text passed to `okf_parse`; use the matching `-I` format for JSON, YAML, XML, CSV, TOML, or other structured input.
5. Run `mq` from the mise environment. Keep permissions narrow. Add `--allow-http-import` for the required extension, and add only the sandbox permissions that the query needs.
6. Validate the result. For OKF bundles, use `okf_check_bundle` or `okf_validate_bundle` when the task changes or audits bundle content.

## Route by task

| Task | Read first |
|---|---|
| Query, filter, select, transform, or aggregate existing data | Read `references/tasks/querying.md`. |
| Create an OKF document, index, log, or bundle content | Read `references/tasks/creating.md`. |
| Read, inspect, validate, or summarise an OKF document or bundle | Read `references/tasks/reading.md`. |

## Quick reference

Read the upstream [mq Markdown processing skill](https://github.com/harehare/mq/blob/main/skills/processing-markdown/SKILL.md) for a compact selector, node-attribute, update, multi-file, format-conversion, and CLI-flag reference. Use it before the longer bundled references for common Markdown-only work.

Read `references/docs/cli.md` when choosing command flags. Read `references/docs/modules_and_imports.md` when importing modules or troubleshooting cache and lock files. Read `references/docs/types_and_values.md`, `references/docs/selectors.md`, or another language reference when the query syntax requires it. Read a matching file under `references/docs/cookbook/` when a cookbook pattern exists.

## Completion criteria

The task is complete only when the command uses `okf.mq`, the input and output formats are explicit, the query runs in the mise environment, and the result passes the relevant OKF or output validation.
