# Learning: Subagent Management Patterns

**Epic:** [Subagent Extension Enhancement](epic-a7d3e9f1-subagent-extension-enhancement.md)  
**Date:** 2026-01-11  
**Status:** Distilled from completed epic

## Overview

Insights from implementing agent management slash commands in the Pi subagent extension, including command design patterns, argument parsing, and user experience considerations.

## Key Learnings

### 1. Command Design Patterns

**Hierarchical Command Structure:**
- Base command (`/subagent`) with subcommands (`list`, `add`, `edit`)
- Provides logical grouping of related functionality
- Allows for future extensibility without namespace pollution

**Argument Parsing:**
- Use flag-based syntax (`--scope user`, `--template scout`)
- Positional arguments for required parameters (agent name)
- Flags for optional parameters with sensible defaults
- Consistent flag naming across subcommands

**Example Pattern:**
```typescript
function parseArgs(argsStr: string): ParsedArgs {
    const tokens = argsStr.trim().split(/\s+/);
    const positional: string[] = [];
    const flags = new Map<string, string>();
    
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].startsWith("--")) {
            // Handle flag with optional value
        } else {
            positional.push(tokens[i]);
        }
    }
    
    return { positional, flags };
}
```

### 2. Agent Discovery & Scoping

**Multi-Scope Support:**
- User-level agents (`~/.pi/agent/agents/`) - globally available
- Project-level agents (`.pi/agents/`) - repository-specific
- Scope precedence: project agents can override user agents with same name

**Discovery Benefits:**
- Fresh discovery on each command allows mid-session edits
- No need to restart Pi when agents are modified
- Consistent with the main subagent tool behavior

**Implementation Pattern:**
```typescript
function discoverAgents(cwd: string, scope: AgentScope): Discovery {
    const agents: AgentConfig[] = [];
    
    if (scope === "user" || scope === "both") {
        // Scan ~/.pi/agent/agents/
    }
    
    if (scope === "project" || scope === "both") {
        // Scan .pi/agents/ relative to cwd
    }
    
    return { agents, userDir, projectDir };
}
```

### 3. Template System Design

**Three Template Tiers:**
1. **Basic** - Minimal structure, maximum flexibility
2. **Scout** - Optimized for fast reconnaissance
3. **Worker** - Full-capability general-purpose

**Template Selection Criteria:**
- Basic: When user wants full control over configuration
- Scout: For read-only, fast information gathering
- Worker: Default for most implementation tasks

**Template Benefits:**
- Reduces friction for common agent types
- Provides working examples of tool configurations
- Teaches users about agent capabilities through templates

### 4. User Experience Patterns

**Progressive Disclosure:**
- Simple usage: `/subagent list` (uses sensible defaults)
- Advanced usage: `/subagent list --scope user --verbose`
- Help text shows simple examples first, then options

**Helpful Error Messages:**
```typescript
// Bad: "Agent not found"
// Good: Shows available agents and suggests /subagent list

if (!agent) {
    const available = discovery.agents.map(a => `  • ${a.name}`).join("\n");
    const message = `Agent '${name}' not found.\n\n` +
                   `Available agents:\n${available}\n\n` +
                   `Use /subagent list for more details.`;
    ctx.ui.notify(message, "error");
}
```

**Success Feedback:**
- Confirmation of what was done
- Next steps guidance
- Location information for created/edited files

### 5. Validation Strategy

**Early Validation:**
- Validate agent names before attempting file operations
- Check for existing agents before creation
- Provide specific error messages for each validation failure

**Validation Rules:**
```typescript
// Agent name constraints
- Lowercase letters, numbers, hyphens, underscores only
- Must start with a letter
- Must end with a letter or number

// Rationale: Ensures cross-platform compatibility and URL-safe names
```

### 6. File System Operations

**Safe File Operations:**
```typescript
// 1. Check existence
if (fs.existsSync(agentPath)) {
    // Prevent accidental overwrites
}

// 2. Create directories safely
fs.mkdirSync(agentDir, { recursive: true });

// 3. Write with error handling
try {
    fs.writeFileSync(agentPath, content, "utf-8");
} catch (err) {
    ctx.ui.notify(`Error: Cannot write file\n${err}`, "error");
}
```

**Path Display:**
- Show `~` instead of full home directory path
- Use relative paths for project-level files
- Improves readability and reduces screen clutter

### 7. Documentation Practices

**Comprehensive Documentation Structure:**
1. Feature overview with use cases
2. Command syntax with all options
3. Practical examples (simple to complex)
4. Option descriptions with defaults
5. Related concepts (agent naming, templates, scopes)

**Code Documentation:**
- JSDoc comments for all public functions
- Include `@param`, `@returns`, and `@example` tags
- Document validation rules and constraints
- Explain rationale for non-obvious decisions

## Best Practices

### Command Design
1. Use hierarchical commands for related functionality
2. Flag-based syntax for better discoverability
3. Sensible defaults to reduce cognitive load
4. Consistent naming across related commands

### User Experience
1. Progressive disclosure (simple defaults, advanced options)
2. Helpful error messages with next steps
3. Confirmation and success feedback
4. Clear file path information

### Code Quality
1. Early validation with specific error messages
2. Safe file operations with proper error handling
3. Comprehensive JSDoc comments
4. Fresh discovery to support mid-session changes

### Documentation
1. Examples before detailed explanations
2. Document all flags and options
3. Explain rationale for constraints
4. Provide usage patterns for common scenarios

## Anti-Patterns to Avoid

### Command Design
❌ Single monolithic command with complex syntax  
✅ Hierarchical commands with clear subcommands

❌ Positional arguments for optional parameters  
✅ Named flags for options (`--scope user`)

### Error Handling
❌ Generic error messages ("Invalid input")  
✅ Specific errors with recovery suggestions

❌ Silent failures or unclear states  
✅ Explicit confirmation and error reporting

### Documentation
❌ Reference-only documentation without examples  
✅ Examples-first approach with detailed reference

❌ Documenting implementation details users don't need  
✅ Focus on usage patterns and practical guidance

## Applicability

These patterns apply to:
- CLI command design in Pi extensions
- Agent management systems
- File-based configuration tools
- User-facing developer tools

## Related Learnings

- [Extension Command Patterns](learning-d8d1c166-extension-command-patterns.md) - General command registration
- [Pi Extensions Guide](learning-76e583ca-pi-extensions-guide.md) - Extension architecture

## References

- Task: [Design Command Specifications](task-39282875-design-command-specs.md)
- Implementation: `devtools/files/pi/agent/extensions/subagent/index.ts`
- Documentation: `devtools/files/pi/agent/extensions/subagent/README.md`
