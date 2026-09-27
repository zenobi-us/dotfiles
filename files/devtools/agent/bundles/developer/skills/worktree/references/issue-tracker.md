# Issue tracker resolution

This reference routes ticket work to the ticket skill. It does not define ticket schema, paths, selectors, or state operations.

Before a playbook reads or changes a ticket, load:

- `files/devtools/agent/bundles/matt-pocock/skills/reading-and-writing-tickets/SKILL.md`
- `$ALIGNMENT_ROOT/docs/agents/issue-tracker.md`, after resolving the active `ALIGNMENT_ROOT` and running the context report required by the playbook

Use the ticket skill for all ticket mechanics. It owns backend selection, selector resolution, ticket reads, claims, review artifact paths, comments, completion, external tracker operations, and tracker commits. Ask when the tracker definition is missing, malformed, ambiguous, or does not define the required operation.

The worktree playbook owns only workflow intent: when to resolve a ticket, when to claim or complete it, and how ticket state gates Worktrunk operations. Preserve the ticket skill's returned `ticket` and `tracker path` in workflow records, commit messages, and pull requests when the playbook requires them.
