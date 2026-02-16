---
name: factory-basics
description: "Write pi-factory programs to orchestrate multi-agent workflows. Use when spawning subagents, coordinating parallel/sequential tasks, building agent-driven automation, or applying common orchestration patterns like fan-out, pipelines, and synthesis."
---

# Factory Basics

Pi-factory enables writing programs that orchestrate multiple AI agents. Programs spawn subagents, coordinate their work, and compose results.

## Program Structure

Every factory program exports `async function run(input, rt)`:

```typescript
export async function run(input, rt) {
  // Spawn subagents, coordinate work, return results
  const handle = rt.spawn({
    agent: "researcher",
    systemPrompt: "You are a research assistant.",
    task: "Find information about TypeScript 5.0",
    cwd: process.cwd()
  });
  
  const result = await rt.join(handle);
  return { summary: result.text, tokens: result.usage.input + result.usage.output };
}
```

**Parameters:**
- `input`: JSON data passed from the caller
- `rt`: ProgramRuntime — the orchestration API

**Return value:** Any JSON-serializable data

## Runtime API

### Spawn

Create a subagent task:

```typescript
const handle = rt.spawn({
  agent: "code-reviewer",           // Role label (for logging)
  systemPrompt: "Review code...",   // Instructions for the agent
  task: "Review main.ts",           // The task request
  cwd: "/path/to/project",          // Working directory
  step?: 1,                         // Optional step number
  signal?: abortSignal              // Optional cancellation
});
```

Returns `SpawnHandle` with:
- `taskId`: Unique identifier
- `join()`: Promise that resolves to `ExecutionResult`

### Join

Wait for one or multiple subagents to complete:

```typescript
// Single subagent
const result = await rt.join(handle);

// Multiple subagents (waits for all)
const results = await rt.join([handle1, handle2, handle3]);
```

### Parallel

Spawn multiple subagents and wait for all to complete:

```typescript
const results = await rt.parallel("analyze-modules", [
  { agent: "analyzer", systemPrompt: "...", task: "Analyze auth.ts", cwd: "." },
  { agent: "analyzer", systemPrompt: "...", task: "Analyze db.ts", cwd: "." },
  { agent: "analyzer", systemPrompt: "...", task: "Analyze api.ts", cwd: "." }
]);
```

All tasks run concurrently. Returns array of results in input order.

### Sequence

Spawn subagents one at a time, waiting for each before starting the next:

```typescript
const results = await rt.sequence("deployment-pipeline", [
  { agent: "tester", systemPrompt: "Run tests", task: "npm test", cwd: "." },
  { agent: "builder", systemPrompt: "Build app", task: "npm build", cwd: "." },
  { agent: "deployer", systemPrompt: "Deploy", task: "deploy to prod", cwd: "." }
]);
```

Tasks run sequentially. Useful for workflows where each step depends on the previous.

### Workspace

Create temporary directories for subagents:

```typescript
const workDir = rt.workspace.create("analysis");
// workDir = "/tmp/pi-factory-analysis-abc123"

const handle = rt.spawn({
  agent: "worker",
  systemPrompt: "Process files",
  task: "Analyze data",
  cwd: workDir
});

rt.workspace.cleanup(workDir);
```

### Observe

Log events and write artifacts:

```typescript
// Log structured events
rt.observe.log("info", "Starting analysis", { fileCount: 42 });
rt.observe.log("warning", "Slow response", { duration: 5000 });
rt.observe.log("error", "Task failed", { taskId: "task-3" });

// Write artifacts (reports, outputs)
const artifactPath = rt.observe.artifact("summary.md", reportContent);
```

### Shutdown

```typescript
await rt.shutdown(true);   // Cancel all running tasks
await rt.shutdown(false);  // Wait for running tasks to complete naturally
```

## Execution Results

Each subagent returns an `ExecutionResult`:

```typescript
interface ExecutionResult {
  taskId: string;              // Unique task identifier
  agent: string;               // Agent role label
  task: string;                // Original task string
  exitCode: number;            // 0 = success, non-zero = failure
  
  // Output
  text: string;                // Final assistant text (auto-populated)
  sessionPath?: string;        // Path to .jsonl session file
  
  // Conversation
  messages: Message[];         // Full message history
  
  // Metadata
  usage: UsageStats;           // Token counts and costs
  model?: string;              // Model used
  tools?: string[];            // Tools available
  stopReason?: string;         // "end_turn", "max_tokens", etc.
  errorMessage?: string;       // Error details if failed
  stderr: string;              // Process stderr output
  
  // Context
  step?: number;               // Step number if provided
  threadRef: {                 // For traceability
    runId: string;
    taskId: string;
    step?: number;
  };
}
```

### Quick Access: result.text

The `text` field contains the final assistant response, auto-extracted from the last assistant message:

```typescript
const result = await rt.join(handle);
console.log(result.text);  // "The project is a CLI tool for..."
```

