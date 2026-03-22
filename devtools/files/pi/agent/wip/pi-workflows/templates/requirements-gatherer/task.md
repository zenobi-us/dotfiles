## Project Identity

**Name:** {{ project.name }}
**Description:** {{ project.description }}
**Core Value:** {{ project.core_value }}

### Target Users
{% for user in project.target_users %}
- {{ user }}
{% endfor %}

### Constraints
{% for constraint in project.constraints %}
- [{{ constraint.type }}] {{ constraint.description }}
{% endfor %}

### Scope Boundaries

**In scope:**
{% for item in project.scope_boundaries.in %}
- {{ item }}
{% endfor %}

**Out of scope:**
{% for item in project.scope_boundaries.out %}
- {{ item }}
{% endfor %}

### Goals
{% for goal in project.goals %}
- **{{ goal.id }}**: {{ goal.description }}
  {% for criterion in goal.success_criteria %}- {{ criterion }}
  {% endfor %}
{% endfor %}

{% if vision %}
## Original Vision

{{ vision }}
{% endif %}

## Instructions

Derive requirements from the project identity above. Produce a comprehensive but proportionate set of requirements covering what the system must do (functional), quality attributes it must exhibit (non-functional), hard limits it must respect (constraint), and external connections it must support (integration).

### For each requirement, provide:

1. **id** — unique, formatted as REQ-001, REQ-002, etc.
2. **description** — clear statement of what is required
3. **type** — one of: `functional`, `non-functional`, `constraint`, `integration`
4. **status** — set to `"proposed"` for all
5. **priority** — MoSCoW: `must`, `should`, `could`, `wont`
6. **acceptance_criteria** — array of specific, verifiable statements
7. **source** — set to `"agent"` for all
8. **depends_on** — array of other requirement IDs this depends on (empty array if none)

### Priority guidance

- **must**: the project fails without this — directly tied to core_value and essential goals
- **should**: important for target users but the project could ship a minimal version without it
- **could**: enhances the experience but is clearly secondary
- **wont**: explicitly excluded — derive these from scope_boundaries.out

### Coverage expectations

- Every goal should map to at least one "must" requirement
- Every constraint should appear as a "constraint" type requirement
- Include at least one non-functional requirement for each quality attribute the project implies (performance, security, usability, reliability, etc. — only those that are relevant)
- Include "wont" requirements for major items in scope_boundaries.out

### Output format

Produce a single JSON object with a `requirements` array:

```json
{
  "requirements": [
    {
      "id": "REQ-001",
      "description": "string",
      "type": "functional",
      "status": "proposed",
      "priority": "must",
      "acceptance_criteria": ["string"],
      "source": "agent",
      "depends_on": []
    }
  ]
}
```
