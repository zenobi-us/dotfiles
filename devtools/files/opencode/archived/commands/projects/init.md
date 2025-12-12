> [!CRITICAL]
> Before doing anything, run these skills:
> - skills_projectmanagement_storage_basicmemory
> - skills_projectmanagement_info_planning_artifacts


Initialize a project with a [ProjectId] and prepare storage for artifact management.

**Task:** Initialize project: $ARGUMENTS

**Use the projectmanagement skills to establish project identity:**

**Delegate to subskill:** Use `skills_projectmanagement_storage_basicmemory` to:

1. Check if [ProjectId] already exists
2. If exists: Validate and confirm current [ProjectId]
3. If not exists: Create new [ProjectId] with confirmed name
4. Activate the [ProjectId] for current session

The subskill will establish:
- ✓ Project storage and configuration
- ✓ Project metadata
- ✓ Ready state for artifact creation

