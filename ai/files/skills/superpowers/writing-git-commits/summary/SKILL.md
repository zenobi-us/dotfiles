---
name: summary
description: Quick summary of Conventional Commits specification and core concepts for semantic commit messages.
---

# Conventional Commits Summary

## The Specification

**Conventional Commits** is a lightweight convention on top of commit messages that provides an easy set of rules for creating an explicit commit history. It makes it easier to write automated tools on top of commits and aligns with Semantic Versioning.

## Commit Message Structure

Every conventional commit follows this format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Components Explained

**Type** (REQUIRED)
- A noun that describes the kind of change: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`
- Communicates the intent of the change
- Maps to semantic versioning bumps

**Scope** (OPTIONAL)
- Noun describing a section of the codebase
- Wrapped in parenthesis: `feat(parser):`
- Provides additional context about what part of the system changed

**Description** (REQUIRED)
- Short summary of the code changes
- Starts with lowercase (when not using parenthesis scope)
- Concise and clear, typically 50 characters or less
- Written in imperative mood: "add" not "added" or "adds"

**Body** (OPTIONAL)
- Longer explanation of the commit
- Separated from description by blank line
- Can contain multiple paragraphs
- Provides contextual information about what and why

**Footer** (OPTIONAL)
- Additional metadata or references
- Preceded by blank line
- Format: `<token>: <value>`
- Special footer: `BREAKING CHANGE:` for major version changes

## Core Commit Types

### Primary Types (Semantic Versioning)

**feat** - New Feature
- Introduces a new feature to your codebase
- Maps to `MINOR` version bump in SemVer
- Example: `feat(auth): add OAuth 2.0 support`

**fix** - Bug Fix
- Patches a bug in your codebase
- Maps to `PATCH` version bump in SemVer
- Example: `fix(parser): handle edge case with empty arrays`

**BREAKING CHANGE** - Breaking Change
- Introduces a breaking API change
- Maps to `MAJOR` version bump in SemVer
- Indicated by `!` before colon or in footer
- Example: `feat!: drop support for Node 6`

### Supporting Types

- **docs**: Documentation changes only
- **style**: Code style changes (formatting, semicolons, etc.) - doesn't affect code logic
- **refactor**: Code refactoring without feature or bug fix
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, tooling
- **ci**: CI/CD configuration changes
- **build**: Changes to build system or external dependencies

## Why Use Conventional Commits?

✅ **Automated Tooling**: Tools can automatically parse and act on commits
✅ **Clear History**: Commit history is human-readable and searchable
✅ **Semantic Versioning**: Automatic version bumping based on commit types
✅ **Changelog Generation**: Auto-generate changelogs from commits
✅ **Team Communication**: Clear understanding of what changed and why
✅ **Project Organization**: Encourages atomic, well-organized commits

## Quick Examples

```
feat: allow provided config object to extend other configs
```

```
fix(parser): prevent racing of requests
```

```
feat(api)!: send an email to the customer when a product is shipped
```

```
docs: correct spelling of CHANGELOG
```

```
refactor(core): simplify request processing logic
```

## Key Principles

✅ **Type First**: Always specify the commit type
✅ **Scope Optional**: Add scope when helpful for clarity
✅ **Description Imperative**: Use "add", "fix", "refactor" not "added", "fixed", "refactored"
✅ **Description Lowercase**: Start description with lowercase (unless following scope with parenthesis)
✅ **One Logical Change**: Keep commits atomic and focused
✅ **Breaking Changes Clear**: Always mark breaking changes explicitly

## Integration with SemVer

| Commit Type | SemVer Impact | Example |
|------------|---------------|---------|
| `feat` | MINOR bump | `v1.0.0` → `v1.1.0` |
| `fix` | PATCH bump | `v1.1.0` → `v1.1.1` |
| `BREAKING CHANGE` | MAJOR bump | `v1.1.1` → `v2.0.0` |
| `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci` | No SemVer impact | Development only |

---

**License**: [Creative Commons - CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)

Source: [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
