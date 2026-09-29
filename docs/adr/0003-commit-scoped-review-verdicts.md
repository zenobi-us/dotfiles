# Scope review verdicts to an exact source commit and tree

Accepted. A review verdict is valid only for the exact source commit and tree recorded in its handoff and receipt. Any later source change invalidates the verdict and requires a new review.

## Considered Options

- Review the moving source branch.
- Trust the latest branch state without a commit check.
- Scope the review to a frozen commit and tree.

We chose commit-scoped reviews because a successful review must remain tied to the code that the reviewer inspected.
