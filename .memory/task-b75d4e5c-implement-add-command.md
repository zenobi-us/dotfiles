# Task: Implement `/subagent add` Command

## Status
⏳ PENDING

## Objective
Implement the `/subagent add` command to interactively create new agent definitions with template support.

## Prerequisites
- Command specifications complete
- List command implementation complete (for validation)

## Steps
1. [ ] Add `add` handler function to command router
2. [ ] Parse command arguments (name, --scope, --template flags)
3. [ ] Validate agent name format
4. [ ] Check if agent already exists in target scope
5. [ ] Create template content based on template type
6. [ ] Ensure target directory exists
7. [ ] Write agent file to disk
8. [ ] Display success message with next steps
9. [ ] Handle errors gracefully

## Implementation Details

### Function Signature
```typescript
function handleAdd(args: string, ctx: any): void
```

### Argument Parsing
Parse:
- `<name>` - Required positional argument
- `--scope user|project` (default: user)
- `--template basic|scout|worker` (default: basic)

### Validation
```typescript
function validateAgentName(name: string): { valid: boolean; error?: string } {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return { 
      valid: false, 
      error: "Agent name must contain only letters, numbers, hyphens, and underscores" 
    };
  }
  return { valid: true };
}
```

### Template Generation
Create three template generators:
- `generateBasicTemplate(name: string): string`
- `generateScoutTemplate(name: string): string`
- `generateWorkerTemplate(name: string): string`

Each returns markdown with YAML frontmatter + system prompt.

### File Writing
```typescript
function getAgentPath(name: string, scope: "user" | "project", cwd: string): string {
  if (scope === "user") {
    return path.join(os.homedir(), ".pi", "agent", "agents", `${name}.md`);
  } else {
    const projectDir = findNearestProjectAgentsDir(cwd) || path.join(cwd, ".pi", "agents");
    return path.join(projectDir, `${name}.md`);
  }
}

// Ensure directory exists before writing
fs.mkdirSync(path.dirname(filePath), { recursive: true });
fs.writeFileSync(filePath, content, "utf-8");
```

## Expected Outcome
Users can create new agent definitions quickly with helpful templates, reducing boilerplate.

## Verification
- [ ] `/subagent add test-agent` creates basic agent in user scope
- [ ] `/subagent add scout-agent --template scout` creates scout-style agent
- [ ] `/subagent add project-agent --scope project` creates in .pi/agents/
- [ ] Invalid names show clear error messages
- [ ] Attempting to create existing agent shows error with edit suggestion
- [ ] Success message shows file path and next steps

## Files to Modify
- `devtools/files/pi/agent/extensions/subagent/index.ts`
  - Add handleAdd function
  - Add template generators
  - Add validateAgentName helper
  - Add getAgentPath helper
  - Add to command router

## Error Handling
- Invalid name format
- Agent already exists
- Permission denied (directory creation or file write)
- Invalid scope value
- Invalid template value

## References
- Specification: `.memory/research-30fe5140-command-specifications.md` (add section)
- Agent format: `devtools/files/pi/agent/extensions/subagent/agents/*.md`
