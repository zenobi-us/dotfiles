---
name: reading-and-writing-tickets
description: Set up trackers; read, list, create, update, validate, and migrate initiatives (specs) and tickets; claim, review, complete, and map executable tickets. Owns versioned record schemas, publication, membership, and results.
user-invocable: true
---

# Reading and writing tickets

Own tracker setup, initiatives, and ticket operations. Use the `iso-24495-1` and `shared-context` skills. Keep setup configuration separate from record changes.

## Subcommand router

1. Select the requested operation and record kind. An initiative holds the complete specification and groups executable tickets. “Spec” and “initiative” name the same record. Publishing a spec creates or updates an initiative, not an executable ticket.
2. For `setup`, read its playbook directly. Tracker configuration need not exist yet. For all other subcommands, read [Usage and store routing](references/usage.md), then the task and store playbooks it selects.
3. Execute only the selected playbook. Before returning, follow [Result contract](references/result-contract.md).

| Subcommand | Read when | Playbook |
|---|---|---|
| `setup` | Plan, apply, or check tracker and engineering-skill configuration | [Setup](references/tasks/setup.md) |
| `read` | Read a ticket or initiative and its conversation | [Read](references/tasks/read.md) |
| `list` | List tickets or initiatives, or render a dependency graph | [List](references/tasks/list.md) |
| `create` | Create a ticket or publish an initiative/spec | [Create](references/tasks/create.md) |
| `update` | Change a ticket, initiative specification, membership, or comments | [Update](references/tasks/update.md) |
| `check` | Validate selected record schemas, membership, and dependencies without writing | [Check and migrate](references/tasks/migrate.md) |
| `migrate` | Plan, explicitly apply, or verify a content-schema migration | [Check and migrate](references/tasks/migrate.md) |
| `claim` | Claim implementation work | [Claim](references/tasks/claim.md) |
| `review` | Record a review and its artifact reference | [Review](references/tasks/review.md) |
| `complete` | Complete verified, merged, and published work | [Complete](references/tasks/complete.md) |

Use `create initiative <id>`, `read initiative <id>`, `update initiative <id>`, or `create ticket <id> --parent <initiative-id>` as skill request forms, not shell commands. For initiative operations and child membership changes, also read [Initiative publication](references/tasks/initiative.md). `claim`, `review`, and `complete` apply only to executable tickets; initiative completion has no defined operation.

Read [Tracker schemas](references/schema.md) before Local Markdown writes. New initiatives and tickets declare their v1 record schema. Supported unversioned records remain readable; mutation requires an approved migration. Unknown explicit versions block mutation. Content migration belongs here; `shared-context migrate` changes storage routes, not tracker meaning.

The user-facing `setup-matt-pocock-skills` skill gathers decisions and approval. This skill owns setup scripts, templates, file changes, checks, and publication results.

