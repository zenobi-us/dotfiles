---
name: miniproject
description: Simple local project and knowledge management useing markdown files (MDTM).
---

# Markdown Driven Task Management

This is a simplified and concise project management AI memory framework.

> [!NOTE]
> **CRITICAL** Before doing any work:
> 1. Find the memory store using the helper script:
>    ```bash
>    MEMORY_DIR=$(scripts/miniproject.sh memory-dir)
>    ```
>    - This handles git worktrees automatically (finds `.memory/` in the main worktree)
>    - Use `--create` flag to create the directory if it doesn't exist
> 2. Ensure the following files exist in `.memory/`:
>   - read `.memory/todo.md`, `.memory/summary.md`, `.memory/team.md`, and `.memory/roadmap.md` (use grep/ls, not the glob or list tool)
>   - if `.memory/` is missing these files, then create them.
> 3. Initialise the knowledge codemap if it does not exist:
>   - create a file `.memory/knowledge-codemap.md` with an ascii statemachine diagram representing your understanding of the codebase.
>   - this is critical for understanding the project structure and flow.
> 4. Always read `.memory/summary.md`, `.memory/todo.md`, `.memory/team.md`, and `.memory/roadmap.md` before starting any work.
> 5. Always update `.memory/team.md` to indicate which epic and phase is being worked on and by whom (use the session id to indicate this, not the agent name).
> 6. Always keep `.memory/todo.md` up to date at every step.
> 7. Always commit changes after completing a task or phase. NEVER PUSH CHANGES WITHOUT HUMAN REVIEW.
> 8. Follow the file naming conventions strictly


## Rule 0: The Memory Store

The `.memory/` directory is critical. All project management and knowledge files must be stored here.


## Rule 0.1: Locating the Memory Store

Use the helper script to find the memory directory:

```bash
# Find the .memory directory (fails if not found)
MEMORY_DIR=$(scripts/miniproject.sh memory-dir)

# Find or create the .memory directory
MEMORY_DIR=$(scripts/miniproject.sh memory-dir)
```

The script handles:
- Git worktrees (finds `.memory/` in the main worktree, not the worktree checkout)
- Regular git repositories
- Returns the absolute path to `.memory/`

> [!WARNING]
> `.memory/` may be gitignored, so normal file listing tools (Glob, List, ripgrep) may not work as expected.

## Rule 0.2: Saving Memory Store

When editing or creating files in `.memory/`, always:

1. use git to commit changes, with the memory store as the working directory.


## Rule 1: Filename Conventions

Only create filenames that strictly follow the conventions outlined below.

Any file that does not follow the conventions is invalid and must be examined for purpose and either: 

1. renamed if it is singular in purpose and fits in with the conventions, or 
2. split into multiple files that fit the conventions, or 
3. deleted if it is covered by other files.

Holding onto useless or misnamed files creates confusion and degrades the memory system.

## Guidelines

- [core] store findings in `.memory/` directory
- [core] all notes in `.memory/` must be in markdown format
- [core] Archived stories, tasks and epics get moved to the archive directory: `.memory/archive/`.
- [core] `summary.md`, `todo.md`, `team.md`, `roadmap.md`, `knowledge-*.md` are special files that provide project snapshot, outstanding tasks, ownership, future direction, and knowledge context respectively.
- [core] `.memory/knowledge-codemap.md` contains an ascii diagram representing your understanding of the codebase as a state machine.
- [core] `.memory/knowledge-data-flow.md` contains an ascii diagram representing data flow
- [core] Other `.memory/knowledge-*.md` files can be created to document specific knowledge areas.
- [core] except for special files (`summary.md`, `todo.md`, `team.md`, `roadmap.md`, `knowledge-*.md`), notes in `.memory/` must follow `.memory/<type>-<8_char_hashid>-<title>.md`
- [core] where `<type>` is one of: `idea`, `research`, `epic`, `task`, `story`, and `learning`
- [core] `<8_char_hashid>` is a unique 8 character hash identifier for the file.
- [core] when initialising, create a codemap of exiting codebase, ensure there is a state machine ascii diagram representing your understanding of the codebase in `.memory/knowledge-codemap.md`.
- [core] every project MUST start with idea capture or epic definition before stories or tasks are created
- [core] Always keep `.memory/summary.md` and `.memory/roadmap.md` up to date with current execution and future direction. Prune incorrect or outdated information.
- [git] Always commit changes after completing a task or phase. 
- [git] NEVER PUSH CHANGES WITHOUT HUMAN REVIEW.
- [git] when committing changes, follow conventional commit guidelines.
- [git] Use clear commit messages referencing relevant files for changes.


