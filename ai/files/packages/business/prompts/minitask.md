
Use chained subagents together to complete a miniproject task. 
Each subagent can perform a specific function, and the results can be passed between them to achieve the desired outcome.
We use the pi-subagent extension to create a chain of subagents that will work together to complete the task.
Launching a chain of subagents requires us to declare the skills available to the subagents, and then we can start the chain by providing the necessary input for the task.
Asses the task details and use find_skills with a comma separated list of terms to find the relevant skills for the task.
Ensure we always declare that we want the miniproject skill to be available to the subagents, as it is essential for reading and understanding the task details, story AC, and epic information.

## Task 

```md
TaskId: $1
```

> [!NOTE]
> Validation Gate: if the TaskId is not valid or empty, the process should stop and report an error.

This will relate to a miniproject task file. The task file will contain the details of the task, including the steps to be taken, the checklist to be followed, and any relevant information about the story and epic it is part of.

## Additional Instructions

```md
${@:2}
```

## Process

Start task $1 in a subagent chain:

- Implementation Subagent
  - use the `miniproject` skill to read the task and the related story AC and the epic.
  - implement it, while following the steps/tasks/checklist. 
  - tick off the checklist as you go by editing the taskfile.
- Review Subagent
  - use the `miniproject` skill to read the task in the context of the story and epic.
  - review the code created by the implementation subagent. 
    - use any linting, typechecking, testing instructions provided by the projects AGENTS.md or other project directives.
  - Fix and report any gaps.

## Completion

When both subagents have finished use the miniproject skill to update the task file with the completion status, any relevant notes, and any changes made during the implementation and review process.
This includes commiting all changes.
