# pi-project

Schema-driven project state management for [Pi](https://github.com/badlogic/pi-mono).

Schemas are the design language. You define what your project tracks by writing JSON Schemas, and the entire system — tools, validation, derived state, workflow integration — adapts automatically. Drop a new `.schema.json` file into `.project/schemas/` and it instantly becomes an addressable block type with write-time validation, discovery, and generic CRUD tooling. No code changes.

## Install

```bash
pi install npm:@davidorex/pi-project
```

## Getting Started

```
/project init
```

Creates `.project/` with 13 default schemas and 4 starter blocks (gaps, decisions, rationale, project). Idempotent — safe to run again.

## How It Works

Project data lives in `.project/` as typed JSON block files. Each block has a corresponding JSON Schema that defines its shape. All writes — whether from tools, workflows, or agents — are validated against the schema before data hits disk. Invalid data is never persisted.

```
.project/
  schemas/          — JSON Schema files define block types
    gaps.schema.json
    decisions.schema.json
    features.schema.json     ← user-defined, works immediately
  phases/           — phase specification files
  gaps.json         — block data, validated against gaps.schema.json
  decisions.json    — block data, validated against decisions.schema.json
```

The schema is the contract. When pi-workflows agents produce output that writes to project blocks, the schema enforces the shape. When `/project add-work` extracts items from conversation, the schema constrains what gets written. When `projectState()` derives block summaries, it reads the typed data the schemas guarantee.

**Tools registered:**
- `append-block-item` — append an item to any block array (schema validation automatic)
- `update-block-item` — update fields on a block item by predicate match

**Commands registered:**
- `/project init` — scaffold `.project/` with default schemas and empty blocks
- `/project status` — derived project state (source metrics, test counts, block summaries, git state)
- `/project add-work` — extract structured items from conversation into typed blocks

## Source Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Extension entry point — tool and command registration |
| `src/block-api.ts` | Block CRUD: `readBlock`, `writeBlock`, `appendToBlock`, `updateItemInBlock` |
| `src/schema-validator.ts` | AJV wrapper: `validate`, `validateFromFile`, `ValidationError` |
| `src/block-validation.ts` | Post-step validation: `snapshotBlockFiles`, `validateChangedBlocks`, `rollbackBlockFiles` |
| `src/project-sdk.ts` | Derived state: `projectState`, `availableBlocks`, `availableSchemas`, `findAppendableBlocks` |
| `src/project-dir.ts` | Constants: `PROJECT_DIR` (`.project`), `SCHEMAS_DIR` (`schemas`) |
| `src/update-check.ts` | Checks for updates to `@davidorex/pi-project-workflows` on session start |

## API

### Block I/O (`src/block-api.ts`)

```typescript
readBlock(cwd: string, blockName: string): unknown
writeBlock(cwd: string, blockName: string, data: unknown): void
appendToBlock(cwd: string, blockName: string, arrayKey: string, item: unknown): void
updateItemInBlock(cwd: string, blockName: string, arrayKey: string, predicate: (item) => boolean, updates: Record<string, unknown>): void
```

All writes are atomic (tmp file + rename). If a schema exists for the block, validation runs before the write — invalid data is never persisted.

### Schema Validation (`src/schema-validator.ts`)

```typescript
validate(schema: Record<string, unknown>, data: unknown, label: string): unknown
validateFromFile(schemaPath: string, data: unknown, label: string): unknown
```

Throws `ValidationError` with structured AJV error details on failure.

### Derived State (`src/project-sdk.ts`)

```typescript
projectState(cwd: string): ProjectState
availableBlocks(cwd: string): BlockInfo[]
availableSchemas(cwd: string): string[]
findAppendableBlocks(cwd: string): Array<{ block, arrayKey, schemaPath }>
```

`projectState()` computes everything fresh on each call — no cache, no stale data. Returns: `testCount`, `sourceFiles`, `sourceLines`, `lastCommit`, `recentCommits`, `blockSummaries` (with per-array item counts and status distribution), `phases`, `blocks`, `schemas`.

### Block Validation (`src/block-validation.ts`)

Used by workflow executors for post-step integrity checks:

```typescript
snapshotBlockFiles(cwd: string): BlockSnapshot   // Map<string, BlockFileSnapshot>
validateChangedBlocks(cwd: string, snapshot: BlockSnapshot): void
rollbackBlockFiles(cwd: string, snapshot: BlockSnapshot): string[]
```

## For LLMs

When working with this extension:

- **Read `src/project-sdk.ts`** to understand what project state is available and how it's computed
- **Read `src/block-api.ts`** to understand the CRUD operations and validation behavior
- **Read `src/index.ts`** to see tool parameter schemas and command handler logic
- Use the `append-block-item` tool to add items — it handles schema validation, duplicate checking, and atomic writes
- Use the `update-block-item` tool with a `match` predicate (e.g., `{ id: "gap-123" }`) and `updates` object
- Block schemas define the contract — consult `.project/schemas/*.schema.json` to understand what fields are required
- `projectState(cwd)` is the single source of truth for project metrics — prefer it over manual filesystem inspection

## Tests

```bash
npm test
```

Runs `tsx --test src/*.test.ts`. Test files: `block-api.test.ts`, `block-tools.test.ts`, `schema-validator.test.ts`, `project-sdk.test.ts`.

## Development

Part of the [`pi-project-workflows`](../../README.md) monorepo. All three packages (pi-project, pi-workflows, pi-behavior-monitors) are versioned in lockstep at 0.2.0.

`npm run build` compiles TypeScript to `dist/` via `tsc`. The package ships `dist/`, not `src/` — the `pi.extensions` entry point is `./dist/index.js`.
