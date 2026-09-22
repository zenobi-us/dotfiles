# Skill Anatomy

Use this reference when you need to define the structure of a skill.

## When to create a skill

Create a skill when the technique is not obvious, applies across projects, or is useful in repeated work.

Do not create a skill for a one-off solution, a standard practice that is already well documented, or a project-specific convention. Put project-specific conventions in `AGENTS.md` or `CLAUDE.md`.

## Frontmatter

Use only these YAML fields:

- `name`
- `description`

The `name` MUST use letters, numbers, and hyphens. It MUST match the skill directory name.

The `description` MUST state:

1. What the skill does.
2. When to use it.
3. What result it produces.

Write the description in third person. Use concrete triggers, symptoms, tools, and outcomes. Keep it below 500 characters where possible and below 1024 characters in total frontmatter.

## Main file

The skill root contains one `SKILL.md`.

Keep `SKILL.md` focused on:

- The skill identity.
- When to use it.
- The core workflow or pattern.
- Decisions that every invocation must make.
- Pointers to branch-specific references.
- Completion criteria.

A router skill should not contain the complete reference library.

## Supporting files

Use these directories:

```text
skill-name/
├── SKILL.md
├── references/
├── scripts/
├── examples/
└── assets/
```

Use `references/` for detailed guidance, tables, compatibility notes, and reusable examples.

Use `scripts/` for executable helpers and validators.

Use `examples/` for complete example documents that are useful during implementation.

Use `assets/` for diagrams, images, and other static files.

## Sections

A router skill usually needs these sections:

1. Overview.
2. When to use.
3. Core workflow or pattern.
4. Route by task.
5. Completion criteria.

Add a section only when it changes agent behaviour or improves retrieval.

## Examples

Prefer one complete example over many weak examples. Keep short examples inline. Put long or branch-specific examples in `examples/` or `references/`.

Use runnable examples when the skill teaches a technical procedure. Explain why the example matters.

## Naming

Use names that describe the concept or retrieval condition:

- `testing-methodology.md`
- `progressive-disclosure.md`
- `rationalization-patterns.md`

Do not use generic names such as `misc.md`, `notes.md`, or `extra.md`.
