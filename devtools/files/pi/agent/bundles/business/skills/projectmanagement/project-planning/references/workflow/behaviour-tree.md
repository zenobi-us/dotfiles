# Behaviour Tree (Miniproject-Aligned)

```text
ROOT
├─ Initialise Context
│  ├─ Load workflow + status + relationship refs
│  └─ Identify requested action
├─ Planning Branch
│  ├─ Ensure Epic exists
│  ├─ Validate Stories (acceptance criteria + test spec)
│  ├─ Validate phase planning sections in Epic
│  ├─ Validate Tasks (MUST include phase_id; SHOULD include story_id)
│  └─ Escalate strategic ambiguity to Q
├─ Execution Branch
│  ├─ Move tasks through status flow
│  ├─ Validate task->story->AC traceability
│  ├─ Enforce story completion gate (test_coverage=full)
│  └─ Escalate blockers/drift to Q
├─ Closing Branch
│  ├─ Finalize epic/story/task statuses
│  ├─ Link unresolved decisions
│  └─ Distill learning artifacts
└─ Retrospective Branch
   ├─ Review unresolved decisions
   ├─ Capture wins/failures/lessons/actions
   └─ Mark retrospective complete
```
