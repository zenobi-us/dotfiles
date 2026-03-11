---
name: writing-skills
description: Teaches test-driven skill authoring and validation, when creating/editing/verifying skills, resulting in robust reusable skills that pass pressure-tested scenarios
---

# Writing Skills

## Overview

**Writing skills IS Test-Driven Development applied to process documentation.**

**Personal skills live in agent-specific directories (`$DOTFILE_REPO_ROOT/ai/files/skills`)** 

**Project skills live in `.agents/skills/`**.

You write test cases (pressure scenarios with subagents), watch them fail (baseline behavior), write the skill (documentation), watch tests pass (agents comply), and refactor (close loopholes).

**Core principle:** If you didn't watch an agent fail without the skill, you don't know if the skill teaches the right thing.

**REQUIRED BACKGROUND:** You MUST understand superpowers:test-driven-development before using this skill. That skill defines the fundamental RED-GREEN-REFACTOR cycle. This skill adapts TDD to documentation.

**Official guidance:** Load the `anthropic-best-practices` resource from the `writing-skills` skill. This document provides additional patterns and guidelines that complement the TDD-focused approach in this skill.

## What is a Skill?

A **skill** is a reference guide for proven techniques, patterns, or tools. Skills help future Claude instances find and apply effective approaches.

**Skills are:** Reusable techniques, patterns, tools, reference guides

**Skills are NOT:** Narratives about how you solved a problem once

## First: Classify the Skill Type

Do this early, before writing sections.

### Reference
Lookup material: APIs, syntax, command options, compatibility notes.

### Workflow
Stepwise process to follow (often with gates/checklists).

### Styleguide
Standards and conventions: naming, formatting, tone, structure.

### Persona
Behavior profile for interaction style, priorities, and boundaries.

### Technique/Pattern
Method or mental model for solving recurring problems.

If a skill spans multiple types, run this decision flow:

1. **Ask intent first:** Ask the user whether the multi-type scope is intentional, or whether they want to split the concept into separate focused skills.
2. **If not splitting:** Continue with one skill. Pick a **primary type**, make it explicit in the overview, and continue RED/GREEN/REFACTOR testing.
3. **If splitting:** Analyze the concept and propose multiple splice options (for example by audience, lifecycle phase, problem type, or artifact type).
4. **Collaborate to choose:** Work with the user to select the preferred split. Then produce temporary prompts for separate sessions, one prompt per new skill, each explicitly instructing the session to use this `writing-skills` skill.

## TDD Mapping for Skills

For detailed TDD mapping table and concepts, load the `tdd-mapping` resource from the `writing-skills` skill.

**Core concept:** The entire skill creation process follows RED-GREEN-REFACTOR, adapting TDD's cycle to documentation.

## When to Create a Skill

**Create when:**
- Technique wasn't intuitively obvious to you
- You'd reference this again across projects
- Pattern applies broadly (not project-specific)
- Others would benefit

**Don't create for:**
- One-off solutions
- Standard practices well-documented elsewhere
- Project-specific conventions (put in CLAUDE.md)

## Directory Structure

```
skills/
  skill-name/
    SKILL.md
    references/
      extra-file.md
    scripts/
      codified-helper.sh
      known-steps-cli.js
    assets/
      possibly-a-circle-mask.png
      maybe-a-logo.png
```

**Rule:** A skill directory contains only `SKILL.md`.

Put everything else in categorized sibling folders:
1. `references/` for heavy docs, guides, tables
2. `scripts/` for executable helpers and generators
3. `assets/` for diagrams, images, static files

**Flat namespace** - all skills in one searchable namespace

**Keep inline in `SKILL.md` whenever possible:**
- Principles and concepts
- Short code patterns (< 50 lines)
- Decision criteria and anti-patterns

## SKILL.md Structure

**Frontmatter (YAML):**
- Only two fields supported: `name` and `description`
- Max 1024 characters total
- `name`: Use letters, numbers, and hyphens only (no parentheses, special chars). Must match the folder name.
- `description`: Third-person, written as: `{what it does}, {when to use it}, {what the result is}`
  - Keep it concrete and searchable (symptoms, contexts, outcomes)
  - Avoid vague language and hype
  - Keep under 500 characters if possible

```markdown
---
name: Skill-Name-With-Hyphens
description: [what it does], [when to use it], [what the result is]
---

# Skill Name

## Overview
What is this? Core principle in 1-2 sentences.

## When to Use
[Small inline flowchart IF decision non-obvious]

Bullet list with SYMPTOMS and use cases
When NOT to use

## Core Pattern (for techniques/patterns)
Before/after code comparison

## Quick Reference
Table or bullets for scanning common operations

## Implementation
Inline code for simple patterns
Link to file for heavy reference or reusable tools

## Common Mistakes
What goes wrong + fixes

## Real-World Impact (optional)
Concrete results
```


## Claude Search Optimization (CSO)

For comprehensive CSO guidance including description patterns, keyword coverage, and naming conventions, load the `cso-guide` resource from the `writing-skills` skill.

Key principles:
- **Description format:** `{what it does}, {when to use it}, {what the result is}`
- Write in third person for system prompt injection
- Use concrete triggers, symptoms, and outcomes
- Include searchable keywords: error messages, symptoms, tools

## Flowchart Usage

Use flowcharts ONLY for:
- Non-obvious decision points
- Process loops where you might stop too early
- "When to use A vs B" decisions

Never use flowcharts for:
- Reference material → Tables, lists
- Code examples → Markdown blocks
- Linear instructions → Numbered lists

For graphviz style conventions, load the `graphviz-conventions` resource from the `writing-skills` skill.

