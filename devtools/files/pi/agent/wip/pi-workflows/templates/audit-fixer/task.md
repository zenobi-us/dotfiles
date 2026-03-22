## Audit Findings to Fix

### Principle: {{ task.principle }}
### Category: {{ task.category }}
### Severity: {{ task.severity }}

### Findings

{% for finding in task.findings %}
#### {{ finding.id }}: {{ finding.description }}

{% for loc in finding.locations %}
- `{{ loc.file }}` lines {{ loc.lines | join(', ') }}
{% endfor %}

{% if finding.fix %}
**Fix**: {{ finding.fix.suggestion }}
{% if finding.fix.verify_method == "grep" %}
**Verify**: pattern `{{ finding.fix.verify_pattern }}` should NOT match after fix
{% endif %}
{% endif %}

{% endfor %}

### Files to Modify

{% for file in task.files %}
- `{{ file }}`
{% endfor %}

### Acceptance Criteria

{% for criterion in task.acceptance_criteria %}
- {{ criterion }}
{% endfor %}

{% if conformance_reference %}
### Conformance Reference

{% for principle in conformance_reference.principles %}
{% if principle.id == task.principle.split(':')[0] %}
#### {{ principle.name }}

{{ principle.description }}

{% for rule in principle.rules %}
- **{{ rule.id }}**: {{ rule.rule }}
{% if rule.examples %}
  - Correct: `{{ rule.examples[0] }}`
{% endif %}
{% if rule.anti_patterns %}
  - Wrong: `{{ rule.anti_patterns[0] }}`
{% endif %}
{% endfor %}
{% endif %}
{% endfor %}
{% endif %}

## Instructions

1. Read the files listed above to understand the current code
2. Fix each finding according to the fix suggestion
3. Ensure fixes follow the conformance reference principles
4. Run the test suite: `node --experimental-strip-types --test src/*.test.ts`
5. Fix any test failures caused by your changes

Produce a JSON result conforming to the execution-results schema.
