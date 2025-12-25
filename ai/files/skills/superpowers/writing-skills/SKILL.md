---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment
---

# Writing Skills

## Overview

**Writing skills IS Test-Driven Development applied to process documentation.**

**Personal skills live in agent-specific directories (`~/.claude/skills` for Claude Code, `~/.codex/skills` for Codex)** 

You write test cases (pressure scenarios with subagents), watch them fail (baseline behavior), write the skill (documentation), watch tests pass (agents comply), and refactor (close loopholes).

**Core principle:** If you didn't watch an agent fail without the skill, you don't know if the skill teaches the right thing.

**REQUIRED BACKGROUND:** You MUST understand superpowers:test-driven-development before using this skill. That skill defines the fundamental RED-GREEN-REFACTOR cycle. This skill adapts TDD to documentation.

**Official guidance:** For Anthropic's official skill authoring best practices, use `skill_resource('writing-skills', 'anthropic-best-practices')`. This document provides additional patterns and guidelines that complement the TDD-focused approach in this skill.

## What is a Skill?

A **skill** is a reference guide for proven techniques, patterns, or tools. Skills help future Claude instances find and apply effective approaches.

**Skills are:** Reusable techniques, patterns, tools, reference guides

**Skills are NOT:** Narratives about how you solved a problem once

## TDD Mapping for Skills

For detailed TDD mapping table and concepts, use `skill_resource('writing-skills', 'references/tdd-mapping')`.

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

## Skill Types

### Technique
Concrete method with steps to follow (condition-based-waiting, root-cause-tracing)

### Pattern
Way of thinking about problems (flatten-with-flags, test-invariants)

### Reference
API docs, syntax guides, tool documentation (office docs)

## Directory Structure


```
skills/
  skill-name/
    SKILL.md              # Main reference (required)
    supporting-file.*     # Only if needed
```

**Flat namespace** - all skills in one searchable namespace

**Separate files for:**
1. **Heavy reference** (100+ lines) - API docs, comprehensive syntax
2. **Reusable tools** - Scripts, utilities, templates

**Keep inline:**
- Principles and concepts
- Code patterns (< 50 lines)
- Everything else

## SKILL.md Structure

**Frontmatter (YAML):**
- Only two fields supported: `name` and `description`
- Max 1024 characters total
- `name`: Use letters, numbers, and hyphens only (no parentheses, special chars)
- `description`: Third-person, describes ONLY when to use (NOT what it does)
  - Start with "Use when..." to focus on triggering conditions
  - Include specific symptoms, situations, and contexts
  - **NEVER summarize the skill's process or workflow** (see CSO section for why)
  - Keep under 500 characters if possible

```markdown
---
name: Skill-Name-With-Hyphens
description: Use when [specific triggering conditions and symptoms]
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

For comprehensive CSO guidance including description patterns, keyword coverage, and naming conventions, use `skill_resource('writing-skills', 'references/cso-guide')`.

Key principles:
- **Description = When to Use, NOT What the Skill Does** (no workflow summary in description)
- Write in third person for system prompt injection
- Use concrete triggers and symptoms, not language-specific details
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

For graphviz style conventions, see `skill_resource('writing-skills', 'assets/graphviz-conventions')`.

**Visualizing for your human partner:** Use `render-graphs.js` in the scripts/ directory to render flowcharts to SVG:
```bash
./scripts/render-graphs.js ../some-skill           # Each diagram separately
./scripts/render-graphs.js ../some-skill --combine # All diagrams in one SVG
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
defense-in-depth/
  SKILL.md    # Everything inline
```
When: All content fits, no heavy reference needed

### Skill with Reusable Tool
```
condition-based-waiting/
  SKILL.md    # Overview + patterns
  example.ts  # Working helpers to adapt
```
When: Tool is reusable code, not just narrative

### Skill with Heavy Reference
```
pptx/
  SKILL.md       # Overview + workflows
  pptxgenjs.md   # 600 lines API reference
  ooxml.md       # 500 lines XML structure
  scripts/       # Executable tools
```
When: Reference material too large for inline

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

For comprehensive testing methodology by skill type, use `skill_resource('writing-skills', 'references/testing-methodology')`.

**Quick reference:**
- **Discipline-enforcing skills:** Test under pressure (time, sunk cost, exhaustion)
- **Technique skills:** Test application scenarios and edge cases
- **Pattern skills:** Test recognition and counter-examples
- **Reference skills:** Test retrieval and correct application

**Critical principle:** Test before deploying. No exceptions.

## Bulletproofing Skills Against Rationalization

For detailed strategies on closing loopholes and addressing rationalizations in discipline-enforcing skills, use `skill_resource('writing-skills', 'references/rationalization-patterns')`.

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

For complete testing methodology including pressure types and meta-testing techniques, use `skill_resource('writing-skills', 'references/testing-methodology')`.

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

For the complete checklist with all RED-GREEN-REFACTOR phases and quality checks, use `skill_resource('writing-skills', 'references/skill-checklist')`.

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