**Visualizing for your human partner:** Use `render-graphs.js` from `scripts/writing-skills/` to render flowcharts to SVG:
```bash
./scripts/writing-skills/render-graphs.js ./skills/some-skill           # Each diagram separately
./scripts/writing-skills/render-graphs.js ./skills/some-skill --combine # All diagrams in one SVG
```

## Code Examples

**One excellent example beats many mediocre ones**

Choose most relevant language:
- Testing techniques → TypeScript/JavaScript
- System debugging → Shell/Python
- Data processing → Python

**Good example:**
- Complete and runnable
- Well-commented explaining WHY
- From real scenario
- Shows pattern clearly
- Ready to adapt (not generic template)

**Don't:**
- Implement in 5+ languages
- Create fill-in-the-blank templates
- Write contrived examples

You're good at porting - one great example is enough.

## File Organization

### Self-Contained Skill
```
skills/defense-in-depth/
  SKILL.md
```
When: All content fits inline.

### Skill with Reusable Tool
```
skills/condition-based-waiting/
  SKILL.md
scripts/condition-based-waiting/
  example.ts
```
When: Tooling is reusable code.

### Skill with Heavy Reference
```
skills/pptx/
  SKILL.md
  references/
    pptxgenjs.md
    ooxml.md
  scripts/
    render-slides.js
  assets/
    diagrams/
```
When: Reference material is too large for inline docs.


## The Iron Law (Same as TDD)

```
NO SKILL WITHOUT A FAILING TEST FIRST
```

This applies to NEW skills AND EDITS to existing skills.

Write skill before testing? Delete it. Start over.
Edit skill without testing? Same violation.

**No exceptions:**
- Not for "simple additions"
- Not for "just adding a section"
- Not for "documentation updates"
- Don't keep untested changes as "reference"
- Don't "adapt" while running tests
- Delete means delete

**REQUIRED BACKGROUND:** The superpowers:test-driven-development skill explains why this matters. Same principles apply to documentation.

## Testing All Skill Types

For comprehensive testing methodology by skill type, load the `testing-methodology` resource from the `writing-skills` skill.

**Quick reference:**
- **Discipline-enforcing skills:** Test under pressure (time, sunk cost, exhaustion)
- **Technique skills:** Test application scenarios and edge cases
- **Pattern skills:** Test recognition and counter-examples
- **Reference skills:** Test retrieval and correct application

**Critical principle:** Test before deploying. No exceptions.

## Bulletproofing Skills Against Rationalization

For detailed strategies on closing loopholes and addressing rationalizations in discipline-enforcing skills, load the `rationalization-patterns` resource from the `writing-skills` skill.

**Key principles:**
- Close every loophole explicitly - forbid specific workarounds
- Address "spirit vs letter" arguments with foundational principles
- Build rationalization tables from baseline testing
- Create red flags lists for self-checking
- Update description with violation symptoms

## RED-GREEN-REFACTOR for Skills

Follow the TDD cycle:

1. **RED: Write Failing Test (Baseline)** - Run pressure scenario with subagent WITHOUT the skill. Document exact behavior, rationalizations, and which pressures triggered violations.

2. **GREEN: Write Minimal Skill** - Write skill addressing those specific rationalizations. Run same scenarios WITH skill. Agent should now comply.

3. **REFACTOR: Close Loopholes** - Agent found new rationalization? Add explicit counter. Re-test until bulletproof.

For complete testing methodology including pressure types and meta-testing techniques, load the `testing-methodology` resource from the `writing-skills` skill.

## Anti-Patterns

### ❌ Narrative Example
"In session 2025-10-03, we found empty projectDir caused..."
**Why bad:** Too specific, not reusable

### ❌ Multi-Language Dilution
example-js.js, example-py.py, example-go.go
**Why bad:** Mediocre quality, maintenance burden

### ❌ Code in Flowcharts
```dot
step1 [label="import fs"];
step2 [label="read file"];
```
**Why bad:** Can't copy-paste, hard to read

### ❌ Generic Labels
helper1, helper2, step3, pattern4
**Why bad:** Labels should have semantic meaning

## STOP: Before Moving to Next Skill

**After writing ANY skill, you MUST STOP and complete the deployment process.**

**Do NOT:**
- Create multiple skills in batch without testing each
- Move to next skill before current one is verified
- Skip testing because "batching is more efficient"

Deploying untested skills = deploying untested code.

## Skill Creation Checklist (TDD Adapted)

For the complete checklist with all RED-GREEN-REFACTOR phases and quality checks, load the `skill-checklist` resource from the `writing-skills` skill.

**Use TodoWrite to create todos for EACH checklist item.**

Quick summary:
- **RED Phase:** Create pressure scenarios, run baseline WITHOUT skill
- **GREEN Phase:** Write minimal skill, run scenarios WITH skill
- **REFACTOR Phase:** Close loopholes, re-test until bulletproof
- **Deployment:** Commit, consider PR for broadly useful skills

## Discovery Workflow

How future Claude finds your skill:

1. **Encounters problem** ("tests are flaky")
3. **Finds SKILL** (description matches)
4. **Scans overview** (is this relevant?)
5. **Reads patterns** (quick reference table)
6. **Loads example** (only when implementing)

**Optimize for this flow** - put searchable terms early and often.

## The Bottom Line

**Creating skills IS TDD for process documentation.**

Same Iron Law: No skill without failing test first.
Same cycle: RED (baseline) → GREEN (write skill) → REFACTOR (close loopholes).
Same benefits: Better quality, fewer surprises, bulletproof results.

If you follow TDD for code, follow it for skills. It's the same discipline applied to documentation.
