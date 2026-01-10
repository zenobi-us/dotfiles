# Tasks

## Current Phase: Subagent Command Implementation

### Ready for Implementation

1. [Implement list command](.memory/task-8c7d3d20-implement-list-command.md)
   - Add handleList function to command router
   - Parse --scope and --verbose flags
   - Display agents grouped by source
   - **Priority:** High - Foundation for other commands

2. [Implement add command](.memory/task-b75d4e5c-implement-add-command.md)
   - Add handleAdd function to command router  
   - Validate agent names
   - Generate templates (basic, scout, worker)
   - Write agent files to disk
   - **Priority:** High - Core functionality
   - **Depends on:** List command (for validation)

3. [Implement edit command](.memory/task-ccc03ceb-implement-edit-command.md)
   - Add handleEdit function to command router
   - Discover and open agent files
   - Handle editor integration
   - Validate changes (optional)
   - **Priority:** High - Core functionality
   - **Depends on:** List and add commands

4. [Add tests and documentation](.memory/task-82937436-tests-and-docs.md)
   - Update README.md with management commands
   - Add code comments and JSDoc
   - Manual testing checklist
   - **Priority:** Medium - Quality assurance
   - **Depends on:** All three commands implemented

### Completed

- ✅ [Design command specifications](.memory/task-39282875-design-command-specs.md)

## [NEEDS-HUMAN] Items

_(none currently)_
