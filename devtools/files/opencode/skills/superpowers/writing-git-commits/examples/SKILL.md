---
name: examples
description: Real-world examples of Conventional Commits for different scenarios and commit types.
---

# Conventional Commits Examples

## Simple Examples

### New Feature (Simple)
```
feat: add dark mode toggle to settings
```

### Bug Fix (Simple)
```
fix: correct spelling of CHANGELOG
```

### Documentation Update
```
docs: update installation instructions in README
```

### Breaking Change (Simple)
```
feat!: drop support for Node 6
```

## Examples with Scope

### New Feature with Scope
```
feat(lang): add Polish language support
```

### Bug Fix with Scope
```
fix(parser): handle edge case with empty arrays
```

### API Change with Scope
```
feat(api): add new user authentication endpoint
```

### Style Changes with Scope
```
style(ui): fix button styling on mobile devices
```

## Examples with Body

### Feature with Detailed Body
```
feat: allow provided config object to extend other configs

This commit enables configuration objects to extend other config files,
improving code reusability and reducing duplication across projects.

The implementation uses a new `extends` key in the config file that can
reference other configuration files by path or package name.

Closes #42
```

### Bug Fix with Body and Context
```
fix: prevent racing of requests

Introduce a request id and a reference to latest request. Dismiss
incoming responses other than from latest request.

Remove timeouts which were used to mitigate the racing issue but are
obsolete now.

Reviewed-by: Z
Refs: #123
```

## Examples with Breaking Changes

### Breaking Change with `!` Notation
```
feat(api)!: send an email to the customer when a product is shipped
```

### Breaking Change with Footer
```
chore!: drop support for Node 6

BREAKING CHANGE: use JavaScript features not available in Node 6.
```

### Breaking Change with Both `!` and Footer
```
feat(auth)!: change authentication flow

This commit modifies the authentication flow to use OAuth2 instead of
session-based authentication. Existing API clients will need to update
their authentication mechanism.

BREAKING CHANGE: authentication now requires OAuth2 tokens instead of session cookies
```

## Examples with Multiple Footers

### Complex Commit with Multiple Footers
```
fix: prevent racing of requests

Introduce a request id and a reference to latest request. Dismiss
incoming responses other than from latest request.

Remove timeouts which were used to mitigate the racing issue but are
obsolete now.

Reviewed-by: Z
Refs: #123
Closes: #456
```

## Commit Type Examples

### Feature Examples
```
feat(ui): add theme customization panel
feat(api): implement user profile API endpoints
feat(docs): add API documentation with examples
feat(perf): optimize database query performance
```

### Fix Examples
```
fix(auth): resolve login page refresh issue
fix(parser): handle null values in array parsing
fix(ui): correct button alignment on mobile
fix(api): return correct status code for 404 errors
```

### Documentation Examples
```
docs: update CONTRIBUTING.md with new guidelines
docs(api): document new authentication endpoints
docs: add deployment instructions for Docker
```

### Refactor Examples
```
refactor(core): simplify request processing logic
refactor(utils): consolidate duplicate functions
refactor(db): reorganize database query builders
```

### Test Examples
```
test: add comprehensive coverage for auth module
test(parser): add test cases for edge cases
test: improve test isolation and reliability
```

### Chore Examples
```
chore: upgrade dependencies to latest versions
chore(build): update webpack configuration
chore: configure pre-commit hooks
```

### CI Examples
```
ci: add GitHub Actions workflow for tests
ci: configure automatic deployment to staging
ci(coverage): add code coverage reporting
```

### Style Examples
```
style: fix indentation in authentication module
style(utils): apply formatting rules to all files
style: remove trailing whitespace
```

### Performance Examples
```
perf: optimize image loading with lazy loading
perf(api): reduce database query time by 40%
perf: implement result caching for expensive operations
```

## Scenario-Based Examples

### Implementing a Complete Feature
```
feat(payment): add Stripe payment integration

Integrate Stripe payment processing into the checkout flow. This allows
customers to pay for orders using various payment methods supported by
Stripe.

Changes:
- Add Stripe API client initialization
- Implement payment form component
- Add payment processing endpoint
- Store payment tokens securely
- Add error handling for payment failures

Testing:
- Unit tests for payment processing logic
- Integration tests for checkout flow
- Manual testing with Stripe test account

Related Issues: closes #789, relates to #790
```

### Fixing a Critical Bug
```
fix(auth): prevent session hijacking vulnerability

The session token was not being properly validated on each request,
allowing attackers to reuse expired tokens. This commit adds proper
token validation and expiration checking.

Security Impact: High - potential for unauthorized access
Affected Versions: all versions before v2.1.0

Testing:
- Security audit passed
- All auth tests passing
- Manual testing with token expiration scenarios

Reviewed-by: security@company.com
Refs: #999
```

### Breaking Change with Migration Path
```
feat!: migrate to new configuration format

Configuration format has changed from XML to YAML for better readability
and easier maintenance. Old XML configurations will not be supported
after v3.0.0.

Migration Path:
1. Use provided migration tool: `migrate-config --xml-to-yaml config.xml`
2. Update application initialization code
3. Test thoroughly before deploying to production

For more details, see MIGRATION.md

BREAKING CHANGE: XML configuration format no longer supported, use YAML instead
Deprecated: old ConfigParser class, use new YAMLConfigParser
```

## Common Mistakes to Avoid

### ❌ Wrong - Vague Description
```
fix: bug
feat: improvements
```

### ✅ Correct - Specific Description
```
fix: resolve null pointer exception in user lookup
feat: add email notification for order status changes
```

### ❌ Wrong - Missing Type
```
allow users to toggle dark mode
```

### ✅ Correct - With Type
```
feat: allow users to toggle dark mode
```

### ❌ Wrong - Not Imperative Mood
```
feat: added dark mode support
fix: fixed the login issue
```

### ✅ Correct - Imperative Mood
```
feat: add dark mode support
fix: resolve login issue
```

### ❌ Wrong - Uppercase Description
```
feat: Add Dark Mode Support
fix: Resolve Login Issue
```

### ✅ Correct - Lowercase Description
```
feat: add dark mode support
fix: resolve login issue
```

## Tips for Writing Good Commits

1. **Be Specific**: Describe what changed, not what you did
2. **Use Imperative Mood**: "add" not "added"
3. **Keep Description Short**: 50 characters or less is ideal
4. **Use Body for Details**: Explain why and provide context
5. **Reference Issues**: Link to related issues in footers
6. **One Logical Change**: Keep commits focused and atomic
7. **Review Before Committing**: Check your diff before creating the commit

---

**License**: [Creative Commons - CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)

Source: [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
