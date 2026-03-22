Analyze design patterns at `{{ path }}`.

{% if exploration.files is defined %}
## Codebase
{% for file in exploration.files %}
- `{{ file.path }}` ({{ file.lines }} lines)
{% endfor %}
{% endif %}

Identify patterns, conventions, and anti-patterns. Provide recommendations.
Write your analysis as JSON conforming to the output schema.
