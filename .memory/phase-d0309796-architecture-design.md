---
id: d0309796
type: phase
title: architecture-design
created_at: "2026-04-04T10:55:19.510Z"
updated_at: "2026-04-04T10:55:19.510Z"
status: todo
epic_id: 
start_criteria: 
end_criteria: 
---
# Phase: Architecture Design

**Epic:** [Multi-Harness Agent Loader Extension](epic-4dd87a16-multi-harness-agent-loader.md)
**Status:** 🔄 IN PROGRESS
**Start:** 2026-01-13
**Target Completion:** 2026-01-15
**Duration:** 2-3 days

## Goals

Design the technical architecture for the Pi-mono extension that loads agents and commands from other AI harnesses. Create detailed specifications for adapter interfaces, data transformation pipelines, and import mechanisms.

## Deliverables

1. ⏳ **Extension Architecture Document** - Overall design and component interactions
2. ⏳ **Claude Code Adapter Design** - Detailed specification for importing Claude Code configs
3. ⏳ **OpenCode Adapter Design** - Detailed specification for importing OpenCode configs
4. ⏳ **Data Transformation Pipeline** - How external formats map to Pi-mono format
5. ⏳ **Import/Discovery Mechanism** - How Pi discovers and loads external configurations

## Phase Overview

### Architecture Scope

The harness-bridge extension will:
- Discover external configurations from other AI harnesses
- Parse their configuration files (Claude Code, OpenCode, Aider, Continue)
- Transform external formats into Pi-mono compatible format
- Make external prompts/commands available as Pi skills/commands
- Maintain read-only mode initially (no write-back to external configs)

### Design Principles

1. **Adapter Pattern**: Each harness has its own adapter class
2. **Minimal Transformation**: Preserve original structure as much as possible
3. **Graceful Degradation**: Skip unsupported features with warnings
4. **Discovery First**: Auto-find configurations before explicit user setup
5. **No Modification**: Read-only import (no write-back to external files)

## Tasks

| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| [Extension Architecture Document](task-7f2e4c1a-architecture-document.md) | ⏳ | TBD | Main design document |
| [Claude Code Adapter Design](task-8a3d5b2b-claude-code-adapter.md) | ⏳ | TBD | High priority |
| [OpenCode Adapter Design](task-9b4e6c3c-opencode-adapter.md) | ⏳ | TBD | High priority |
| [Data Transformation Design](task-6c5f7d4d-transformation-pipeline.md) | ⏳ | TBD | Core logic |

## Success Criteria

- ✅ Clear architecture document with component diagram
- ✅ Adapter interface specifications for both Claude Code and OpenCode
- ✅ Data transformation rules documented (file locations, format mappings)
- ✅ Import/discovery mechanism defined
- ✅ Tech stack decisions documented (TypeScript, schema validation, etc.)
- ✅ Error handling and edge cases documented
- ✅ Ready for implementation in Phase 3

## Key Design Decisions Needed

1. **Extension Location**: `.pi/extensions/harness-bridge/` with subdirectories for adapters
2. **Configuration Discovery**: Walk standard paths looking for known config files
3. **Format Mapping**: How to handle missing/incompatible fields
4. **Skill vs Command**: Determine whether to import as skills or custom commands
5. **Conflict Resolution**: Handle overlapping command names across harnesses

## Technical Approach

### Phase 2 Deliverables Structure

```
docs/
├── architecture.md           # Overall system design
├── adapters/
│   ├── claude-code.md       # Claude Code adapter spec
│   └── opencode.md          # OpenCode adapter spec
├── pipelines/
│   └── transformation.md    # Data transformation rules
└── discovery.md             # Config discovery mechanisms
```

### Technology Stack

- **Language**: TypeScript
- **Validation**: TypeBox for schema validation
- **File Parsing**: Native Node.js APIs
- **Configuration**: JSON/YAML parsers
- **Error Handling**: Typed error classes with context

## Dependencies

- Research Phase 1 complete: [Research - AI Harness Formats](research-8c4d2b1f-ai-harness-formats.md)
- Pi-mono extension patterns documented: Extension guide, command patterns
- TypeBox familiarity from existing extensions

## Next Phase

**Phase 3: Implementation** - Build the adapters and integrate into Pi extension system

## Notes

- High priority on Claude Code adapter (most compatible, most users)
- OpenCode adapter as second priority (good compatibility, modern approach)
- Design should be extensible for future adapters (Aider, Continue)
- Initial implementation will be read-only (no write-back to external configs)
