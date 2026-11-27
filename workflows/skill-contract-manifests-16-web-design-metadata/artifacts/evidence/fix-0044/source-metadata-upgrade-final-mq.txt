# Upgrade design source metadata

- **Procedure purpose:** Use this procedure to convert supported web-design source metadata with separate user authority.
- **Intended reader:** Skill maintainers and operators.
- **Document date:** 2026-11-27.

For format definitions and read-only validation, read [Design source metadata](source-metadata.md).

The only declared edge is `design-source-metadata/v1` to `design-source-metadata/v2`, with procedure `file:references/source-metadata-upgrade.md` and trusted adapter `file:scripts/source-metadata.ts`.

The adapter validates the explicit numeric source. It replaces only the top-level numeric identity token with the current string identity. All other Unicode Transformation Format with 8-bit code units (UTF-8) bytes remain unchanged. This wire cutover preserves these items:

- **Source locations:** Every source location.
- **Asset associations:** Every association.
- **Capture time:** The recorded capture time.
- **Asset checksums:** Every checksum.
- **Array order:** Every array position.
- **Authored properties:** Every unknown property.
- **Bundled assets:** Every bundled asset.

The conversion never performs these actions:

- **Source refresh:** It never refreshes sources.
- **Provenance replacement:** It never computes replacement provenance.
- **Time replacement:** It never restamps time.
- **Asset writes:** It never writes assets.

The shared operation performs these steps:

1. **Resolve declarations:** Resolve the declared contracts and procedure.
2. **Validate content:** Validate source and destination.
3. **Compare bytes:** Compare the complete identity-normalized authored bytes.
4. **Acquire locks:** Acquire the required locks.
5. **Persist result:** Persist the validated result.

Owner hooks are pure. Content with `immutable: true` requires read-only historical access. Paths inside these directories also require read-only historical access:

- **Event records:** `events`.
- **Receipt records:** `receipts`.
- **Historical snapshots:** `snapshots`.
- **Historical artifacts:** `artifacts`.

These refusals preserve source bytes:

- **Unsupported operations:** Operations the owner does not support.
- **Unknown identities:** Identities the owner does not recognize.
- **Invalid content:** Content that fails validation.
- **Unsupported paths:** Paths the owner does not permit.

Resolve `SKILL_CONTRACTS_ROOT` and `WEB_DESIGN_ROOT` to their installed skill directories. Invoke absolute entrypoints from any current working directory. Artifact and selection-list paths below are explicit absolute paths. Conversion requires separate user authority. Reading and installation never run it.

```sh
"$SKILL_CONTRACTS_ROOT/scripts/router.ts" safe-upgrade --skill "$WEB_DESIGN_ROOT" --owner file:scripts/source-metadata.ts --artifact /absolute/sources.json --operation upgrade
"$SKILL_CONTRACTS_ROOT/scripts/router.ts" bulk-upgrade --skill "$WEB_DESIGN_ROOT" --owner file:scripts/source-metadata.ts --artifacts /absolute/selected-catalogs.json
"$WEB_DESIGN_ROOT/scripts/sources.ts" validate /absolute/sources.json
```

The bulk selection is a JavaScript Object Notation (JSON) array of distinct paths. Each item commits independently. Report failed and partial outcomes honestly.

Current valid input is a byte-preserving no-op. Conversion validates metadata. Actual consumption separately verifies bundled integrity. A checksum failure never authorizes catalog or asset repair.