## Conceptual Model: Ideas, Stories, Phases, and Tasks

Understanding the relationship between these artifacts is critical:

```
Idea (future opportunity)
 └── promotes to Epic when validated
      ├── Stories (WHAT - phase-agnostic requirements)
      │    └── Stories define what users need, independent of timeline
      │
      └── Phases (WHEN - inline sections in epic file)
           └── Phases define when work happens
                └── Tasks link to BOTH:
                     ├── story_id → the requirement being implemented (WHAT)
                     └── phase_id → the timeline slot (WHEN)
```
| Artifact | Concern | Links To | Phase-Agnostic? |
|----------|---------|----------|-----------------|
| Idea     | Opportunity | - / Epic (when promoted) | Yes |
| Epic     | Vision  | -        | Yes             |
| Story    | WHAT    | Epic     | **Yes**         |
| Phase    | WHEN    | Epic (inline) | No         |
| Task     | HOW + WHEN | Story + Phase | No      |
| Research | Discovery | Idea/Epic/Task | Yes     |
| Learning | Knowledge | -      | Yes             |
**Key insight:** Ideas are low-commitment future options. Epics are committed direction. Stories are requirements independent of schedule. Phases group scheduled tasks. Tasks bridge both worlds by linking to their story (what) and phase (when).


## Archiving 

- [archive] archive completed tasks and stories by moving their files to `.memory/archive/` directory.
- [archive] do NOT archive learning or research files. These are golden knowledge for future projects.
- [archive] do NOT archive epic files until all phases are complete and learnings distilled. Epics must have a link to distilled learnings before archiving.
- [archive] update `.memory/summary.md` to reflect completed phases and epics.
- [archive] phases are inline in epic files, so they are archived with the epic.

## Searching Memory [CRITICAL]

Because `.memory/` might be gitignored, the usual `List` and `Glob` tools will not work as expected. Use ripgrep with `--no-ignore` to bypass gitignore rules:

```bash
# First, get the memory directory path
MEMORY_DIR=$(scripts/miniproject.sh memory-dir)

# Search for terms (--no-ignore bypasses .gitignore)
rg --no-ignore "<search-term>" "$MEMORY_DIR/"

# Find outstanding tasks
rg --no-ignore "TODO" "$MEMORY_DIR/todo.md"

# List all memory files
ls -al "$MEMORY_DIR/"
```

> [!TIP]
> Use `rg -u` as shorthand for `rg --no-ignore`. Use `rg -uu` to also search hidden files.

## Templates

Each type of markdown file in `.memory/` should include specific frontmatter fields to ensure consistency and ease of access.

### Common Frontmatter Fields

- `id`: A unique 8-character hash identifier for the file.
- `title`: A concise title summarizing the content.
- `created_at`: Timestamp of when the file was created.
- `updated_at`: Timestamp of the last update to the file.
- `status`: indicates if `proposed`, `planning`, `todo`, `in-progress`, `blocked`, `completed`, `cancelled`, `archived`, `triaged`, `incubating`, `promoted`, or `rejected`.

### Common Sections

- `# {Title}`: The main title of the document.

### Template: Idea

Ideas capture potential future direction before epic commitment.

Frontmatter:

- all common frontmatter fields.
- `horizon`: One of `now`, `next`, `later`.
- `promote_criteria`: Conditions that must be true before creating an epic.
- `related_epic_id`: Populated when promoted. [optional]

Sections:

- all common sections.
- `## Problem/Opportunity`: What problem or opportunity this idea targets.
- `## Expected Impact`: Why this matters if pursued.
- `## Unknowns`: What must be researched or validated.
- `## Promotion Decision`: Outcome and rationale (`promoted` / `rejected` / `incubating`).

### Template: Task

Tasks implement stories within scheduled phases. They link to both their story (the "what") and their phase (the "when").

Frontmatter:

- all common frontmatter fields.
- `epic_id`: The unique identifier of the parent epic.
- `phase_id`: The phase this task is scheduled in (the "when" - required).
- `story_id`: The story this task implements (the "what" - required when a story exists).
- `assigned_to`: The session id of the agent or human responsible for the task.

