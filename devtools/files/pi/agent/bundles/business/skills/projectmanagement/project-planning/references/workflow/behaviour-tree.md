# Project Management Behaviour Tree

This guide directs the project-manager agent through systematic navigation of project artifacts and actions. Use this tree for all `/project` command invocations.

## Root Decision Node: Input Check

```
START: User invokes /project command
├─ Has user provided input?
│  ├─ NO (empty) → Go to: Display Project Tree
│  └─ YES → Go to: Parse Action Type
└─ END
```

### NO Input Path: Display Project Tree

When user runs `/project` with no arguments:

1. **Fetch project state** from storage (current project context)
2. **Build tree display** in hierarchical format:
   ```
   Project: [ProjectName]
   
   ├─ Epic 1: [EpicName] (status: Active)
   │  ├─ Story 1.1: [StoryName] (status: To Do)
   │  │  ├─ Task 1.1.1: [TaskName] (status: To Do)
   │  │  └─ Task 1.1.2: [TaskName] (status: In Progress)
   │  └─ Story 1.2: [StoryName] (status: Done)
   │
   ├─ Epic 2: [EpicName] (status: On Hold)
   │  └─ Story 2.1: [StoryName] (status: In Progress)
   │     └─ Task 2.1.1: [TaskName] (status: Blocked)
   ```

3. **Present selection prompt:**
   ```
   Choose an item to act on:
   (1) Epic 1
   (2) Story 1.1
   (3) Task 1.1.1
   (4) Task 1.1.2
   (5) Epic 2
   (6) Story 2.1
   (7) Task 2.1.1
   (Or provide custom action)
   ```

4. **Capture user selection** → Go to: Item-Type Decision

---

### YES Input Path: Parse Action Type

When user provides input (e.g., "update task 1.1.1" or selects item from tree):

1. **Parse input** to identify:
   - Target artifact (Epic/Story/Task)
   - Artifact ID or selection
   - Explicit action (if provided), or default to action menu

2. **Route to appropriate action handler** → Go to: Item-Type Decision

---

## Item-Type Decision Node

After identifying the selected artifact, determine what actions are available:

```
ARTIFACT TYPE?
├─ Epic → Go to: Epic Action Menu
├─ Story → Go to: Story Action Menu
├─ Task → Go to: Task Action Menu
└─ Error (unknown type) → Present error, return to Root
```

---

## Epic Action Menu

**Available actions for Epic artifacts:**

```
EPIC: [EpicName] (Status: [current status])

Choose action:
(1) Create Story under this Epic
(2) View Epic details
(3) Update Epic
(4) Close/Cancel Epic
(5) View all Stories in Epic
(Q) Back to project tree
```

**Action-specific flows below:**

### Epic: Create Story

**Preconditions:**
- Epic status must be `Active` or `Draft`
- Check against status-flow.md: Epic cannot spawn Stories if `Completed`, `On Hold`, or `Cancelled`

**If precondition fails:**
- Display: "Epic is [current status]. Cannot create Stories in this state."
- Offer: "Would you like to change Epic status first? (Y/N)"
- If YES → Go to: Epic Update flow
- If NO → Return to Epic Action Menu

**If precondition passes:**
- Fetch linked Spec (Epic must have valid Spec before Stories)
- Validate Spec status = `Approved` (per planning-phase.md)
- If Spec not Approved → Escalate to Q: "Spec must be Approved before creating Stories"
- If Spec Approved → Launch Story creation artifact builder
- After creation → Ask "Create another Story?" or Return to Epic Action Menu

---

### Epic: View Details

- Display: Epic artifact with all fields (objectives, scope, timeline, links)
- Display: List of linked Stories with their status
- Display: Links to PRD, dependent Epics, Decisions, Research
- Return to Epic Action Menu

---

### Epic: Update Epic

**Preconditions:**
- Epic must be in `Draft`, `Active`, or `On Hold` status
- Cannot update `Completed` or `Cancelled` epics (closed work)

**If precondition fails:**
- Display error and return to Epic Action Menu

**If precondition passes:**
- Present update form with editable fields
- **ESCALATION CHECK DURING UPDATE:**
  - If user attempts to expand Epic scope significantly → Escalate to Q
  - If user attempts timeline shift >1 week → Escalate to Q
  - If user wants to change technical direction → Escalate to Q
  - See: Escalation Matrix in overview.md
- After update → Ask "Perform another action?" → Go to: Post-Action Loop

---

### Epic: Close/Cancel Epic

**Preconditions:**
- Epic must be in `Active`, `Draft`, or `On Hold` status
- Check: Are all child Stories and Tasks accounted for?
  - If Stories/Tasks still in `To Do` or `In Progress` → Warn user: "Incomplete work detected. Close anyway? (Y/N)"

