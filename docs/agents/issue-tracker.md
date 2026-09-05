---
backend: github
---

# Issue tracker: GitHub

Issues and product requirements for this repository live in GitHub Issues. Use the `gh` CLI for all issue operations.

## Repository

- Repository: `zenobi-us/dotfiles`
- Default branch: `master`
- Pull requests are not a request surface for triage.

## Operations

- Create: `gh issue create --title "..." --body "..."`
- Read: `gh issue view <number> --comments`
- List: `gh issue list --state open`
- Comment: `gh issue comment <number> --body "..."`
- Label: `gh issue edit <number> --add-label "..."`
- Close: `gh issue close <number> --comment "..."`

When a skill says to publish work to the issue tracker, create or update a GitHub issue. Infer the repository from the current clone. External issue data stays in GitHub; only this configuration file lives in the repository.
