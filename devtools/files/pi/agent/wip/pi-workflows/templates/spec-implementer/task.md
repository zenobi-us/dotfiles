## Plan: {{ plan.name }}

### Intent
{{ plan.intent }}

### Tasks
{% for task in plan.tasks %}
{{ loop.index }}. {{ task }}
{% endfor %}

### Files to Change
{% for f in plan.files_to_change %}
- `{{ f }}`
{% endfor %}

### Acceptance Criteria
{% for criterion in plan.acceptance_criteria %}
- {{ criterion }}
{% endfor %}

{% if plan.context_needed %}
### Context to Read First
{% for ctx in plan.context_needed %}
- `{{ ctx }}`
{% endfor %}
{% endif %}

### Architecture Reference
{% for module in architecture.modules %}
- **{{ module.name }}** ({{ module.file }}): {{ module.responsibility }}
{% endfor %}

### Conventions
{% for rule in conventions.rules %}
- {{ rule.id }}: {{ rule.description }} ({{ rule.enforcement }})
{% endfor %}

## Instructions

Implement this plan. Follow these steps:

1. **Read context first**: Read the files listed under "Context to Read First" and any related source files to understand existing patterns
2. **Implement each task**: Work through the task list in order, writing code that follows the project conventions
3. **Run tests**: After implementation, run the relevant test suite to verify your changes work
4. **Validate acceptance criteria**: Confirm each acceptance criterion is met

Produce a JSON result conforming to the execution-results schema with:
- **status**: "complete", "partial", or "failed"
- **tasks**: array of task results with name, status, files_modified
- **decisions**: any design decisions made during implementation
- **issues**: any problems encountered (with severity)
- **test_count**: number of tests passing after your changes
- **commit_hash**: empty string (commits are handled externally)
