Analyze code quality at `{{ path }}`.

{% if exploration.files is defined %}
## Codebase
{% for file in exploration.files %}
- `{{ file.path }}` ({{ file.lines }} lines)
{% endfor %}
{% endif %}

Assess test coverage, error handling, code smells, and maintainability.
Write your analysis as JSON conforming to the output schema.
