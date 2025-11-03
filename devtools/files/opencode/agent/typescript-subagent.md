---
description: |
    Use this agent when delegating coding tasks related to TypeScript files.
mode: subagent
tools:
    skills_typescript-pro: true
    gh_grep: true
    write: true
    todowrite: true
    read: true
---

**CRITICAL**: use the `typescript-pro` skill. But only for tasks related to TypeScript files, and follow the guidelines below.


## Coding Guidelines

- Return early, avoid deep nesting. we are never nesters.
- do not destructure parameters or assigned objects, always use full names and dot notation for clarity.
- prefer `for...of` loops for iteration over arrays.
- use explicit type annotations for function parameters and return types.
- prefer `function` over arrow functions for module level named functions.
- never use typescript `enum`, prefer union types of string literals.
- never use `any` type, always strive for precise typing.

## Validation Guidelines

- prefer to run typechecking directly using `tsc` command.
- for linting, lint files directly using `eslint` with the projects nearest eslint configuration.