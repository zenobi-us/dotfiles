---
name: factory-ralph-loop
description: Iterative task execution using the Ralph Loop pattern (named after Ralph Wiggum). Use when you need to repeatedly run an agent until a condition is met—fixing all lint errors, passing all tests, or exhausting PRD tasks. The filesystem serves as memory between iterations.
---

# Ralph Loop Pattern

The Ralph Loop (named after Ralph Wiggum) is an agentic pattern where you run an AI agent in a continuous loop until a task is complete. Each iteration starts relatively fresh, with the filesystem serving as persistent memory.

## Core Characteristics

1. **Same prompt repeated** — The agent receives consistent instructions each iteration
2. **Filesystem as memory** — Code changes persist on disk between iterations
3. **Fresh context** — Each iteration reduces context pollution vs. single long conversation
4. **Exit condition** — Loop ends when tests pass, lint is clean, or work is exhausted
5. **Simple orchestrator** — Just `while (!done) { run agent }`

## Basic Structure

```typescript
export async function run(input, rt) {
  let iteration = 0;
  const maxIterations = input.maxIterations || 10;
  let done = false;

  while (!done && iteration < maxIterations) {
    iteration++;
    rt.observe.log("info", `Iteration ${iteration}`, { maxIterations });

    // Spawn agent with same prompt
    const result = await rt.join(rt.spawn({
      agent: "worker",
      systemPrompt: "You are fixing issues iteratively",
      task: "Fix the next issue",
      cwd: input.cwd || process.cwd(),
      step: iteration
    }));

    // Check exit condition
    done = await checkExitCondition(rt, input);
    
    if (result.exitCode !== 0) {
      rt.observe.log("error", "Agent failed", { iteration, error: result.errorMessage });
      break;
    }
  }

  return { iterations: iteration, completed: done };
}
```

## Pattern 1: Fix All Lint Errors

Repeatedly run an agent until lint is clean:

```typescript
import { spawnSync } from "child_process";

export async function run(input, rt) {
  let iteration = 0;
  const maxIterations = input.maxIterations || 20;
  
  while (iteration < maxIterations) {
    iteration++;
    
    // Check if lint is clean
    const lintResult = spawnSync("npm", ["run", "lint"], {
      cwd: input.cwd || process.cwd(),
      encoding: "utf-8"
    });
    
    if (lintResult.status === 0) {
      rt.observe.log("info", "Lint clean!", { iterations: iteration });
      return { status: "success", iterations: iteration };
    }
    
    rt.observe.log("info", `Iteration ${iteration}`, { 
      exitCode: lintResult.status,
      errorCount: (lintResult.stdout.match(/error/gi) || []).length
    });
    
    // Run agent to fix issues
    const result = await rt.join(rt.spawn({
      agent: "linter",
      systemPrompt: `You fix lint errors iteratively.
Run 'npm run lint' to see current errors.
Fix one or more errors, focusing on the most common patterns.
Make minimal, focused changes.`,
      task: `Fix lint errors. Current output:\n\n${lintResult.stdout}\n${lintResult.stderr}`,
      cwd: input.cwd || process.cwd(),
      step: iteration
    }));
    
    if (result.exitCode !== 0) {
      rt.observe.log("error", "Agent failed", { iteration });
      return { status: "error", iterations: iteration };
    }
  }
  
  return { status: "max_iterations", iterations: iteration };
}
```

**Usage:**

```bash
pi factory run fix-lint.ts --input '{"cwd": "./my-project", "maxIterations": 15}'
```

## Pattern 2: With Progress Tracking

Accumulate state across iterations to show progress:

