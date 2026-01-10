---
name: storage-basicmemory
description: Use when storing project artifacts in basic memory storage.
---
**Core principle:** All project artifacts must be stored in basicmemory under a [ProjectId], with explicit linking and status tracking to maintain single source of truth across concurrent projects.
> [!NOTE]
> Before starting anything, ensure you have identified the correct [ProjectId] for the project you are working on.
## Requirements:
- use basicmemory mcp tools to read and write [Project Artifacts].
- Recognise types of [Project Artifacts]: [Spec], [Research], [Descision], [Epic], [Story], [Task], [Retrospective].
- Store [Project Artifacts] in basicmemory under the correct project context using [ProjectId].
## How to interact with [Project Artifacts] storage?
**CRITICAL** All [Project Artifacts] are interacted with via basicmemory mcp tools.
**FAILURE MODE** Interacting with [Project Artifacts] via the file system directly is not allowed and will lead to disorganization and loss of data.
- basicmemory_read_note - Read markdown notes
- basicmemory_read_content - Read file raw content by path
- basicmemory_view_note - View formatted notes
- basicmemory_write_note - Create/update markdown notes
- basicmemory_edit_note - Edit existing notes with operations
- basicmemory_move_note - Move notes to new locations
- basicmemory_delete_note - Delete notes by title
- basicmemory_canvas - Create Obsidian canvas files
- basicmemory_search_notes - Search across knowledge base
- basicmemory_search - Search for content across knowledge base
- basicmemory_fetch - Fetch full contents of search results
- basicmemory_recent_activity - Get recent activity
- basicmemory_build_context - Build context from memory URIs
- basicmemory_list_memory_projects - List all available projects
- basicmemory_create_memory_project - Create new projects
- basicmemory_delete_project - Delete projects
- basicmemory_list_directory - List directory contents
- basicmemory_sync_status - Check file sync status
### Planning Artifact Frontmatter
Frontmatter for planning artifacts is important. It must remain at the top of the markdown file as YAML, NOT as markdown code blocks.
#### Understanding Frontmatter
Templates contain YAML frontmatter blocks at the top, between `---` delimiters:
```yaml
---
epic_id: 1
title: Epic Title
status: planned
priority: high
estimated_effort: 2 weeks
linked_spec:
  - type: spec
    target: 2.1.1-spec-title
---
# Rest of markdown content here
```
This is **actual YAML frontmatter**, not a markdown code block. When you create artifacts, this structure must be preserved exactly.
#### Frontmatter Preservation Workflow
When creating or updating planning artifacts via `basicmemory_write_note`:
**Step 1: Parse Template File**
- Extract the frontmatter block (everything between first `---` and second `---`)
- Extract the markdown body (everything after the closing `---`)
- Keep them separate
**Step 2: Assemble Content for basicmemory**
The content passed to `basicmemory_write_note` must be:
```md
---
field1: value1
field2: value2
links:
  - type: epic
    target: 2.1.1-epic-title
---
# Markdown Heading
Markdown body content here...
```
**Critical requirements:**
- Content MUST start with `---`
- Frontmatter block MUST end with `---`
- Blank line MUST separate frontmatter from markdown body
- All frontmatter fields from template MUST be preserved
- No `## Frontmatter` markdown sections
**Step 3: Call basicmemory_write_note**
```md
basicmemory_write_note(
    title="artifact-title",
    folder="2-epics",  # or 1-prds, 3-research, etc.
    content=assembled_content,  # With frontmatter at top
    entity_type="epic",  # or spec, research, story, task, decision
    tags=extracted_tags,  # Optional, if tags are in frontmatter
    project=project_id
)
```
**Step 4: basicmemory Handles the Rest**
basicmemory automatically:
- Detects the YAML frontmatter (via `has_frontmatter()`)
- Parses all frontmatter fields
- Removes frontmatter from markdown body (via `remove_frontmatter()`)
- Preserves all fields in the final artifact as YAML frontmatter
- Converts back to proper markdown with YAML frontmatter
#### Field Mapping
Template frontmatter fields become YAML frontmatter in the artifact:
- `epic_id: 1` → stored in frontmatter as `epic_id`
- `status: planned` → stored as `status`
- `priority: high` → stored as `priority`
- `estimated_effort: 2 weeks` → stored as `estimated_effort`
- `linked_spec: [...]` → stored as YAML list in frontmatter
- `derived_from: [...]` → stored as YAML list in frontmatter
These are **structured metadata fields**, not markdown content.
#### Common Mistake: Markdown Code Blocks
❌ **WRONG** - Creates markdown code block, loses frontmatter:
```md
---
title: Artifact Title
type: epic
permalink: some-path
---
# Artifact Title
## Frontmatter
\`\`\`yaml
epic_idid: 1
status: planned
\`\`\`
Rest of content...
```
✅ **CORRECT** - Preserves frontmatter as YAML:
```md
---
title: Artifact Title
type: epic
permalink: some-path
epic_id: 1
status: planned
---
# Artifact Title
Rest of content...
```
#### Implementation Best Practices
1. **Always parse frontmatter carefully** - Extract the YAML block as-is from the template
2. **Preserve field order** - YAML field order matters for readability
3. **Validate YAML syntax** - Ensure frontmatter is valid YAML before passing to basicmemory
4. **Include all template fields** - Don't drop fields; merge with generated fields instead
5. **Use proper YAML lists** - Use `-` for list items in frontmatter, not JSON arrays
6. **Test round-trip** - After creation, verify the artifact has frontmatter, not markdown code blocks
### [ProjectId] Naming and Format
**ProjectId Convention:**
- Format: `slugified-project-name` (kebab-case, lowercase alphanumeric + hyphens)
- Source: Derived from git repository name or project name
- Generated by: `./scripts/get_project_id.sh` (automatically slugifies)
- Examples:
  - Repository: `github.com/username/dotfiles` → ProjectId: `dotfiles`
  - Project name: "User Authentication System" → ProjectId: `user-authentication-system`
  - Example name "My App v2" → ProjectId: `my-app-v2`
### Creating new Projects
If you need to create a new project in basicmemory, always ensure that 
- Follow the [ProjectId] naming convention.
- Confirm the project does not already exist by listing existing projects first.
- Store the project at ~/Notes/Projects/[ProjectId]
- Never store the project in the same folder as the repo you are working on.
