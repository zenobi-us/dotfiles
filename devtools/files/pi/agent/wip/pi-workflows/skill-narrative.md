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
