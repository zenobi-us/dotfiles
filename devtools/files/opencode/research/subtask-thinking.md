# Research Process: Investigating `subtask:true` Behavior

## Investigation Summary

**Topic**: Why `subtask:true` frontmatter setting in OpenCode commands may not work as expected

**Date**: 2025-12-10  
**Methodology**: Systematic code search + documentation analysis  
**Confidence Level**: Medium (documentation exists, but implementation details are sparse)

---

## Research Approach

### Phase 1: Surface Level Discovery

1. **Initial search strategy**: Used ripgrep to locate all instances of "subtask" in codebase
2. **Found locations**:
   - `/command/devtool.md` - Line 6
   - `/command/confluence.md` - Line 4
   - `/command/miniproject.md` - Line 4
   - `/command/jira.md` - Line 4
   - One unrelated mention in agent-organizer skill (about task decomposition)

3. **Observation**: The setting appears ONLY in exactly 4 command files, all with identical pattern

### Phase 2: Pattern Analysis

Examined each instance to understand structure:

- All four commands have both `agent: <name>` and `subtask: true`
- Each references a specific agent defined in `/agent/` directory
- Commands delegate to specialized subagents (jira, confluence, chrome-debug, miniproject)

### Phase 3: Context Investigation

Searched for:

- `frontmatter` references (to understand command metadata processing)
- `agent:` field usage
- `mode: subagent` patterns (to understand subagent structure)
- Task tool documentation (to understand delegation mechanism)

### Phase 4: Architecture Understanding

Key finding: Commands with `subtask: true` are NOT directly executable. They require:

- A human actor to read the command
- Manual invocation via `task` tool (with `subagent_type` parameter)
- OR the presence of a parent agent that interprets `subtask: true` to delegate

### Phase 5: Gap Analysis

**What I found**:

- Clear documentation that some commands use `task` tool delegation
- Clear distinction between `agent: <name>` (specialist) and `subagent_type: "general"` (generic)
- Agent definitions exist in `/agent/` with proper `mode: primary` or `mode: subagent`

**What I did NOT find**:

- NO explicit documentation on what `subtask: true` means
- NO code references to `subtask` field processing in .ts or .js files
- NO error handling or validation for `subtask: true`
- NO discussion of why this field might not work
- NO implementation logic showing how a parent agent would use this field

### Phase 6: Hypothesis Development

Given the evidence, I formulated three hypotheses:

**Hypothesis A (MOST LIKELY)**: `subtask: true` is a **documentation/intention marker** that tells human readers "this command must be delegated to a subagent using the task tool" rather than an automated processor.

**Hypothesis B (POSSIBLE)**: `subtask: true` should trigger automatic delegation in a CLI processor or main agent, but the feature is **unimplemented** and silently ignored.

**Hypothesis C (LESS LIKELY)**: The field is properly implemented in a plugin or external tool not present in this codebase.

### Phase 7: Evidence Correlation

Aligned findings with AGENTS.md protocol:

- Line 49: "If you are a primary agent, offload context-heavy work to subagents via `task` tool. Check tool definition for `subagent_type` options."
- This supports manual invocation via task tool, NOT automatic processing

## Remaining Uncertainties

1. **CLI Handler**: Is there a command handler that interprets `subtask: true`? (Could not find in codebase)
2. **Plugin Support**: Could `subtask: true` be handled by `opencode-sessions@latest` plugin? (Not documented)
3. **Intended Behavior**: Is `subtask: true` supposed to auto-delegate, or just a documentation hint? (No spec found)
4. **Why It Fails**: What is the expected failure mode? Error message? Silent ignore? (No test cases found)

## Documentation Quality Issues

1. **No formal spec** for `subtask: true` field
2. **Inconsistent usage**: Only 4 files use it; many other delegating commands don't use it
3. **No explanation** in command files about what it means
4. **No validation errors** if field is malformed
5. **No examples** of proper vs improper usage

## Key Files Examined

- `/command/devtool.md` - devtool command with subtask:true
- `/command/jira.md` - jira command with subtask:true  
- `/command/confluence.md` - confluence command with subtask:true
- `/command/miniproject.md` - miniproject command with subtask:true
- `/agent/generalist-subagent.md` - agent definition structure
- `/agent/jira.md` - primary agent definition
- `/agent/confluence.md` - primary agent definition
- `/command/project/status.md` - example of manual task tool delegation (NO subtask field)
- `/AGENTS.md` - protocol documentation for agent behavior
- `config.json` - plugin configuration
- `dcp.jsonc` - context pruning config (mentions task tool protection)

## Conclusion of Analysis Phase

The investigation revealed that:

1. `subtask: true` exists but has no visible implementation
2. Commands that should delegate use different mechanisms (task tool with subagent_type)
3. The field appears to be **orphaned** - defined but not processed
4. Possible causes: unimplemented feature, moved to plugin, or misunderstood documentation pattern

## Next Research Phase (NOT CONDUCTED)

- [ ] Examine plugin source code (`opencode-sessions@latest`)
- [ ] Check git history for when `subtask: true` was added/removed
- [ ] Review GitHub issues or discussions
- [ ] Test actual command execution to observe behavior
- [ ] Interview maintainers about intended design
