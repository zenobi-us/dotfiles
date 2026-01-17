# Implementation Plan: Model Inheritance for Subagents

## Summary

Enable subagents to inherit the parent session's current model when no explicit model is configured in the agent definition.

## Model Object Structure (from @mariozechner/pi-ai)

```typescript
interface Model<TApi extends Api> {
  id: string;          // ← Use this for --model flag
  name: string;
  api: TApi;
  provider: Provider;
  baseUrl: string;
  reasoning: boolean;
  input: ("text" | "image")[];
  cost: {
    input: number;
    output: number;
    // ...
  };
}
```

## Implementation

### Change Location: `subagent.ts`

**Before:**
```typescript
const args: string[] = ["--mode", "json", "-p", "--no-session"];
if (agent.model) args.push("--model", agent.model);
if (agent.tools && agent.tools.length > 0) args.push("--tools", agent.tools.join(","));
```

**After:**
```typescript
const args: string[] = ["--mode", "json", "-p", "--no-session"];

// Model selection priority: agent.model → ctx.model.id → system default
const modelToUse = agent.model || ctx.model?.id;
if (modelToUse) {
  args.push("--model", modelToUse);
}

if (agent.tools && agent.tools.length > 0) args.push("--tools", agent.tools.join(","));
```

### Full Context (Lines ~65-85 in subagent.ts)

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

	if (!agent) {
		return {
			agent: agentName,
			task,
			exitCode: 1,
			messages: [],
			stderr: `Unknown agent: ${agentName}`,
			usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, contextTokens: 0, turns: 0 },
			step,
		};
	}

	const args: string[] = ["--mode", "json", "-p", "--no-session"];
	
	// NEW: Model selection priority: agent.model → ctx.model.id → system default
	const modelToUse = agent.model || ctx.model?.id;
	if (modelToUse) {
		args.push("--model", modelToUse);
	}
	
	if (agent.tools && agent.tools.length > 0) args.push("--tools", agent.tools.join(","));

	// ... rest of function
}
```

## Behavior Matrix

| Agent Config | Parent Model | Result |
|--------------|--------------|--------|
| `model: claude-haiku-4-5` | `claude-sonnet-4` | Uses `claude-haiku-4-5` (agent override) |
| No model field | `claude-sonnet-4` | Uses `claude-sonnet-4` (inherits) |
| No model field | `claude-opus-4` | Uses `claude-opus-4` (inherits) |
| No model field | `undefined` | Uses system default |

## Documentation Update

### README.md Section to Add/Update

**In "Agent Definitions" section:**

```markdown
## Model Inheritance

Subagents use the following priority for model selection:

1. **Agent-specific model** (frontmatter `model:` field) - Takes precedence
2. **Parent session model** - Inherited from the session that invoked the subagent
3. **System default** - Falls back to default model configuration

Example:
```markdown
---
name: fast-scout
model: claude-haiku-4-5
---
Fast reconnaissance with Haiku, regardless of parent session model.
```

```markdown
---
name: adaptive-worker
# No model field - inherits from parent session
---
Uses whatever model the parent session is currently using.
```

This allows you to:
- Create cost-optimized agents (e.g., Haiku for quick tasks)
- Create specialized agents (e.g., Opus for complex reasoning)
- Create adaptive agents that match the parent's model choice
```

## Testing Plan

### Manual Tests

1. **Test inheritance with Sonnet parent**
   ```typescript
   // In session using claude-sonnet-4
   subagent({ agent: "worker", task: "..." })
   // Verify worker uses claude-sonnet-4
   ```

2. **Test override with Haiku agent**
   ```typescript
   // In session using claude-sonnet-4
   subagent({ agent: "scout", task: "..." })
   // Verify scout uses claude-haiku-4-5 (from scout.md frontmatter)
   ```

3. **Test chain with mixed models**
   ```typescript
   subagent({
     chain: [
       { agent: "scout", task: "Find auth code" },  // Uses Haiku
       { agent: "worker", task: "Fix {previous}" }, // Inherits parent model
     ]
   })
   ```

4. **Verify in output**
   - Check `SingleResult.model` field
   - Verify usage stats show correct model
   - Confirm cost calculations match model used

### Regression Tests

- Ensure existing agents with explicit models still work
- Verify all three execution modes (single, parallel, chain)
- Check error handling when model is invalid

## Rollout

1. ✅ Create analysis document (MODEL_INHERITANCE_ANALYSIS.md)
2. ✅ Create implementation plan (this file)
3. [ ] Implement change in `subagent.ts`
4. [ ] Test manually with different scenarios
5. [ ] Update README.md with model inheritance documentation
6. [ ] Commit with semantic commit message
7. [ ] Update built-in agents if needed (scout, planner, reviewer, worker)

## Semantic Commit Message

```
feat(subagent): add model inheritance from parent session

Subagents now inherit the parent session's current model when no
explicit model is configured in the agent definition.

Priority chain:
- Agent frontmatter model field (explicit override)
- Parent session model (ctx.model.id)
- System default model

This allows creating adaptive agents that match the parent's model
choice while preserving the ability to specify cost-optimized or
specialized models per agent.

BREAKING CHANGE: Agents without an explicit model field will now
inherit the parent session's model instead of always using the
system default. To preserve old behavior, explicitly set the model
field in agent frontmatter.
```

## Future Enhancements

Consider adding frontmatter options:
- `inherit-model: true/false` - Explicit control over inheritance
- `model-preference: parent|default|haiku|sonnet|opus` - More flexible configuration
- `max-cost-per-turn: 0.01` - Budget constraints
