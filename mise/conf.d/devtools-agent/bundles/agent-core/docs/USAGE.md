# Worktree workflow diagrams

## 1. Component map — who owns what

This view separates workflow control, record locations, agent sessions, and Git operations.

```mermaid
flowchart LR
    U["You"] --> R["worktree router"]
    R --> P["Selected playbook"]
    P -->|canonical issue| T["Ticket skill"]
    P -->|resolve paths and refs| C["shared-context"]
    P -->|create, merge, remove| W["Worktrunk"]
    P -->|open, wait, read, close| M["muxer-subagents"]
    W --> G[("Source Git worktree")]
    M --> A["Fresh agent session"]
    A --> G
    C --> E[("Workflow records<br/>repository store here")]
    P -->|phase-start and phase-complete receipts| E
    A -->|phase-result receipts and artifacts| E
```

## 2. Sequence diagram — what happens when you act

This view makes the key session rule visible: implementation and review use **different agent sessions in the same source worktree**. A completion signal prompts receipt verification; it is not the durable workflow record.

```mermaid
sequenceDiagram
    actor U as You
    participant P as Worktree playbook
    participant C as shared-context
    participant W as Worktrunk
    participant M as muxer-subagents

    U->>P: start(ticket)
    P->>C: resolve workflow(ticket)
    C-->>P: record path and ref
    P->>W: create source worktree
    P->>P: append start receipt
    P->>M: launch implementation in a new pane
    M-->>P: completion signal and output
    P->>P: verify result receipt and close pane

    U->>P: review(ticket)
    P->>P: freeze source commit and tree
    P->>M: launch reviewer in a fresh pane
    Note over P,M: Same worktree, new agent session
    M-->>P: completion signal and output
    P->>P: verify review receipt and artifact, then close pane
```

## 3. State diagram — what permits the next command

This view exposes the safety rule a sequence can hide: **a review verdict applies only to its recorded source commit and tree**. A fix or later source change requires another review. Submission is optional; `finish` can follow a successful review directly or a submitted pull request.

```mermaid
stateDiagram-v2
    [*] --> Implementing : start
    Implementing --> Reviewable : implementation validated
    Reviewable --> Reviewing : review current commit
    Reviewing --> NeedsFix : FAILURE
    NeedsFix --> Reviewable : validated fix creates new commit
    Reviewing --> Approved : SUCCESS for current commit and tree
    Approved --> Reviewable : source changes
    Approved --> Submitted : submit optional pull request
    Submitted --> Reviewable : source changes
    Approved --> Finishing : finish
    Submitted --> Finishing : explicit finish
    Finishing --> Finished : merge, push, close ticket, remove worktree
    Finishing --> FinishFailed : failure preserves resources
```

## Live Node Workshop

The [Vite Node Workshop](diagram-gallery/) presents these three diagrams as full-width blocks. It reads their Mermaid source from this file through `mq`. The component map is draggable and zoomable with React Flow; the session handoff and review gates remain Mermaid.

Run it from `diagram-gallery/`:

```sh
bun install
bun run dev
```

Open `http://127.0.0.1:4389/`. On narrow screens, scroll inside each diagram frame to see the full diagram.
