# Task: Design OpenCode Adapter

**Phase:** [Architecture Design](phase-d0309796-architecture-design.md)
**Epic:** [Multi-Harness Agent Loader](epic-4dd87a16-multi-harness-agent-loader.md)
**Status:** ⏳ Ready to Start
**Priority:** High
**Estimated Duration:** 1.5 days

## Objective

Design the detailed adapter for importing OpenCode configurations, agents, and commands into Pi-mono. This is the second priority adapter due to good compatibility and modern architecture.

## Deliverable

**Document:** `adapters/opencode.md` in design phase output
- OpenCode configuration format specification
- Adapter interface and methods
- File discovery algorithm
- Agent transformation rules
- Command import rules
- Tool permission mapping
- Error handling and edge cases

## Acceptance Criteria

- [ ] OpenCode config file types are documented (JSON, agents, commands)
- [ ] Adapter interface clearly specifies methods and signatures
- [ ] File discovery algorithm handles hierarchy (global → project)
- [ ] Agent types (primary/subagent) are handled appropriately
- [ ] Command transformation handles arguments ($1, $ARGUMENTS, shell output)
- [ ] Tool permissions are mapped to Pi model
- [ ] Error cases are documented with recovery strategies
- [ ] Examples show before/after transformation

## OpenCode Configuration Sources

### Files to Handle

1. **`opencode.json`** (project root or `~/.config/opencode/`)
   - Default model and theme
   - Agent definitions (via config or references)
   - Command definitions (via config or references)
   - Global settings

2. **`~/.config/opencode/agent/*.md`** (global)
   - Global subagent definitions
   - Frontmatter metadata

3. **`.opencode/agent/*.md`** (project)
   - Project-specific agents
   - Override global agents

4. **`~/.config/opencode/command/*.md`** (global)
   - Global command definitions

5. **`.opencode/command/*.md`** (project)
   - Project-specific commands
   - Override global commands

### Configuration Hierarchy

```
Global Config (~/.config/opencode/config.json)
    ↓
Project Config (opencode.json)

Global Agents (~/.config/opencode/agent/*.md)
    ↓
Project Agents (.opencode/agent/*.md)

Global Commands (~/.config/opencode/command/*.md)
    ↓
Project Commands (.opencode/command/*.md)
```

## Transformation Rules

### Agents → Pi Skills or Commands

| OpenCode | Pi-mono | Notes |
|----------|---------|-------|
| Primary Agent | Store as extension config | May create custom commands |
| Subagent | Create as skill | Self-contained agent |
| `description` field | Skill description | Required |
| `mode` field | Agent type indicator | "primary" vs "subagent" |
| `model` field | Model selection | Store in config |
| `tools` object | Permission mapping | Map to Pi's tool model |
| `prompt` field | Skill content | Use as template |

### Commands → Pi Prompts

| OpenCode | Pi-mono | Notes |
|----------|---------|-------|
| `.opencode/command/*.md` | `.pi/prompts/imported/opencode/*.md` | Preserve markdown |
| Filename | Command name | Remove `.md` |
| Frontmatter | Extract as metadata | description, agent, model |
| `$ARGUMENTS` | Convert to `$@` | Handle argument syntax |
| `$1`, `$2` | Keep as-is | Already compatible |
| `` !`command` `` | Note as deferred | Shell execution feature |

### Frontmatter Mapping

```yaml
# OpenCode Command
---
description: Run tests with coverage
agent: build
model: anthropic/claude-3-5-sonnet-20241022
---

# Transform to Pi prompt with metadata stored separately
---
description: Run tests with coverage
source: opencode
sourceAgent: build
sourceModel: anthropic/claude-3-5-sonnet-20241022
---
```

## Discovery Algorithm

```
1. Check if ~/.config/opencode/ exists
   - If yes, look for config.json
   - Scan for agent/*.md and command/*.md files
2. Check if opencode.json exists in project root
   - Parse config
3. Check if .opencode/ exists in project
   - Scan for agent/*.md and command/*.md files
4. Apply hierarchy:
   - Global config as baseline
   - Project config overrides
   - Project agents override global agents
   - Project commands override global commands
5. Return:
   - Discovered configuration
   - List of agent definitions
   - List of command definitions
```

## Interface Specification

```typescript
interface OpenCodeAdapter {
  name: 'opencode';
  discoveryPaths(): string[];
  discoverConfigs(): Promise<OpenCodeConfig[]>;
  parseConfig(path: string): Promise<OpenCodeJsonConfig>;
  parseAgent(path: string): Promise<AgentDefinition>;
  parseCommand(path: string): Promise<CommandTemplate>;
  transformAgent(agent: AgentDefinition): SkillTemplate | ExtensionConfig;
  transformCommand(cmd: CommandTemplate): PromptTemplate;
  getToolPermissions(tools: Record<string, boolean>): PiToolConfig;
}
```

## Tool Permission Mapping

OpenCode uses simple boolean tool permissions:

```json
{
  "tools": {
    "write": true,
    "edit": true,
    "bash": true
  }
}
```

Pi-mono uses:
- CLI flags: `--tools read,bash,edit,write`
- Or selective access control

**Mapping Strategy:**
- If `tools.write === true`, include `write` in Pi's enabled tools
- If `tools.bash === true`, include `bash` in Pi's enabled tools
- Document which tools map to which OpenCode permissions

## Agent Mode Handling

| OpenCode Mode | Pi-mono Equivalent | Handling |
|--------------|-------------------|----------|
| `primary` | Main agent | Store as extension configuration |
| `subagent` | Specialized agent | Import as skill or command |

Primary agents define the default behavior. For MVP, focus on importing subagents as reusable skills.

## Edge Cases & Error Handling

1. **Missing Model**: Use fallback default model
2. **Invalid Frontmatter YAML**: Validation error with context
3. **Tool Config Missing**: Assume all tools enabled
4. **Duplicate Agent/Command Names**: Project wins over global
5. **Shell Output Placeholders**: Log as deferred feature
6. **File References in Prompts**: Validate paths exist

## Reference Materials

- [Research - OpenCode Details](research-8c4d2b1f-ai-harness-formats.md#5-opencode)
- [Pi Extensions Guide](learning-76e583ca-pi-extensions-guide.md)
- OpenCode Configuration: https://opencode.ai/docs/config/

## Implementation Notes

- OpenCode is more structured than Claude Code (good for parsing)
- Subagents are more directly compatible with Pi skills
- Primary agents may require more custom handling
- Tool permission mapping is simpler than Claude Code's glob patterns
- Shell output injection (`` !`cmd` ``) is advanced feature - defer to Phase 3

## Success Metrics

✅ Design covers all OpenCode config file types
✅ Agent/command transformation rules are clear
✅ Tool permission mapping is documented
✅ Discovery algorithm handles hierarchy correctly
✅ Implementer can code adapter from this design without questions
