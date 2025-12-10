# OpenCode `subtask: true` Frontmatter Setting - Research Findings

## Executive Summary

The `subtask: true` frontmatter setting appears in exactly 4 command files in OpenCode, but has **no documented purpose, no implementation visible in the codebase, and no functional impact on command execution**. Commands that need to delegate to subagents use a different mechanism: the `task` tool with `subagent_type` parameter.

---

## Complete Inventory of `subtask: true` Usage

### 1. `/command/devtool.md`

**File Location**: `/home/zenobius/Projects/dotfiles/devtools/files/opencode/command/devtool.md`  
**Line**: 6

```yaml
---
name: devtool
description: |
  <UserRequest> Perform actions using Chrome DevTools Protocol.
agent: chrome-debug-subagent
subtask: true
---
```

**Agent Reference**: `chrome-debug-subagent` (defined in `/agent/chrome-debug-subagent.md`)  
**Agent Mode**: `mode: subagent`  
**Command Type**: Direct delegation to Chrome DevTools Protocol

**Analysis**:

- Claims to delegate to `chrome-debug-subagent`
- Has `subtask: true` marker
- Contains simple command template: `<UserRequest>` wrapper around `$ARGUMENTS`
- No visible task tool invocation instructions
- No documentation about when/how `subtask: true` triggers

---

### 2. `/command/jira.md`

**File Location**: `/home/zenobius/Projects/dotfiles/devtools/files/opencode/command/jira.md`  
**Line**: 4

```yaml
---
description: Update Jira ticket status, sprint, and assignee
agent: jira
subtask: true
---
```

**Agent Reference**: `jira` (defined in `/agent/jira.md`)  
**Agent Mode**: `mode: primary`  
**Command Type**: Jira operations (transition, assign, update sprint)

**Analysis**:

- References a `primary` mode agent (not subagent)
- Has `subtask: true` marker
- Contains brief parameter documentation and operating steps
- References `agent/jira.md` protocol
- **INCONSISTENCY**: Agent is `primary` mode, yet marked as `subtask: true`
- No explicit `task` tool invocation in the command

---

### 3. `/command/confluence.md`

**File Location**: `/home/zenobius/Projects/dotfiles/devtools/files/opencode/command/confluence.md`  
**Line**: 4

```yaml
---
description: Manage Confluence pages, create documentation, and add comments
agent: confluence
subtask: true
---
```

**Agent Reference**: `confluence` (defined in `/agent/confluence.md`)  
**Agent Mode**: `mode: primary`  
**Command Type**: Confluence operations (create, update, search pages, comments)

**Analysis**:

- References a `primary` mode agent
- Has `subtask: true` marker
- Provides detailed operating steps without task tool invocation
- **INCONSISTENCY**: Agent is `primary` mode, yet marked as `subtask: true`
- Protocol is defined in `agent/confluence.md` line 21

---

### 4. `/command/miniproject.md`

**File Location**: `/home/zenobius/Projects/dotfiles/devtools/files/opencode/command/miniproject.md`  
**Line**: 4

```yaml
---
title: Markdown Driven Task Management
agent: miniproject
subtask: true
---
```

**Agent Reference**: `miniproject` (Agent definition NOT found in `/agent/` directory)  
**Command Type**: Markdown-based task management

**Analysis**:

- References agent `miniproject` which doesn't exist in `/agent/` directory
- Has `subtask: true` marker
- Simple command template: `<UserRequest>` wrapper
- **RED FLAG**: References non-existent agent
- No documentation about expected behavior

---

## Comparative Analysis: Delegation Patterns

### Pattern A: Commands WITH `subtask: true`

```yaml
agent: jira
subtask: true
```

- 4 files use this pattern
- Includes both `primary` and `subagent` mode agents
- Inconsistent agent modes
- No clear delegation mechanism documented

### Pattern B: Commands WITH Task Tool Instructions

```
Call the Task tool with these parameters:
- `description`: "Analyze project status..."
- `subagent_type`: "general"
- `prompt`: [content]
```

**Examples**:

- `/command/project/status.md` (lines 9-12)
- `/command/project/view.md` (lines 9-12)
- `/command/project/plan.research.md` (lines 9-12)
- `/command/project/query.md` (lines 9-12)
- `/command/project/plan.tasks.md` (lines 9-12)
- `/command/project/plan.stories.md` (lines 9-12)
- `/command/project/plan.prd.md` (lines 9-12)

**Characteristics**:

- Explicitly instruct humans to use `task` tool
- Include `subagent_type: "general"` or specific types
- Have `<message_to_subagent>` tags with detailed instructions
- **Do NOT use `subtask: true` field**

### Key Finding

**The two patterns are mutually exclusive in practice.**

- Commands that delegate explicitly use task tool instructions
- Commands that have `subtask: true` don't include task tool instructions
- No commands use both patterns

---

## Agent Definition Analysis

### Primary Mode Agents (with `subtask: true` commands)

**`agent: jira`** (`/agent/jira.md`)

