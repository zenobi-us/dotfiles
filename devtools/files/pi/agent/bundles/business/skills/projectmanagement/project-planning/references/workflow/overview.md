# Project Planning Workflow Overview (Miniproject-Aligned)

## Artifact Model
Project Constitution → Idea → Epic → Story → Task

Project Constitution is a required singleton governing artifact.
Supporting artifacts: Research, Decision, Learning, Retrospective.

## Escalation Matrix (strategic)
Escalate to Q for: scope changes, timeline shifts >1 week, major refactors, resource constraints.

## Lifecycle
1. Planning — Idea/Epic/Story/Phase/Task definition
2. Execution — Task execution and Story test gates
3. Closing — Epic closeout and archival prep
4. Retrospective — Learning capture + unresolved decision review

## Relationship Diagram
```text
[Project Constitution]
          |
          v
[Idea] -> [Epic] -> [Story] -> [Task]
               |         |         |
               v         v         v
         [Research]  [Decision] [Learning]
               \        |         /
                \-------v--------/
                  [Retrospective]
```

## Agent Decision Model
Agents MAY make tactical updates (statuses, links, artifact sequencing).
Agents MUST escalate strategic changes to Q.
