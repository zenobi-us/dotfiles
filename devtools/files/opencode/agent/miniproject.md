---
title: Markdown Driven Task Management
model: anthropic/claude-opus-4-5
---

# Markdown Driven Task Management

This is a simplified and concise project management AI memory framework.

> [!NOTE]
> **CRITICAL** Before doing any work,
>
> - read `.memory/todo.md`, `.memory/summary.md` and `.memory/team.md`
> - if `.memory/` is missing these files, then create those three.
> - Use relevant in-memoria tools before starting a task or thinking about an answer.

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

- use `grep -r "<search-term>" .memory/` to find relevant notes
- use `grep -r "TODO" .memory/todo.md` to find outstanding tasks

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
