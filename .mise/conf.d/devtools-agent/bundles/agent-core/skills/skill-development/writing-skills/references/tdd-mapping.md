# TDD Mapping for Skills

## Core Concept

Skills are created using Test-Driven Development principles applied to process documentation.

| TDD Concept | Skill Creation |
|-------------|----------------|
| **Test case** | Pressure scenario with subagent |
| **Production code** | Skill document (SKILL.md) |
| **Test fails (RED)** | Agent violates rule without skill (baseline) |
| **Test passes (GREEN)** | Agent complies with skill present |
| **Refactor** | Close loopholes while maintaining compliance |
| **Write test first** | Run baseline scenario BEFORE writing skill |
| **Watch it fail** | Document exact rationalizations agent uses |
| **Minimal code** | Write skill addressing those specific violations |
| **Watch it pass** | Verify agent now complies |
| **Refactor cycle** | Find new rationalizations → plug → re-verify |

## Why This Matters

The entire skill creation process follows RED-GREEN-REFACTOR. This isn't optional—it's the core discipline that ensures skills are effective.

**The Iron Law**: `NO SKILL WITHOUT A FAILING TEST FIRST`

This applies to NEW skills AND EDITS to existing skills.

- Write skill before testing? Delete it. Start over.
- Edit skill without testing? Same violation.

**No exceptions:**
- Not for "simple additions"
- Not for "just adding a section"
- Not for "documentation updates"
- Don't keep untested changes as "reference"
- Don't "adapt" while running tests
- Delete means delete

## The Cycle in Action

### RED: Write Failing Test (Baseline)

Run pressure scenario with subagent WITHOUT the skill. Document exact behavior:
- What choices did they make?
- What rationalizations did they use (verbatim)?
- Which pressures triggered violations?

This is "watch the test fail" - you must see what agents naturally do before writing the skill.

### GREEN: Write Minimal Skill

Write skill that addresses those specific rationalizations. Don't add extra content for hypothetical cases.

Run same scenarios WITH skill. Agent should now comply.

### REFACTOR: Close Loopholes

Agent found new rationalization? Add explicit counter. Re-test until bulletproof.

## Why Mapping to TDD Works

- **Same discipline**: Both enforce a specific order (test first, code second)
- **Same benefits**: Better quality, fewer surprises, bulletproof results
- **Same verification**: You must WATCH the test fail before writing the solution
- **Same rigor**: No "I'm confident this is right" exceptions

If you follow TDD for code, follow it for skills. It's the same discipline applied to documentation.
