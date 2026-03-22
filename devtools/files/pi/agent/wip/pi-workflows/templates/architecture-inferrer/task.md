Infer the architecture of the project at `{{ path }}`.

## Codebase Analysis

{% if analysis.files is defined %}
### Files
{% for file in analysis.files %}
- `{{ file.path }}` ({{ file.language | default("unknown") }}, {{ file.lines | default("?") }} lines){% if file.exports %} — {{ file.exports | length }} exports{% endif %}
{% endfor %}
{% endif %}

{% if analysis.types is defined %}
### Types
{% for t in analysis.types %}
- `{{ t.name }}` ({{ t.kind }}) in `{{ t.file }}`
{% endfor %}
{% endif %}

{% if analysis.dependencies is defined %}
### Dependencies
{% for d in analysis.dependencies %}
- `{{ d.from }}` → `{{ d.to }}` ({{ d.type | default("import") }})
{% endfor %}
{% endif %}

{% if analysis.entryPoints is defined %}
### Entry Points
{% for ep in analysis.entryPoints %}
- `{{ ep }}`
{% endfor %}
{% endif %}

## Instructions

From the analysis above and targeted code reads, produce an architecture block:

1. **Modules** — each cohesive unit with a clear responsibility. For each:
   - `name`: concise identifier (e.g., "block-api", "expression-engine")
   - `file`: primary file path relative to project root
   - `responsibility`: one-sentence description of what this module does
   - `dependencies`: array of other module names this module depends on
   - `lines`: approximate line count

2. **Patterns** — design patterns evidenced in the code. For each:
   - `name`: pattern name (e.g., "registry", "factory", "middleware")
   - `description`: how this pattern is applied in this codebase
   - `used_in`: array of module names that use this pattern

3. **Boundaries** — architectural seams where modules interact through defined interfaces (e.g., "block-api validates all writes before persistence", "dispatch spawns subprocesses through a single entry point")

4. **Overview** — one paragraph summarizing the architecture: what the system does, how it's organized, and what the key design decisions are

Read entry points, config files, and module interfaces to confirm the analysis. Do not read every file.

## Required Output Schema

You MUST produce JSON conforming exactly to this schema. Every required field must be present.

```json
{{ output_schema }}
```
