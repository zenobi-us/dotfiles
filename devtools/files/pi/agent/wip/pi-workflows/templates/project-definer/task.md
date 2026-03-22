## Vision Statement

{{ vision }}

{% if context %}
## Additional Context

{{ context }}
{% endif %}

## Instructions

Produce a structured project identity from the vision statement above. Extract, infer, or derive each field — do not leave gaps where the vision provides signal.

### Fields to produce

1. **name** — short, lowercase-hyphenated project identifier
2. **description** — 1-3 sentences capturing what the project does and why it matters
3. **core_value** — one sentence a stakeholder outside the project could understand
4. **target_users** — array of user roles or personas who benefit
5. **constraints** — array of `{ type, description }` objects reflecting real limitations from the vision
   - type examples: "technical", "organizational", "timeline", "budget", "regulatory", "compatibility"
6. **scope_boundaries** — `{ in: [...], out: [...] }` capturing what is and is not in scope
   - `out` is especially important: document what a reader might assume is in scope but is not
7. **goals** — array of `{ id, description, success_criteria: [...] }` objects
   - IDs: G-001, G-002, etc.
   - success_criteria: measurable or verifiable statements (not aspirational)
8. **status** — set to `"inception"`

{% if stack %}
### Stack

The following technology stack has been specified:

{% for item in stack %}
- {{ item }}
{% endfor %}

Include these in the output `stack` array.
{% endif %}

{% if repository %}
### Repository

Repository: {{ repository }}

Include this in the output `repository` field.
{% endif %}

### Output format

Produce a single JSON object. Every required field must be present. The object should conform to the project block schema:

```json
{
  "name": "string (required)",
  "description": "string (required)",
  "core_value": "string (required)",
  "target_users": ["string"],
  "constraints": [{ "type": "string", "description": "string" }],
  "scope_boundaries": { "in": ["string"], "out": ["string"] },
  "goals": [{ "id": "G-001", "description": "string", "success_criteria": ["string"] }],
  "status": "inception",
  "repository": "string (if provided)",
  "stack": ["string (if provided)"]
}
```
