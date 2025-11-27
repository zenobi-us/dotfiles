---
name: faq
description: Frequently asked questions and practical guidance for implementing Conventional Commits in your workflow.
---

# Conventional Commits FAQ

## General Questions

### What is the primary goal of Conventional Commits?

The primary goal is to provide a lightweight convention on top of commit messages that makes it easier to:
- Write automated tools that act on commits
- Generate changelogs automatically
- Determine semantic version bumps automatically
- Communicate the nature of changes clearly to all stakeholders
- Trigger build and publish processes based on commit types

### Why should I use Conventional Commits?

**Benefits:**
- **Automated Tooling**: Your commits become machine-readable for automated processing
- **Clear History**: Easy to scan and understand what changed when looking at git log
- **Semantic Versioning**: Automatic version bumping based on commit types
- **Changelog Generation**: Auto-generate release notes from commits
- **Team Communication**: Everyone understands the nature of changes at a glance
- **Project Organization**: Encourages atomic, well-thought-out commits

### Does using Conventional Commits add extra work?

Initially, yes - it requires thinking about commit structure. However, it saves time by:
- Enabling automation that would otherwise require manual work
- Reducing back-and-forth communication about what changed
- Making code reviews clearer
- Reducing time spent understanding change history

## Implementation Questions

### How should I deal with commit messages in the initial development phase?

We recommend that you proceed as if you've already released the product. Typically someone, even if it's your fellow software developers, is using your software. They'll want to know what's fixed, what breaks, etc. Starting with Conventional Commits from day one establishes good habits.

### Are the types in the commit title uppercase or lowercase?

Any casing may be used, but consistency is important. Lowercase is recommended:
```
✓ feat: add dark mode
✓ fix: resolve null pointer
✗ Feat: add dark mode
✗ Fix: resolve null pointer
```

### What do I do if the commit conforms to more than one of the commit types?

Go back and make multiple commits whenever possible. Part of the benefit of Conventional Commits is its ability to drive you to make more organized commits and PRs.

**Example - Avoid:**
```
feat: add payment processing and fix calculation bug
```

**Better - Make Two Commits:**
```
feat: add Stripe payment integration
fix: correct order total calculation
```

### How should I capitalize the description?

Start with lowercase (unless using parenthesis for scope):

```
✓ feat: add dark mode support
✓ feat(ui): add dark mode support
✗ feat: Add dark mode support
✗ feat(ui): Add dark mode support
```

### Should I use imperative or past tense?

Always use imperative mood (command form), not past tense:

```
✓ feat: add user authentication
✓ fix: resolve login issue
✓ refactor: simplify request handling

✗ feat: added user authentication
✗ fix: resolved login issue
✗ refactor: simplified request handling
```

This matches the convention used by git itself (e.g., "revert: revert commit X").

### Should I include a period at the end of the description?

No, omit the period:

```
✓ feat: add authentication support
✗ feat: add authentication support.
```

## Technical Questions

### How long should the description be?

Keep it concise - ideally 50 characters or less. This prevents truncation in various git tools and displays:

```
✓ feat: add OAuth2 authentication        (40 chars)
✗ feat: add OAuth2 authentication support to the application  (too long)
```

If you need more space, use the body.

### What's the difference between scope and body?

- **Scope**: Brief context about which part of the system is affected (wrapped in parenthesis)
  ```
  feat(auth): add OAuth2 support
  ```

- **Body**: Detailed explanation of why and how, separated by blank line
  ```
  feat(auth): add OAuth2 support
  
  Implement OAuth2 authentication flow to provide better security
  and support for federated identity providers. Users can now log in
  with Google, GitHub, or Microsoft accounts.
  ```

### When should I include a body?

Include a body when:
- The change is complex or non-obvious
- You need to explain the "why" behind the change
- There's important context for future developers
- The change has implications for other parts of the system

Skip the body for:
- Simple, obvious changes
- Small bug fixes with clear intent
- Documentation fixes
- Basic refactoring

### How do I indicate a breaking change?

Two ways:

**Option 1: Use `!` before the colon**
```
feat!: drop support for Node 6
feat(api)!: change authentication flow
```

**Option 2: Use footer**
```
feat: change authentication flow

BREAKING CHANGE: authentication now requires OAuth2 tokens
```

**Option 3: Both (redundant but clear)**
```
feat!: change authentication flow

BREAKING CHANGE: authentication now requires OAuth2 tokens
```

## Workflow Questions

### Doesn't this discourage rapid development and fast iteration?

No - it discourages moving fast in a disorganized way. It helps you:
- Move fast long-term across multiple projects
- Onboard new contributors more easily
- Maintain clearer history that doesn't need future investigation
- Enable automation that would otherwise require manual processes