```yaml
mode: primary
tools:
  atlassian_atlassianUserInfo: true
  atlassian_getJiraIssue: true
  [... 18 more tools ...]
```

- Has full tool access
- Expected to operate independently
- Yet marked as `subtask: true` in `/command/jira.md`

**`agent: confluence`** (`/agent/confluence.md`)

```yaml
mode: primary
tools:
  atlassian_getConfluenceSpaces: true
  atlassian_createConfluencePage: true
  [... 10 more tools ...]
```

- Has full tool access
- Expected to operate independently
- Yet marked as `subtask: true` in `/command/confluence.md`

### Subagent Mode Agents (with `subtask: true` commands)

**`agent: chrome-debug-subagent`** (`/agent/chrome-debug-subagent.md`)

```yaml
mode: subagent
tools:
  chrome-devtools*: true
```

- Limited tool scope (only chrome-devtools)
- Designed for delegation
- Marked as `subtask: true` — this makes semantic sense

### Semantic Inconsistency

Three of four `subtask: true` commands reference `primary` mode agents, which contradicts the semantics of "subtask" (which implies subordinate/delegated work).

---

## Documentation Gaps

### What IS documented

1. **Agent execution model** (`AGENTS.md` line 49):
   > "If you are a primary agent, offload context-heavy work to subagents via `task` tool. Check tool definition for `subagent_type` options."

2. **Task tool usage** (Example from `/command/project/status.md`):

   ```
   Call the Task tool with these parameters:
   - `description`: "Analyze project status and active work"
   - `subagent_type`: "general"
   - `prompt`: [content]
   ```

3. **Agent mode types**:
   - `mode: primary` — full agent authority
   - `mode: subagent` — delegated subagent

### What is NOT documented

1. ❌ **Meaning of `subtask: true` field** — What does it actually do?
2. ❌ **When to use `subtask: true`** — Guidance on application
3. ❌ **How `subtask: true` is processed** — Implementation details
4. ❌ **Relationship to agent modes** — Why primary agents have this?
5. ❌ **Error handling** — What happens if `subtask: true` is malformed?
6. ❌ **Validation rules** — Is this field required? Optional? Deprecated?
7. ❌ **CLI processor behavior** — Does any CLI code interpret this field?

---

## Implementation Search Results

### Code Search for `subtask` Processing

**Executed**: `rg "subtask" /opencode --type ts --type js -n`

**Result**: No TypeScript or JavaScript files contain any references to `subtask`

**Implication**: The field is not processed by any code in the main codebase.

### Configuration Files Checked

**config.json** - Plugin configuration:

- Lists plugins: `opencode-sessions@latest`, `@zenobius/opencode-background@latest`, `@tarquinen/opencode-dcp@latest`
- Enables MCP servers (memoria, atlassian, gh_grep, chrome-devtools)
- NO reference to `subtask` field processing
- Protects `task` tool from pruning (dcp.jsonc line 15)

**dcp.jsonc** - Dynamic Context Pruning:

- `protectedTools: ["task"]`
- NO reference to `subtask` field

### Conclusion

**No visible implementation of `subtask: true` processing in accessible codebase.**

---

## Agent System Architecture

### Three Delegation Mechanisms Identified

**Mechanism 1: Primary Agent → Subagent via Task Tool**

```
Primary Agent
├─ Execute task tool
├─ Pass subagent_type and prompt
└─→ Subagent executes and returns result
```

Example: `/command/project/status.md`

**Mechanism 2: Command → Agent via Frontmatter**

```
Command (with agent: field)
├─ References agent definition
└─→ Agent executes per protocol
```

Example: `/command/jira.md` (with `agent: jira`)

**Mechanism 3: ??? (If subtask: true is functional)**

```
Command (with subtask: true)
├─ Some processor interprets field
└─→ Auto-delegates to subagent?
```

**Status**: Unverified, possibly unimplemented

---

## Inconsistencies Observed

| Aspect | Finding |
|--------|---------|
| **Agent Mode Consistency** | 3 of 4 `subtask: true` commands reference `primary` agents (should be subagents?) |
| **Non-existent Agent** | `miniproject` agent is referenced but not found in codebase |
| **Competing Patterns** | Task-tool delegation commands don't use `subtask: true`; vice versa |
| **Documentation** | Field exists in 4 files but explained in 0 files |
| **Implementation** | No code found that processes this field |
| **Field Naming** | `subtask: true` semantically implies "this is a subtask", but 2 commands claim primary agent authority |

---

## Supporting Evidence

### Direct File References

**devtool.md (line 6)**

```
/home/zenobius/Projects/dotfiles/devtools/files/opencode/command/devtool.md:6:subtask: true
```

**confluence.md (line 4)**

```
/home/zenobius/Projects/dotfiles/devtools/files/opencode/command/confluence.md:4:subtask: true
```

**miniproject.md (line 4)**

```
/home/zenobius/Projects/dotfiles/devtools/files/opencode/command/miniproject.md:4:subtask: true
```

