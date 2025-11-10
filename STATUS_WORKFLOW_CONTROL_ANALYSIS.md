# Status Workflow Control Analysis
## @devtools/opencode Command & Skill Architecture

**Focus:** How are we controlling the status workflow?  
**Scope:** @devtools/files/opencode/command/project/ + @devtools/files/opencode/skills/projectmanagement/

---

## EXECUTIVE SUMMARY

The status workflow is controlled through a **three-layer system**:

1. **Planning Artifacts** (BasicMemory storage) - Define work with explicit status fields
2. **Command Layer** (@command/project) - Orchestrate transitions between states  
3. **Skills Layer** (@skills/projectmanagement) - Provide metadata, templates, and backend operations

Each artifact type has **different valid status values** that enforce the workflow discipline.

---

## LAYER 1: PLANNING ARTIFACTS (Storage Layer)

**Location:** BasicMemory (project-scoped)  
**Structure:** Johnny Decimal format (1-9 categories)

### Artifact Status Values (From Templates)

#### Epic
```yaml
status: { Active | Completed | On Hold | Cancelled }
```

#### Spec
```yaml
status: { Draft | In Review | Approved | Superseded }
```

#### Story
```yaml
status: { To Do | In Progress | In Review | Done | Cancelled }
storyPoints: { 3 | 5 | 8 | 13 }
```

#### Task
```yaml
status: { To Do | In Progress | In Review | Done | Blocked }
storyPoints: { 1 | 2 | 3 | 5 | 8 }  # Max 8 points
```

#### Research
```yaml
status: { In Progress | Complete | Inconclusive | Superseded }
researchType: { Market | Technical | User | Competitive | Process | Other }
```

#### Decision
```yaml
status: { Pending | Decided | Unresolved | Superseded }
decisionDate: { YYYY-MM-DD or null if pending }
```

#### Retrospective
```yaml
status: { In Progress | Complete }
```

---

## LAYER 2: COMMAND LAYER (@devtools/opencode/command/project)

### Planning Commands
- `/project:plan:prd` - Create PRD
- `/project:plan:epic` - Create Epic  
- `/project:plan:feature` - Create Epic + Spec pair
- `/project:plan:stories` - Break Epic into Stories
- `/project:plan:tasks` - Decompose Story into Tasks
- `/project:plan:research` - Create Research
- `/project:plan:decision` - Create Decision
- `/project:plan:brainstorm` - Ad-hoc planning

### Execution Commands
- `/project:do:task` - Start task execution
  - Sets: `status: To Do → In Progress`
  - Creates isolated git worktree
  - Runs tests baseline
- `/project:do:commit` - Commit work
  - Sets: `status: In Progress → In Review`
  - Creates PR with semantic message

### Monitoring Commands
- `/project:status` - Show current context
  - Aggregates across hierarchy
  - Calculates completion %
  - Suggests next actions
- `/project:view` - View artifact
- `/project:query` - Search artifacts

### Completion Commands
- `/project:bug` - Report/fix bug
- `/project:close` - Archive completed work
  - Creates Retrospective
  - Links unresolved Decisions

---

## LAYER 3: SKILLS LAYER (@devtools/opencode/skills/projectmanagement)

### `projectmanagement_storage_basicmemory` 
Backend operations for BasicMemory:
- Create artifacts with structure
- Update status fields
- Query by status/epic/project
- Generate ProjectId
- Handle concurrent access

### `projectmanagement_info_planning_artifacts`
Metadata + templates:
- 8 artifact types defined
- Status flow (referenced: `references/status-flow.md` - **MISSING**)
- Schema definitions (referenced: `references/schema.md` - **MISSING**)
- Johnny Decimal rules
- All templates present (except PRD)

---

## STATUS WORKFLOW STATE MACHINE

### Task Lifecycle
```
┌────────┐
│ To Do  │  ← Default when created
└────┬───┘
     │ /project:do:task #123
     ↓
┌──────────────┐
│ In Progress  │  ← Worktree created
└────┬─────────┘
     │ git commit + /project:do:commit
     ↓
┌──────────┐
│ In Review│  ← PR awaiting merge
└────┬─────┘
     │ PR merged
     ↓
┌──────┐
│ Done │  ← Complete
└──────┘

Blocked State: (any) → Blocked  ← Dependency issue
```

### Story & Epic
Status aggregates from children:
- Story Done = all Tasks Done
- Epic Completed = all Stories Done

### Research Lifecycle
```
In Progress → Complete
   ↓
Inconclusive (no clear findings)
   ↓
Superseded (replaced)
```

### Decision Lifecycle
```
Pending → Decided
   ↓
Unresolved → MUST link to Retrospective
   ↓
Superseded
```

---

## HOW STATUS IS CONTROLLED

### 1. Frontmatter Enforcement
Status stored in YAML frontmatter (structured data):

```yaml
---
status: In Progress              # Explicit state
projectId: dotfiles              # Scoping
epicId: 1                        # Hierarchy
storyPoints: 5                   # Estimation
priority: High                   # Sort key
assignee: developer-name         # Responsibility
links:
  - type: epic
    target: 2.1.1-epic-title
  - type: blocking
    target: 5.2.1-task-other
---
```

### 2. Command-Driven Transitions
Status changes via explicit commands only:

- Task creation → `status: To Do`
- `/project:do:task` → `status: In Progress`
- `/project:do:commit` → `status: In Review`
- PR merge → `status: Done` (manual or webhook)

### 3. Status Queries
`/project:status` orchestrates:
- Query BasicMemory for all artifacts
- Filter by ProjectId
- Group by type/parent
- Calculate aggregates
- Suggest next actions

