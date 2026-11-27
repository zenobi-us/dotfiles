# Content ownership and authoring

## Canonical content

| Content | Canonical location | Website treatment |
| --- | --- | --- |
| Module overview | `mise/conf.d/<module>/README.md` | Render as the module introduction. List its notable capabilities. |
| Capability with an existing directory | `README.md` and `HOWTO.md` in that directory, unless an existing canonical location applies | Render an overview and separate task guide. |
| Standalone tool or capability spanning files | Module-local capability documentation directory chosen against existing conventions | Keep code in place. Link overview and task guide from the module. |
| Existing bundle or skill | Existing bundle source and published routes | Link the existing destination. Preserve its current filename and guide conventions. |

Each module README uses a level-two `Notable items` heading for its repository link index. On the website, the module page renders that index once as linked rows and omits the duplicate README section. Other authored sections remain visible.

Each module must have an authored README. Each newly documented notable capability must have an authored README and HOWTO. Existing canonical bundle and skill documentation is the exception: link it rather than manufacture uppercase duplicates of its existing guides.

The selected directory layout is implemented under `/modules/`. Every module owns `docs.json` and `README.md`. Standalone tools use `docs/<item-id>/README.md` and `docs/<item-id>/HOWTO.md`. Use existing dedicated capability directories for colocated documentation. `docs/website/src/lib/module-files.ts` owns manifest validation and path safety; `module-collections.ts` owns the two build collections. Use these implementations rather than inventing another schema.

`docs.json` has `title`, `description`, and a non-empty `items` array. Each item has a stable `id`, `title`, `description`, `kind`, and module-relative `sources`. Choose either module-relative `readme` and `howto` paths, or `href` to an existing bundle or canonical item page. Keep source paths inside the module. Keep credentials out. A display-title edit changes `title`, not the stable `id` or published URL.

| Route | Canonical input |
| --- | --- |
| `/modules/` | Module summaries grouped by folder-name family |
| `/modules/<module>/` | Module README and declared items |
| `/modules/<module>/items/<item>/` | Item README |
| `/modules/<module>/items/<item>/how-to/` | Item HOWTO |

`miseModules` contains summaries only. `miseDocuments` publishes only manifest-listed Markdown. It uses the shared Markdown compiler and writes one `{html, source}` JSON document per page.

Build paths under `.content-collections/module-documents/<module>/` are `overview.json`, `<item-id>/overview.json`, and `<item-id>/howto.json`. Route loaders import one document lazily. Relative links to registered Markdown become website links; other repository-relative links retain source provenance.

Static route discovery reads the same validated manifests. Restart the development server after adding or removing modules, or changing item IDs, document paths, or canonical links. Discovery and document include paths are fixed when configuration loads. A display-title-only edit does not change the inventory. Inspect `docs/website/content-collections.ts`, existing routes, and `src/lib/markdown.ts` before adding ingestion. Keep repository-backed content at its source; do not copy it into `docs/website/content/` just to feed the site. Deduplicate tools repeated across platform files. When a capability appears in multiple modules, identify its canonical owner and link other integrations to it.

## README visual

Put the title first. Encourage an informative visual immediately after it, before long explanations. Use a screenshot for visible interfaces, a terminal capture for CLI results, or a diagram for a headless relationship. Add meaningful alt text and a caption describing the displayed state. Redact secrets and private paths. Keep capture files beside their canonical document or in its existing assets directory. Check image paths in both repository Markdown and generated HTML.

A missing visual does not block publication. Use an explicit authoring prompt when generating an authoring template. On reader-facing pages, show useful text without broken image links or an empty screenshot frame. Never fabricate a capture. A component guide still needs a working component example; its screenshot cannot replace that example.

## HOWTO

Name one task and its expected result. State prerequisites, supported environment, permissions, and required warnings. Give ordered steps with commands verified against the source and runtime. Finish with an observable verification step and safe recovery. Link back to the capability overview. Keep required steps and warnings visible rather than hidden in tabs or disclosures.

## External boundaries

| Boundary | Owner and definition | Validation and compatibility |
| --- | --- | --- |
| Skill metadata | Host skill format; `writing-skills` anatomy guidance | Host discovery and website skill schema; preserve host keys. |
| Website Markdown frontmatter and compiled content | `docs/website/content-collections.ts` schemas and existing Markdown compiler | Existing website build; preserve the consuming collection's fields. New module ingestion needs an explicit schema decision, not a fictional supported contract. |
| Module item manifests (`docs.json`) | Website `src/lib/module-files.ts` schema | `moduleFiles` and website build; stable item IDs, no automatic conversion or mutation on read. |
| Source configuration and tool metadata | Actual module configuration and its runtime | Read without mutation for documentation inventory. Publish no credential values. |
| `contracts.json` | `skill-contracts` built-in manifest | Public manifest validator. Explicit empty declarations; no conversions. |
| Prose, screenshots, and diagrams | Human/agent guidance and external image formats | Render and inspect; no independent internal record identifier. |

This skill owns no persistent record format, history reader, or converter. It accepts and produces no declared internal record contracts. Do not add schema identifiers to existing website frontmatter or migrate content as a side effect of reading it.





