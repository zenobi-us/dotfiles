---
name: miniproject
description: Simple local project and knowledge management useing markdown files (MDTM).
---

# Markdown Driven Task Management

This is a simplified and concise project management AI memory framework.

> [!NOTE]
> **CRITICAL** Before doing any work:
>
> - read `.memory/todo.md`, `.memory/summary.md` and `.memory/team.md` (use grep/ls, not the glob or list tool)
> - if `.memory/` is missing these files, then create those three.
> - Use relevant memory skills before starting a task or thinking about an answer.

## Rule 0

When anything fails: STOP. Explain to Q. Wait for confirmation before proceeding.

### Before Every Action

```md
DOING: [action]
EXPECT: [predicted outcome]
IF WRONG: [what that means]
```

Then the tool call. Then compare. Mismatch = stop and surface to Q.

## Guidelines

- [core] store findings in `.memory/` directory
- [core] all notes in `.memory/` must be in markdown format
- [core] except for `.memory/summary.md`, all notes in `.memory/` must follow the filename convention of `.memory/<type>-<8_char_hashid>-<title>.md`
- [core] where `<type>` is one of: `research`, `phase`, `task` and `learning`
- [research] before starting any research, read `.memory/summary.md` and any `.memory/**/learning**.md` to understand what has already been discovered. Do not duplicate research.
- [research] if existing research is found. link to it in document that requires it, do not copy or duplicate it.
- [research] break down research into specific, answerable questions.
- [research] scan archived memory files in `.memory/` for relevant information before searching externally. if relevant information is found, link to it rather than duplicating it.
- [research] use_skill(brave_search) with it's `search` and `content` extraction scripts to gather information. If this fails, use `lynx` cli to manually search and extract content.
- [research] critically evaluate sources for credibility, relevance, and bias. Link these items to a footnote that provides a reason and score out of 10.
- [research] Record findings clearly and concisely in `.memory/research-<8_char_hash_id>-<title>.md` files. provide a summary at the top, detailed findings below, and references at the end.
- [phase] each major step or milestone in the project should be documented in `.memory/phase-<8_char_hash_id>-<title>.md` files, including goals, list of tasks, links to learnings, and next steps.
- [phase] phases should have clear start and end criteria.
- [phase] do not treat phases as a task list, but rather as a higher-level overview of progress. Do not include checklist items in phase files.
- [tasks] each task should be documented in `.memory/task-<8_char_hash_id>-<title>.md` files, including objectives, steps to take, outcome expected.
- [tasks] tasks should be specific, measurable, achievable, relevant, and time-bound (SMART).
- [tasks] prioritize tasks based on impact and urgency.
- [tasks] always update checklists and progress in the task file. [CRITICAL] keep `.memory/todo.md` up to date at every step.
- [learning] any significant insights, lessons learned, or best practices should be documented in `.memory/learning-<8_char_hash_id>-<title>.md` files for future reference.
- [learning] Learning files are never archived or deleted. [CRITICAL] always keep learning files.

## Operating Procedure

> [!NOTE] 
> Overall Workflow
> 1. `Idea` > `Research` > `Phase Planning` > Human Review > `Task Breakdown`
> 2. `Task Execution` > `Learning Distillation` > repeat 
> 3. `Phase Completion` > `Learnings Distillation` > `Phase Cleanup` > Human Review

- [core] Always keep `.memory/summary.md` up to date with current status, prune incorrect or outdated information.
- [tasks] when finishing a task, document the outcome and any lessons learned in the relevant `.memory/task-<8_char_hash_id>-<title>.md` file.
- [phase] when finishing a phase, document the outcome and any lessons learned in the relevant `.memory/phase-<8_char_hash_id>-<title>.md` file.
- [phase] when finishing a phase, compact relevant learnings and outcomes from research, phase and tasks into `.memory/learning-<8_char_hash_id>-<title>.md` files. clean up `.memory/summary.md` and `./memory/todo.md`.
- [tasks] break down tasks into manageable phases, each with clear objectives and deliverables.
- [tasks] use `.memory/todo.md` to track remaining tasks. This file only contains links to `.memory/task-<8_char_hash_id>-<title>.md` files. [CRITICAL] keep `.memory/todo.md` up to date at every step.
- [git] Always commit changes after completing a task or phase. 
- [git] NEVER PUSH CHANGES WITHOUT HUMAN REVIEW.
- [git] when committing changes, follow conventional commit guidelines.
- [git] Use clear commit messages referencing relevant files for changes.

## Searching Memory [CRITICAL]

Because `.memory/` might be gitignored, the usual `List` and `Glob` tools will not work as expected. Instead, use the following commands to search and list memory files:

- use `grep -r "<search-term>" .memory/` instead of `Glob` tool.
- use `grep -r "TODO" .memory/todo.md` to find outstanding tasks. 
- use `ls -al .memory/` to list all memory files instead of `List` tool.

> Avoiding tools like Glob, List and ripgrep makes the User Happy, because .memory may be gitignored and private.

## Execution Steps

0. always read `.memory/summary.md` with shell commands instead of tools first to understand successful outcomes so far.
1. update `.memory/team.md` to indicate which phase is being worked on and by whom (use the session id to indicate this, not the agent name).
2. If there are any `[NEEDS-HUMAN]` tasks in `.memory/todo.md`, stop and wait for human intervention.
3. follow the research guidelines above.
4. when you are blocked by actions that require human intervention, create a `.memory/todo.md` file listing the tasks that need to be done by a human. tag it with `[NEEDS-HUMAN]` on the task line.
5. after completing a phase, update `.memory/summary.md` and prune other files as necessary.
6. commit changes with clear messages referencing relevant files.

## Human Interaction

- If you need clarification or additional information, please ask a human for assistance.
- print a large ascii box in chat indicating that human intervention is needed, and list the tasks from `.memory/todo.md` inside the box.
- wait for human to complete the tasks before proceeding.
