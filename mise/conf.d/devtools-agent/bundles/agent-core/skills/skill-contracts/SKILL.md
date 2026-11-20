---
name: skill-contracts
description: Validates contracts.json, resolves authoritative definitions, and runs declared safe or bulk upgrades with owning content validators. Use before interpreting manifests, resolving historical definitions, or converting persistent artifacts.
---
# Skill contracts

Use one shared manifest validator. Domain owners retain content validation and conversion.

## Read-only operations

Resolve this installed skill directory as SKILL_CONTRACTS_ROOT. Invoke its absolute entrypoint from any caller directory. The mise shebang selects Bun and installs dependencies when needed.

Read [the manifest specification](references/manifest.md) before authoring declarations.

```sh
"$SKILL_CONTRACTS_ROOT/scripts/router.ts" validate --skill /absolute/installed/owner-skill
"$SKILL_CONTRACTS_ROOT/scripts/router.ts" resolve --skill /absolute/installed/owner-skill --contract example-record/v1
```

Both commands validate and resolve all declarations. Success prints JSON. Failure returns nonzero without partial data. Neither command executes owner code or changes artifact bytes. Historical resolution uses a temporary bare repository and removes it after reading.

Code callers import loadContracts or resolveContract from scripts/contracts.ts. loadContracts returns manifest, definitions, and procedures. resolveContract returns reference, path, and content. Git paths identify pinned objects, not checkout files.

## Safe and bulk upgrades

Before an otherwise authorized mutation or an explicit bulk conversion, read [the upgrade procedure](references/upgrades.md). Supply a trusted installed owner adapter. The shared operation validates declarations, follows exactly one declared operation-appropriate path, compares preserved content, and commits only validated bytes. The owner interprets domain content and performs the requested mutation.

Code callers import safeUpgrade or bulkUpgrade from scripts/upgrades.ts. These operations do not grant mutation authority. Installation, read-only commands, and unrelated updates never call them.

## Boundaries

- Treat produces and accepts independently. Definition discovery proves neither input support nor output production.
- Resolve file: definitions from the installed owner skill, never the caller directory.
- Recognize skill-contract-manifest/v1 through the built-in schema; do not redefine it.
- Stop when a definition or procedure cannot resolve. Git references require a full commit pin and sourceRepository. Never substitute revisions.
- Preserve immutable records. Use historical readers instead of converting receipt or event chains.
- Reject unknown explicit identifiers without legacy detection. Unversioned input requires exactly one explicit detector match.

## Verification

Run validate and resolve against examples/local and examples/empty. Exercise safe-upgrade and bulk-upgrade against examples/upgrades using temporary artifacts. Run scripts/contracts.test.ts and scripts/upgrades.test.ts with mise exec -- bun test. Check persisted content, rejection byte equality, and partial bulk outcomes, not labels alone.
