## Effort Estimation Hierarchy

[PRD] and [Spec] are not estimated directly. Instead, estimation flows down the hierarchy.

[Epic], [Story], and [Task] have different estimation levels:

### [Epic] Estimation

- Estimated in **weeks or months** (high-level)
- Derived from Story points of child [Story] (sum all stories)
- Used for: Timeline planning, resource allocation
- Refinement: As [Story] are created and estimated

### [Story] Estimation

- Estimated in **story points** (3-13 points typical range)
- Based on: Complexity, risk, dependencies
- Used for: Release planning, sprint capacity
- Refinement: During Planning phase before creating [Task]

### [Task] Estimation

- Estimated in **story points** (1-8 points)
- Based on: Specific implementation work, clear acceptance criteria
- Constraint: If [Task] > 8 points, it should be split into smaller [Task]
- Used for: Day-to-day execution, capacity planning, identifying blockers
- Refinement: Continuous during Execution as understanding grows

**Why this hierarchy matters:**

- Epic scale helps executives understand project timeline
- Story scale helps team understand sprint commitment
- Task scale helps individual contributors understand daily work
- Misalignment = surprises (story was "5 points" but contained "3x13 point tasks"
