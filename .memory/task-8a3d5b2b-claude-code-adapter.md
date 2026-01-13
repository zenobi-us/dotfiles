# Task: Design Claude Code Adapter

**Phase:** [Architecture Design](phase-d0309796-architecture-design.md)
**Epic:** [Multi-Harness Agent Loader](epic-4dd87a16-multi-harness-agent-loader.md)
**Status:** ⏳ Ready to Start
**Priority:** High
**Estimated Duration:** 1.5 days

## Objective

Design the detailed adapter for importing Claude Code configurations and custom commands into Pi-mono. This is the first priority adapter due to high compatibility and large user base.

## Deliverable

**Document:** `adapters/claude-code.md` in design phase output
- Claude Code configuration format specification
- Adapter interface and methods
- File discovery algorithm
- Settings transformation rules
- Command import rules
- Hook system translation (if applicable)
- Error handling and edge cases

## Acceptance Criteria

- [ ] All Claude Code configuration file types are documented
- [ ] Adapter interface clearly specifies methods and signatures
- [ ] File discovery algorithm handles hierarchy (global → project → local)
- [ ] Settings transformation rules document all field mappings
- [ ] Command import handles arguments ($1, $@, namespacing)
- [ ] Hooks system translation is planned or marked as "deferred"
- [ ] Error cases are documented with recovery strategies
- [ ] Examples show before/after transformation

## Claude Code Configuration Sources

### Files to Handle

1. **`~/.claude/settings.json`** (global)
   - Model selection
   - Max tokens
   - Permission rules
   - Hooks configuration

2. **`.claude/settings.json`** (project)
   - Project-specific overrides
   - Team standards

3. **`CLAUDE.md`** (global & project)
   - Context and instructions
   - Architecture notes
   - Coding standards

4. **`.claude/commands/*.md`** (global & project)
   - Slash commands
   - Arguments and templates
   - Subdirectory namespacing

### Configuration Hierarchy

```
Global Settings (~/.claude/settings.json)
    ↓
Project Settings (.claude/settings.json)
    ↓
Local Settings (.claude/settings.local.json)

Global Commands (~/.claude/commands/*.md)
    ↓
Project Commands (.claude/commands/*.md)
```

## Transformation Rules

### Settings → Pi Config

| Claude Code | Pi-mono | Notes |
|------------|---------|-------|
| `settings.json:model` | `settings.json:defaultModel` | Direct mapping |
| `settings.json:maxTokens` | Settings model context | Store in adapter config |
| `settings.json:permissions` | Adapter permissions config | Evaluate against Pi's model |
| `CLAUDE.md` content | Store as custom system prompt | Optional/deferred |
| Hooks | Defer to Phase 3 | Complex feature |

### Commands → Pi Prompts

| Claude Code | Pi-mono | Notes |
|------------|---------|-------|
| `.claude/commands/*.md` | `.pi/prompts/imported/claude-code/*.md` | Preserve structure |
| Filename | Command name | Remove `.md` |
| Subdirectory | Namespace prefix | `frontend/component.md` → `/imported:claude-code:frontend:component` |
| Content | Prompt template | Use as-is |
| Arguments | Support `$1`, `$@` | Already compatible |

## Discovery Algorithm

```
1. Check if ~/.claude/ exists
   - If yes, scan for settings.json and CLAUDE.md
2. Check if .claude/ exists in current project
   - If yes, scan for settings.json, settings.local.json, CLAUDE.md
3. Check for .claude/commands/ in both locations
   - Collect all *.md files
4. Apply hierarchy:
   - Global settings as baseline
   - Project settings override
   - Local settings override
5. Return:
   - Discovered settings
   - List of command files with paths
```

## Interface Specification

```typescript
interface ClaudeCodeAdapter {
  name: 'claude-code';
  discoveryPaths(): string[];
  discoverConfigs(): Promise<ClaudeCodeConfig[]>;
  parseSettings(path: string): Promise<ClaudeSettings>;
  parseCommand(path: string): Promise<CommandTemplate>;
  transformSettings(settings: ClaudeSettings): PartialPiSettings;
  transformCommand(cmd: CommandTemplate): PromptTemplate;
}
```

## Edge Cases & Error Handling

1. **Missing Files**: Return empty config, log discovery attempt
2. **Malformed JSON**: Validation error with line numbers
3. **Duplicate Commands**: Project command wins over global
4. **Circular References**: Not applicable to flat file structure
5. **Permission Schema Changes**: Document version handling
6. **Settings.local.json not in git**: Expected and safe

## Reference Materials

- [Research - Claude Code Details](research-8c4d2b1f-ai-harness-formats.md#1-claude-code-anthropic)
- [Pi Extensions Guide](learning-76e583ca-pi-extensions-guide.md)

## Implementation Notes

- Focus on settings.json and commands/* first
- CLAUDE.md context injection can be deferred to Phase 3
- Hook system is complex - plan detailed design in Phase 3
- Consider permission translation: Claude Code glob patterns → Pi's model
- Test with real-world Claude Code projects

## Success Metrics

✅ Design covers all Claude Code config file types
✅ Transformation rules are clear and reversible (for future write-back)
✅ Discovery algorithm is deterministic and testable
✅ Error handling is comprehensive
✅ Implementer can code adapter from this design without questions
