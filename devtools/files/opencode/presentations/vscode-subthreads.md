---
title: Agent Delegation
sub_title: in VSCode 
author: Central Command
---

## The Challenge

<!-- speaker_note: Start with the fundamental constraint - we have limited context. This is the hook. -->

<!-- pause -->

- **Main thread:** Limited context window

<!-- pause -->

- **Token budget:** Precious resource

<!-- pause -->

- **Cognitive load:** Can't do everything at once

<!-- end_slide -->

## The Solution

<!-- speaker_note: Subthreads aren't magic. They're about focused context, not token multiplication. -->

Subthreads: Independent conversations handling heavy lifting

Each with **full capability** but **focused scope**

<!-- end_slide -->

## Architecture: Main vs Sub

<!-- speaker_note: Show the clear separation of concerns. Main thread orchestrates, subthreads execute. -->

<!-- column_layout: [1, 1] -->

<!-- column: 0 -->

### Main Thread

- Strategic direction
- Decision-making
- Synthesis & validation
- Orchestration

<!-- column: 1 -->

### Subthread

- Research & exploration
- Implementation
- Heavy lifting & details
- Domain-focused work

<!-- end_slide -->

## How to Delegate in VSCode

<!-- speaker_note: Walk through the actual mechanics. This is hands-on. -->

**Spawn a subthread via chat:**

<!-- pause -->

```md
Use a subagent to research authentication patterns
in @packages/auth/src
```

<!-- pause -->

→ Subthread gets isolated context for just that package

<!-- end_slide -->

## Context Passing: Key Patterns

<!-- speaker_note: These are the essential techniques for effective delegation. Show examples. -->

<!-- column_layout: [1, 1] -->

<!-- column: 0 -->

### Pattern 1: File References

```md
@packages/functions/src/api/index.ts:712
```

Exact location without copy-paste bloat

<!-- column: 1 -->

### Pattern 2: Constraints

```md
Implement in @src/services/process.ts

Do NOT modify auth layer
```

Prevents scope creep

<!-- end_slide -->

## Automatic Context Injection

<!-- speaker_note: This is the productivity hack - you don't manually pass everything. The system does it. -->

Subthreads **automatically receive:**

<!-- pause -->

- Project guidelines (from `.claude/contexts/`)
- Git state & worktree detection

<!-- pause -->

- Planning artifacts (EPICs, SPECs, TASKs)
- Related decisions (auto-loaded from metadata)

<!-- end_slide -->

## Subthread Result Format

<!-- speaker_note: Understanding the result format helps you consume the output correctly. -->

Subthreads return **structured results:**

```json
{
  id: string,
  res: string | object,
  err?: Error
}
```

<!-- pause -->

**Main thread consumes via:**

1. Promise resolution (matching request ID)
2. Deferred tasks (async completion)
3. Direct callback (event-driven)

<!-- end_slide -->

## Context Isolation = Multiplied Capacity

<!-- speaker_note: This is the core insight. Show them how focused context creates real capacity. -->

```
Main:       [████████████] 200K   (everything mixed)

Subthread1: [████████████] 200K   (React only)
Subthread2: [████████████] 200K   (Go only)
Subthread3: [████████████] 200K   (API only)

Result: 600K+ focused capacity vs 200K bloated
```

<!-- pause -->

**The trick:** Each subthread ignores 90% of your codebase

<!-- end_slide -->

## Parallelization: When to Scale

<!-- speaker_note: These are safe to parallelize - no contention. Explain the danger of the others. -->

<!-- column_layout: [1, 1] -->

<!-- column: 0 -->

### ✓ DO Parallelize

- Independent investigations
- Different problem domains
- Read-only analysis
- No shared state modification

<!-- column: 1 -->

### ✗ DON'T Parallelize

- Same file edits → **Conflicts**
- Sequential gates → **Race conditions**
- Shared state mods → **Ordering matters**

<!-- end_slide -->

## Prompting: Good vs Bad

<!-- speaker_note: This is where most people fail. Walk through both examples and the differences. -->

<!-- column_layout: [1, 1] -->

<!-- column: 0 -->

### ✗ Bad Prompt

```
Figure out how to do this thing
and give me code
```

Vague scope. No deliverable. Too open.

<!-- column: 1 -->

### ✓ Good Prompt

```
Research X pattern in Y codebase

Return: 3 examples with file 
paths + line numbers

Constraints: TypeScript only
```

Clear. Specific. Bounded. Testable.

<!-- end_slide -->

## Best Practices Checklist

<!-- speaker_note: A quick reference guide. Use this before every delegation. -->

<!-- pause -->

- ✓ **Scope:** What exactly is the job?
- ✓ **Context:** What does it need to know?
- ✓ **Criteria:** How do we know it worked?

<!-- pause -->

- ✓ **Deliverable:** What format/structure?
- ✓ **Constraints:** What's off-limits?

<!-- end_slide -->

## Decision Tree: Delegate or Stay Local?

<!-- speaker_note: Quick mental model. When are subthreads worth the setup cost? -->

```
Heavy research?              → YES → Delegate
Boilerplate work?            → YES → Delegate
Parallel-safe analysis?      → YES → Delegate
Quick decision?              → YES → Stay local
Context already loaded?      → YES → Stay local
Single-step operation?       → YES → Stay local
```

<!-- end_slide -->

## Real Example: Feature Implementation

<!-- speaker_note: Walk through a concrete real-world example. -->

**Main thread:** "Implement auth feature"

<!-- pause -->

**Subthread 1:** Research OAuth patterns in @packages/auth

<!-- pause -->

**Subthread 2:** Implement login form in @packages/ui

<!-- pause -->

**Subthread 3:** Write integration tests

<!-- pause -->

**Main thread:** Synthesizes, validates, commits

<!-- end_slide -->

## Questions?

<!-- speaker_note: End with openness. Good presentations leave room for dialogue. -->
