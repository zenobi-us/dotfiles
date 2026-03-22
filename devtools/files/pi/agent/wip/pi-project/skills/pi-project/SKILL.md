# @davidorex/pi-project

> Schema-driven project state management for Pi

## Tools

### append-block-item

Append an item to an array in a project block file. Schema validation is automatic.

*Append items to project blocks (gaps, decisions, or any user-defined block)*

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `block` | string | yes | Block name (e.g., 'gaps', 'decisions') |
| `arrayKey` | string | yes | Array key in the block (e.g., 'gaps', 'decisions') |
| `item` | unknown | yes | Item object to append — must conform to block schema |

### update-block-item

Update fields on an item in a project block array. Finds by predicate field match.

*Update items in project blocks — change status, add details, mark resolved*

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `block` | string | yes | Block name (e.g., 'gaps', 'decisions') |
| `arrayKey` | string | yes | Array key in the block |
| `match` | object | yes | Fields to match (e.g., { id: 'gap-123' }) |
| `updates` | object | yes | Fields to update (e.g., { status: 'resolved' }) |

### read-block

Read a project block file as structured JSON.

*Read a project block as structured JSON*

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `block` | string | yes | Block name (e.g., 'gaps', 'tasks', 'requirements') |

### write-block

Write or replace an entire project block with schema validation.

*Write or replace a project block with schema validation*

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `block` | string | yes | Block name (e.g., 'project', 'architecture') |
| `data` | unknown | yes | Complete block data — must conform to block schema |

### project-status

Get derived project state — source metrics, block summaries, planning lifecycle status.

*Get project state — source metrics, block summaries, planning lifecycle status*

### project-validate

Validate cross-block referential integrity — check that IDs referenced across blocks exist.

*Validate cross-block referential integrity*

### project-init

Initialize .project/ directory with default schemas and empty block files.

*Initialize .project/ directory with default schemas and blocks*

## Commands

### /project

Project state management

Subcommands: `init`, `status`, `add-work`, `validate`

## Events

- `session_start`

## Bundled Resources

### defaults/ (22 files)

- `defaults/blocks/conformance-reference.json`
- `defaults/blocks/decisions.json`
- `defaults/blocks/domain.json`
- `defaults/blocks/gaps.json`
- `defaults/blocks/project.json`
- `defaults/blocks/rationale.json`
- `defaults/blocks/requirements.json`
- `defaults/blocks/tasks.json`
- `defaults/blocks/verification.json`
- `defaults/schemas/architecture.schema.json`
- `defaults/schemas/audit.schema.json`
- `defaults/schemas/conformance-reference.schema.json`
- `defaults/schemas/decisions.schema.json`
- `defaults/schemas/domain.schema.json`
- `defaults/schemas/gaps.schema.json`
- `defaults/schemas/handoff.schema.json`
- `defaults/schemas/phase.schema.json`
- `defaults/schemas/project.schema.json`
- `defaults/schemas/rationale.schema.json`
- `defaults/schemas/requirements.schema.json`
- `defaults/schemas/tasks.schema.json`
- `defaults/schemas/verification.schema.json`

## Planning Vocabulary

### Block Types

| Block | Title | Array Key | Item Fields |
|-------|-------|-----------|-------------|
| `architecture` | Architecture | `modules` | name, file, responsibility, dependencies? (array), lines? (integer) |
| `audit` | audit | `checks` | id, description, status (string (pass|fail|warn|skip)), category?, details? |
| `conformance-reference` | conformance-reference | `principles` | id, name, description?, rules (array) |
| `decisions` | Decisions | `decisions` | id, decision, rationale, phase? (string|integer), status (string (decided|tentative|revisit|superseded)), context? |
| `domain` | Domain Knowledge | `entries` | id, title, content, category (string (research|reference|domain-rule|prior-art|constraint)), source?, confidence? (string (high|medium|low)), related_requirements? (array), tags? (array) |
| `gaps` | Gaps | `gaps` | id, description, status (string (open|resolved|deferred)), category (string (missing|incomplete|defect|improvement|technical-debt|question)), priority (string (low|medium|high|critical)), phase? (string|integer), resolved_by?, source? (string (human|agent|monitor|workflow)), details? |
| `handoff` | Handoff | `current_tasks` |  |
| `phase` | Phase | `success_criteria` | criterion, verify_method (string (command|inspect|test)) |
| `project` | Project Identity | `target_users` |  |
| `rationale` | Design Rationale | `rationales` | id, title, narrative, related_decisions? (array), phase? (string|integer), context? |
| `requirements` | Requirements | `requirements` | id, description, type (string (functional|non-functional|constraint|integration)), status (string (proposed|accepted|deferred|implemented|verified)), priority (string (must|should|could|wont)), acceptance_criteria? (array), source? (string (human|agent|analysis)), traces_to? (array), depends_on? (array) |
| `tasks` | Tasks | `tasks` | id, description, status (string (planned|in-progress|completed|blocked|cancelled)), phase? (string|integer), files? (array), acceptance_criteria? (array), depends_on? (array), assigned_agent?, verification?, notes? |
| `verification` | Verification | `verifications` | id, target, target_type (string (task|phase|requirement)), status (string (passed|failed|partial|skipped)), method (string (command|inspect|test)), evidence?, timestamp?, criteria_results? (array) |