```typescript
import { spawnSync } from "child_process";

interface ProgressState {
  fixedIssues: string[];
  lastErrorCount: number;
  stagnantIterations: number;
}

export async function run(input, rt) {
  let iteration = 0;
  const maxIterations = input.maxIterations || 20;
  
  const progress: ProgressState = {
    fixedIssues: [],
    lastErrorCount: Infinity,
    stagnantIterations: 0
  };
  
  while (iteration < maxIterations) {
    iteration++;
    
    // Check current state
    const lintResult = spawnSync("npm", ["run", "lint"], {
      cwd: input.cwd || process.cwd(),
      encoding: "utf-8"
    });
    
    const errorCount = (lintResult.stdout.match(/error/gi) || []).length;
    
    if (lintResult.status === 0) {
      rt.observe.log("info", "All issues fixed!", { 
        iterations: iteration,
        fixedIssues: progress.fixedIssues
      });
      return { 
        status: "success", 
        iterations: iteration,
        fixed: progress.fixedIssues
      };
    }
    
    // Track progress
    if (errorCount >= progress.lastErrorCount) {
      progress.stagnantIterations++;
    } else {
      progress.stagnantIterations = 0;
    }
    
    // Exit if stagnant
    if (progress.stagnantIterations >= 3) {
      rt.observe.log("warning", "No progress for 3 iterations", { errorCount });
      return { 
        status: "stagnant", 
        iterations: iteration,
        remainingErrors: errorCount 
      };
    }
    
    rt.observe.log("info", `Iteration ${iteration}`, { 
      errorCount,
      lastErrorCount: progress.lastErrorCount,
      fixed: progress.fixedIssues.length
    });
    
    progress.lastErrorCount = errorCount;
    
    // Run agent with progress context
    const result = await rt.join(rt.spawn({
      agent: "fixer",
      systemPrompt: `You fix lint errors iteratively.
Track your progress and avoid repeating unsuccessful approaches.
Previous fixes: ${progress.fixedIssues.join(", ") || "none yet"}
Error count: ${errorCount} (was ${progress.lastErrorCount === Infinity ? "unknown" : progress.lastErrorCount})`,
      task: `Fix lint errors:\n\n${lintResult.stdout}\n${lintResult.stderr}`,
      cwd: input.cwd || process.cwd(),
      step: iteration
    }));
    
    if (result.exitCode === 0) {
      // Extract what was fixed from result.text
      const fixMatch = result.text.match(/fixed?:?\s*(.+)/i);
      if (fixMatch) {
        progress.fixedIssues.push(fixMatch[1]);
      }
    }
  }
  
  return { status: "max_iterations", iterations: iteration };
}
```

## Pattern 3: Loop Until Tests Pass

Run agent repeatedly until test suite passes:

```typescript
import { spawnSync } from "child_process";

export async function run(input, rt) {
  const testCommand = input.testCommand || "npm test";
  const [cmd, ...args] = testCommand.split(" ");
  
  let iteration = 0;
  const maxIterations = input.maxIterations || 10;
  
  while (iteration < maxIterations) {
    iteration++;
    
    // Run tests
    const testResult = spawnSync(cmd, args, {
      cwd: input.cwd || process.cwd(),
      encoding: "utf-8",
      timeout: 60000 // 60s timeout
    });
    
    if (testResult.status === 0) {
      rt.observe.log("info", "Tests passing!", { iterations: iteration });
      return { status: "success", iterations: iteration };
    }
    
    rt.observe.log("info", `Iteration ${iteration}`, { 
      exitCode: testResult.status,
      timeout: testResult.signal === "SIGTERM"
    });
    
    // Build context from test output
    const failureOutput = [testResult.stdout, testResult.stderr]
      .filter(Boolean)
      .join("\n")
      .slice(-5000); // Last 5KB to avoid huge prompts
    
    // Run agent to fix failing tests
    const result = await rt.join(rt.spawn({
      agent: "test-fixer",
      systemPrompt: `You fix failing tests iteratively.
Analyze test output, identify the root cause, and make minimal fixes.
Run the tests again to verify your changes.
Focus on one failure at a time if there are multiple.`,
      task: `Fix failing tests. Output from '${testCommand}':\n\n${failureOutput}`,
      cwd: input.cwd || process.cwd(),
      step: iteration
    }));
    
    if (result.exitCode !== 0) {
      rt.observe.log("error", "Agent failed", { iteration });
      return { status: "error", iterations: iteration };
    }
  }
  
  rt.observe.log("warning", "Max iterations reached", { maxIterations });
  return { status: "max_iterations", iterations: iteration };
}
```

**Usage:**

```bash
# Use default npm test
pi factory run fix-tests.ts --input '{"cwd": "./api-server"}'

# Custom test command
pi factory run fix-tests.ts --input '{"cwd": "./app", "testCommand": "pytest tests/", "maxIterations": 15}'
```

## Pattern 4: Exhaustive PRD Implementation

Work through Product Requirements Document tasks until all are complete:

