## Research Request

**Gap:** {{ gap.id }} — {{ gap.description }}

## Questions

{% for q in research_questions %}
{{ loop.index }}. {{ q }}
{% endfor %}

## Instructions

For each question:
1. Answer based on known software engineering patterns, best practices, and established solutions
2. Rate your confidence: `high` (well-known, widely used), `medium` (established but context-dependent), `low` (best guess)
3. List sources where possible — documentation, known projects, pattern names

Also identify applicable patterns and concrete recommendations.

## Required Output Schema

You MUST produce JSON conforming exactly to this schema. Every required field must be present.

```json
{{ output_schema }}
```
