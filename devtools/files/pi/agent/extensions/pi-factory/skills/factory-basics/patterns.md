# Factory Patterns

Common orchestration patterns for pi-factory programs.

## Parallel Review

Fan out independent tasks, collect results:

```ts
export async function run(input, rt) {
  const results = await rt.parallel("review", [
    { agent: "security", systemPrompt: "Find vulnerabilities.", task: "Review src/auth/", cwd: process.cwd(), step: 0 },
    { agent: "perf", systemPrompt: "Find performance issues.", task: "Profile src/api/", cwd: process.cwd(), step: 1 },
  ]);
  return { results };
}
```

## Sequential Pipeline

Each step feeds into the next via `result.text`:

```ts
export async function run(input, rt) {
  const analysis = await rt.sequence("pipeline", [
    { agent: "analyzer", systemPrompt: "Analyze the codebase.", task: "Map all API endpoints", cwd: process.cwd(), step: 0 },
    { agent: "planner", systemPrompt: "Create a test plan based on the analysis.", task: "Design integration tests", cwd: process.cwd(), step: 1 },
  ]);
  return { results: analysis };
}
```

## Fan-out then Synthesize

Parallel investigation followed by a single summarizer:

```ts
export async function run(input, rt) {
  const reviews = await rt.parallel("investigate", [
    { agent: "frontend", systemPrompt: "Review frontend code.", task: input.task, cwd: process.cwd(), step: 0 },
    { agent: "backend", systemPrompt: "Review backend code.", task: input.task, cwd: process.cwd(), step: 1 },
    { agent: "infra", systemPrompt: "Review infrastructure.", task: input.task, cwd: process.cwd(), step: 2 },
  ]);

  const context = reviews.map(r => `[${r.agent}]\n${r.text}`).join("\n\n");
  const summary = await rt.join(rt.spawn({
    agent: "synthesizer",
    systemPrompt: "Combine findings into an actionable summary.",
    task: `Synthesize these reviews:\n${context}`,
    cwd: process.cwd(),
    step: 3,
  }));

  return { results: [...reviews, summary] };
}
```

## Model Selection

- Use fast/cheap models for simple tasks (file reading, formatting, grep-like work)
- Use mid-tier models for code review, analysis, planning
- Reserve frontier models for complex multi-step reasoning
- Override `model` per-agent when tasks vary in complexity

## Context Chaining

Each result has:
- `result.text` — final assistant output, use directly in subsequent prompts
- `result.sessionPath` — full session file, explorable via `search_thread`

Pass context between agents by including `result.text` in the next agent's task string. For deep investigation, point agents at each other's `sessionPath`.
