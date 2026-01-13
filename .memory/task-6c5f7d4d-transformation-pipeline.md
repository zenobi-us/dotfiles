# Task: Design Data Transformation Pipeline

**Phase:** [Architecture Design](phase-d0309796-architecture-design.md)
**Epic:** [Multi-Harness Agent Loader](epic-4dd87a16-multi-harness-agent-loader.md)
**Status:** ⏳ Ready to Start
**Priority:** High
**Estimated Duration:** 1 day

## Objective

Design the core data transformation pipeline that converts external harness configurations into Pi-mono compatible format. This is the critical connector between adapters and Pi's systems.

## Deliverable

**Document:** `pipelines/transformation.md` in design phase output
- Data flow through transformation stages
- Schema definitions for intermediate formats
- Field mapping rules for each harness
- Conflict resolution strategies
- Error propagation and recovery
- Performance considerations

## Acceptance Criteria

- [ ] Transformation pipeline stages are clearly defined
- [ ] Each stage has input/output specifications
- [ ] Field mappings are documented for Claude Code and OpenCode
- [ ] Conflict resolution strategy is defined
- [ ] Error handling maintains data integrity
- [ ] Pipeline is testable with mock data
- [ ] Performance implications are considered
- [ ] Future harnesses can be integrated without pipeline changes

## Transformation Pipeline Stages

### Stage 1: Parsing
Input: Raw files (JSON, YAML, Markdown)
Output: Typed configuration objects

**Tasks:**
- File format detection
- Content parsing with error context
- Schema validation with TypeBox
- Return normalized objects

### Stage 2: Normalization
Input: Harness-specific config objects
Output: Intermediate format (CommonConfig)

**Tasks:**
- Map harness-specific fields to common schema
- Handle missing optional fields with defaults
- Validate required fields are present
- Preserve metadata about source

**CommonConfig Schema:**
```typescript
interface CommonConfig {
  source: 'claude-code' | 'opencode' | 'aider' | 'continue';
  sourceId: string;  // filename, path, or unique identifier
  
  settings?: {
    model?: string;
    defaultThinkingLevel?: string;
    maxTokens?: number;
  };
  
  commands: CommandDefinition[];
  agents: AgentDefinition[];
  context?: string;  // Instructions/AGENTS.md equivalent
}

interface CommandDefinition {
  name: string;
  description: string;
  template: string;
  arguments?: string[];  // $1, $2, etc.
  agent?: string;  // Which agent should run this
  model?: string;
  permissions?: ToolPermissions;
}

interface AgentDefinition {
  name: string;
  description: string;
  mode: 'primary' | 'subagent';
  prompt?: string;
  model?: string;
  permissions?: ToolPermissions;
}

interface ToolPermissions {
  read?: boolean;
  write?: boolean;
  edit?: boolean;
  bash?: boolean;
}
```

### Stage 3: Conflict Resolution
Input: CommonConfig from all discovered harnesses
Output: Merged, conflict-free configuration

**Conflicts to Handle:**
1. Duplicate command names across harnesses
2. Duplicate agent names across harnesses
3. Conflicting model selections
4. Overlapping file paths

**Resolution Strategy:**
```
Priority: Project-specific > Newer import > Alphabetical fallback

For each conflict:
1. Check if one is project-scoped (higher priority)
2. Check import timestamps (newer wins)
3. Alphabetically by source harness name (tie-breaker)
4. Log resolution decision
```

### Stage 4: Pi Integration Transformation
Input: Merged CommonConfig
Output: Pi-mono compatible format

**Outputs:**
1. Custom command templates → `.pi/prompts/imported/`
2. Agent definitions → Skills or commands
3. Settings → Merge into Pi's model config
4. Context → Store for reference (defer to Phase 3)

**Transformation:**
```typescript
interface PiIntegrationConfig {
  prompts: PiPrompt[];
  skills: PiSkill[];
  settings: PartialPiSettings;
  metadata: ImportMetadata;
}

interface PiPrompt {
  path: string;  // .pi/prompts/imported/source/name.md
  content: string;
  frontmatter: Record<string, any>;
}

interface ImportMetadata {
  sourceHarnesses: string[];
  importDate: string;
  conflicts: ConflictResolution[];
  skippedFeatures: string[];
}
```

