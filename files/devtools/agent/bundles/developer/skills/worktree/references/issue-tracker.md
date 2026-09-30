# Issue tracker resolution

This reference routes ticket work to the ticket skill. It does not define ticket schema, paths, selectors, or state operations.

Before a playbook reads or changes a ticket, load:

- `files/devtools/agent/bundles/matt-pocock/skills/reading-and-writing-tickets/SKILL.md`
- `docs/agents/issue-tracker.md` from the root reported by the shared-context CLI, when that file exists

Resolve the context before constructing any path. From the repository being worked on,
run the CLI from the `agent-core:shared-context` skill that is loaded for this task:

```bash
cd "<repository being worked on>" && "<shared-context-skillroot>/scripts/shared-context/cli.ts"
```

Use its `root` and `storage` fields. Do not derive `ALIGNMENT_ROOT` from the repository,
origin slug, ticket key, or a guessed home-directory path. `storage: repository` is a
valid local-only mode: use the reported root and do not create or publish a shared
store. A shared root can also be local-only or private. Do not make a public link
unless the shared store and the destination have the same public access boundary; use
the shared-context skill's `SharedContext/<relative-path>` form when they do not.

Resolve the workflow root with the typed path command:

```bash
"<shared-context-skillroot>/scripts/shared-context/cli.ts" path workflow --id "<ticket-id>"
```

Use only the fixed internal paths in `references/receipts.md`. Stop if any
shared-context CLI command exits non-zero.

Use the ticket skill for all ticket mechanics. It owns backend selection,
selector resolution, ticket reads, claims, comments, completion, external
tracker operations, and tracker commits. It does not create review artifacts or
choose a review directory. Ask when the tracker definition is missing,
malformed, ambiguous, or does not define the required operation.

The worktree playbook owns only workflow intent: when to resolve a ticket, when to claim or complete it, and how ticket state gates Worktrunk operations. Preserve the ticket skill's returned `ticket` and `tracker path` in workflow records, commit messages, and pull requests when the playbook requires them.
