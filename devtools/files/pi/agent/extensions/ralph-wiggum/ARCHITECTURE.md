# Ralph Wiggum - Subagent Mode Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Ralph Loop State                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ name: "auth-system"                                        │ │
│  │ useSubagents: true                                         │ │
│  │ subagentAgent: "default"                                   │ │
│  │ currentTaskIndex: 2                                        │ │
│  │ subagentResults: [                                         │ │
│  │   { task: 1, success: true, ... },                        │ │
│  │   { task: 2, success: true, ... }                         │ │
│  │ ]                                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Normal Mode (Traditional)
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Task    │────▶│  Agent   │────▶│  Task    │
│  File    │     │ Processes│     │  File    │
│          │◀────│  Items   │     │ Updated  │
└──────────┘     └──────────┘     └──────────┘
     ▲                                  │
     │                                  │
     └──────────────────────────────────┘
           Agent updates directly
```

### Subagent Mode
```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Task    │────▶│  Ralph   │────▶│  Main    │────▶│ Subagent │
│  File    │     │  Loop    │     │  Agent   │     │  (Fresh  │
│          │     │(Orchest.)│     │(Delegator)│     │ Context) │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     ▲                │                                   │
     │                │                                   │
     │                ▼                                   │
     │           ┌──────────┐                            │
     │           │ Progress │                            │
     │           │ Tracking │                            │
     │           └──────────┘                            │
     │                                                    │
     └────────────────────────────────────────────────────┘
              Subagent updates task file
```

## State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                     Ralph Loop States                        │
└─────────────────────────────────────────────────────────────┘

          ┌──────────┐
          │  IDLE    │
          └────┬─────┘
               │ ralph_start(useSubagents: true)
               ▼
          ┌──────────┐
          │ ACTIVE   │────────────┐
          │(Subagent)│            │
          └────┬─────┘            │
               │                  │ ESC / /ralph stop
               │ Present Task N   │
               ▼                  ▼
          ┌──────────┐       ┌──────────┐
          │ WAITING  │       │ PAUSED   │
          │(for tool)│       └────┬─────┘
          └────┬─────┘            │
               │                  │ /ralph resume
               │ subagent(...)    │
               │ ralph_done()     │
               ▼                  │
          ┌──────────┐            │
          │RECORDING │            │
          │(task N)  │            │
          └────┬─────┘            │
               │                  │
               │ currentTaskIndex++
               │                  │
               ├──────────────────┘
               │
               │ More tasks?
               ├─Yes─▶ Back to ACTIVE
               │
               └─No──▶┌──────────┐
                      │COMPLETED │
                      └──────────┘
```

## Task Lifecycle

```
┌────────────────────────────────────────────────────────────┐
│                    Single Task Lifecycle                    │
└────────────────────────────────────────────────────────────┘

1. EXTRACTION
   ┌─────────────────────┐
   │ Task File           │
   │ - [ ] Task 1        │──▶ extractTasks()
   │ - [ ] Task 2        │
   │ - [x] Task 3        │
   └─────────────────────┘
         │
         ▼
   ["Task 1", "Task 2"]  (Array of uncompleted tasks)

2. PRESENTATION
   ┌─────────────────────┐
   │ buildSubagent       │
   │ ProgressPrompt()    │──▶ Shows: Task 1/2
   └─────────────────────┘    + Subagent template
                              + Instructions

3. DELEGATION
   ┌─────────────────────┐
   │ Main Agent          │
   │ subagent({          │──▶ Spawns fresh context
   │   agent: "default", │    with isolated task
   │   task: "..."       │
   │ })                  │
   └─────────────────────┘

4. EXECUTION
   ┌─────────────────────┐
   │ Subagent            │
   │ - Reads task desc   │──▶ Completes work
   │ - Implements feature│    in fresh context
   │ - Updates task file │
   │ - Returns summary   │
   └─────────────────────┘

5. RECORDING
   ┌─────────────────────┐
   │ ralph_done()        │
   │ - Record result     │──▶ Updates loop state
   │ - Increment index   │    currentTaskIndex++
   │ - Queue next task   │
   └─────────────────────┘

6. VERIFICATION
   ┌─────────────────────┐
   │ Task File           │
   │ - [x] Task 1   ✓   │──▶ Confirmed complete
   │ - [ ] Task 2        │
   │ - [x] Task 3        │
   └─────────────────────┘
```

## Component Interaction