> [!NOTE]
> **Dual-link model:** Tasks have two parent links serving different purposes:
> - `story_id` → Links to WHAT requirement this task fulfills
> - `phase_id` → Links to WHEN this task is scheduled
> 
> A task without a `story_id` is exploratory/infrastructure work. A task without a `phase_id` is unscheduled.

Sections:

- all common sections.
- `## Objective`: A clear statement of what the task aims to achieve.
- `## Related Story`: Link to the story this task implements (if applicable). Must include which acceptance criteria this task contributes to satisfying.
- `## Related Phase`: Link to the phase this task is scheduled in. Include the phase name and epic context.
- `## Steps`: A detailed list of steps to complete the task.
- `## Unit Tests`: A summary of unit tests written for this task. Each entry should state what is tested and which acceptance criterion of the parent story it supports. Format: `- [test name/file]: [what it verifies] → supports AC#N of story [hash]`. If the task has no parent story, document what the unit tests verify independently.
- `## Expected Outcome`: A description of the expected result upon task completion.
- `## Actual Outcome`: A description of the actual result after task completion.
- `## Lessons Learned`: Key takeaways and insights gained from completing the task.

### Template: Epic

Frontmatter:

- all common frontmatter fields.

Sections:

- all common sections.
- `## Vision/Goal`: A clear statement of the epic's overall vision and goals.
- `## Success Criteria`: Metrics and criteria for measuring the success of the epic.
- `## Stories`: A list of stories defining requirements for this epic (links to story files). Stories are phase-agnostic - they define WHAT needs to be built, not WHEN.
- `## Phases`: Inline phase sections (see format below). Phases define WHEN work happens and contain scheduled tasks.
- `## Dependencies`: Any dependencies that may impact the epic.

#### Phase Section Format (Inline in Epic)

Phases are defined as inline sections within the epic file, not as separate files:

```markdown
## Phases

### Phase 1: Foundation
- **Status**: completed
- **Start Criteria**: Epic approved
- **End Criteria**: Core data model implemented and tested
- **Tasks**:
  - [x] [task-abc12345-data-model](./task-abc12345-data-model.md)
  - [x] [task-def67890-basic-api](./task-def67890-basic-api.md)
- **Notes**: Completed ahead of schedule

### Phase 2: Core Features  
- **Status**: in-progress
- **Start Criteria**: Phase 1 complete
- **End Criteria**: All core user stories have passing tests
- **Tasks**:
  - [x] [task-ghi11111-auth-flow](./task-ghi11111-auth-flow.md)
  - [ ] [task-jkl22222-user-dashboard](./task-jkl22222-user-dashboard.md)
- **Notes**: Auth complete, dashboard in progress

### Phase 3: Polish & Launch
- **Status**: planned
- **Start Criteria**: Phase 2 complete
- **End Criteria**: Production deployment successful
- **Tasks**: (to be assigned during task breakdown)
```

### Template: Story

Stories capture user requirements. They are **phase-agnostic** - a story defines WHAT users need, independent of WHEN it will be implemented.

Frontmatter:

- all common frontmatter fields.
- `epic_id`: The unique identifier of the parent epic.
- `priority`: Priority level (e.g., `critical`, `high`, `medium`, `low`).
- `story_points`: Estimated effort/complexity (optional, e.g., `1`, `2`, `3`, `5`, `8`, `13`).
- `test_coverage`: Whether all acceptance criteria have linked passing tests. One of: `none`, `partial`, `full`.

