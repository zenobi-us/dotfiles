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
> 
> For anything other than initialization, use the basic-memory skills to guide parameters and wrapper CLI usage.


## Artifact Mapping

Each artifact MUST be persisted as a BM note with agreed `note_type` and metadata conventions.
Planning artifact filenames MUST follow [Filename Conventions](../filename-conventions.md). Basic Memory title/permalink generation does not override project-planning filename requirements.
The wrapper MUST reject `tool write-note --folder planning` when `--title` does not already match filename conventions. Prefer wrapper planning helpers, for example:

```sh
bun ./scripts/storage-system/basic-memory.ts planning write-decision \
  --id b17c0de5 \
  --title "Built-in provider conventions" \
  --content "Decision body" \
  --project Boxfiles
```

The helper derives the BM note title `decision-b17c0de5-builtin-provider-conventions` so BM creates a compliant filename/permalink.

```yaml
---
note_type: research
---
```

## Tags

BM note tags MUST be written as a YAML list of strings in frontmatter, not as a single comma-separated string.

Correct:
```yaml
tags:
  - project-planning
  - research
```

Incorrect:
```yaml
tags: "project-planning, research"
```

Agents MUST preserve this list form when creating or editing planning artifact notes.


## Linking Strategy
Link format is dual by location:
- Frontmatter linkage fields MUST use canonical `memory://...` URLs.
- Body text references MUST use wiki-links `[[...]]`.

Rules:
- Machine-critical relationships (parent/child/depends_on/etc.) MUST be stored in frontmatter as `memory://...`.
- Narrative/context references in prose MUST use `[[...]]`.
- If same relationship appears in both places, frontmatter `memory://` is source of truth.
- Wrapper CLI examples SHOULD identify notes by title (for example, `"Example Task"`) or canonical non-directory slug. Examples MUST NOT prefix identifiers with artifact-type directory segments.

## Status Sync Rules

Status flow is backend-independent. Before changing any artifact status, agent MUST read [Status Flow](../status-flow.md) and verify the requested transition is legal for that artifact type.

Artifact status MUST be stored in BM frontmatter metadata and treated as the source of truth. Body observations such as `- [status] ...` MAY mirror frontmatter for search/schema usefulness, but MUST NOT override frontmatter.

All status reads, edits, searches, and validations MUST use the skill-bundle wrapper CLI from the `project-planning` skill bundle directory:

```sh
cd /path/to/project-planning
bun ./scripts/storage-system/basic-memory.ts tool read-note "Example Task" --include-frontmatter
```

Search current work by artifact type and status:

```sh
cd /path/to/project-planning
bun ./scripts/storage-system/basic-memory.ts tool search-notes --type task --status todo
bun ./scripts/storage-system/basic-memory.ts tool search-notes --type story --status in-progress
```

Change status by editing frontmatter with an exact replacement count. Example: Task `todo -> in-progress`:

```sh
cd /path/to/project-planning
bun ./scripts/storage-system/basic-memory.ts tool edit-note "Example Task" \
  --operation find_replace \
  --find-text "status: todo" \
  --content "status: in-progress" \
  --expected-replacements 1
```

If the note body mirrors status observations, update the mirror in the same wrapper-only manner:

```sh
cd /path/to/project-planning
bun ./scripts/storage-system/basic-memory.ts tool edit-note "Example Task" \
  --operation find_replace \
  --find-text "- [status] todo" \
  --content "- [status] in-progress" \
  --expected-replacements 1
```

Complete terminal task status by setting status and completion metadata through wrapper-backed edits:

```sh
cd /path/to/project-planning
bun ./scripts/storage-system/basic-memory.ts tool edit-note "Example Task" \
  --operation find_replace \
  --find-text "status: in-review" \
  --content "status: completed" \
  --expected-replacements 1

bun ./scripts/storage-system/basic-memory.ts tool edit-note "Example Task" \
  --operation find_replace \
  --find-text "completed: null" \
  --content "completed: 2026-06-07" \
  --expected-replacements 1
```

Validate after every status change:

```sh
cd /path/to/project-planning
bun ./scripts/storage-system/basic-memory.ts tool read-note "Example Task" --include-frontmatter
bun ./scripts/storage-system/basic-memory.ts tool search-notes --type task --status completed
bun ./scripts/storage-system/basic-memory.ts status
```

If a BM schema note exists for the artifact type, also validate it:

```sh
cd /path/to/project-planning
bun ./scripts/storage-system/basic-memory.ts tool schema-validate task
```

Lifecycle moves (active/archive/completed folder moves) MUST be performed only when the wrapper and installed BM CLI expose a wrapper-backed lifecycle/move command. If no such command exists, agent MUST NOT move BM note files directly; update metadata via wrapper, validate, then escalate to Q for lifecycle-folder reconciliation.

Task progression SHOULD follow `memory-tasks`; lifecycle transitions SHOULD follow `memory-lifecycle` only where their examples map to available wrapper CLI commands.

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
bun ./scripts/storage-system/basic-memory.ts initialise --name "Project Name" --cwd "/path/to/target/project"
```
(relative to the `project-planning` skill bundle, not the target project directory).

Wrapper forwarding rules:
- `project *` commands MUST NOT receive injected `--project`; BM project-management commands operate on project records, not inside a project context.
- `doctor` MUST NOT receive injected `--project`; BM does not support that option there.
- `status`, `reindex`, `tool *`, and `schema *` SHOULD receive wrapper-resolved `--project` when the caller did not provide one.
- `--local` MAY be injected only for BM commands that support local routing.
2. Seed or verify schema notes for all planning artifact entities in BM `schema/`:
   - Project Constitution, Idea, Epic, Story, Task, Decision, Research, Learning, Retrospective.
3. Prefer Picoschema-based schema notes from `references/schema/*` as source templates.
4. Run schema validation (`memory-schema`) for touched artifact types before first planning write.
5. Task status naming MUST use project planning status names defined by this project (no wrapper remap).
