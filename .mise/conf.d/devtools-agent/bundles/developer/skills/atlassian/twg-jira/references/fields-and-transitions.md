---
description: Discover required and custom Jira fields, build valid values, and perform workflow transitions safely.
---

# Jira Fields And Transitions

## Custom And Required Fields

Jira field configuration varies by project, work type, screen, and operation.
Discover metadata before create or update:

```bash
twg help jira custom fields
twg jira workitem field create-metadata ...
twg jira workitem field update-metadata ...
```

Use returned `customfield_*` IDs in `--field` or `--fields-json`. Display names
are for readability and may be duplicated or localized.

Rules:

- Do not provide the same field key through both `--field` and
  `--fields-json`.
- `--field` values parse as JSON when valid. Quote a JSON string when a value
  that resembles a number, boolean, or object must remain a string.
- Respect the metadata's required, allowed-values, schema, and operation
  constraints.
- Report a missing field or unsupported operation as a configuration gap.

## Transitions

A status name is not necessarily a valid transition from the current state.

1. Read the current workitem status.
2. Discover available transitions for that workitem.
3. Match the user's requested outcome to an advertised transition.
4. Include any transition-screen fields required by metadata.
5. Execute and read back the resulting status.

Do not use a direct status-field update when Jira requires a workflow
transition. Do not guess transition IDs from another project or work type.
