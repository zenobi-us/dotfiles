Analyze the code at `{{ path }}`.

{% if exploration.files is defined %}
## Prior Exploration
{% for file in exploration.files %}
- `{{ file.path }}` ({{ file.lines }} lines){% if file.exports %}: {{ file.exports | length }} exports{% endif %}
{% endfor %}
{% endif %}

{% if exploration.types is defined %}
## Known Types
{% for t in exploration.types %}
- `{{ t.name }}` ({{ t.kind }}) in `{{ t.file }}`
{% endfor %}
{% endif %}

Write your analysis as JSON conforming to the output schema.
