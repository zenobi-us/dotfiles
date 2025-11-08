---
name: specification
description: Complete technical specification for Conventional Commits with all formal rules and requirements.
---

# Conventional Commits Specification v1.0.0

## Specification

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

### Rule 1: Type Prefix
Commits **MUST** be prefixed with a type, which consists of a noun, `feat`, `fix`, etc., followed by the OPTIONAL scope, OPTIONAL `!`, and REQUIRED terminal colon and space.

### Rule 2: Feature Type
The type `feat` **MUST** be used when a commit adds a new feature to your application or library.

### Rule 3: Fix Type
The type `fix` **MUST** be used when a commit represents a bug fix for your application.

### Rule 4: Scope
A scope **MAY** be provided after a type. A scope **MUST** consist of a noun describing a section of the codebase surrounded by parenthesis, e.g., `fix(parser):`

### Rule 5: Description
A description **MUST** immediately follow the colon and space after the type/scope prefix. The description is a short summary of the code changes, e.g., *fix: array parsing issue when multiple spaces were contained in string*.

**Requirements for Description:**
- Typically 50 characters or less
- Starts with lowercase letter (unless scope uses parenthesis)
- Written in imperative mood: "add" not "added" or "adds"
- No period at the end

### Rule 6: Body
A longer commit body **MAY** be provided after the short description, providing additional contextual information about the code changes. The body **MUST** begin one blank line after the description.

### Rule 7: Body Format
A commit body is free-form and **MAY** consist of any number of newline-separated paragraphs.

### Rule 8: Footers
One or more footers **MAY** be provided one blank line after the body. Each footer **MUST** consist of a word token, followed by either a `:<space>` or `<space>#` separator, followed by a string value (this is inspired by the [git trailer convention](https://git-scm.com/docs/git-interpret-trailers)).

### Rule 9: Footer Token
A footer's token **MUST** use `-` in place of whitespace characters, e.g., `Acked-by` (this helps differentiate the footer section from a multi-paragraph body). An exception is made for `BREAKING CHANGE`, which **MAY** also be used as a token.

### Rule 10: Footer Value
A footer's value **MAY** contain spaces and newlines, and parsing **MUST** terminate when the next valid footer token/separator pair is observed.

### Rule 11: Breaking Changes Indication
Breaking changes **MUST** be indicated in the type/scope prefix of a commit, or as an entry in the footer.

### Rule 12: Breaking Change Footer
If included as a footer, a breaking change **MUST** consist of the uppercase text `BREAKING CHANGE`, followed by a colon, space, and description, e.g., *BREAKING CHANGE: environment variables now take precedence over config files*.

### Rule 13: Breaking Change Prefix
If included in the type/scope prefix, breaking changes **MUST** be indicated by a `!` immediately before the `:`. If `!` is used, `BREAKING CHANGE:` **MAY** be omitted from the footer section, and the commit description **SHALL** be used to describe the breaking change.

### Rule 14: Custom Types
Types other than `feat` and `fix` **MAY** be used in your commit messages, e.g., *docs: update ref docs.*

Recommended additional types:
- `build`: Changes to build system or external dependencies
- `chore`: Changes to build process, dependencies, or tooling
- `ci`: Changes to CI/CD configuration
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, semicolons, etc.)
- `refactor`: Code refactoring without feature or bug fix changes
- `perf`: Code change that improves performance
- `test`: Adding missing tests or correcting existing tests

### Rule 15: Case Sensitivity
The units of information that make up Conventional Commits **MUST NOT** be treated as case sensitive by implementors, with the exception of `BREAKING CHANGE` which **MUST** be uppercase.

### Rule 16: Breaking Change Synonym
`BREAKING-CHANGE` **MUST** be synonymous with `BREAKING CHANGE`, when used as a token in a footer.

## Formal Grammar

```
<commit> ::= <header>
             <BLANK LINE>?
             <body>?
             <BLANK LINE>?
             <footer>*

<header> ::= <type> "[" <scope> "]" <breaking>? ":" <space> <description>
          | <type> <breaking>? ":" <space> <description>

<type> ::= "feat"
        | "fix"
        | "chore"
        | "docs"
        | "style"
        | "refactor"
        | "perf"
        | "test"
        | "ci"
        | "build"
        | <string>

<scope> ::= <string>

<breaking> ::= "!"

<description> ::= <string>

<body> ::= <string>

<footer> ::= <token> (":" <space> | <space> "#") <value>

<token> ::= <string-with-hyphens>

<value> ::= <string-with-optional-newlines>

<string> ::= <non-empty character sequence>

<space> ::= " "

<BLANK LINE> ::= "\n"
```

## Intent of Conventional Commits

The intent of the Conventional Commits specification is to provide a lightweight convention on top of commit messages. This convention:

1. Allows easy to parse commit history
2. Enables automatic changelog generation
3. Allows automatic semantic versioning determination
4. Communicates the nature of changes to teammates, the public, and other stakeholders
5. Allows tooling to trigger build and publish processes
6. Makes it easier for people to contribute to your projects by allowing them to explore a more structured commit history

## Semantic Versioning Relationship

| Conventional Commit | Semantic Version Impact |
|-------------------|------------------------|
| `fix` type | `PATCH` release |
| `feat` type | `MINOR` release |
| `BREAKING CHANGE` (any type) | `MAJOR` release |
| Other types (`docs`, `style`, etc.) | Development only, no version bump |

## Relationship to SemVer

The Conventional Commits specification builds on top of [Semantic Versioning](https://semver.org/) (SemVer). SemVer uses three-part version numbers: `MAJOR.MINOR.PATCH`, where:
- **MAJOR** indicates incompatible API changes (breaking changes)
- **MINOR** indicates new functionality in a backwards compatible manner
- **PATCH** indicates backwards compatible bug fixes

Conventional Commits provide a structured way to communicate which type of change is being made, enabling automated tools to determine the appropriate SemVer version bump.

## Extensibility

While the Conventional Commits specification defines the core types (`feat` and `fix`), projects may define additional types suited to their needs. The specification allows flexibility to extend beyond the core types while maintaining machine-readability.

---

**License**: [Creative Commons - CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)

Source: [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
