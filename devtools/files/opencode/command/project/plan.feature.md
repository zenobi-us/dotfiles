# Create Technical Feature

You are creating a focused [Spec] artifact for a technical feature. Follow this systematic approach to create a well-scoped, implementable feature specification that integrates with the planning artifact hierarchy.

**Task:** Create a [Spec] artifact for: $ARGUMENTS
**Storage Backend**: basicmemory

> [!CRITICAL]
> Before doing anything, run these skills:
> - skills_projectmanagement_storage_basicmemory
> - skills_projectmanagement_info_planning_artifacts
>
> For all [Planning Artifacts], use the above storage backend.
> **NEVER** use GitHub Issues or direct file access for [Planning Artifacts].

## Step 1: Analyze Feature Scope

**Determine what type of feature this is:**

1. **UI/UX Enhancement**: User interface improvements, new interactions
2. **Technical Integration**: APIs, services, third-party integrations
3. **Infrastructure**: Performance, security, deployment improvements
4. **Developer Experience**: Tooling, debugging, development workflow

**Assess the complexity level:**

1. **Simple**: Single component or straightforward addition
2. **Moderate**: Multiple components with integration points
3. **Complex**: Cross-system changes or new architecture patterns

## Step 2: Adapt to Project Context

**Use analysis tools to understand the project:**

1. Use file analysis tools to detect project type and structure
2. Use the Read tool to check current technology stack
3. Use the Glob tool to identify existing patterns and architectural decisions
4. Determine appropriate feature focus areas for this project type

**Focus your feature based on project type:**

- **Web Apps**: User experience, responsive design, performance impact
- **APIs**: Endpoint design, data models, integration patterns
- **CLI Tools**: Command interface, user experience, cross-platform support
- **SaaS Platforms**: Multi-tenancy, scalability, service boundaries

## Step 3: Perform Extended Thinking (for Complex Features)

**If you assessed this as a complex feature, engage in deep thinking:**
Think deeply about this technical feature: '$ARGUMENTS'. Consider the system architecture, integration patterns, data flow, error handling, testing strategy, and how this fits into the overall system design. What are the key technical decisions and potential challenges?

## Step 4: Analyze Technical Requirements

**Assess system impact across all areas:**

1. **Frontend**: Identify needed components, state management changes, user interactions, routing updates
2. **Backend**: Determine required APIs, business logic changes, data processing, validation rules
3. **Database**: Check for schema changes, new queries, performance implications
4. **Infrastructure**: Consider configuration, deployment, monitoring requirements

**Analyze integration requirements:**

1. Identify external service dependencies
2. Map internal system communication needs
3. Define data flow and transformation requirements
4. Assess authentication and authorization impact

**Define non-functional requirements:**

1. Set performance expectations and constraints
2. Identify security considerations and requirements
3. Define scalability and reliability needs
4. Ensure accessibility and usability standards are met

## Step 5: Create the [Spec] Artifact

Delegate the creation of the [Spec] artifact using `task` tool with these instructions:

> **Delegate to subskill:**
> You are creating a [Spec] artifact for the technical feature: '$ARGUMENTS'.
> No analysis is needed here, just create the artifact based on the previously gathered information.
> 1. use `skills_projectmanagement_info_planning_artifacts` to understand the structure and fields required for a [Spec] artifact
> 2. use the storage backend to create a new [Spec] artifact.
> 3. use the `session` tools to communicate the unique identifier of the created [Spec] artifact.

## Step 6: Validate Feature Quality

**Check technical completeness:**

1. Verify clear scope and requirements are defined
2. Ensure implementation approach is validated and feasible
3. Confirm dependencies and risks are identified
4. Verify testing strategy is outlined

**Verify quality standards:**

1. Ensure acceptance criteria are specific and testable
2. Confirm security considerations are addressed
3. Verify performance requirements are defined
4. Check that error handling is planned

**Confirm implementation readiness:**

1. Verify there are no blocking dependencies
2. Ensure technical approach is feasible with current technology stack
3. Confirm resource requirements are realistic
4. Verify timeline is achievable

## Step 7: Provide Feature Summary

**Create a comprehensive summary of what you accomplished:**

- **[Spec] Artifact Created**: Artifact identifier in Johnny Decimal format (e.g., `1.1.1-spec-feature-title`)
- **Project Type and Focus**: Areas identified and feature scope
- **Key Technical Considerations**: Important architecture and integration decisions
- **Next Steps**: Suggested command to view artifact or create user stories (e.g., `/project:plan:stories`)
- **Reference**: How to reference this [Spec] artifact in basicmemory (e.g., `[[1.1.1-spec-feature-title]]`)

This systematic approach ensures your feature is well-scoped, technically sound, and ready for user story breakdown and implementation.
