# Model Inheritance Analysis for Subagent Extension

## Goal
Make subagents adopt the current model used by the parent session that initiates the subthread, while still allowing agent-specific model overrides.

## Current Behavior

### Flow Trace

1. **Tool Invocation** (`index.ts:execute()`)
   ```typescript
   async execute(_toolCallId, params, onUpdate, ctx, signal) {
     // ctx.model contains the parent session's current model
     const result = await runSingleAgent(
       ctx.cwd,
       agents,
       params.agent,
       params.task,
       params.cwd,
       undefined,
       signal,
       ctx,  // ← Parent context passed here
       onUpdate,
       makeDetails("single"),
     );
   }
   ```

2. **Agent Loading** (`agents.ts:loadAgent()`)
   ```typescript
   function loadAgent(filePath: string): AgentConfig | null {
     const parsed = parseFrontmatter(content);
     return {
       name,
       description,
       tools: tools && tools.length > 0 ? tools : undefined,
       model: parsed.frontmatter.model,  // ← Optional model from agent definition
       systemPrompt: parsed.body,
       filePath,
     }
   }
   ```

3. **Subprocess Execution** (`subagent.ts:runSingleAgent()`)
   ```typescript
   export async function runSingleAgent(
     defaultCwd: string,
     agents: AgentRegistry,
     agentName: string,
     task: string,
     cwd: string | undefined,
     step: number | undefined,
     signal: AbortSignal | undefined,
     ctx: ExtensionContext,  // ← Has ctx.model but NOT USED
     onUpdate: OnUpdateCallback | undefined,
     makeDetails: (results: SingleResult[]) => SubagentDetails,
   ): Promise<SingleResult> {
     const agent = agents.get(agentName);
     
     const args: string[] = ["--mode", "json", "-p", "--no-session"];
     
     // ❌ PROBLEM: Only uses agent.model, ignores ctx.model
     if (agent.model) args.push("--model", agent.model);
     
     // ... spawn subprocess with args
   }
   ```

### Problem Identified

**Current logic:**
- If `agent.model` exists → use it
- If `agent.model` is undefined → use system default (NOT parent session model)

**Missing:**
- Access to parent session's current model via `ctx.model`
- Fallback chain: `agent.model` → `ctx.model` → system default

## Available Data in ExtensionContext

Based on type definitions in `@mariozechner/pi-coding-agent`:

```typescript
interface ExtensionContext {
  /** UI methods for user interaction */
  ui: ExtensionUIContext;
  
  /** Whether UI is available (false in print/RPC mode) */
  hasUI: boolean;
  
  /** Current working directory */
  cwd: string;
  
  /** Session manager (read-only) */
  sessionManager: ReadonlySessionManager;
  
  /** Model registry for API key resolution */
  modelRegistry: ModelRegistry;
  
  /** Current model (may be undefined) */
  model: Model<any> | undefined;  // ← THIS IS WHAT WE NEED!
  
  /** Whether the agent is idle (not streaming) */
  isIdle(): boolean;
  
  /** Abort the current agent operation */
  abort(): void;
  
  /** Whether there are queued messages waiting */
  hasPendingMessages(): boolean;
  
  /** Gracefully shutdown pi and exit */
  shutdown(): void;
}
```

The `ctx.model` contains the parent session's model and likely has an `id` or `name` property we can pass to `--model`.

## Proposed Solution

### Priority Chain

```
agent.model (explicit override) 
  → ctx.model (parent session model) 
    → undefined (let pi use system default)
```

### Implementation

**File: `subagent.ts`**

```typescript
export async function runSingleAgent(
  defaultCwd: string,
  agents: AgentRegistry,
  agentName: string,
  task: string,
  cwd: string | undefined,
  step: number | undefined,
  signal: AbortSignal | undefined,
  ctx: ExtensionContext,
  onUpdate: OnUpdateCallback | undefined,
  makeDetails: (results: SingleResult[]) => SubagentDetails,
): Promise<SingleResult> {
  const agent = agents.get(agentName);
  
  // ... error handling ...
  
  const args: string[] = ["--mode", "json", "-p", "--no-session"];
  
  // NEW: Determine model with priority chain
  const modelToUse = agent.model || ctx.model?.id;
  if (modelToUse) {
    args.push("--model", modelToUse);
  }
  
  // ... rest of implementation ...
}
```

### Alternative: Get Model Name from ctx.model

If `ctx.model` is an object, we might need to extract the model identifier:

```typescript
// Determine the model identifier to pass to --model flag
let modelId: string | undefined;

if (agent.model) {
  // Agent has explicit model override
  modelId = agent.model;
} else if (ctx.model) {
  // Use parent session's model
  // ctx.model might have properties like: id, name, provider, etc.
  modelId = ctx.model.id || ctx.model.name || String(ctx.model);
}

if (modelId) {
  args.push("--model", modelId);
}
```

## Testing Strategy

### Test Cases

1. **Agent with explicit model** (current behavior should be preserved)
   ```markdown
   ---
   name: haiku-agent
   model: claude-haiku-4-5
   ---
   ```
   Expected: Uses `claude-haiku-4-5` regardless of parent session model

2. **Agent without model, parent using Sonnet**
   ```markdown
   ---
   name: generic-agent
   ---
   ```
   Parent session: `claude-sonnet-4`
   Expected: Subagent uses `claude-sonnet-4`

3. **Agent without model, parent using Opus**
   ```markdown
   ---
   name: generic-agent
   ---
   ```
   Parent session: `claude-opus-4`
   Expected: Subagent uses `claude-opus-4`

4. **Chain mode with mixed models**
   ```typescript
   {
     chain: [
       { agent: "haiku-agent", task: "..." },      // Has model: claude-haiku-4-5
       { agent: "generic-agent", task: "..." },    // No model → inherits parent
     ]
   }
   ```
   Expected: First uses Haiku, second uses parent model

### Verification

After implementation:
1. Add debug logging to show which model is selected
2. Check `SingleResult.model` field in output
3. Verify in actual subagent subprocess output

## Questions to Resolve

1. **Model object structure**: What properties does `ctx.model` have?
   - Need to check: `ctx.model.id`, `ctx.model.name`, or just string conversion?

2. **Model name format**: What format does `--model` expect?
   - Examples: `claude-sonnet-4`, `anthropic:claude-sonnet-4`, etc.?

3. **Backward compatibility**: 
   - Does this change affect existing agents?
   - Should we add a flag to disable inheritance?

## Implementation Checklist

- [ ] Inspect `ctx.model` structure to determine correct property to use
- [ ] Update `runSingleAgent()` to implement priority chain
- [ ] Update `SingleResult` tracking to record which model was selected
- [ ] Add comment documentation explaining the priority chain
- [ ] Test with various model configurations
- [ ] Update README.md to document model inheritance behavior
- [ ] Consider adding `--inherit-model` flag to agent frontmatter for explicit control

## Related Files

- `subagent.ts` - Main implementation location
- `agents.ts` - Agent configuration loading
- `index.ts` - Tool registration and execution
- `README.md` - Documentation update needed
