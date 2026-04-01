# Artifact Status Transitions

Each artifact type has valid status progressions that guide state management throughout the project lifecycle.

## [Epic] Status Flow

```
Active → (work in progress) → Completed
      ↘ (if deprioritized) → On Hold
      ↘ (if cancelled) → Cancelled
```

- **Active**: Project is underway
- **On Hold**: Work paused temporarily, can be resumed
- **Completed**: All child Stories and Tasks are done
- **Cancelled**: Project will not be completed

## [Spec] Status Flow

```
Draft → In Review → Approved
    ↘ (if rejected) → Draft (back to refinement)
    ↘ (if superseded) → Superseded (replaced by new spec)
```

- **Draft**: Being written, may have [NEEDS CLARIFICATION] tags
- **In Review**: Awaiting approval, all clarifications resolved
- **Approved**: Ready for Planning phase
- **Superseded**: Replaced by a newer version (link to new spec)

## [Story] Status Flow

```
To Do → In Progress → In Review → Done
    ↘ (if deprioritized) → Cancelled
    ↘ (if blocked) → Blocked (until unblocked)
```

- **To Do**: Ready for execution
- **In Progress**: Work started, at least one Task is in progress
- **In Review**: Work complete, awaiting acceptance
- **Done**: All acceptance criteria met, approved
- **Blocked**: Waiting on external dependency (document what blocks it)

## [Task] Status Flow

```
To Do → In Progress → In Review → Done
    ↘ (if blocked) → Blocked (until unblocked)
    ↘ (if deprioritized) → Cancelled
```

- **To Do**: Ready for work
- **In Progress**: Being actively worked on
- **In Review**: Code/work complete, awaiting approval
- **Done**: Definition of Done checklist complete
- **Blocked**: Waiting on another Task or external blocker (document reason)

## [Decision] Status Flow

```
Pending → Decided
      ↘ Unresolved (decision made but uncertain, needs revisiting)
      ↘ Superseded (replaced by new decision)
```

- **Pending**: Awaiting decision (analysis in progress)
- **Decided**: Decision made and documented
- **Unresolved**: Decision made but confidence low OR decision deferred (MUST review in Retrospective)
- **Superseded**: Original decision overridden by new decision (link to new decision)

## [Research] Status Flow

```
In Progress → Complete
          ↘ Inconclusive (insufficient data or unable to reach conclusion)
          ↘ Superseded (replaced by more recent research)
```

- **In Progress**: Research underway
- **Complete**: Findings documented and analysis complete
- **Inconclusive**: Investigation complete but conclusion unclear (document why)
- **Superseded**: Newer research or findings available (link to new research)

## [Retrospective] Status Flow

```
In Progress → Complete
```

- **In Progress**: Retrospective meeting underway, collecting feedback
- **Complete**: All feedback documented, action items assigned, lessons documented
