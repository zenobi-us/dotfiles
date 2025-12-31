---
title: {{ title }}                          # immutable
type: retrospective                         # immutable
status: {{ extra.status | default("todo") }}
createdDate: {{ format-date now "%Y-%m-%d" }}
updatedDate: {{ format-date now "%Y-%m-%d" }}
---

<!--
[INSTRUCTIONS]

This is a template for documenting project retrospectives to capture learnings, identify improvements, and close out projects effectively.

1. Read each [INSTRUCTION], [EVENT: <event>] and [REPLACE: <instructions>] comment block carefully.
2. [EVENT: <event>] blocks indicate when to take action (e.g., on generation, update).
3. [REPLACE: <instructions>] blocks indicate where to add content.

[EVENT: On Generation]
- Replace each comment block annotated with [REPLACE: <instructions>], following instructions within.
- Leave comment blocks that are annotated with [INSTRUCTION] intact.
- Change status from `todo` to `in-progress` when retrospective session begins.
- Change status from `in-progress` to `complete` when retrospective is finalized.

[EVENT: On Update]
- Every edit to this file must also update the `updatedDate` field (using format "%Y-%m-%d").
- Review all links throughout the page and in the Links section.
- Ensure link targets still exist and remain relevant.
- Update link descriptions if related artifacts' status/scope changed.
- If follow-up decisions or tasks are created from this retrospective, add them to the Links section.
-->

## Preamble

<!--
[REPLACE: with an overview of the project and retrospective context]

- Provide a brief summary of the project, its scope, and timeline.
- Explain the objectives and outcomes achieved.
- Note the retrospective date and participation.
-->

## Project Summary

### Overview

<!--
[REPLACE: with project details]

- **Project Name:** Project title
- **Duration:** Start date to end date
- **Team Size:** Number of team members
- **Key Stakeholders:** List of stakeholders or roles
-->

### Delivered Outputs

<!--
[REPLACE: with list of deliverables and their metrics]

- Deliverable 1: Description and impact metrics
- Deliverable 2: Description and impact metrics
- Deliverable 3: Description and impact metrics
-->

## What Went Well

<!--
[REPLACE: with successes and positive outcomes from the project]

