# Design source metadata

- **Reference purpose:** Use this reference to interpret and validate supported web-design source metadata.
- **Intended reader:** Skill maintainers and agents.
- **Document date:** 2026-11-27.

For authorized conversion, read [Upgrade design source metadata](source-metadata-upgrade.md).

The web-design skill owns this catalog family. `assets/sources.json` is the bundled catalog. `scripts/source-metadata.ts` owns these operations:

- **Identity detection:** Detect the exact identity.
- **Content validation:** Validate catalog content.
- **Historical reading:** Read the supported historical format.
- **Source selection:** Select a source.
- **Pure conversion:** Convert metadata without writes.

## Inventory

- **Boundary:** Source catalog
  - **Direction:** Input and current conversion output
  - **Definition and validator:** This definition. `validateCatalog` and `readCatalog`
  - **Reading and conversion:** Numeric v1 and string v2. Explicit shared upgrade only
- **Boundary:** `contracts.json`
  - **Direction:** Declaration
  - **Definition and validator:** Shared built-in `skill-contract-manifest/v1`. Shared validator
  - **Reading and conversion:** Shared manifest reader
- **Boundary:** Design Markdown
  - **Direction:** Human guidance or opaque asset bytes
  - **Definition and validator:** Not independent structured records
  - **Reading and conversion:** No injected identity or conversion
- **Boundary:** Task guidance
  - **Direction:** Human guidance
  - **Definition and validator:** Not independent structured records
  - **Reading and conversion:** No injected identity or conversion
- **Boundary:** Command-line interface (CLI) display text
  - **Direction:** Human guidance
  - **Definition and validator:** Not independent structured records
  - **Reading and conversion:** No injected identity or conversion

## Exact identities

- **Declared contract:** `design-source-metadata/v1`
  - **Wire identity:** JavaScript Object Notation (JSON) number `schemaVersion: 1`
  - **Support:** Known historical input only
- **Declared contract:** `design-source-metadata/v2`
  - **Wire identity:** String `schemaVersion: "design-source-metadata/v2"`
  - **Support:** Current input and explicit conversion output

The historical identifier names the existing numeric format. The historical wire format does not accept the string `design-source-metadata/v1`. There is no supported unversioned format. Reject these inputs:

- **Unknown numbers:** Unknown numeric identifier values.
- **Unknown strings:** Unknown string identifiers.
- **Null identifiers:** Null identifier values.
- **Malformed identifiers:** Invalid identifier syntax.
- **Duplicate keys:** Duplicate object keys.
- **Forbidden field:** Any top-level `schema` field, including mixed identities.

Rejection precedes interpretation or conversion. `identify` returns null only when the identifier is absent. `detectLegacy` returns no matches.

## Content and meaning

Both formats contain a JSON object with `capturedAt` and a nonempty ordered `sources` array. `capturedAt` is a valid Coordinated Universal Time (UTC) timestamp with milliseconds.
It uses the International Organization for Standardization (ISO) timestamp format. Each source contains:

- **Style identity:** `style` is one of these values:
  - **Report dashboard:** `report-dashboard`.
  - **Widget dashboard:** `widget-grid-dashboard`.
  - **Project information:** `project-info`.
- **Asset path:** `asset` is an installed `styles/<style>/<UPPERCASE-OR-HYPHEN-NAME>.md` path relative to the skill's `assets` directory.
- **Source provenance:** `source` is an object with these nonempty strings:
  - **Repository location:** `repository`.
  - **Repository path:** `path`.
  - **Local path:** `localPath`.
- **Asset checksum:** `sha256` contains 64 lowercase hexadecimal digits for the bundled asset bytes.

Each `(style, asset)` pair is unique. Array order is meaningful and stays unchanged. Unknown authored properties remain allowed at every object level. Preserve their bytes during conversion, including number lexemes that JSON cannot round-trip exactly.

These fields are provenance and refresh metadata only:

- **Repository location:** `source.repository`.
- **Repository path:** `source.path`.
- **Local path:** `source.localPath`.

Runtime reads always use the installed bundled copy. A caller-selected catalog changes metadata input, not the bundled asset root. Resolve that root from the owning module, independently of the current working directory. Reject asset symlinks that resolve outside that root.

`readCatalog` rejects malformed Unicode Transformation Format with 8-bit code units (UTF-8) bytes before JSON parsing.
It performs no normalization or implicit byte order mark (BOM) removal. Valid Unicode, including an intentionally encoded U+FFFD, remains supported. It validates structure and verifies every referenced asset's 256-bit Secure Hash Algorithm (SHA-256) checksum. `selectSource` selects exactly one `(style, asset)` pair. It returns these values:

- **Selected entry:** The entry for that pair.
- **Bundled path:** The path for that entry.
- **Verified text:** The verified asset text.

Equal hashes or text never merge these items:

- **Style identities:** Styles remain distinct.
- **Companion identities:** Companions remain distinct.
- **Source provenance:** Provenance remains distinct.

Integrity failures stop consumption without repair or writes.

## Commands

Resolve `WEB_DESIGN_ROOT` to the installed directory containing `SKILL.md`. All entrypoint paths below are skill-relative. Invoke absolute entrypoints from any current working directory. The mise shebang selects Bun.

```sh
"$WEB_DESIGN_ROOT/scripts/sources.ts" validate
"$WEB_DESIGN_ROOT/scripts/sources.ts" validate /absolute/historical-sources.json
"$WEB_DESIGN_ROOT/scripts/sources.ts" select project-info styles/project-info/DESIGN.md
"$WEB_DESIGN_ROOT/scripts/sources.ts" select widget-grid-dashboard styles/widget-grid-dashboard/UI-FOUNDATION.md
```

Validation prints these values:

- **Catalog identity:** The declared identity.
- **Capture time:** The recorded capture time.
- **Ordered associations:** The catalog associations in order.

Selection prints these values:

- **Source provenance:** The selected provenance.
- **Bundled path:** The verified bundled path.
- **Selected text:** The selected asset text.

These are human-facing displays, not persistent result records. Neither command writes or upgrades. For deliberate conversion, use [the declared upgrade procedure](source-metadata-upgrade.md).


## Native regression check

Run `"$WEB_DESIGN_ROOT/tests/source-metadata-smoke.ts"` from any current working directory. It exercises these boundaries with isolated fixtures:

- **Manifest resolution:** Public manifest resolution.
- **Catalog readers:** Both readers.
- **Malformed bytes:** Malformed catalog bytes at validate/select boundaries.
- **Valid Unicode:** Valid Unicode provenance.
- **Source selection:** Style/provenance selection.
- **Single conversion:** Shared single conversion.
- **Bulk conversion:** Shared bulk conversion.
- **Rejected conversions:** Byte-preserving refusals.
- **Checksum failure:** Checksum failure.

It removes only its temporary directory. It needs the adjacent installed skill-contracts owner and the mise/Bun runtime. It does not use `bun test` or change dependencies.