## Field Mapping Tables

### Claude Code → CommonConfig

| Claude Code | CommonConfig | Notes |
|------------|--------------|-------|
| `settings.json:model` | `settings.model` | Direct |
| `settings.json:maxTokens` | `settings.maxTokens` | Direct |
| `.claude/commands/*.md` | `commands[]` | Name from filename |
| `CLAUDE.md` | `context` | Store for reference |
| `settings.json:permissions` | Defer to Phase 3 | Complex translation |

### OpenCode → CommonConfig

| OpenCode | CommonConfig | Notes |
|----------|--------------|-------|
| `opencode.json:model` | `settings.model` | Direct |
| `.opencode/agent/*.md` | `agents[]` | Parse frontmatter |
| `.opencode/command/*.md` | `commands[]` | Parse frontmatter |
| `tools` config | `permissions` | Map boolean flags |
| Subagent mode | `mode: 'subagent'` | Direct |

## Error Handling Strategy

### Categorization

**Fatal Errors** (stop processing that source):
- Malformed JSON/YAML
- Missing required fields
- File system access errors

**Warning Errors** (log and continue):
- Missing optional fields
- Unsupported features (shell execution, hooks)
- Version mismatches

**Conflicts** (log decision):
- Duplicate names
- Conflicting settings
- Permission schema mismatches

### Error Context

Every error includes:
1. Source harness and file
2. Field/section that failed
3. Validation error details
4. Recovery action taken
5. Severity level

### Recovery Strategies

```
Malformed file
  → Log error
  → Skip file
  → Continue with other files

Missing optional field
  → Use default value
  → Log warning

Duplicate command name
  → Apply resolution strategy
  → Log decision and reason
  → Use winning version

Unsupported feature
  → Create skip marker
  → Store in metadata
  → Log as informational
```

## Data Flow Diagram

```
External Harness Configs
        ↓
    [Stage 1: Parsing]
   (JSON/YAML/Markdown → TypeScript)
        ↓
  Typed Config Objects
        ↓
  [Stage 2: Normalization]
  (Harness → CommonConfig)
        ↓
   CommonConfig × N
        ↓
[Stage 3: Conflict Resolution]
  (Merge & deduplicate)
        ↓
   Single CommonConfig
        ↓
[Stage 4: Pi Integration]
  (CommonConfig → Pi format)
        ↓
  Prompts + Skills + Settings
        ↓
    Pi-mono Format
```

## Performance Considerations

1. **Lazy Loading**: Only parse requested harnesses
2. **Caching**: Cache parsed configs to avoid re-parsing
3. **Streaming**: For large files, use streaming parsers
4. **Validation**: Validate early, fail fast on critical errors
5. **Conflict Resolution**: O(n²) worst case - acceptable for < 1000 commands

## Schema Validation

Use TypeBox to define and validate:
```typescript
// Validation happens at each stage
const CommonConfigSchema = Type.Object({
  source: Type.Union([
    Type.Literal('claude-code'),
    Type.Literal('opencode'),
    // ...
  ]),
  sourceId: Type.String(),
  settings: Type.Optional(/* ... */),
  commands: Type.Array(CommandDefinitionSchema),
  agents: Type.Array(AgentDefinitionSchema),
});

// Validate input
const validator = getValidator(CommonConfigSchema);
const result = validator.check(config);
```

## Reference Materials

- [Claude Code Adapter Design](task-8a3d5b2b-claude-code-adapter.md)
- [OpenCode Adapter Design](task-9b4e6c3c-opencode-adapter.md)
- [Pi Extensions Guide](learning-76e583ca-pi-extensions-guide.md)

## Implementation Notes

- Pipeline is harness-agnostic (works with any adapter)
- Intermediate CommonConfig format is key to extensibility
- Error handling should be comprehensive for user debugging
- Consider creating CLI tool to test transformation pipeline
- Pipeline can be tested independently of Pi extension system

## Success Metrics

✅ Pipeline clearly separates concerns into stages
✅ CommonConfig schema captures all harness features
✅ Field mappings cover Claude Code and OpenCode fully
✅ Conflict resolution is deterministic and documented
✅ Error handling maintains data integrity
✅ Pipeline is independently testable
