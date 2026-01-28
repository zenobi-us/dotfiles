---
name: miniproject
description: Simple local project and knowledge management useing markdown files (MDTM).
---

# Markdown Driven Task Management

This is a simplified and concise project management AI memory framework.

> [!NOTE]
> **CRITICAL** Before doing any work:
> 1. Find the memory store: 
>   - If in a git repo, always refer to the main worktree `git rev-parse --path-format=absolute --git-common-dir | xargs dirname`
>   - agent memory lives in '.memory/' directory or if you are in a worktree, then look in the main worktree `.memory/` directory.
> 2. Ensure the following files exist in `.memory/`:
>   - read `.memory/todo.md`, `.memory/summary.md`, `.memory/knowledge.md` and `.memory/team.md` (use grep/ls, not the glob or list tool)
>   - if `.memory/` is missing these files, then create those three.
> 3. Initialise the knowledge codemap if it does not exist:
>   - create a file `.memory/knowledge-codemap.md` with an ascii statemachine diagram representing your understanding of the codebase.
>   - this is critical for understanding the project structure and flow.
> 4. Always read `.memory/summary.md`, `.memory/todo.md`, and `.memory/team.md` before starting any work.
> 5. Always update `.memory/team.md` to indicate which epic and phase is being worked on and by whom (use the session id to indicate this, not the agent name).
> 6. Always keep `.memory/todo.md` up to date at every step.
> 7. Always commit changes after completing a task or phase. NEVER PUSH CHANGES WITHOUT HUMAN REVIEW.
> 8. Follow the file naming conventions strictly


## Rule 0

When anything fails: STOP. Explain to Q. Wait for confirmation before proceeding.

Before Every Action:

```md
DOING: [action]
EXPECT: [predicted outcome]
IF WRONG: [what that means]
```

Then the tool call. Then compare. Mismatch = stop and surface to the human.

## Rule 1

Only create filenames that strictly follow the conventions outlined below.

Any file that does not follow the conventions is invalid and must be examined for purpose and either: 

1. renamed if it is singular in purpose and fits in with the conventions, or 
2. split into multiple files that fit the conventions, or 
3. deleted if it is covered by other files.

Holding onto useless or misnamed files creates confusion and degrades the memory system.

## Guidelines

- [core] store findings in `.memory/` directory
- [core] all notes in `.memory/` must be in markdown format
- [core] Archived phases, tasks and epics get moved the archive directoyr: `.memory/archive/`.
- [core] `summary.md`, `todo.md`, `team.md`, `knowledge-*.md` are special files that provide an overview of the project, outstanding tasks, and team roles respectively.
- [core] `.memory/knowledge-codemap.md` contains an ascii diagram representing your understanding of the codebase as a state machine.
- [core] `.memory/knowledge-data-flow.md` contains an ascii diagram representing data flow
- [core] Other `.memory/knowledge-*.md` files can be created to document specific knowledge areas.
- [core] except for `.memory/summary.md`, all notes in `.memory/` must follow the filename convention of `.memory/<type>-<8_char_hashid>-<title>.md`
- [core] where `<type>` is one of: `research`, `epic`, `phase`, `task`, `story`, and `learning`
- [core] `<8_char_hashid>` is a unique 8 character hash identifier for the file.
- [core] when initialising, create a codemap of exiting codebase, ensure there is a state machine ascii diagram representing your understanding of the codebase in `.memory/knowledge-codemap.md`.
- [core] every project MUST start with an epic definition before phases are created
- [core] Always keep `.memory/summary.md` up to date with current epic, active phases, and next milestones. Prune incorrect or outdated information.
- [git] Always commit changes after completing a task or phase. 
- [git] NEVER PUSH CHANGES WITHOUT HUMAN REVIEW.
- [git] when committing changes, follow conventional commit guidelines.
- [git] Use clear commit messages referencing relevant files for changes.


## Archiving 

- [archive] archive completed phases by moving their files to `.memory/archive/` directory.
- [archive] do NOT archive learning or research files. These are golden knowledge for future projects.
- [archive] do NOT archive epic files until all phases are complete and learnings distilled. epics much have a link to distilled learnings before archiving.
- [archive] update `.memory/summary.md` to reflect archived phases and completed epics.