**Escalation check:**
- If closing Epic with unresolved Decisions → Escalate to Q: "Unresolved Decisions exist. Proceed? (Y/N)"

**Flow:**
- Prompt for close reason (intentional completion vs. cancellation)
- Update Epic status to `Completed` or `Cancelled`
- Offer: "Create Retrospective for this Epic? (Y/N)"
- After closure → Go to: Post-Action Loop

---

### Epic: View All Stories

- Fetch all child Stories linked to this Epic
- Display in list format with status and Task count
- Prompt: "Select a Story to act on, or return to Epic menu"
- If selection → Go to: Story Action Menu
- If return → Go to: Epic Action Menu

---

## Story Action Menu

**Available actions for Story artifacts:**

```
STORY: [StoryName] (Status: [current status])

Choose action:
(1) Create Task under this Story
(2) View Story details
(3) Update Story
(4) View all Tasks in Story
(5) Mark as Complete/Cancelled
(Q) Back to project tree
```

### Story: Create Task

**Preconditions:**
- Story status must be `Draft` or `Approved`
- Cannot create Tasks if Story is `Cancelled`
- Per planning-phase.md: Story must be `Approved` before Tasks can be created

**If precondition fails:**
- Display: "Story must be Approved before creating Tasks. Current status: [status]"
- Offer: "Update Story status? (Y/N)"
- If YES → Go to: Story Update flow
- If NO → Return to Story Action Menu

**If precondition passes:**
- Launch Task creation artifact builder
- After creation → Ask "Create another Task?" or Return to Story Action Menu

---

### Story: View Details

- Display: Story artifact with all fields (acceptance criteria, linked Spec, linked Tasks)
- Display: List of child Tasks with status
- Return to Story Action Menu

---

### Story: Update Story

**Preconditions:**
- Story must be in `To Do`, `In Progress`, `In Review`, or `Approved` status
- Cannot update `Done` or `Cancelled` stories

**Escalation checks during update:**
- If scope of Story changes significantly → Escalate to Q
- If acceptance criteria change → Escalate to Q
- If blocking dependencies are added → Note and continue (not escalation-level)

**Flow:**
- Present update form
- After update → Ask "Perform another action?" → Go to: Post-Action Loop

---

### Story: View All Tasks

- Fetch all child Tasks linked to this Story
- Display in list format with status
- Prompt: "Select a Task to act on, or return to Story menu"
- If selection → Go to: Task Action Menu
- If return → Go to: Story Action Menu

---

### Story: Mark as Complete/Cancelled

**Preconditions:**
- Check current status: `To Do`, `In Progress`, `In Review` allowed
- Cannot mark `Done` or `Cancelled` stories again

**Escalation check:**
- If marking Complete but child Tasks not all Done → Warn: "Some Tasks are not Done. Mark anyway? (Y/N)"

**Flow:**
- Update Story status to `Done` or `Cancelled` (user choice)
- If Cancelled → Request reason
- After status change → Offer "Create Retrospective?" or Ask "Perform another action?"

---

## Task Action Menu

**Available actions for Task artifacts:**

```
TASK: [TaskName] (Status: [current status])

Choose action:
(1) View Task details
(2) Update Task status
(3) Add blockers/dependencies
(4) Mark as Complete/Blocked/Cancelled
(5) Execute (run implementation)
(Q) Back to project tree
```

### Task: View Details

- Display: Task artifact with all fields (acceptance criteria, linked Story, blockers)
- Display: Current status and progress
- Return to Task Action Menu

---

### Task: Update Task Status

**Valid transitions per status-flow.md:**
```
To Do → In Progress → In Review → Done
    ↘ Blocked (at any point)
    ↘ Cancelled (if deprioritized)
```

**Preconditions:**
- Check current status
- Validate transition is legal (per status-flow.md)
- If transition blocked → Display error and list valid next states

**Escalation checks:**
- If moving to `Blocked` → Require reason and document blocker
- If blocker is external/high-impact → Escalate to Q per execution-phase.md escalation triggers
- If moving to `Cancelled` → Require reason

**Flow:**
- Present valid next state options
- User selects → Update status
- If Blocked → Prompt for blocker details, link to blocking artifact if known
- After update → Ask "Perform another action?" → Go to: Post-Action Loop

---

### Task: Add Blockers/Dependencies

**Purpose:** Document what's blocking Task progress

**Flow:**
- Prompt: "What is blocking this Task?"
- Capture blocker description
- Offer: "Link to another Task/Story that's blocking this? (Y/N)"
  - If YES → Present selectable list of artifacts, create dependency link
  - If NO → Continue
