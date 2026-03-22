# pi-workflows

Schema-driven workflow orchestration for [Pi](https://github.com/badlogic/pi-mono).

Data flows through workflows as typed JSON, not strings. Each agent step declares an `output.schema` — the agent's output is validated against a JSON Schema before it's accepted into the pipeline. The expression engine passes typed fields between steps (`${{ steps.investigate.output.findings }}`), not raw text. Templates compose typed data into agent prompts, so agents receive structured context. The entire pipeline is schema-governed: **schema defines shape → agent produces to shape → validator enforces shape → next step consumes typed fields.**

The schemas in `schemas/` (investigation-findings, decomposition-specs, execution-results, etc.) are the typed contracts between workflow steps. They're not metadata — they're the enforcement boundary.

## Install

```bash
pi install npm:@davidorex/pi-project    # peer dependency
pi install npm:@davidorex/pi-workflows
```

Or install both at once: `pi install npm:@davidorex/pi-project-workflows`

## Getting Started

```
/workflow init
```

Creates `.workflows/` for run state. Workflow YAML specs are discovered automatically from the package's bundled workflows — no setup needed to start running them.

## What It Does

pi-workflows replaces ad-hoc agent chaining with composable, typed workflow orchestration. Workflows are YAML specs. Steps run as subprocesses (`pi --mode json`) with their own context windows. The main conversation is the control plane; workflows are subordinate.

Workflows consume project blocks as typed input via `readBlock()` — structured data, not raw files. When workflow agents write back to project blocks, pi-project's schema validation enforces the shape at write time. The two extensions form a typed loop: project state → workflow input → agent output → validated project state.

**Tool registered:**
- `workflow` — run a named workflow with typed input

**Commands registered:**
- `/workflow init` — scaffold `.workflows/` directory for run state
- `/workflow list` — discover and select a workflow to run
- `/workflow run <name> [--input '<json>']` — execute a workflow
- `/workflow resume <name>` — resume an incomplete run from checkpoint
- `/workflow validate [name]` — validate workflow specs (agents, schemas, step references, filters)

**Keybindings:**
- `Ctrl+H` — pause running workflow after current step
- `Ctrl+J` — resume a paused/incomplete workflow

## Workflow Spec Format

Workflows are `.workflow.yaml` files discovered from `.workflows/` (project), `~/.pi/agent/workflows/` (user), or the package's `workflows/` directory (builtin).

```yaml
name: my-workflow
description: What this workflow does
input:
  type: object
  properties:
    target: { type: string, description: "What to analyze" }
  required: [target]

steps:
  investigate:
    agent: investigator
    input: |
      Investigate: ${{ input.target }}
    output:
      schema: investigation-findings

  synthesize:
    agent: synthesizer
    input: |
      Findings: ${{ steps.investigate.output | json }}

completion:
  message: |
    Analysis complete. Key findings: ${{ steps.synthesize.output.summary }}
```

### Step Types

| Type | Purpose |
|------|---------|
| `agent` | Dispatch to a Pi agent subprocess |
| `command` | Run a shell command |
| `transform` | Map/reshape data between steps |
| `gate` | Conditional branching (`check` expression) |
| `parallel` | Run nested steps concurrently |
| `foreach` | Iterate over an array |
| `loop` | Repeat steps with a condition |
| `pause` | Halt execution for human review |

### Expressions

`${{ }}` expressions access step outputs, inputs, and apply filters:

```yaml
${{ input.target }}                    # workflow input
${{ steps.investigate.output }}        # step output
${{ steps.investigate.output | json }} # pipe through filter
${{ steps.gather.output | length }}    # array length
```

Available filters: `length`, `keys`, `filter`, `json`, `upper`, `lower`, `trim`, `default`, `first`, `last`, `join`, `split`, `replace`, `includes`, `map`, `sum`, `min`, `max`, `sort`, `unique`, `flatten`, `zip`, `group_by`, `count_by`, `chunk`, `pick`, `omit`, `entries`, `from_entries`, `merge`, `values`, `not`, `and`, `or`.

## Source Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Extension entry point — tool, command, keybinding registration |
| `src/workflow-executor.ts` | Main orchestration loop |
| `src/workflow-spec.ts` | YAML parsing, `STEP_TYPES` registry |
| `src/workflow-sdk.ts` | SDK: vocabulary, discovery, introspection |
| `src/workflow-discovery.ts` | Three-tier workflow discovery (project > user > builtin) |
| `src/expression.ts` | `${{ }}` evaluator, `FILTER_NAMES` registry |
| `src/template.ts` | Nunjucks template environment |
| `src/dispatch.ts` | Agent subprocess spawn (`pi --mode json`) |
| `src/dag.ts` | Dependency graph, execution plan from `${{ steps.X }}` refs |
| `src/agent-spec.ts` | `.agent.yaml` parser |
| `src/state.ts` | Atomic run state persistence |
| `src/checkpoint.ts` | Checkpoint detection, resume validation |
| `src/output.ts` | Step output persistence |
| `src/completion.ts` | Post-workflow message resolution |
| `src/tui.ts` | Terminal progress widget |
| `src/types.ts` | Shared type definitions |
| `src/format.ts` | Output formatting utilities |
| `src/step-shared.ts` | Shared step execution utilities |
| `src/workflows-dir.ts` | `WORKFLOWS_DIR` constant (`.workflows`) |
| `src/step-*.ts` | Step type executors (one per type) |

## Bundled Resources

| Directory | Contents |
|-----------|----------|
| `agents/` | 13 agent specs (`.agent.yaml`): investigator, decomposer, verifier, synthesizer, etc. |
| `schemas/` | 11 output schemas (`.schema.json`): investigation-findings, execution-results, etc. |
| `workflows/` | 10 workflow specs (`.workflow.yaml`): do-gap, create-phase, parallel-analysis, etc. |
| `templates/` | Nunjucks prompt templates organized by agent role |

## SDK (`src/workflow-sdk.ts`)

Single queryable surface for the extension's capabilities:

```typescript
// Vocabulary (derived from code registries)
stepTypes(): StepTypeDescriptor[]
filterNames(): string[]
expressionRoots(): readonly string[]

// Discovery (derived from filesystem, three-tier search)
availableAgents(cwd): AgentSpec[]
availableWorkflows(cwd): WorkflowSpec[]
availableTemplates(cwd): string[]
availableSchemas(cwd): string[]

// Introspection (derived from parsed spec)
extractExpressions(spec): ExpressionRef[]
declaredSteps(spec): string[]
declaredAgentRefs(spec): string[]
declaredSchemaRefs(spec): string[]
```

## Architecture

- Each workflow step runs as a subprocess (`pi --mode json`) with its own context window
- DAG planner infers parallelism from `${{ steps.X }}` references — no manual dependency declaration
- Agent specs are `.agent.yaml` only. Compiled to prompts via Nunjucks at dispatch time.
- State persisted atomically after each step (tmp + rename). State write failure is fatal.
- Three-tier resource search: project (`.workflows/`, `.pi/agents/`, `.pi/templates/`) > user `~/.pi/agent/` > package builtin
- `completion` field controls what message is sent back to the main conversation after a workflow finishes

## For LLMs

When working with this extension:

- **Read `src/workflow-sdk.ts`** for the full vocabulary, discovery, and introspection API
- **Read `src/workflow-spec.ts`** for the `STEP_TYPES` registry and YAML parsing rules
- **Read `src/expression.ts`** for `FILTER_NAMES` and expression evaluation rules
- **Read `src/types.ts`** for `WorkflowSpec`, `StepSpec`, `AgentSpec`, and `ExecutionState` type definitions
- **Read `src/dag.ts`** to understand how execution order is inferred from expressions
- **Read agent `.agent.yaml` files** in `agents/` to understand available agent capabilities
- **Read workflow `.workflow.yaml` files** in `workflows/` for examples of workflow structure
- Use the `workflow` tool to execute workflows — it handles discovery, input validation, checkpoint detection, and result formatting
- The `/workflow list` command provides an interactive picker; `/workflow run <name>` runs directly

## Tests

```bash
npm test
```

Runs `tsx --test src/*.test.ts`. 500+ tests covering step types, expressions, DAG planning, state persistence, checkpoint/resume, and template compilation.

## Development

Part of the [`pi-project-workflows`](../../README.md) monorepo. All three packages (pi-project, pi-workflows, pi-behavior-monitors) are versioned in lockstep at 0.2.0.

`npm run build` compiles TypeScript to `dist/` via `tsc`. The package ships `dist/`, not `src/` — the `pi.extensions` entry point is `./dist/index.js`.
