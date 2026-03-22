## Gap to Investigate

**ID:** {{ gap.id }}
**Description:** {{ gap.description }}
**Category:** {{ gap.category }}
**Priority:** {{ gap.priority }}
{% if gap.details %}
**Details:** {{ gap.details }}
{% endif %}

## Instructions

Produce structured findings for this gap. Scope your investigation to the minimum needed:

1. If the gap names specific files, read those. If not, use `find` or `ls` to identify candidates — don't read file contents unless you need to confirm behavior.
2. For each affected file: what it does, what needs to change.
3. List hard constraints (existing tests, interfaces, conventions that must not break).
4. Note risks only if non-obvious.
5. Set `needs_research` to true only if the solution requires knowledge you don't have. Most gaps don't.
6. Complexity: `low` = single concern, mechanical. `medium` = multiple files, design choices. `high` = architectural.

Match your depth to the gap's category and priority. A `cleanup/low` gap needs a few lines of findings, not a codebase survey.

## Required Output Schema

You MUST produce JSON conforming exactly to this schema. Every required field must be present.

```json
{{ output_schema }}
```