- Update Task with blocker documentation
- **Escalation check:** If blocker is significant (external, timeline-impacting) → Escalate to Q per execution-phase.md
- After adding blocker → Ask "Perform another action?" → Go to: Post-Action Loop

---

### Task: Mark as Complete/Blocked/Cancelled

**Preconditions:**
- Current status must allow transition per status-flow.md

**If Blocked:**
- Require blocker reason (per Add Blockers flow above)
- Document what's blocking

**If Cancelled:**
- Require reason for cancellation

**If Complete (Done):**
- Validate Definition of Done checklist is complete (per status-flow.md)
- Check: All subtasks/work items marked done?

**Flow:**
- Prompt for new status (Blocked/Cancelled/Done)
- Capture reason if Blocked or Cancelled
- Update Task status
- Offer next action

---

### Task: Execute (Run Implementation)

**Purpose:** Perform the actual implementation work for this Task

**Preconditions:**
- Task status must be `To Do` or `In Progress`
- Cannot execute `Done`, `Blocked`, or `Cancelled` tasks

**If precondition fails:**
- Display: "Task is [status]. Must be To Do or In Progress to execute."
- Return to Task Action Menu

**If precondition passes:**
- Prompt: "Beginning Task execution. Update status to In Progress? (Y/N)"
  - If YES → Move Task to `In Progress`, proceed
  - If NO → Proceed with execution
- **EXECUTION MODE:**
  - Launch implementation tooling (coding, deployment, etc.)
  - Display: "Execute Task: [TaskName]"
  - Provide context (acceptance criteria, Story details, blockers)
  - Run agent-specific implementation workflow
  - Capture output and results
- **After execution:**
  - Prompt: "Mark Task as In Review? (Y/N)"
    - If YES → Move Task to `In Review`
    - If NO → Keep current status
  - Ask "Perform another action?" → Go to: Post-Action Loop

---

## Escalation Detection Matrix

**When to escalate to Q during ANY action:**

| Trigger | Condition | Action |
|---------|-----------|--------|
| **Scope change** | Epic/Story scope expands or contracts significantly | Pause. Present to Q with current artifacts and proposed change. Wait for approval. |
| **Timeline shift** | Projected completion moves >1 week | Pause. Present to Q with new timeline and impact analysis. Wait for approval. |
| **Technical refactoring** | Discovered design changes or infeasibility | Pause. Present to Q with findings and recommended approach. Wait for approval. |
| **Resource constraints** | Task/Story complexity exceeds capacity | Pause. Present to Q with capacity analysis and split options. Wait for approval. |
| **Blocking decision** | Unresolved Decision artifact affects execution | Pause. Resolve Decision or escalate to Q. |
| **Unresolved clarifications** | [NEEDS CLARIFICATION] tags remain in artifact | Pause. Cannot proceed. Resolve or escalate. |

**How to escalate:**
1. Pause current action
2. Present situation to Q with:
   - Current artifact state
   - Specific change/issue detected
   - Impact analysis (scope/timeline/resource)
   - Recommended action
3. Wait for Q approval before proceeding
4. After approval → Resume action or pivot

---

## Post-Action Loop

After any action completes:

```
Action completed. Results: [display results]

Perform another action?
├─ YES → Return to: Display Project Tree (Root)
├─ NO → 
│  ├─ Offer: "Create Retrospective?" (if Epic/Project closing)
│  └─ Exit gracefully
└─ "Show tree" → Return to: Display Project Tree
```

---

## State Validation Reference

All actions validate against these status flows (see status-flow.md for full details):

- **Epic:** Active → Completed | On Hold | Cancelled
- **Story:** To Do → In Progress → In Review → Done | Blocked | Cancelled
- **Task:** To Do → In Progress → In Review → Done | Blocked | Cancelled
- **Decision:** Pending → Decided | Unresolved | Superseded
- **Research:** In Progress → Complete | Inconclusive | Superseded

**Critical gates (hard stops):**
- Cannot create Stories until Spec is `Approved`
- Cannot create Tasks until Story is `Approved`
- Cannot move to Execution until Planning phase complete (all Tasks at To-Do)
- Cannot close Epic until Decisions are resolved or documented as Unresolved

---

## Implementation Notes for Agent

1. **Always fetch latest artifact state** before presenting options or validating transitions
2. **Display status prominently** in every action menu so user knows current state
3. **Log escalations** for Q review with full context
4. **Close loopholes:** If user tries invalid transition, explain why (reference status-flow.md) and offer valid alternatives
5. **Recovery:** If agent gets stuck, return user to Project Tree root and restart navigation