Fast iteration is still possible - you're just being intentional about commits.

### Might Conventional Commits limit developers to thinking only in the types provided?

Conventional Commits encourages us to make more of certain types of commits (like fixes and features). The specification explicitly allows custom types, so:

```
mycompany: proprietary integration with our system
performance-testing: results from performance benchmarks
```

Your team can extend the specification based on your needs.

### Can I use Conventional Commits in a squash-merge workflow?

Yes! In fact, squash-merge workflows are ideal:
- Casual contributors make any commits they want
- Lead maintainers clean up commit history when merging
- The final merged commit follows Conventional Commits
- No burden on contributors to learn the convention

This is a common workflow for open source projects.

## Tooling Questions

### How does this relate to SemVer?

Conventional Commits enable automatic semantic versioning:

| Commit Type | SemVer Change |
|------------|---------------|
| `fix` | PATCH (1.0.0 → 1.0.1) |
| `feat` | MINOR (1.0.0 → 1.1.0) |
| `BREAKING CHANGE` | MAJOR (1.0.0 → 2.0.0) |

Tools like `semantic-release` automatically parse commits and bump versions.

### What tools support Conventional Commits?

Popular tools that support or require Conventional Commits:
- **commitlint**: Linter for commit messages
- **semantic-release**: Automatic versioning and publishing
- **standard-version**: Changelog generation and versioning
- **gitflow**: Git workflow tools
- **husky**: Git hooks for enforcing conventions
- **conventional-changelog**: Generate changelogs from commits

### Can I enforce Conventional Commits?

Yes, using tools like:

**commitlint** - Validate commit message format
```bash
npm install --save-dev @commitlint/config-conventional @commitlint/cli
```

**husky** - Run hooks on git events
```bash
npm install husky --save-dev
husky install
```

## Common Issues

### I accidentally used the wrong commit type. What do I do?

**Before Merging/Release:**
Use `git rebase -i` to edit the commit history:
```bash
git rebase -i HEAD~3  # Edit last 3 commits
```

**After Release:**
The cleanup will depend on your tools and processes. Ideally, you're using automation that can skip malformed commits or handle them gracefully.

### I used a type not in the spec (e.g., "feet" instead of "feat")

It's not the end of the world. The commit will simply be missed by tools that are based on the spec. Automated tools won't recognize it, but it doesn't break anything. Fix it in the next commit with a rebase if important.

### What if I can't follow Conventional Commits in my project?

You can still benefit from the concept:
- Use automated tools to reformat commits during merge
- Educate team members gradually about the benefits
- Start with a subset of commit types that your team agrees on
- Use commitlint to enforce the convention

## Contributor Questions

### Do all my contributors need to use Conventional Commits?

No! Many projects use approaches like:
- **Squash merging**: PRs can have any commits; the merge commit follows convention
- **Commit message templates**: Guide developers with templates
- **Automated reformatting**: Tools clean up commit history on merge
- **Gradual adoption**: Start with maintainers, encourage contributors over time

### How do I explain Conventional Commits to my team?

**Quick Explanation:**
"We use a standard format for commit messages so automated tools can understand what changed. It looks like: `type(scope): description`"

**Example:**
```
feat(payment): add Stripe integration
```

**Benefits:**
- Automatic changelog generation
- Automatic version bumping
- Clear history for everyone
- Tools can act on commits automatically

### What if someone forgets to use the convention?

Options:
1. **Gentle reminder**: Point them to your contribution guidelines
2. **Automated enforcement**: Use commitlint to catch it automatically
3. **Squash on merge**: Reformat during merge to main branch
4. **Education**: Share examples and guidelines
5. **Patience**: Most people adopt it quickly once they see the benefits

## Revert Questions

### How do I handle revert commits?

The Conventional Commits spec doesn't define revert behavior explicitly. Recommended approach:

```
revert: let us never again speak of the noodle incident

Refs: 676104e, a215868
```

Or include the original type:

```
fix: revert incorrect authentication changes from commit a215868

This reverts commit a215868. The previous approach caused issues with
federated identity providers.
```

### Should I revert or create a new fix commit?

**Revert if:**
- The commit caused significant problems
- It's a recent commit that didn't provide value
- You need to preserve that it was reverted

**Create new fix if:**
- The original code had the right idea but a bug
- You're fixing a side effect or unforeseen issue
- It's the cleaner approach historically

## Version Compatibility

### How do I version my extensions to the Conventional Commits Specification?

Use SemVer to version your extensions:
- Document what custom types your project adds
- Example: `@yourcompany/conventional-commits-config` version `1.0.0`
- Update versions when you add new types or change rules

---

**License**: [Creative Commons - CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)

Source: [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
