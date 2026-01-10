# Task: Implement `/subagent edit` Command

## Status
⏳ PENDING

## Objective
Implement the `/subagent edit` command to open existing agent definitions for editing with validation.

## Prerequisites
- Command specifications complete
- List and add commands implementation complete

## Steps
1. [ ] Add `edit` handler function to command router
2. [ ] Parse command arguments (name, --scope flag)
3. [ ] Discover agents using specified scope
4. [ ] Find agent by name
5. [ ] Determine file path
6. [ ] Check for available editor ($EDITOR, $VISUAL, or defaults)
7. [ ] Open file in editor (or display path if no editor)
8. [ ] Validate file after editing (optional)
9. [ ] Confirm changes
10. [ ] Handle errors gracefully

## Implementation Details

### Function Signature
```typescript
function handleEdit(args: string, ctx: any): void
```

### Argument Parsing
Parse:
- `<name>` - Required positional argument
- `--scope user|project|both` (default: both)

### Agent Discovery
```typescript
const { agents } = discoverAgents(ctx.cwd, scope);
const agent = agents.find(a => a.name === name);

if (!agent) {
  // Show error with available agents list
  return;
}

const filePath = agent.filePath;
```

### Editor Detection and Opening
```typescript
function openInEditor(filePath: string, ctx: any): void {
  const editor = process.env.EDITOR || process.env.VISUAL || "vim";
  
  if (!ctx.hasUI) {
    // Non-interactive mode
    ctx.ui.notify(`Edit agent at: ${filePath}`, "info");
    return;
  }
  
  try {
    const proc = spawn(editor, [filePath], { stdio: "inherit" });
    proc.on("close", (code) => {
      if (code === 0) {
        ctx.ui.notify(`✓ Agent updated: ${name}\n\nChanges will take effect on next invocation.`, "success");
      } else {
        ctx.ui.notify(`Editor exited with code ${code}`, "warning");
      }
    });
  } catch (error) {
    ctx.ui.notify(`Cannot open editor: ${error.message}\nEdit manually: ${filePath}`, "error");
  }
}
```

### Validation (Optional)
After editing, optionally validate:
```typescript
function validateAgentFile(filePath: string): { valid: boolean; error?: string } {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const { frontmatter, body } = parseFrontmatter(content);
    
    if (!frontmatter.name) {
      return { valid: false, error: "Missing required field: name" };
    }
    if (!frontmatter.description) {
      return { valid: false, error: "Missing required field: description" };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
```

## Expected Outcome
Users can easily edit existing agents with their preferred editor, with helpful error messages if agent not found.

## Verification
- [ ] `/subagent edit scout` opens scout.md in editor
- [ ] `/subagent edit unknown-agent` shows error with available agents
- [ ] `/subagent edit scout --scope user` finds user-level scout only
- [ ] Success message shows after editor closes
- [ ] Non-interactive mode displays file path instead of opening editor
- [ ] Missing editor falls back gracefully

## Files to Modify
- `devtools/files/pi/agent/extensions/subagent/index.ts`
  - Add handleEdit function
  - Add openInEditor helper
  - Add validateAgentFile helper (optional)
  - Add to command router

## Error Handling
- Agent not found (list available agents)
- Multiple matches (shouldn't happen with proper scope logic)
- Editor not available (show file path)
- Permission denied
- Invalid YAML after editing (optional validation)

## References
- Specification: `.memory/research-30fe5140-command-specifications.md` (edit section)
- Agent discovery: `devtools/files/pi/agent/extensions/subagent/agents.ts`
- Frontmatter parsing: `devtools/files/pi/agent/extensions/subagent/agents.ts` (parseFrontmatter function)
