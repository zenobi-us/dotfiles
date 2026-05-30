# Basic Memory Storage System

## Purpose

Basic Memory (BM) tooling (MCP or CLI) manages project planning artifacts as BM notes. It provides a unified interface for persisting, retrieving, and linking planning data within the BM ecosystem.

Scope covers all planning artifacts: Idea, Epic, Story, Task, Research, Decision, Learning, Retrospective.

> [!WARNING]
> All storage operations MUST go through our wrapper cli.
>
> ```sh
>  bun scripts/storage-system/basic-memory.ts
> ```
> 
> Wrapper is responsible for selecting the correct BM project context from query path/CWD.
> 
> Direct backend usage is prohibited. Agent MUST use wrapper, which may execute BM MCP or BM CLI under hood.

## Artifact Mapping
Artifacts map to BM notes via wrapper interface (compatible with official `basic-memory ...` subcommands, whether transport is MCP or CLI):
- Idea
- Epic
- Story
- Task
- Research
- Decision
- Learning
- Retrospective

Each artifact MUST be persisted as a BM note with agreed `note_type` and metadata conventions.
Wrapper MUST pass through normal read/write/search/build-context operations while resolving project automatically.
For relevant actions, agent SHOULD load these skills by name:
- note authoring/editing: `memory-notes`
- task workflow: `memory-tasks`
- lifecycle/archive/reactivate: `memory-lifecycle`
- metadata filtering/query: `memory-metadata-search`
- schema validation/drift: `memory-schema`
- research ingestion: `memory-research`
- raw transcript/doc ingestion: `memory-ingest`
- reflection pass: `memory-reflect`
- reorganization/cleanup: `memory-defrag`
- literary corpus analysis: `memory-literary-analysis`

## Linking Strategy
Link format is dual by location:
- Frontmatter linkage fields MUST use canonical `memory://...` URLs.
- Body text references MUST use wiki-links `[[...]]`.

Rules:
- Machine-critical relationships (parent/child/depends_on/etc.) MUST be stored in frontmatter as `memory://...`.
- Narrative/context references in prose MUST use `[[...]]`.
- If same relationship appears in both places, frontmatter `memory://` is source of truth.

## Status Sync Rules
Artifact status MUST be stored in BM frontmatter metadata (source of truth).
Status transitions MUST be persisted via wrapper-backed BM edit operations.
Lifecycle moves (active/archive/completed/etc.) MUST be done with wrapper-backed BM move/lifecycle operations.
Task progression SHOULD follow `memory-tasks`; lifecycle transitions SHOULD follow `memory-lifecycle`.

## Human Approval Gates
Human approval is mandatory at:
1. Phase planning signoff before execution,
2. Phase completion signoff before next phase,
3. Epic completion/archive signoff.

Approval evidence MUST be written into relevant BM notes and linked from summary/retrospective artifacts.

## Failure / Recovery
If wrapper is missing, non-executable, misconfigured, persistently failing, or neither BM MCP nor BM CLI backend is available:
**FATAL** — stop immediately, emit exactly:
`FATAL: Basic Memory unavailable. exit 1. get an adult.`
Exit code MUST be `1`.

No fallback storage path is permitted.
If wrapper works but operation partially fails:
1. Re-read affected notes via wrapper,
2. Reconcile metadata/relations/status via wrapper edits,
3. Re-run validation before proceeding.

## Validation
Validation MUST be executed via wrapper-backed BM operations.
Validation MUST check:
- all touched artifacts are resolvable through wrapper,
- required metadata fields are present (`id`, `status`, linkage fields),
- frontmatter linkage fields are valid `memory://...` URLs,
- required relations resolve,
- status/lifecycle consistency across touched artifacts.

For schema-governed note types, agent SHOULD run schema validation via `memory-schema`.
Pass criteria: zero blocking validation errors for all affected artifacts.

## Initialization
For Planning Workflow Phase `0. Initialization`, agent MUST perform:

1. Initialize BM project context:
```sh
./scripts/storage-system/basic-memory initialise --name "Project Name"
```
2. Seed or verify schema notes for all planning artifact entities in BM `schema/`:
   - Idea, Epic, Story, Task, Decision, Research, Learning, Retrospective.
3. Prefer Picoschema-based schema notes from `references/schema/*` as source templates.
4. Run schema validation (`memory-schema`) for touched artifact types before first planning write.
5. Task status naming MUST use project planning status names defined by this project (no wrapper remap).
