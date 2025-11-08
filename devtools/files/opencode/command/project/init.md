# Initialize Project for Planning

Initialize a project with a [ProjectId] and prepare storage for artifact management.

**Task:** Initialize project: $ARGUMENTS

> [!CRITICAL]
> Before doing anything, run these skills:
> - skills_projectmanagement_storage_basicmemory
> - skills_projectmanagement_info_planning_artifacts

For all repo files, use the Read and Glob tools to analyze the current directory structure.

## Step 1: Determine Project Identity

**Identify the project:**

1. Use the Read tool to check for package.json, go.mod, requirements.txt, or other project manifest files
2. Identify the project name and type (web-app, api-service, cli-tool, etc.)
3. Determine the git repository name or current directory
4. Extract a [ProjectId] candidate in slugified format (kebab-case, lowercase alphanumeric + hyphens)

**Document the project context:**

Examples of [ProjectId] derivation:
- Repository: `github.com/username/user-auth-service` → `user-auth-service`
- Directory: `My Cool App v2` → `my-cool-app-v2`
- Project: `Authentication System` → `authentication-system`

Reference: See `skills_projectmanagement_info_planning_artifacts` for [ProjectId] naming conventions (format: `slugified-project-name`)

## Step 2: Validate or Create [ProjectId]

**Use the projectmanagement skills to establish project identity:**

**Delegate to subskill:** Use `skills_projectmanagement_storage_basicmemory` to:
1. Check if [ProjectId] already exists
2. If exists: Validate and confirm current [ProjectId]
3. If not exists: Create new [ProjectId] with confirmed name

The subskill will establish:
- ✓ Project storage and configuration
- ✓ Project metadata
- ✓ Ready state for artifact creation

## Step 3: Verify Project Configuration

**Confirm initialization success:**

The subskill should now have:
- [ProjectId] assigned and documented
- Storage configured
- Ready to accept [Planning Artifacts] ([Prd], [Epic], [Spec], [Story], [Task])

**Reference:** See `skills_projectmanagement_info_planning_artifacts` for artifact types and structure.

Print the initialized [ProjectId]:

```md
✅ Project Initialized
📋 Project ID: [ProjectId]
🎯 Ready for artifact creation
```

## Step 4: Provide Summary

**Create a comprehensive summary of what you accomplished:**

- **[ProjectId] Created**: The project identifier (e.g., `my-project`)
- **Project Type**: Detected technology stack and project classification
- **Configuration**: Project metadata and storage established
- **Next Steps**: Suggest `/project:plan:prd "feature idea"` to create first [Prd] artifact

**What Happens Next:**

The project is now initialized and ready for planning work. The next step is to create your first [Prd] artifact using:

```bash
/project:plan:prd "your product requirement"
```

This will establish high-level product direction that can be decomposed into Epics, Specs, Stories, and Tasks.

## Step 5: Understand Project Planning Workflow

**Context for planning work:**

The project you initialized is now ready to use the planning artifact system:

```
[Prd] (High-level strategic direction) ← START HERE
  ↓
[Epic] (Major work packages with 1:1 Spec)
  ↓
[Spec] (Detailed requirements)
  ↓
[Story] (User scenarios, use cases)
  ↓
[Task] (Specific implementation work)
```

**Available Commands:**
- `current.md` - Use `/project:current` to see active work status
- `plan.prd.md` - Use `/project:plan:prd "idea"` to create strategic PRDs
- `plan.feature.md` - Use `/project:plan:feature "capability"` to create Epics+Specs
- `plan.tasks.md` - Use `/project:plan:tasks "#id"` to break down Stories

**References:**
- `skills_projectmanagement_info_planning_artifacts` - Artifact types, naming, relationships
- `skills_projectmanagement_storage_basicmemory` - Storage backend implementation
- Project board - View progress across all artifacts

Your project [ProjectId] is now configured and ready for planning. Check project status with `/project:current` once you've created planning artifacts.

## Step 6: Initialize Complete

**Status:**

✅ [ProjectId] established
✅ Storage configured
✅ Ready for first artifact creation
✅ Planning system integrated

**Recommended next action:**

Create your first [Prd] artifact:

```bash
/project:plan:prd "your high-level product requirement"
```

This systematic approach ensures your project is properly initialized for the planning artifact hierarchy and ready for comprehensive planning work.
