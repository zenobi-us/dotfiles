# Changelog

## [0.3.0] - 2026-03-18

## [0.2.0] - 2026-03-17

### Added
- Monorepo integration as workspace package
- Bundled workflow YAML schema path resolution relative to package

## [0.1.0] - 2026-03-14

### Added
- Workflow orchestration via `.workflow.yaml` specs with DAG-based execution planning
- Step types: agent, command, transform, gate, parallel, foreach, loop, pause
- Expression evaluator (`${{ }}`) with filters: length, keys, filter, json, upper, lower, trim, default, first, last, join, split, replace, includes, map, sum, min, max, sort, unique, flatten, zip, group_by, count_by, chunk, pick, omit, entries, from_entries, merge, values, not, and, or
- Agent dispatch via subprocess (`pi --mode json`) with thinking inheritance
- Nunjucks template compilation for agent prompts with template inheritance
- Agent spec loader (`.agent.yaml` format with model, thinking, tools, output schema)
- DAG planner inferring parallelism from `${{ steps.X }}` references
- Atomic state persistence after each step (tmp + rename, failure is fatal)
- Checkpoint/resume: incomplete runs resume from last completed step
- `completion` field for post-workflow messages to main LLM
- Workflow SDK: `stepTypes()`, `filterNames()`, `expressionRoots()`, vocabulary discovery
- Workflow discovery: `availableAgents(cwd)`, `availableWorkflows(cwd)`, `availableTemplates(cwd)` with three-tier search (project > user > package builtin)
- Spec introspection: `extractExpressions`, `declaredSteps`, `declaredAgentRefs`, `declaredSchemaRefs`
- `/workflow` command with `run`, `list`, `resume` subcommands
- TUI progress widget for workflow execution
- Bundled agents: investigator, decomposer, executor, verifier, refresher
- Bundled workflows: do-gap, gap-to-phase, create-phase, refresh-blocks
- Bundled output schemas and Nunjucks templates
