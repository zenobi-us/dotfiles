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
>   - create a file `.memory/knowledge-codemap.md` with an ascii diagram representing your understanding of the codebase.
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


## Guidelines

- [core] store findings in `.memory/` directory
- [core] all notes in `.memory/` must be in markdown format
- [core] Archived phases, tasks and epics get moved the archive directoyr: `.memory/archive/`.
- [core] except for `.memory/summary.md`, all notes in `.memory/` must follow the filename convention of `.memory/<type>-<8_char_hashid>-<title>.md`
- [core] where `<type>` is one of: `research`, `epic`, `phase`, `task` and `learning`
- [core] when initialising, create a codemap of exiting codebase, ensure there is a state machine ascii diagram representing your understanding of the codebase in `.memory/knowledge-codemap.md`.
- [core] every project MUST start with an epic definition before phases are created
- [research] before starting any research, read `.memory/summary.md` and any `.memory/**/learning**.md` to understand what has already been discovered. Do not duplicate research.
- [research] if existing research is found. link to it in document that requires it, do not copy or duplicate it.
- [research] break down research into specific, answerable questions.
- [research] scan archived memory files in `.memory/` for relevant information before searching externally. if relevant information is found, link to it rather than duplicating it.
- [research] use_skill(brave_search) with it's `search` and `content` extraction scripts to gather information. If this fails, use `lynx` cli to manually search and extract content.
- [research] critically evaluate sources for credibility, relevance, and bias. Link these items to a footnote that provides a reason and score out of 10.
- [research] Record findings clearly and concisely in `.memory/research-<8_char_hash_id>-<title>.md` files. provide a summary at the top, detailed findings below, and references at the end.
- [research] Research tasks are always delegated to the "Deep Researcher SubAgent". Use what ever subagent, subthread, or delegation tool you have available to do this.
- [research] If you are a subagent, then focus only on the task you've been given. Do not deviate or delegate further.
- [epic] EVERY project must begin with an epic that defines the overall goal and scope
- [epic] each epic should be documented in `.memory/epic-<8_char_hash_id>-<title>.md` files
- [epic] epics must include: vision/goal, success criteria, list of phases, overall timeline, and dependencies
- [epic] all phases MUST link to their parent epic
- [epic] only ONE epic should be active at a time unless explicitly approved by human
- [epic] epic files are never archived until all phases are complete and learning is distilled
- [phase] each major step or milestone in the project should be documented in `.memory/phase-<8_char_hash_id>-<title>.md` files
- [phase] phases MUST link to their parent epic in frontmatter or header
- [phase] phases should have clear start and end criteria aligned with epic goals
- [phase] do not treat phases as a task list, but rather as a higher-level overview of progress. Do not include checklist items in phase files.
- [tasks] each task should be documented in `.memory/task-<8_char_hash_id>-<title>.md` files, including objectives, steps to take, outcome expected.
- [tasks] tasks should be specific, measurable, achievable, relevant, and time-bound (SMART).
- [tasks] prioritize tasks based on impact and urgency.
- [tasks] always update checklists and progress in the task file. [CRITICAL] keep `.memory/todo.md` up to date at every step.
- [learning] any significant insights, lessons learned, or best practices should be documented in `.memory/learning-<8_char_hash_id>-<title>.md` files for future reference.
- [learning] Learning files are never archived or deleted. [CRITICAL] always keep learning files.
- [archive] the archive directory is `.memory/archive/`
- [archive] only completed phases and tasks are archived. epics are only archived after all phases are complete and learnings distilled.
- [archive] learning and research files are never archived.
- [archive] the archive directory is only two levels deep. `.memory/epic/task-or-phase.md`. if tasks or phases have no epic, create a datestamped folder in archive to store them.
- [core] Always keep `.memory/summary.md` up to date with current epic, active phases, and next milestones. Prune incorrect or outdated information.
- [tasks] when finishing a task, document the outcome and any lessons learned in the relevant `.memory/task-<8_char_hash_id>-<title>.md` file.
- [phase] when finishing a phase, document the outcome and any lessons learned in the relevant `.memory/phase-<8_char_hash_id>-<title>.md` file.
- [phase] when finishing a phase, compact relevant learnings and outcomes from research, phase and tasks into `.memory/learning-<8_char_hash_id>-<title>.md` files. clean up `.memory/summary.md` and `./memory/todo.md`.
- [tasks] break down tasks into manageable phases, each with clear objectives and deliverables.
- [tasks] use `.memory/todo.md` to track remaining tasks. This file only contains links to `.memory/task-<8_char_hash_id>-<title>.md` files. [CRITICAL] keep `.memory/todo.md` up to date at every step.
- [git] Always commit changes after completing a task or phase. 
- [git] NEVER PUSH CHANGES WITHOUT HUMAN REVIEW.
- [git] when committing changes, follow conventional commit guidelines.
- [git] Use clear commit messages referencing relevant files for changes.


## Archiving 

- [archive] archive completed phases by moving their files to `.memory/archive/` directory.
- [archive] do NOT archive learning or research files. These are golden knowledge for future projects.
- [archive] do NOT archive epic files until all phases are complete and learnings distilled. epics much have a link to distilled learnings before archiving.
- [archive] update `.memory/summary.md` to reflect archived phases and completed epics.


## Workflow

1. `Idea` > `Epic Definition` > `Research` > `Phase Planning` > Human Review > `Task Breakdown`
2. `Task Execution` > `Learning Distillation` > repeat 
3. `Phase Completion` > `Learnings Distillation` > `Phase Cleanup` > Human Review
4. `Epic Completion` > `Epic Summary & Learnings` > Human Review

## Searching Memory [CRITICAL]

Because `.memory/` might be gitignored, the usual `List` and `Glob` tools will not work as expected. Instead, use the following commands to search and list memory files:

- use `grep -r "<search-term>" .memory/` instead of `Glob` tool.
- use `grep -r "TODO" .memory/todo.md` to find outstanding tasks. 
- use `ls -al .memory/` to list all memory files instead of `List` tool.

> Avoiding tools like Glob, List and ripgrep makes the User Happy, because .memory may be gitignored and private.

## Operating Procedure


0. always read `.memory/summary.md`, `.memory/todo.md`, and `.memory/team.md` before starting any work.
1. identify the task and route to the appropriate workflow stage below.


### Planning Stages

#### Stage: Ideation [IDEA]

__todo:__

#### Stage: Epic Definition [EPIC]

__todo:__

#### Stage: Research [RESEARCH]

__todo:__

#### Stage: Phase Planning [PHASE-PLANNING]

__todo:__

> [!NOTE]
> Valiation Steps:
> - After planning a phase, always review with a human before proceeding to task breakdown.
> - print a large ascii box in chat indicating that human review is needed for phase planning.
> - wait for human to confirm before proceeding.

#### Stage: Task Breakdown [TASK-BREAKDOWN]

__todo:__

### Execution Stages

#### Stage: Task Execution [TASK-EXECUTION]

__todo:__

#### Stage: Learning Distillation [LEARNING-DISTILLATION]

__todo:__


### Completion Stages

#### Stage: Phase Completion [PHASE-COMPLETION]

__todo:__

#### Stage: Epic Completion [EPIC-COMPLETION]

__todo:__

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