```
┌────────────────────────────────────────────────────────────┐
│                     Component Diagram                       │
└────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      Extension Layer                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ralph_start Tool                                      │ │
│  │  - Validates parameters                                │ │
│  │  - Creates LoopState                                   │ │
│  │  - Initiates first iteration                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ralph_done Tool                                       │ │
│  │  - Records task completion                             │ │
│  │  - Updates state                                       │ │
│  │  - Queues next iteration                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  State Management                                      │ │
│  │  - loadState() / saveState()                           │ │
│  │  - migrateState()                                      │ │
│  │  - State file persistence                              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Processing Layer                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  extractTasks()                                        │ │
│  │  - Parses markdown checklist                           │ │
│  │  - Filters uncompleted items                           │ │
│  │  - Returns task array                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  buildSubagentProgressPrompt()                         │ │
│  │  - Formats progress display                            │ │
│  │  - Generates subagent template                         │ │
│  │  - Provides delegation instructions                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       Storage Layer                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  .ralph/<name>.state.json                              │ │
│  │  - Loop configuration                                  │ │
│  │  - Progress tracking                                   │ │
│  │  - Task results                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  .ralph/<name>.md or custom path                       │ │
│  │  - Task definitions                                    │ │
│  │  - Checklist with completions                          │ │
│  │  - Progress notes                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Execution Timeline

```
┌────────────────────────────────────────────────────────────┐
│              Example: 3-Task Loop Timeline                  │
└────────────────────────────────────────────────────────────┘

Time  │ Event                              │ State
──────┼────────────────────────────────────┼─────────────────
T0    │ ralph_start(useSubagents: true)   │ currentTaskIndex: 0
      │                                    │ tasks: [A, B, C]
──────┼────────────────────────────────────┼─────────────────
T1    │ Present Task A with template      │ status: WAITING
      │                                    │
──────┼────────────────────────────────────┼─────────────────
T2    │ Agent calls subagent(task A)      │ status: EXECUTING
      │                                    │
──────┼────────────────────────────────────┼─────────────────
T3    │ Subagent completes Task A         │ Task A: ✓
      │ Updates task file: - [x] Task A   │
──────┼────────────────────────────────────┼─────────────────
T4    │ Agent calls ralph_done()          │ currentTaskIndex: 1
      │                                    │ subagentResults: [A]
──────┼────────────────────────────────────┼─────────────────
T5    │ Present Task B with template      │ status: WAITING
      │                                    │
──────┼────────────────────────────────────┼─────────────────
T6    │ Agent calls subagent(task B)      │ status: EXECUTING
      │                                    │
──────┼────────────────────────────────────┼─────────────────
T7    │ Subagent completes Task B         │ Task B: ✓
      │ Updates task file: - [x] Task B   │
──────┼────────────────────────────────────┼─────────────────
T8    │ Agent calls ralph_done()          │ currentTaskIndex: 2
      │                                    │ subagentResults: [A,B]
──────┼────────────────────────────────────┼─────────────────
T9    │ Present Task C with template      │ status: WAITING
      │                                    │
──────┼────────────────────────────────────┼─────────────────
T10   │ Agent calls subagent(task C)      │ status: EXECUTING
      │                                    │
──────┼────────────────────────────────────┼─────────────────
T11   │ Subagent completes Task C         │ Task C: ✓
      │ Updates task file: - [x] Task C   │
──────┼────────────────────────────────────┼─────────────────
T12   │ Agent calls ralph_done()          │ currentTaskIndex: 3
      │                                    │ subagentResults: [A,B,C]
──────┼────────────────────────────────────┼─────────────────
T13   │ No more tasks                     │ status: COMPLETED
      │ Output: <promise>COMPLETE</promise>│
──────┴────────────────────────────────────┴─────────────────
```

## Error Handling Flow

```
┌────────────────────────────────────────────────────────────┐
│                  Error Handling Strategy                    │
└────────────────────────────────────────────────────────────┘

Subagent Failure
      │
      ▼
┌─────────────────┐
│ Attempt 1       │────Failed────┐
└─────────────────┘              │
                                 ▼
                         ┌─────────────────┐
                         │ Attempt 2       │────Failed────┐
                         └─────────────────┘              │
                                                          ▼
                                                  ┌──────────────┐
                                                  │ Max Retries  │
                                                  │ Reached      │
                                                  └───────┬──────┘
                                                          │
                         ┌────────────────────────────────┤
                         │                                │
                         ▼                                ▼
                  Record Failure                   Pause Loop
                         │                                │
                         ▼                                │
                  Save State                              │
                         │                                │
                         └────────────────────────────────┤
                                                          │
                                                          ▼
                                                  Notify User
                                                          │
                                                          ▼
                                            ┌─────────────────────┐
                                            │ User Options:       │
                                            │ 1. Fix & resume     │
                                            │ 2. Skip task        │
                                            │ 3. Cancel loop      │
                                            └─────────────────────┘
```

## Key Design Principles

1. **Separation of Concerns**
   - Ralph orchestrates
   - Main agent delegates
   - Subagent executes

2. **Explicit Control Flow**
   - No hidden automation
   - Manual delegation step
   - Clear verification points

3. **Persistence First**
   - State saved after every change
   - Resumable at any point
   - Full audit trail

4. **Progressive Enhancement**
   - Works without subagents (falls back)
   - Graceful degradation
   - Backward compatible

5. **User Visibility**
   - Clear progress indicators
   - Transparent delegation
   - Explicit completion markers
