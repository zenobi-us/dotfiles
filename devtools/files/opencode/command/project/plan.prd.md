# Create Product Requirements Document (PRD)
## Execution Instructions

**EXECUTE THIS TASK BY:**

1. Read all content between `<message_to_subagent>` and `</message_to_subagent>` tags
2. Copy that content exactly
3. Call the Task tool with these parameters:
   - `description`: "Analyze project status and active work"
   - `subagent_type`: "general"
   - `prompt`: [paste the content from step 1]
4. Return the formatted output from the subagent exactly as received to the user

**IMPORTANT:** This command does NOT execute directly—it delegates to a subagent. You must call the Task tool.

---

<message_to_subagent>
You are creating a comprehensive [Prd] artifact for a high-level product feature. Follow this systematic approach to create a thorough, well-researched [Prd] artifact.

**Task:** Create a comprehensive [Prd] for: $ARGUMENTS
**Storage Backend**: basicmemory

> [!CRITICAL]
> Before doing anything, run these skills:
> - skills_projectmanagement_storage_basicmemory
> - skills_projectmanagement_info_planning_artifacts
>
> All [Planning Artifacts] are managed through the skills listed above.
> Follow their guidance for creation, updates, and linking.
> Do not try to use alternative methods.

## Step 1: Identify Project and Prerequisites

**Verify project context:**

1. Confirm you have a valid [ProjectId] for this project
2. If no [ProjectId] exists, create one using `/project:init`
3. Document the identified [ProjectId]:

```md
📋 Project ID: [ProjectId]
```

**Reference:** See `skills_projectmanagement_info_planning_artifacts` for ProjectId conventions (format: `slugified-project-name`)

Then continue to Step 2 for deep analysis.

## Step 2: Perform Deep Analysis

**For complex product features, engage in extended thinking:**
Think deeply about this product requirement: '$ARGUMENTS'. Consider market positioning, competitive analysis, user research implications, technical architecture decisions, business model impacts, and long-term strategic implications. Think about scalability, security, and integration with existing systems.

## Step 3: Analyze Current Project Context

**Use file analysis tools to understand the project:**

1. Use the Read tool to check for package.json (indicates web-app), requirements.txt (api-service), go.mod (cli-tool), etc.
2. Identify the technology stack: React, FastAPI, Express, Django, Next.js, etc.
3. Use the Glob tool to review existing architecture patterns and system design
4. Determine the project's current scale and complexity level

## Step 4: Conduct Market Research

**Perform targeted research based on your identified project type:**

**If this is a Web Application:**

1. Research current user experience patterns and design trends
2. Analyze the frontend technology ecosystem for relevant solutions
3. Look up performance and accessibility benchmarks for similar features
4. Consider mobile-first design requirements and constraints

**If this is an API Service:**

1. Research API design patterns and standards (REST, GraphQL, etc.)
2. Study service architecture and integration patterns
3. Find performance and scalability benchmarks for similar services
4. Review developer experience and documentation standards

**If this is a CLI Tool:**

1. Research command-line UX patterns and conventions
2. Investigate cross-platform compatibility requirements
3. Study installation and distribution strategies
4. Analyze developer workflow integration patterns

## Step 5: Compose PRD Content

