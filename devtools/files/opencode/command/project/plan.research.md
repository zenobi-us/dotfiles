# Conduct Research for Planning Decision

You are creating a [Research] artifact to investigate questions that inform project planning and implementation decisions. Follow this systematic approach to document findings that reduce uncertainty.

**Task:** Research: $ARGUMENTS
**Storage Backend**: basicmemory

> [!CRITICAL]
> Before doing anything, run these skills:
> - skills_projectmanagement_storage_basicmemory
> - skills_projectmanagement_info_planning_artifacts
>
> All [Planning Artifacts] are managed through the skills listed above.
> Follow their guidance for creation, updates, and linking.
> Do not try to use alternative methods.

## Step 1: Clarify the Research Question

**Define what you're investigating:**

1. **Research Goal**: What specific question needs answering?
2. **Why It Matters**: How will findings influence project decisions?
3. **Scope**: What's in scope and what's out of scope?
4. **Success Criteria**: What information would answer your question?

**Categorize the research type:**

- **Technical Investigation**: Technology choices, architecture patterns, performance characteristics
- **Competitive Analysis**: Competitor features, market positioning, differentiation
- **User Research**: User needs, workflows, pain points
- **Design Research**: UI/UX patterns, accessibility standards, best practices
- **Integration Research**: API capabilities, third-party service evaluation
- **Architecture Research**: System design patterns, scalability approaches

## Step 2: Identify Related Artifacts (if applicable)

**Determine if this research is linked to existing planning:**

1. **Related [Spec]**: Does this research inform a specification?
2. **Related [Decision]**: Will this research lead to a decision?
3. **Related [Story]**: Is this research blocking story implementation?
4. **Related [Epic]**: Does this research support epic planning?

**Document the context:**
- If research is linked to a [Spec], [Story], or [Decision], note those references
- [Research] can be created ad-hoc when questions arise
- [Research] will be linked to the artifact that needed the investigation

## Step 3: Perform Extended Thinking (for Complex Research)

**For significant investigations, engage in deep thinking:**

Think deeply about this research question: '$ARGUMENTS'. Consider multiple perspectives, existing solutions, trade-offs, constraints, and how findings will impact the broader project. What factors must be analyzed? What are the unknowns and risks?

## Step 4: Conduct the Investigation

**Execute the research methodology:**

### For Technical Research:
1. Review existing documentation and standards
2. Examine open-source implementations
3. Test performance characteristics if relevant
4. Document trade-offs and constraints
5. Create recommendations based on findings

### For Competitive Analysis:
1. Analyze 3-5 competing solutions
2. Document feature comparison
3. Identify differentiation opportunities
4. Note market trends
5. Create strategic positioning recommendations

### For User Research:
1. Review existing user feedback or data
2. Identify user personas affected
3. Document pain points and needs
4. Note workarounds and current solutions
5. Create user-focused recommendations

### For Design Research:
1. Review current design patterns
2. Examine accessibility standards (WCAG, etc.)
3. Analyze usability best practices
4. Document constraints and opportunities
5. Create design recommendations

### For Integration Research:
1. Review API documentation
2. Test functionality if applicable
3. Identify limitations and edge cases
4. Document integration patterns
5. Create integration recommendations

## Step 5: Document Research Findings

**Create a [Research] artifact with findings:**

**Delegate to subskill:**

Delegate the creation of the [Research] artifact using the `task` tool:

> **Delegate to subskill:**
> You are creating a [Research] artifact: '$ARGUMENTS'.
> Document your investigation findings in structured format.
>
> 1. Use `skills_projectmanagement_info_planning_artifacts` to understand [Research] structure
> 2. Use the storage backend to create a [Research] artifact
> 3. Populate with:
>    - Research question and goal
>    - Methodology and sources
>    - Key findings and data
>    - Analysis and interpretation
>    - Recommendations
>    - Limitations and caveats
> 4. Link to related [Spec], [Decision], [Story], or [Epic] if applicable
> 5. Use `session` tools to communicate the created [Research] identifier
> 6. Return artifact identifier in Johnny Decimal format (e.g., `1.2.1-research-title`)

## Step 6: Validate Research Quality

**Verify the research artifact:**

1. **Question Clarity**: Is the research question clearly stated?
2. **Methodology**: Are sources and methods documented?
3. **Findings**: Are findings backed by evidence or analysis?
4. **Objectivity**: Are findings presented objectively without bias?
5. **Actionability**: Do recommendations lead to clear next steps?
6. **Completeness**: Are limitations and unknowns documented?

**Check for common issues:**

- Incomplete source documentation
- Unsupported claims without evidence
- Bias toward preferred solution
- Vague or unclear recommendations
- Missing consideration of constraints

## Step 7: Link Research to Decisions or Specs

**If this research influences a decision or implementation:**

1. **Create [Decision] Artifact**: If research leads to a decision, use `/project:plan:decision`
2. **Update Related [Spec]**: Reference this research in relevant specifications
3. **Document Influence**: Note how research shaped implementation approach

**Research Linking Rules:**

- [Research] can be linked from [Spec], [Decision], [Story], or [Task]
- Each artifact that uses [Research] should reference it: `influenced_by_research: {research-id}`
- [Research] documents the "why" behind decisions

## Step 8: Provide Research Summary

**Create a comprehensive summary:**

- **[Research] Artifact Created**: Artifact identifier and title
- **Research Question**: What was investigated
- **Key Findings**: Major insights and conclusions
- **Recommendations**: Suggested actions based on findings
- **Linked To**: Any related [Spec], [Decision], [Story], or [Epic] artifacts
- **Sources**: Where research was conducted (links, documentation, etc.)
- **Limitations**: Known constraints or unknowns

## Step 9: Usage in Project Context

**How [Research] is used:**

1. **Informs [Decision]**: Research provides evidence for making architectural or technology choices
2. **Validates [Spec]**: Research confirms requirements are technically feasible
3. **Guides [Story]**: Research provides context for user-focused implementation
4. **Reduces Risk**: Research identifies unknowns before implementation begins

**Example Usage:**

- Research on JWT vs Session authentication → influences [Decision] → influences [Spec] implementation → guides [Task] coding decisions

## Step 10: Reference and Linking

**How to reference this research in other artifacts:**

- **Research link**: `[[1.2.1-research-oauth-alternatives]]`
- **From [Spec]**: `links: - type: research, target: 1.2.1-research-oauth-alternatives`
- **From [Decision]**: `influenced_by_research: 1.2.1-research-oauth-alternatives`

## Step 11: Workflow Context

**Understanding when [Research] is created:**

```
Planning Phase:
- [Prd] identifies high-level needs
- [Research] investigates unknowns
- [Decision] chooses direction based on research
- [Spec] documents requirements

Execution Phase:
- [Story] describes user scenarios
- [Task] implements based on spec
- [Research] may inform implementation decisions
```

[Research] artifacts are created ad-hoc whenever questions arise that need investigation to reduce uncertainty and inform decisions.

This systematic approach ensures research is focused, documented, and directly linked to project decisions and implementation.
