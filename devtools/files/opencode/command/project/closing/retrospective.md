# Project Retrospective and Closing

You are conducting a project retrospective and documenting lessons learned. Follow this systematic approach to create a comprehensive [Retrospective] artifact that captures valuable insights for future projects.

**Task:** Conduct retrospective for project: $ARGUMENTS
**Storage Backend**: basicmemory

> [!CRITICAL]
> Before doing anything, run these skills:
> - skills_projectmanagement_storage_basicmemory
> - skills_projectmanagement_info_planning_artifacts
>
> For all [Planning Artifacts], use the above storage backend.
> **NEVER** use GitHub Issues or direct file access for [Planning Artifacts].

## Step 1: Verify Project Readiness for Closing

**Confirm project completion criteria:**

1. **Deliverables**: Are all major deliverables complete or accepted?
2. **Open Issues**: Are there any blocking issues remaining?
3. **Unresolved Decisions**: What [Decision] artifacts have status "Unresolved"?
4. **Test Coverage**: Are tests passing and coverage acceptable?
5. **Documentation**: Is project documentation complete?

**If closing criteria not met:**

Document blocking items that prevent closure:
- List open/unresolved items
- Estimate effort to complete
- Recommend: Continue project execution or defer to phase 2

**If ready to close:**

Proceed to gather retrospective data and insights.

## Step 2: Gather Project Metrics and Data

**Collect quantitative project data:**

**Effort Metrics:**
1. Total project duration (start to completion)
2. Planned vs actual effort
3. Story point velocity (if applicable)
4. Scope changes during execution

**Quality Metrics:**
1. Test coverage percentage
2. Bug count and severity distribution
3. Technical debt items identified
4. Code review insights

**Delivery Metrics:**
1. On-time delivery rate for iterations
2. Scope creep percentage
3. Risk items that materialized
4. Blocked time and reasons

**Team Metrics:**
1. Team size and composition
2. Communication patterns
3. Skill gaps identified
4. Knowledge gaps discovered

## Step 3: Review All Project Artifacts

**Analyze the complete artifact history:**

1. **Fetch all [Epic] artifacts**: Review scope and completeness
2. **Fetch all [Spec] artifacts**: Assess requirement clarity
3. **Fetch all [Story] artifacts**: Review user-focused planning
4. **Fetch all [Task] artifacts**: Analyze implementation complexity
5. **Fetch all [Decision] artifacts**: Review decision quality
6. **Fetch all [Research] artifacts**: Assess research usefulness

**For each artifact type, ask:**
- Were requirements clear and complete?
- Were estimates accurate?
- Did artifacts guide implementation effectively?
- What gaps existed in planning?

## Step 4: Conduct Retrospective Analysis

**For complex projects, engage in extended thinking:**

Think deeply about this project's journey: '$ARGUMENTS'. Consider what went well, what could improve, surprises encountered, risks that materialized, successes to celebrate, and patterns that emerged. What will we do differently next time?

**Apply systematic retrospective framework:**

### What Went Well (Successes):
1. **Execution**: What implementation decisions were excellent?
2. **Planning**: What planning practices were most valuable?
3. **Team**: What team dynamics were positive?
4. **Process**: What process decisions worked well?
5. **Technology**: What technical choices proved valuable?

### What Could Be Better (Improvements):
1. **Execution**: What implementation challenges existed?
2. **Planning**: What planning gaps caused issues?
3. **Team**: What communication or collaboration issues arose?
4. **Process**: What process friction points existed?
5. **Technology**: What technical decisions caused pain?

### Surprising Discoveries:
1. **Unexpected challenges**: What was harder than expected?
2. **Unexpected successes**: What worked better than expected?
3. **New learnings**: What did we discover during execution?
4. **Market/user insights**: What surprised us about users or market?

### Key Decisions to Review:
1. **Unresolved Decisions**: Which [Decision] artifacts are still "Unresolved"?
2. **Reconsidered Decisions**: Which decisions needed reversal?
3. **Decision Quality**: Were decision artifacts useful?

## Step 5: Analyze Unresolved Decisions

**Review all [Decision] artifacts with status "Unresolved":**

For each unresolved decision:
1. **Can we resolve it now?**: Did the project provide enough information?
2. **Should we defer?**: Does this need to be decided before next phase?
3. **Impacts**: How did unresolved decision impact the project?
4. **Recommendation**: What should happen with this decision?

**Document resolution plan:**
- Decisions to resolve before phase 2
- Decisions to defer to later phases
- Decisions that require further research

## Step 6: Create [Retrospective] Artifact

**Delegate to subskill:**

Delegate the creation of the [Retrospective] artifact using the `task` tool:

