---
description: Create a changeset document that aligns with the @changesets/cli spec.
---

Changeset files are written to `.changesets/` and processed by CICD to automatically bump version numbers and release affected apps.

```xml
<UserRequest>
$ARGUMENTS
</UserRequest>
```

## Process


### Step 1. Get Changed Packages

!`pnpm ls --filter "...[master]" --json | jq -r ".[] | .name"`

### Step 2. Get Changed Files

!`git diff --name-only master...HEAD`

### Step 3. Write Changeset File

- Write a brief description of the changes made in the above files. 
- This will be the body content of the changeset file.
- Ensure the package names are correct. See Step 1.

Brief description of the changes made in this changeset.

## Guidelines

### Patch Vs Minor Vs Major

- **Patch**: Backwards-compatible bug fixes. Use for small changes that do not add new features or break existing functionality.
- **Minor**: Backwards-compatible new features. Use when adding new functionality in a backwards-compatible manner.
- **Major**: Incompatible API changes. Use when making changes that break existing

If in doubt, default to `patch`.

### Selecting Affected Packages

- **Critical** Ensure correct package-names are used `pnpm ls --filter "...[master]" --json | jq -r ".[] | .name"`!
- Include all packages that have been modified in the changeset.
- If a package's public API has changed, include it even if only internal files were modified

### Writing Good Descriptions

- Focus on WHY over WHAT. Explain the reason for the change rather than just listing what was changed.
- Be concise but informative. Summarize the change in a few sentences.
- Highlight any user-facing changes or important technical details.
- Use bullet points for clarity if there are multiple changes.
- DO NOT include testing steps,implementation details or code snippets.

## Templates

### Template: Patch Changeset

```markdown
---
"package-name": patch
---
Brief description of the bug fix.
```
