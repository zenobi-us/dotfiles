---
name: writing-git-commits
description: Expert guide to writing semantic commit messages following the Conventional Commits specification. Master clear, machine-readable commits that communicate intent and drive automation.
---

# Writing Great Git Commits

You are mastering the art of semantic commit messages that communicate intent to both humans and machines. Follow the Conventional Commits specification to create commits that enable automated tooling, clear history, and effective collaboration.

## What is Conventional Commits?

**Conventional Commits** is a lightweight specification for adding human and machine-readable meaning to commit messages. It provides a simple set of rules for creating an explicit commit history that:

- Enables automated tools to parse and act on commits
- Makes it easier to understand code history at a glance
- Aligns with Semantic Versioning (SemVer) for automated release management
- Drives more organized development practices

## Child Skills

- **Summary**: Quick overview of the specification and core concepts
  - → See `./summary/SKILL.md`
    - or if needed `skill_use(superpowers_writing_git_commits_summary)`

- **Examples**: Real-world commit message examples for different scenarios
  - → See `./examples/SKILL.md`
    - or if needed `skill_use(superpowers_writing_git_commits_examples)`
  
- **Specification**: Complete technical specification with all rules and requirements
  - → See `./specification/SKILL.md`
    - or if needed `skill_use(superpowers_writing_git_commits_specification)`
  
- **FAQ**: Frequently asked questions and practical guidance
  - → See `./faq/SKILL.md`
    - or if needed `skill_use(superpowers_writing_git_commits_faq)`

## Basic Structure

Every commit message should follow this format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Core Commit Types

- **feat**: Introduces a new feature (maps to `MINOR` in SemVer)
- **fix**: Patches a bug (maps to `PATCH` in SemVer)
- **BREAKING CHANGE**: Major breaking change (maps to `MAJOR` in SemVer)
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring without feature changes
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build, dependencies, or tooling changes
- **ci**: CI/CD configuration changes

## When to Use This Skill

Use the Conventional Commits specification when:
- Creating semantic commit messages for version-controlled code
- Working in teams that need clear commit history
- Building automated tools that parse commit messages
- Integrating with semantic versioning practices
- Generating automated CHANGELOGs
- Communicating the nature of changes to stakeholders

## How to Apply It

1. **Read the Summary** for quick understanding of the core concept
2. **Review Examples** to see how different scenarios map to commit types
3. **Check the Specification** for detailed rules and technical requirements
4. **Consult the FAQ** for answers to common questions and best practices

## Key Principles

✅ **Be Clear**: Commit messages should clearly communicate what changed and why
✅ **Be Consistent**: Use the same convention across all commits
✅ **Be Structured**: Follow the type/scope/description format
✅ **Be Atomic**: One logical change per commit when possible
✅ **Be Machine-Readable**: Enable automated tooling and analysis

## Integration with Your Workflow

This skill is referenced by `/project:do:commit` to guide the creation of semantic commits that maintain a clear, organized commit history and enable automated tooling for release management and changelog generation.

---

**License**: [Creative Commons - CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)

Source: [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
