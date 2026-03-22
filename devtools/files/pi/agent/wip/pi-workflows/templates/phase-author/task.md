## Intent

{{ intent }}

## Existing Phases

{% for phase in phases %}
- Phase {{ phase.number }}: {{ phase.name }} ({{ phase.status }})
{% endfor %}

## Current Architecture

{% for module in architecture.modules %}
- **{{ module.name }}** ({{ module.file }}, {{ module.lines }} lines): {{ module.responsibility }}
{% endfor %}

{% if architecture.compilation_pipeline %}
### Compilation Pipeline
{% for stage in architecture.compilation_pipeline %}
{{ loop.index }}. **{{ stage.stage }}**: {{ stage.description }}
{% endfor %}
{% endif %}

## Conventions

{% for rule in conventions.rules %}
- {{ rule.id }}: {{ rule.description }} ({{ rule.enforcement }})
{% endfor %}

## Current Gaps

{% for gap in gaps %}
{% if gap.status == "open" %}
- [{{ gap.priority }}] {{ gap.id }}: {{ gap.description }}
{% endif %}
{% endfor %}

## Current Inventory

- Step types: {{ inventory.step_types | length }}
- Agent specs: {{ inventory.agent_specs | length }}
- Schemas: {{ inventory.schemas | length }}
- Tests: {{ inventory.test_count }}

## Instructions

Convert the intent above into a structured phase spec. Read the codebase to understand what exists and what the intent requires.

1. **Determine the phase number** — next after the highest existing phase number
2. **Write a clear intent statement** — what this phase accomplishes and why
3. **Define success criteria** — each with a verify_method:
   - `command`: can be verified by running a shell command (test suite, grep, validate)
   - `inspect`: requires reading files and assessing content
   - `human`: requires human judgment
4. **Decompose into specs** — each spec is a focused unit of work:
   - Sequential numbering continuing from the last spec in the previous phase
   - Clear intent per spec
   - Concrete acceptance criteria (strings, each independently checkable)
   - Specs should be ordered by dependency — earlier specs don't depend on later ones
5. **Identify dependencies** — which phase numbers this phase depends on
6. **List artifacts produced** — file paths this phase will create or modify

### Sizing guidance

- Each spec should be completable by one agent in one context window
- If a spec needs more than ~5 files changed, split it
- If a spec has more than ~5 acceptance criteria, it might be doing too much
- Group related changes (e.g., schema + instance + validation test = one spec)

### Cross-reference gaps

Check if any existing open gaps are addressed by this phase. If so, note that in the spec intent — the gap can be marked resolved when the spec completes.

Produce a JSON object conforming to the phase schema.
