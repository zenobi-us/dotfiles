# Phase 2: Planning - Break down Epic into Stories

**Goal:** Create [Story] artifacts that break down the [Epic] into manageable user-facing features.

**Prerequisite:** Phase 1 (Initiation) must be complete with approved [Spec].

## Steps

1. Read the approved [Spec] for the [Epic]
2. Identify major features or requirements from the [Spec]
3. For each major feature, create a [Story] artifact using `references/templates/story_template.md`
4. For each [Story]:
   - Write user stories in BDD format: "As a {user}, I want {feature}, so that {benefit}"
   - Define clear acceptance criteria
   - Link to the [Epic] in frontmatter
   - Link to the [Spec] in frontmatter
   - Link to any [Research] or [Decision] artifacts that informed this story
5. Review stories to ensure:
   - All major features from [Spec] are covered
   - No duplicate coverage
   - Each story is independently valuable

## User Story Format (BDD)

Each [Story] MUST contain user stories in this format:

```
As a {type of user},
I want {specific feature or capability},
So that {business value or benefit}.
```

**Examples:**

- As a user, I want to log in with my credentials, so that I can access my account
- As an admin, I want to reset user passwords, so that users can regain access if locked out
- As a developer, I want API rate limiting, so that the service isn't overwhelmed by malicious requests

## Acceptance Criteria

Each [Story] must have clear acceptance criteria. Format:

```
Criterion 1: [Given/When/Then or specific condition]
- Expected Result: [What should happen]

Criterion 2: [Next testable behavior]
- Expected Result: [Verification method]
```

## Validation Checklist (CRITICAL - Complete before Phase 3)

**The following MUST be true before moving to Planning (Tasks):**

- [ ] All major features from [Spec] have corresponding [Story]
- [ ] Each [Story] is linked to its [Epic] in frontmatter
- [ ] Each [Story] is linked to its [Spec] in frontmatter
- [ ] Each [Story] contains user stories in BDD format (As a..., I want..., So that...)
- [ ] Each [Story] has clear, measurable acceptance criteria
- [ ] Each [Story] documents dependencies on other stories (if any)
- [ ] No [Story] is duplicating work of another story
- [ ] All stakeholders agree the [Story] set covers the [Spec]

**If any item is not checked, DO NOT proceed to Phase 3. Return to refinement.**

## Common Pitfalls to Avoid

- ❌ **Stories that are too big** → Becomes unmanageable during execution
- ❌ **Stories that are too small** → Creates overhead in tracking
- ❌ **Missing BDD format** → Unclear what "done" looks like
- ❌ **Vague acceptance criteria** → Team argues about what's done
- ❌ **Forgetting to link** → Stories become disconnected from Epic/Spec
- ❌ **Not involving users/product** → Build wrong feature

## Tips for Success

- ✅ Aim for stories that can be completed in 1-2 weeks (rough target)
- ✅ Each story should be independently valuable (can ship independently if needed)
- ✅ Use user feedback/research to shape stories
- ✅ Link to [Decision] artifacts that shaped the story
- ✅ Be specific in BDD format - "I want email notifications" vs "I want communication improvements"
- ✅ Have product owner review stories before proceeding

## Next Step

Once validation checklist is complete → **Phase 3: Planning (Tasks)**

See: `references/phase-03-planning-tasks.md`