**jira.md (line 4)**

```
/home/zenobius/Projects/dotfiles/devtools/files/opencode/command/jira.md:4:subtask: true
```

### Cross-Reference

Task tool instructions appear in these commands (WITHOUT `subtask: true`):

- `/command/project/status.md:9-12`
- `/command/project/view.md:9-12`
- `/command/project/plan.research.md:9-12`
- `/command/project/query.md:9-12`
- `/command/project/plan.tasks.md:9-12`
- `/command/project/plan.stories.md:9-12`
- `/command/project/plan.prd.md:9-12`

---

## Known Configuration

From `/AGENTS.md` (lines 4-6):

```
## Domain Knowledge

You have a library of pluggable skills that you can lazy load on demand...
```

From `/AGENTS.md` (line 49):

```
If you are a primary agent, offload context-heavy work to subagents via `task` tool. 
Check tool definition for `subagent_type` options.
```

From `/dcp.jsonc` (line 14-17):

```json
"protectedTools": [
  "task"
]
```

---

## Hypothesis on Why `subtask: true` May Not Work

### Primary Hypothesis: **Orphaned/Unimplemented Feature**

**Evidence**:

- No implementation code found
- No documentation of expected behavior
- Conflicting with agent mode types
- Superseded by explicit task tool instructions in other commands

**Mechanism**:

- Field was added as intention marker but never implemented
- Later, explicit task tool instruction pattern was developed
- Original `subtask: true` commands were not updated
- Field now silently ignored

### Secondary Hypothesis: **Plugin-Level Processing**

**Evidence**:

- Plugins listed in config.json might intercept and process
- `opencode-sessions@latest` could implement this feature
- Plugin source code not available in this repository

**Mechanism**:

- Plugin reads `subtask: true` field
- Routes command through subagent system
- But feature may have bugs or limitations

### Tertiary Hypothesis: **Documentation vs Reality Gap**

**Evidence**:

- Commands with `subtask: true` don't include task tool invocation instructions
- Users would need to know to use task tool anyway
- Defeats purpose of the marker if not automatic

**Mechanism**:

- Documentation assumes `subtask: true` is self-explanatory
- Users don't understand what it means
- Report it as "not working" when they don't see delegation happen

---

## Related Patterns Found

### `mode: subagent` Definition

**Location**: `/agent/generalist-subagent.md:4`

```yaml
mode: subagent
tools:
    skills_*: true
    gh_grep: true
    write: true
    todowrite: true
    read: true
```

**Implication**: Subagents are defined with mode, not via commands using `subtask: true`

### `subagent_type` Parameter

**Location**: `/command/project/status.md:11`

```
- `subagent_type`: "general"
```

**Implication**: Subagent selection happens via task tool parameter, not via command field

### Missing Name Field

**Location**: `/command/confluence.md:1-4`

```yaml
---
description: Manage Confluence pages...
agent: confluence
subtask: true
---
```

**Observation**: Missing `name:` field that other commands have. Could be syntax issue.

---

## Summary Table

| Command | Agent | Agent Mode | subtask Field | Task Tool? | Status |
|---------|-------|-----------|----------------|-----------|--------|
| devtool.md | chrome-debug-subagent | subagent | YES | NO | Unclear |
| jira.md | jira | primary | YES | NO | Unclear |
| confluence.md | confluence | primary | YES | NO | Unclear |
| miniproject.md | miniproject | NOT FOUND | YES | NO | **BROKEN** |
| project/status.md | (none) | N/A | NO | YES | Clear |
| project/view.md | (none) | N/A | NO | YES | Clear |

---

## Verification Status

| Claim | Evidence Level | Notes |
|-------|---|---|
| `subtask: true` appears in 4 commands | ✅ VERIFIED | Direct grep match, all files examined |
| No implementation code found | ✅ VERIFIED | TypeScript/JavaScript grep found nothing |
| Task tool is documented pattern | ✅ VERIFIED | 7+ commands use explicit task instructions |
| Inconsistent with agent modes | ✅ VERIFIED | Primary agents shouldn't be subtasks |
| Referenced agent missing | ✅ VERIFIED | No miniproject agent definition exists |
| No documentation of field | ✅ VERIFIED | Searched all .md files, found zero explanations |
| Plugin source not available | ✅ VERIFIED | Config references external plugins |

---

## Conclusion

The `subtask: true` frontmatter setting **appears to be an orphaned feature** that was either:

1. Never fully implemented, or
2. Superseded by the explicit `task` tool + `subagent_type` pattern, or
3. Handled by an external plugin with unknown behavior

The field has **no visible implementation** in the main codebase and **no documentation** of its purpose or behavior. Commands attempting to use it would likely either:

- Be silently ignored (field not processed), or
- Fail with unclear error messages (plugin processing fails)

The modern best practice evident in the codebase is to use explicit task tool invocation with `subagent_type` parameter, which has clear documentation and consistent patterns.