> [!NOTE]
> Stories do NOT have a `phase_id`. Stories are requirements, not scheduled work.
> Tasks link to stories (what they implement) AND phases (when they're scheduled).

Sections:

- all common sections.
- `## User Story`: The user story statement in the format: "As a [persona], I want [goal] so that [benefit]."
- `## Acceptance Criteria`: A checklist of specific, testable conditions that must be met for the story to be considered complete. Use `- [ ]` for incomplete and `- [x]` for completed criteria.
- `## Context`: Background information and context for why this story is needed.
- `## Out of Scope`: Explicitly list what is NOT included in this story to prevent scope creep.
- `## Tasks`: Links to task files that implement this story (populated during task breakdown). Each task will also reference a phase for scheduling.
- `## Test Specification`: Maps each acceptance criterion to its verification. Contains two subsections:
  - `### E2E Tests`: A table mapping each acceptance criterion to its e2e test case. One story = one e2e test suite/file. Each acceptance criterion = one test case within that suite. Format: `| AC# | Criterion | Test file/case | Status |`
  - `### Unit Test Coverage (via Tasks)`: A list of tasks spawned by this story, with a summary of what each task's unit tests verify and how that contributes to satisfying the story's acceptance criteria. Format: `- Task [hash]: [unit test summary] → satisfies AC#N`
- `## Notes`: Additional notes, edge cases, or considerations.

> [!NOTE]
> Stories are the bridge between business requirements and technical tasks.
> - Stories capture the "what" and "why" from a user perspective.
> - Tasks capture the "how" from an implementation perspective.
> - A single story may spawn multiple tasks across different phases.
> - Acceptance criteria should be written before tasks are created.

> [!NOTE]
> **Stories are the primary test target.**
> - **E2E tests verify stories.** Each story produces one e2e test suite. Each acceptance criterion becomes one test case within that suite. The relationship is 1 story : 1 test suite, N acceptance criteria : N test cases.
> - **Unit tests verify tasks.** Unit tests are scoped to tasks (implementation), not stories (requirements). They trace to stories *through* their parent task: `story.acceptance_criteria → task.objective → task.unit_tests`.
> - A story cannot be marked `completed` until `test_coverage` is `full` — meaning every acceptance criterion has a linked, passing test.

### Template: Research

Frontmatter:

- all common frontmatter fields.
- `epic_id`: The unique identifier of the parent epic.
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


### Template: Knowledge Codemap

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
1. `Idea` > `Idea Capture` > `Triage` > (`Epic Definition` OR `Incubate` OR `Reject`) > `Research` > `Story Definition` (incl. Test Specification) > `Phase Planning` > Human Review > `Task Breakdown` > Stop
2. `Task Execution` (incl. Unit Tests) > `Learning Distillation` > repeat 
3. `Story Completion` > verify acceptance criteria + test coverage gate > `Phase Completion` > `Learnings Distillation` > Human Review > Stop
4. `Epic Completion` > `Epic Summary & Learnings` > Human Review > Stop
5. `Maintenance Actions` as needed.
6. `Status` > Stop

Outlined below are the detailed steps for each stage of the project lifecycle.

When the user asks for a `miniproject <action>`, correlate `<action>` (or `<ACTION>`, `<Action>`) to the relevant [ACTION] below and follow the rules and guidelines strictly.

### Initialisation Action [INITIALISE]

- [core] locate or create the memory directory:
  ```bash
  MEMORY_DIR=$(scripts/miniproject.sh memory-dir)
  ```
- [core] ensure the following files exist in `$MEMORY_DIR/`:
  - `todo.md` (for tracking tasks)
  - `summary.md` (for project overview)
  - `team.md` (for team roles and assignments)
  - `knowledge-codemap.md` (for codebase understanding)
  - `knowledge-data-flow.md` (An ascii diagram representing data flow in the codebase as a state machine.)
  - `roadmap.md` (derived dashboard for ideas + epic pipeline)
- [core] if any of these files are missing, create them with appropriate headers and initial content
- [core] ask the user if they want to define a `constitution.md` file to outline project rules and guidelines. If yes, create the file with a template structure.

### Maintenance Actions

Sometimes the `.memory/` directory needs maintenance. Use these actions as needed.

#### Action: Summarize Memory [SUMMARIZE-MEMORY]

- [core] read all `.memory/` files and update `.memory/summary.md` and `.memory/roadmap.md` to reflect current epic, active phases, and future direction.
- [core] ensure `.memory/summary.md` is concise and easy to understand at a glance.
- [core] ensure `.memory/roadmap.md` surfaces active ideas (`idea-*.md`) and active/planned epics.


#### Action: Clean Up [CLEAN-UP]

- [tasks] move completed tasks to `.memory/archive/` directory.
- [learning] ensure all significant learnings are documented in `.memory/learning-<8_char_hash_id>-<title>.md` files.
- [stories] move completed stories to `.memory/archive/` directory after all their tasks are archived.


#### Action: Validate Memory [VALIDATE-MEMORY]

- [core] run schema validation via helper: `./scripts/miniproject.sh validate-memory` (or `./scripts/miniproject.sh validate-memory --repair` to auto-fix).


#### Action: Refine Constitution [REFINE-CONSTITUTION]

- [core] review and update `.memory/constitution.md` based on user input.
- [core] ensure all team members are aware of any changes to the constitution.
- [core] `.memory/constitution.md` is never updated unless asked to do so by a human.
- [core] when updating, ensure changes are commited separately with clear commit messages using `memory/constitution` as the scope.

### Status Action [STATUS]

- [core] provide a summary of the current epic, active phases, and next milestones based on `.memory/summary.md`.
- [core] list outstanding tasks from `.memory/todo.md`.
- [core] include roadmap alignment context from `.memory/roadmap.md`.
- [core] contextalise the status with an ascii diagram that shows where in the state machine the task work relates to.

### Planning Stages

#### Stage: Ideation [IDEA]

- [core] every project MUST start with idea capture or epic definition. If uncertainty is high, capture idea first.
- [core] when initialising, create a codemap of exiting codebase, ensure there is a state machine ascii diagram representing your understanding of the codebase in `.memory/knowledge-codemap.md`.
- [idea] capture each non-trivial future direction in `.memory/idea-<8_char_hash_id>-<title>.md`.
- [idea] run Q&A to evaluate value, risk, and feasibility, then set status to one of: `triaged`, `incubating`, `promoted`, `rejected`.
- [idea] when promoted, create an epic and set `related_epic_id` in the idea file.
- [idea] when rejected, document rationale in idea `## Promotion Decision` and optionally distill to learning.

#### Stage: Epic Definition [EPIC]

- [epic] EVERY project must begin with an epic that defines the overall goal and scope
- [epic] each epic should be documented in `.memory/epic-<8_char_hash_id>-<title>.md` files
- [epic] epics must include: vision/goal, success criteria, list of stories, phases (inline), overall timeline, and dependencies
- [epic] phases are inline sections in the epic file, not separate files
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
- [research] When doing user-led discovery/planning Q&A, record the full session verbatim in the research artifact: each question, all presented options, and the user's exact answer. Summaries are supplemental and must not replace verbatim Q&A.
- [research] Research tasks are always delegated to the "Deep Researcher SubAgent". Use what ever subagent, subthread, or delegation tool you have available to do this.
- [research] If you are a subagent, then focus only on the task you've been given. Do not deviate or delegate further.

#### Stage: Story Definition [STORY-DEFINITION]

- [story] stories capture user requirements with clear acceptance criteria before implementation begins
- [story] each story should be documented in `.memory/story-<8_char_hash_id>-<title>.md` files
- [story] stories MUST include a user story statement, acceptance criteria, and context
- [story] stories link to their parent epic only - stories are phase-agnostic requirements
- [story] stories do NOT have a `phase_id` - they define WHAT, not WHEN
- [story] acceptance criteria must be specific, testable, and written as a checklist
- [story] after writing acceptance criteria, populate the `## Test Specification` section:
  - define the e2e test suite name/file for this story
  - map each acceptance criterion to a named e2e test case
  - set `test_coverage: none` in frontmatter (updated as tests are written)
- [story] stories are written BEFORE tasks are created - tasks implement stories
- [story] a single story may result in multiple tasks scheduled across different phases
- [story] when all acceptance criteria are met and verified, mark the story as `completed`
- [story] stories help separate "what the user needs" from "how and when we implement it"

> [!NOTE]
> Story vs Phase vs Task:
> - **Story**: "As a user, I want to reset my password so that I can regain access to my account." (phase-agnostic requirement)
>   - Acceptance Criteria: "User receives email within 2 minutes", "Link expires after 24 hours", etc.
> - **Phase**: "Phase 2: User Authentication" - a time-bounded work container in the epic
> - **Tasks**: "Implement password reset API endpoint" (links to story + phase), "Create email template" (links to story + phase), etc.
> - **E2E Tests** (verify the story): `password-reset.e2e.spec` → test case per acceptance criterion
> - **Unit Tests** (verify the tasks): endpoint input validation, template rendering, token expiry logic, etc.

#### Stage: Phase Planning [PHASE-PLANNING]

- [phase] phases are inline sections within the epic file, not separate files
- [phase] each phase should have: status, start criteria, end criteria, and task list
- [phase] phases group TASKS (scheduled work), not stories (requirements)
- [phase] phases should have clear start and end criteria aligned with epic goals
- [phase] do not treat phases as a story list - phases contain tasks that implement stories
- [phase] update the epic's `## Phases` section to add new phases

> [!NOTE]
> Validation Steps:
> - After planning phases, always review with a human before proceeding to task breakdown.
> - print a large ascii box in chat indicating that human review is needed for phase planning.
> - wait for human to confirm before proceeding.

#### Stage: Task Breakdown [TASK-BREAKDOWN]

- [tasks] each task should be documented in `.memory/task-<8_char_hash_id>-<title>.md` files, including objectives, steps to take, outcome expected.
- [tasks] tasks MUST have dual links:
  - `story_id`: The story this task implements (the "what")
  - `phase_id`: The phase this task is scheduled in (the "when")
- [tasks] tasks without a story are infrastructure/exploratory work - document the objective clearly
- [tasks] tasks without a phase are unscheduled - assign to a phase before execution
- [tasks] tasks should be specific, measurable, achievable, relevant, and time-bound (SMART).
- [tasks] prioritize tasks based on impact and urgency.
- [tasks] when creating a task, also add it to the appropriate phase section in the epic file.
- [tasks] use `.memory/todo.md` to track remaining tasks. This file only contains links to `.memory/task-<8_char_hash_id>-<title>.md` files. [CRITICAL] keep `.memory/todo.md` up to date at every step.

### Execution Stages

#### Stage: Task Execution [TASK-EXECUTION]

- [tasks] always update checklists and progress in the task file. [CRITICAL] keep `.memory/todo.md` up to date at every step.
- [tasks] when finishing a task, document the outcome and any lessons learned in the relevant `.memory/task-<8_char_hash_id>-<title>.md` file.
- [tasks] update the task checkbox in the parent phase section of the epic file.
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
- [story] **TEST VERIFICATION GATE**: before marking a story as `completed`, verify:
  - every acceptance criterion in `## Test Specification > ### E2E Tests` has a linked, passing test case
  - every task listed in `## Test Specification > ### Unit Test Coverage` has documented its unit tests in its own `## Unit Tests` section
  - update `test_coverage` frontmatter: `none` → `partial` (some tests linked) → `full` (all criteria covered and passing)
  - a story CANNOT be marked `completed` while `test_coverage` is `none` or `partial`
- [story] once all criteria are verified AND `test_coverage` is `full`, update the story status to `completed`
- [story] stories are NOT archived until all linked tasks are archived - they remain as documentation of requirements and their fulfillment

#### Stage: Phase Completion [PHASE-COMPLETION]

- [phase] when finishing a phase, update the phase status to `completed` in the epic file
- [phase] ensure all tasks in the phase are marked complete (checkbox `[x]`)
- [phase] document any lessons learned in learning files
- [phase] when finishing a phase, compact relevant learnings and outcomes from research and tasks into `.memory/learning-<8_char_hash_id>-<title>.md` files. clean up `.memory/summary.md` and `./memory/todo.md`.
- [phase] archive completed tasks by moving their files to `.memory/archive/` directory

> [!NOTE]
> Validation Steps:
> - After completing a phase, review with a human before starting the next phase.
> - print a large ascii box in chat indicating that human review is needed for phase completion.
> - wait for human to confirm before proceeding.

#### Stage: Epic Completion [EPIC-COMPLETION]

- [epic] epic files are never archived until all phases are complete and learning is distilled
- [archive] do NOT archive epic files until all phases are complete and learnings distilled. epics much have a link to distilled learnings before archiving.
- [archive] update `.memory/summary.md` to reflect completed phases and completed epics.
- [archive] do NOT archive learning or research files. These are golden knowledge for future projects.

> [!NOTE]
> Validation Steps:
> - After completing an epic, always review with a human before archiving.
> - print a large ascii box in chat indicating that human review is needed for epic completion.
> - wait for human to confirm before proceeding.

## General Operating Steps

1. **[CRITICAL] If no epic exists, create one before any other work.** Define vision, success criteria, stories, and planned phases (inline).
2. update `.memory/team.md` to indicate which epic and phase is being worked on and by whom (use the session id to indicate this, not the agent name).
3. If there are any `[NEEDS-HUMAN]` tasks in `.memory/todo.md`, stop and wait for human intervention.
4. follow the research guidelines above.
5. when you are blocked by actions that require human intervention, create a task in `.memory/todo.md` listing what needs to be done by a human. tag it with `[NEEDS-HUMAN]` on the task line.
6. after completing a phase, update `.memory/summary.md` and `.memory/roadmap.md`, and prune other files as necessary.
7. after completing an epic, distill all learnings, update `.memory/summary.md`, and archive completed tasks/stories.
8. commit changes with clear messages referencing relevant files.


## Human Interaction

- If you need clarification or additional information, please ask a human for assistance.
- print a large ascii box in chat indicating that human intervention is needed, and list the tasks from `.memory/todo.md` inside the box.
- wait for human to complete the tasks before proceeding.
