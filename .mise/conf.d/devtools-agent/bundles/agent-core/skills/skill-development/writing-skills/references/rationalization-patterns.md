# Bulletproofing Skills Against Rationalization

Skills that enforce discipline (like TDD) need to resist rationalization. Agents are smart and will find loopholes when under pressure.

**Psychology note:** Understanding WHY persuasion techniques work helps you apply them systematically. See `skill_resource('writing-skills', 'references/anthropic-best-practices')` for research foundation (Cialdini, 2021; Meincke et al., 2025) on authority, commitment, scarcity, social proof, and unity principles.

## Close Every Loophole Explicitly

Don't just state the rule - forbid specific workarounds:

**Bad:**
```markdown
Write code before test? Delete it.
```

**Good:**
```markdown
Write code before test? Delete it. Start over.

**No exceptions:**
- Don't keep it as "reference"
- Don't "adapt" it while writing tests
- Don't look at it
- Delete means delete
```

## Address "Spirit vs Letter" Arguments

Add foundational principle early:

```markdown
**Violating the letter of the rules is violating the spirit of the rules.**
```

This cuts off entire class of "I'm following the spirit" rationalizations.

## Build Rationalization Table

Capture rationalizations from baseline testing (see Testing section below). Every excuse agents make goes in the table:

```markdown
| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "Tests after achieve same goals" | Tests-after = "what does this do?" Tests-first = "what should this do?" |
```

## Create Red Flags List

Make it easy for agents to self-check when rationalizing:

```markdown
## Red Flags - STOP and Start Over

- Code before test
- "I already manually tested it"
- "Tests after achieve the same purpose"
- "It's about spirit not ritual"
- "This is different because..."

**All of these mean: Delete code. Start over with TDD.**
```

## Update CSO for Violation Symptoms

Add to description: symptoms of when you're ABOUT to violate the rule:

```yaml
description: use when implementing any feature or bugfix, before writing implementation code
```

## Common Patterns in Agent Rationalizations

### The "This Time is Different" Rationalization

**Pattern:** "This situation is special because..."

**Counter:** Explicitly state: "There are no exceptions. Pressure ≠ permission."

### The "Spirit Not Letter" Rationalization

**Pattern:** "I'm following the spirit of the rule even though I skipped the literal step"

**Counter:** "Violating the letter of the rules is violating the spirit of the rules."

### The "I'll Fix It Later" Rationalization

**Pattern:** "I'll go back and do it properly once I finish the quick version"

**Counter:** "Technical debt accrues interest. Doing it wrong first = twice the work. Do it right now."

### The "Already Tested" Rationalization

**Pattern:** "I already mentally tested this" or "I ran it manually"

**Counter:** "Mental testing ≠ formal testing. Formal tests prove correctness. Manual testing proves nothing."

### The "Obvious/Simple" Rationalization

**Pattern:** "This is so obvious/simple that testing is overkill"

**Counter:** "Simple code breaks. Simple tests take 30 seconds. The simplest failures are the most embarrassing."

### The "Reference" Rationalization

**Pattern:** "I'll keep it as reference material" (after violating the rule)

**Counter:** "Reference material is code you deleted. Looking at deleted code = using it. Delete means delete."

### The "Adapt While Testing" Rationalization

**Pattern:** "I'm adapting the code while writing tests so they both improve together"

**Counter:** "That's writing code while testing. Stop. Delete code. Start with test only."

## Preventive Language Patterns

### 1. Absolute Language (When Appropriate)

```markdown
# ❌ Weak
You should test before implementing

# ✅ Strong
Test BEFORE implementing. No exceptions.
```

### 2. Explicit Forbidding

```markdown
# ❌ Weak
Try to avoid writing code before tests

# ✅ Strong
DO NOT write code before tests.
NEVER implement before testing.
If you wrote code first: DELETE IT.
```

### 3. Consequence Clarity

```markdown
# ❌ Vague
Testing matters

# ✅ Clear
Skipping tests = deploying untested code.
Untested code breaks production.
```

### 4. Self-Check Questions

```markdown
## Before proceeding, ask yourself:

- Did I write ANY code before the test passed?
- Am I using this as "reference"?
- Am I adapting while testing?
- Am I saying "this is different"?

If YES to any: Stop. Delete. Start over.
```

## Testing Rationalizations During RED Phase

When you run baseline tests (RED phase), document:

1. **What rationalization did the agent use?** (verbatim)
2. **What situation triggered it?** (time pressure? complexity? confidence?)
3. **What could stop this rationalization?**
   - Explicit rule?
   - Fear of consequence?
   - Clear definition of "delete"?

Add explicit counters to skill for each rationalization found.

## Anti-Patterns in Skill Writing

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