### 4. Relationship-Based Status
Tasks maintain relationships:

```yaml
links:
  - type: story          # Parent
    target: 4.3.1-story
  - type: epic           # Grandparent
    target: 2.1.1-epic
  - type: blocking       # Downstream
    target: 5.2.1-task
  - type: dependent_on   # Upstream
    target: 5.1.1-task
```

Enables:
- Blocking analysis
- Dependency tracking
- Critical path detection
- Cascade updates (if blocked → parent blocked)

---

## DATA FLOW: ARTIFACT CREATION → COMPLETION

### Phase 1: Creation
```
/project:plan:tasks "#5"
→ Create artifact: status: To Do
```

### Phase 2: Start Work
```
/project:do:task #123
→ Update: status: To Do → In Progress
→ Create worktree: 123-task-description
→ Run tests baseline
```

### Phase 3: Development
```
User develops in worktree
Status remains: In Progress
Work Log tracks progress
```

### Phase 4: Submit
```
git commit -m "feat: ..."
/project:do:commit
→ Update: status: In Progress → In Review
→ Create PR
→ Add work log entry
```

### Phase 5: Review
```
Reviewer checks PR
Status remains: In Review
Approve or request changes
```

### Phase 6: Merge & Completion
```
PR merged to main
→ Update: status: In Review → Done
→ Update parent Story status
→ Update parent Epic status
→ Cleanup worktree
NOTE: Currently manual (webhook missing)
```

### Phase 7: Closure (Epic Complete)
```
/project:close
→ Create Retrospective
→ Link Unresolved Decisions
→ Archive artifacts
```

---

## CRITICAL GAPS

### Missing Infrastructure (❌)

1. **Status Flow Diagrams**
   - Referenced: `references/status-flow.md`
   - **NOT FOUND in repo**
   - Should document valid transitions

2. **Schema Definitions**
   - Referenced: `references/schema.md`
   - **NOT FOUND in repo**
   - Should define validation rules

3. **PRD Template**
   - Referenced in SKILL.md
   - **NOT FOUND in repo**
   - Breaks artifact creation flow

4. **Post-Merge Automation**
   - Status: In Review → Done requires manual update
   - **NO WEBHOOK automation**
   - Workflow incomplete

### Control Gaps (⚠️)

1. **Blocking Enforcement**
   - Relationships documented but not enforced
   - Task can be Done while blocking others
   - No cascade invalidation

2. **Priority Algorithm**
   - `/project:status` suggests actions
   - Prioritization not documented
   - Dependency-first ordering not explicit

3. **Status Validation**
   - Task template lists Definition of Done
   - Enforcement is manual (discipline required)
   - No automated checks

4. **Blocked State Monitoring**
   - Blocked status can be set
   - No escalation or alerts
   - No timeout-based detection

---

## CONTROL POINTS: WHERE ENFORCED

### 1. Artifact Creation
- Templates specify default status
- ProjectId validation required
- Frontmatter initialized

### 2. Status Transitions
- Commands check current status
- Some transitions blocked (e.g., can't skip In Review)
- Work log documents all changes

### 3. Query Layer
- BasicMemory returns current status
- Aggregates calculate parent status
- Hierarchy displayed in tree

### 4. Validation
- Task template: Definition of Done
- Manual enforcement via code review
- No automated blocking

### 5. Relationship Integrity
- Frontmatter links maintain hierarchy
- Obsidian wiki-links for navigation
- No bidirectional constraints

---

## EXAMPLE: COMPLETE TASK LIFECYCLE

```yaml
# Creation: /project:plan:tasks "#4"
5.1.1-task-database-schema-design.md
---
status: To Do
storyPoints: 5
---

# Start: /project:do:task #123
---
status: In Progress
assignee: alice
---

# Submit: /project:do:commit
---
status: In Review
---

# Merge: PR approved
---
status: Done
completedDate: 2025-11-10
---

# Parent Story auto-updated
4.3.1-story-extract-templates.md
---
status: Done (3/3 tasks complete)
---

# Parent Epic auto-updated
2.1.1-epic-separate-cli-tool.md
---
status: Completed (4/4 stories complete)
---
```

---

## RECOMMENDATIONS

### Priority 1: Fix Critical Gaps
1. Create `references/status-flow.md` - State machine diagrams
2. Create `references/schema.md` - Frontmatter validation
3. Create `prd_template.md` - Complete artifact types
4. Add webhook automation - PR merge → auto-update status

### Priority 2: Active Constraints
1. Enforce blocking relationships - Block Done if dependencies blocked
2. Enforce task size - Reject Task > 8 story points
3. Validate Decision closure - All Unresolved → Retrospective

### Priority 3: Monitoring
1. Stalled work detection - Alert if Task In Progress > 3 days
2. Burndown tracking - Completion % per Epic
3. Critical path analysis - Highlight blocking tasks

### Priority 4: User Experience
1. Enhanced queries - `--epic`, `--blocked`, `--overdue` flags
2. Batch operations - `/project:close-epic #4`
3. Status dashboard - Visual tree, charts, metrics

---

## CONCLUSION

**Well-structured but incomplete:**

✅ Explicit status fields (not implicit)  
✅ Command-driven transitions (not auto-calculated)  
✅ Hierarchical aggregation (task → story → epic)  
✅ Relationship linking (blocking/dependencies)  
❌ Missing validation (status-flow.md, schema.md)  
❌ Missing automation (webhook post-merge)  
❌ Missing enforcement (constraints not active)  
❌ Missing observability (stalled work, burndown)

**Foundation is solid. Implementing recommendations makes it production-ready.**
