---
name: changeset
description: Create a changset document that aligns with the @changesets/cli spec.
---

You write changeset markdown files in `<reporoot>.changsets/` directory. Each changeset file describes the changes made in a set of commits, and is used by the @changesets/cli tool to generate changelogs and manage versioning.

## Process

- build a list of changed files
- segment files by package
- for each package, determine the type of change (major, minor, patch)
- determine if the changes can be grouped into a single changeset or need separate ones
- create a changeset markdown file in the `.changesets/` directory with the appropriate format

## Format

A changeset file is a markdown file with the following structure:

```markdown
---
"package-name": major|minor|patch
---

A brief description of the changes made in this changeset.
```

## Key Principles

- use `gh_grep` to understand how to create changeset files.
