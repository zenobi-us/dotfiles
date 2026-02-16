# pi-factory

A pi extension that registers a `subagent` tool for spawning child agents. Async by default — fire, forget, get notified.

## Example

User prompt:
> Review the auth module for security issues and check test coverage in parallel.

The orchestrator writes a program:

```ts
export async function run(input, rt) {
  const results = await rt.parallel("review", [
    { agent: "security", systemPrompt: "Find vulnerabilities.", task: "Review src/auth/ for security issues", cwd: process.cwd(), step: 0 },
    { agent: "coverage", systemPrompt: "Analyze test coverage.", task: "Check test coverage for src/auth/", cwd: process.cwd(), step: 1 },
  ]);
  return { results };
}
```

The tool returns immediately:
> Spawned 'security-audit' → factory-abc123. Running async — results will be delivered when complete.

The orchestrator continues working. When subagents finish, a notification wakes the LLM:
> Subagent 'security-audit' done (18s). Use /factory to inspect.

Because completion notifications use `triggerTurn`, each completion can trigger another assistant turn. If the parent task is open-ended (for example “continue slice-by-slice”), the orchestrator may choose to spawn additional subagent programs automatically.

## Schema

Three fields — `task` and `code` are required, `await` is optional:

```json
{
  "task": "Review the auth module in parallel",
  "code": "export async function run(input, rt) { ... }",
  "await": false
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `task` | ✅ | Label/description for this program run. |
| `code` | ✅ | TypeScript program. Must export `async run(input, rt)`. |
| `await` | ❌ | Block until complete (default: false). |

## Async by default

All subagent calls return immediately. Results arrive via notification (`pi.sendMessage` with `triggerTurn`). Set `await: true` only when you need the result inline before continuing.

### TUI integration

- **Widget** — persistent status bar shows active runs with live elapsed time
- **Notifications** — completions delivered as expandable custom messages (batched within 500ms)
- **`/factory` command** — bordered overlay with run list, detail pane, scroll, cancel

## Program mode

Programs run with a runtime object providing orchestration primitives:

```ts
export async function run(input, rt) {
  // Parallel fan-out
  const results = await rt.parallel("review", [
    { agent: "linter", systemPrompt: "Lint.", task: "lint src/", cwd: process.cwd(), step: 0 },
    { agent: "tester", systemPrompt: "Test.", task: "run tests", cwd: process.cwd(), step: 1 },
  ]);

  // Sequential pipeline
  const deployed = await rt.sequence("deploy", [
    { agent: "builder", systemPrompt: "Build.", task: "build", cwd: process.cwd(), step: 0 },
    { agent: "deployer", systemPrompt: "Deploy.", task: "deploy", cwd: process.cwd(), step: 1 },
  ]);

  // Low-level spawn/join (overloaded: single handle or array)
  const handle = rt.spawn({ agent: "scout", systemPrompt: "Scout.", task: "find issues", cwd: process.cwd() });
  const result = await rt.join(handle);           // single
  const batch = await rt.join([handle1, handle2]); // array

  return { results: [...results, ...deployed, result] };
}
```

Program mode requires user confirmation before execution.

## Context flow

Each subagent receives the parent session path and can use `search_thread` to explore it. After completion:
- `result.text` — auto-populated with the final assistant output
- `result.sessionPath` — persistent session file, explorable via `search_thread`

## Configuration

Edit the `config` object at the top of `index.ts`:

```ts
export const config = {
  prompt: "Prefer cerebras for simple tasks. Use sonnet for code review.",
};
```

`config.prompt` is appended to the tool description, so the LLM sees it when deciding how to use the tool.

## Bundled skills

The `skills/` directory contains pi skills that are automatically registered via `resources_discover`. They're loaded on-demand when the LLM's task matches the skill description.

| Skill | Trigger |
|-------|---------|
| `factory-patterns` | Spawning subagents, writing program code, multi-agent architectures |

Add new skills by creating a `skills/<name>/SKILL.md` with YAML frontmatter (`name`, `description`) and markdown content.

## Failure contract (important)

For robust orchestration and recovery:

- A run should be treated as failed if `run.json.error` is present.
- For child-level checks, treat a child result as failed when any of these are true:
  - `exitCode !== 0`
  - `stopReason === "error"`
  - `errorMessage` is non-empty
- If your program observes failed children, explicitly escalate (usually `throw new Error(...)`) so the parent run status becomes `failed`.

Spawn/join footgun to avoid:

```ts
// ✅ Correct
const h = rt.spawn({...});
const r = await rt.join(h);

// ✅ Also valid (no join needed)
const r = await rt.spawn({...});

// ❌ Wrong: awaiting spawn returns ExecutionResult, not SpawnHandle
const h = await rt.spawn({...});
await rt.join(h);
```

`rt.join()` now validates input and returns a recoverable `INVALID_INPUT` error with a corrective hint for this misuse.

## Error codes

| Code | Meaning |
|------|---------|
| `INVALID_INPUT` | Bad or missing parameters |
| `MODEL_NOT_FOUND` | Requested model not in registry |
| `CANCELLED` | Aborted by signal or user |
| `RUNTIME` | Execution failure |
| `CONFIRMATION_REJECTED` | User rejected program execution |

## Files

| File | Purpose |
|------|---------|
| `index.ts` | Tool registration, async/blocking dispatch, TUI rendering, lifecycle hooks |
| `contract.ts` | TypeBox schema + validation |
| `runtime.ts` | spawn/join/parallel/sequence + program module loader |
| `executors/program-executor.ts` | Confirmation UI + program execution |
| `registry.ts` | RunRegistry — tracks active/completed runs with acknowledge lifecycle |
| `widget.ts` | Persistent status bar via `setWidget` |
| `notify.ts` | Batched completion notifications + message renderer |
| `overlay.ts` | `/factory` command overlay — bordered run inspector |
| `model-resolver.ts` | Model string → provider/id, splits for CLI flags |
| `tool-resolver.ts` | Normalize + dedupe tool names |
| `observability.ts` | Event timeline + artifact tracking |
| `errors.ts` | 5-code error model |
| `types.ts` | ExecutionResult, RunSummary, UsageStats |
