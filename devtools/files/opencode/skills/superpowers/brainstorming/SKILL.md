---
name: brainstorming
description: Use when creating or developing, before writing code or implementation plans - refines rough ideas into fully-formed designs through collaborative questioning, alternative exploration, and incremental validation. Don't use during clear 'mechanical' processes
---

# Brainstorming Ideas Into Designs

## Overview

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design in small sections (200-300 words), checking after each section whether it looks right so far.

## The Process

**Understanding the idea:**
- Check out the current project state first (files, docs, recent commits)
- Ask questions one at a time to refine the idea
- Prefer multiple choice questions when possible, but open-ended is fine too
- Only one question per message - if a topic needs more exploration, break it into multiple questions
- Focus on understanding: purpose, constraints, success criteria

**Research with Experts:**

- If the idea involves specialized knowledge, identify relevant experts
- Delegate reesarch task to subagent using the `task(Researcher)` tool

**Exploring approaches:**
- Propose 2-3 different approaches with trade-offs
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why

**Presenting the design:**
- Once you believe you understand what you're building, present the design
- Break it into sections of 200-300 words
- Ask after each section whether it looks right so far
- Cover: architecture, components, data flow, error handling, testing
- Be ready to go back and clarify if something doesn't make sense

## During Dicsussion

**Question Presentation:**

- Present questions and options clearly and concisely
- Show question as a title, with options or details below
- use numbered or lettered lists for options. Allowing the user to pick by number/letter
- After presenting a section of the design, ask: "Does this look right so far?"

**Ensure Consistency:**

- Keep track of previous answers and design decisions
- Refer back to earlier points to ensure alignment
- Adjust the design based on feedback and new information

**Shift in Direction:**

- If the user indicates a significant change in direction, pause and reassess
- Check if the user is referring to forking a previous question. If so, go back to that question and present alternatives again
- Ask clarifying questions to understand the new direction
- Confirm understanding before proceeding with the new direction

## After the Design

**Documentation:**

- Write the validated design with the proscribed storage backend.
- Use elements-of-style:writing-clearly-and-concisely skill if available
- Commit the design document to git

**Implementation (if continuing):**

- Ask: "Ready to set up for implementation?" If yes:
  - Use `superpowers_using_git_worktrees` skill to create isolated workspace
  - Use `superpowers_writing_plans` to create detailed implementation plan
- Otherwise, end the session

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Present design in sections, validate each
- **Be flexible** - Go back and clarify when something doesn't make sense
