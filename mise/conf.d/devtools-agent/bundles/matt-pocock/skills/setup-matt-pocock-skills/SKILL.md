---
name: setup-matt-pocock-skills
description: Guide the user through the Matt Pocock setup questionnaire, obtain plan approval, and delegate configuration and verification to reading-and-writing-tickets setup.
user-invocable: true
---

# Setup questionnaire

This is the user-invoked questionnaire, not the setup implementation. Use `iso-24495-1`, `shared-context`, and `mq-query` to inspect current choices and ask clear questions.

For a verification-only request, delegate `setup` phase `check` immediately. Skip the questionnaire and initialization.

## Gather decisions

1. Resolve the target repository and active route table. Keep existing stores. Read existing tracker and domain configuration through `mq-query`.
2. Read the ticket skill's [setup playbook](../reading-and-writing-tickets/references/tasks/setup.md) for the handoff contract. Use its [CLI reference](../reading-and-writing-tickets/references/setup/cli.md) for supported rendering backends and answer fields.
3. Ask only unresolved questions, in this order: tracker backend; triage labels; single or multiple domain contexts; instruction-file choice when neither file exists. Keep existing roots, layout, and labels. Use established defaults when no override exists. Disable triage output when the triage skill is not installed.
4. If the user requests storage changes, handle them explicitly through shared-context before setup. Do not imply a migration from a tracker selection.

## Delegate and obtain approval

Invoke `/skill:reading-and-writing-tickets` with subcommand `setup`, phase `plan`, the absolute target, and the collected answer mapping. The ticket skill writes the answers file and owns all CLI execution and configuration changes.

Present the returned route table, alignment root, and exact before/after plan. If the plan reports conflicts or missing decisions, resolve them with the user and delegate a new plan. Obtain approval for the exact successful plan.

Delegate phase `apply` to the same ticket subcommand with the approved plan and unchanged answers. If decisions or target state change, obtain a new plan and approval.

Present the ticket skill's verified result, changed files, and publication state. Do not claim completion until it reports successful initialization and verification. For a verification-only request, delegate phase `check` without initialization.

Do not run setup scripts, render templates, write setup configuration, or maintain a second setup contract here. The ticket skill's setup playbook owns those operations.