## Searching Memory [CRITICAL]

Because `.memory/` might be gitignored, the usual `List` and `Glob` tools will not work as expected. Instead, use the following commands to search and list memory files:

- use `grep -r "<search-term>" .memory/` instead of `Glob` tool.
- use `grep -r "TODO" .memory/todo.md` to find outstanding tasks. 
- use `ls -al .memory/` to list all memory files instead of `List` tool.

> Avoiding tools like Glob, List and ripgrep makes the User Happy, because .memory may be gitignored and private.

## Templates

Each type of markdown file in `.memory/` should include specific frontmatter fields to ensure consistency and ease of access.

### Common Frontmatter Fields

- `id`: A unique 8-character hash identifier for the file.
- `title`: A concise title summarizing the content.
- `created_at`: Timestamp of when the file was created.
- `updated_at`: Timestamp of the last update to the file.
- `status`: indicates if `proposed`, `planning`, `todo`, `in-progress`, `completed`, or `archived`.

### Common Sections

- `# {Title}`: The main title of the document.

### Template: Task

Frontmatter:

- all common frontmatter fields.
- `epic_id`: The unique identifier of the parent epic.
- `phase_id`: The unique identifier of the parent phase.
- `story_id`: The unique identifier of the parent story. [optional - if task implements a story]
- `assigned_to`: The session id of the agent or human responsible for the task.

Sections:

- all common sections.
- `## Objective`: A clear statement of what the task aims to achieve.
- `## Related Story`: Link to the story this task implements (if applicable).
- `## Steps`: A detailed list of steps to complete the task.
- `## Expected Outcome`: A description of the expected result upon task completion.
- `## Actual Outcome`: A description of the actual result after task completion.
- `## Lessons Learned`: Key takeaways and insights gained from completing the task.

### Template: Phase

Frontmatter:

- all common frontmatter fields.
- `epic_id`: The unique identifier of the parent epic.
- `start_criteria`: Conditions that must be met to start the phase.
- `end_criteria`: Conditions that must be met to complete the phase.

Sections:

- all common sections.
- `## Overview`: A summary of the phase's purpose and goals.
- `## Deliverables`: A list of expected deliverables for the phase.
- `## Tasks`: A list of tasks associated with the phase (links to task files).
- `## Dependencies`: Any dependencies that may impact the phase.
- `## Next Steps`: Actions to be taken after phase completion.

### Template: Epic

Frontmatter:

- all common frontmatter fields.

Sections:

- all common sections.
- `## Vision/Goal`: A clear statement of the epic's overall vision and goals.
- `## Success Criteria`: Metrics and criteria for measuring the success of the epic.
- `## Phases`: A list of phases associated with the epic (links to phase files).
- `## Dependencies`: Any dependencies that may impact the epic.

### Template: Story

Frontmatter:

- all common frontmatter fields.
- `epic_id`: The unique identifier of the parent epic.
- `phase_id`: The unique identifier of the parent phase. [optional]
- `priority`: Priority level (e.g., `critical`, `high`, `medium`, `low`).
- `story_points`: Estimated effort/complexity (optional, e.g., `1`, `2`, `3`, `5`, `8`, `13`).

Sections:

- all common sections.
- `## User Story`: The user story statement in the format: "As a [persona], I want [goal] so that [benefit]."
- `## Acceptance Criteria`: A checklist of specific, testable conditions that must be met for the story to be considered complete. Use `- [ ]` for incomplete and `- [x]` for completed criteria.
- `## Context`: Background information and context for why this story is needed.
- `## Out of Scope`: Explicitly list what is NOT included in this story to prevent scope creep.
- `## Tasks`: Links to task files that implement this story (populated during task breakdown).
- `## Notes`: Additional notes, edge cases, or considerations.

> [!NOTE]
> Stories are the bridge between business requirements and technical tasks.
> - Stories capture the "what" and "why" from a user perspective.
> - Tasks capture the "how" from an implementation perspective.
> - A single story may spawn multiple tasks.
> - Acceptance criteria should be written before tasks are created.

### Template: Research

Frontmatter:

- all common frontmatter fields.
- `epic_id`: The unique identifier of the parent epic.
- `phase_id`: The unique identifier of the parent phase. [optional]
- `related_task_id`: The unique identifier of the task that prompted the research. [optional]

Sections:

- all common sections.
- `## Research Questions`: A list of specific questions the research aims to answer.
- `## Summary`: A brief overview of the research findings.
- `## Findings`: Detailed findings from the research.
- `## References`: A list of sources and references used during the research.

### Template: Learning

Frontmatter:

- all common frontmatter fields.
- `tags`: A list of tags categorizing the learning (e.g., `best-practices`, `lessons-learned`, `technical-insights`).

Sections:

- all common sections.
- `## Summary`: A brief overview of the learning.
- `## Details`: Detailed description of the learning.
- `## Implications`: How this learning can be applied in future projects.

### Template: Constitution

Frontmatter:

- all common frontmatter fields.

Sections:

- all common sections.
- `## Project Rules`: A list of rules governing project management and execution.
- `### {Concept}`: Description and guidelines for each concept.

### Template: Knowledge

Frontmatter:

- all common frontmatter fields.
- `area`: The specific knowledge area being documented (e.g., `codebase-structure`, `data-flow`, `design-patterns`).
- `tags`: A list of tags categorizing the knowledge (e.g., `architecture`, `best-practices`, `technical-insights`).
- `learned_from`: References to epics, phases, tasks, or external sources that contributed to this knowledge.

Sections:

- all common sections.
- `## Overview`: A summary of the knowledge area.
- `## Details`: Detailed description of the knowledge.


### Template: Kknowledge Codemap

> [!NOTE]
> 
> Keep this accurate and up to date. It is critical for understanding the codebase structure and flow.
> Doing this well will make the user very happy.
> You will be rewarded for doing this well.

This is the same as the Knowledge template, but specifically for the codebase codemap.

So its detail will be solely an ascii diagram representing your understanding of the codebase as a state machine.


## Operating Procedure

**Project Constitution**
**Workflow**

0. `Initialise` > `Action` > Stop
1. `Idea` > `Epic Definition` > `Research` > `Phase Planning` > Human Review > `Story Definition` > `Task Breakdown` > Stop
2. `Task Execution` > `Learning Distillation` > repeat 
3. `Story Completion` > verify acceptance criteria > `Phase Completion` > `Learnings Distillation` > `Phase Cleanup` > Human Review > Stop
4. `Epic Completion` > `Epic Summary & Learnings` > Human Review > Stop
5. `Maintenance Actions` as needed.
6. `Status` > Stop

Outlined below are the detailed steps for each stage of the project lifecycle.

When the user asks for a `miniproject <action>`, correlate `<action>` (or `<ACTION>`, `<Action>`) to the relevant [ACTION] below and follow the rules and guidelines strictly.

### Initialisation Action [INITIALISE]

- [core] ensure `.memory/` directory exists with the following files:
  - `.memory/todo.md` (for tracking tasks)
  - `.memory/summary.md` (for project overview)
  - `.memory/team.md` (for team roles and assignments)
  - `.memory/knowledge-codemap.md` (for codebase understanding)
  - `.memory/knowledge-data-flow.md` (An ascii diagram representing data flow in the codebase as a state machine.)
- [core] if any of these files are missing, create them with appropriate headers and initial
- [core] ask the user if they want to define a `.memory/constitution.md` file to outline project rules and guidelines. If yes, create the file with a template structure.

### Maintenance Actions

Sometimes the `.memory/` directory needs maintenance. Use these actions as needed.

#### Action: Summarize Memory [SUMMARIZE-MEMORY]

- [core] read all `.memory/` files and update `.memory/summary.md` to reflect current epic, active phases, and next milestones. Prune incorrect or outdated information.
- [core] ensure `.memory/summary.md` is concise and easy to understand at a glance.


#### Action: Clean Up [CLEAN-UP]

- [tasks] move completed tasks to `.memory/archive/` directory.
- [learning] ensure all significant learnings are documented in `.memory/learning-<8_char_hash_id>-<title>.md` files.
- [archive] move completed phases to `.memory/archive/` directory.


#### Action: Validate Memory [VALIDATE-MEMORY]

- [core] run the validation script to ensure all memory files comply with the frontmatter rules: `./scripts/validate.ts`