**Plan the [Prd] composition (don't create yet - just plan):**

1. **Executive Summary**
   - Brief 2-3 sentence overview of the product requirement
   - Clear statement of strategic value

2. **Problem Statement**
   - Detailed description of the problem this [Prd] addresses
   - Context and impact on stakeholders

3. **User Stories**
   - Primary user story: "As a {user type}, I want to {capability} so that {benefit}"
   - Additional user stories covering secondary use cases

4. **Market Research Findings**
   - Research insights based on project type
   - Competitive landscape analysis
   - Technology ecosystem recommendations

5. **Functional Requirements**
   - Core capabilities needed
   - Feature descriptions
   - User-facing functionality

6. **Non-Functional Requirements**
   - **Performance:** Performance criteria and benchmarks
   - **Security:** Security and compliance requirements
   - **Scalability:** Scalability and capacity requirements
   - **Usability:** Accessibility and usability standards

7. **Success Metrics**
   - Primary metrics with measurable targets
   - Secondary metrics for tracking progress

8. **Technical Considerations**
   - High-level technical architecture
   - Integration points with existing systems
   - Technology stack alignment

9. **Implementation Approach**
   - Phased breakdown and milestones
   - MVP definition and scope
   - Enhanced features and optimizations
   - Advanced features and integrations

10. **Risk Assessment**
    - Technical risks and mitigation strategies
    - Business risks and mitigation strategies

11. **Dependencies**
    - Internal dependencies and prerequisites
    - External dependencies and constraints

**Reference:** See `info-planning-artifacts` templates for detailed [Prd] artifact structure and frontmatter requirements.

## Step 6: Create [Prd] Artifact

Delegate the creation of the [Prd] artifact using the `task` tool with these instructions:

> **Delegate to subskill:**
> You are creating a [Prd] artifact: '$ARGUMENTS'.
> No analysis needed, just create the artifact based on the analysis from Steps 1-4.
> 1. Use `skills_projectmanagement_info_planning_artifacts` to understand [Prd] structure
> 2. Use the storage backend to create a new [Prd] artifact
> 3. Link to parent [Prd] if applicable
> 4. Use `session` tools to communicate the created [Prd] identifier
> 5. Return the artifact identifier in Johnny Decimal format (e.g., `1.1.1-prd-title`)

The storage backend will handle:
- Artifact file creation and naming: `1.{sequence}.1-prd-{title}.md` (e.g., `1.1.1-prd-dayz-modding.md`)
- Placement in `1-prds/` folder at project root
- ProjectId association
- Directory structure and organization
- Obsidian wiki-style link targets


## Step 6: Validate [Prd] Quality

**Review your created [Prd] artifact against these quality standards:**

**Strategic Alignment Check:**

1. Verify clear business value and strategic rationale is documented
2. Ensure market opportunity is quantified and validated with research
3. Confirm competitive positioning is clearly defined
4. Validate that success metrics are established and measurable

**User Focus Check:**

1. Confirm user personas and needs are clearly defined
2. Verify user stories are comprehensive and validated
3. Ensure user experience requirements are detailed
4. Check that accessibility and usability are considered

**Technical Feasibility Check:**

1. Validate architecture approach is appropriate for your project type
2. Ensure integration requirements are identified
3. Confirm performance and scalability requirements are defined
4. Verify security and compliance requirements are addressed

**Implementation Planning Check:**

1. Ensure phased approach with clear milestones is documented
2. Verify resource requirements are estimated realistically
3. Confirm dependencies and risks are identified
4. Check that timeline and budget considerations are included

## Step 7: Provide Summary

**Create a comprehensive summary of what you accomplished:**

- **[Prd] Artifact Created**: Artifact location and reference (e.g., `1.1.1-prd-user-auth-requirements`)
- **Project ID**: Confirmed [ProjectId] used for artifact organization
- **Project Type**: Type identified and research findings adapted accordingly
- **Key Research Findings**: Strategic insights and competitive positioning analysis
- **Artifact Links**: Obsidian wiki-style links for cross-referencing
- **Next Steps**: Suggest `/project:plan:feature "[Epic Name]"` to create Epic+Spec from this [Prd]

**Quality Assurance:**
- ✅ [Prd] follows defined artifact structure
- ✅ All sections completed with substantive content
- ✅ Research findings validated and sourced
- ✅ Success metrics are measurable
- ✅ Risk assessment is comprehensive

**What Happens Next:**

The [Prd] artifact you created establishes high-level product direction. The next workflow step is to break this into one or more [Epic] artifacts, each with an accompanying [Spec] artifact (not created here). 

Use the suggested command to create the first Epic, which will decompose this [Prd] into manageable work units. Later the user can use `/project:plan:stories "[Epic Name]"` to be further broken down into [Story] and, `/project:plan:tasks #StoryID` to create implementation tasks.

This systematic approach ensures your [Prd] is comprehensive, well-researched, and actionable for creating Epics, Specs, and eventual implementation tasks.

## Step 8: Understand Planning Artifact Workflow

**Context for future work:**

The [Prd] you created is the start of a hierarchical planning system:

```
[Prd] (High-level strategic direction)
  ↓
[Epic] (Major work packages with 1:1 Spec)
  ↓
[Spec] (Detailed requirements)
  ↓
[Story] (User scenarios, use cases)
  ↓
[Task] (Specific implementation work)
```

**References:**
- `current.md` - Use `/project:current` to see active work status
- `skills_projectmanagement_info_planning_artifacts` - Artifact types, naming conventions, relationships
- Project board - View progress across all artifacts

Your [Prd] is now stored in basicmemory and ready for Epic creation. Check project status with `/project:current` to see where this [Prd] fits in overall planning.
</message_to_subagent>