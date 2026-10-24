---
name: reading-and-writing-tickets
description: Set up tracker configuration or read, list, create, update, claim, review, complete, and map ticket dependencies. Routes each subcommand to its playbook and owns tracker usage and results.
user-invocable: true
---

# Reading and writing tickets

Own tracker setup and ticket operations. Use the `iso-24495-1` and `shared-context` skills. Keep setup configuration separate from ticket state changes.

## Subcommand router

1. Select the requested subcommand below. For natural-language requests, select the matching operation.
2. For `setup`, read its playbook directly. Tracker configuration need not exist yet. For all other subcommands, read [Usage and store routing](references/usage.md), then the task and store playbooks it selects.
3. Execute only the selected playbook. Before returning, follow [Result contract](references/result-contract.md).

| Subcommand | Read when | Playbook |
|---|---|---|
| `setup` | Plan, apply, or check tracker and engineering-skill configuration | [Setup](references/tasks/setup.md) |
| `read` | Read a ticket and its conversation | [Read](references/tasks/read.md) |
| `list` | List tickets or render a dependency graph | [List](references/tasks/list.md) |
| `create` | Create a ticket or map | [Create](references/tasks/create.md) |
| `update` | Change ticket metadata, comments, or blockers | [Update](references/tasks/update.md) |
| `claim` | Claim implementation work | [Claim](references/tasks/claim.md) |
| `review` | Record a review and its artifact reference | [Review](references/tasks/review.md) |
| `complete` | Complete verified, merged, and published work | [Complete](references/tasks/complete.md) |

The user-facing `setup-matt-pocock-skills` skill gathers decisions and approval. This skill owns setup scripts, templates, file changes, checks, and publication results.

