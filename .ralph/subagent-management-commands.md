# Plan Subagent Management Slash Commands

Plan and design slash commands for the subagent extension to manage agents: list, add, edit.

## Goals

- Research the existing subagent extension structure and implementation patterns
- Design slash commands: `/subagent list`, `/subagent add <name>`, `/subagent edit <name>`
- Create a comprehensive implementation plan following miniproject workflow
- Document findings and tasks in `.memory/` directory

## Checklist

- [x] Read `.memory/summary.md` to understand current status (use shell, not Glob/List)
- [x] Create `.memory/` structure if missing (summary.md, todo.md, team.md)
- [x] Research existing subagent extension at `devtools/files/pi/agent/extensions/subagent/`
- [x] Document research findings in `.memory/research-*.md`
- [x] Analyze how other Pi extensions implement slash commands
- [x] Document slash command patterns in `.memory/research-*.md`
- [x] Create phase plan in `.memory/phase-*.md` for implementation
- [x] Break down into specific tasks in `.memory/task-*.md` files
- [x] Design `/subagent list` command specification
- [x] Design `/subagent add <name>` command specification
- [x] Design `/subagent edit <name>` command specification
- [x] Update `.memory/summary.md` with complete plan
- [x] Update `.memory/todo.md` with actionable tasks
- [x] Document key learnings in `.memory/learning-*.md`
- [x] Commit changes with clear conventional commit message

## Notes

Following miniproject skill workflow:
- Use shell commands (grep, ls) instead of Glob/List tools for .memory/
- All memory files follow naming: `.memory/<type>-<8char_hash>-<title>.md`
- Types: research, phase, task, learning
- Keep summary.md and todo.md up to date at every step
- Stop if anything fails and surface to human

## Progress

**Iteration 1:** Completed research and planning phase
- Examined subagent extension structure and agent discovery mechanism
- Analyzed command registration pattern from ralph-wiggum extension
- Created comprehensive research documents
- Designed detailed command specifications with syntax, options, examples
- Created phase plan with clear goals and completion criteria
- Broke down work into 5 specific, actionable tasks
- Documented key learnings about extension patterns
- Updated project summary and todo list

## Deliverables Created

### Research Documents
- `.memory/research-6e3d737d-subagent-extension-structure.md` - Extension structure analysis
- `.memory/research-30fe5140-command-specifications.md` - Detailed command specs

### Phase Planning
- `.memory/phase-531b3ede-subagent-command-implementation.md` - Implementation phase plan

### Task Breakdown
- `.memory/task-39282875-design-command-specs.md` - ✅ COMPLETED
- `.memory/task-8c7d3d20-implement-list-command.md` - ⏳ PENDING
- `.memory/task-b75d4e5c-implement-add-command.md` - ⏳ PENDING
- `.memory/task-ccc03ceb-implement-edit-command.md` - ⏳ PENDING
- `.memory/task-82937436-tests-and-docs.md` - ⏳ PENDING

### Learning Documents
- `.memory/learning-d8d1c166-extension-command-patterns.md` - Key patterns and insights

### Project Management
- Updated `.memory/summary.md` with current status
- Updated `.memory/todo.md` with actionable tasks
- Updated `.memory/team.md` with active session info

## Ready for Implementation

All planning complete. Next steps:
1. Implement `/subagent list` command
2. Implement `/subagent add` command
3. Implement `/subagent edit` command
4. Add tests and documentation
5. Test thoroughly
6. Commit implementation

The plan is comprehensive, tasks are well-defined, and all patterns are documented. Implementation can proceed following the task breakdown.
