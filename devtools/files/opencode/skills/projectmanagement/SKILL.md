---
name: projectmanagement
description: Skill in managing projects effectively, including planning, execution, organising, monitoring, and closing.
---

<!--
Note To Skill Builder Assistant

I want this skill to help me manage lifecycle of initivatives in projects.
//-->

## Unknowns:

- [NEEDS CLARIFICATION] should we have sub skills for each of the different phases of project management (e.g., planning, execution, monitoring)?

## Requirements:

- use basicmemory mcp tools to read and write [Project Artifacts].
- Recognise types of [Project Artifacts]: [Spec], [Research], [Descision], [Epic], [Story], [Task], [Retrospective].
- Store [Project Artifacts] in basicmemory under the correct project context using [ProjectId].

## What are Project Artifact Types?

- [Epic]: A large body of work that is described by Stories. An [Epic] is always accompanied by a [Spec], they have a 1:1 relationship.
- [Spec]: A detailed description of the project's requirements and objectives. It leads to creation of one or more [Story].
- [Research]: Information gathering and analysis conducted to inform project decisions. [Research] can lead to or adjust creation of [Spec] and/or [Decision].
- [Decision]: A conclusion reached after evaluating options, often based on [Research]. [Decision] can influence [Spec] and project direction. [Decision] can also be documented as part of [Retrospective]. They can also be created during implentation of [Story] by executing [Task]. [Descision] with a status of "Unresolved" should be revisited in [Retrospective].
- [Story]: A smaller, manageable piece of work derived from an [Epic]. [Story] always contain "user stories". [Story] are always implemented by [Task].
- [Task]: A specific piece of work that needs to be completed as part of a [Story]. They are always linked to both a [Story] and an [Epic]. They can also be linked to other [Task] in interesting ways (e.g., blocking, dependent on, related to).

## Project Artifacts Require a ProjectId [CRITICAL]

Every [Project Artifact] must be associated with a [ProjectId] to ensure proper organization and retrieval.

We use this [ProjectId] when first interacting with basicmemory. (Or if required, on every interaction)

1. Identify the [ProjectId] using `task::bash:./scripts/get_project_id.sh`
2. Switch to the project context using `basicmemory_create_memory_project` if the project does not exist.
3. Use this [ProjectId] in all subsequent interactions with basicmemory to read or write [Project Artifacts].

## Where are [Project Artifacts] stored?

**CRITICAL** All [Project Artifacts] are interacted with via basicmemory mcp tools.
**FAILURE MODE** Interacting with [Project Artifacts] via the file system directly is not allowed and will lead to disorganization and loss of data.

- basicmemory_read_note - Read markdown notes
- basicmemory_read_content - Read file raw content by path
- basicmemory_view_note - View formatted notes
- basicmemory_write_note - Create/update markdown notes
- basicmemory_edit_note - Edit existing notes with operations
- basicmemory_move_note - Move notes to new locations
- basicmemory_delete_note - Delete notes by title
- basicmemory_canvas - Create Obsidian canvas files
- basicmemory_search_notes - Search across knowledge base
- basicmemory_search - Search for content across knowledge base
- basicmemory_fetch - Fetch full contents of search results
- basicmemory_recent_activity - Get recent activity
- basicmemory_build_context - Build context from memory URIs
- basicmemory_list_memory_projects - List all available projects
- basicmemory_create_memory_project - Create new projects
- basicmemory_delete_project - Delete projects
- basicmemory_list_directory - List directory contents
- basicmemory_sync_status - Check file sync status

## How do we store Project Artifacts in basicmemory?

This skill has access to templates for each artifact type.

- [Epic]: ./references/templates/epic_template.md
- [Spec]: ./references/templates/spec_template.md
- [Research]: ./references/templates/research_template.md
- [Decision]: ./references/templates/decision_template.md
- [Story]: ./references/templates/story_template.md
- [Task]: ./references/templates/task_template.md
- [Retrospective]: ./references/templates/retrospective_template.md

When creating or updating [Project Artifacts], use the corresponding template to ensure consistency.

## How are [Task] relationships described?

[Task] can be linked to other [Task] in interesting ways:

- Blocking: A [Task] that must be completed before another [Task] can begin. (e.g., Task A is blocking Task B)
- Dependent on: A [Task] that relies on the completion of another [Task]. (e.g., Task B is dependent on Task A)
- Related to: A [Task] that is connected to another [Task] but does not have a direct dependency. (e.g., Task C is related to Task A)
- Duplicate of: A [Task] that is a duplicate of another [Task]. (e.g., Task D is a duplicate of Task E)
- A [Task] with links to [Research] or [Decision] artifacts that influenced its creation.
- A [Task] linked to its parent [Story] and [Epic]. [CRITICAL]

### [Task] relationship schema

```markdown
---
title: { Task Title }
projectId: { ProjectId }
storyId: { Parent Story ID }
epicId: { Parent Epic ID }
status: { To Do | In Progress | Done | Blocked }
storyPoints: { Number of story points }
links:
  - type: blocking | dependent_on | related_to | duplicate_of
    ItemItem: { Linked Task ID }
  - type: influenced_by
    ItemItem: { Research or Decision ID }
---

{Task Body}
```

### [Task] content

The body of a [Task] is different depending on the type.

**[EPIC]**

Links:

- to a single [Spec].
- to one or more [Story].
- to one or more [Task] via linked [Story].

- Preamble.
- (heading) Objectives
- (heading) Scope
- (heading) Success Criteria

**[SPEC]**

Links:

- to a single [Epic].
- to one or more [Story].
- to one or more [Research].
- to one or more [Decision].

- Detailed preamble.
- (heading) Requirements
- (heading) Objectives
- (heading) Constraints
- (heading) Assumptions
- (heading) Success Criteria

**[STORY]**

Links:

- to a single [Epic].
- to a single [Spec].
- to one or more [Task].
- to one or more [Research].
- to one or more [Decision].

- Scenario description.
- (heading) User Stories (in BDD format)
- (heading) Acceptance Criteria

**[TASK]**

Links:

- to a single [Story].
- to a single [Epic].
- to other [Task] (blocking, dependent on, related to, duplicate of).
- to one or more [Research].
- to one or more [Decision].

- Specific work item description.
- (heading) Implementation Steps
- (heading) Out of Scope
- (heading) Definition of Done
- (heading) Notes
- (heading) Work Log (to be filled during execution)
- (heading) QA Testing Steps (to be filled out during execution)

## What is the lifecycle of a project initiative?

1. Initiation: Define the project at a high level, including objectives and scope. Create an [Epic] and associated [Spec].
   - Create an [Epic] artifact to represent the initiative.
   - Create a [Spec] artifact to detail the requirements and objectives. Mark any unknowns as [NEEDS CLARIFICATION]. [Research] artifacts can be created to gather more information.
   - Link the [Spec] to the [Epic].
   - Discuss and refine the [Spec] using a Conversational TodoList until all major points are resolved.
   - VALIDATION (Checklist must be completed before moving to next phase):
     - [ ] Ensure the [Epic] has a linked [Spec].
     - [ ] Ensure the [Spec] clearly outlines objectives and scope.
     - [ ] No remaining [NEEDS CLARIFICATION] tags in the [Spec].
     - [ ] Conversational TodoList contains no unresolved topics.

2. Planning: Break down the [Epic] into one or more [Story].

- Create [Story] artifacts for each major feature or requirement outlined in the [Spec].
- Link each [Story] to the [Epic] and [Spec].
- Link any [Research] or [Decision] artifacts that influenced the creation of the [Story].
- For each [Story], ensure it contains "user stories" that follow the BDD format (As a {user}, I want {feature}, so that {benefit}).
- VALIDATION (Checklist must be completed before moving to next phase):
  - [ ] Each [Story] is linked to the [Epic] and [Spec].
  - [ ] Each [Story] contains "user stories" in BDD format.
  - [ ] All major features from the [Spec] are covered by a [Story].

3. Planning: Break down each [Story] into required amount of [Task].

- Read the [Spec] and related [Story] to identify specific work items.
- Consider any [Research] or [Decision] that impact [Task] creation.
- A delivery schedule which outlines priorities for each [Task] will guide you declaring the order and dependencies.
- Consider "story points" or effort estimates for each [Task] to help with scheduling and resource allocation. Use fibonacci sequence for "story points" (1, 2, 3, 5, 8, 13, etc.).
- If a [Task] can be broken down further, split it into smaller atomic [Task]. Story points can help determine this:
  - If a [Task] is more than 8 story points, consider breaking it down.
   - If a [Task] is less than 3 story points, consider combining it with another related [Task]. But only if it doesn't violate the atomicity principle and if it makes sense contextually.