### Deep Exploration: result.sessionPath

The `sessionPath` points to a `.jsonl` file containing the full conversation. Use `search_thread` to explore it, or pass it to subsequent subagents:

```typescript
const result = await rt.join(handle);

const reviewer = rt.spawn({
  agent: "reviewer",
  systemPrompt: "Review the analysis session",
  task: `Review session at ${result.sessionPath} and identify key findings`,
  cwd: "."
});
```

## Context Flow

### Context DOWN (Parent to Subagent)

The parent session path is automatically appended to the subagent's system prompt. Subagents can use `search_thread` to read the parent conversation.

### Context UP (Subagent to Program)

1. **Quick access**: `result.text` contains final output
2. **Deep access**: `result.sessionPath` points to full session

```typescript
const result = await rt.join(handle);

// Quick: Use text directly
console.log(`Result: ${result.text}`);

// Deep: Pass session to next agent
const nextHandle = rt.spawn({
  agent: "reviewer",
  systemPrompt: "Review previous work",
  task: `Analyze session at ${result.sessionPath}`,
  cwd: "."
});
```

## Chaining Results

Pass results between subagents:

```typescript
// Step 1: Research
const research = await rt.join(rt.spawn({
  agent: "researcher",
  systemPrompt: "Research the topic",
  task: "Find information about Rust async",
  cwd: "."
}));

// Step 2: Summarize using text
const summary = await rt.join(rt.spawn({
  agent: "summarizer",
  systemPrompt: "Create executive summary",
  task: `Summarize this research:\n\n${research.text}`,
  cwd: "."
}));

// Step 3: Deep review using session
const review = await rt.join(rt.spawn({
  agent: "reviewer",
  systemPrompt: "Technical reviewer",
  task: `Review research session at ${research.sessionPath} for technical accuracy`,
  cwd: "."
}));
```

## Error Handling

Check `exitCode`/`stopReason`/`errorMessage` and escalate:

```typescript
const result = await rt.join(handle);

const failed =
  result.exitCode !== 0 ||
  result.stopReason === "error" ||
  Boolean(result.errorMessage);

if (failed) {
  rt.observe.log("error", "Task failed", {
    taskId: result.taskId,
    exitCode: result.exitCode,
    stopReason: result.stopReason,
    error: result.errorMessage,
    stderr: result.stderr
  });
  throw new Error(`Task ${result.taskId} failed: ${result.errorMessage || "unknown error"}`);
}
```

Spawn/join usage:

```typescript
// ✅ preferred
const h = rt.spawn({...});
const r = await rt.join(h);

// ✅ also valid
const r2 = await rt.spawn({...});

// ❌ invalid (ExecutionResult passed to join)
const wrong = await rt.spawn({...});
await rt.join(wrong);
```

Use try/catch for program-level errors:

```typescript
export async function run(input, rt) {
  try {
    const results = await rt.parallel("risky-tasks", [
      { agent: "a1", systemPrompt: "...", task: "task 1", cwd: "." },
      { agent: "a2", systemPrompt: "...", task: "task 2", cwd: "." }
    ]);
    
    const failed = results.filter(r => r.exitCode !== 0);
    if (failed.length > 0) {
      return { status: "partial", failed: failed.length };
    }
    
    return { status: "success", results };
  } catch (error) {
    rt.observe.log("error", "Program failed", { error: error.message });
    return { status: "error", message: error.message };
  }
}
```

## Usage Stats

Track token usage and costs:

```typescript
const result = await rt.join(handle);

console.log({
  turns: result.usage.turns,
  input: result.usage.input,
  output: result.usage.output,
  cacheRead: result.usage.cacheRead,
  cacheWrite: result.usage.cacheWrite,
  cost: result.usage.cost
});

// Aggregate across multiple subagents
const results = await rt.parallel("batch", tasks);
const totalCost = results.reduce((sum, r) => sum + r.usage.cost, 0);
```

## Async Model

Programs run asynchronously by default. When invoked via the pi CLI, they return immediately with a `runId`, and results arrive via notification when complete.

Inside your program, use `await` to wait for subagents:

```typescript
export async function run(input, rt) {
  const h1 = rt.spawn({...});
  const h2 = rt.spawn({...});
  const [r1, r2] = await rt.join([h1, h2]);
  return { combined: r1.text + r2.text };
}
```

## Key Principles

1. **Programs coordinate, subagents execute** — Programs focus on workflow logic, subagents do the work
2. **Use text for quick results** — `result.text` gives you the final answer
3. **Use sessionPath for deep context** — Pass to subsequent agents for full exploration
4. **Check failure signals** — `exitCode`, `stopReason`, and `errorMessage`
5. **Log progress** — Use `rt.observe.log()` for visibility
6. **Handle errors gracefully** — Check exitCode, catch exceptions, provide fallbacks

See [patterns.md](patterns.md) in this directory for common orchestration patterns.