### Status Enums

| Block | Field | Values |
|-------|-------|--------|
| `audit` | `status` | pass, fail, warn, skip |
| `audit` | `severity` | error, warning, info |
| `decisions` | `status` | decided, tentative, revisit, superseded |
| `domain` | `category` | research, reference, domain-rule, prior-art, constraint |
| `domain` | `confidence` | high, medium, low |
| `gaps` | `status` | open, resolved, deferred |
| `gaps` | `category` | missing, incomplete, defect, improvement, technical-debt, question |
| `gaps` | `priority` | low, medium, high, critical |
| `gaps` | `source` | human, agent, monitor, workflow |
| `phase` | `status` | planned, in-progress, completed |
| `phase` | `verify_method` | command, inspect, test |
| `phase` | `status` | planned, in-progress, completed |
| `project` | `status` | inception, planning, development, maintenance, complete |
| `requirements` | `type` | functional, non-functional, constraint, integration |
| `requirements` | `status` | proposed, accepted, deferred, implemented, verified |
| `requirements` | `priority` | must, should, could, wont |
| `requirements` | `source` | human, agent, analysis |
| `tasks` | `status` | planned, in-progress, completed, blocked, cancelled |
| `verification` | `target_type` | task, phase, requirement |
| `verification` | `status` | passed, failed, partial, skipped |
| `verification` | `method` | command, inspect, test |

---

## How It Works

pi-project manages structured project state in `.project/` — a directory of JSON block files validated against schemas.

### Block Files

Blocks are JSON files in `.project/` (e.g., `gaps.json`, `decisions.json`). Each block has a corresponding schema in `.project/schemas/`. When you write to a block via the tools, the data is validated against its schema before persisting. Writes are atomic (tmp file + rename).

### Schema Validation

Every block write validates against `.project/schemas/<blockname>.schema.json`. If the schema file doesn't exist, writes proceed without validation. Validation errors include the specific JSON Schema violations.

### /project init

Scaffolds the `.project/` directory with default schemas and empty block files from the package's `defaults/` directory. Idempotent — skips files that already exist.

### /project status

Derives project state dynamically from the filesystem:
- Source file count and line count (`.ts` files excluding tests)
- Test count and test file count
- Schema count, block count, phase count
- Block summaries with array item counts and status distributions
- Requirements summary (total, by status, by priority) — from requirements.json
- Tasks summary (total, by status) — from tasks.json
- Domain entry count — from domain.json
- Verification summary (total, passed, failed) — from verification.json
- Handoff presence — whether handoff.json exists
- Recent git commits
- Current phase detection

### /project add-work

Discovers appendable blocks (blocks with array schemas), reads their schemas, and sends a structured instruction to the LLM to extract items from the conversation into the typed blocks. This is a follow-up message that triggers the LLM to use the `append-block-item` tool.

### Duplicate Detection

`append-block-item` checks for duplicate items by `id` field before appending. If an item with the same `id` already exists in the target array, it returns a message instead of appending.

### /project validate

Checks cross-block referential integrity:
- task.phase references a valid phase
- task.depends_on references valid task IDs
- decision.phase references a valid phase
- gap.resolved_by references a valid ID
- requirement.traces_to references valid phase/task IDs
- requirement.depends_on references valid requirement IDs
- verification.target references a valid target ID
- rationale.related_decisions references valid decision IDs

Returns errors (broken dependency references) and warnings (unresolved cross-references).

### Planning Lifecycle Blocks

The default schemas support a full planning lifecycle:
- **project.json** — identity, vision, goals, constraints, scope, status
- **domain.json** — research findings, reference material, domain rules
- **requirements.json** — functional/non-functional requirements with MoSCoW priority and lifecycle states
- **architecture.json** — modules, patterns, boundaries
- **phases/** — ordered delivery units with goals, success criteria, inputs/outputs
- **tasks.json** — standalone task registry with status lifecycle and phase linkage
- **decisions.json** — choices with rationale and phase association
- **gaps.json** — open items with priority, category, and resolution tracking
- **rationale.json** — design rationale with decision cross-references
- **handoff.json** — session context snapshot (created on-demand, not by /project init)
- **verification.json** — completion evidence per task/phase/requirement
- **conformance-reference.json** — executable code conventions with principles, rules, check methods (grep/command/ast/inspect), and check patterns. Ships empty, populated per-project by agents or users.
- **audit** (schema only, no default block) — structured audit results produced by running conformance checks. Findings with locations, severity, fix suggestions, and verify methods.

All schemas are user-customizable. Edit `.project/schemas/*.schema.json` to add fields, change enums, or restructure blocks without modifying code.

### Update Check

On `session_start`, checks npm registry for newer versions of `@davidorex/pi-project-workflows` and notifies via UI if an update is available. Non-blocking — failures are silently ignored.

---

*Generated from source by `scripts/generate-skills.js` — do not edit by hand.*
