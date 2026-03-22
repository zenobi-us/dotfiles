## Phase: {{ phase.name }}

### Intent
{{ phase.intent }}

### Success Criteria
{% for criterion in phase.success_criteria %}
- {{ criterion.criterion }} (verify: {{ criterion.verify_method }})
{% endfor %}

### Specs
{% if phase.specs %}
{% for spec in phase.specs %}
- **{{ spec.id }}**: {{ spec.name }}
{% endfor %}
{% endif %}

### Current Architecture
{% for module in architecture.modules %}
- **{{ module.name }}** ({{ module.file }}): {{ module.responsibility }}
{% endfor %}

### Conventions
{% for rule in conventions.rules %}
- {{ rule.id }}: {{ rule.description }} ({{ rule.enforcement }})
{% endfor %}

## Instructions

Decompose this phase into implementation plans. Each plan should be a focused unit of work that one agent can complete in a single context window.

Before creating plans:
1. Read source files referenced in the architecture to understand existing patterns
2. Identify logical boundaries — which specs or features are independent
3. Determine which plans can run in parallel (independent file sets)

For each plan, produce:
- **name**: short identifier for the plan
- **intent**: what this plan accomplishes and why
- **tasks**: concrete list of things to do (create files, add tests, wire up)
- **files_to_change**: paths that will be created or modified
- **acceptance_criteria**: how to know the plan is done
- **context_needed**: files or modules the implementing agent should read first
- **parallel_group**: group name — plans in the same group can run concurrently (independent file sets get the same group; dependent plans get different groups)

Output a JSON object with a `plans` array conforming to the plan-breakdown schema.