Structure with subsections (e.g., ### Success 1, ### Success 2) for clarity.
Each success should include:
- What specifically went well
- Why we think it was successful
- Contributing factors or team members
- How can we replicate this in future projects?
-->

### Success 1

<!--
[REPLACE: with details about this success]

- What specifically went well
- Why we think it was successful
- Contributing factors
- How to replicate in the future
-->

### Success 2

<!--
[REPLACE: with details about this success]

- Details of what worked
- Contributing factors
- Impact on project success
-->

## What Could Be Improved

<!--
[REPLACE: with challenges, inefficiencies, and areas for improvement]

Structure with subsections (e.g., ### Challenge 1, ### Challenge 2) for clarity.
Each challenge should include:
- What happened that could have been better
- Root cause (if identified)
- Impact on project timeline or quality
- Suggested improvement
-->

### Challenge 1

<!--
[REPLACE: with details about this challenge]

- What happened that could have been better
- Root cause (if identified)
- Impact on project outcome
- Suggested improvement
-->

### Challenge 2

<!--
[REPLACE: with details about this challenge]

- What went wrong or inefficiently
- Why it happened
- What we'd do differently next time
-->

## Lessons Learned

<!--
[REPLACE: with key insights and learning points from the project]

- **Lesson 1:** Key insight from the project
  - How we apply this in the future
  - Related to which challenge or success?

- **Lesson 2:** Another important learning
  - Application and impact

- **Lesson 3:** Continue as needed...
-->

## Metrics and Results

### Project Metrics

<!--
[REPLACE: with project performance data]

- Timeline: Planned vs. Actual
- Budget: Planned vs. Actual
- Scope: Completed vs. Originally Planned
- Quality: Bugs, defects, or incidents
-->

### Team Metrics

<!--
[REPLACE: with team performance data]

- Velocity: Story points or tasks completed
- Efficiency: Burndown or progress tracking
- Team satisfaction: Feedback or engagement level
-->

## Process Improvements and Recommendations

<!--
[REPLACE: with recommended changes for future initiatives]

Structure with subsections (e.g., ### Improvement 1, ### Improvement 2) for clarity.
Each improvement should include:
- Current process and how it was executed
- Recommended change and rationale
- Expected benefit or impact
- Implementation owner and timeline
-->

### Process Improvement 1

<!--
[REPLACE: with details about this improvement]

- Current process: How it was done
- Recommended change: Suggested improvement
- Expected benefit: Why this matters
- Implementation owner: Who will drive this
- Timeline: When to implement
-->

### Process Improvement 2

<!--
[REPLACE: with details about this improvement]

Continue with additional recommendations...
-->

## Unresolved Decisions Reviewed

<!--
[REPLACE: with unresolved decisions that were revisited during retrospective]

- Decision 1: What decision remained unresolved
  - Why it remained unresolved
  - New information or context gained
  - Final resolution or decision
  - Action items resulting from this decision

- Decision 2: Continue for other unresolved decisions...
-->

## Follow-up Actions

<!--
[REPLACE: with action items resulting from this retrospective]

Format as a table with clear ownership and deadlines:
- Action Item: What needs to be done
- Owner: Who is responsible
- Target Date: When it should be completed
- Notes: Additional context
-->

| Action Item | Owner | Target Date | Notes |
|---|---|---|---|
| Action 1 | Name | YYYY-MM-DD | Description |
| Action 2 | Name | YYYY-MM-DD | Description |
| Action 3 | Name | YYYY-MM-DD | Description |

## Appendix: Raw Feedback

<!--
[REPLACE: with raw notes and feedback from retrospective participants]

### Team Feedback

- Team member 1 feedback
- Team member 2 feedback
- Team member 3 feedback

### Stakeholder Feedback

- Stakeholder feedback
- Customer or user feedback if applicable
-->

## Links

<!--
[INSTRUCTION] Keep this section updated as the retrospective evolves.

Use relationship types to clarify how artifacts relate to this retrospective:

[EVENT: OnGenerate, OnUpdate]
- [related_to] Related epics, plans, or stories from this project
- [informed_by] Decisions that shaped the project
- [documents_closure] This retrospective closes out which epic/project
- [follow_up] New decisions or tasks created from retrospective findings

Example:
- [documents_closure] [1.0 User Authentication Epic](../1.0-user-auth-epic.md)
- [informed_by] [1.3.1 JWT vs Sessions Decision](../1.3.1-jwt-decision.md)
- [follow_up] [2.1 Improved CI/CD Pipeline](../2.1-ci-cd-improvement.md)
- [related_to] [1.4.1 Login Flow Story](../1.4.1-login-flow.md)
-->

---

## VALIDATION (CRITICAL - Project Closure)

**This section confirms project closure is complete.**

See: `references/phase-07-closing.md` for detailed Closing phase guidance.

**Closing Validation Checklist:**

- [ ] All assigned [Task] artifacts are marked as "Done"
- [ ] All [Story] artifacts are marked as "Done"
- [ ] Related [Epic] status has been updated to "Completed"
- [ ] [Retrospective] artifact has been created and completed
- [ ] All unresolved [Decision] artifacts are linked in Links section
- [ ] Lessons learned have been documented comprehensively
- [ ] Process improvements are specific and actionable (not vague)
- [ ] Follow-up action items have assigned owners and target dates
- [ ] [Retrospective] has been shared with team and stakeholders
- [ ] All project artifacts are organized and linked
- [ ] Project team has been thanked and celebrated

**If any item is not checked, project closure is NOT complete. Return to closing phase.**

**Project is now officially closed when all items are checked.**
