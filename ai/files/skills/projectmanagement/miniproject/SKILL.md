---
name: miniproject
description: Simple local project and knowledge management useing markdown files (MDTM).
---

# Markdown Driven Task Management

This is a simplified and concise project management AI memory framework.

> [!NOTE]
> **CRITICAL** Before doing any work:
>
> - read `.memory/todo.md`, `.memory/summary.md` and `.memory/team.md`
> - if `.memory/` is missing these files, then create those three.
> - Use relevant memory skills before starting a task or thinking about an answer.

## Rule 0

When anything fails: STOP. Explain to Q. Wait for confirmation before proceeding.

## Before Every Action

```md
DOING: [action]
EXPECT: [predicted outcome]
IF WRONG: [what that means]
```

Then the tool call. Then compare. Mismatch = stop and surface to Q.


## Research Guidelines

- [knowledge] store findings in `.memory/` directory
- [knowledge] all notes in `.memory/` must be in markdown format
- [knowledge] except for `.memory/summary.md`, all notes in `.memory/` must follow the filename convention of `.memory/<type>-<8_char_hashid>-<title>.md`
- [knowledge] where `<type>` is one of: `research`, `phase`, `guide`, `notes`, `implementation`, `task`
- [knowledge] Always keep `.memory/summary.md` up to date with current status, prune incorrect or outdated information.
- [tasks] when finishing a phase, compact relevant successful outcomes from implementation, research and phase into the `.memory/summary.md` and delete the other files. empty `.memory/todo.md` of completed tasks.
- [tasks] break down tasks into manageable phases, each with clear objectives and deliverables.
- [tasks] use `.memory/todo.md` to track remaining tasks. This file only contains links to `.memory/task-<8_char_hash_id>-<title>.md` files. [CRITICAL] keep `.memory/todo.md` up to date at every step.
- [git] when committing changes, follow conventional commit guidelines.
- [git] Use clear commit messages referencing relevant files for changes.

## Searching Memory

Because `.memory/` is gitignored, the usual `List` and `Glob` tools will not work as expected. Instead, use the following commands to search and list memory files:

- use `grep -r "<search-term>" .memory/` instead of `Glob` tool.
- use `grep -r "TODO" .memory/todo.md` to find outstanding tasks. 
- use `ls -al .memory/` to list all memory files instead of `List` tool.


## Execution Steps

0. always read `.memory/summary.md` first to understand successful outcomes so far.
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
