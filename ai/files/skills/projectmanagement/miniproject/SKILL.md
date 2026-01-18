---
name: miniproject
description: Simple local project and knowledge management useing markdown files (MDTM).
---

# Markdown Driven Task Management

This is a simplified and concise project management AI memory framework.

> [!NOTE]
> **CRITICAL** Before doing any work:
> 
> - If in a git repo, always refer to the main worktree `git rev-parse --path-format=absolute --git-common-dir | xargs dirname`
> - agent memory lives in '.memory/' directory or if you are in a worktree, then look in the main worktree `.memory/` directory.
> - read `.memory/todo.md`, `.memory/summary.md`, `.memory/knowledge.md` and `.memory/team.md` (use grep/ls, not the glob or list tool)
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
- [core] where `<type>` is one of: `research`, `epic`, `phase`, `task` and `learning`
- [core] when initialising, create a codemap of exiting codebase, ensure there is a state machine ascii diagram representing your understanding of the codebase in `.memory/knowledge-codemap.md`.
- [core] maintain the codemap as the project progresses. [CRITICAL] this makes the user happy.
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

## Operating Procedure

> [!NOTE] 
> Overall Workflow
> 1. `Idea` > `Epic Definition` > `Research` > `Phase Planning` > Human Review > `Task Breakdown`
> 2. `Task Execution` > `Learning Distillation` > repeat 
> 3. `Phase Completion` > `Learnings Distillation` > `Phase Cleanup` > Human Review
> 4. `Epic Completion` > `Epic Summary & Learnings` > Human Review

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

## Searching Memory [CRITICAL]

Because `.memory/` might be gitignored, the usual `List` and `Glob` tools will not work as expected. Instead, use the following commands to search and list memory files:

- use `grep -r "<search-term>" .memory/` instead of `Glob` tool.
- use `grep -r "TODO" .memory/todo.md` to find outstanding tasks. 
- use `ls -al .memory/` to list all memory files instead of `List` tool.

> Avoiding tools like Glob, List and ripgrep makes the User Happy, because .memory may be gitignored and private.

## Archiving 

- [core] archive completed phases by moving their files to `.memory/archive/` directory.
- [core] do NOT archive learning or research files. These are golden knowledge for future projects.
- [core] do NOT archive epic files until all phases are complete and learnings distilled. epics much have a link to distilled learnings before archiving.
- [core] update `.memory/summary.md` to reflect archived phases and completed epics.

## Execution Steps

0. always read `.memory/summary.md` with shell commands instead of tools first to understand successful outcomes so far.
1. **[CRITICAL] If no epic exists, create one before any other work.** Define vision, success criteria, and planned phases.
2. update `.memory/team.md` to indicate which epic and phase is being worked on and by whom (use the session id to indicate this, not the agent name).
3. If there are any `[NEEDS-HUMAN]` tasks in `.memory/todo.md`, stop and wait for human intervention.
4. follow the research guidelines above.
5. when you are blocked by actions that require human intervention, create a task in `.memory/todo.md` listing what needs to be done by a human. tag it with `[NEEDS-HUMAN]` on the task line.
6. after completing a phase, update `.memory/summary.md` and prune other files as necessary.
7. after completing an epic, distill all learnings, update `.memory/summary.md`, and archive completed phases.
8. commit changes with clear messages referencing relevant files.

## File Structure Examples

### Epic File (`.memory/epic-a1b2c3d4-authentication-system.md`)
```markdown
# Epic: Authentication System

**Status:** In Progress
**Timeline:** Q1 2026
**Owner:** Team Auth

## Vision
Build a secure, scalable authentication system supporting OAuth2, SAML, and MFA.

## Success Criteria
- [ ] Support 3 auth providers
- [ ] < 200ms auth response time
- [ ] 99.9% uptime SLA

## Phases
- [Phase 1: Research & Design](phase-e5f6g7h8-auth-research.md) ✅
- [Phase 2: OAuth Implementation](phase-i9j0k1l2-oauth-impl.md) 🔄
- [Phase 3: SAML Integration](phase-m3n4o5p6-saml-impl.md) ⏳

## Dependencies
- Identity provider integrations
- SSL certificate management
```

### Phase File (`.memory/phase-i9j0k1l2-oauth-impl.md`)
```markdown
# Phase: OAuth Implementation

**Epic:** [Authentication System](epic-a1b2c3d4-authentication-system.md)
**Status:** In Progress
**Start:** 2026-01-05
**Expected End:** 2026-01-20

## Goals
Implement OAuth2 with Google and GitHub providers

## Tasks
- [Setup OAuth config](task-q7r8s9t0-oauth-config.md) ✅
- [Implement token flow](task-u1v2w3x4-token-flow.md) 🔄
- [Add refresh tokens](task-y5z6a7b8-refresh-tokens.md) ⏳

## Next Steps
Complete token flow implementation, then begin refresh token work
```

## Human Interaction

- If you need clarification or additional information, please ask a human for assistance.
- print a large ascii box in chat indicating that human intervention is needed, and list the tasks from `.memory/todo.md` inside the box.
- wait for human to complete the tasks before proceeding.