```typescript
import fs from "fs";

interface PRDTask {
  id: string;
  description: string;
  completed: boolean;
}

export async function run(input, rt) {
  const prdPath = input.prdPath || "./PRD.md";
  const tasksPath = input.tasksPath || "./tasks.json";
  
  // Load or initialize tasks
  let tasks: PRDTask[];
  if (fs.existsSync(tasksPath)) {
    tasks = JSON.parse(fs.readFileSync(tasksPath, "utf-8"));
  } else {
    // Parse PRD and create tasks (simplified)
    const prdContent = fs.readFileSync(prdPath, "utf-8");
    tasks = parsePRD(prdContent);
    fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
  }
  
  let iteration = 0;
  const maxIterations = input.maxIterations || 50;
  
  while (iteration < maxIterations) {
    // Find next incomplete task
    const nextTask = tasks.find(t => !t.completed);
    if (!nextTask) {
      rt.observe.log("info", "All tasks completed!", { iterations: iteration });
      return { status: "success", iterations: iteration, tasks };
    }
    
    iteration++;
    rt.observe.log("info", `Iteration ${iteration}: ${nextTask.id}`, {
      remaining: tasks.filter(t => !t.completed).length
    });
    
    // Work on task
    const result = await rt.join(rt.spawn({
      agent: "implementer",
      systemPrompt: `You implement PRD tasks iteratively.
Read the PRD at ${prdPath}.
Complete tasks one at a time.
Mark tasks complete by updating ${tasksPath}.`,
      task: `Implement: ${nextTask.id} - ${nextTask.description}\n\nCompleted so far:\n${
        tasks.filter(t => t.completed).map(t => `✓ ${t.id}`).join("\n")
      }`,
      cwd: input.cwd || process.cwd(),
      step: iteration
    }));
    
    if (result.exitCode !== 0) {
      rt.observe.log("error", "Agent failed", { iteration, task: nextTask.id });
      return { status: "error", iterations: iteration };
    }
    
    // Reload tasks (agent may have updated them)
    if (fs.existsSync(tasksPath)) {
      tasks = JSON.parse(fs.readFileSync(tasksPath, "utf-8"));
    }
  }
  
  return { status: "max_iterations", iterations: iteration };
}

function parsePRD(content: string): PRDTask[] {
  // Simple parser: finds "- [ ] Task description" patterns
  const matches = content.matchAll(/^[-*]\s*\[\s*\]\s*(.+)$/gm);
  const tasks: PRDTask[] = [];
  let id = 1;
  
  for (const match of matches) {
    tasks.push({
      id: `TASK-${id++}`,
      description: match[1].trim(),
      completed: false
    });
  }
  
  return tasks;
}
```

## Pattern 5: Combined Safety Checks

Comprehensive safety and exit logic:

```typescript
import { spawnSync } from "child_process";

interface LoopConfig {
  maxIterations: number;
  maxStagnantIterations: number;
  maxFailedIterations: number;
  checkCommand: string;
  checkInterval?: number; // Run check every N iterations
}

export async function run(input, rt) {
  const config: LoopConfig = {
    maxIterations: input.maxIterations || 20,
    maxStagnantIterations: input.maxStagnantIterations || 3,
    maxFailedIterations: input.maxFailedIterations || 2,
    checkCommand: input.checkCommand || "npm run lint",
    checkInterval: input.checkInterval || 1
  };
  
  let iteration = 0;
  let stagnantCount = 0;
  let failedCount = 0;
  let lastCheckOutput = "";
  
  while (iteration < config.maxIterations) {
    iteration++;
    
    // Periodic check
    if (iteration % config.checkInterval === 0) {
      const [cmd, ...args] = config.checkCommand.split(" ");
      const checkResult = spawnSync(cmd, args, {
        cwd: input.cwd || process.cwd(),
        encoding: "utf-8"
      });
      
      // Success!
      if (checkResult.status === 0) {
        rt.observe.log("info", "Check passed!", { iterations: iteration });
        return { status: "success", iterations: iteration };
      }
      
      // Track stagnation
      const currentOutput = checkResult.stdout + checkResult.stderr;
      if (currentOutput === lastCheckOutput) {
        stagnantCount++;
        rt.observe.log("warning", "No change detected", { stagnantCount });
      } else {
        stagnantCount = 0;
      }
      lastCheckOutput = currentOutput;
      
      // Exit if stagnant
      if (stagnantCount >= config.maxStagnantIterations) {
        rt.observe.log("error", "Stagnant iterations exceeded", { 
          stagnantCount,
          maxStagnantIterations: config.maxStagnantIterations
        });
        return { status: "stagnant", iterations: iteration };
      }
    }
    
    // Run agent
    rt.observe.log("info", `Iteration ${iteration}`, { 
      stagnantCount,
      failedCount,
      max: config.maxIterations
    });
    
    const result = await rt.join(rt.spawn({
      agent: "worker",
      systemPrompt: input.systemPrompt || "You are fixing issues iteratively",
      task: input.task || "Continue fixing issues",
      cwd: input.cwd || process.cwd(),
      step: iteration
    }));
    
    // Track failures
    if (result.exitCode !== 0) {
      failedCount++;
      rt.observe.log("error", "Agent failed", { iteration, failedCount });
      
      if (failedCount >= config.maxFailedIterations) {
        rt.observe.log("error", "Failed iterations exceeded", {
          failedCount,
          maxFailedIterations: config.maxFailedIterations
        });
        return { status: "too_many_failures", iterations: iteration };
      }
    } else {
      failedCount = 0; // Reset on success
    }
  }
  
  return { status: "max_iterations", iterations: iteration };
}
```

