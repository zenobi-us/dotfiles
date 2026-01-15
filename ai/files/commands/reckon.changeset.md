---
name: reckon.changeset
description: Create a changeset document that aligns with the @changesets/cli spec.
subtask: true
---

Changeset files are written to `.changeset/` and processed by CICD to automatically bump version numbers and release affected apps.

```xml
<UserRequest>
$ARGUMENTS
</UserRequest>
```

## Process

### Step 1. Get Changed Files

!`git diff --name-only master...HEAD`

### Step 2. Determine Affected Packages

!`mise x node -- pnpm list -r --json --depth=0 | jq -r '.[] | "\(.name) \(.path)"'`

- use mise to ensure local version of node is used
- use pnpm to list packages in repo/monorepo
- use jq to format output as `package-name package-path`

### Step 3. Write Changeset File

- Write a brief description of the changes made in the above files.
- This will be the body content of the changeset file.
- Ensure the package names are correct. See Step 1.

Brief description of the changes made in this changeset.

**Validation Gate**

- Ensure the changeset file is valid according to @changesets/cli spec.
- Package names must exist in the monorepo.

## Guidelines

### Always Patch

We never create minor or major changesets directly. All changesets must be of type `patch`. 
Version bumps will be determined automatically based on the nature of the changes during the release process.

### Selecting Affected Packages

- **Critical** Ensure correct package-names are used `mise x node -- pnpm ls --filter "...[master]" --json | jq -r ".[] | .name"`!
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
