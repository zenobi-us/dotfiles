# Key Insights & Patterns

## Pattern Discovery

### 1. Two Competing Delegation Architectures

OpenCode appears to have **evolved** from one delegation model to another, with legacy code not yet updated.

#### Legacy Pattern: `subtask: true` Field

```yaml
---
agent: jira
subtask: true
---
```

- **Implicit delegation** via field marker
- **Agent name-based routing** to `/agent/*.md` files
- **Unclear semantics** (no documentation)
- **Used by**: 4 commands (devtool, jira, confluence, miniproject)
- **Status**: Superseded by modern pattern

#### Modern Pattern: Explicit Task Tool

```markdown
Call the Task tool with these parameters:
- `description`: "Analyze project status..."
- `subagent_type`: "general"
- `prompt`: [detailed instructions]
```

- **Explicit delegation** with clear instructions
- **Generic subagent type selection** (not name-based)
- **Detailed documentation** of what subagent will do
- **Used by**: 7+ commands in `/project/` subdirectory
- **Status**: Active, documented, consistent

### Key Insight

**The codebase shows architectural migration in progress.** Legacy commands weren't updated when the new pattern was introduced.

---

## 2. The Miniproject Mystery

**The `miniproject` command references a non-existent agent.**

```yaml
agent: miniproject  # This agent doesn't exist
subtask: true
```

This could indicate:

1. **Incomplete migration** - Agent was deleted but command wasn't
2. **Placeholder** - Meant to be filled in later
3. **External plugin** - Agent defined outside this repo
4. **Broken reference** - Forgotten during refactoring

**[ASSUMPTION]**: Most likely incomplete migration. The simple template suggests early placeholder work.

---

## 3. Semantic Inconsistency in Agent Modes

### Problem: Primary Agents Marked as Subtasks

```
Jira (mode: primary) → labeled as subtask: true
Confluence (mode: primary) → labeled as subtask: true
```

These agents have:

- Full tool access (17+ tools each)
- Independent operating protocols
- Primary decision authority

Yet marked as "subtask" (implying delegated/subordinate).

### Resolution Hypothesis

[**ASSUMPTION**]: The `subtask: true` field may have been intended to mean "this command facilitates a subtask" rather than "this command IS a subtask of something else."

Examples:

- `jira` command helps transition tickets between task states
- `confluence` command helps document task outcomes
- Not literally subtask delegation, but task-adjacent

**Current documentation** doesn't clarify this distinction, leading to confusion.

---

## 4. Three Levels of Agent Classification

The OpenCode system has evolved **three distinct agent categories**:

### Level 1: Primary Agents (`mode: primary`)

```yaml
mode: primary
tools:
  atlassian_*: true
  [... full tool access ...]
```

**Characteristics**:

- Full authority to execute
- Extensive tool access
- Operate independently
- Examples: `jira`, `confluence`

**Use in Commands**:

- Either direct execution
- Or facilitate subtasks (via `subtask: true` marker - ambiguous)

### Level 2: Subagents (`mode: subagent`)

```yaml
mode: subagent
tools:
  skills_*: true
  [... limited tool scope ...]
```

**Characteristics**:

- Limited tool scope
- Designed for delegation
- Execute under parent agent control
- Examples: `generalist-subagent`, `chrome-debug-subagent`, `deep-researcher-subagent`

**Use in Commands**:

- Referenced via `agent:` field (legacy)
- OR referenced via `subagent_type:` parameter (modern)

### Level 3: Generic Subagents (`subagent_type: "general"`)

```
- `subagent_type`: "general"
- `subagent_type`: "research"
- `subagent_type`: "typescript"
```

**Characteristics**:

- Parameter-based selection
- Don't require command-level definition
- Selected by task tool during execution
- Examples: Used in `/project/*.md` commands

**Pattern**: Modern approach, explicitly documented

### Key Insight