#### Action: Refine Constitution [REFINE-CONSTITUTION]

- [core] review and update `.memory/constitution.md` based on user input.
- [core] ensure all team members are aware of any changes to the constitution.
- [core] `.memory/constitution.md` is never updated unless asked to do so by a human.
- [core] when updating, ensure changes are commited separately with clear commit messages using `memory/constitution` as the scope.

### Status Action [STATUS]

- [core] provide a summary of the current epic, active phases, and next milestones based on `.memory/summary.md`.
- [core] list outstanding tasks from `.memory/todo.md`.
- [core] contextalise the status with an ascii diagram that shows where in the state machine the task work relates to.

### Planning Stages

#### Stage: Ideation [IDEA]

- [core] every project MUST start with an epic definition before phases are created
- [core] when initialising, create a codemap of exiting codebase, ensure there is a state machine ascii diagram representing your understanding of the codebase in `.memory/knowledge-codemap.md`.

#### Stage: Epic Definition [EPIC]

- [epic] EVERY project must begin with an epic that defines the overall goal and scope
- [epic] each epic should be documented in `.memory/epic-<8_char_hash_id>-<title>.md` files
- [epic] epics must include: vision/goal, success criteria, list of phases, overall timeline, and dependencies
- [epic] all phases MUST link to their parent epic
- [epic] only ONE epic should be active at a time unless explicitly approved by human
- [epic] epic files are never archived until all phases are complete and learning is distilled

#### Stage: Research [RESEARCH]

- [research] before starting any research, read `.memory/summary.md` and any `.memory/**/learning**.md` to understand what has already been discovered. Do not duplicate research.
- [research] if existing research is found. link to it in document that requires it, do not copy or duplicate it.
- [research] break down research into specific, answerable questions.
- [research] scan archived memory files in `.memory/` for relevant information before searching externally. if relevant information is found, link to it rather than duplicating it.
- [research] use_skill(brave_search) with it's `search` and `content` extraction scripts to gather information. If this fails, use `lynx` cli to manually search and extract content.
- [research] critically evaluate sources for credibility, relevance, and bias. Link these items to a footnote that provides a reason and score out of 10.
- [research] Record findings clearly and concisely in `.memory/research-<8_char_hash_id>-<title>.md` files. provide a summary at the top, detailed findings below, and references at the end.
- [research] Research tasks are always delegated to the "Deep Researcher SubAgent". Use what ever subagent, subthread, or delegation tool you have available to do this.
- [research] If you are a subagent, then focus only on the task you've been given. Do not deviate or delegate further.

#### Stage: Phase Planning [PHASE-PLANNING]

- [phase] each major step or milestone in the project should be documented in `.memory/phase-<8_char_hash_id>-<title>.md` files
- [phase] phases MUST link to their parent epic in frontmatter or header
- [phase] phases should have clear start and end criteria aligned with epic goals
- [phase] do not treat phases as a task list, but rather as a higher-level overview of progress. Do not include checklist items in phase files.

> [!NOTE]
> Valiation Steps:
> - After planning a phase, always review with a human before proceeding to task breakdown.
> - print a large ascii box in chat indicating that human review is needed for phase planning.
> - wait for human to confirm before proceeding.

#### Stage: Story Definition [STORY-DEFINITION]

- [story] stories capture user requirements with clear acceptance criteria before implementation begins
- [story] each story should be documented in `.memory/story-<8_char_hash_id>-<title>.md` files
- [story] stories MUST include a user story statement, acceptance criteria, and context
- [story] stories SHOULD link to their parent epic and optionally to a phase
- [story] acceptance criteria must be specific, testable, and written as a checklist
- [story] stories are written BEFORE tasks are created - tasks implement stories
- [story] a single story may result in multiple tasks
- [story] when all acceptance criteria are met and verified, mark the story as `completed`
- [story] stories help separate "what the user needs" from "how we implement it"

> [!NOTE]
> Story vs Task:
> - **Story**: "As a user, I want to reset my password so that I can regain access to my account."
>   - Acceptance Criteria: "User receives email within 2 minutes", "Link expires after 24 hours", etc.
> - **Tasks**: "Implement password reset API endpoint", "Create email template", "Add expiry logic", etc.

