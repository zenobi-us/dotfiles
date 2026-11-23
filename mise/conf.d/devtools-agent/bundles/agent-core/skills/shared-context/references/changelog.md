# Shared-context changes

## Review fixes
- Keep logical source and scope names when index directories resolve through aliases. Validate new index metadata before persistence; reject unsupported source names without creating an index.

- Preserve independent explicit routes after alignment migration and create identity metadata before committing empty migrations.
- Preflight complete safe upgrades before copying records. Share validation with the guarded final writer.
- Reject duplicate YAML identities and invalid owned source/index metadata without changing source or index bytes. Keep external source contracts opaque.
- Protect canonical history targets through ancestor aliases. Share the canonical identity for upgrade locks, mutable checks, and writes.
- Declare and emit new source identities in ingest instructions. Version recovered project identities without rewriting existing records.

## Contract adoption

- Declare authoritative route, layout, source/index, project identity, machine configuration, and resolution formats in contracts.json.
- Produce shared-context-routes/v3 and shared-context-layout/v2 with schemaVersion. Keep numeric-schema historical readers without automatic read-time conversion.
- Add explicit upgrade selection and configure-route operations through shared skill-contracts. Preserve authored route comments, unknown fields, and independent inherited stores.
- Tag resolution JSON without renaming location fields. Keep tracker and workflow contracts under their existing owners.
- Keep default machine configuration read-only. Reject unknown configuration and index identifiers. Preserve source copies and authored index text; reject ambiguous managed blocks.


## Compatibility fixes

- Preserve equivalent historical project identity bytes during initialization and route migration, including `.git` origins and authored extra fields. Compare canonical remotes; reject mismatches without replacing identity metadata.
- Keep caller-facing upgrade paths stable through ancestor aliases while retaining canonical filesystem guards.
- Read retained tracker migration resolution snapshots under their historical shape. Preserve immutable plan IDs, snapshots, and event hashes; keep versioned resolutions in new plans.