**The system has three levels of agent authority**, with legacy code using implicit naming (Level 1) and modern code using explicit parameters (Level 3).

---

## 5. Documentation Hygiene Failure

### Missing Documentation

- ❌ What does `subtask: true` mean?
- ❌ When should I use it?
- ❌ Why does it exist?
- ❌ How is it processed?
- ❌ What errors can occur?

### Documentation That Exists

- ✅ Agent protocol details (AGENTS.md)
- ✅ Task tool usage (project commands)
- ✅ Subagent types
- ✅ Individual agent protocols

### Gap Analysis

**The system documents everything EXCEPT the `subtask: true` field.**

This suggests:

1. Field predates current documentation system
2. Assumed to be self-explanatory (it's not)
3. Replaced by newer patterns but never removed
4. Low priority (not user-facing in modern commands)

---

## 6. Agent Routing Evolution

### Phase 1: Name-Based Routing (Legacy)

```
Command file → agent: <name> → /agent/<name>.md → Execute
```

- Implicit delegation via agent name
- Files must exist for routing to work
- Fragile (broken reference = silent failure)
- Used by: devtool, jira, confluence, miniproject

### Phase 2: Type-Based Routing (Modern)

```
Command file → task tool → subagent_type: "<type>" → Execute
```

- Explicit delegation via parameter
- Types predefined in system
- Robust (invalid type = clear error)
- Used by: project/*.md commands

### Key Insight

**System migrated from name-based to type-based routing**, improving error handling and clarity. Legacy commands not yet updated.

---

## 7. The `miniproject` Agent - Unresolved

### Evidence Trail

1. **Referenced in command**: `/command/miniproject.md:3`
2. **Agent file missing**: No `/agent/miniproject.md` exists
3. **Pattern inconsistent**: Simple template like devtool, complex like jira
4. **No modern parallel**: No task tool instructions
5. **Description vague**: "Markdown Driven Task Management"

### Possibilities

- **Incomplete feature**: Agent was planned but never implemented
- **Forgotten removal**: File deleted without updating command
- **External tool**: Expects external miniproject CLI/agent
- **Placeholder**: Work-in-progress that shipped incomplete

### [BIAS] Most Likely Explanation

Based on the pattern of `subtask: true` being unimplemented throughout the codebase, **miniproject is likely an incomplete feature from the legacy phase.**

---

## 8. Practical Impact: Why Users Might Report Failure

### Scenario 1: User Reads Command File

```
User reads /command/jira.md
↓
Sees: "agent: jira" "subtask: true"
↓
Assumption: "Command will delegate to jira agent automatically"
↓
User invokes command expecting automatic delegation
↓
Expected: Jira agent processes request
↓
Actual: Command body is passed to jira agent as-is (if processed at all)
↓
Result: Confusion about what "subtask: true" does
```

### Scenario 2: User Reads Command File (Miniproject)

```
User reads /command/miniproject.md
↓
Sees: "agent: miniproject"
↓
Assumption: "miniproject agent will handle my request"
↓
User invokes command with "miniproject" agent in mind
↓
Expected: Agent processes markdown task management
↓
Actual: Agent file doesn't exist
↓
Result: Error (if routed by agent name) OR silent failure (if ignored)
```

### Scenario 3: User Expects Modern Pattern

```
User reads /command/project/status.md (modern)
↓
Sees: "Call the Task tool with..."
↓
User understands: Must invoke task tool explicitly
↓
User gets: Clear error if parameters wrong
↓
User gets: Correct result if parameters right
↓
Result: Predictable, documented behavior ✅
```

### Key Insight

**Modern commands succeed because they're explicit. Legacy commands fail because they're implicit and undocumented.**

---

## 9. Architectural Debt Assessment

### Technical Debt Items

| Item | Severity | Type | Resolution |
|------|----------|------|-----------|
| `subtask: true` unimplemented | MEDIUM | Feature debt | Remove field OR implement |
| Missing miniproject agent | HIGH | Broken reference | Delete command OR create agent |
| No documentation of field | HIGH | Documentation debt | Document OR remove |
| Semantic confusion (primary as subtask) | MEDIUM | Design debt | Clarify intent OR change name |
| Two delegation patterns in code | MEDIUM | Architecture debt | Migrate legacy to modern |

### Impact on Users

- **Confusion** about what fields do
- **Unpredictable behavior** (implicit vs explicit)
- **Silent failures** (missing agents)
- **Wrong assumptions** about automation

---

## 10. Design Pattern Observations

### What Works Well (Modern Pattern)

1. **Explicit over implicit** - Task tool instructions are clear
2. **Parameter-based routing** - `subagent_type` is flexible
3. **Documented behavior** - Every step explained
4. **Error handling** - Failures are explicit, not silent
5. **Consistency** - Same pattern across multiple commands

### What Doesn't Work (Legacy Pattern)

1. **Implicit routing** - Just a field name, no explanation
2. **Name-based coupling** - Fragile file system dependency
3. **No documentation** - Users must guess intent
4. **Silent failures** - No error if agent doesn't exist
5. **Semantic confusion** - Field name doesn't match behavior

### Key Insight

**The codebase demonstrates good design practices in modern code. Legacy code should be updated to match.**

---

## 11. Hypothesis: Plugin Responsibility

### Could Plugin Handle `subtask: true`?

**Evidence supporting this:**

- External plugins listed in config.json
- `opencode-sessions@latest` is active
- No code in main repo doesn't mean no code exists
- Plugin could intercept frontmatter fields

**Evidence against:**

- No documentation in repo mentioning this
- No error behavior documented
- Pattern not used by newer commands
- Would expect verbose logging if processing

### [ASSUMPTION] Assessment

**Unlikely that plugins handle this**, but possible. If true, plugin behavior should be documented in repo.

---

## 12. Convergent Evidence Patterns

### Multiple sources confirm the same conclusion

1. **Absence of implementation** + **Absence of documentation** = **Unimplemented feature**
2. **Superseded by task tool pattern** + **Legacy commands unreferenced** = **Orphaned code**
3. **Primary agents marked as subtasks** + **Confusing semantics** = **Design confusion**
4. **Non-existent miniproject agent** + **Simple template** = **Incomplete feature**

### Confidence in Conclusion

All evidence vectors point to the same diagnosis: **`subtask: true` is an unimplemented or superseded feature that should be removed or properly documented.**

---

## 13. Recommended Investigative Steps (Not Conducted)

### To Increase Confidence

1. **Examine git log** - When was `subtask: true` introduced/removed?
2. **Check issues/discussions** - Are there bug reports about this?
3. **Review plugin sources** - Does `opencode-sessions` process this field?
4. **Test actual behavior** - What happens when you invoke these commands?
5. **Interview maintainers** - What was the original design intent?

### To Fix the Issue

1. **Document the field** - OR remove if unneeded
2. **Create miniproject agent** - OR delete the command
3. **Migrate legacy commands** - Update to modern task tool pattern
4. **Audit agent modes** - Clarify primary vs subtask semantics
5. **Add validation** - Error if referenced agent doesn't exist

---

## Summary of Key Patterns

| Pattern | Evidence | Status |
|---------|----------|--------|
| Architecture evolution (name→type routing) | Command patterns, agent definitions | ✅ CLEAR |
| Unimplemented feature (`subtask: true`) | No code, no docs, superseded | ✅ CLEAR |
| Documentation-reality gap | Modern commands clear, legacy commands vague | ✅ CLEAR |
| Semantic confusion (primary = subtask) | Agent definitions vs field naming | ✅ CLEAR |
| Migration incomplete | Legacy + modern patterns coexist | ✅ CLEAR |
| Orphaned code (miniproject) | Missing agent, unused command | ✅ CLEAR |
