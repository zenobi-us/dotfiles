# Phase: Theme Palette Extension

**Epic:** [Pi Extensions Development](epic-f4a8b2c6-pi-extensions-development.md)  
**Status:** Not Started  
**Planned Start:** 2026-01-11

## Overview

Create a sidebar extension that displays Pi theme colours in an organized, visual format to help extension developers understand available theme colours and how they render in the TUI.

## Goals

1. Display all theme colours in a compact, scannable grid format
2. Provide detailed colour information (hex/RGB values, usage context)
3. Enable toggling sidebar visibility with commands/shortcuts
4. Create comprehensive reference for extension developers

## Start Criteria

- ✅ Epic created and project properly structured
- ✅ Initial specification documented (task-e5466d3f)
- ⏳ Pi theme API access method researched
- ⏳ Understanding of Pi TUI widget system

## Tasks

### Research Phase
- [ ] [Research Pi theme API access](task-XXXXXXXX-research-theme-api.md) - TODO: Create task
  - Determine correct method to access theme colours
  - Verify Theme type structure  
  - Document findings

### Implementation Phase
- [ ] Implement MVP (Minimum Viable Product)
  - Create extension structure and entry point
  - Implement basic widget rendering
  - Register command for toggling sidebar
  - Test with default themes
  
- [ ] Enhance Display
  - Add colour palette grid at top
  - Implement colour categorization (UI, semantic, syntax)
  - Add verbose mode for detailed information
  - Improve visual layout and hierarchy

- [ ] Add Interactivity
  - Implement keyboard shortcut
  - Add category filtering
  - Add clipboard support (if API allows)

### Documentation Phase
- [ ] Write extension README
- [ ] Add usage examples
- [ ] Document colour categories
- [ ] Create developer guide

## Specification Reference

The detailed specification for this extension is documented in:
[task-e5466d3f-theme-palette-extension-spec.md](task-e5466d3f-theme-palette-extension-spec.md)

This task file contains:
- Functional and non-functional requirements
- Technical design with code examples
- File structure and dependencies
- Phased implementation plan
- Success criteria

## End Criteria

- [ ] Extension renders theme palette in sidebar widget
- [ ] All theme colours displayed with visual samples
- [ ] Colours organized by category
- [ ] Command/shortcut to toggle visibility works
- [ ] Documentation complete
- [ ] Extension tested with multiple themes
- [ ] Code committed with conventional commit message
- [ ] Learnings distilled to knowledge base

## Dependencies

### Blocked By
- Research into Pi theme API (how to access theme colours)
- Understanding of Pi TUI widget rendering system

### Blocks
- None (final phase in epic)

## Notes

This phase represents the second major deliverable in the Pi Extensions Development epic. While Phase 1 (Subagent Management Commands) focused on command-line interaction, this phase focuses on visual TUI widgets and theme integration.

Key learning opportunity: Understanding Pi's theme system and widget rendering will be valuable for future extension development.

## Back to Epic

Return to [Pi Extensions Development Epic](epic-f4a8b2c6-pi-extensions-development.md) for overall project status.