> **Delegate to subskill:**
> You are creating a [Retrospective] artifact for project: '$ARGUMENTS'.
> Document comprehensive lessons learned and project insights.
>
> 1. Use `skills_projectmanagement_info_planning_artifacts` to understand [Retrospective] structure
> 2. Use the storage backend to create a [Retrospective] artifact
> 3. [Retrospective] is project-level (ID: 0) not epic-level
> 4. Populate with:
>    - Project overview and timeline
>    - Metrics and quantitative data
>    - What went well (successes)
>    - What could improve (improvements)
>    - Surprising discoveries
>    - Review of [Decision] artifacts
>    - Recommendations for future projects
>    - Team and process insights
>    - Technical learnings
> 5. Link all unresolved [Decision] artifacts
> 6. Use `session` tools to communicate the created [Retrospective] identifier
> 7. Return artifact identifier (e.g., `0.9.1-retrospective-project-closeout`)

## Step 7: Document Key Learnings

**Capture organizational knowledge:**

### Process Learnings:
1. What planning practices were most effective?
2. What execution practices could improve?
3. What team practices should we continue?
4. What should we change for next project?

### Technical Learnings:
1. What technology choices proved valuable?
2. What technology decisions caused issues?
3. What technical patterns should we adopt?
4. What should we avoid?

### Team Learnings:
1. What skills gaps were identified?
2. What training is needed?
3. What roles worked well?
4. What collaboration patterns were effective?

### User/Product Learnings:
1. What user needs were discovered?
2. What assumptions were wrong?
3. What features were most valuable?
4. What should inform next features?

## Step 8: Create Improvement Backlog

**Document recommendations for future work:**

**High Priority Improvements:**
1. Technical debt to address
2. Architectural improvements needed
3. Process changes for next phase
4. Skills/training to address

**Medium Priority Improvements:**
1. Enhancements discovered but deferred
2. Process optimizations
3. Tool or infrastructure improvements

**Future Feature Ideas:**
1. User requests not implemented
2. Technical opportunities discovered
3. Market opportunities identified

## Step 9: Validate Retrospective Quality

**Verify the retrospective artifact:**

1. **Completeness**: Are all major areas covered?
2. **Balance**: Are successes and improvements balanced?
3. **Data**: Are metrics and facts documented?
4. **Insights**: Do findings provide actionable insights?
5. **Decisions**: Are all unresolved decisions addressed?
6. **Recommendations**: Are next steps clear?

**Check for common issues:**

- Retrospective too focused on problems (ignore successes)
- Insufficient data to support conclusions
- Vague recommendations without specifics
- Unresolved decisions not addressed
- Team perspectives not represented

## Step 10: Present Retrospective Summary

**Create a comprehensive project closing summary:**

- **[Retrospective] Artifact Created**: Artifact identifier
- **Project Duration**: Timeline and phases
- **Key Metrics**: Effort, quality, delivery metrics
- **Major Successes**: What went well
- **Key Improvements**: What to change next time
- **Unresolved Decisions**: Items requiring follow-up
- **Technical Debt**: Items identified for next phase
- **Team Insights**: Lessons about team dynamics
- **Recommendations**: Top 3 changes for next project

## Step 11: Archive Project Artifacts

**Preserve project knowledge:**

1. **Export all artifacts**: Ensure complete history is saved
2. **Create index**: Document all major artifacts and locations
3. **Link retrospective**: Ensure [Retrospective] links to key decisions and artifacts
4. **Document process**: Capture how project was executed

## Step 12: Reference and Linking

**How [Retrospective] is organized:**

- **Project-level**: [Retrospective] is ID `0` (project-level, not epic)
- **Filename**: `0.9.1-retrospective-{project-name}-closeout`
- **Links to**: All [Decision] artifacts with status "Unresolved"

**Example links in [Retrospective]:**

```markdown
## Unresolved Decisions Requiring Follow-up

- [[1.3.1-decision-jwt-vs-session]] - Deferred to phase 2
- [[2.3.2-decision-microservices-architecture]] - Needs more data
```

## Step 13: Project Closing Workflow

**Completing the project lifecycle:**

```
[Prd] → [Epic] → [Spec] → [Story] → [Task] (Implementation)
                                        ↓
                                  [Retrospective] (Closing)
                                        ↓
                              Project Archived & Closed
```

**Post-Retrospective Actions:**

1. ✅ Archive all project artifacts
2. ✅ Create next project if continuing work
3. ✅ Schedule team retrospective meeting
4. ✅ Create action items for process improvements
5. ✅ Plan team celebration/recognition
6. ✅ Update team wiki with learnings

## Step 14: Implementation Success Criteria

**Verify project closing success:**

- ✅ [Retrospective] artifact created with comprehensive insights
- ✅ All major project artifacts reviewed
- ✅ Metrics and data documented
- ✅ Successes captured and celebrated
- ✅ Improvements identified with specific recommendations
- ✅ Unresolved [Decision] artifacts documented
- ✅ Technical debt identified for next phase
- ✅ Team learnings captured
- ✅ Recommendations for future projects documented
- ✅ Project archived and closed

This systematic approach ensures projects close with valuable learnings captured and knowledge preserved for future projects and team development.