**Usage:**

```bash
pi factory run robust-loop.ts --input '{
  "cwd": "./project",
  "checkCommand": "npm test",
  "maxIterations": 30,
  "maxStagnantIterations": 4,
  "maxFailedIterations": 3,
  "checkInterval": 2,
  "systemPrompt": "Fix failing tests one at a time",
  "task": "Analyze test failures and fix them"
}'
```

## Best Practices

### 1. **Set max iterations**

Always have an upper bound to prevent infinite loops:

```typescript
const maxIterations = input.maxIterations || 20; // Sensible default
```

### 2. **Detect stagnation**

Track if the agent is making progress:

```typescript
if (currentState === lastState) {
  stagnantCount++;
  if (stagnantCount >= 3) {
    return { status: "stagnant" };
  }
}
```

### 3. **Use bash exit conditions**

Shell out to authoritative checks (tests, lint, build):

```typescript
const result = spawnSync("npm", ["test"], { encoding: "utf-8" });
if (result.status === 0) {
  return { status: "success" };
}
```

### 4. **Provide context to agent**

Include iteration number, progress, previous attempts:

```typescript
task: `Iteration ${iteration}/${maxIterations}
Fixed so far: ${fixed.join(", ")}
Current errors: ${errorCount}
...`
```

### 5. **Log everything**

Observability is critical for debugging loops:

```typescript
rt.observe.log("info", "Loop state", {
  iteration,
  errorCount,
  stagnantCount,
  lastChange
});
```

### 6. **Limit context size**

Truncate large outputs to avoid prompt bloat:

```typescript
const recentOutput = fullOutput.slice(-5000); // Last 5KB
```

### 7. **Allow early exit**

If the goal is achieved, return immediately:

```typescript
if (testsPassing) {
  return { status: "success", iterations: iteration };
}
```

## When to Use Ralph Loop

✅ **Good for:**
- Fixing lint/type errors iteratively
- Making tests pass one by one
- Implementing PRD tasks sequentially
- Refactoring with incremental validation
- Code generation with iterative refinement

❌ **Not ideal for:**
- Tasks requiring deep context across iterations
- Complex multi-step reasoning within a single problem
- When the agent needs to remember detailed discussions
- Parallel work (use `rt.parallel` instead)

## Advanced: Nested Loops

You can nest Ralph Loops for hierarchical work:

```typescript
export async function run(input, rt) {
  // Outer loop: iterate through modules
  for (const module of input.modules) {
    rt.observe.log("info", `Processing module: ${module}`);
    
    // Inner Ralph Loop: fix module until clean
    let iteration = 0;
    while (iteration < 10) {
      iteration++;
      
      const result = await rt.join(rt.spawn({
        agent: "module-fixer",
        systemPrompt: `Fix issues in ${module}`,
        task: "Run checks and fix issues",
        cwd: input.cwd,
        step: iteration
      }));
      
      // Check if module is clean
      const check = spawnSync("npm", ["run", "lint", module], {
        cwd: input.cwd,
        encoding: "utf-8"
      });
      
      if (check.status === 0) break;
    }
  }
  
  return { status: "complete" };
}
```

## Summary

The Ralph Loop is a simple but powerful pattern:
- **While loop** around agent spawn/join
- **Filesystem persistence** between iterations
- **Bash exit conditions** for authoritative checks
- **Progress tracking** to detect stagnation
- **Max iterations** for safety

It works because the agent sees fresh context each iteration, making progress incrementally while the filesystem accumulates changes. Perfect for iterative tasks where "run it again" is a valid strategy.
