Synthesize the following analyses into a unified report.

## Structure Analysis
Architecture: {{ structure.architecture.organization }}
Patterns: {% for p in structure.architecture.patterns %}{{ p }}{% if not loop.last %}, {% endif %}{% endfor %}

### Modules
{% for m in structure.modules %}
- **{{ m.name }}**: {{ m.responsibility }} ({{ m.files | length }} files)
{% endfor %}

### Dependencies
{% for d in structure.dependencies %}
- `{{ d.from }}` → `{{ d.to }}` ({{ d.type }})
{% endfor %}

## Quality Analysis
{% for c in quality.concerns %}
- [{{ c.severity }}] {{ c.description }}{% if c.file %} in `{{ c.file }}`{% endif %}
{% endfor %}

### Test Coverage
- Tested: {% for t in quality.testCoverage.tested %}`{{ t }}`{% if not loop.last %}, {% endif %}{% endfor %}
- Untested: {% for t in quality.testCoverage.untested %}`{{ t }}`{% if not loop.last %}, {% endif %}{% endfor %}

### Maintainability: {{ quality.maintainability.score }}

## Pattern Analysis
{% for p in patterns.patterns %}
- **{{ p.name }}**: {{ p.usage }}{% if not p.correct %} ⚠️{% endif %}
{% endfor %}

### Recommendations
{% for r in patterns.recommendations %}
- [{{ r.priority }}] **{{ r.pattern }}**: {{ r.suggestion }}
{% endfor %}

Write your synthesis as JSON conforming to the output schema.
