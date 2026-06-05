# Basic Memory Storage System

## Purpose

Basic Memory (BM) CLI manages project planning artifacts as BM notes. The project-planning skill MUST interact with BM only through the skill-bundle wrapper CLI.

Scope covers all planning artifacts: Project Constitution, Idea, Epic, Story, Task, Research, Decision, Learning, Retrospective.

> [!WARNING]
> All storage operations MUST go through the skill-bundle wrapper CLI.
>
> ```sh
> bun ./scripts/storage-system/basic-memory.ts
> ```
>
> Path is relative to the `project-planning` skill bundle, not the target project directory.
>
> Wrapper is responsible for selecting the correct BM project context from query path/CWD.
>
> Direct BM CLI usage and BM MCP usage are prohibited. Agent MUST use the wrapper CLI only.

## Artifact Mapping
Artifacts map to BM notes via wrapper CLI commands:
- Project Constitution
- Idea
- Epic
- Story
- Task
- Research
- Decision
- Learning
- Retrospective

Each artifact MUST be persisted as a BM note with agreed `note_type` and metadata conventions.
Wrapper MUST expose normal read/write/search/build-context operations while resolving project automatically through CLI execution.
For relevant actions, agent MAY consult these skills for note-shape concepts only; their backend instructions MUST NOT override this wrapper-CLI-only contract:
- note authoring/editing: `memory-notes`
- task workflow concepts: `memory-tasks`
- lifecycle/archive/reactivate concepts: `memory-lifecycle`
- metadata filtering/query concepts: `memory-metadata-search`
- schema validation/drift concepts: `memory-schema`
- research ingestion concepts: `memory-research`
- raw transcript/doc ingestion concepts: `memory-ingest`
- reflection concepts: `memory-reflect`
- reorganization/cleanup concepts: `memory-defrag`
- literary corpus analysis concepts: `memory-literary-analysis`

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
If wrapper is missing, non-executable, misconfigured, persistently failing, or the BM CLI is unavailable:
**FATAL** — stop immediately, emit exactly:
`FATAL: Basic Memory unavailable. exit 1. get an adult.`
Exit code MUST be `1`.

No fallback storage path is permitted.
If wrapper works but operation partially fails:
1. Re-read affected notes via wrapper,
2. Reconcile metadata/relations/status via wrapper edits,
3. Re-run validation before proceeding.

## Validation
Validation MUST be executed via wrapper CLI operations.
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
bun ./scripts/storage-system/basic-memory.ts initialise --name "Project Name"
```
(relative to the `project-planning` skill bundle, not the target project directory).
2. Seed or verify schema notes for all planning artifact entities in BM `schema/`:
   - Project Constitution, Idea, Epic, Story, Task, Decision, Research, Learning, Retrospective.
3. Prefer Picoschema-based schema notes from `references/schema/*` as source templates.
4. Run schema validation (`memory-schema`) for touched artifact types before first planning write.
5. Task status naming MUST use project planning status names defined by this project (no wrapper remap).
