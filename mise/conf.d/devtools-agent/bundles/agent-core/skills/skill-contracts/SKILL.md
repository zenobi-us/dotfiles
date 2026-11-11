---
name: skill-contracts
description: Validates contracts.json and resolves local authoritative definitions for installed skills. Use before interpreting manifest declarations or locating a supported contract definition.
---
# Skill contracts

Use one shared manifest validator. Domain owners retain artifact content validators.

## Operations

Resolve this installed skill directory as SKILL_CONTRACTS_ROOT. Scripts are relative to that directory, not the caller repository. Invoke the absolute entrypoint from any caller working directory. Its mise shebang selects Bun and installs dependencies when needed.

Read [the manifest specification](references/manifest.md) before authoring declarations.

```sh
"$SKILL_CONTRACTS_ROOT/scripts/router.ts" validate --skill /absolute/installed/owner-skill
"$SKILL_CONTRACTS_ROOT/scripts/router.ts" resolve --skill /absolute/installed/owner-skill --contract example-record/v1
```

Both commands read contracts.json and validate all declarations before returning data. They print JSON on success. Failure prints an error to stderr, returns nonzero, and produces no partial result. Neither command writes files or executes upgrade procedures.

Code callers import loadContracts or resolveContract from scripts/contracts.ts by its installed absolute path. loadContracts returns manifest, definitions, and procedures. resolveContract returns reference, absolute path, and content.

## Boundaries

- Treat produces and accepts independently. Definition discovery alone proves neither input support nor output production.
- Resolve file: references from the supplied installed owner-skill directory, never the caller directory.
- Recognise skill-contract-manifest/v1 through the built-in shared schema. Do not declare a competing definition.
- Stop if any definition or procedure cannot resolve. Local operations reject non-file references, including git:. They do not fetch historical objects or substitute revisions.
- Keep artifact validation and conversion with the contract owner. These operations do not validate domain content, execute upgrades, or rewrite historical records.

## Verification

Run the public commands against [the valid example](examples/local/contracts.json) and [the empty example](examples/empty/contracts.json). Run scripts/contracts.test.ts with mise exec -- bun test to check malformed declarations, unresolved references, and an unrelated caller directory.

The operation is ready for interpretation only after the command succeeds and the owning content validator accepts the artifact.

