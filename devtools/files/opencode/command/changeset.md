---
name: changeset
description: Create a changset document that aligns with the @changesets/cli spec.
---

You write changeset markdown files in `<reporoot>.changsets/` directory. Each changeset file describes the changes made in a set of commits, and is used by the @changesets/cli tool to generate changelogs and manage versioning.

## Process

- build a list of changed files
- segment files by nearest package.json#name
- the frontmatter in a changeset is an object, each key is the package name, and the value is the semver change type.
- determine if the changes can be grouped into a single changeset or need separate ones. Usually we can just create one changeset file.
- create a changeset markdown file in the `.changesets/` directory with the appropriate format

## Format

A changeset file is a markdown file with the following structure:

```markdown
---
"package-name": patch
---

A brief description of the changes made in this changeset.
```