- Create one or more [Task] artifacts for each [Story], detailing the specific work needed to implement the Story.
- Link each Task to its parent Story and Epic.
- Identify links to other tasks where it blocks or depends on them.
- VALIDATION (Checklist must be completed before moving to next phase):
  - [ ] Delivered outputs of Tasks must usable and not interupt the user experience.
  - [ ] Tasks much be atomic, meaning they cannot be broken down further.
  - [ ] Story points must be assigned to each Task.
  - [ ] Each Task is linked to its parent Story and Epic.
  - [ ] All Stories have associated Tasks covering all implementation aspects.

4. Delegation: Assign Tasks to team members.

**use `skills_superpowers_dispatching_parallel_agents` and `skills_superpowers_subagent_driven_development` to manage team members and assignments.**

- Review the list of [Task] created in the previous phase.
- Consider the skills, availability, and workload of each team member.
- Request the agent communicate via the `sessions*` tools.
- Communicate assignments clearly, providing any necessary context or resources.
- Delegate work [Task] to the most suitable team member using the `task` tools.
- VALIDATION (Checklist must be completed before moving to next phase):
  - [ ] All Tasks have been assigned to team members.
  - [ ] Team members have acknowledged their assignments.
  - [ ] No team member is overloaded with tasks beyond their capacity.

5. Execution: Implement the delegated Tasks. (Executed by subagent)
   - [BLOCKED] If you are blocked. Stop and discuss with the user "[WARNING] BLOCKED"
   - [STARTING] If you are starting a new task use `skills_superpowers_using-git-worktrees` to create a new worktree for the task.
   - [CONTINUING] If you are continuing a task use `skills_superpowers_using-git-worktrees` to switch to the existing worktree for the task.
   - Work on the Tasks as per the defined priorities and schedule.
   - Update the status of Tasks as they progress (e.g., To Do, In Progress, Done, Blocked).
   - Document any Decisions made during implementation as Decision artifacts, linking them to relevant Stories or Tasks.
   - Completion of each tasks
   - If implementing a task uncovers unexpected information:
     - New requirements: Stop and discuss with the user "[WARNING] EDGE CASE DISCOVERED"
     - Unresolved decisions: Document them as Decision artifacts with status "Unresolved".
     - Blockers: Update the Task status to "Blocked" and link to the blocking Task. Discuss with the user.
   - VALIDATION (Checklist must be completed before moving to next phase):
     - [ ] All Tasks are marked as Done.
     - [ ] Any Decisions made are documented and linked appropriately.
     - [ ] No Tasks remain in Blocked status without resolution plans.

6. Monitoring and Controlling: Oversee project progress and make adjustments as needed.
   - Regularly review the status of all [Task] and overall project progress.
   - Respond to questions and issues raised by team members via `sessions*` tools.
   - Ensure that project stays on track with respect to timelines and objectives.
   - Update project artifacts as necessary to reflect changes or new information.
   - Identify any deviations from the plan and implement corrective actions:
     - If a Task is falling behind schedule, discuss with the assigned team member to understand the cause and adjust timelines or resources as needed.
     - If new risks are identified, document them and develop mitigation strategies.
     - Communicate any significant changes to the project plan to all stakeholders (the user).
    - VALIDATION (Checklist must be completed before moving to next phase):
      - [ ] Regular status updates are provided to the user.
      - [ ] Any deviations from the plan are documented and addressed.
      - [ ] Project artifacts are kept up-to-date with the latest information.

7. Closing and Retrospective: Complete the project and document lessons learned.
   - Conduct a [Retrospective] meeting with team members to review the project outcomes.
   - Review all completed [Task], [Story], and [Epic] artifacts.
   - Document all lessons learned, including:
     - What went well during the project.
     - What could be improved for future projects.
     - Key challenges and how they were resolved.
   - Link any unresolved [Decision] artifacts (status "Unresolved") to the [Retrospective].
   - Document any process improvements or recommendations for future initiatives.
   - Create a [Retrospective] artifact summarizing the review and outcomes.
   - Archive or close all related [Project Artifacts].
   - VALIDATION (Checklist must be completed before closing project):
     - [ ] [Retrospective] artifact has been created and documented.
     - [ ] All unresolved [Decision] artifacts have been linked to the [Retrospective].
     - [ ] Lessons learned have been documented comprehensively.
     - [ ] Project artifacts have been properly archived or closed.

