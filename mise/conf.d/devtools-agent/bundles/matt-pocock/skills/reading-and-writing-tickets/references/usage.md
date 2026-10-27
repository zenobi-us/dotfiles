# Ticket operation usage

Read this reference for record operations, including `check` and `migrate`. For setup, read `tasks/setup.md` instead; setup can run before tracker configuration exists.

## Resolve and validate

1. Use the `shared-context` skill from the repository. Retain its alignment root, route table, mode, and repository root.
2. Use `mq-query`, its matching task procedure, and its required upstream reference. Read `docs/agents/issue-tracker.md` under the resolved alignment root with explicit input and output formats.
3. Read the YAML `backend` field. Select its store playbook below. If configuration is missing, return the missing prerequisite and offer the `setup` subcommand.
4. Compare the configured backend with the shared-context ticket route. If they conflict, stop and report the mismatch.
5. For local Markdown, resolve ticket IDs and the exact ticket and initiative collections through shared-context. Keep the repository root for the graph CLI; collections can use different stores.
6. Follow the selected task and store playbooks. If the tracker definition lacks the requested operation, stop and report it.

Select initiative or ticket before resolution. “Publish this spec” selects an initiative. For initiative operations or child membership changes, read [Initiative publication](tasks/initiative.md). The Local Markdown store defines `index.md` as the complete specification. Hosted stores must declare their native initiative mapping; the shared-context initiatives route alone does not define a hosted issue operation.

For Local Markdown, follow [Tracker schemas](schema.md). Read-only operations may accept supported legacy records. New records must declare the current schema. Before updates, claims, review comments, completion, or membership writes, validate every affected record and require explicit migration for legacy records. Unknown explicit versions block writes. Never use a claim or comment operation to silently upgrade a record. [Check and migrate](tasks/migrate.md) owns the executable validation/migration procedure.

## Store router

| Configured backend | Store playbook |
|---|---|
| `local-markdown` | [Local Markdown](stores/local-markdown.md) |
| `github` | [GitHub Issues](stores/github-issues.md) |
| `jira` | [Jira](stores/jira.md) |

This table defines ticket-operation support. Setup rendering capabilities do not add store adapters. In particular, the setup CLI can render GitLab configuration, but this skill has no GitLab ticket-operation playbook. Existing Jira ticket operations remain supported; the setup CLI has no Jira template.

## Ticket invariants

Use the configured tracker as the source of truth. Ticket bodies hold intent and requirements. Comments hold conversation history. Store only direct blockers and derive reverse edges when querying.

Read and change ticket fields only through the selected store procedure. Preserve the store's claim, completion, verification, and publication rules. Do not substitute a guessed label, state, or assignee for an undefined operation.

Resolve this installed skill directory as `TICKET_SKILL_ROOT`. Script paths in its playbooks are relative to that directory, not the repository. Invoke scripts by absolute path from the target repository.

Read [Result contract](result-contract.md) before returning the operation result.

