# @davidorex/pi-workflows

> Workflow orchestration extension for Pi

## Tools

### workflow

Run a named workflow with typed input. Discovers workflows from .workflows/ and ~/.pi/agent/workflows/.

*Run a multi-step workflow with typed data flow between agents*

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workflow` | string | yes | Name of the workflow to run |
| `input` | unknown | no | Input data for the workflow (validated against workflow's input schema) |
| `fresh` | string | no | Set to 'true' to start a fresh run, ignoring any incomplete prior runs |

### workflow-list

List available workflows with names, descriptions, and sources.

*List available workflows with names, descriptions, and sources*

### workflow-agents

List available agents with full specs, or inspect a single agent by name. Returns role, description, model, tools, output format/schema, prompt template paths.

*List available agents with specs, or inspect a single agent by name*

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | no | Agent name to inspect (omit to list all) |

### workflow-validate

Validate workflow specs — check agents, schemas, step references, and filters.

*Validate workflow specs — check agents, schemas, step references, filters*

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | no | Workflow name to validate (omit to validate all) |

### workflow-status

Get workflow vocabulary — step types, filters, available agents, workflows, schemas, templates.

*Get workflow vocabulary — step types, filters, available agents, workflows, schemas*

### workflow-init

Initialize .workflows/ directory for workflow run state.

*Initialize .workflows/ directory for workflow run state*

## Commands

### /workflow

List and run workflows

Subcommands: `init`, `run`, `list`, `resume`, `validate`, `status`

## Keyboard Shortcuts

- **ctrl+h** — Pause running workflow
- **ctrl+j** — Resume paused workflow

## Bundled Resources

### agents/ (21 files)

- `agents/architecture-designer.agent.yaml`
- `agents/architecture-inferrer.agent.yaml`
- `agents/audit-fixer.agent.yaml`
- `agents/code-explorer.agent.yaml`
- `agents/decomposer.agent.yaml`
- `agents/gap-identifier.agent.yaml`
- `agents/handoff-writer.agent.yaml`
- `agents/investigator.agent.yaml`
- `agents/pattern-analyzer.agent.yaml`
- `agents/phase-author.agent.yaml`
- `agents/plan-creator.agent.yaml`
- `agents/plan-decomposer.agent.yaml`
- `agents/project-definer.agent.yaml`
- `agents/project-inferrer.agent.yaml`
- `agents/quality-analyzer.agent.yaml`
- `agents/requirements-gatherer.agent.yaml`
- `agents/researcher.agent.yaml`
- `agents/spec-implementer.agent.yaml`
- `agents/structure-analyzer.agent.yaml`
- `agents/synthesizer.agent.yaml`
- `agents/verifier.agent.yaml`

### schemas/ (11 files)

- `schemas/decomposition-specs.schema.json`
- `schemas/execution-results.schema.json`
- `schemas/investigation-findings.schema.json`
- `schemas/pattern-analysis.schema.json`
- `schemas/phase.schema.json`
- `schemas/plan-breakdown.schema.json`
- `schemas/quality-analysis.schema.json`
- `schemas/research-findings.schema.json`
- `schemas/structure-analysis.schema.json`
- `schemas/synthesis.schema.json`
- `schemas/verifier-output.schema.json`

### workflows/ (14 files)

- `workflows/analyze-existing-project.workflow.yaml`
- `workflows/create-handoff.workflow.yaml`
- `workflows/create-phase.workflow.yaml`
- `workflows/do-gap.workflow.yaml`
- `workflows/fix-audit.workflow.yaml`
- `workflows/gap-to-phase.workflow.yaml`
- `workflows/init-new-project.workflow.yaml`
- `workflows/parallel-analysis.workflow.yaml`
- `workflows/parallel-explicit.workflow.yaml`
- `workflows/pausable-analysis.workflow.yaml`
- `workflows/plan-from-requirements.workflow.yaml`
- `workflows/resumable-analysis.workflow.yaml`
- `workflows/self-implement.workflow.yaml`
- `workflows/typed-analysis.workflow.yaml`

### templates/ (28 files)

- `templates/analyzers/base-analyzer.md`
- `templates/analyzers/macros.md`
- `templates/analyzers/patterns-task.md`
- `templates/analyzers/patterns.md`
- `templates/analyzers/quality-task.md`
- `templates/analyzers/quality.md`
- `templates/analyzers/structure-task.md`
- `templates/analyzers/structure.md`
- `templates/architecture-designer/task.md`
- `templates/architecture-inferrer/task.md`
- `templates/audit-fixer/task.md`
- `templates/decomposer/task.md`
- `templates/explorer/system.md`
- `templates/explorer/task.md`
- `templates/gap-identifier/task.md`
- `templates/handoff-writer/task.md`
- `templates/investigator/task.md`
- `templates/phase-author/task.md`
- `templates/plan-creator/task.md`
- `templates/plan-decomposer/task.md`
- `templates/project-definer/task.md`
- `templates/project-inferrer/task.md`
- `templates/requirements-gatherer/task.md`
- `templates/researcher/task.md`
- `templates/spec-implementer/task.md`
- `templates/synthesizer/system.md`
- `templates/synthesizer/task.md`
- `templates/verifier/task.md`

---

## How It Works

pi-workflows orchestrates multi-step agent workflows defined in YAML. Workflows are DAGs of typed steps with data flow via `${{ }}` expressions.

### Workflow Discovery

Workflows are discovered from three locations (first match wins):
1. `.workflows/*.workflow.yaml` — project-level
2. `~/.pi/agent/workflows/*.workflow.yaml` — user-level
3. Package bundled `workflows/` — built-in

### Step Types

| Type | Field | Description |
|------|-------|-------------|
| agent | `agent: name` | Dispatch an LLM subprocess via `pi --mode json` |
| command | `command: "..."` | Run a shell command, capture stdout as output |
| transform | `transform: { mapping: {...} }` | Pure data transformation via expressions, no LLM |
| gate | `gate: { check: "..." }` | Shell command exit code as pass/fail boolean |
| loop | `loop: { maxAttempts, steps }` | Repeat sub-steps until gate breaks or max reached |
| parallel | `parallel: { a: ..., b: ... }` | Run named sub-steps concurrently |
| pause | `pause: true` or `pause: "message"` | Pause execution, resumable later |
| forEach | `forEach: "${{ expr }}"` | Iterate over an array, executing the step per element |

### Expression Syntax

`${{ expression }}` resolves against scope: `input`, `steps`, `loop`, `forEach`.

Access step outputs: `${{ steps.investigate.output.findings }}`
Filters: `${{ steps.analyze.output | json }}`, `${{ items | length }}`, `${{ name | upper }}`

Available filters: length, keys, filter, json, upper, lower, trim, default, first, last, join, split, replace, includes, map, sum, min, max, sort, unique, flatten, zip, group_by, count_by, chunk, pick, omit, entries, from_entries, merge, values, not, and, or.

### Agent Resolution

Agent specs (`.agent.yaml`) are resolved from three locations (first match wins):
1. `.pi/agents/<name>.agent.yaml` — project-level
2. `~/.pi/agent/agents/<name>.agent.yaml` — user-level
3. Package bundled `agents/<name>.agent.yaml` — built-in

Agent specs define: model, thinking level, tools, system prompt (or template), task template, output format/schema.

### Execution Model

1. Steps are ordered by YAML declaration order
2. DAG planner infers parallelism from `${{ steps.X }}` references
3. Steps without explicit dependencies run after their predecessor (conservative sequential)
4. Each step's result is persisted atomically to `<runDir>/state.json`
5. TUI progress widget shows real-time step status, cost, and timing

### Checkpoint and Resume

Incomplete runs (failed or paused) are detected on next invocation. If the workflow spec hasn't changed incompatibly, execution resumes from the last completed step. Failed steps are re-executed. Use `fresh: "true"` to force a new run.

### Output Validation

Steps with `output.schema` validate the agent's JSON output against a JSON Schema file. Validation failure marks the step as failed.

### Per-Step Retry

Steps with `retry: { maxAttempts: N }` are re-executed on failure. Between retries:
- Project block files are rolled back to pre-attempt state
- Prior error messages are injected into the prompt
- Optional `steeringMessage` provides custom retry guidance

### Completion Messages

After execution, the workflow result is injected into the main LLM conversation. The `completion` field controls this: either a `template` (full `${{ }}` template) or `message` + `include` (message text plus resolved data paths).

### Artifacts

Workflows can write post-completion files via the `artifacts` field. Paths may contain `${{ }}` expressions. Artifacts targeting `.project/*.json` are validated against block schemas.

### Validation

`validateWorkflow(spec, cwd)` runs authoring-time checks without executing the workflow:

1. **Agent resolution** — all referenced agents exist in the three-tier search
2. **Schema resolution** — all output schema file paths resolve to existing files
3. **Step reference validity** — `${{ steps.X }}` expressions reference declared steps
4. **Step ordering** — referenced steps are declared before the referencing step
5. **Filter name validity** — `${{ value | filter }}` uses known filter names

Returns `{ valid: boolean, issues: ValidationIssue[] }` where each issue has severity, message, and field path. Use `/workflow validate` or `/workflow validate <name>` to run from the command line.

---

*Generated from source by `scripts/generate-skills.js` — do not edit by hand.*