#### Stage: Task Breakdown [TASK-BREAKDOWN]

- [tasks] each task should be documented in `.memory/task-<8_char_hash_id>-<title>.md` files, including objectives, steps to take, outcome expected.
- [tasks] tasks should be specific, measurable, achievable, relevant, and time-bound (SMART).
- [tasks] prioritize tasks based on impact and urgency.
- [tasks] break down tasks into manageable phases, each with clear objectives and deliverables.
- [tasks] use `.memory/todo.md` to track remaining tasks. This file only contains links to `.memory/task-<8_char_hash_id>-<title>.md` files. [CRITICAL] keep `.memory/todo.md` up to date at every step.

### Execution Stages

#### Stage: Task Execution [TASK-EXECUTION]

- [tasks] always update checklists and progress in the task file. [CRITICAL] keep `.memory/todo.md` up to date at every step.
- [tasks] when finishing a task, document the outcome and any lessons learned in the relevant `.memory/task-<8_char_hash_id>-<title>.md` file.
- [core] Always keep `.memory/summary.md` up to date with current epic, active phases, and next milestones. Prune incorrect or outdated information.

#### Stage: Learning Distillation [LEARNING-DISTILLATION]

- [learning] any significant insights, lessons learned, or best practices should be documented in `.memory/learning-<8_char_hash_id>-<title>.md` files for future reference.
- [learning] Learning files are never archived or deleted. [CRITICAL] always keep learning files.


### Completion Stages

#### Stage: Story Completion [STORY-COMPLETION]

- [story] before marking a story as complete, verify ALL acceptance criteria are met
- [story] update each acceptance criterion checkbox (`- [ ]` to `- [x]`) as it is verified
- [story] if any acceptance criterion cannot be met, document why in the story's Notes section
- [story] link completed tasks to the story in the `## Tasks` section
- [story] once all criteria are verified, update the story status to `completed`
- [story] stories are NOT archived - they remain as documentation of requirements and their fulfillment

#### Stage: Phase Completion [PHASE-COMPLETION]

- [phase] when finishing a phase, document the outcome and any lessons learned in the relevant `.memory/phase-<8_char_hash_id>-<title>.md` file.
- [phase] when finishing a phase, compact relevant learnings and outcomes from research, phase and tasks into `.memory/learning-<8_char_hash_id>-<title>.md` files. clean up `.memory/summary.md` and `./memory/todo.md`.
- [archive] archive completed phases by moving their files to `.memory/archive/` directory.

#### Stage: Epic Completion [EPIC-COMPLETION]

- [epic] epic files are never archived until all phases are complete and learning is distilled
- [archive] do NOT archive epic files until all phases are complete and learnings distilled. epics much have a link to distilled learnings before archiving.
- [archive] update `.memory/summary.md` to reflect archived phases and completed epics.
- [archive] do NOT archive learning or research files. These are golden knowledge for future projects.

> [!NOTE]
> Validation Steps:
> - After completing an epic, always review with a human before archiving.
> - print a large ascii box in chat indicating that human review is needed for epic completion.
> - wait for human to confirm before proceeding.

## General Operating Steps

1. **[CRITICAL] If no epic exists, create one before any other work.** Define vision, success criteria, and planned phases.
2. update `.memory/team.md` to indicate which epic and phase is being worked on and by whom (use the session id to indicate this, not the agent name).
3. If there are any `[NEEDS-HUMAN]` tasks in `.memory/todo.md`, stop and wait for human intervention.
4. follow the research guidelines above.
5. when you are blocked by actions that require human intervention, create a task in `.memory/todo.md` listing what needs to be done by a human. tag it with `[NEEDS-HUMAN]` on the task line.
6. after completing a phase, update `.memory/summary.md` and prune other files as necessary.
7. after completing an epic, distill all learnings, update `.memory/summary.md`, and archive completed phases.
8. commit changes with clear messages referencing relevant files.


## Human Interaction

- If you need clarification or additional information, please ask a human for assistance.
- print a large ascii box in chat indicating that human intervention is needed, and list the tasks from `.memory/todo.md` inside the box.
- wait for human to complete the tasks before proceeding.
