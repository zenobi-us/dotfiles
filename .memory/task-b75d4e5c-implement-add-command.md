# Task: Implement `/subagent add` Command

## Status
✅ COMPLETE

## Objective
Implement the `/subagent add` command to interactively create new agent definitions with template support.

## Prerequisites
- Command specifications complete
- List command implementation complete (for validation)

## Steps
1. [x] Add `add` handler function to command router
2. [x] Parse command arguments (name, --scope, --template flags)
3. [x] Validate agent name format
4. [x] Check if agent already exists in target scope
5. [x] Create template content based on template type
6. [x] Ensure target directory exists
7. [x] Write agent file to disk
8. [x] Display success message with next steps
9. [x] Handle errors gracefully

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
- [ ] `/subagent add test-agent` creates basic agent in user scope - NEEDS TESTING
- [ ] `/subagent add scout-agent --template scout` creates scout-style agent - NEEDS TESTING
- [ ] `/subagent add project-agent --scope project` creates in .pi/agents/ - NEEDS TESTING
- [ ] Invalid names show clear error messages - NEEDS TESTING
- [ ] Attempting to create existing agent shows error with edit suggestion - NEEDS TESTING
- [ ] Success message shows file path and next steps - NEEDS TESTING

## Implementation Summary

Added to `devtools/files/pi/agent/extensions/subagent/index.ts`:
- `parseAddArgs()` - Parses name, --scope, --template arguments
- `validateAgentName()` - Validates name format (alphanumeric, hyphens, underscores)
- `getAgentPath()` - Determines file path based on scope
- `generateTemplate()` - Generates content for basic, scout, or worker templates
- Add command handler with:
  - Name validation
  - Duplicate checking
  - Directory creation
  - File writing
  - Success message with next steps
  - Error handling for all failure cases

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
